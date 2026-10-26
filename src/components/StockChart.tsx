import React, { useState, useMemo, useRef } from 'react';
import { useTrading } from '../context/TradingContext';
import { Candle } from '../types/market';
import {
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  Eye,
  Maximize2,
  Target,
  ShieldAlert,
} from 'lucide-react';

export const StockChart: React.FC = () => {
  const {
    selectedStock,
    candles,
    timeframe,
    setTimeframe,
    chartType,
    setChartType,
    showSMA,
    setShowSMA,
    showEMA,
    setShowEMA,
    showRSI,
    setShowRSI,
    showVolume,
    setShowVolume,
    positions,
    orders,
    setQuickTradePrefill,
  } = useTrading();

  const [showBracketLines, setShowBracketLines] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPosition = positions[selectedStock.symbol];

  const handleQuickTrade = (side: 'buy' | 'sell') => {
    setQuickTradePrefill({
      symbol: selectedStock.symbol,
      side,
      price: selectedStock.price,
    });
  };

  // Calculate technical indicators
  const indicatorData = useMemo(() => {
    if (!candles || candles.length === 0) return { sma: [], ema: [], rsi: [] };

    // SMA (20 or period based on count)
    const smaPeriod = Math.min(14, Math.floor(candles.length / 3));
    const sma: (number | null)[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < smaPeriod - 1) {
        sma.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < smaPeriod; j++) {
          sum += candles[i - j].close;
        }
        sma.push(Number((sum / smaPeriod).toFixed(2)));
      }
    }

    // EMA (10 period)
    const emaPeriod = Math.min(9, Math.floor(candles.length / 4));
    const k = 2 / (emaPeriod + 1);
    const ema: (number | null)[] = [];
    let prevEma: number | null = null;
    for (let i = 0; i < candles.length; i++) {
      if (i < emaPeriod - 1) {
        ema.push(null);
      } else if (prevEma === null) {
        let sum = 0;
        for (let j = 0; j < emaPeriod; j++) sum += candles[i - j].close;
        prevEma = sum / emaPeriod;
        ema.push(Number(prevEma.toFixed(2)));
      } else {
        prevEma = candles[i].close * k + prevEma * (1 - k);
        ema.push(Number(prevEma.toFixed(2)));
      }
    }

    // RSI (14 period)
    const rsiPeriod = 14;
    const rsi: (number | null)[] = [];
    let gains = 0;
    let losses = 0;
    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        rsi.push(null);
        continue;
      }
      const change = candles[i].close - candles[i - 1].close;
      if (i <= rsiPeriod) {
        if (change >= 0) gains += change;
        else losses += Math.abs(change);
        if (i === rsiPeriod) {
          const avgGain = gains / rsiPeriod;
          const avgLoss = losses / rsiPeriod;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          rsi.push(Number((100 - 100 / (1 + rs)).toFixed(1)));
        } else {
          rsi.push(null);
        }
      } else {
        const curGain = change >= 0 ? change : 0;
        const curLoss = change < 0 ? Math.abs(change) : 0;
        gains = (gains * (rsiPeriod - 1) + curGain) / rsiPeriod;
        losses = (losses * (rsiPeriod - 1) + curLoss) / rsiPeriod;
        const rs = losses === 0 ? 100 : gains / losses;
        rsi.push(Number((100 - 100 / (1 + rs)).toFixed(1)));
      }
    }

    return { sma, ema, rsi };
  }, [candles]);

  // Chart coordinate geometry
  const width = 840;
  const height = showRSI ? 380 : 330;
  const paddingRight = 65;
  const paddingLeft = 12;
  const paddingTop = 20;
  const paddingBottom = showRSI ? 90 : 30;
  const rsiHeight = 60;
  const rsiTop = height - paddingBottom + 20;

  const chartInnerWidth = width - paddingLeft - paddingRight;
  const chartInnerHeight = height - paddingTop - paddingBottom;

  // Extents
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (!candles || candles.length === 0) return { minPrice: 100, maxPrice: 110, maxVolume: 10000 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    if (showBracketLines && currentPosition) {
      if (currentPosition.takeProfitPrice && currentPosition.takeProfitPrice > 0) {
        max = Math.max(max, currentPosition.takeProfitPrice);
        min = Math.min(min, currentPosition.takeProfitPrice);
      }
      if (currentPosition.stopLossPrice && currentPosition.stopLossPrice > 0) {
        min = Math.min(min, currentPosition.stopLossPrice);
        max = Math.max(max, currentPosition.stopLossPrice);
      }
      if (currentPosition.avgCost && currentPosition.avgCost > 0) {
        min = Math.min(min, currentPosition.avgCost);
        max = Math.max(max, currentPosition.avgCost);
      }
    }

    const spread = max - min || 1;
    return {
      minPrice: min - spread * 0.05,
      maxPrice: max + spread * 0.05,
      maxVolume: maxVol || 1,
    };
  }, [candles, showBracketLines, currentPosition]);

  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => {
    return paddingTop + chartInnerHeight * (1 - (price - minPrice) / priceRange);
  };

  const getX = (index: number) => {
    if (candles.length <= 1) return paddingLeft + chartInnerWidth / 2;
    return paddingLeft + (index / (candles.length - 1)) * chartInnerWidth;
  };

  const candleWidth = useMemo(() => {
    if (candles.length === 0) return 6;
    const available = chartInnerWidth / candles.length;
    return Math.max(2, Math.min(14, available * 0.65));
  }, [candles.length, chartInnerWidth]);

  // Active inspected candle
  const activeCandle = hoveredIndex !== null && candles[hoveredIndex]
    ? candles[hoveredIndex]
    : candles[candles.length - 1];

  const activeIndex = hoveredIndex !== null ? hoveredIndex : candles.length - 1;

  // Path generators for line chart and indicators
  const linePath = useMemo(() => {
    if (candles.length === 0) return '';
    return candles.reduce((acc, c, idx) => {
      const x = getX(idx);
      const y = getY(c.close);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, minPrice, priceRange, chartInnerHeight]);

  const areaPath = useMemo(() => {
    if (candles.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(candles.length - 1);
    const bottomY = paddingTop + chartInnerHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, candles, chartInnerHeight]);

  const smaPath = useMemo(() => {
    if (!showSMA) return '';
    let path = '';
    indicatorData.sma.forEach((val, idx) => {
      if (val === null) return;
      const x = getX(idx);
      const y = getY(val);
      path = path === '' ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    });
    return path;
  }, [showSMA, indicatorData.sma, minPrice, priceRange, chartInnerHeight]);

  const emaPath = useMemo(() => {
    if (!showEMA) return '';
    let path = '';
    indicatorData.ema.forEach((val, idx) => {
      if (val === null) return;
      const x = getX(idx);
      const y = getY(val);
      path = path === '' ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    });
    return path;
  }, [showEMA, indicatorData.ema, minPrice, priceRange, chartInnerHeight]);

  const rsiPath = useMemo(() => {
    if (!showRSI) return '';
    let path = '';
    indicatorData.rsi.forEach((val, idx) => {
      if (val === null) return;
      const x = getX(idx);
      const y = rsiTop + rsiHeight * (1 - val / 100);
      path = path === '' ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    });
    return path;
  }, [showRSI, indicatorData.rsi, rsiTop, rsiHeight]);

  // Price axis grid lines
  const priceGridTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const price = minPrice + (priceRange * i) / count;
      const y = getY(price);
      ticks.push({ price, y });
    }
    return ticks;
  }, [minPrice, priceRange, chartInnerHeight]);

  // Mouse handler for hover crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || candles.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * width;

    // Calculate nearest candle index
    const boundedX = Math.max(paddingLeft, Math.min(paddingLeft + chartInnerWidth, relativeX));
    const ratio = (boundedX - paddingLeft) / chartInnerWidth;
    const index = Math.round(ratio * (candles.length - 1));
    setHoveredIndex(Math.max(0, Math.min(candles.length - 1, index)));
  };

  const isUp = selectedStock.change >= 0;

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 flex flex-col p-4 w-full">
      {/* Stock Header & Timeframe / Indicator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {selectedStock.symbol}
              </h2>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {selectedStock.name}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                {selectedStock.sector}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                ${selectedStock.price.toFixed(2)}
              </span>
              <span
                className={`text-sm font-semibold font-mono tabular-nums flex items-center gap-1 ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? '+' : ''}
                {selectedStock.change.toFixed(2)} ({isUp ? '+' : ''}
                {selectedStock.changePercent.toFixed(2)}%)
              </span>
            </div>

            {/* Live Owned Position Details */}
            {currentPosition && (
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono tabular-nums text-slate-300">
                <span className="text-emerald-400 font-semibold">
                  Holding {currentPosition.shares} shares (${currentPosition.marketValue.toFixed(2)})
                </span>
                <span className="text-slate-400">·</span>
                <span className={currentPosition.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  P&L: {currentPosition.unrealizedPnL >= 0 ? '+' : ''}${currentPosition.unrealizedPnL.toFixed(2)} ({currentPosition.unrealizedPnL >= 0 ? '+' : ''}{currentPosition.unrealizedPnLPercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {/* Quick Trade Triggers */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              onClick={() => handleQuickTrade('buy')}
              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors cursor-pointer"
            >
              Buy {selectedStock.symbol}
            </button>
            <button
              onClick={() => handleQuickTrade('sell')}
              className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-md transition-colors cursor-pointer"
            >
              Sell {selectedStock.symbol}
            </button>
          </div>
        </div>

        {/* Chart controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe switch */}
          <div className="flex items-center bg-[#131d31] p-0.5 rounded-lg border border-slate-800">
            {(['1D', '1W', '1M', '1Y', '5Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart type switch */}
          <div className="flex items-center bg-[#131d31] p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartType('candle')}
              className={`p-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                chartType === 'candle'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Area Line Chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Overlays toggles */}
          <div className="flex items-center gap-1.5 bg-[#131d31] px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium text-[11px] transition-colors cursor-pointer ${
                showSMA ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="20-period Simple Moving Average"
            >
              SMA20
            </button>
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium text-[11px] transition-colors cursor-pointer ${
                showEMA ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="10-period Exponential Moving Average"
            >
              EMA10
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium text-[11px] transition-colors cursor-pointer ${
                showRSI ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Relative Strength Index (14)"
            >
              RSI
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium text-[11px] transition-colors cursor-pointer ${
                showVolume ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Trading Volume"
            >
              VOL
            </button>
            <button
              onClick={() => setShowBracketLines(!showBracketLines)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                showBracketLines ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Visual TP/SL Bracket Levels"
            >
              <Target className="w-3 h-3" />
              <span>TP/SL</span>
            </button>
          </div>
        </div>
      </div>

      {/* OHLCV Live / Hover Inspector */}
      {activeCandle && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-xs font-mono tabular-nums text-slate-400 border-b border-slate-800/40">
          <div>
            <span className="text-slate-400 mr-1.5">TIME:</span>
            <span className="text-white font-medium">
              {new Date(activeCandle.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 mr-1.5">O:</span>
            <span className="text-white font-medium">${activeCandle.open.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 mr-1.5">H:</span>
            <span className="text-emerald-400 font-medium">${activeCandle.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 mr-1.5">L:</span>
            <span className="text-rose-400 font-medium">${activeCandle.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 mr-1.5">C:</span>
            <span className={`font-semibold ${activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${activeCandle.close.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 mr-1.5">VOL:</span>
            <span className="text-slate-300 font-medium">{activeCandle.volume.toLocaleString()}</span>
          </div>
          {showRSI && indicatorData.rsi[activeIndex] !== null && (
            <div>
              <span className="text-cyan-400 mr-1.5">RSI(14):</span>
              <span className="text-cyan-300 font-semibold">{indicatorData.rsi[activeIndex]}</span>
            </div>
          )}
        </div>
      )}

      {/* Interactive SVG Chart Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[330px] sm:h-[380px] mt-2 select-none"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {priceGridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={width - paddingRight + 8}
                y={tick.y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono"
                className="tabular-nums font-mono select-none"
              >
                ${tick.price.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Volume sub-bars at chart base */}
          {showVolume &&
            candles.map((c, i) => {
              const x = getX(i) - candleWidth / 2;
              const volRatio = c.volume / maxVolume;
              const barH = volRatio * 45;
              const y = paddingTop + chartInnerHeight - barH;
              const isGreen = c.close >= c.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={barH}
                  fill={isGreen ? '#10b981' : '#f43f5e'}
                  opacity="0.22"
                />
              );
            })}

          {/* Line Chart mode */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#chartGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Candlestick Chart mode */}
          {chartType === 'candle' &&
            candles.map((c, i) => {
              const x = getX(i);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const isGreen = c.close >= c.open;
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
              const color = isGreen ? '#10b981' : '#f43f5e';

              return (
                <g key={`candle-${i}`}>
                  {/* High - Low wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Body rectangle */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })}

          {/* Technical indicator lines */}
          {showSMA && smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}

          {showEMA && emaPath && (
            <path
              d={emaPath}
              fill="none"
              stroke="#c084fc"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}

          {/* Bracket Order (TP & SL) and Working Orders Overlay Lines */}
          {showBracketLines && currentPosition && (
            <g>
              {/* 1. Entry Price Reference Line */}
              {currentPosition.avgCost && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(currentPosition.avgCost)}
                    x2={width - paddingRight}
                    y2={getY(currentPosition.avgCost)}
                    stroke="#3b82f6"
                    strokeDasharray="4 3"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                  <rect
                    x={paddingLeft + 6}
                    y={getY(currentPosition.avgCost) - 8}
                    width="84"
                    height="16"
                    fill="#1e3a8a"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    rx="3"
                  />
                  <text
                    x={paddingLeft + 11}
                    y={getY(currentPosition.avgCost) + 3}
                    fill="#bfdbfe"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    ENTRY ${currentPosition.avgCost.toFixed(2)}
                  </text>
                  <rect
                    x={width - paddingRight + 2}
                    y={getY(currentPosition.avgCost) - 8}
                    width="56"
                    height="16"
                    fill="#1e3a8a"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    rx="2"
                  />
                  <text
                    x={width - paddingRight + 6}
                    y={getY(currentPosition.avgCost) + 3}
                    fill="#bfdbfe"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    ${currentPosition.avgCost.toFixed(2)}
                  </text>
                </g>
              )}

              {/* 2. Take-Profit (TP) Target Line */}
              {currentPosition.takeProfitPrice && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(currentPosition.takeProfitPrice)}
                    x2={width - paddingRight}
                    y2={getY(currentPosition.takeProfitPrice)}
                    stroke="#10b981"
                    strokeDasharray="5 3"
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                  <rect
                    x={paddingLeft + 6}
                    y={getY(currentPosition.takeProfitPrice) - 9}
                    width="96"
                    height="18"
                    fill="#064e3b"
                    stroke="#10b981"
                    strokeWidth="1"
                    rx="3"
                  />
                  <text
                    x={paddingLeft + 11}
                    y={getY(currentPosition.takeProfitPrice) + 3}
                    fill="#6ee7b7"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    🎯 TP ${currentPosition.takeProfitPrice.toFixed(2)}
                  </text>
                  <rect
                    x={width - paddingRight + 2}
                    y={getY(currentPosition.takeProfitPrice) - 9}
                    width="56"
                    height="18"
                    fill="#064e3b"
                    stroke="#10b981"
                    strokeWidth="1"
                    rx="2"
                  />
                  <text
                    x={width - paddingRight + 6}
                    y={getY(currentPosition.takeProfitPrice) + 3}
                    fill="#6ee7b7"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    ${currentPosition.takeProfitPrice.toFixed(2)}
                  </text>
                </g>
              )}

              {/* 3. Stop-Loss (SL) Floor Line */}
              {currentPosition.stopLossPrice && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={getY(currentPosition.stopLossPrice)}
                    x2={width - paddingRight}
                    y2={getY(currentPosition.stopLossPrice)}
                    stroke="#f43f5e"
                    strokeDasharray="5 3"
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                  <rect
                    x={paddingLeft + 6}
                    y={getY(currentPosition.stopLossPrice) - 9}
                    width="96"
                    height="18"
                    fill="#881337"
                    stroke="#f43f5e"
                    strokeWidth="1"
                    rx="3"
                  />
                  <text
                    x={paddingLeft + 11}
                    y={getY(currentPosition.stopLossPrice) + 3}
                    fill="#fca5a5"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    🛡️ SL ${currentPosition.stopLossPrice.toFixed(2)}
                  </text>
                  <rect
                    x={width - paddingRight + 2}
                    y={getY(currentPosition.stopLossPrice) - 9}
                    width="56"
                    height="18"
                    fill="#881337"
                    stroke="#f43f5e"
                    strokeWidth="1"
                    rx="2"
                  />
                  <text
                    x={width - paddingRight + 6}
                    y={getY(currentPosition.stopLossPrice) + 3}
                    fill="#fca5a5"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    ${currentPosition.stopLossPrice.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Pending Working Orders on this chart */}
          {showBracketLines && orders &&
            orders
              .filter((o) => o.status === 'pending' && o.symbol === selectedStock.symbol)
              .map((o) => {
                const triggerPrice = o.limitPrice || o.stopPrice;
                if (!triggerPrice) return null;
                const y = getY(triggerPrice);
                return (
                  <g key={`chart-order-${o.id}`}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                      opacity="0.75"
                    />
                    <rect
                      x={paddingLeft + 6}
                      y={y - 8}
                      width="106"
                      height="16"
                      fill="#451a03"
                      stroke="#f59e0b"
                      strokeWidth="1"
                      rx="2"
                    />
                    <text
                      x={paddingLeft + 10}
                      y={y + 3}
                      fill="#fde68a"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                    >
                      WORKING {o.side.toUpperCase()} ${triggerPrice.toFixed(2)}
                    </text>
                  </g>
                );
              })}

          {/* RSI Sub-Panel */}
          {showRSI && (
            <g>
              {/* Divider */}
              <line
                x1={paddingLeft}
                y1={rsiTop - 10}
                x2={width - paddingRight}
                y2={rsiTop - 10}
                stroke="#334155"
                strokeWidth="1"
              />
              {/* Threshold lines: 70 Overbought and 30 Oversold */}
              <line
                x1={paddingLeft}
                y1={rsiTop + rsiHeight * 0.3}
                x2={width - paddingRight}
                y2={rsiTop + rsiHeight * 0.3}
                stroke="#dc2626"
                strokeDasharray="2 2"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1={paddingLeft}
                y1={rsiTop + rsiHeight * 0.7}
                x2={width - paddingRight}
                y2={rsiTop + rsiHeight * 0.7}
                stroke="#16a34a"
                strokeDasharray="2 2"
                strokeWidth="1"
                opacity="0.5"
              />
              <text
                x={width - paddingRight + 8}
                y={rsiTop + rsiHeight * 0.3 + 3}
                fill="#f87171"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                70
              </text>
              <text
                x={width - paddingRight + 8}
                y={rsiTop + rsiHeight * 0.7 + 3}
                fill="#4ade80"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                30
              </text>
              {/* RSI Curve */}
              {rsiPath && (
                <path
                  d={rsiPath}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          )}

          {/* Hover Crosshair */}
          {hoveredIndex !== null && activeCandle && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={height - 20}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Horizontal line at close price */}
              <line
                x1={paddingLeft}
                y1={getY(activeCandle.close)}
                x2={width - paddingRight}
                y2={getY(activeCandle.close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Target dot on candle */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(activeCandle.close)}
                r="3.5"
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {/* Price badge on right axis */}
              <rect
                x={width - paddingRight + 2}
                y={getY(activeCandle.close) - 9}
                width="56"
                height="18"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="1"
                rx="3"
              />
              <text
                x={width - paddingRight + 6}
                y={getY(activeCandle.close) + 3}
                fill="#ffffff"
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
              >
                ${activeCandle.close.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Chart Footer Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
            <span>Price (USD)</span>
          </span>
          {showSMA && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400 rounded-full" />
              <span>SMA (20)</span>
            </span>
          )}
          {showEMA && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-purple-400 rounded-full" />
              <span>EMA (10)</span>
            </span>
          )}
          {showRSI && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" />
              <span>RSI (14)</span>
            </span>
          )}
          {showBracketLines && currentPosition && currentPosition.takeProfitPrice && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full" />
              <span>TP (${currentPosition.takeProfitPrice.toFixed(2)})</span>
            </span>
          )}
          {showBracketLines && currentPosition && currentPosition.stopLossPrice && (
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-500 rounded-full" />
              <span>SL (${currentPosition.stopLossPrice.toFixed(2)})</span>
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          52W Range: ${selectedStock.fiftyTwoWeekLow.toFixed(2)} - ${selectedStock.fiftyTwoWeekHigh.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
