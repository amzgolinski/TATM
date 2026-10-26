import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StockQuote,
  MarketIndex,
  Candle,
  OrderBook,
  TapeTrade,
  Position,
  Order,
  OrderType,
  Transaction,
  PaymentMethod,
} from '../types/market';
import {
  INITIAL_STOCKS,
  INITIAL_MARKET_INDICES,
  INITIAL_PAYMENT_METHODS,
  generateCandles,
  generateOrderBook,
  generateInitialTape,
} from '../data/mockStocks';
import { coinbaseWS } from '../services/coinbaseFeed';

interface NotificationToast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

interface TradingContextType {
  stocks: Record<string, StockQuote>;
  marketIndices: MarketIndex[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  selectedStock: StockQuote;
  timeframe: '1D' | '1W' | '1M' | '1Y' | '5Y';
  setTimeframe: (tf: '1D' | '1W' | '1M' | '1Y' | '5Y') => void;
  candles: Candle[];
  orderBook: OrderBook;
  tape: TapeTrade[];
  chartType: 'candle' | 'line';
  setChartType: (type: 'candle' | 'line') => void;
  showSMA: boolean;
  setShowSMA: (val: boolean) => void;
  showEMA: boolean;
  setShowEMA: (val: boolean) => void;
  showRSI: boolean;
  setShowRSI: (val: boolean) => void;
  showVolume: boolean;
  setShowVolume: (val: boolean) => void;

  // Watchlists
  watchlists: string[];
  toggleWatchlist: (symbol: string) => void;
  isWatchlisted: (symbol: string) => boolean;

  // View state
  activeTab: 'terminal' | 'portfolio' | 'orders' | 'funding' | 'backtest';
  setActiveTab: (tab: 'terminal' | 'portfolio' | 'orders' | 'funding' | 'backtest') => void;

  // Payment Modal
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  paymentModalInitialTab: 'deposit' | 'withdraw' | 'card' | 'quick';
  openPaymentModal: (tab?: 'deposit' | 'withdraw' | 'card' | 'quick') => void;

  // Portfolio state
  cashBalance: number;
  positions: Record<string, Position>;
  orders: Order[];
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  realizedPnL: number;

  // Computed metrics
  totalEquity: number;
  totalMarketValue: number;
  totalCostBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dailyPnL: number;
  dailyPnLPercent: number;

  // Actions
  depositFunds: (amount: number, methodId: string, description: string) => { success: boolean; message: string; ref: string };
  withdrawFunds: (amount: number, methodId: string, description: string) => { success: boolean; message: string; ref: string };
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => PaymentMethod;
  executeTrade: (params: {
    symbol: string;
    side: 'buy' | 'sell';
    type: OrderType;
    shares: number;
    limitPrice?: number;
    stopPrice?: number;
    takeProfitPrice?: number;
    stopLossPrice?: number;
    isBracket?: boolean;
  }) => { success: boolean; message: string; orderId?: string };
  updatePositionBracket: (symbol: string, takeProfitPrice?: number, stopLossPrice?: number) => void;
  cancelOrder: (orderId: string) => boolean;
  resetAccount: () => void;

  // Live Market Data Connection
  isLiveConnected: boolean;
  isWsConnected: boolean;
  wsTickCount: number;
  lastLiveSync: number;
  refreshLiveMarketData: () => Promise<void>;

  // Notifications
  toasts: NotificationToast[];
  dismissToast: (id: string) => void;
  addToast: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;

  // Quick trade prefill
  quickTradePrefill: { symbol?: string; price?: number; side?: 'buy' | 'sell' } | null;
  setQuickTradePrefill: (prefill: { symbol?: string; price?: number; side?: 'buy' | 'sell' } | null) => void;
}

const STORAGE_KEYS = {
  CASH: 'auratrade_cash_v1',
  POSITIONS: 'auratrade_positions_v1',
  ORDERS: 'auratrade_orders_v1',
  TRANSACTIONS: 'auratrade_transactions_v1',
  WATCHLISTS: 'auratrade_watchlists_v1',
  PAYMENT_METHODS: 'auratrade_payment_methods_v1',
  REALIZED_PNL: 'auratrade_realized_pnl_v1',
};

const DEFAULT_WATCHLIST = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'SPY', 'BTC-USD'];

