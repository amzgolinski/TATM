import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { Clock, CheckCircle2, XCircle, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const OrdersAndLedgerView: React.FC = () => {
  const { orders, transactions, cancelOrder } = useTrading();
  const [subTab, setSubTab] = useState<'orders' | 'ledger'>('orders');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'trades' | 'transfers'>('all');

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const completedOrders = orders.filter((o) => o.status !== 'pending');

  const filteredTransactions = transactions.filter((tx) => {
    if (ledgerFilter === 'trades') return tx.type === 'buy' || tx.type === 'sell';
    if (ledgerFilter === 'transfers') return tx.type === 'deposit' || tx.type === 'withdrawal';
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Type', 'Symbol', 'Shares', 'Price', 'Amount', 'Status', 'Date', 'Reference'];
    const rows = transactions.map((t) => [
      t.id,
      t.type.toUpperCase(),
      t.symbol || 'N/A',
      t.shares ? t.shares.toString() : 'N/A',
      t.price ? t.price.toFixed(2) : 'N/A',
      t.amount.toFixed(2),
      t.status.toUpperCase(),
      new Date(t.timestamp).toISOString(),
      t.referenceCode,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auratrade_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sub Header Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              subTab === 'orders'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white bg-[#131d31]'
            }`}
          >
            Order Book & Working Orders ({pendingOrders.length})
          </button>
          <button
            onClick={() => setSubTab('ledger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              subTab === 'ledger'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white bg-[#131d31]'
            }`}
          >
            Audited Financial Ledger ({transactions.length})
          </button>
        </div>

        {subTab === 'ledger' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#131d31] p-0.5 rounded-lg border border-slate-800 text-xs">
              {(['all', 'trades', 'transfers'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLedgerFilter(f)}
                  className={`px-2.5 py-1 text-[11px] font-semibold capitalize rounded transition-colors cursor-pointer ${
                    ledgerFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {subTab === 'orders' ? (
        <div className="space-y-6">
          {/* 1. Working / Pending Limit & Stop Orders */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Pending Working Orders ({pendingOrders.length})</span>
            </h3>

            {pendingOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active limit orders currently pending fill.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] pb-2">
                      <th className="pb-2 font-semibold">DATE/TIME</th>
                      <th className="pb-2 font-semibold">SYMBOL</th>
                      <th className="pb-2 font-semibold">SIDE</th>
                      <th className="pb-2 font-semibold">TYPE</th>
                      <th className="pb-2 text-right font-semibold">SHARES</th>
                      <th className="pb-2 text-right font-semibold">LIMIT TRIGGER</th>
                      <th className="pb-2 text-right font-semibold">TOTAL</th>
                      <th className="pb-2 text-center font-semibold">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#131d31]/60 transition-colors">
                        <td className="py-2.5 text-slate-400">
                          {new Date(order.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 text-white font-bold">{order.symbol}</td>
                        <td className="py-2.5">
                          <span
                            className={`font-bold uppercase ${
                              order.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {order.side}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="flex flex-col items-start">
                            <span className="uppercase text-slate-300">
                              {order.type === 'stop_loss' ? 'Stop Loss' : order.type}
                            </span>
                            {order.bracketGroupId && (
                              <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800/60 mt-0.5">
                                OCO BRACKET
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-white">{order.shares}</td>
                        <td className="py-2.5 text-right font-bold">
                          {order.type === 'stop_loss' ? (
                            <span className="text-rose-400">SL: ${order.stopPrice?.toFixed(2)}</span>
                          ) : (
                            <span className={order.bracketGroupId ? 'text-emerald-400' : 'text-amber-400'}>
                              {order.bracketGroupId ? 'TP: ' : ''}${order.limitPrice ? order.limitPrice.toFixed(2) : 'MKT'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right text-white">
                          ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded border border-slate-700 transition-colors cursor-pointer text-[11px]"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Order History (Filled / Cancelled) */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Executed & Completed Orders ({completedOrders.length})</span>
            </h3>

            {completedOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No completed orders recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] pb-2">
                      <th className="pb-2 font-semibold">EXECUTION TIME</th>
                      <th className="pb-2 font-semibold">SYMBOL</th>
                      <th className="pb-2 font-semibold">SIDE</th>
                      <th className="pb-2 font-semibold">TYPE</th>
                      <th className="pb-2 text-right font-semibold">QUANTITY</th>
                      <th className="pb-2 text-right font-semibold">EXEC PRICE</th>
                      <th className="pb-2 text-right font-semibold">NET VALUE</th>
                      <th className="pb-2 text-center font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {completedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#131d31]/60 transition-colors">
                        <td className="py-2.5 text-slate-400">
                          {new Date(order.filledAt || order.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 text-white font-bold">{order.symbol}</td>
                        <td className="py-2.5">
                          <span
                            className={`font-bold uppercase ${
                              order.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {order.side}
                          </span>
                        </td>
                        <td className="py-2.5 uppercase text-slate-300">{order.type}</td>
                        <td className="py-2.5 text-right text-white">{order.shares}</td>
                        <td className="py-2.5 text-right text-white">
                          ${order.executionPrice ? order.executionPrice.toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 text-right text-white font-semibold">
                          ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.status === 'filled'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : order.ocoTriggeredReason
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {order.ocoTriggeredReason
                              ? `OCO CANCELLED (${order.ocoTriggeredReason === 'take_profit' ? 'TP HIT' : 'SL HIT'})`
                              : order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Financial Audit Ledger */
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] pb-2">
                  <th className="pb-2 font-semibold">TIMESTAMP</th>
                  <th className="pb-2 font-semibold">CATEGORY</th>
                  <th className="pb-2 font-semibold">DESCRIPTION</th>
                  <th className="pb-2 font-semibold">REFERENCE CODE</th>
                  <th className="pb-2 text-right font-semibold">AMOUNT</th>
                  <th className="pb-2 text-center font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'deposit' || tx.type === 'sell';
                  return (
                    <tr key={tx.id} className="hover:bg-[#131d31]/60 transition-colors">
                      <td className="py-3 text-slate-400">
                        {new Date(tx.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`font-bold uppercase text-[11px] px-1.5 py-0.5 rounded ${
                            tx.type === 'deposit'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : tx.type === 'withdrawal'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : tx.type === 'buy'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 font-sans text-slate-200">{tx.description}</td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {tx.referenceCode}
                      </td>
                      <td
                        className={`py-3 text-right font-bold text-sm ${
                          isCredit ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isCredit ? '+' : '-'}$
                        {tx.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
