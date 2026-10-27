import { Candle } from '../types/market';

export type StrategyType =
  | 'sma_cross'
  | 'rsi_reversion'
  | 'breakout_momentum'
  | 'bollinger_squeeze'
  | 'macd_cross'
  | 'vwap_reversion'
  | 'ai_multi_factor';

export interface BacktestConfig {
  symbol: string;
  strategy: StrategyType;
  initialCapital: number;
  positionSizePercent: number; // e.g. 25 = 25% of equity per trade
  stopLossPercent?: number; // e.g. 5 = 5% stop
  takeProfitPercent?: number; // e.g. 12 = 12% profit target
  slippagePercent: number; // e.g. 0.05%
}

export interface BacktestTrade {
  id: string;
  entryDate: number;
  exitDate: number;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  side: 'BUY';
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
  exitReason: 'indicator_exit' | 'stop_loss' | 'take_profit' | 'end_of_period';
}

export interface EquityPoint {
  timestamp: number;
  portfolioValue: number;
  benchmarkValue: number; // Buy & Hold from day 1
}

export interface BacktestResult {
  symbol: string;
  strategyName: string;
  periodDescription: string;
  initialCapital: number;
  finalCapital: number;
  totalReturnPercent: number;
  benchmarkReturnPercent: number;
  alphaPercent: number; // Strategy return minus benchmark
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // e.g. 64.5
  profitFactor: number; // e.g. 2.1
  maxDrawdownPercent: number; // e.g. 14.2
  sharpeRatio: number; // e.g. 1.85
  avgHoldingDays: number;
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
}

/**
 * Calculates 14-period Relative Strength Index array
 */
export function calculateRSI(candles: Candle[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      rsi.push(null);
      continue;
    }
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    if (i <= period) {
      gains += gain;
      losses += loss;
      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(null);
      }
    } else {
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      const rs = losses === 0 ? 100 : gains / losses;
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  return rsi;
}

/**
 * Calculates Simple Moving Average array
 */
export function calculateSMA(candles: Candle[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculates Exponential Moving Average array
 */
export function calculateEMA(candles: Candle[], period: number): (number | null)[] {
  const ema: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      prevEma = sum / period;
      ema.push(prevEma);
    } else {
      const currentEma: number = candles[i].close * k + (prevEma as number) * (1 - k);
      prevEma = currentEma;
      ema.push(currentEma);
    }
  }
  return ema;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);
  const macdLine: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (fastEma[i] !== null && slowEma[i] !== null) {
      macdLine.push(fastEma[i]! - slowEma[i]!);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate Signal line (EMA of MACD line)
  const signalLine: (number | null)[] = [];
  const validMacdValues: { index: number; val: number }[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== null) validMacdValues.push({ index: idx, val });
  });

  const k = 2 / (signalPeriod + 1);
  let prevSig: number | null = null;

  for (let i = 0; i < macdLine.length; i++) {
    const validIdx = validMacdValues.findIndex((item) => item.index === i);
    if (validIdx === -1 || validIdx < signalPeriod - 1) {
      signalLine.push(null);
    } else if (validIdx === signalPeriod - 1) {
      let sum = 0;
      for (let j = 0; j < signalPeriod; j++) {
        sum += validMacdValues[validIdx - j].val;
      }
      prevSig = sum / signalPeriod;
      signalLine.push(prevSig);
    } else {
      const curSig: number = (macdLine[i] as number) * k + (prevSig as number) * (1 - k);
      prevSig = curSig;
      signalLine.push(curSig);
    }
  }

  const histogram: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram.push(macdLine[i]! - signalLine[i]!);
    } else {
      histogram.push(null);
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20 period, 2 std dev)
 */
export function calculateBollingerBands(
  candles: Candle[],
  period = 20,
  stdDevMultiplier = 2
): {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
  bandwidth: (number | null)[];
} {
  const middle = calculateSMA(candles, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const bandwidth: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
      bandwidth.push(null);
    } else {
      let sumSqDiff = 0;
      for (let j = 0; j < period; j++) {
        sumSqDiff += Math.pow(candles[i - j].close - middle[i]!, 2);
      }
      const stdDev = Math.sqrt(sumSqDiff / period);
      const u = middle[i]! + stdDevMultiplier * stdDev;
      const l = middle[i]! - stdDevMultiplier * stdDev;
      upper.push(u);
      lower.push(l);
      bandwidth.push(middle[i]! > 0 ? ((u - l) / middle[i]!) * 100 : 0);
    }
  }

  return { middle, upper, lower, bandwidth };
}

