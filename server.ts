import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import YahooFinance from 'yahoo-finance2';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// In-memory cache for quotes and candles
const cache: {
  quotes: { timestamp: number; data: any } | null;
  candles: Record<string, { timestamp: number; data: any }>;
} = {
  quotes: null,
  candles: {},
};

const TRACKED_SYMBOLS = [
  'NVDA',
  'AAPL',
  'MSFT',
  'TSLA',
  'GOOGL',
  'AMZN',
  'META',
  'AMD',
  'SPY',
  'QQQ',
  'BTC-USD',
  'ETH-USD',
  'JPM',
  'COIN',
  'LLY',
];

// Helper to normalize Yahoo quote to our StockQuote format
function normalizeQuote(q: any) {
  const price = q.regularMarketPrice || q.postMarketPrice || q.preMarketPrice || 100;
  const change = q.regularMarketChange || 0;
  const changePercent = q.regularMarketChangePercent || 0;

  return {
    symbol: q.symbol,
    name: q.shortName || q.longName || q.displayName || q.symbol,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    open: Number((q.regularMarketOpen || price).toFixed(2)),
    high: Number((q.regularMarketDayHigh || price * 1.01).toFixed(2)),
    low: Number((q.regularMarketDayLow || price * 0.99).toFixed(2)),
    previousClose: Number((q.regularMarketPreviousClose || price - change).toFixed(2)),
    volume: q.regularMarketVolume || 10000000,
    marketCap: q.marketCap || 10000000000,
    peRatio: q.trailingPE ? Number(q.trailingPE.toFixed(1)) : undefined,
    fiftyTwoWeekHigh: Number((q.fiftyTwoWeekHigh || price * 1.2).toFixed(2)),
    fiftyTwoWeekLow: Number((q.fiftyTwoWeekLow || price * 0.8).toFixed(2)),
    isRealTime: true,
  };
}

// 0. Healthcheck & Telemetry Endpoint (for Cloud Run / container orchestrator probes)
app.get(['/healthz', '/api/health'], (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    service: 'TATM - Trade Against the Machine',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now(),
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    },
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    cache: {
      quotesCached: !!cache.quotes,
      cachedCandleSeriesCount: Object.keys(cache.candles).length,
    },
  });
});

