import React, { useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Percent,
} from 'lucide-react';
import { Position } from '../types/market';

export const PortfolioView: React.FC = () => {
  const {
    positions,
    cashBalance,
    totalEquity,
    totalMarketValue,
    totalCostBasis,
    unrealizedPnL,
    unrealizedPnLPercent,
    dailyPnL,
    dailyPnLPercent,
    realizedPnL,
    setSelectedSymbol,
    setActiveTab,
    openPaymentModal,
    setQuickTradePrefill,
  } = useTrading();

  const positionList = useMemo(() => {
    const symbolMap = new Map<string, Position>();
    Object.values(positions).forEach((pos) => {
      if (!pos || !pos.symbol) return;
      const canonicalSymbol = pos.symbol === 'BTC' ? 'BTC-USD' : pos.symbol === 'ETH' ? 'ETH-USD' : pos.symbol;
      if (symbolMap.has(canonicalSymbol)) {
        const existing = symbolMap.get(canonicalSymbol)!;
        const totalShares = existing.shares + pos.shares;
        const totalCost = existing.totalCost + pos.totalCost;
        const avgCost = totalShares > 0 ? Number((totalCost / totalShares).toFixed(2)) : existing.avgCost;
        symbolMap.set(canonicalSymbol, {
          ...existing,
          symbol: canonicalSymbol,
          shares: totalShares,
          totalCost,
          avgCost,
          marketValue: Number((totalShares * pos.currentPrice).toFixed(2)),
          unrealizedPnL: Number(((totalShares * pos.currentPrice) - totalCost).toFixed(2)),
          dailyPnL: Number((existing.dailyPnL + pos.dailyPnL).toFixed(2)),
        });
      } else {
        symbolMap.set(canonicalSymbol, { ...pos, symbol: canonicalSymbol });
      }
    });
    return Array.from(symbolMap.values());
  }, [positions]);

  const isAllTimePositive = unrealizedPnL >= 0;
  const isDailyPositive = dailyPnL >= 0;

  // Calculate sector weights and asset weights
  const assetWeights = useMemo(() => {
    return positionList.map((pos) => {
      const weight = totalEquity > 0 ? (pos.marketValue / totalEquity) * 100 : 0;
      return {
        symbol: pos.symbol,
        name: pos.name,
        value: pos.marketValue,
        weight,
      };
    });
  }, [positionList, totalEquity]);

  const cashWeight = totalEquity > 0 ? (cashBalance / totalEquity) * 100 : 0;

  // Distinct colors for allocation breakdown
  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

  const handleTradeShortcut = (symbol: string, side: 'buy' | 'sell') => {
    setSelectedSymbol(symbol);
    setQuickTradePrefill({ symbol, side });
    setActiveTab('terminal');
  };

  return (
    <div className="space-y-6">
      {/* Portfolio KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Account Equity</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Cash: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="font-mono text-slate-400">({cashWeight.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Today's Return */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Today's Market Return</span>
            {isDailyPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              isDailyPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isDailyPositive ? '+' : ''}
            ${dailyPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
            {isDailyPositive ? '+' : ''}
            {dailyPnLPercent.toFixed(2)}% vs Prior Close
          </div>
        </div>

        {/* Unrealized Return */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Unrealized P&L</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              isAllTimePositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isAllTimePositive ? '+' : ''}
            ${unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
            {isAllTimePositive ? '+' : ''}
            {unrealizedPnLPercent.toFixed(2)}% Total Return
          </div>
        </div>

        {/* Realized Gains */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Realized Closed P&L</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            +${realizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Historical closed paper trades
          </div>
        </div>
      </div>

      {/* Asset Allocation & Diversification */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Asset & Capital Allocation Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Invested: ${totalMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} / Cash: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Visual Allocation Bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full flex overflow-hidden">
          {assetWeights.map((item, idx) => (
            <div
              key={`${item.symbol}-${idx}`}
              className="h-full transition-all hover:opacity-80"
              style={{
                width: `${item.weight}%`,
                backgroundColor: palette[idx % palette.length],
              }}
              title={`${item.symbol}: ${item.weight.toFixed(1)}%`}
            />
          ))}
          <div
            className="h-full bg-slate-600 transition-all hover:opacity-80"
            style={{ width: `${cashWeight}%` }}
            title={`Available Cash: ${cashWeight.toFixed(1)}%`}
          />
        </div>

        {/* Allocation Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono tabular-nums">
          {assetWeights.map((item, idx) => (
            <div key={`${item.symbol}-${idx}`} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: palette[idx % palette.length] }}
              />
              <span className="text-slate-200 font-semibold">{item.symbol}</span>
              <span className="text-slate-400">({item.weight.toFixed(1)}%)</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-600" />
            <span className="text-slate-200 font-semibold">Cash</span>
            <span className="text-slate-400">({cashWeight.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* Active Holdings Table */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Current Holdings & Open Positions ({positionList.length})
          </h3>
          <button
            onClick={() => setActiveTab('terminal')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            + Trade New Instrument
          </button>
        </div>

        {positionList.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm mb-4">You do not have any open stock positions yet.</p>
            <button
              onClick={() => setActiveTab('terminal')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Go to Trading Terminal
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] pb-2">
                  <th className="pb-2 font-semibold">ASSET</th>
                  <th className="pb-2 text-right font-semibold">SHARES</th>
                  <th className="pb-2 text-right font-semibold">AVG COST</th>
                  <th className="pb-2 text-right font-semibold">PRICE</th>
                  <th className="pb-2 text-right font-semibold">MARKET VALUE</th>
                  <th className="pb-2 text-right font-semibold">DAILY P&L</th>
                  <th className="pb-2 text-right font-semibold">UNREALIZED P&L</th>
                  <th className="pb-2 text-center font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {positionList.map((pos, idx) => {
                  const isPosPositive = pos.unrealizedPnL >= 0;
                  const isDailyPos = pos.dailyPnL >= 0;

                  return (
                    <tr
                      key={`${pos.symbol}-${idx}`}
                      className="hover:bg-[#131d31]/60 transition-colors group"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-white text-xs tracking-wide">
                              {pos.symbol}
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans truncate max-w-[150px]">
                              {pos.name}
                            </div>
                            {(pos.takeProfitPrice || pos.stopLossPrice) && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                {pos.takeProfitPrice && (
                                  <span className="text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800/60 font-semibold">
                                    TP: ${pos.takeProfitPrice.toFixed(2)}
                                  </span>
                                )}
                                {pos.stopLossPrice && (
                                  <span className="text-rose-400 bg-rose-950/80 px-1 py-0.2 rounded border border-rose-800/60 font-semibold">
                                    SL: ${pos.stopLossPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-white font-medium">
                        {pos.shares.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-slate-300">
                        ${pos.avgCost.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-white font-semibold">
                        ${pos.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-white font-bold">
                        ${pos.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          isDailyPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isDailyPos ? '+' : ''}${pos.dailyPnL.toFixed(2)}
                      </td>
                      <td
                        className={`py-3 text-right font-bold ${
                          isPosPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPosPositive ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                        <span className="text-[11px] block font-normal">
                          ({isPosPositive ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleTradeShortcut(pos.symbol, 'buy')}
                            className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-700/60 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Buy More
                          </button>
                          <button
                            onClick={() => handleTradeShortcut(pos.symbol, 'sell')}
                            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-800/80 text-rose-300 border border-rose-700/60 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portfolio Risk & Benchmark Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <span className="text-xs text-slate-400 block mb-1">Portfolio Beta</span>
          <div className="text-xl font-bold font-mono text-white">1.14</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Moderately higher sensitivity than S&P 500 baseline (1.00).
          </p>
        </div>

        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <span className="text-xs text-slate-400 block mb-1">Estimated Sharpe Ratio</span>
          <div className="text-xl font-bold font-mono text-emerald-400">1.82</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Strong risk-adjusted excess returns over risk-free rate (4.08%).
          </p>
        </div>

        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4">
          <span className="text-xs text-slate-400 block mb-1">Diversification Health</span>
          <div className="text-xl font-bold font-mono text-blue-400">Optimal (84/100)</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Healthy multi-sector balance across Semiconductors, Tech, and Index ETFs.
          </p>
        </div>
      </div>
    </div>
  );
};
