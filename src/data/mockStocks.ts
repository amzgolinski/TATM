import { StockQuote, MarketIndex, Candle, OrderBook, TapeTrade, NewsItem, PaymentMethod } from '../types/market';

export const INITIAL_MARKET_INDICES: MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', price: 5864.67, change: 42.15, changePercent: 0.72 },
  { symbol: 'IXIC', name: 'NASDAQ', price: 18518.61, change: 168.40, changePercent: 0.92 },
  { symbol: 'DJI', name: 'Dow Jones', price: 43239.05, change: 36.80, changePercent: 0.09 },
  { symbol: 'RUT', name: 'Russell 2000', price: 2275.40, change: 18.25, changePercent: 0.81 },
  { symbol: 'TNX', name: '10-Yr Yield', price: 4.08, change: -0.04, changePercent: -0.97 },
  { symbol: 'VIX', name: 'Volatility Index', price: 18.04, change: -0.76, changePercent: -4.04 },
  { symbol: 'BTC', name: 'Bitcoin', price: 68450.00, change: 1420.50, changePercent: 2.12 },
];

export const INITIAL_STOCKS: Record<string, StockQuote> = {
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'stock',
    sector: 'Semiconductors',
    price: 138.25,
    change: 4.85,
    changePercent: 3.63,
    open: 134.10,
    high: 139.60,
    low: 133.80,
    previousClose: 133.40,
    volume: 68420100,
    avgVolume: 52140000,
    marketCap: 3390000000000,
    peRatio: 58.4,
    beta: 1.68,
    dividendYield: 0.03,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 39.23,
    description: 'NVIDIA Corporation designs graphics processing units (GPUs) for the gaming and professional markets, as well as system on a chip units for the mobile computing and automotive market. Key driver of global AI compute infrastructure.',
    analystRating: {
      consensus: 'Strong Buy',
      targetPrice: 152.00,
      targetHigh: 175.00,
      targetLow: 120.00,
      buyPercentage: 92,
    },
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    sector: 'Consumer Electronics',
    price: 232.40,
    change: 2.15,
    changePercent: 0.93,
    open: 230.80,
    high: 233.50,
    low: 230.20,
    previousClose: 230.25,
    volume: 48920000,
    avgVolume: 58400000,
    marketCap: 3530000000000,
    peRatio: 34.6,
    beta: 1.05,
    dividendYield: 0.44,
    fiftyTwoWeekHigh: 237.23,
    fiftyTwoWeekLow: 164.08,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services including Apple Intelligence ecosystem.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 248.00,
      targetHigh: 275.00,
      targetLow: 210.00,
      buyPercentage: 78,
    },
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'stock',
    sector: 'Software & Cloud',
    price: 418.90,
    change: 3.45,
    changePercent: 0.83,
    open: 416.00,
    high: 420.75,
    low: 415.20,
    previousClose: 415.45,
    volume: 21540000,
    avgVolume: 24100000,
    marketCap: 3110000000000,
    peRatio: 35.2,
    beta: 0.89,
    dividendYield: 0.72,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 327.00,
    description: 'Microsoft develops and supports software, services, devices and solutions. Known for Azure cloud infrastructure, Microsoft 365 enterprise suite, Copilot AI, and gaming.',
    analystRating: {
      consensus: 'Strong Buy',
      targetPrice: 495.00,
      targetHigh: 550.00,
      targetLow: 440.00,
      buyPercentage: 88,
    },
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    type: 'stock',
    sector: 'Automotive & Clean Energy',
    price: 219.80,
    change: -4.30,
    changePercent: -1.92,
    open: 224.50,
    high: 226.10,
    low: 217.40,
    previousClose: 224.10,
    volume: 84200000,
    avgVolume: 71200000,
    marketCap: 702000000000,
    peRatio: 64.2,
    beta: 2.34,
    dividendYield: 0.0,
    fiftyTwoWeekHigh: 271.00,
    fiftyTwoWeekLow: 138.80,
    description: 'Tesla designs, develops, manufactures, sells, and leases electric vehicles, energy storage systems, solar panels, and solar roof products, alongside autonomous Full Self-Driving software and Optimus robotics.',
    analystRating: {
      consensus: 'Hold',
      targetPrice: 215.00,
      targetHigh: 310.00,
      targetLow: 115.00,
      buyPercentage: 45,
    },
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    sector: 'Internet & AI',
    price: 165.75,
    change: 1.25,
    changePercent: 0.76,
    open: 164.80,
    high: 167.10,
    low: 164.20,
    previousClose: 164.50,
    volume: 24300000,
    avgVolume: 27800000,
    marketCap: 2060000000000,
    peRatio: 23.9,
    beta: 1.08,
    dividendYield: 0.48,
    fiftyTwoWeekHigh: 191.75,
    fiftyTwoWeekLow: 120.21,
    description: 'Alphabet offers Google Search, YouTube, Android, Google Cloud platform, Gemini AI multimodal models, and hardware products, maintaining global internet scale and ad revenue leadership.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 200.00,
      targetHigh: 225.00,
      targetLow: 170.00,
      buyPercentage: 82,
    },
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    type: 'stock',
    sector: 'E-Commerce & Cloud',
    price: 187.60,
    change: 2.10,
    changePercent: 1.13,
    open: 186.20,
    high: 188.90,
    low: 185.70,
    previousClose: 185.50,
    volume: 38100000,
    avgVolume: 42000000,
    marketCap: 1950000000000,
    peRatio: 43.1,
    beta: 1.15,
    dividendYield: 0.0,
    fiftyTwoWeekHigh: 201.20,
    fiftyTwoWeekLow: 118.35,
    description: 'Amazon focuses on e-commerce, cloud computing with AWS (Amazon Web Services), online advertising, digital streaming, and artificial intelligence.',
    analystRating: {
      consensus: 'Strong Buy',
      targetPrice: 220.00,
      targetHigh: 245.00,
      targetLow: 190.00,
      buyPercentage: 94,
    },
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    type: 'stock',
    sector: 'Social Media & AI',
    price: 574.50,
    change: 8.20,
    changePercent: 1.45,
    open: 568.00,
    high: 578.40,
    low: 566.80,
    previousClose: 566.30,
    volume: 16400000,
    avgVolume: 14200000,
    marketCap: 1450000000000,
    peRatio: 28.3,
    beta: 1.22,
    dividendYield: 0.35,
    fiftyTwoWeekHigh: 602.95,
    fiftyTwoWeekLow: 279.40,
    description: 'Meta builds technologies that help people connect, find communities, and grow businesses across Facebook, Instagram, WhatsApp, Messenger, Ray-Ban Meta smart glasses, and Llama open AI models.',
    analystRating: {
      consensus: 'Strong Buy',
      targetPrice: 630.00,
      targetHigh: 700.00,
      targetLow: 520.00,
      buyPercentage: 86,
    },
  },
  AMD: {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    type: 'stock',
    sector: 'Semiconductors',
    price: 156.40,
    change: 3.10,
    changePercent: 2.02,
    open: 153.20,
    high: 157.80,
    low: 152.60,
    previousClose: 153.30,
    volume: 46200000,
    avgVolume: 51000000,
    marketCap: 253000000000,
    peRatio: 112.5,
    beta: 1.72,
    dividendYield: 0.0,
    fiftyTwoWeekHigh: 227.30,
    fiftyTwoWeekLow: 94.04,
    description: 'AMD designs computing, graphics, and visualization technologies including Ryzen processors, EPYC server chips, and Instinct MI300 AI accelerators.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 185.00,
      targetHigh: 220.00,
      targetLow: 140.00,
      buyPercentage: 74,
    },
  },
  SPY: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    type: 'etf',
    sector: 'Index ETF',
    price: 584.20,
    change: 4.10,
    changePercent: 0.71,
    open: 581.50,
    high: 585.10,
    low: 581.00,
    previousClose: 580.10,
    volume: 52100000,
    avgVolume: 61000000,
    marketCap: 590000000000,
    peRatio: 27.1,
    beta: 1.0,
    dividendYield: 1.22,
    fiftyTwoWeekHigh: 586.80,
    fiftyTwoWeekLow: 410.07,
    description: 'SPDR S&P 500 ETF Trust is an exchange-traded fund that tracks the S&P 500 stock market index, representing the 500 largest publicly traded companies in the US.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 620.00,
      targetHigh: 660.00,
      targetLow: 560.00,
      buyPercentage: 80,
    },
  },
  QQQ: {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    type: 'etf',
    sector: 'Tech ETF',
    price: 494.30,
    change: 4.70,
    changePercent: 0.96,
    open: 491.00,
    high: 495.80,
    low: 490.40,
    previousClose: 489.60,
    volume: 34500000,
    avgVolume: 39000000,
    marketCap: 285000000000,
    peRatio: 31.4,
    beta: 1.18,
    dividendYield: 0.58,
    fiftyTwoWeekHigh: 503.52,
    fiftyTwoWeekLow: 342.35,
    description: 'Invesco QQQ tracks the Nasdaq-100 Index, featuring 100 of the largest non-financial companies listed on the Nasdaq based on market cap.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 535.00,
      targetHigh: 580.00,
      targetLow: 480.00,
      buyPercentage: 82,
    },
  },
  'BTC-USD': {
    symbol: 'BTC-USD',
    name: 'Bitcoin (USD)',
    type: 'crypto',
    sector: 'Digital Currency',
    price: 68420.00,
    change: 1450.00,
    changePercent: 2.16,
    open: 67100.00,
    high: 69120.00,
    low: 66850.00,
    previousClose: 66970.00,
    volume: 28400000000,
    avgVolume: 26000000000,
    marketCap: 1350000000000,
    fiftyTwoWeekHigh: 73750.00,
    fiftyTwoWeekLow: 26500.00,
    description: 'Bitcoin is the first decentralized digital currency based on proof-of-work blockchain ledger consensus, acting as digital gold and global store of value.',
    analystRating: {
      consensus: 'Strong Buy',
      targetPrice: 85000.00,
      targetHigh: 120000.00,
      targetLow: 55000.00,
      buyPercentage: 85,
    },
  },
  'ETH-USD': {
    symbol: 'ETH-USD',
    name: 'Ethereum (USD)',
    type: 'crypto',
    sector: 'Smart Contracts',
    price: 2640.50,
    change: 48.20,
    changePercent: 1.86,
    open: 2595.00,
    high: 2675.00,
    low: 2580.00,
    previousClose: 2592.30,
    volume: 14200000000,
    avgVolume: 13500000000,
    marketCap: 318000000000,
    fiftyTwoWeekHigh: 4093.00,
    fiftyTwoWeekLow: 1520.00,
    description: 'Ethereum is a decentralized global software platform powered by blockchain and smart contracts, facilitating decentralized finance (DeFi) and layer-2 scaling.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 3400.00,
      targetHigh: 4500.00,
      targetLow: 2200.00,
      buyPercentage: 75,
    },
  },
  'SOL-USD': {
    symbol: 'SOL-USD',
    name: 'Solana (USD)',
    type: 'crypto',
    sector: 'High-Throughput L1',
    price: 172.40,
    change: 6.80,
    changePercent: 4.11,
    open: 165.60,
    high: 175.20,
    low: 164.80,
    previousClose: 165.60,
    volume: 3800000000,
    avgVolume: 3500000000,
    marketCap: 81000000000,
    fiftyTwoWeekHigh: 209.90,
    fiftyTwoWeekLow: 32.10,
    description: 'Solana is a high-performance decentralized blockchain designed to enable scalable, user-friendly decentralized apps and decentralized finance.',
    analystRating: {
      consensus: 'Strong Buy',
      targetPrice: 220.00,
      targetHigh: 260.00,
      targetLow: 140.00,
      buyPercentage: 88,
    },
  },
  JPM: {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    type: 'stock',
    sector: 'Financial Services',
    price: 222.15,
    change: 1.10,
    changePercent: 0.50,
    open: 221.50,
    high: 223.40,
    low: 220.80,
    previousClose: 221.05,
    volume: 9800000,
    avgVolume: 9200000,
    marketCap: 635000000000,
    peRatio: 12.4,
    beta: 1.11,
    dividendYield: 2.16,
    fiftyTwoWeekHigh: 225.48,
    fiftyTwoWeekLow: 139.74,
    description: 'JPMorgan Chase & Co. is a leading financial services firm offering investment banking, asset management, treasury services, and commercial banking globally.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 235.00,
      targetHigh: 250.00,
      targetLow: 195.00,
      buyPercentage: 70,
    },
  },
  COIN: {
    symbol: 'COIN',
    name: 'Coinbase Global, Inc.',
    type: 'stock',
    sector: 'Fintech & Crypto',
    price: 214.80,
    change: 9.60,
    changePercent: 4.68,
    open: 206.50,
    high: 218.00,
    low: 204.80,
    previousClose: 205.20,
    volume: 11200000,
    avgVolume: 9800000,
    marketCap: 52800000000,
    peRatio: 41.2,
    beta: 3.12,
    dividendYield: 0.0,
    fiftyTwoWeekHigh: 283.48,
    fiftyTwoWeekLow: 69.63,
    description: 'Coinbase provides financial infrastructure and technology for the cryptoeconomy, operating retail exchange, custody services, and Base Ethereum L2.',
    analystRating: {
      consensus: 'Buy',
      targetPrice: 260.00,
      targetHigh: 325.00,
      targetLow: 165.00,
      buyPercentage: 68,
    },
  },
  LLY: {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    type: 'stock',
    sector: 'Healthcare & Pharma',
    price: 912.40,
    change: 7.80,
    changePercent: 0.86,
    open: 906.00,
    high: 918.50,
    low: 904.20,
    previousClose: 904.60,
    volume: 2450000,
    avgVolume: 2900000,
    marketCap: 865000000000,
    peRatio: 108.6,
    beta: 0.42,
    dividendYield: 0.57,
    fiftyTwoWeekHigh: 972.53,
    fiftyTwoWeekLow: 535.10,
    description: 'Eli Lilly discovers, develops, and markets human pharmaceutical products worldwide, leading therapies in diabetes, obesity (Mounjaro/Zepbound), oncology, and neuroscience.',
    analystRating: {
      consensus: 'Strong Buy',
      targetPrice: 1050.00,
      targetHigh: 1180.00,
      targetLow: 890.00,
      buyPercentage: 90,
    },
  },
};

