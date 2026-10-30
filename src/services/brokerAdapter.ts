import { BrokerIntegrationType, BrokerEndpointConfig } from '../types/bot';

export interface BrokerOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'bracket';
  shares: number;
  limitPrice?: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  clientOrderId?: string;
}

export interface BrokerOrderResponse {
  success: boolean;
  orderId: string;
  broker: BrokerIntegrationType;
  status: 'filled' | 'pending' | 'routed_to_broker';
  message: string;
  simulatedPayload?: Record<string, any>;
}

export const BROKER_CONFIGS: Record<BrokerIntegrationType, BrokerEndpointConfig> = {
  paper_simulated: {
    type: 'paper_simulated',
    name: 'TATM Internal Paper Engine',
    description: 'Autonomous zero-risk simulated order execution with tick-by-tick OCO liquidation.',
    status: 'active',
    apiUrl: 'local://tatm.engine/v1/orders',
    supportsBrackets: true,
    requiredKeys: [],
  },
  alpaca_brokerage: {
    type: 'alpaca_brokerage',
    name: 'Alpaca Markets (Equities & Crypto)',
    description: 'Institutional-grade developer brokerage. Directly accepts native bracket orders (order_class: bracket) for US stocks.',
    status: 'ready_for_credentials',
    apiUrl: 'https://paper-api.alpaca.markets/v2/orders',
    wsUrl: 'wss://stream.data.alpaca.markets/v2/sip',
    supportsBrackets: true,
    requiredKeys: ['APCA-API-KEY-ID', 'APCA-API-SECRET-KEY'],
  },
  coinbase_advanced: {
    type: 'coinbase_advanced',
    name: 'Coinbase Advanced Trade (Crypto)',
    description: 'Direct spot market execution across BTC-USD, ETH-USD, and SOL-USD. Connects to the same engine streaming our WebSocket ticks.',
    status: 'ready_for_credentials',
    apiUrl: 'https://api.coinbase.com/api/v3/brokerage/orders',
    wsUrl: 'wss://ws-feed.exchange.coinbase.com',
    supportsBrackets: true,
    requiredKeys: ['CB-ACCESS-KEY', 'CB-ACCESS-PASSPHRASE', 'CB-ACCESS-TIMESTAMP'],
  },
};

/**
 * Builds the exact JSON payload format required by each real-world broker
 */
export function generateBrokerPayload(
  broker: BrokerIntegrationType,
  order: BrokerOrderRequest
): Record<string, any> {
  const clientOrderId = order.clientOrderId || `tatm-bot-${Date.now()}`;

  switch (broker) {
    case 'alpaca_brokerage':
      return {
        symbol: order.symbol.replace('-USD', ''),
        qty: order.shares,
        side: order.side,
        type: order.type === 'bracket' ? 'market' : order.type,
        time_in_force: 'gtc',
        order_class: order.takeProfitPrice && order.stopLossPrice ? 'bracket' : 'simple',
        take_profit: order.takeProfitPrice
          ? { limit_price: Number(order.takeProfitPrice.toFixed(2)) }
          : undefined,
        stop_loss: order.stopLossPrice
          ? { stop_price: Number(order.stopLossPrice.toFixed(2)) }
          : undefined,
        client_order_id: clientOrderId,
      };

    case 'coinbase_advanced':
      return {
        client_order_id: clientOrderId,
        product_id: order.symbol.includes('-') ? order.symbol : `${order.symbol}-USD`,
        side: order.side.toUpperCase(),
        order_configuration: {
          market_market_ioc: {
            base_size: order.shares.toString(),
          },
        },
        attached_bracket: order.takeProfitPrice && order.stopLossPrice ? {
          take_profit_price: order.takeProfitPrice.toFixed(2),
          stop_loss_price: order.stopLossPrice.toFixed(2),
        } : undefined,
      };

    case 'paper_simulated':
    default:
      return {
        id: clientOrderId,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        shares: order.shares,
        takeProfitPrice: order.takeProfitPrice,
        stopLossPrice: order.stopLossPrice,
        executionMode: 'paper_simulation',
      };
  }
}