// 1. Batch Real-World Quotes API
app.get('/api/market/quotes', async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    // Cache for 12 seconds to prevent rate-limiting while providing fresh data
    if (cache.quotes && now - cache.quotes.timestamp < 12000) {
      return res.json({ success: true, source: 'cache', data: cache.quotes.data });
    }

    const quotesPromise = TRACKED_SYMBOLS.map(async (symbol) => {
      try {
        const quote = await yf.quote(symbol);
        return normalizeQuote(quote);
      } catch (err) {
        return null;
      }
    });

    const results = await Promise.all(quotesPromise);
    const validQuotes = results.filter(Boolean);

    if (validQuotes.length > 0) {
      const dataMap = validQuotes.reduce((acc: any, item: any) => {
        acc[item.symbol] = item;
        return acc;
      }, {});

      cache.quotes = { timestamp: now, data: dataMap };
      return res.json({ success: true, source: 'live', data: dataMap });
    }

    return res.json({ success: false, message: 'Could not fetch live quotes' });
  } catch (error: any) {
    console.error('Error fetching real-time quotes:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Real-World Historical Candlestick Chart Data API
app.get('/api/market/candles/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1D';
    const cacheKey = `${symbol}_${timeframe}`;
    const now = Date.now();

    // Cache candles for 60 seconds
    if (cache.candles[cacheKey] && now - cache.candles[cacheKey].timestamp < 60000) {
      return res.json({ success: true, source: 'cache', data: cache.candles[cacheKey].data });
    }

    let period1: Date;
    let interval: '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo' = '1d';

    if (timeframe === '1D') {
      period1 = new Date(now - 2 * 24 * 3600 * 1000); // 2 days for intraday
      interval = '5m';
    } else if (timeframe === '1W') {
      period1 = new Date(now - 7 * 24 * 3600 * 1000);
      interval = '15m';
    } else if (timeframe === '1M') {
      period1 = new Date(now - 30 * 24 * 3600 * 1000);
      interval = '1d';
    } else if (timeframe === '1Y') {
      period1 = new Date(now - 365 * 24 * 3600 * 1000);
      interval = '1d';
    } else {
      // 5Y
      period1 = new Date(now - 5 * 365 * 24 * 3600 * 1000);
      interval = '1wk';
    }

    const chartResult = await yf.chart(symbol, {
      period1,
      interval,
    });

    if (chartResult && chartResult.quotes && chartResult.quotes.length > 0) {
      const candles = chartResult.quotes
        .filter((q: any) => q.open && q.close && q.high && q.low)
        .map((q: any) => ({
          timestamp: new Date(q.date).getTime(),
          open: Number(q.open.toFixed(2)),
          high: Number(q.high.toFixed(2)),
          low: Number(q.low.toFixed(2)),
          close: Number(q.close.toFixed(2)),
          volume: q.volume || 10000,
        }));

      cache.candles[cacheKey] = { timestamp: now, data: candles };
      return res.json({ success: true, source: 'live', data: candles });
    }

    return res.json({ success: false, message: 'No chart candles found' });
  } catch (error: any) {
    console.error(`Error fetching real candles for ${req.params.symbol}:`, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Gemini AI Stock & Trade Analysis Endpoint
app.post('/api/analyze-stock', async (req: Request, res: Response) => {
  try {
    const { stock, timeframe, quantStrategy } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        source: 'quant-fallback',
        analysis: quantStrategy,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const strategyContext = quantStrategy?.strategyName
      ? `Strategy Archetype to Execute: ${quantStrategy.strategyName}
Key Computed Indicators:
- RSI (14): ${quantStrategy.metrics?.rsi ?? 'N/A'}
- 20-period SMA: $${quantStrategy.metrics?.sma20 ?? 'N/A'}
- Volume-Weighted Avg Price (VWAP): $${quantStrategy.metrics?.vwap ?? 'N/A'}
- Bollinger Bands: Lower $${quantStrategy.metrics?.lowerBB ?? 'N/A'} | Upper $${quantStrategy.metrics?.upperBB ?? 'N/A'} (Bandwidth: ${quantStrategy.metrics?.bandwidth ?? 'N/A'}%)
- MACD Histogram: ${quantStrategy.metrics?.macdHist ?? 'N/A'}`
      : '';

    const prompt = `You are a senior quantitative hedge fund trader and algorithmic strategist.
Analyze the following asset and formulate an institutional-grade trade setup adhering to the specified strategy archetype:

Asset: ${stock.symbol} (${stock.name})
Sector: ${stock.sector}
Current Price: $${stock.price}
24h Change: ${stock.change} (${stock.changePercent}%)
52W Range: $${stock.fiftyTwoWeekLow} - $${stock.fiftyTwoWeekHigh}
P/E Ratio: ${stock.peRatio || 'N/A'}
Market Cap: $${(stock.marketCap / 1e9).toFixed(1)}B
Analyst Consensus: ${stock.analystRating?.consensus || 'Buy'} with target $${stock.analystRating?.targetPrice || (stock.price * 1.1).toFixed(2)}

${strategyContext}

Return ONLY valid JSON matching this schema:
{
  "action": "BUY" or "SELL",
  "strategyName": "${quantStrategy?.strategyName || 'Quantitative Setup'}",
  "confidence": number between 78 and 96,
  "entryPrice": number (suggested entry price in USD),
  "targetPrice": number (take profit price target in USD),
  "stopLossPrice": number (risk mitigation stop price in USD),
  "riskRewardRatio": "1 : X.X",
  "technicalSummary": "2-3 sentence technical & fundamental catalyst rationale tailored to this strategy archetype",
  "catalysts": ["catalyst 1", "catalyst 2", "catalyst 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      source: 'gemini-ai',
      analysis: {
        ...quantStrategy,
        ...parsed,
        symbol: stock.symbol,
      },
    });
  } catch (error: any) {
    console.error('Gemini stock analysis error:', error);
    return res.json({
      success: true,
      source: 'quant-fallback',
      analysis: req.body.quantStrategy,
    });
  }
});

// Setup Vite middleware in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`TATM (Trade Against the Machine) Server listening on http://0.0.0.0:${PORT}`);
  });

  // Periodic Cache Pruner (runs every 10 mins to purge candles older than 20 mins)
  setInterval(() => {
    const cutoff = Date.now() - 20 * 60 * 1000;
    Object.keys(cache.candles).forEach((key) => {
      if (cache.candles[key].timestamp < cutoff) {
        delete cache.candles[key];
      }
    });
  }, 10 * 60 * 1000);

  // Graceful shutdown hooks for Cloud Run container lifecycle
  const handleShutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down HTTP server cleanly...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
