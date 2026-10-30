import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { StrategyType } from '../utils/backtestEngine';
import { BROKER_CONFIGS, generateBrokerPayload } from '../services/brokerAdapter';
import { BrokerIntegrationType } from '../types/bot';
import { playTradeExecuteSound, playSignalAlertSound } from '../utils/audioAlerts';
import {
  Bot,
  Play,
  Pause,
  AlertOctagon,
  ShieldAlert,
  Sliders,
  Terminal,
  Volume2,
  VolumeX,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCircle2,
  Zap,
  Lock,
  Globe,
  Radio,
  Clock,
  RotateCcw,
} from 'lucide-react';

const STRATEGY_OPTIONS: { id: StrategyType | 'all_confluence'; label: string; tag: string }[] = [
  { id: 'all_confluence', label: 'Multi-Strategy High Confluence', tag: 'Recommended' },
  { id: 'bollinger_squeeze', label: 'Bollinger Band Squeeze Breakout', tag: 'Volatility' },
  { id: 'vwap_reversion', label: 'VWAP Institutional Mean Reversion', tag: 'Liquidity' },
  { id: 'macd_cross', label: 'MACD Crossover Momentum', tag: 'Velocity' },
  { id: 'rsi_reversion', label: 'RSI(14) Mean Reversion', tag: 'Oscillator' },
  { id: 'breakout_momentum', label: '20-Day Donchian Breakout', tag: 'Trend' },
  { id: 'sma_cross', label: '20/50 SMA Golden Cross', tag: 'Moving Avg' },
];

