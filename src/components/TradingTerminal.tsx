import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { OrderSide, OrderType } from '../types/market';
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Target,
  ShieldAlert,
  Percent,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const TradingTerminal: React.FC = () => {
  const {
    selectedStock,
    cashBalance,
    positions,
    executeTrade,
    updatePositionBracket,
    quickTradePrefill,
    setQuickTradePrefill,
    openPaymentModal,
  } = useTrading();

  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [sharesInput, setSharesInput] = useState<string>('10');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');
  const [stopPriceInput, setStopPriceInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bracket Order (Take-Profit & Stop-Loss / OCO) state
  const [isBracketEnabled, setIsBracketEnabled] = useState<boolean>(true);
  const [tpPriceInput, setTpPriceInput] = useState<string>('');
  const [slPriceInput, setSlPriceInput] = useState<string>('');

  // Position bracket editing drawer
  const [isEditingPositionBracket, setIsEditingPositionBracket] = useState<boolean>(false);
  const [posTpInput, setPosTpInput] = useState<string>('');
  const [posSlInput, setPosSlInput] = useState<string>('');

  const position = positions[selectedStock.symbol];
  const sharesOwned = position ? position.shares : 0;

  // Sync quickTradePrefill if present
  useEffect(() => {
    if (quickTradePrefill) {
      if (quickTradePrefill.side) setSide(quickTradePrefill.side);
      if (quickTradePrefill.price) {
        setOrderType('limit');
        setLimitPriceInput(quickTradePrefill.price.toFixed(2));
      }
      if (quickTradePrefill.shares) {
        setSharesInput(quickTradePrefill.shares.toString());
      }
      if (quickTradePrefill.isBracket !== undefined) {
        setIsBracketEnabled(quickTradePrefill.isBracket);
      }
      if (quickTradePrefill.takeProfitPrice) {
        setTpPriceInput(quickTradePrefill.takeProfitPrice.toFixed(2));
      }
      if (quickTradePrefill.stopLossPrice) {
        setSlPriceInput(quickTradePrefill.stopLossPrice.toFixed(2));
      }
      setQuickTradePrefill(null);
    }
  }, [quickTradePrefill, setQuickTradePrefill]);

  // Keep limit price & default bracket prices updated with stock price initially
  useEffect(() => {
    if (!limitPriceInput) {
      setLimitPriceInput(selectedStock.price.toFixed(2));
    }
    if (!stopPriceInput) {
      setStopPriceInput((selectedStock.price * 0.95).toFixed(2));
    }
    // Initialize default TP at +10% and SL at -5%
    setTpPriceInput((selectedStock.price * 1.10).toFixed(2));
    setSlPriceInput((selectedStock.price * 0.95).toFixed(2));

    if (position) {
      setPosTpInput(position.takeProfitPrice ? position.takeProfitPrice.toFixed(2) : (selectedStock.price * 1.10).toFixed(2));
      setPosSlInput(position.stopLossPrice ? position.stopLossPrice.toFixed(2) : (selectedStock.price * 0.95).toFixed(2));
    }
  }, [selectedStock.symbol, selectedStock.price]);

  const shares = parseFloat(sharesInput) || 0;
  const executionPrice = orderType === 'limit' && parseFloat(limitPriceInput)
    ? parseFloat(limitPriceInput)
    : selectedStock.price;

  const totalEstimated = Number((shares * executionPrice).toFixed(2));

  // Max calculations
  const maxBuyShares = Math.floor(cashBalance / selectedStock.price);
  const maxShares = side === 'buy' ? maxBuyShares : sharesOwned;

  const handlePercentageClick = (pct: number) => {
    if (side === 'buy') {
      const budget = cashBalance * (pct / 100);
      const calculatedShares = Math.floor(budget / executionPrice);
      setSharesInput(Math.max(1, calculatedShares).toString());
    } else {
      const calculatedShares = Math.floor(sharesOwned * (pct / 100));
      setSharesInput(calculatedShares.toString());
    }
  };

  // Quick preset offsets for Bracket orders
  const setTpOffset = (pct: number) => {
    const base = executionPrice;
    const target = base * (1 + pct / 100);
    setTpPriceInput(target.toFixed(2));
  };

  const setSlOffset = (pct: number) => {
    const base = executionPrice;
    const target = base * (1 - pct / 100);
    setSlPriceInput(target.toFixed(2));
  };

  // Bracket metrics calculation
  const tpPrice = parseFloat(tpPriceInput) || 0;
  const slPrice = parseFloat(slPriceInput) || 0;

  const bracketMetrics = useMemo(() => {
    if (!isBracketEnabled || side !== 'buy' || shares <= 0) return null;
    const upsidePerShare = tpPrice > executionPrice ? tpPrice - executionPrice : 0;
    const downsidePerShare = slPrice < executionPrice && slPrice > 0 ? executionPrice - slPrice : 0;
    const totalPotentialProfit = Number((upsidePerShare * shares).toFixed(2));
    const totalPotentialRisk = Number((downsidePerShare * shares).toFixed(2));

    const profitPct = executionPrice > 0 ? ((upsidePerShare / executionPrice) * 100).toFixed(1) : '0';
    const riskPct = executionPrice > 0 ? ((downsidePerShare / executionPrice) * 100).toFixed(1) : '0';

    const ratio = totalPotentialRisk > 0 ? (totalPotentialProfit / totalPotentialRisk).toFixed(2) : null;

    return {
      totalPotentialProfit,
      totalPotentialRisk,
      profitPct,
      riskPct,
      ratio,
      isFavorable: ratio !== null && parseFloat(ratio) >= 2.0,
    };
  }, [isBracketEnabled, side, shares, executionPrice, tpPrice, slPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (shares <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid share quantity greater than 0.' });
      return;
    }

    if (side === 'buy' && totalEstimated > cashBalance) {
      setFeedback({
        type: 'error',
        message: `Insufficient buying power ($${cashBalance.toFixed(2)} available vs $${totalEstimated.toFixed(2)} needed).`,
      });
      return;
    }

    if (side === 'sell' && shares > sharesOwned) {
      setFeedback({
        type: 'error',
        message: `Cannot sell ${shares} shares. You only own ${sharesOwned} shares of ${selectedStock.symbol}.`,
      });
      return;
    }

    // Bracket validation if enabled
    if (side === 'buy' && isBracketEnabled) {
      if (tpPrice > 0 && tpPrice <= executionPrice) {
        setFeedback({
          type: 'error',
          message: `Take-Profit price ($${tpPrice.toFixed(2)}) must be higher than entry price ($${executionPrice.toFixed(2)}).`,
        });
        return;
      }
      if (slPrice > 0 && slPrice >= executionPrice) {
        setFeedback({
          type: 'error',
          message: `Stop-Loss price ($${slPrice.toFixed(2)}) must be lower than entry price ($${executionPrice.toFixed(2)}).`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = executeTrade({
        symbol: selectedStock.symbol,
        side,
        type: orderType,
        shares,
        limitPrice: orderType === 'limit' ? parseFloat(limitPriceInput) : undefined,
        stopPrice: orderType === 'stop_loss' ? parseFloat(stopPriceInput) : undefined,
        takeProfitPrice: side === 'buy' && isBracketEnabled && tpPrice > 0 ? tpPrice : undefined,
        stopLossPrice: side === 'buy' && isBracketEnabled && slPrice > 0 ? slPrice : undefined,
        isBracket: side === 'buy' && isBracketEnabled,
      });

      setIsSubmitting(false);

      if (result.success) {
        setFeedback({ type: 'success', message: result.message });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: 'error', message: result.message });
      }
    }, 200);
  };

  const handleSavePositionBracket = (e: React.FormEvent) => {
    e.preventDefault();
    const tp = parseFloat(posTpInput) || undefined;
    const sl = parseFloat(posSlInput) || undefined;
    updatePositionBracket(selectedStock.symbol, tp, sl);
    setIsEditingPositionBracket(false);
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
      <div>
        {/* Terminal Header & Mode Selector */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-[#131d31] rounded-lg border border-slate-800/80 w-full">
            <button
              type="button"
              onClick={() => {
                setSide('buy');
                setFeedback(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                side === 'buy'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              BUY
            </button>
            <button
              type="button"
              onClick={() => {
                setSide('sell');
                setFeedback(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                side === 'sell'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              SELL
            </button>
          </div>
        </div>

        {/* Order Type Tabs */}
        <div className="flex items-center justify-between gap-1 mt-3 bg-[#0a0e17] p-1 rounded-lg border border-slate-800/60 text-xs">
          {(['market', 'limit', 'stop_loss'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={`flex-1 py-1 text-[11px] font-semibold rounded capitalize transition-colors whitespace-nowrap cursor-pointer ${
                orderType === type
                  ? 'bg-[#1e293b] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'stop_loss' ? 'Stop Loss' : type}
            </button>
          ))}
        </div>

        {/* Existing Position Bracket Alert / Manager */}
        {position && (
          <div className="mt-3 p-2.5 bg-[#131d31]/80 rounded-lg border border-slate-700/60 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Position ({position.shares} shares)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPositionBracket(!isEditingPositionBracket)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                {isEditingPositionBracket ? 'Cancel' : position.takeProfitPrice || position.stopLossPrice ? 'Edit TP/SL' : '+ Add TP/SL'}
              </button>
            </div>

            {position.takeProfitPrice || position.stopLossPrice ? (
              <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono tabular-nums">
                {position.takeProfitPrice && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>TP: ${position.takeProfitPrice.toFixed(2)}</span>
                  </span>
                )}
                {position.stopLossPrice && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>SL: ${position.stopLossPrice.toFixed(2)}</span>
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                No active bracket attached. Click Add TP/SL to set automated targets.
              </p>
            )}

            {/* Inline Position Bracket Editor */}
            {isEditingPositionBracket && (
              <form onSubmit={handleSavePositionBracket} className="mt-2.5 pt-2 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Take Profit (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={posTpInput}
                      onChange={(e) => setPosTpInput(e.target.value)}
                      placeholder="e.g. 150.00"
                      className="w-full bg-[#0a0e17] border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Stop Loss (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={posSlInput}
                      onChange={(e) => setPosSlInput(e.target.value)}
                      placeholder="e.g. 120.00"
                      className="w-full bg-[#0a0e17] border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded cursor-pointer transition-colors"
                  >
                    Save Bracket Targets
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Trade Form */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {/* Shares Input */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Quantity (Shares)</span>
              <span className="font-mono tabular-nums text-slate-400">
                {side === 'buy' ? 'Max Buy: ' : 'Owned: '}
                <span className="text-white font-semibold">{maxShares.toLocaleString()}</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                placeholder="0"
                className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg px-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-medium text-slate-400">
                {selectedStock.symbol}
              </span>
            </div>
          </div>

          {/* Quick Percentage Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageClick(pct)}
                className="py-1 text-[11px] font-semibold font-mono bg-[#162035] hover:bg-[#1e2d4a] text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Limit Price Input (if Limit order) */}
          {orderType === 'limit' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Limit Price (USD)</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Current: ${selectedStock.price.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={limitPriceInput}
                  onChange={(e) => setLimitPriceInput(e.target.value)}
                  placeholder={selectedStock.price.toFixed(2)}
                  className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg pl-6 pr-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Stop Price Input (if Stop Loss order) */}
          {orderType === 'stop_loss' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Stop Trigger Price (USD)</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Current: ${selectedStock.price.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={stopPriceInput}
                  onChange={(e) => setStopPriceInput(e.target.value)}
                  placeholder={(selectedStock.price * 0.95).toFixed(2)}
                  className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg pl-6 pr-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Bracket Order (TP / SL / OCO) Toggle for BUY orders */}
          {side === 'buy' && (
            <div className="bg-[#111928] rounded-xl p-3 border border-slate-800/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-tight">Bracket Order (OCO)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/60">
                    Auto TP / SL
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBracketEnabled}
                    onChange={(e) => setIsBracketEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {isBracketEnabled && (
                <div className="space-y-2.5 pt-1 border-t border-slate-800/70">
                  {/* Take-Profit (TP) Block */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Take-Profit Target (USD)
                      </span>
                      {bracketMetrics && (
                        <span className="font-mono text-emerald-400 text-[10px]">
                          +${bracketMetrics.totalPotentialProfit.toFixed(2)} (+{bracketMetrics.profitPct}%)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={tpPriceInput}
                        onChange={(e) => setTpPriceInput(e.target.value)}
                        placeholder={(executionPrice * 1.10).toFixed(2)}
                        className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-white font-mono tabular-nums text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    {/* Quick TP Presets */}
                    <div className="flex items-center gap-1 mt-1">
                      {[5, 10, 15, 25].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setTpOffset(pct)}
                          className="flex-1 py-0.5 text-[10px] font-mono font-semibold bg-[#162035] hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stop-Loss (SL) Block */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Stop-Loss Floor (USD)
                      </span>
                      {bracketMetrics && (
                        <span className="font-mono text-rose-400 text-[10px]">
                          -${bracketMetrics.totalPotentialRisk.toFixed(2)} (-{bracketMetrics.riskPct}%)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={slPriceInput}
                        onChange={(e) => setSlPriceInput(e.target.value)}
                        placeholder={(executionPrice * 0.95).toFixed(2)}
                        className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-white font-mono tabular-nums text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    {/* Quick SL Presets */}
                    <div className="flex items-center gap-1 mt-1">
                      {[3, 5, 8, 12].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setSlOffset(pct)}
                          className="flex-1 py-0.5 text-[10px] font-mono font-semibold bg-[#162035] hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded border border-slate-800 transition-colors cursor-pointer"
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Risk / Reward Meter */}
                  {bracketMetrics && bracketMetrics.ratio && (
                    <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Risk / Reward Ratio:</span>
                      </span>
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          bracketMetrics.isFavorable
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        1 : {bracketMetrics.ratio} R:R {bracketMetrics.isFavorable ? '✓' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Order Details & Calculation */}
          <div className="bg-[#0a0e17] rounded-lg p-3 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Estimated Entry</span>
              <span className="text-white font-mono tabular-nums font-medium">
                ${executionPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Execution Fee</span>
              <span className="text-emerald-400 font-mono tabular-nums font-semibold">
                $0.00 (Zero Commission)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-slate-800">
              <span className="font-medium text-slate-300">Estimated Total</span>
              <span className="text-base font-bold font-mono tabular-nums text-white">
                ${totalEstimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="leading-snug">{feedback.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || shares <= 0}
            className={`w-full py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              side === 'buy'
                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-950/40'
                : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-rose-950/40'
            }`}
          >
            {isSubmitting
              ? 'Routing Order...'
              : `${side === 'buy' ? (isBracketEnabled ? 'Place Bracket Buy (TP/SL)' : 'Place Buy Order') : 'Place Sell Order'} (${selectedStock.symbol})`}
          </button>
        </form>
      </div>

      {/* Account Purchasing Power Card */}
      <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
            <span>Available Cash</span>
          </span>
          <button
            onClick={() => openPaymentModal('deposit')}
            className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer text-[11px]"
          >
            + Add Funds
          </button>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold font-mono tabular-nums text-white">
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {sharesOwned > 0 && (
            <span className="text-slate-400 text-[11px]">
              Holding {sharesOwned} shares (${(sharesOwned * selectedStock.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
