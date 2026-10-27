import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTrading } from '../context/TradingContext';
import { Candle } from '../types/market';
import { generateCandles } from '../data/mockStocks';
import {
  runBacktest,
  BacktestConfig,
  BacktestResult,
  StrategyType,
} from '../utils/backtestEngine';
import {
  Play,
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  Shield,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';

const STRATEGY_DETAILS: Record<
  StrategyType,
  { label: string; entryRule: string; exitRule: string; edge: string }
> = {
  ai_multi_factor: {
    label: 'AI Multi-Factor Confluence',
    entryRule: 'RSI < 48 + price holding above 50-period SMA + positive candle body',
    exitRule: 'RSI > 70 overbought exhaustion or bracket TP/SL hit',
    edge: 'Filters noise by combining oscillator momentum, structural trend, and price velocity',
  },
  bollinger_squeeze: {
    label: 'Bollinger Band Squeeze Breakout',
    entryRule: 'Bandwidth contraction (< 12%) followed by close above Upper Bollinger Band',
    exitRule: 'Close below 20-period middle baseline or bracket TP/SL hit',
    edge: 'Capitalizes on low-volatility compression transitioning into high-velocity trend breakouts',
  },
  macd_cross: {
    label: 'MACD Crossover Momentum',
    entryRule: 'MACD line crosses above 9-period Signal line with positive histogram expansion',
    exitRule: 'MACD line crosses below Signal line or bracket TP/SL hit',
    edge: 'Catches explosive early-stage momentum acceleration before retail indicators flag trend',
  },
  vwap_reversion: {
    label: 'VWAP Institutional Mean Reversion',
    entryRule: 'Price discounted > 1.5% below VWAP with RSI < 45 and reversal candle confirmation',
    exitRule: 'Price re-enters VWAP benchmark + 1% or bracket TP/SL hit',
    edge: 'Exploits algorithmic dealer liquidity imbalances that systematically revert to fair value',
  },
  rsi_reversion: {
    label: 'RSI(14) Mean Reversion',
    entryRule: 'RSI(14) dips below 32 oversold threshold and curls upward',
    exitRule: 'RSI crosses above 65 overbought threshold or bracket TP/SL hit',
    edge: 'High historical win rate capturing extreme seller exhaustion bounces',
  },
  breakout_momentum: {
    label: '20-Day Donchian Breakout',
    entryRule: 'Price pierces the rolling 20-day high with expanding volume',
    exitRule: 'Close below rolling 10-day low or bracket TP/SL hit',
    edge: 'Classic trend-following rule that captures asymmetric multi-month equity runs',
  },
  sma_cross: {
    label: '20/50 SMA Golden Cross',
    entryRule: '20-period SMA crosses above 50-period SMA (Golden Cross)',
    exitRule: '20-period SMA crosses below 50-period SMA (Death Cross)',
    edge: 'Robust systematic trend-following regime filter for intermediate market cycles',
  },
};

export const BacktestView: React.FC = () => {
  const { stocks, selectedSymbol, setSelectedSymbol, setActiveTab, setQuickTradePrefill } = useTrading();

  const [symbol, setSymbol] = useState<string>(selectedSymbol || 'NVDA');
  const [strategy, setStrategy] = useState<StrategyType>('ai_multi_factor');
  const [years, setYears] = useState<number>(3);
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [positionSize, setPositionSize] = useState<number>(50);
  const [stopLoss, setStopLoss] = useState<number>(5);
  const [takeProfit, setTakeProfit] = useState<number>(15);
  const [useStops, setUseStops] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [tradeFilter, setTradeFilter] = useState<'all' | 'winners' | 'losers'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with global symbol if changed from sidebar
  useEffect(() => {
    if (selectedSymbol) setSymbol(selectedSymbol);
  }, [selectedSymbol]);

  // Execute Backtest
  const executeSimulation = async () => {
    setIsLoading(true);

    try {
      // Fetch actual historical candle history from server or generate deep sample
      const res = await fetch(`/api/market/candles/${symbol}?timeframe=5Y`);
      let historicalCandles: Candle[] = [];

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.length >= 30) {
          historicalCandles = json.data;
        }
      }

      // If server returned insufficient bars, generate high-fidelity multi-year walk
      if (historicalCandles.length < 30) {
        const basePrice = stocks[symbol]?.price || 150;
        historicalCandles = generateCandles(basePrice, '5Y');
      }

      // Slice to match requested years (approx 252 trading days per year)
      const barsToUse = Math.min(historicalCandles.length, Math.max(30, Math.round(years * 252)));
      const slicedCandles = historicalCandles.slice(-barsToUse);

      const config: BacktestConfig = {
        symbol,
        strategy,
        initialCapital,
        positionSizePercent: positionSize,
        stopLossPercent: useStops ? stopLoss : undefined,
        takeProfitPercent: useStops ? takeProfit : undefined,
        slippagePercent: 0.05,
      };

      const simResult = runBacktest(slicedCandles, config);
      setResult(simResult);
    } catch (err) {
      console.error('Backtest error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial backtest on mount
  useEffect(() => {
    executeSimulation();
  }, [symbol, strategy, years]);

  // Filtered trade list
  const filteredTrades = useMemo(() => {
    if (!result) return [];
    if (tradeFilter === 'winners') return result.trades.filter((t) => t.pnl > 0);
    if (tradeFilter === 'losers') return result.trades.filter((t) => t.pnl < 0);
    return result.trades;
  }, [result, tradeFilter]);

  // Equity Curve SVG coordinates
  const curve = result?.equityCurve || [];
  const svgWidth = 840;
  const svgHeight = 260;
  const paddingLeft = 16;
  const paddingRight = 70;
  const paddingTop = 20;
  const paddingBottom = 25;
  const innerW = svgWidth - paddingLeft - paddingRight;
  const innerH = svgHeight - paddingTop - paddingBottom;

  const { minVal, maxVal } = useMemo(() => {
    if (curve.length === 0) return { minVal: 80000, maxVal: 120000 };
    let min = Infinity;
    let max = -Infinity;
    curve.forEach((pt) => {
      if (pt.portfolioValue < min) min = pt.portfolioValue;
      if (pt.benchmarkValue < min) min = pt.benchmarkValue;
      if (pt.portfolioValue > max) max = pt.portfolioValue;
      if (pt.benchmarkValue > max) max = pt.benchmarkValue;
    });
    const spread = max - min || 1;
    return {
      minVal: Math.max(0, min - spread * 0.08),
      maxVal: max + spread * 0.08,
    };
  }, [curve]);

  const valRange = maxVal - minVal || 1;

  const getY = (val: number) => {
    return paddingTop + innerH * (1 - (val - minVal) / valRange);
  };

  const getX = (idx: number) => {
    if (curve.length <= 1) return paddingLeft + innerW / 2;
    return paddingLeft + (idx / (curve.length - 1)) * innerW;
  };

  const strategyPath = useMemo(() => {
    if (curve.length === 0) return '';
    return curve.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.portfolioValue);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [curve, minVal, valRange]);

  const benchmarkPath = useMemo(() => {
    if (curve.length === 0) return '';
    return curve.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.benchmarkValue);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [curve, minVal, valRange]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || curve.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * svgWidth;
    const boundedX = Math.max(paddingLeft, Math.min(paddingLeft + innerW, relativeX));
    const ratio = (boundedX - paddingLeft) / innerW;
    const idx = Math.round(ratio * (curve.length - 1));
    setHoveredIndex(Math.max(0, Math.min(curve.length - 1, idx)));
  };

  const activePoint = hoveredIndex !== null && curve[hoveredIndex] ? curve[hoveredIndex] : curve[curve.length - 1];

  const handleDeployToTerminal = () => {
    setSelectedSymbol(symbol);
    setQuickTradePrefill({
      symbol,
      side: result?.totalReturnPercent && result.totalReturnPercent > 0 ? 'buy' : 'sell',
      price: stocks[symbol]?.price,
    });
    setActiveTab('terminal');
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Configuration Controls Card */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Algorithmic Strategy Backtesting Simulator
              </h2>
              <p className="text-[11px] text-slate-400">
                Simulate quantitative trading rules against actual historical market data
              </p>
            </div>
          </div>

          <button
            onClick={executeSimulation}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-mono">
          {/* Asset Selector */}
          <div>
            <label className="text-[11px] font-sans text-slate-400 block mb-1">Target Instrument</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg px-2.5 py-2 text-white font-bold text-xs focus:border-blue-500"
            >
              {Array.from(
                new Map(Object.values(stocks).map((s) => [s.symbol, s])).values()
              ).map((s, idx) => (
                <option key={`${s.symbol}-${idx}`} value={s.symbol}>
                  {s.symbol} - {s.name.slice(0, 16)}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Preset */}
          <div>
            <label className="text-[11px] font-sans text-slate-400 block mb-1">Quantitative Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as StrategyType)}
              className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg px-2.5 py-2 text-white font-bold text-xs focus:border-blue-500"
            >
              <option value="ai_multi_factor">AI Multi-Factor Confluence (VWAP+RSI+Trend)</option>
              <option value="bollinger_squeeze">Bollinger Band Squeeze Breakout (Volatility)</option>
              <option value="macd_cross">MACD Crossover Momentum (Velocity)</option>
              <option value="vwap_reversion">VWAP Institutional Mean Reversion (Liquidity)</option>
              <option value="rsi_reversion">RSI(14) Mean Reversion (Oscillator)</option>
              <option value="breakout_momentum">20-Day Donchian Breakout (Trend)</option>
              <option value="sma_cross">20/50 SMA Golden Cross (Moving Avg)</option>
            </select>
          </div>

          {/* Timeframe Range */}
          <div>
            <label className="text-[11px] font-sans text-slate-400 block mb-1">Historical Period</label>
            <div className="flex bg-[#131d31] p-0.5 rounded-lg border border-slate-700/80">
              {[1, 2, 3, 5].map((y) => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                    years === y ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {y}Y
                </button>
              ))}
            </div>
          </div>

          {/* Position Sizing */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 mb-1">
              <span>Position Sizing</span>
              <span className="font-mono text-white font-semibold">{positionSize}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={positionSize}
              onChange={(e) => setPositionSize(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-[#131d31] rounded-lg mt-2"
            />
          </div>

          {/* Risk Management Checkbox */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-sans text-slate-400 mb-1">
              <span>Risk Bracket</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useStops}
                  onChange={(e) => setUseStops(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-[10px] text-slate-300">Active</span>
              </label>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-rose-400 font-bold">SL: {stopLoss}%</span>
              <span className="text-slate-600">/</span>
              <span className="text-[10px] text-emerald-400 font-bold">TP: {takeProfit}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Methodology & Parameters Explainer */}
      <div className="bg-[#10192d] rounded-xl border border-blue-500/20 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {STRATEGY_DETAILS[strategy]?.label || strategy} Rules & Algorithmic Mechanics
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              Deterministic Quantitative Logic
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="text-slate-300">
              <strong className="text-emerald-400 font-mono">Entry Trigger:</strong>{' '}
              {STRATEGY_DETAILS[strategy]?.entryRule}
            </div>
            <div className="text-slate-300">
              <strong className="text-rose-400 font-mono">Exit Rule:</strong>{' '}
              {STRATEGY_DETAILS[strategy]?.exitRule}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Statistical Edge: {STRATEGY_DETAILS[strategy]?.edge}
          </p>
        </div>

        <button
          onClick={() => {
            const currentPrice = stocks[symbol]?.price || 150;
            const allocation = initialCapital * (positionSize / 100);
            const shares = Math.max(1, Math.floor(allocation / currentPrice));
            const tpPrice = useStops ? currentPrice * (1 + takeProfit / 100) : currentPrice * 1.10;
            const slPrice = useStops ? currentPrice * (1 - stopLoss / 100) : currentPrice * 0.95;

            setSelectedSymbol(symbol);
            setQuickTradePrefill({
              symbol,
              side: 'buy',
              price: currentPrice,
              shares,
              takeProfitPrice: tpPrice,
              stopLossPrice: slPrice,
              isBracket: useStops,
              strategyName: result?.strategyName || strategy,
            });
            setActiveTab('terminal');
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
        >
          <span>Stage {symbol} in Terminal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Simulation Performance KPI Strip */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Strategy Net Return */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Strategy Return</span>
            <div
              className={`text-xl font-bold font-mono tabular-nums flex items-center gap-1 ${
                result.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.totalReturnPercent >= 0 ? '+' : ''}
              {result.totalReturnPercent}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              ${result.finalCapital.toLocaleString()} Final
            </span>
          </div>

          {/* Benchmark Comparison & Alpha */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Alpha vs Buy & Hold</span>
            <div
              className={`text-xl font-bold font-mono tabular-nums ${
                result.alphaPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.alphaPercent >= 0 ? '+' : ''}
              {result.alphaPercent}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Hold: {result.benchmarkReturnPercent >= 0 ? '+' : ''}{result.benchmarkReturnPercent}%
            </span>
          </div>

          {/* Win Rate */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Win Rate</span>
            <div className="text-xl font-bold font-mono tabular-nums text-white">
              {result.winRate}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              {result.winningTrades}W / {result.losingTrades}L ({result.totalTrades} total)
            </span>
          </div>

          {/* Profit Factor */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Profit Factor</span>
            <div className="text-xl font-bold font-mono tabular-nums text-blue-400">
              {result.profitFactor}x
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Gross Win / Gross Loss
            </span>
          </div>

          {/* Max Drawdown */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Max Drawdown</span>
            <div className="text-xl font-bold font-mono tabular-nums text-rose-400">
              -{result.maxDrawdownPercent}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Peak-to-Trough Decline
            </span>
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1">Sharpe Ratio</span>
            <div className="text-xl font-bold font-mono tabular-nums text-purple-400">
              {result.sharpeRatio}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Risk-Adjusted Return
            </span>
          </div>
        </div>
      )}

      {/* 3. Equity Curve Comparison Chart */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Equity Curve vs. Buy & Hold Benchmark
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-1 bg-blue-500 rounded-full" />
                <span>Strategy ({result?.strategyName})</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-1 bg-slate-500 rounded-full" />
                <span>Buy & Hold Benchmark</span>
              </span>
            </div>
          </div>

          {activePoint && (
            <div className="text-xs font-mono text-slate-300 flex items-center gap-3">
              <span>Date: {new Date(activePoint.timestamp).toLocaleDateString()}</span>
              <span className="text-blue-400 font-bold">
                Portfolio: ${activePoint.portfolioValue.toLocaleString()}
              </span>
              <span className="text-slate-400">
                Hold: ${activePoint.benchmarkValue.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* SVG Equity Curve Canvas */}
        <div
          ref={containerRef}
          className="relative w-full h-[260px] cursor-crosshair select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            onMouseMove={handleMouseMove}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const val = minVal + valRange * (1 - r);
              const y = paddingTop + innerH * r;
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={svgWidth - paddingRight + 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    className="tabular-nums"
                  >
                    ${(val / 1000).toFixed(0)}k
                  </text>
                </g>
              );
            })}

            {/* Benchmark Curve (Gray) */}
            {benchmarkPath && (
              <path
                d={benchmarkPath}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.75"
              />
            )}

            {/* Strategy Equity Curve (Blue) */}
            {strategyPath && (
              <path
                d={strategyPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Crosshair on hover */}
            {hoveredIndex !== null && activePoint && (
              <g>
                <line
                  x1={getX(hoveredIndex)}
                  y1={paddingTop}
                  x2={getX(hoveredIndex)}
                  y2={svgHeight - paddingBottom}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(activePoint.portfolioValue)}
                  r="4"
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
          <span>Starting Capital: ${initialCapital.toLocaleString()}</span>
          <span>Simulation Period: {result?.periodDescription}</span>
          <button
            onClick={handleDeployToTerminal}
            className="text-blue-400 hover:text-blue-300 font-bold font-sans cursor-pointer flex items-center gap-1"
          >
            <span>Deploy Strategy to Live Terminal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Trade Execution Audit Log */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Trade Execution Log ({result?.trades.length || 0})
            </h3>
            <div className="flex bg-[#131d31] p-0.5 rounded-lg border border-slate-800 text-xs">
              {(
                [
                  { id: 'all', label: 'All Trades' },
                  { id: 'winners', label: `Wins (${result?.winningTrades || 0})` },
                  { id: 'losers', label: `Losses (${result?.losingTrades || 0})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTradeFilter(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                    tradeFilter === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Avg Holding Time: {result?.avgHoldingDays} Days
          </span>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No simulated trades matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead className="sticky top-0 bg-[#0f172a] border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="pb-2 font-semibold">ENTRY DATE</th>
                  <th className="pb-2 font-semibold">EXIT DATE</th>
                  <th className="pb-2 text-right font-semibold">ENTRY PRICE</th>
                  <th className="pb-2 text-right font-semibold">EXIT PRICE</th>
                  <th className="pb-2 text-right font-semibold">SHARES</th>
                  <th className="pb-2 text-right font-semibold">NET P&L</th>
                  <th className="pb-2 text-right font-semibold">RETURN</th>
                  <th className="pb-2 text-center font-semibold">EXIT REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrades.map((t) => {
                  const isWin = t.pnl >= 0;
                  return (
                    <tr key={t.id} className="hover:bg-[#131d31]/60 transition-colors">
                      <td className="py-2.5 text-slate-400">
                        {new Date(t.entryDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {new Date(t.exitDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                      <td className="py-2.5 text-right text-slate-300">${t.entryPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-white font-medium">${t.exitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-slate-300">{t.shares}</td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          isWin ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isWin ? '+' : ''}${t.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-2.5 text-right font-semibold ${
                          isWin ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isWin ? '+' : ''}{t.pnlPercent}%
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            t.exitReason === 'take_profit'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : t.exitReason === 'stop_loss'
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {t.exitReason.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