const DEFAULT_INITIAL_POSITIONS: Record<string, Position> = {
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    shares: 40,
    avgCost: 124.50,
    currentPrice: 138.25,
    marketValue: 5530.00,
    totalCost: 4980.00,
    unrealizedPnL: 550.00,
    unrealizedPnLPercent: 11.04,
    dailyPnL: 194.00,
    takeProfitPrice: 152.00,
    stopLossPrice: 120.00,
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 25,
    avgCost: 218.00,
    currentPrice: 232.40,
    marketValue: 5810.00,
    totalCost: 5450.00,
    unrealizedPnL: 360.00,
    unrealizedPnLPercent: 6.61,
    dailyPnL: 53.75,
    takeProfitPrice: 248.00,
    stopLossPrice: 215.00,
  },
  SPY: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    shares: 15,
    avgCost: 565.00,
    currentPrice: 584.20,
    marketValue: 8763.00,
    totalCost: 8475.00,
    unrealizedPnL: 288.00,
    unrealizedPnLPercent: 3.40,
    dailyPnL: 61.50,
    takeProfitPrice: 605.00,
    stopLossPrice: 568.00,
  },
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Live stocks state
  const [stocks, setStocks] = useState<Record<string, StockQuote>>(INITIAL_STOCKS);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>(INITIAL_MARKET_INDICES);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | '5Y'>('1D');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showEMA, setShowEMA] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'terminal' | 'portfolio' | 'orders' | 'funding' | 'backtest'>('terminal');

  // Real Market Data connectivity state
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [wsTickCount, setWsTickCount] = useState<number>(0);
  const [lastLiveSync, setLastLiveSync] = useState<number>(Date.now());

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalInitialTab, setPaymentModalInitialTab] = useState<'deposit' | 'withdraw' | 'card' | 'quick'>('deposit');

  // Quick trade prefill from order book clicks or portfolio clicks
  const [quickTradePrefill, setQuickTradePrefill] = useState<{ symbol?: string; price?: number; side?: 'buy' | 'sell' } | null>(null);

  // Candles & depth state for currently selected stock
  const [candles, setCandles] = useState<Candle[]>(() => {
    return generateCandles(INITIAL_STOCKS.NVDA.price, '1D');
  });

  const [orderBook, setOrderBook] = useState<OrderBook>(() => {
    return generateOrderBook(INITIAL_STOCKS.NVDA.price);
  });

  const [tape, setTape] = useState<TapeTrade[]>(() => {
    return generateInitialTape(INITIAL_STOCKS.NVDA.price);
  });

  // Watchlists with localStorage
  const [watchlists, setWatchlists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((s: string) => {
            if (s === 'BTC') return 'BTC-USD';
            if (s === 'ETH') return 'ETH-USD';
            return s;
          });
          return Array.from(new Set(normalized));
        }
      }
      return DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });

  // Cash balance with localStorage (default $85,000 cash + positions = ~$105k equity)
  const [cashBalance, setCashBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH);
      return saved !== null ? Number(saved) : 85000.00;
    } catch {
      return 85000.00;
    }
  });

  // Positions with localStorage
  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSITIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleaned: Record<string, Position> = {};
          Object.entries(parsed).forEach(([key, val]: [string, any]) => {
            if (!val) return;
            const sym = (val.symbol === 'BTC' || key === 'BTC') ? 'BTC-USD' : (val.symbol === 'ETH' || key === 'ETH') ? 'ETH-USD' : (val.symbol || key);
            if (cleaned[sym]) {
              const existing = cleaned[sym];
              const totalShares = (existing.shares || 0) + (val.shares || 0);
              const totalCost = (existing.totalCost || 0) + (val.totalCost || 0);
              const avgCost = totalShares > 0 ? Number((totalCost / totalShares).toFixed(2)) : existing.avgCost;
              cleaned[sym] = {
                ...existing,
                shares: totalShares,
                totalCost,
                avgCost,
                marketValue: Number((totalShares * (val.currentPrice || existing.currentPrice)).toFixed(2)),
              };
            } else {
              cleaned[sym] = {
                ...val,
                symbol: sym,
              };
            }
          });
          return cleaned;
        }
      }
      return DEFAULT_INITIAL_POSITIONS;
    } catch {
      return DEFAULT_INITIAL_POSITIONS;
    }
  });

  // Realized P&L
  const [realizedPnL, setRealizedPnL] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REALIZED_PNL);
      return saved !== null ? Number(saved) : 1240.50;
    } catch {
      return 1240.50;
    }
  });

  // Orders with localStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'ord-initial-1',
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          side: 'buy',
          type: 'market',
          shares: 40,
          executionPrice: 124.50,
          total: 4980.00,
          status: 'filled',
          timestamp: Date.now() - 3600 * 24 * 3 * 1000,
          filledAt: Date.now() - 3600 * 24 * 3 * 1000,
        },
        {
          id: 'ord-initial-2',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          side: 'buy',
          type: 'market',
          shares: 25,
          executionPrice: 218.00,
          total: 5450.00,
          status: 'filled',
          timestamp: Date.now() - 3600 * 24 * 2 * 1000,
          filledAt: Date.now() - 3600 * 24 * 2 * 1000,
        },
        {
          id: 'ord-initial-3',
          symbol: 'TSLA',
          name: 'Tesla, Inc.',
          side: 'buy',
          type: 'limit',
          shares: 20,
          limitPrice: 210.00,
          total: 4200.00,
          status: 'pending',
          timestamp: Date.now() - 3600 * 4 * 1000,
        },
      ];
    } catch {
      return [];
    }
  });

  // Transactions ledger with localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'tx-dep-1',
          type: 'deposit',
          amount: 100000.00,
          paymentMethod: 'JPMorgan Chase Bank (•••• 8291)',
          timestamp: Date.now() - 3600 * 24 * 7 * 1000,
          status: 'completed',
          referenceCode: 'DEP-9831427-ACH',
          description: 'Instant Electronic ACH Deposit (Verified)',
        },
        {
          id: 'tx-buy-1',
          type: 'buy',
          amount: 4980.00,
          symbol: 'NVDA',
          shares: 40,
          price: 124.50,
          timestamp: Date.now() - 3600 * 24 * 3 * 1000,
          status: 'completed',
          referenceCode: 'EX-NVDA-400921',
          description: 'Executed Buy 40 NVDA @ $124.50',
        },
        {
          id: 'tx-buy-2',
          type: 'buy',
          amount: 5450.00,
          symbol: 'AAPL',
          shares: 25,
          price: 218.00,
          timestamp: Date.now() - 3600 * 24 * 2 * 1000,
          status: 'completed',
          referenceCode: 'EX-AAPL-219488',
          description: 'Executed Buy 25 AAPL @ $218.00',
        },
      ];
    } catch {
      return [];
    }
  });

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENT_METHODS;
    } catch {
      return INITIAL_PAYMENT_METHODS;
    }
  });

  // Toasts
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: NotificationToast = {
      ...toast,
      id,
      timestamp: Date.now(),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openPaymentModal = (tab: 'deposit' | 'withdraw' | 'card' | 'quick' = 'deposit') => {
    setPaymentModalInitialTab(tab);
    setIsPaymentModalOpen(true);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH, cashBalance.toString());
  }, [cashBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(watchlists));
  }, [watchlists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REALIZED_PNL, realizedPnL.toString());
  }, [realizedPnL]);

  // Function to fetch real-world quotes from server proxy
  const refreshLiveMarketData = async () => {
    try {
      const res = await fetch('/api/market/quotes');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStocks((prev) => {
            const merged = { ...prev };
            delete merged['BTC'];
            delete merged['ETH'];
            Object.entries(json.data).forEach(([sym, quote]: [string, any]) => {
              if (merged[sym]) {
                merged[sym] = {
                  ...merged[sym],
                  price: quote.price,
                  change: quote.change,
                  changePercent: quote.changePercent,
                  open: quote.open,
                  high: quote.high,
                  low: quote.low,
                  volume: quote.volume,
                  marketCap: quote.marketCap,
                  peRatio: quote.peRatio ?? merged[sym].peRatio,
                  fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
                  fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
                };
              } else {
                merged[sym] = {
                  ...INITIAL_STOCKS.NVDA,
                  ...quote,
                };
              }
            });
            return merged;
          });
          setIsLiveConnected(true);
          setLastLiveSync(Date.now());
        }
      }
    } catch (e) {
      // Continue seamlessly on local engine
    }
  };

  // Poll live quotes on mount and periodically
  useEffect(() => {
    refreshLiveMarketData();
    const timer = setInterval(refreshLiveMarketData, 20000);
    return () => clearInterval(timer);
  }, []);

  // When selectedSymbol or timeframe changes, set responsive baseline and fetch real candles
  useEffect(() => {
    const stock = stocks[selectedSymbol] || INITIAL_STOCKS[selectedSymbol] || INITIAL_STOCKS.NVDA;
    // Immediate responsive candles
    setCandles(generateCandles(stock.price, timeframe));
    setOrderBook(generateOrderBook(stock.price));
    setTape(generateInitialTape(stock.price));

    // Fetch actual real historical candles
    let isMounted = true;
    fetch(`/api/market/candles/${selectedSymbol}?timeframe=${timeframe}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json && json.success && json.data && json.data.length > 0) {
          setCandles(json.data);
          setIsLiveConnected(true);
          setLastLiveSync(Date.now());
        }
      })
      .catch(() => {
        // Fallback candles already active
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, timeframe]);

  // Selected stock quote
  const selectedStock = useMemo(() => {
    return stocks[selectedSymbol] || INITIAL_STOCKS[selectedSymbol] || INITIAL_STOCKS.NVDA;
  }, [stocks, selectedSymbol]);

  // Ref to hold latest state for interval updates
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const cashBalanceRef = useRef(cashBalance);
  cashBalanceRef.current = cashBalance;

  const selectedSymbolRef = useRef(selectedSymbol);
  selectedSymbolRef.current = selectedSymbol;

  // Central trigger evaluation engine for limit orders, stop loss orders, and OCO bracket orders
  const evaluateTriggers = useCallback((sym: string, currentPrice: number) => {
    const canonical = sym === 'BTC' ? 'BTC-USD' : sym === 'ETH' ? 'ETH-USD' : sym;

    // 1. Check pending working orders for this symbol
    const pendingOrders = ordersRef.current.filter((o) => o.status === 'pending' && o.symbol === canonical);
    pendingOrders.forEach((order) => {
      let shouldFill = false;
      let fillPrice = currentPrice;

      if (order.side === 'buy' && order.type === 'limit' && order.limitPrice && currentPrice <= order.limitPrice) {
        shouldFill = true;
        fillPrice = currentPrice;
      } else if (order.side === 'sell' && order.type === 'limit' && order.limitPrice && currentPrice >= order.limitPrice) {
        shouldFill = true;
        fillPrice = currentPrice;
      } else if (order.side === 'sell' && order.type === 'stop_loss' && order.stopPrice && currentPrice <= order.stopPrice) {
        shouldFill = true;
        fillPrice = currentPrice;
      }

      if (shouldFill) {
        const total = Number((order.shares * fillPrice).toFixed(2));

        // Mark filled and cancel sibling OCO orders if grouped
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === order.id) {
              return {
                ...o,
                status: 'filled',
                executionPrice: fillPrice,
                total,
                filledAt: Date.now(),
              };
            }
            if (order.bracketGroupId && o.bracketGroupId === order.bracketGroupId && o.status === 'pending') {
              return {
                ...o,
                status: 'cancelled',
                ocoTriggeredReason: order.type === 'limit' ? 'take_profit' : 'stop_loss',
              };
            }
            return o;
          })
        );

        if (order.side === 'buy') {
          // Add to position
          setPositions((prev) => {
            const existing = prev[canonical];
            const newShares = (existing?.shares || 0) + order.shares;
            const newTotalCost = (existing?.totalCost || 0) + total;
            const newAvgCost = Number((newTotalCost / newShares).toFixed(2));

            return {
              ...prev,
              [canonical]: {
                symbol: canonical,
                name: order.name,
                shares: newShares,
                avgCost: newAvgCost,
                totalCost: newTotalCost,
                currentPrice: fillPrice,
                marketValue: Number((newShares * fillPrice).toFixed(2)),
                unrealizedPnL: Number(((newShares * fillPrice) - newTotalCost).toFixed(2)),
                unrealizedPnLPercent: newTotalCost > 0 ? Number(((((newShares * fillPrice) - newTotalCost) / newTotalCost) * 100).toFixed(2)) : 0,
                dailyPnL: 0,
                takeProfitPrice: order.takeProfitPrice || existing?.takeProfitPrice,
                stopLossPrice: order.stopLossPrice || existing?.stopLossPrice,
              },
            };
          });

          // Spawn OCO child orders if bracket attached
          if (order.isBracket && (order.takeProfitPrice || order.stopLossPrice)) {
            const bgId = `bg-${order.id}`;
            const ocoOrders: Order[] = [];
            if (order.takeProfitPrice) {
              ocoOrders.push({
                id: `ord-tp-${Date.now()}`,
                symbol: canonical,
                name: order.name,
                side: 'sell',
                type: 'limit',
                shares: order.shares,
                limitPrice: order.takeProfitPrice,
                total: Number((order.shares * order.takeProfitPrice).toFixed(2)),
                status: 'pending',
                timestamp: Date.now(),
                isBracket: true,
                bracketGroupId: bgId,
                parentOrderId: order.id,
              });
            }
            if (order.stopLossPrice) {
              ocoOrders.push({
                id: `ord-sl-${Date.now() + 1}`,
                symbol: canonical,
                name: order.name,
                side: 'sell',
                type: 'stop_loss',
                shares: order.shares,
                stopPrice: order.stopLossPrice,
                total: Number((order.shares * order.stopLossPrice).toFixed(2)),
                status: 'pending',
                timestamp: Date.now(),
                isBracket: true,
                bracketGroupId: bgId,
                parentOrderId: order.id,
              });
            }
            setOrders((prev) => [...ocoOrders, ...prev]);
          }
        } else {
          // Sell fill
          setPositions((prev) => {
            const existing = prev[canonical];
            if (!existing) return prev;
            const newShares = Math.max(0, existing.shares - order.shares);
            if (newShares === 0) {
              const copy = { ...prev };
              delete copy[canonical];
              return copy;
            }
            return {
              ...prev,
              [canonical]: {
                ...existing,
                shares: newShares,
                totalCost: Number((newShares * existing.avgCost).toFixed(2)),
                marketValue: Number((newShares * fillPrice).toFixed(2)),
              },
            };
          });
          setCashBalance((prev) => Number((prev + total).toFixed(2)));

          const pos = positionsRef.current[canonical];
          if (pos) {
            const costPortion = Number((order.shares * pos.avgCost).toFixed(2));
            const gain = Number((total - costPortion).toFixed(2));
            setRealizedPnL((prev) => Number((prev + gain).toFixed(2)));
          }
        }

        const isOco = !!order.bracketGroupId;
        const ocoLabel = order.type === 'stop_loss' ? 'Stop-Loss' : 'Take-Profit';

        setTransactions((prev) => [
          {
            id: `tx-ord-${Date.now()}`,
            type: order.side,
            amount: total,
            symbol: canonical,
            shares: order.shares,
            price: fillPrice,
            timestamp: Date.now(),
            status: 'completed',
            referenceCode: isOco ? `${order.type === 'stop_loss' ? 'SL' : 'TP'}-OCO-${order.id.slice(-5).toUpperCase()}` : `LIM-${order.id.slice(-5).toUpperCase()}`,
            description: isOco
              ? `OCO ${ocoLabel} Executed: Sold ${order.shares} ${canonical} @ $${fillPrice.toFixed(2)}`
              : `${order.side.toUpperCase()} ${order.shares} ${canonical} filled @ $${fillPrice.toFixed(2)}`,
          },
          ...prev,
        ]);

        addToast({
          type: isOco && order.type === 'limit' ? 'success' : isOco ? 'warning' : 'info',
          title: isOco ? `${ocoLabel} Executed (OCO)` : 'Order Executed',
          message: `${order.side.toUpperCase()} ${order.shares} ${canonical} filled at $${fillPrice.toFixed(2)}${isOco ? ' · Sibling OCO order cancelled' : ''}`,
        });
      }
    });

    // 2. Check position-level bracket orders (TP & SL attached directly to open positions)
    const pos = positionsRef.current[canonical];
    if (pos && pos.shares > 0) {
      let triggered: 'tp' | 'sl' | null = null;
      if (pos.takeProfitPrice && currentPrice >= pos.takeProfitPrice) {
        triggered = 'tp';
      } else if (pos.stopLossPrice && currentPrice <= pos.stopLossPrice) {
        triggered = 'sl';
      }

      if (triggered) {
        const exitPrice = currentPrice;
        const sharesToClose = pos.shares;
        const totalProceeds = Number((sharesToClose * exitPrice).toFixed(2));
        const costBasis = Number((sharesToClose * pos.avgCost).toFixed(2));
        const pnl = Number((totalProceeds - costBasis).toFixed(2));
        const pnlPct = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

        // Close position
        setPositions((prev) => {
          const copy = { ...prev };
          delete copy[canonical];
          return copy;
        });

        // Credit cash
        setCashBalance((prev) => Number((prev + totalProceeds).toFixed(2)));
        setRealizedPnL((prev) => Number((prev + pnl).toFixed(2)));

        // Cancel any pending working orders for this symbol
        setOrders((prev) =>
          prev.map((o) =>
            o.symbol === canonical && o.status === 'pending'
              ? { ...o, status: 'cancelled', ocoTriggeredReason: triggered === 'tp' ? 'take_profit' : 'stop_loss' }
              : o
          )
        );

        setTransactions((prev) => [
          {
            id: `tx-bracket-${Date.now()}`,
            type: 'sell',
            amount: totalProceeds,
            symbol: canonical,
            shares: sharesToClose,
            price: exitPrice,
            timestamp: Date.now(),
            status: 'completed',
            referenceCode: `${triggered.toUpperCase()}-BRACKET-${Date.now().toString().slice(-6)}`,
            description: triggered === 'tp'
              ? `🎯 Take-Profit Target Hit: Closed ${sharesToClose} ${canonical} @ $${exitPrice.toFixed(2)} (+${pnlPct}%)`
              : `🛡️ Stop-Loss Triggered: Closed ${sharesToClose} ${canonical} @ $${exitPrice.toFixed(2)} (${pnlPct}%)`,
          },
          ...prev,
        ]);

        addToast({
          type: triggered === 'tp' ? 'success' : 'warning',
          title: triggered === 'tp' ? '🎯 Take-Profit Triggered' : '🛡️ Stop-Loss Triggered',
          message: `${triggered === 'tp' ? 'Profit locked in' : 'Downside protected'}: Sold ${sharesToClose} ${canonical} @ $${exitPrice.toFixed(2)} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`,
        });
      }
    }
  }, []);

  // Public Coinbase WebSocket connection for crypto pairs (BTC-USD, ETH-USD, SOL-USD)
  useEffect(() => {
    coinbaseWS.connect();

    const unsubStatus = coinbaseWS.onStatusChange((connected) => {
      setIsWsConnected(connected);
    });

    const unsubTick = coinbaseWS.onTick((ticker) => {
      setWsTickCount((c) => c + 1);

      // Update ticker quote in stocks
      setStocks((prev) => {
        const existing = prev[ticker.productId];
        if (!existing) return prev;
        const prevClose = existing.previousClose || existing.price;
        const priceDiff = Number((ticker.price - prevClose).toFixed(2));
        const changePct = Number(((priceDiff / prevClose) * 100).toFixed(2));
        const newHigh = Math.max(ticker.high24h ?? existing.high, ticker.price);
        const newLow = Math.min(ticker.low24h ?? existing.low, ticker.price);
        const volume = ticker.volume24h ? Math.round(ticker.volume24h) : existing.volume;

        return {
          ...prev,
          [ticker.productId]: {
            ...existing,
            price: ticker.price,
            change: priceDiff,
            changePercent: changePct,
            high: newHigh,
            low: newLow,
            volume,
          },
        };
      });

      // Update candles & depth if user is currently viewing this ticker
      if (selectedSymbolRef.current === ticker.productId) {
        setCandles((prev) => {
          if (!prev.length) return prev;
          const copy = [...prev];
          const last = { ...copy[copy.length - 1] };
          last.close = ticker.price;
          last.high = Math.max(last.high, ticker.price);
          last.low = Math.min(last.low, ticker.price);
          last.volume += 1;
          copy[copy.length - 1] = last;
          return copy;
        });

        setOrderBook(generateOrderBook(ticker.price));

        setTape((prev) => [
          {
            id: `cb-live-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            price: ticker.price,
            size: Math.floor(1 + Math.random() * 5),
            side: ticker.side || 'buy',
          },
          ...prev.slice(0, 24),
        ]);
      }

      // Check order & bracket triggers for this live price
      evaluateTriggers(ticker.productId, ticker.price);
    });

    return () => {
      unsubStatus();
      unsubTick();
    };
  }, [evaluateTriggers]);

  // Real-time market tick generator (every 1.6s for equities)
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick 2 to 4 random stocks to update
      const allSymbols = Object.keys(stocksRef.current);
      const updateCount = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...allSymbols].sort(() => Math.random() - 0.5).slice(0, updateCount);

      // Always include selectedSymbol occasionally for responsive charting
      if (!shuffled.includes(selectedSymbol) && Math.random() > 0.3) {
        shuffled.push(selectedSymbol);
      }

      setStocks((prev) => {
        const next = { ...prev };
        shuffled.forEach((sym) => {
          // If this is a crypto pair connected to WebSocket, let WS drive it
          if (sym === 'BTC-USD' || sym === 'ETH-USD' || sym === 'SOL-USD') return;

          const current = prev[sym];
          if (!current) return;

          // Geometric Brownian motion micro-tick: -0.15% to +0.15%
          const deltaPct = (Math.random() - 0.495) * 0.003;
          let newPrice = current.price * (1 + deltaPct);
          newPrice = Math.max(0.1, Number(newPrice.toFixed(2)));

          const priceDiff = Number((newPrice - current.previousClose).toFixed(2));
          const changePct = Number(((priceDiff / current.previousClose) * 100).toFixed(2));
          const newHigh = Math.max(current.high, newPrice);
          const newLow = Math.min(current.low, newPrice);
          const addVol = Math.floor(100 + Math.random() * 900);

          next[sym] = {
            ...current,
            price: newPrice,
            change: priceDiff,
            changePercent: changePct,
            high: newHigh,
            low: newLow,
            volume: current.volume + addVol,
          };

          // Evaluate triggers for this equity ticker
          evaluateTriggers(sym, newPrice);
        });
        return next;
      });

      // Update market indices slightly
      setMarketIndices((prev) =>
        prev.map((idx) => {
          const delta = (Math.random() - 0.49) * 0.0015;
          const newPrice = Number((idx.price * (1 + delta)).toFixed(2));
          const change = Number((idx.change + (newPrice - idx.price)).toFixed(2));
          const changePercent = Number(((change / (idx.price - idx.change)) * 100).toFixed(2));
          return { ...idx, price: newPrice, change, changePercent };
        })
      );
    }, 1600);

    return () => clearInterval(interval);
  }, [selectedSymbol, evaluateTriggers]);

  // When selectedStock price changes, update the last candle and order book
  useEffect(() => {
    if (!selectedStock) return;
    const currentPrice = selectedStock.price;

    // Update last candle
    setCandles((prev) => {
      if (!prev.length) return prev;
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.close = currentPrice;
      last.high = Math.max(last.high, currentPrice);
      last.low = Math.min(last.low, currentPrice);
      last.volume += Math.floor(10 + Math.random() * 40);
      copy[copy.length - 1] = last;
      return copy;
    });

    // Update order book around new price
    setOrderBook(generateOrderBook(currentPrice));

    // Occasionally push a new tape print
    if (Math.random() > 0.4) {
      const side = Math.random() > 0.48 ? 'buy' : 'sell';
      const offset = (Math.random() - 0.5) * 0.08;
      const printPrice = Number((currentPrice + offset).toFixed(2));
      const printSize = Math.floor(10 + Math.random() * 120);

      setTape((prev) => [
        {
          id: `trade-live-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          price: printPrice,
          size: printSize,
          side,
        },
        ...prev.slice(0, 24),
      ]);
    }

    // Check triggers on price tick
    evaluateTriggers(selectedStock.symbol, currentPrice);
  }, [selectedStock?.price, evaluateTriggers]);

  // Recalculate positions based on latest stock prices
  useEffect(() => {
    setPositions((prev) => {
      let changed = false;
      const next: Record<string, Position> = {};

      Object.entries(prev).forEach(([sym, pos]) => {
        const canonical = (pos.symbol === 'BTC' || sym === 'BTC') ? 'BTC-USD' :
                          (pos.symbol === 'ETH' || sym === 'ETH') ? 'ETH-USD' : (pos.symbol || sym);
        if (canonical !== sym) {
          changed = true;
        }

        const quote = stocks[canonical] || stocks[sym];
        const existing = next[canonical];
        const shares = (existing?.shares || 0) + pos.shares;
        const totalCost = (existing?.totalCost || 0) + pos.totalCost;
        const avgCost = shares > 0 ? Number((totalCost / shares).toFixed(2)) : (existing?.avgCost || pos.avgCost);

        if (quote) {
          const currentPrice = quote.price;
          const marketValue = Number((shares * currentPrice).toFixed(2));
          const unrealizedPnL = Number((marketValue - totalCost).toFixed(2));
          const unrealizedPnLPercent = totalCost > 0 ? Number(((unrealizedPnL / totalCost) * 100).toFixed(2)) : 0;
          const dailyPnL = Number((shares * quote.change).toFixed(2));

          if (
            !existing && (
              pos.currentPrice !== currentPrice ||
              pos.marketValue !== marketValue ||
              pos.unrealizedPnL !== unrealizedPnL
            )
          ) {
            changed = true;
          }

          next[canonical] = {
            ...pos,
            symbol: canonical,
            shares,
            avgCost,
            totalCost,
            currentPrice,
            marketValue,
            unrealizedPnL,
            unrealizedPnLPercent,
            dailyPnL,
          };
        } else {
          next[canonical] = {
            ...pos,
            symbol: canonical,
            shares,
            avgCost,
            totalCost,
          };
        }
      });

      return changed ? next : prev;
    });
  }, [stocks]);

  // Portfolio aggregates
  const totalMarketValue = useMemo(() => {
    return Object.values(positions).reduce((acc, pos) => acc + (pos.marketValue || 0), 0);
  }, [positions]);

  const totalCostBasis = useMemo(() => {
    return Object.values(positions).reduce((acc, pos) => acc + (pos.totalCost || 0), 0);
  }, [positions]);

  const totalEquity = useMemo(() => {
    return Number((cashBalance + totalMarketValue).toFixed(2));
  }, [cashBalance, totalMarketValue]);

  const unrealizedPnL = useMemo(() => {
    return Number((totalMarketValue - totalCostBasis).toFixed(2));
  }, [totalMarketValue, totalCostBasis]);

  const unrealizedPnLPercent = useMemo(() => {
    if (totalCostBasis === 0) return 0;
    return Number(((unrealizedPnL / totalCostBasis) * 100).toFixed(2));
  }, [unrealizedPnL, totalCostBasis]);

  const dailyPnL = useMemo(() => {
    return Object.values(positions).reduce((acc, pos) => acc + (pos.dailyPnL || 0), 0);
  }, [positions]);

  const dailyPnLPercent = useMemo(() => {
    const prevEquity = totalEquity - dailyPnL;
    if (prevEquity <= 0) return 0;
    return Number(((dailyPnL / prevEquity) * 100).toFixed(2));
  }, [dailyPnL, totalEquity]);

  // Watchlist helpers
  const toggleWatchlist = (symbol: string) => {
    setWatchlists((prev) => {
      const exists = prev.includes(symbol);
      const updated = exists ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      addToast({
        type: exists ? 'info' : 'success',
        title: exists ? 'Removed from Watchlist' : 'Added to Watchlist',
        message: `${symbol} ${exists ? 'removed from' : 'added to'} your active watchlist`,
      });
      return updated;
    });
  };

  const isWatchlisted = (symbol: string) => watchlists.includes(symbol);

  // Secure payment deposit simulation
  const depositFunds = (amount: number, methodId: string, description: string) => {
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Please enter a valid deposit amount.', ref: '' };
    }

    const ref = `DEP-${Math.floor(1000000 + Math.random() * 9000000)}-ACH`;
    setCashBalance((prev) => Number((prev + amount).toFixed(2)));

    const newTx: Transaction = {
      id: `tx-dep-${Date.now()}`,
      type: 'deposit',
      amount,
      paymentMethod: description,
      timestamp: Date.now(),
      status: 'completed',
      referenceCode: ref,
      description: `Secure Deposit from ${description}`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    addToast({
      type: 'success',
      title: 'Funds Deposited Successfully',
      message: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} credited to Buying Power via ${description}`,
    });

    return {
      success: true,
      message: `Deposit of $${amount.toFixed(2)} completed. Ref: ${ref}`,
      ref,
    };
  };

  // Withdrawal simulation
  const withdrawFunds = (amount: number, methodId: string, description: string) => {
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Please enter a valid withdrawal amount.', ref: '' };
    }
    if (amount > cashBalance) {
      return {
        success: false,
        message: `Insufficient available cash. Max withdrawable: $${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        ref: '',
      };
    }

    const ref = `WDR-${Math.floor(1000000 + Math.random() * 9000000)}-ACH`;
    setCashBalance((prev) => Number((prev - amount).toFixed(2)));

    const newTx: Transaction = {
      id: `tx-wdr-${Date.now()}`,
      type: 'withdrawal',
      amount,
      paymentMethod: description,
      timestamp: Date.now(),
      status: 'completed',
      referenceCode: ref,
      description: `Disbursement transfer to ${description}`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    addToast({
      type: 'info',
      title: 'Withdrawal Initiated',
      message: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} transferred to ${description} (Ref: ${ref})`,
    });

    return {
      success: true,
      message: `Withdrawal of $${amount.toFixed(2)} submitted. Ref: ${ref}`,
      ref,
    };
  };

  // Add new payment method
  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newPm: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}`,
    };
    setPaymentMethods((prev) => [...prev, newPm]);
    addToast({
      type: 'success',
      title: 'Payment Method Linked',
      message: `${newPm.institutionOrBrand} (${newPm.accountNumberMasked}) verified and ready for instant funding`,
    });
    return newPm;
  };

  // Trade Execution Engine with Bracket & OCO Support
  const executeTrade = ({
    symbol,
    side,
    type,
    shares,
    limitPrice,
    stopPrice,
    takeProfitPrice,
    stopLossPrice,
    isBracket,
  }: {
    symbol: string;
    side: 'buy' | 'sell';
    type: OrderType;
    shares: number;
    limitPrice?: number;
    stopPrice?: number;
    takeProfitPrice?: number;
    stopLossPrice?: number;
    isBracket?: boolean;
  }) => {
    const canonicalSymbol = symbol === 'BTC' ? 'BTC-USD' : symbol === 'ETH' ? 'ETH-USD' : symbol;
    const stock = stocks[canonicalSymbol] || INITIAL_STOCKS[canonicalSymbol] || stocks[symbol] || INITIAL_STOCKS[symbol];
    if (!stock) {
      return { success: false, message: `Unknown ticker symbol ${symbol}` };
    }

    if (shares <= 0 || isNaN(shares)) {
      return { success: false, message: 'Please enter a valid positive quantity of shares.' };
    }

    const executionPrice = stock.price;
    const estTotal = Number((shares * (type === 'limit' && limitPrice ? limitPrice : executionPrice)).toFixed(2));

    if (side === 'buy') {
      if (estTotal > cashBalance) {
        return {
          success: false,
          message: `Insufficient buying power. Required: $${estTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}, Available: $${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        };
      }
    } else {
      const owned = (positions[canonicalSymbol]?.shares || positions[symbol]?.shares || 0);
      if (shares > owned) {
        return {
          success: false,
          message: `Cannot sell ${shares} shares of ${canonicalSymbol}. You currently own ${owned} shares.`,
        };
      }
    }

    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (type === 'limit') {
      // Pending Limit Order
      const newOrder: Order = {
        id: orderId,
        symbol: canonicalSymbol,
        name: stock.name,
        side,
        type: 'limit',
        shares,
        limitPrice,
        total: estTotal,
        status: 'pending',
        timestamp: Date.now(),
        isBracket: isBracket || (!!takeProfitPrice || !!stopLossPrice),
        takeProfitPrice: takeProfitPrice && takeProfitPrice > 0 ? takeProfitPrice : undefined,
        stopLossPrice: stopLossPrice && stopLossPrice > 0 ? stopLossPrice : undefined,
      };

      setOrders((prev) => [newOrder, ...prev]);

      if (side === 'buy') {
        // Reserve cash for limit order
        setCashBalance((prev) => Number((prev - estTotal).toFixed(2)));
      }

      addToast({
        type: 'info',
        title: 'Limit Order Placed',
        message: `${side.toUpperCase()} ${shares} ${canonicalSymbol} @ $${limitPrice?.toFixed(2)} entered in order book${isBracket ? ' (Bracket attached)' : ''}`,
      });

      return {
        success: true,
        message: `Limit order placed for ${shares} ${canonicalSymbol} at $${limitPrice?.toFixed(2)}${isBracket ? ' with bracket TP/SL' : ''}`,
        orderId,
      };
    }

    // Market Order: Instant fill
    const actualTotal = Number((shares * executionPrice).toFixed(2));
    const hasBracket = isBracket || (side === 'buy' && (!!takeProfitPrice || !!stopLossPrice));
    const bgId = hasBracket ? `bg-${orderId}` : undefined;

    const newOrder: Order = {
      id: orderId,
      symbol: canonicalSymbol,
      name: stock.name,
      side,
      type: 'market',
      shares,
      executionPrice,
      total: actualTotal,
      status: 'filled',
      timestamp: Date.now(),
      filledAt: Date.now(),
      isBracket: hasBracket,
      takeProfitPrice: takeProfitPrice && takeProfitPrice > 0 ? takeProfitPrice : undefined,
      stopLossPrice: stopLossPrice && stopLossPrice > 0 ? stopLossPrice : undefined,
    };

    const newOrdersToAdd: Order[] = [newOrder];

    // If this is a buy with bracket, also create pending OCO child orders for TP & SL
    if (side === 'buy' && hasBracket) {
      if (takeProfitPrice && takeProfitPrice > 0) {
        newOrdersToAdd.push({
          id: `ord-tp-${Date.now()}`,
          symbol: canonicalSymbol,
          name: stock.name,
          side: 'sell',
          type: 'limit',
          shares,
          limitPrice: takeProfitPrice,
          total: Number((shares * takeProfitPrice).toFixed(2)),
          status: 'pending',
          timestamp: Date.now(),
          isBracket: true,
          bracketGroupId: bgId,
          parentOrderId: orderId,
        });
      }
      if (stopLossPrice && stopLossPrice > 0) {
        newOrdersToAdd.push({
          id: `ord-sl-${Date.now() + 1}`,
          symbol: canonicalSymbol,
          name: stock.name,
          side: 'sell',
          type: 'stop_loss',
          shares,
          stopPrice: stopLossPrice,
          total: Number((shares * stopLossPrice).toFixed(2)),
          status: 'pending',
          timestamp: Date.now(),
          isBracket: true,
          bracketGroupId: bgId,
          parentOrderId: orderId,
        });
      }
    }

    setOrders((prev) => [...newOrdersToAdd, ...prev]);

    if (side === 'buy') {
      // Deduct cash
      setCashBalance((prev) => Number((prev - actualTotal).toFixed(2)));

      // Add to position with bracket thresholds
      setPositions((prev) => {
        const copy = { ...prev };
        delete copy['BTC'];
        delete copy['ETH'];
        const existing = copy[canonicalSymbol] || prev[symbol];
        if (existing) {
          const newShares = existing.shares + shares;
          const newTotalCost = existing.totalCost + actualTotal;
          const newAvgCost = Number((newTotalCost / newShares).toFixed(2));
          return {
            ...copy,
            [canonicalSymbol]: {
              ...existing,
              symbol: canonicalSymbol,
              shares: newShares,
              avgCost: newAvgCost,
              totalCost: newTotalCost,
              marketValue: Number((newShares * executionPrice).toFixed(2)),
              takeProfitPrice: (takeProfitPrice && takeProfitPrice > 0) ? takeProfitPrice : existing.takeProfitPrice,
              stopLossPrice: (stopLossPrice && stopLossPrice > 0) ? stopLossPrice : existing.stopLossPrice,
              bracketOrderId: orderId,
            },
          };
        } else {
          return {
            ...copy,
            [canonicalSymbol]: {
              symbol: canonicalSymbol,
              name: stock.name,
              shares,
              avgCost: executionPrice,
              currentPrice: executionPrice,
              marketValue: actualTotal,
              totalCost: actualTotal,
              unrealizedPnL: 0,
              unrealizedPnLPercent: 0,
              dailyPnL: 0,
              takeProfitPrice: (takeProfitPrice && takeProfitPrice > 0) ? takeProfitPrice : undefined,
              stopLossPrice: (stopLossPrice && stopLossPrice > 0) ? stopLossPrice : undefined,
              bracketOrderId: orderId,
            },
          };
        }
      });
    } else {
      // Sell order: Credit cash
      setCashBalance((prev) => Number((prev + actualTotal).toFixed(2)));

      // Calculate realized P&L
      const pos = positions[canonicalSymbol] || positions[symbol];
      if (pos) {
        const costPortion = Number((shares * pos.avgCost).toFixed(2));
        const gain = Number((actualTotal - costPortion).toFixed(2));
        setRealizedPnL((prev) => Number((prev + gain).toFixed(2)));
      }

      // Update position
      setPositions((prev) => {
        const copy = { ...prev };
        delete copy['BTC'];
        delete copy['ETH'];
        const existing = copy[canonicalSymbol] || prev[symbol];
        if (!existing) return copy;
        const remainingShares = Math.max(0, existing.shares - shares);
        if (remainingShares === 0) {
          delete copy[canonicalSymbol];
          delete copy[symbol];
          return copy;
        }
        return {
          ...copy,
          [canonicalSymbol]: {
            ...existing,
            symbol: canonicalSymbol,
            shares: remainingShares,
            totalCost: Number((remainingShares * existing.avgCost).toFixed(2)),
            marketValue: Number((remainingShares * executionPrice).toFixed(2)),
            takeProfitPrice: remainingShares > 0 ? existing.takeProfitPrice : undefined,
            stopLossPrice: remainingShares > 0 ? existing.stopLossPrice : undefined,
          },
        };
      });
    }

    // Ledger transaction
    setTransactions((prev) => [
      {
        id: `tx-ord-${Date.now()}`,
        type: side,
        amount: actualTotal,
        symbol: canonicalSymbol,
        shares,
        price: executionPrice,
        timestamp: Date.now(),
        status: 'completed',
        referenceCode: `MKT-${orderId.slice(-6).toUpperCase()}`,
        description: `Executed Market ${side.toUpperCase()}: ${shares} ${canonicalSymbol} @ $${executionPrice.toFixed(2)}${hasBracket ? ' (Bracket OCO attached)' : ''}`,
      },
      ...prev,
    ]);

    addToast({
      type: 'success',
      title: hasBracket ? 'Bracket Order Active' : 'Order Filled',
      message: `${side.toUpperCase()} ${shares} ${canonicalSymbol} filled at $${executionPrice.toFixed(2)}${hasBracket ? ` (TP: $${takeProfitPrice?.toFixed(2) || '—'} / SL: $${stopLossPrice?.toFixed(2) || '—'})` : ''}`,
    });

    return {
      success: true,
      message: `Market order executed: ${shares} ${canonicalSymbol} @ $${executionPrice.toFixed(2)}${hasBracket ? ' with active bracket levels' : ''}`,
      orderId,
    };
  };

  // Modify bracket targets on an existing open position
  const updatePositionBracket = (symbol: string, takeProfitPrice?: number, stopLossPrice?: number) => {
    const canonical = symbol === 'BTC' ? 'BTC-USD' : symbol === 'ETH' ? 'ETH-USD' : symbol;
    setPositions((prev) => {
      const existing = prev[canonical];
      if (!existing) return prev;
      return {
        ...prev,
        [canonical]: {
          ...existing,
          takeProfitPrice: takeProfitPrice && takeProfitPrice > 0 ? takeProfitPrice : undefined,
          stopLossPrice: stopLossPrice && stopLossPrice > 0 ? stopLossPrice : undefined,
        },
      };
    });

    addToast({
      type: 'info',
      title: 'Bracket Levels Updated',
      message: `${canonical}: TP ${takeProfitPrice ? '$' + takeProfitPrice.toFixed(2) : 'cleared'} · SL ${stopLossPrice ? '$' + stopLossPrice.toFixed(2) : 'cleared'}`,
    });
  };

  // Cancel order (with OCO companion cancellation)
  const cancelOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'pending') return false;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return { ...o, status: 'cancelled' };
        }
        // If part of an OCO bracket group, cancel companion order as well
        if (order.bracketGroupId && o.bracketGroupId === order.bracketGroupId && o.status === 'pending') {
          return { ...o, status: 'cancelled' };
        }
        return o;
      })
    );

    if (order.side === 'buy') {
      // Refund reserved cash
      setCashBalance((prev) => Number((prev + order.total).toFixed(2)));
    }

    addToast({
      type: 'info',
      title: 'Order Cancelled',
      message: `Pending order for ${order.shares} ${order.symbol} cancelled${order.bracketGroupId ? ' (Companion OCO bracket order also cancelled)' : ''}`,
    });

    return true;
  };

  // Reset demo account to starting state
  const resetAccount = () => {
    setCashBalance(85000.00);
    setPositions(DEFAULT_INITIAL_POSITIONS);
    setRealizedPnL(1240.50);
    setWatchlists(DEFAULT_WATCHLIST);
    setPaymentMethods(INITIAL_PAYMENT_METHODS);
    setOrders([]);
    setTransactions([
      {
        id: `tx-reset-${Date.now()}`,
        type: 'deposit',
        amount: 85000.00,
        paymentMethod: 'JPMorgan Chase Bank (•••• 8291)',
        timestamp: Date.now(),
        status: 'completed',
        referenceCode: 'DEP-RESET-SIM',
        description: 'Account Initial Capital Allocation (Simulated Paper Trading)',
      },
    ]);

    addToast({
      type: 'info',
      title: 'Account Reset',
      message: 'Portfolio restored to initial paper trading balance ($85,000 cash + initial holdings)',
    });
  };

  return (
    <TradingContext.Provider
      value={{
        stocks,
        marketIndices,
        selectedSymbol,
        setSelectedSymbol,
        selectedStock,
        timeframe,
        setTimeframe,
        candles,
        orderBook,
        tape,
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
        watchlists,
        toggleWatchlist,
        isWatchlisted,
        activeTab,
        setActiveTab,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        paymentModalInitialTab,
        openPaymentModal,
        cashBalance,
        positions,
        orders,
        transactions,
        paymentMethods,
        realizedPnL,
        totalEquity,
        totalMarketValue,
        totalCostBasis,
        unrealizedPnL,
        unrealizedPnLPercent,
        dailyPnL,
        dailyPnLPercent,
        depositFunds,
        withdrawFunds,
        addPaymentMethod,
        executeTrade,
        updatePositionBracket,
        cancelOrder,
        resetAccount,
        toasts,
        dismissToast,
        addToast,
        quickTradePrefill,
        setQuickTradePrefill,
        isLiveConnected,
        isWsConnected,
        wsTickCount,
        lastLiveSync,
        refreshLiveMarketData,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = (): TradingContextType => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
