import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  generateQuantitativeAnalysis,
  scanAllStrategies,
  TradeSuggestion,
} from '../utils/quantAnalyzer';
import { StrategyType } from '../utils/backtestEngine';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  Sliders,
  Layers,
  Gauge,
  Activity,
  BarChart2,
} from 'lucide-react';

const STRATEGY_PRESETS: { id: StrategyType; label: string; tag: string }[] = [
  { id: 'ai_multi_factor', label: 'AI Multi-Factor', tag: 'Confluence' },
  { id: 'bollinger_squeeze', label: 'Bollinger Squeeze', tag: 'Volatility' },
  { id: 'macd_cross', label: 'MACD Momentum', tag: 'Velocity' },
  { id: 'vwap_reversion', label: 'VWAP Institutional', tag: 'Liquidity' },
  { id: 'rsi_reversion', label: 'RSI Mean Reversion', tag: 'Oscillator' },
  { id: 'breakout_momentum', label: 'Donchian Breakout', tag: 'Trend' },
  { id: 'sma_cross', label: '20/50 SMA Cross', tag: 'Moving Avg' },
];

export const AITradeAnalyst: React.FC = () => {
  const {
    selectedStock,
    candles,
    cashBalance,
    setQuickTradePrefill,
    addToast,
    setActiveTab,
  } = useTrading();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyType>('ai_multi_factor');
  const [suggestion, setSuggestion] = useState<TradeSuggestion | null>(null);
  const [allSuggestions, setAllSuggestions] = useState<TradeSuggestion[]>([]);
  const [source, setSource] = useState<'ai' | 'quant'>('quant');
  const [showRadar, setShowRadar] = useState<boolean>(false);

  // Compute fresh quantitative baseline when stock or candles change
  useEffect(() => {
    const all = scanAllStrategies(selectedStock, candles, cashBalance);
    setAllSuggestions(all);

    const active = generateQuantitativeAnalysis(
      selectedStock,
      candles,
      cashBalance,
      selectedStrategyId
    );
    setSuggestion(active);
    setSource('quant');
  }, [selectedStock.symbol, selectedStock.price, selectedStrategyId, candles.length]);

  const handleSelectStrategy = (stratId: StrategyType) => {
    setSelectedStrategyId(stratId);
    const updated = generateQuantitativeAnalysis(selectedStock, candles, cashBalance, stratId);
    setSuggestion(updated);
    setSource('quant');
  };

  const handleRunAIAnalysis = async () => {
    setIsLoading(true);
    const quant = generateQuantitativeAnalysis(
      selectedStock,
      candles,
      cashBalance,
      selectedStrategyId
    );

    try {
      const response = await fetch('/api/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: selectedStock,
          timeframe: '1D',
          quantStrategy: quant,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          setSuggestion(data.analysis);
          setSource(data.source === 'gemini-ai' ? 'ai' : 'quant');
          addToast({
            type: 'success',
            title: 'AI Quantitative Scan Complete',
            message: `Gemini generated high-conviction ${data.analysis.action} setup for ${selectedStock.symbol} (${data.analysis.strategyName})`,
          });
        }
      }
    } catch {
      setSuggestion(quant);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToTerminal = () => {
    if (!suggestion) return;

    setQuickTradePrefill({
      symbol: suggestion.symbol,
      side: suggestion.action === 'BUY' ? 'buy' : 'sell',
      price: suggestion.entryPrice,
      shares: suggestion.suggestedShares,
      takeProfitPrice: suggestion.targetPrice,
      stopLossPrice: suggestion.stopLossPrice,
      isBracket: true,
      strategyName: suggestion.strategyName,
    });

    addToast({
      type: 'info',
      title: 'Bracket Order Staged into Terminal',
      message: `${suggestion.action} ${suggestion.suggestedShares} shares @ $${suggestion.entryPrice.toFixed(2)} with TP: $${suggestion.targetPrice.toFixed(2)} & SL: $${suggestion.stopLossPrice.toFixed(2)}`,
    });

    // Scroll to terminal smoothly
    const terminalEl = document.querySelector('form');
    if (terminalEl) {
      terminalEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!suggestion) return null;

  const isBuy = suggestion.action === 'BUY';
  const metrics = suggestion.metrics;

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
      <div>
        {/* Header with AI Trigger & Strategy Toggle */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Autonomous Quantitative Agent Scanner
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  {source === 'ai' ? 'Gemini 3.8 Intelligence' : 'Quant Rule Engine'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-strategy risk/reward modeling, indicator confluence, and bracket order staging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRadar(!showRadar)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showRadar
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Compare all 7 agent strategy conviction scores"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Strategy Radar</span>
            </button>

            <button
              onClick={handleRunAIAnalysis}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning Market...' : 'Run Deep AI Scan'}</span>
            </button>
          </div>
        </div>

        {/* Strategy Archetype Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none">
          {STRATEGY_PRESETS.map((strat) => {
            const isSelected = strat.id === selectedStrategyId;
            return (
              <button
                key={strat.id}
                onClick={() => handleSelectStrategy(strat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-[#131d31] text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <span>{strat.label}</span>
                <span
                  className={`text-[9px] uppercase px-1 rounded font-mono ${
                    isSelected ? 'bg-blue-800/90 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {strat.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Indicator Badges Bar */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3.5 text-[11px] font-mono">
            <div className="bg-[#131d31]/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">RSI (14)</span>
              <span
                className={`font-bold ${
                  metrics.rsi < 35
                    ? 'text-emerald-400'
                    : metrics.rsi > 65
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {metrics.rsi}
              </span>
            </div>

            <div className="bg-[#131d31]/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">VWAP</span>
              <span className="text-white font-bold">${metrics.vwap.toFixed(2)}</span>
            </div>

            <div className="bg-[#131d31]/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">20-SMA</span>
              <span className="text-white font-bold">${metrics.sma20.toFixed(2)}</span>
            </div>

            <div className="bg-[#131d31]/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">BB Width</span>
              <span
                className={`font-bold ${
                  metrics.bandwidth < 10 ? 'text-amber-400' : 'text-slate-200'
                }`}
              >
                {metrics.bandwidth}% {metrics.bandwidth < 10 ? 'Squeeze' : ''}
              </span>
            </div>

            <div className="bg-[#131d31]/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
              <span className="text-slate-400">MACD Hist</span>
              <span
                className={`font-bold ${
                  metrics.macdHist >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.macdHist >= 0 ? `+${metrics.macdHist}` : metrics.macdHist}
              </span>
            </div>
          </div>
        )}

        {/* Multi-Agent Radar Matrix Dropdown/Drawer */}
        {showRadar && (
          <div className="bg-[#0b1120] border border-blue-500/30 rounded-xl p-3.5 mb-4 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Multi-Strategy Conviction Ranking for {selectedStock.symbol}</span>
              </div>
              <span className="text-[10px] text-slate-400">Click any strategy to inspect & stage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {allSuggestions.map((item) => {
                const isItemActive = item.strategyId === selectedStrategyId;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectStrategy(item.strategyId)}
                    className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${
                      isItemActive
                        ? 'bg-blue-950/60 border-blue-500'
                        : 'bg-[#131d31]/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-white truncate">
                        {item.strategyName}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          item.action === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {item.action}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                      <span>
                        Conviction: <strong className="text-blue-400">{item.confidence}%</strong>
                      </span>
                      <span>{item.riskRewardRatio}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestion Card Hero */}
        <div className="bg-[#131d31] rounded-xl p-4 border border-slate-800/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1 ${
                  isBuy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}
              >
                {isBuy ? (
                  <TrendingUp className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {suggestion.action} SIGNAL
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">{suggestion.strategyName}</h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Conviction Score:{' '}
                  <span className="text-emerald-400 font-bold">{suggestion.confidence}%</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-mono">Risk / Reward Ratio</span>
              <span className="text-sm font-bold font-mono text-white">
                {suggestion.riskRewardRatio}
              </span>
            </div>
          </div>

          {/* Key Targets Grid with Bracket Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono tabular-nums">
            <div className="bg-[#0a0e17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px] font-sans">Suggested Entry</span>
              <span className="text-white font-bold text-sm">
                ${suggestion.entryPrice.toFixed(2)}
              </span>
            </div>

            <div className="bg-[#0a0e17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px] font-sans flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-400" />
                <span>Take Profit Bracket</span>
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                ${suggestion.targetPrice.toFixed(2)}{' '}
                <span className="text-[10px] font-normal">
                  (+{suggestion.potentialGainPercent || 5.5}%)
                </span>
              </span>
            </div>

            <div className="bg-[#0a0e17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px] font-sans flex items-center gap-1">
                <Shield className="w-3 h-3 text-rose-400" />
                <span>Stop Loss Bracket</span>
              </span>
              <span className="text-rose-400 font-bold text-sm">
                ${suggestion.stopLossPrice.toFixed(2)}{' '}
                <span className="text-[10px] font-normal">
                  (-{suggestion.maxLossPercent || 2.2}%)
                </span>
              </span>
            </div>

            <div className="bg-[#0a0e17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px] font-sans">Position Sizing</span>
              <span className="text-blue-300 font-bold text-sm">
                {suggestion.suggestedShares} shares{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  (~${(suggestion.suggestedShares * suggestion.entryPrice).toFixed(0)})
                </span>
              </span>
            </div>
          </div>

          {/* Technical Rationale */}
          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#0a0e17]/60 p-3 rounded-lg border border-slate-800/60">
            {suggestion.technicalSummary}
          </p>

          {/* Supporting Catalysts */}
          {suggestion.catalysts && suggestion.catalysts.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Supporting Technical & Quantitative Catalysts:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {suggestion.catalysts.map((cat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-[#0a0e17] p-2 rounded border border-slate-800/60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Auto-Bracket Integration: 1-click loads entry, shares, take-profit, and stop-loss into order ticket.
          </span>
          <button
            onClick={() => setActiveTab('backtest')}
            className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
          >
            Backtest this strategy on historical data →
          </button>
        </div>

        <button
          onClick={handleApplyToTerminal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
        >
          <span>Stage {suggestion.action} Bracket Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