export const AgentBotView: React.FC = () => {
  const {
    stocks,
    botConfig,
    updateBotConfig,
    botStatus,
    botLogs,
    clearBotLogs,
    botMetrics,
    toggleBotMasterSwitch,
    triggerPanicKillSwitch,
    setActiveTab,
    setSelectedSymbol,
    cashBalance,
    positions,
  } = useTrading();

  const [logFilter, setLogFilter] = useState<'ALL' | 'EXECUTE' | 'SIGNAL' | 'OCO_EXIT' | 'SCAN'>('ALL');
  const [showBrokerModal, setShowBrokerModal] = useState<boolean>(false);
  const [selectedBrokerPreview, setSelectedBrokerPreview] = useState<BrokerIntegrationType>(botConfig.brokerIntegration);

  const availableSymbols = Object.keys(stocks);
  const isArmed = botConfig.enabled;

  const filteredLogs = botLogs.filter((l) => {
    if (logFilter === 'ALL') return true;
    return l.type === logFilter;
  });

  const toggleSymbolSelection = (sym: string) => {
    const exists = botConfig.selectedSymbols.includes(sym);
    let nextList: string[];
    if (exists) {
      if (botConfig.selectedSymbols.length <= 1) return; // keep at least 1
      nextList = botConfig.selectedSymbols.filter((s) => s !== sym);
    } else {
      nextList = [...botConfig.selectedSymbols, sym];
    }
    updateBotConfig({ selectedSymbols: nextList });
  };

  const activePositionCount = Object.keys(positions).length;

  // Format uptime HH:MM:SS
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sample payload for the selected broker
  const sampleBrokerPayload = generateBrokerPayload(selectedBrokerPreview, {
    symbol: 'BTC-USD',
    side: 'buy',
    type: 'bracket',
    shares: 0.25,
    limitPrice: 68500.0,
    takeProfitPrice: 72950.0,
    stopLossPrice: 66450.0,
  });

  return (
    <div className="space-y-6">
      {/* 1. Master Control Header Card */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                isArmed
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : botStatus === 'HALTED'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              <Bot className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight">
                  Autonomous Quantitative Bot Station
                </h1>
                <span
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border uppercase tracking-wider ${
                    isArmed
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                      : botStatus === 'HALTED'
                      ? 'bg-rose-950/80 text-rose-400 border-rose-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isArmed
                        ? 'bg-emerald-400 animate-pulse'
                        : botStatus === 'HALTED'
                        ? 'bg-rose-500'
                        : 'bg-slate-500'
                    }`}
                  />
                  {botStatus}
                </span>

                <span className="text-[10px] uppercase font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  {BROKER_CONFIGS[botConfig.brokerIntegration].name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated continuous scanning, high-conviction trigger matching, and bracket OCO order execution
              </p>
            </div>
          </div>

          {/* Action Triggers: Master Toggle & Panic Kill Switch */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSignalAlertSound();
                updateBotConfig({ soundAlerts: !botConfig.soundAlerts });
              }}
              className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                botConfig.soundAlerts
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={botConfig.soundAlerts ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
            >
              {botConfig.soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleBotMasterSwitch}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md ${
                isArmed
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isArmed ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isArmed ? 'Pause Autonomous Bot' : 'Arm & Start Bot'}</span>
            </button>

            <button
              onClick={triggerPanicKillSwitch}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
              title="Immediately disarms the bot"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Panic Kill Switch</span>
            </button>
          </div>
        </div>

        {/* Real-Time Telemetry KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="bg-[#131d31] p-3 rounded-xl border border-slate-800/90">
            <span className="text-[11px] text-slate-400 block mb-0.5">Bot Status</span>
            <span className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isArmed ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              {isArmed ? 'Active Scanning' : 'Standby'}
            </span>
          </div>

          <div className="bg-[#131d31] p-3 rounded-xl border border-slate-800/90">
            <span className="text-[11px] text-slate-400 block mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>Bot Uptime</span>
            </span>
            <span className="text-sm font-bold font-mono text-white">
              {formatUptime(botMetrics.uptimeSeconds)}
            </span>
          </div>

          <div className="bg-[#131d31] p-3 rounded-xl border border-slate-800/90">
            <span className="text-[11px] text-slate-400 block mb-0.5">Auto-Trades Executed</span>
            <span className="text-sm font-bold font-mono text-blue-400">
              {botMetrics.totalTrades}{' '}
              <span className="text-[10px] text-slate-400 font-normal">
                ({activePositionCount} open)
              </span>
            </span>
          </div>

          <div className="bg-[#131d31] p-3 rounded-xl border border-slate-800/90">
            <span className="text-[11px] text-slate-400 block mb-0.5">Win Rate (OCO Exits)</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {botMetrics.winRate}%{' '}
              <span className="text-[10px] text-slate-400 font-normal">
                ({botMetrics.winningTrades}W / {botMetrics.losingTrades}L)
              </span>
            </span>
          </div>

          <div className="bg-[#131d31] p-3 rounded-xl border border-slate-800/90">
            <span className="text-[11px] text-slate-400 block mb-0.5">Bot Realized P&L</span>
            <span
              className={`text-sm font-bold font-mono ${
                botMetrics.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {botMetrics.realizedPnl >= 0 ? '+' : ''}${botMetrics.realizedPnl.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#131d31] p-3 rounded-xl border border-slate-800/90">
            <span className="text-[11px] text-slate-400 block mb-0.5">Execution Router</span>
            <button
              onClick={() => setShowBrokerModal(true)}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer truncate block text-left"
            >
              {BROKER_CONFIGS[botConfig.brokerIntegration].name.slice(0, 16)}...
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout: Parameters & Live Terminal Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration, Strategy, and Asset Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Strategy Selection Card */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Assigned Agent Strategy</span>
              </div>
              <span className="text-[10px] text-slate-400">Deterministic Rule Engine</span>
            </div>

            <div className="space-y-1.5">
              {STRATEGY_OPTIONS.map((opt) => {
                const isSelected = botConfig.strategyId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateBotConfig({ strategyId: opt.id })}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 shadow-xs'
                        : 'bg-[#131d31]/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {opt.id === 'all_confluence'
                          ? 'Evaluates top conviction setup dynamically across all models'
                          : `Enforces strict ${opt.id} mathematical entry/exit rules`}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opt.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Instruments Watchlist Chips */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Active Target Watchlist ({botConfig.selectedSymbols.length} assets)</span>
              </div>
              <span className="text-[10px] text-slate-400">Click to include/exclude</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableSymbols.map((sym) => {
                const isSelected = botConfig.selectedSymbols.includes(sym);
                const isCrypto = sym.includes('-USD');
                return (
                  <button
                    key={sym}
                    onClick={() => toggleSymbolSelection(sym)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-[#131d31] text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{sym}</span>
                    {isCrypto && (
                      <span className="text-[8px] bg-slate-950/80 text-amber-400 px-1 rounded uppercase font-sans">
                        WS
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Risk Guardrails & Safety Parameters */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Institutional Risk Guardrails</span>
              </div>
              <span className="text-[10px] text-slate-400">Mandatory Hard Caps</span>
            </div>

            {/* Min Confidence Threshold */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Min Conviction Threshold:</span>
                <span className="text-emerald-400 font-bold">{botConfig.minConfidence}%</span>
              </div>
              <input
                type="range"
                min="75"
                max="95"
                step="1"
                value={botConfig.minConfidence}
                onChange={(e) => updateBotConfig({ minConfidence: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-[#131d31] rounded-lg"
              />
              <span className="text-[10px] text-slate-400 block">
                Trades are only triggered when the quantitative model conviction exceeds this score.
              </span>
            </div>

            {/* Max Capital Per Trade */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Max Allocation per Position:</span>
                <span className="text-blue-400 font-bold">${botConfig.maxAllocationPerTrade.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={botConfig.maxAllocationPerTrade}
                onChange={(e) => updateBotConfig({ maxAllocationPerTrade: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-[#131d31] rounded-lg"
              />
              <span className="text-[10px] text-slate-400 block">
                Hard dollar budget ceiling allocated per trade (Current cash: ${cashBalance.toLocaleString()}).
              </span>
            </div>

            {/* Take-Profit & Stop-Loss Bracket Offsets */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#131d31] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 block font-semibold">
                  Take-Profit Target: +{botConfig.takeProfitOffsetPct}%
                </span>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="0.5"
                  value={botConfig.takeProfitOffsetPct}
                  onChange={(e) => updateBotConfig({ takeProfitOffsetPct: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#0a0e17] rounded-lg"
                />
              </div>

              <div className="bg-[#131d31] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-rose-400 block font-semibold">
                  Stop-Loss Limit: -{botConfig.stopLossOffsetPct}%
                </span>
                <input
                  type="range"
                  min="1.5"
                  max="8"
                  step="0.5"
                  value={botConfig.stopLossOffsetPct}
                  onChange={(e) => updateBotConfig({ stopLossOffsetPct: Number(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-[#0a0e17] rounded-lg"
                />
              </div>
            </div>

            {/* Max Concurrent Positions & Cooldown */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#131d31] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-300 block font-semibold">
                  Max Open Positions: {botConfig.maxOpenBotPositions}
                </span>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={botConfig.maxOpenBotPositions}
                  onChange={(e) => updateBotConfig({ maxOpenBotPositions: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#0a0e17] rounded-lg"
                />
              </div>

              <div className="bg-[#131d31] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-300 block font-semibold">
                  Cooldown: {botConfig.cooldownSeconds}s
                </span>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="15"
                  value={botConfig.cooldownSeconds}
                  onChange={(e) => updateBotConfig({ cooldownSeconds: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#0a0e17] rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Telemetry Console (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 flex flex-col h-[760px] shadow-lg">
            {/* Console Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white font-mono">
                    AUTONOMOUS EXECUTION TELEMETRY FEED
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Real-time execution prints, heartbeat scanner & OCO liquidations
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => playTradeExecuteSound()}
                  className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 bg-slate-800/80 rounded border border-slate-700 cursor-pointer"
                  title="Test audio chime output"
                >
                  Test Chime
                </button>

                <button
                  onClick={clearBotLogs}
                  className="text-[11px] font-mono text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800/80 rounded cursor-pointer"
                  title="Clear telemetry logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 py-2.5 border-b border-slate-800/80 text-[11px] font-mono">
              {(['ALL', 'EXECUTE', 'SIGNAL', 'OCO_EXIT', 'SCAN'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    logFilter === filter
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-[#131d31] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
              <span className="ml-auto text-slate-400 text-[10px]">
                {filteredLogs.length} events logged
              </span>
            </div>

            {/* Log Scroll Container */}
            <div className="flex-1 overflow-y-auto pt-2 space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No telemetry entries matching filter.</p>
                  <p className="text-[11px] text-slate-400">
                    Arm the bot using the Master Switch to begin streaming live evaluation logs.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleTimeString();
                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (log.type === 'EXECUTE') badgeColor = 'bg-emerald-950/90 text-emerald-400 border-emerald-700';
                  if (log.type === 'SIGNAL') badgeColor = 'bg-blue-950/90 text-blue-400 border-blue-700';
                  if (log.type === 'OCO_EXIT') badgeColor = 'bg-purple-950/90 text-purple-400 border-purple-700';
                  if (log.type === 'KILL_SWITCH') badgeColor = 'bg-rose-950/90 text-rose-400 border-rose-700';
                  if (log.type === 'REJECT') badgeColor = 'bg-amber-950/90 text-amber-400 border-amber-700';

                  return (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-[#0a0e17] border border-slate-800/80 hover:border-slate-700/80 transition-colors flex items-start gap-2.5"
                    >
                      <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{dateStr}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}
                      >
                        {log.type}
                      </span>
                      <span className="text-[11px] font-bold text-white shrink-0 font-sans">
                        {log.symbol}
                      </span>
                      <p className="text-[11px] text-slate-300 flex-1 leading-relaxed break-words">
                        {log.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Console Footer */}
            <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Listening to tick updates from Coinbase WS & local market feeds
              </span>
              <button
                onClick={() => setActiveTab('terminal')}
                className="text-blue-400 hover:text-blue-300 underline font-sans cursor-pointer"
              >
                View Terminal Charts →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Broker Integration Modal / Drawer */}
      {showBrokerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Brokerage Execution Gateway</h3>
                  <p className="text-xs text-slate-400">
                    Switch between zero-risk simulation and external live-trading brokers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBrokerModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Broker Cards Grid */}
            <div className="space-y-3">
              {(Object.keys(BROKER_CONFIGS) as BrokerIntegrationType[]).map((key) => {
                const cfg = BROKER_CONFIGS[key];
                const isSelected = selectedBrokerPreview === key;
                const isCurrentActive = botConfig.brokerIntegration === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedBrokerPreview(key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 shadow-md'
                        : 'bg-[#131d31] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{cfg.name}</span>
                        {isCurrentActive && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold">
                            CURRENTLY ROUTING
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{cfg.apiUrl}</span>
                    </div>
                    <p className="text-xs text-slate-300">{cfg.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Real Broker Payload Inspector */}
            <div className="space-y-2 bg-[#0a0e17] p-3.5 rounded-xl border border-slate-800/80 font-mono">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-slate-400">Direct Broker REST Payload Format:</span>
                <span className="text-emerald-400 font-bold">Bracket Order Schema</span>
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto p-2 bg-[#050811] rounded border border-slate-800">
                {JSON.stringify(sampleBrokerPayload, null, 2)}
              </pre>
              <p className="text-[11px] text-slate-400 italic">
                {selectedBrokerPreview === 'paper_simulated'
                  ? 'Orders are instantly simulated in memory with live tick OCO liquidation.'
                  : `Connecting to ${BROKER_CONFIGS[selectedBrokerPreview].name} transmits this exact JSON payload directly to their endpoint over HTTPS.`}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBrokerModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateBotConfig({ brokerIntegration: selectedBrokerPreview });
                  setShowBrokerModal(false);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer shadow-md"
              >
                Set as Active Execution Router
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