/**
 * Generate realistic candlestick history for a given ticker and timeframe
 */
export function generateCandles(currentPrice: number, timeframe: '1D' | '1W' | '1M' | '1Y' | '5Y'): Candle[] {
  let count = 48;
  let intervalMs = 5 * 60 * 1000; // 5 min for 1D
  let volatility = 0.0025;

  if (timeframe === '1W') {
    count = 35; // 7 intervals per day for 5 trading days
    intervalMs = 60 * 60 * 1000;
    volatility = 0.006;
  } else if (timeframe === '1M') {
    count = 30; // 30 days
    intervalMs = 24 * 60 * 60 * 1000;
    volatility = 0.015;
  } else if (timeframe === '1Y') {
    count = 52; // 52 weeks
    intervalMs = 7 * 24 * 60 * 60 * 1000;
    volatility = 0.035;
  } else if (timeframe === '5Y') {
    count = 60; // 60 months
    intervalMs = 30 * 24 * 60 * 60 * 1000;
    volatility = 0.06;
  }

  const now = Date.now();
  const candles: Candle[] = [];

  // Generate backward walk from currentPrice to starting price
  const prices: number[] = [currentPrice];
  for (let i = 1; i < count; i++) {
    const prev = prices[i - 1];
    const change = prev * (Math.random() - 0.485) * volatility;
    prices.push(Math.max(1, prev - change));
  }
  prices.reverse();

  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * intervalMs;
    const base = prices[i];
    const candleSpread = base * volatility * 0.8;
    const open = i === 0 ? base : candles[i - 1].close;
    const close = base + (Math.random() - 0.48) * candleSpread;
    const high = Math.max(open, close) + Math.random() * candleSpread * 0.7;
    const low = Math.min(open, close) - Math.random() * candleSpread * 0.7;
    const volume = Math.floor(10000 + Math.random() * 85000);

    candles.push({
      timestamp: time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }

  // Ensure last candle close is currentPrice
  const last = candles[candles.length - 1];
  last.close = currentPrice;
  last.high = Math.max(last.high, currentPrice);
  last.low = Math.min(last.low, currentPrice);

  return candles;
}

export function generateOrderBook(midPrice: number): OrderBook {
  const bids: OrderBook['bids'] = [];
  const asks: OrderBook['asks'] = [];

  const spread = Number((midPrice * 0.0003 + 0.01).toFixed(2));
  let runningBidTotal = 0;
  let runningAskTotal = 0;

  for (let i = 0; i < 7; i++) {
    const step = (i + 1) * 0.05 + Math.random() * 0.02;
    const bidPrice = Number((midPrice - spread / 2 - step).toFixed(2));
    const bidSize = Math.floor(50 + Math.random() * 450);
    runningBidTotal += bidSize;
    bids.push({ price: bidPrice, size: bidSize, total: runningBidTotal });

    const askPrice = Number((midPrice + spread / 2 + step).toFixed(2));
    const askSize = Math.floor(50 + Math.random() * 450);
    runningAskTotal += askSize;
    asks.push({ price: askPrice, size: askSize, total: runningAskTotal });
  }

  // sort asks ascending, bids descending
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  return {
    bids,
    asks,
    spread,
    spreadPercent: Number(((spread / midPrice) * 100).toFixed(3)),
  };
}

export function generateInitialTape(currentPrice: number): TapeTrade[] {
  const trades: TapeTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const side = Math.random() > 0.48 ? 'buy' : 'sell';
    const offset = (Math.random() - 0.5) * 0.2;
    const price = Number((currentPrice + offset).toFixed(2));
    const size = Math.floor(10 + Math.random() * 150);
    trades.push({
      id: `trade-${i}-${Date.now()}`,
      timestamp: now - (12 - i) * 2500,
      price,
      size,
      side,
    });
  }
  return trades;
}

