import React from 'react';
import { useTrading } from '../context/TradingContext';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  Lock,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const FundingView: React.FC = () => {
  const {
    cashBalance,
    paymentMethods,
    transactions,
    openPaymentModal,
  } = useTrading();

  const transferHistory = transactions.filter(
    (tx) => tx.type === 'deposit' || tx.type === 'withdrawal'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Liquidity & Actions */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>PRIMARY SETTLED CASH BALANCE</span>
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-white">
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Available immediately for market execution, limit orders, or disbursement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openPaymentModal('deposit')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Deposit Funds (ACH/Card)</span>
          </button>
          <button
            onClick={() => openPaymentModal('withdraw')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Withdraw Cash</span>
          </button>
        </div>
      </div>

      {/* Grid: Linked Accounts & Security Standards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Accounts */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Linked Financial Institutions & Cards
                </h3>
              </div>
              <button
                onClick={() => openPaymentModal('deposit')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                + Connect New Account
              </button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="p-3.5 bg-[#131d31] rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                      {pm.type === 'ach' ? (
                        <Building2 className="w-5 h-5 text-blue-400" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{pm.institutionOrBrand}</span>
                        {pm.isDefault && (
                          <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.2 rounded border border-blue-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Account {pm.accountNumberMasked} · {pm.nameOnAccount}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 block">
                      Connected & Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
            Payment instruments are stored via secure cryptographic tokens. Real banking routing numbers are never stored in plain text.
          </p>
        </div>

        {/* Security & Regulatory Compliance */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Institutional Security & Custody Architecture
              </h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-[#131d31] rounded-xl border border-slate-800">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">256-Bit Transport Layer Security (TLS 1.3)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    All communications between your terminal and trading gateways are encrypted end-to-end with forward secrecy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#131d31] rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">SIPC Paper Trading Protection Standard</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Virtual portfolios are modeled after US Securities Investor Protection Corporation (SIPC) coverage frameworks ($500,000 paper guarantee).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#131d31] rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">PCI-DSS Level 1 & Plaid Tokenization</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Zero raw payment account numbers are ingested. All financial transactions run via cryptographic token exchanges.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
            Sandbox Environment: This app simulates institutional deposit and clearing rails with zero real money liability.
          </div>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Funding & Disbursement Audit Trail ({transferHistory.length})</span>
        </h3>

        {transferHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No deposits or withdrawals recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] pb-2">
                  <th className="pb-2 font-semibold">DATE</th>
                  <th className="pb-2 font-semibold">TRANSACTION TYPE</th>
                  <th className="pb-2 font-semibold">SOURCE / DESTINATION</th>
                  <th className="pb-2 font-semibold">REFERENCE CODE</th>
                  <th className="pb-2 text-right font-semibold">AMOUNT</th>
                  <th className="pb-2 text-center font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transferHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#131d31]/60 transition-colors">
                    <td className="py-2.5 text-slate-400">
                      {new Date(tx.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                          tx.type === 'deposit'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-sans text-slate-200">
                      {tx.paymentMethod || 'Linked Account'}
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">{tx.referenceCode}</td>
                    <td
                      className={`py-2.5 text-right font-bold text-sm ${
                        tx.type === 'deposit' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'deposit' ? '+' : '-'}$
                      {tx.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                        {tx.status}
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
  );
};
