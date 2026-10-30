import { StrategyType } from '../utils/backtestEngine';

export type BotStatus = 'IDLE' | 'SCANNING' | 'ARMED' | 'COOLDOWN' | 'PAUSED' | 'HALTED';

export type BrokerIntegrationType = 'paper_simulated' | 'alpaca_brokerage' | 'coinbase_advanced';

export interface BrokerEndpointConfig {
  type: BrokerIntegrationType;
  name: string;
  description: string;
  status: 'active' | 'ready_for_credentials' | 'simulated';
  apiUrl: string;
  wsUrl?: string;
  supportsBrackets: boolean;
  requiredKeys: string[];
}

export interface BotConfig {
  enabled: boolean;
  strategyId: StrategyType | 'all_confluence';
  selectedSymbols: string[];
  minConfidence: number; // e.g. 84 (%)
  maxAllocationPerTrade: number; // e.g. $2,500
  maxOpenBotPositions: number; // e.g. 3 concurrent positions
  cooldownSeconds: number; // e.g. 60s per symbol
  takeProfitOffsetPct: number; // e.g. 6.5%
  stopLossOffsetPct: number; // e.g. 3.0%
  soundAlerts: boolean;
  brokerIntegration: BrokerIntegrationType;
  apiKeyMasked?: string;
  apiSecretMasked?: string;
}

export interface BotLogEntry {
  id: string;
  timestamp: number;
  type: 'SCAN' | 'SIGNAL' | 'EXECUTE' | 'OCO_EXIT' | 'REJECT' | 'KILL_SWITCH' | 'SYSTEM';
  symbol: string;
  message: string;
  confidence?: number;
  strategyName?: string;
  price?: number;
  shares?: number;
  pnl?: number;
}

export interface BotMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  realizedPnl: number;
  uptimeSeconds: number;
  lastExecutionTimestamp?: number;
}