export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Fed Signals Measured Rate Stance as Job Market Remains Balanced',
    source: 'Bloomberg Markets',
    timeAgo: '14m ago',
    sentiment: 'positive',
    symbols: ['SPY', 'QQQ', 'JPM'],
    summary: 'Federal Reserve officials noted continued resilience in labor markets while headline inflation approaches the 2.0% annual target.',
  },
  {
    id: 'news-2',
    title: 'NVIDIA Expands Next-Gen Blackwell AI Data Center Shipments Worldwide',
    source: 'Reuters Tech',
    timeAgo: '32m ago',
    sentiment: 'positive',
    symbols: ['NVDA', 'MSFT', 'AMZN'],
    summary: 'Hyperscalers ramp up capital expenditures on accelerated computing clusters to support sovereign AI and generative foundation models.',
  },
  {
    id: 'news-3',
    title: 'Apple Unveils New High-Efficiency M-Series Architecture with Enhanced Neural Engine',
    source: 'Financial Times',
    timeAgo: '1h ago',
    sentiment: 'positive',
    symbols: ['AAPL'],
    summary: 'Cupertino company details on-device AI performance gains and unified memory breakthroughs across developer and workstation portfolios.',
  },
  {
    id: 'news-4',
    title: 'Tesla Autonomous Fleet Regulatory Milestones Face Scrutiny Ahead of Driverless Rollout',
    source: 'Wall Street Journal',
    timeAgo: '2h ago',
    sentiment: 'neutral',
    symbols: ['TSLA'],
    summary: 'State transportation regulators open public consultation periods on commercial autonomous taxi fleet safety validation metrics.',
  },
  {
    id: 'news-5',
    title: 'Digital Asset Treasury Allocations Surge as Institutional Custody Products Expand',
    source: 'CoinDesk Pro',
    timeAgo: '3h ago',
    sentiment: 'positive',
    symbols: ['BTC-USD', 'ETH-USD', 'COIN'],
    summary: 'Spot ETF net inflows accelerate with major corporate balance sheets evaluating reserve allocations following regulatory clarifications.',
  },
];

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm-chase-1',
    type: 'ach',
    institutionOrBrand: 'JPMorgan Chase Bank',
    accountNumberMasked: '•••• 8291',
    routingNumberMasked: '•••• 0210',
    nameOnAccount: 'Alex Miller (Simulated)',
    isDefault: true,
  },
  {
    id: 'pm-visa-1',
    type: 'card',
    institutionOrBrand: 'Visa Signature Debit',
    accountNumberMasked: '•••• 4242',
    nameOnAccount: 'Alex Miller',
    isDefault: false,
  },
  {
    id: 'pm-bofa-1',
    type: 'ach',
    institutionOrBrand: 'Bank of America',
    accountNumberMasked: '•••• 6140',
    routingNumberMasked: '•••• 0260',
    nameOnAccount: 'Alex Miller (Simulated)',
    isDefault: false,
  },
];
