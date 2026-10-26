import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { generateQuantitativeAnalysis, TradeSuggestion } from '../utils/quantAnalyzer';
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
  Info,
} from 'lucide-react';

export const AITradeAnalyst: React.FC = () => {
  const {
    selectedStock,
    candles,
    cashBalance,
    setQuickTradePrefill,
    addToast,
  } = useTrading();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<TradeSuggestion | null>(null);
  const [source, setSource] = useState<'ai' | 'quant'>('quant');

  // Compute fresh quantitative baseline when stock changes
  useEffect(() => {
    const quant = generateQuantitativeAnalysis(selectedStock, candles, cashBalance);
    setSuggestion(quant);
    setSource('quant');
  }, [selectedStock.symbol]);

  const handleRunAIAnalysis = async () => {
    setIsLoading(true);
    const quant = generateQuantitativeAnalysis(selectedStock, candles, cashBalance);

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
            title: 'AI Analysis Complete',
            message: `Quantitative strategist generated a high-conviction ${data.analysis.action} setup for ${selectedStock.symbol}`,
          });
        }
      }
    } catch (err) {
      // Fallback already in place
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
    });

    addToast({
      type: 'info',
      title: 'Strategy Loaded into Terminal',
      message: `${suggestion.action} ${suggestion.suggestedShares} shares of ${suggestion.symbol} @ $${suggestion.entryPrice.toFixed(2)} staged in order ticket`,
    });

    // Scroll to terminal smoothly
    const terminalEl = document.querySelector('form');
    if (terminalEl) {
      terminalEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!suggestion) return null;

  const isBuy = suggestion.action === 'BUY';

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
      <div>
        {/* Header with AI Trigger */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Quantitative Strategy & Trade Ideas
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  {source === 'ai' ? 'Gemini 3.8 Intelligence' : 'Quant Technical Scanner'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated multi-factor risk/reward modeling & price action triggers
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAIAnalysis}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Scanning Market...' : 'Run Deep AI Scan'}</span>
          </button>
        </div>

        {/* Suggestion Card Hero */}
        <div className="bg-[#131d31] rounded-xl p-4 border border-slate-800/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1 ${
                  isBuy
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {isBuy ? <TrendingUp className="w-3.5 h-3.5 stroke-[3]" /> : <TrendingDown className="w-3.5 h-3.5 stroke-[3]" />}
                {suggestion.action} SIGNAL
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">{suggestion.strategyName}</h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Conviction Score: <span className="text-emerald-400 font-bold">{suggestion.confidence}%</span>
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

          {/* Key Targets Grid */}
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
                <span>Take Profit</span>
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
                <span>Stop Loss</span>
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
              <span className="text-[11px] font-semibold text-slate-400 block">Supporting Technical & Fundamental Pillars:</span>
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
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Paper Trading Simulation: Pre-fills order ticket with calculated parameters.
        </span>

        <button
          onClick={handleApplyToTerminal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
        >
          <span>Stage {suggestion.action} in Order Ticket</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
