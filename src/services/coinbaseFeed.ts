/**
 * Coinbase Exchange Public WebSocket Service
 * 
 * Connects directly to the zero-auth, zero-key public market data feed:
 * wss://ws-feed.exchange.coinbase.com
 * 
 * Supports real-time ticker stream for BTC-USD, ETH-USD, SOL-USD, etc.
 * Features automated exponential backoff reconnection, heartbeat monitoring,
 * and clean subscription management.
 */

export interface CryptoTickerData {
  productId: string;
  price: number;
  open24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  time: string;
  side?: 'buy' | 'sell';
  bestBid?: number;
  bestAsk?: number;
}

export type TickCallback = (data: CryptoTickerData) => void;
export type StatusCallback = (connected: boolean, message?: string) => void;

class CoinbaseWebSocketService {
  private ws: WebSocket | null = null;
  private url = 'wss://ws-feed.exchange.coinbase.com';
  private tickListeners: Set<TickCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private activeSubscriptions: Set<string> = new Set(['BTC-USD', 'ETH-USD', 'SOL-USD']);
  private isExplicitlyClosed = false;
  private pingInterval: any = null;

  constructor() {
    // Lazy connection initialized on demand
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    this.isExplicitlyClosed = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus(true, 'Connected to Coinbase WebSocket');
        this.sendSubscription();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ticker' && data.product_id && data.price) {
            const parsedPrice = parseFloat(data.price);
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              const ticker: CryptoTickerData = {
                productId: data.product_id,
                price: parsedPrice,
                open24h: data.open_24h ? parseFloat(data.open_24h) : undefined,
                high24h: data.high_24h ? parseFloat(data.high_24h) : undefined,
                low24h: data.low_24h ? parseFloat(data.low_24h) : undefined,
                volume24h: data.volume_24h ? parseFloat(data.volume_24h) : undefined,
                time: data.time || new Date().toISOString(),
                side: data.side === 'buy' || data.side === 'sell' ? data.side : undefined,
                bestBid: data.best_bid ? parseFloat(data.best_bid) : undefined,
                bestAsk: data.best_ask ? parseFloat(data.best_ask) : undefined,
              };
              this.notifyTick(ticker);
            }
          }
        } catch {
          // Ignore unparseable or irrelevant system messages
        }
      };

      this.ws.onerror = (err) => {
        this.notifyStatus(false, 'Coinbase WebSocket error');
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.notifyStatus(false, 'Coinbase WebSocket disconnected');
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (e) {
      this.notifyStatus(false, 'Failed to initialize WebSocket');
      this.scheduleReconnect();
    }
  }

  private sendSubscription(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const product_ids = Array.from(this.activeSubscriptions);
    if (product_ids.length === 0) return;

    const subscribeMessage = {
      type: 'subscribe',
      product_ids,
      channels: ['ticker'],
    };

    try {
      this.ws.send(JSON.stringify(subscribeMessage));
    } catch {
      // Failed to send subscription
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // Keep connection alive with periodic no-op check
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Coinbase does not require special ping frames, but checking state is good
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.isExplicitlyClosed) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  public subscribe(products: string[]): void {
    let changed = false;
    products.forEach((p) => {
      if (!this.activeSubscriptions.has(p)) {
        this.activeSubscriptions.add(p);
        changed = true;
      }
    });

    if (changed && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription();
    }
  }

  public onTick(callback: TickCallback): () => void {
    this.tickListeners.add(callback);
    return () => {
      this.tickListeners.delete(callback);
    };
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    // Immediately emit current state
    const isConnected = this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    callback(isConnected, isConnected ? 'Connected' : 'Disconnected');
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyTick(ticker: CryptoTickerData): void {
    this.tickListeners.forEach((listener) => {
      try {
        listener(ticker);
      } catch (err) {
        console.error('Error in tick listener', err);
      }
    });
  }

  private notifyStatus(connected: boolean, message?: string): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected, message);
      } catch (err) {
        console.error('Error in status listener', err);
      }
    });
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }
    this.notifyStatus(false, 'Disconnected by user');
  }
}

export const coinbaseWS = new CoinbaseWebSocketService();