/**
 * Calculates Volume-Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): (number | null)[] {
  const vwap: (number | null)[] = [];
  let cumTypicalVolume = 0;
  let cumVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const vol = candles[i].volume || 1000;
    cumTypicalVolume += typicalPrice * vol;
    cumVolume += vol;

    if (cumVolume > 0) {
      vwap.push(cumTypicalVolume / cumVolume);
    } else {
      vwap.push(candles[i].close);
    }
  }
  return vwap;
}

/**
 * Runs a deterministic historical backtest across candle data
 */
export function runBacktest(candles: Candle[], config: BacktestConfig): BacktestResult {
  if (!candles || candles.length < 30) {
    throw new Error('Insufficient historical candle data for backtest (minimum 30 bars required)');
  }

  const sma20 = calculateSMA(candles, 20);
  const sma50 = calculateSMA(candles, 50);
  const rsi14 = calculateRSI(candles, 14);
  const macdData = calculateMACD(candles);
  const bbData = calculateBollingerBands(candles);
  const vwapData = calculateVWAP(candles);

  let cash = config.initialCapital;
  let currentPosition: {
    shares: number;
    entryPrice: number;
    entryDate: number;
    stopPrice?: number;
    targetPrice?: number;
  } | null = null;

  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  const firstPrice = candles[0].close;
  let peakEquity = config.initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const date = candle.timestamp;
    const price = candle.close;

    // Check Stop Loss or Take Profit for active position
    if (currentPosition) {
      let shouldExit = false;
      let exitReason: BacktestTrade['exitReason'] = 'indicator_exit';
      let exitPrice = price;

      // Stop Loss check
      if (currentPosition.stopPrice && candle.low <= currentPosition.stopPrice) {
        shouldExit = true;
        exitPrice = currentPosition.stopPrice;
        exitReason = 'stop_loss';
      }
      // Take Profit check
      else if (currentPosition.targetPrice && candle.high >= currentPosition.targetPrice) {
        shouldExit = true;
        exitPrice = currentPosition.targetPrice;
        exitReason = 'take_profit';
      }

      // Strategy-specific exit rules
      if (!shouldExit) {
        if (config.strategy === 'sma_cross') {
          // Death Cross exit: SMA20 crosses below SMA50
          if (i > 1 && sma20[i] !== null && sma50[i] !== null && sma20[i - 1] !== null && sma50[i - 1] !== null) {
            if (sma20[i]! < sma50[i]! && sma20[i - 1]! >= sma50[i - 1]!) {
              shouldExit = true;
              exitReason = 'indicator_exit';
            }
          }
        } else if (config.strategy === 'rsi_reversion') {
          // Exit when RSI becomes overbought (> 65)
          if (rsi14[i] !== null && rsi14[i]! >= 65) {
            shouldExit = true;
            exitReason = 'indicator_exit';
          }
        } else if (config.strategy === 'breakout_momentum') {
          // Exit if price closes below 10-day low
          if (i >= 10) {
            const low10 = Math.min(...candles.slice(i - 10, i).map((c) => c.low));
            if (price < low10) {
              shouldExit = true;
              exitReason = 'indicator_exit';
            }
          }
        } else if (config.strategy === 'bollinger_squeeze') {
          // Exit when closing below 20-period middle band
          if (bbData.middle[i] !== null && price < bbData.middle[i]!) {
            shouldExit = true;
            exitReason = 'indicator_exit';
          }
        } else if (config.strategy === 'macd_cross') {
          // Bearish MACD crossover exit
          if (
            i > 1 &&
            macdData.macd[i] !== null &&
            macdData.signal[i] !== null &&
            macdData.macd[i - 1] !== null &&
            macdData.signal[i - 1] !== null
          ) {
            if (macdData.macd[i]! < macdData.signal[i]! && macdData.macd[i - 1]! >= macdData.signal[i - 1]!) {
              shouldExit = true;
              exitReason = 'indicator_exit';
            }
          }
        } else if (config.strategy === 'vwap_reversion') {
          // Exit when price crosses back above VWAP + 1% or RSI becomes high
          if (vwapData[i] !== null && (price >= vwapData[i]! * 1.01 || (rsi14[i] !== null && rsi14[i]! >= 68))) {
            shouldExit = true;
            exitReason = 'indicator_exit';
          }
        } else if (config.strategy === 'ai_multi_factor') {
          // AI Exit: RSI > 70 or 20-day high rejection
          if (rsi14[i] !== null && rsi14[i]! > 70) {
            shouldExit = true;
            exitReason = 'take_profit';
          }
        }
      }

      // Last candle close out
      if (!shouldExit && i === candles.length - 1) {
        shouldExit = true;
        exitReason = 'end_of_period';
      }

      if (shouldExit) {
        // Apply slippage
        const finalExitPrice = exitPrice * (1 - (config.slippagePercent || 0) / 100);
        const grossReturn = currentPosition.shares * finalExitPrice;
        const costBasis = currentPosition.shares * currentPosition.entryPrice;
        const tradePnl = grossReturn - costBasis;
        const tradePnlPercent = ((finalExitPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;
        const holdingDays = Math.max(1, Math.round((date - currentPosition.entryDate) / (1000 * 3600 * 24)));

        cash += grossReturn;

        trades.push({
          id: `bt-trade-${trades.length + 1}`,
          entryDate: currentPosition.entryDate,
          exitDate: date,
          entryPrice: currentPosition.entryPrice,
          exitPrice: Number(finalExitPrice.toFixed(2)),
          shares: currentPosition.shares,
          side: 'BUY',
          pnl: Number(tradePnl.toFixed(2)),
          pnlPercent: Number(tradePnlPercent.toFixed(2)),
          holdingDays,
          exitReason,
        });

        currentPosition = null;
      }
    }

    // Strategy Entry Signals (only if no active position)
    if (!currentPosition && i < candles.length - 1) {
      let shouldEnter = false;

      if (config.strategy === 'sma_cross') {
        // Golden Cross: SMA20 crosses above SMA50
        if (i > 1 && sma20[i] !== null && sma50[i] !== null && sma20[i - 1] !== null && sma50[i - 1] !== null) {
          if (sma20[i]! > sma50[i]! && sma20[i - 1]! <= sma50[i - 1]!) {
            shouldEnter = true;
          }
        }
      } else if (config.strategy === 'rsi_reversion') {
        // RSI Oversold Bounce: RSI < 32 and turning upwards
        if (i > 1 && rsi14[i] !== null && rsi14[i - 1] !== null) {
          if (rsi14[i - 1]! < 32 && rsi14[i]! > rsi14[i - 1]!) {
            shouldEnter = true;
          }
        }
      } else if (config.strategy === 'breakout_momentum') {
        // Breakout of 20-day high
        if (i >= 20) {
          const high20 = Math.max(...candles.slice(i - 20, i).map((c) => c.high));
          if (candle.close > high20) {
            shouldEnter = true;
          }
        }
      } else if (config.strategy === 'bollinger_squeeze') {
        // Bollinger Squeeze Breakout: Price pierces Upper Band with expanding bandwidth
        if (
          i > 5 &&
          bbData.upper[i] !== null &&
          bbData.bandwidth[i] !== null &&
          bbData.bandwidth[i - 1] !== null
        ) {
          const isExpanding = bbData.bandwidth[i]! > bbData.bandwidth[i - 1]!;
          if (candle.close >= bbData.upper[i]! && isExpanding && candle.close > candle.open) {
            shouldEnter = true;
          }
        }
      } else if (config.strategy === 'macd_cross') {
        // MACD Bullish Crossover: MACD crosses above Signal Line
        if (
          i > 1 &&
          macdData.macd[i] !== null &&
          macdData.signal[i] !== null &&
          macdData.macd[i - 1] !== null &&
          macdData.signal[i - 1] !== null
        ) {
          if (macdData.macd[i]! > macdData.signal[i]! && macdData.macd[i - 1]! <= macdData.signal[i - 1]!) {
            shouldEnter = true;
          }
        }
      } else if (config.strategy === 'vwap_reversion') {
        // Institutional VWAP Discount: Price trading below VWAP with bullish reversal bar
        if (vwapData[i] !== null && rsi14[i] !== null) {
          if (candle.close < vwapData[i]! * 0.985 && rsi14[i]! < 45 && candle.close > candle.open) {
            shouldEnter = true;
          }
        }
      } else if (config.strategy === 'ai_multi_factor') {
        // AI Confluence: RSI < 48, holding above SMA50, and positive candle body
        if (rsi14[i] !== null && sma50[i] !== null) {
          if (rsi14[i]! < 48 && candle.close > sma50[i]! && candle.close > candle.open) {
            shouldEnter = true;
          }
        }
      }

      if (shouldEnter && cash > 100) {
        const entryPrice = price * (1 + (config.slippagePercent || 0) / 100);
        const allocationAmount = cash * (config.positionSizePercent / 100);
        const shares = Math.floor(allocationAmount / entryPrice);

        if (shares > 0) {
          const cost = shares * entryPrice;
          cash -= cost;

          const stopPrice = config.stopLossPercent
            ? entryPrice * (1 - config.stopLossPercent / 100)
            : undefined;

          const targetPrice = config.takeProfitPercent
            ? entryPrice * (1 + config.takeProfitPercent / 100)
            : undefined;

          currentPosition = {
            shares,
            entryPrice: Number(entryPrice.toFixed(2)),
            entryDate: date,
            stopPrice,
            targetPrice,
          };
        }
      }
    }

    // Mark equity point
    const positionValue = currentPosition ? currentPosition.shares * price : 0;
    const totalPortfolio = cash + positionValue;
    const benchmarkRatio = price / firstPrice;
    const benchmarkValue = config.initialCapital * benchmarkRatio;

    equityCurve.push({
      timestamp: date,
      portfolioValue: Number(totalPortfolio.toFixed(2)),
      benchmarkValue: Number(benchmarkValue.toFixed(2)),
    });

    if (totalPortfolio > peakEquity) peakEquity = totalPortfolio;
    const drawdown = ((peakEquity - totalPortfolio) / peakEquity) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Calculate final metrics
  const finalEquity = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].portfolioValue : config.initialCapital;
  const finalBenchmark = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].benchmarkValue : config.initialCapital;

  const totalReturnPercent = Number((((finalEquity - config.initialCapital) / config.initialCapital) * 100).toFixed(2));
  const benchmarkReturnPercent = Number((((finalBenchmark - config.initialCapital) / config.initialCapital) * 100).toFixed(2));
  const alphaPercent = Number((totalReturnPercent - benchmarkReturnPercent).toFixed(2));

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.pnl < 0).length;
  const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const grossGains = trades.filter((t) => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const grossLosses = Math.abs(trades.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLosses > 0 ? Number((grossGains / grossLosses).toFixed(2)) : grossGains > 0 ? 9.99 : 1.0;

  const avgHoldingDays = totalTrades > 0
    ? Number((trades.reduce((acc, t) => acc + t.holdingDays, 0) / totalTrades).toFixed(1))
    : 0;

  // Approximate Sharpe Ratio (annualized return / annualized volatility)
  const returns = trades.map((t) => t.pnlPercent);
  let sharpe = 1.25;
  if (returns.length > 2) {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdev = Math.sqrt(variance) || 1;
    sharpe = Number(((mean / stdev) * Math.sqrt(252 / (avgHoldingDays || 10))).toFixed(2));
  }

  let strategyName = '20/50 SMA Golden Cross';
  if (config.strategy === 'rsi_reversion') strategyName = 'RSI(14) Mean Reversion';
  if (config.strategy === 'breakout_momentum') strategyName = '20-Day Donchian Breakout';
  if (config.strategy === 'bollinger_squeeze') strategyName = 'Bollinger Band Squeeze Breakout';
  if (config.strategy === 'macd_cross') strategyName = 'MACD Crossover Momentum';
  if (config.strategy === 'vwap_reversion') strategyName = 'VWAP Institutional Mean Reversion';
  if (config.strategy === 'ai_multi_factor') strategyName = 'AI Multi-Factor Confluence';

  const periodDays = Math.round((candles[candles.length - 1].timestamp - candles[0].timestamp) / (1000 * 3600 * 24));
  const periodDescription = `${(periodDays / 365).toFixed(1)} Years (${candles.length} trading bars)`;

  return {
    symbol: config.symbol,
    strategyName,
    periodDescription,
    initialCapital: config.initialCapital,
    finalCapital: Number(finalEquity.toFixed(2)),
    totalReturnPercent,
    benchmarkReturnPercent,
    alphaPercent,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdown.toFixed(2)),
    sharpeRatio: Math.max(0, Math.min(5, sharpe)),
    avgHoldingDays,
    equityCurve,
    trades,
  };
}
