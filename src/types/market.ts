export type AssetType = 'stock' | 'etf' | 'crypto';

export interface StockQuote {
  symbol: string;
  name: string;
  type: AssetType;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: number; // in USD
  peRatio?: number;
  beta?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  description: string;
  analystRating: {
    consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Underperform' | 'Sell';
    targetPrice: number;
    targetHigh: number;
    targetLow: number;
    buyPercentage: number;
  };
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
}

export interface TapeTrade {
  id: string;
  timestamp: number;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  symbols: string[];
  summary: string;
}

export interface Position {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dailyPnL: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  bracketOrderId?: string;
}

export type OrderType = 'market' | 'limit' | 'stop_loss' | 'bracket';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'filled' | 'pending' | 'cancelled';

export interface Order {
  id: string;
  symbol: string;
  name: string;
  side: OrderSide;
  type: OrderType;
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
  executionPrice?: number;
  total: number;
  status: OrderStatus;
  timestamp: number;
  filledAt?: number;
  isBracket?: boolean;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  parentOrderId?: string;
  bracketGroupId?: string;
  ocoTriggeredReason?: 'take_profit' | 'stop_loss';
}

export interface PaymentMethod {
  id: string;
  type: 'ach' | 'card';
  institutionOrBrand: string; // "Chase", "Bank of America", "Visa", "Mastercard"
  accountNumberMasked: string; // "•••• 4242"
  nameOnAccount: string;
  isDefault: boolean;
  routingNumberMasked?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell';
  amount: number;
  symbol?: string;
  shares?: number;
  price?: number;
  paymentMethod?: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  referenceCode: string;
  description: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}
