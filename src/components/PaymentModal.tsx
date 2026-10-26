import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  X,
  ShieldCheck,
  Building2,
  CreditCard,
  Zap,
  ArrowDownLeft,
  CheckCircle2,
  Lock,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentModalInitialTab,
    cashBalance,
    paymentMethods,
    depositFunds,
    withdrawFunds,
    addPaymentMethod,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'card' | 'quick'>('deposit');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [amount, setAmount] = useState<string>('5000');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'form' | 'challenge' | 'success'>('form');
  const [otpCode, setOtpCode] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<{ amount: number; ref: string; method: string } | null>(null);

  // New Card Form state
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('842');
  const [cardName, setCardName] = useState<string>('Alex Miller');

  // New Bank Form state
  const [showAddBank, setShowAddBank] = useState<boolean>(false);
  const [newBankName, setNewBankName] = useState<string>('Wells Fargo');
  const [newRouting, setNewRouting] = useState<string>('12100024');
  const [newAccount, setNewAccount] = useState<string>('992817293');

  useEffect(() => {
    if (paymentModalInitialTab) {
      setActiveTab(paymentModalInitialTab);
    }
    setStep('form');
  }, [paymentModalInitialTab, isPaymentModalOpen]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethodId) {
      setSelectedMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedMethodId]);

  if (!isPaymentModalOpen) return null;

  const currentMethod = paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0];

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    setIsProcessing(true);

    // Simulate bank security check
    setTimeout(() => {
      setIsProcessing(false);
      const res = depositFunds(val, currentMethod.id, `${currentMethod.institutionOrBrand} (${currentMethod.accountNumberMasked})`);
      if (res.success) {
        setSuccessInfo({ amount: val, ref: res.ref, method: `${currentMethod.institutionOrBrand}` });
        setStep('success');
      }
    }, 700);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0 || val > cashBalance) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const res = withdrawFunds(val, currentMethod.id, `${currentMethod.institutionOrBrand} (${currentMethod.accountNumberMasked})`);
      if (res.success) {
        setSuccessInfo({ amount: val, ref: res.ref, method: `${currentMethod.institutionOrBrand}` });
        setStep('success');
      }
    }, 700);
  };

  const handleCardDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    // Trigger 3D Secure SMS OTP challenge step
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('challenge');
    }, 600);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const val = parseFloat(amount);
      const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
      const brand = cardNumber.startsWith('4') ? 'Visa' : 'Mastercard';

      // Save card if not existing
      addPaymentMethod({
        type: 'card',
        institutionOrBrand: `${brand} Secure Debit`,
        accountNumberMasked: `•••• ${last4}`,
        nameOnAccount: cardName,
        isDefault: false,
      });

      const res = depositFunds(val, 'card-new', `${brand} •••• ${last4}`);
      setSuccessInfo({ amount: val, ref: res.ref, method: `${brand} (3D-Secure 2.0)` });
      setStep('success');
    }, 800);
  };

  const handleQuickGrant = (grantAmount: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const res = depositFunds(grantAmount, 'sandbox-grant', 'Simulated Wall Street Capital Grant');
      setSuccessInfo({ amount: grantAmount, ref: res.ref, method: 'Sandbox Paper Capital Grant' });
      setStep('success');
    }, 400);
  };

  const handleAddNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    const last4 = newAccount.slice(-4) || '9928';
    addPaymentMethod({
      type: 'ach',
      institutionOrBrand: newBankName,
      accountNumberMasked: `•••• ${last4}`,
      routingNumberMasked: `•••• ${newRouting.slice(-4)}`,
      nameOnAccount: 'Alex Miller (Simulated)',
      isDefault: false,
    });
    setShowAddBank(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0e1422]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Secure Capital Funding Gateway
              </h3>
              <p className="text-[11px] text-slate-400">
                256-Bit SSL Encrypted · Paper Sandbox Mode (No Real Money Debited)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {step === 'form' && (
          <div className="flex items-center border-b border-slate-800 bg-[#0a0e17] px-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'deposit'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Instant ACH Transfer</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'card'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Debit / Card</span>
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'quick'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Grant</span>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'withdraw'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Disburse</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Main Form */}
          {step === 'form' && (
            <>
              {/* TAB 1: Instant ACH Bank Transfer */}
              {activeTab === 'deposit' && (
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  {/* Select Bank */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>Source Bank Account (Simulated Plaid Token)</span>
                      <button
                        type="button"
                        onClick={() => setShowAddBank(!showAddBank)}
                        className="text-blue-400 hover:underline cursor-pointer text-[11px]"
                      >
                        {showAddBank ? 'Cancel' : '+ Link Another Bank'}
                      </button>
                    </div>

                    {showAddBank ? (
                      <div className="p-3 bg-[#131d31] rounded-lg border border-slate-700 space-y-2 mb-3">
                        <span className="text-xs font-bold text-white block">Link Bank via Instant Token</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Institution</label>
                            <select
                              value={newBankName}
                              onChange={(e) => setNewBankName(e.target.value)}
                              className="w-full bg-[#0a0e17] border border-slate-700 rounded px-2 py-1 text-white text-xs"
                            >
                              <option value="Wells Fargo">Wells Fargo</option>
                              <option value="Citibank N.A.">Citibank N.A.</option>
                              <option value="Fidelity Cash Mgmt">Fidelity Cash Mgmt</option>
                              <option value="Charles Schwab">Charles Schwab</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Account Number</label>
                            <input
                              type="text"
                              value={newAccount}
                              onChange={(e) => setNewAccount(e.target.value)}
                              placeholder="Account #"
                              className="w-full bg-[#0a0e17] border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddNewBank}
                          className="w-full py-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer"
                        >
                          Verify & Link Account
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods
                          .filter((m) => m.type === 'ach')
                          .map((method) => (
                            <label
                              key={method.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedMethodId === method.id
                                  ? 'bg-[#131d31] border-blue-500'
                                  : 'bg-[#0a0e17] border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="bankMethod"
                                  checked={selectedMethodId === method.id}
                                  onChange={() => setSelectedMethodId(method.id)}
                                  className="text-blue-600 focus:ring-0"
                                />
                                <div>
                                  <div className="text-xs font-bold text-white">
                                    {method.institutionOrBrand}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    Account {method.accountNumberMasked} · Verified
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                                Instant ACH
                              </span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">
                      Deposit Amount (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
                      <input
                        type="number"
                        min="10"
                        step="100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg pl-7 pr-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Quick amount chips */}
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {['1000', '5000', '10000', '25000'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className={`py-1 text-xs font-mono font-semibold rounded border cursor-pointer transition-colors ${
                            amount === preset
                              ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                              : 'bg-[#131d31] text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          +${parseInt(preset).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security Guarantee Notice */}
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Electronic ACH transfers are tokenized using bank-level 256-bit encryption. Funds become available immediately for paper trading. No actual banking credentials or real money will be charged.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? 'Authorizing ACH Token...' : `Authorize Instant Deposit ($${parseFloat(amount || '0').toLocaleString('en-US')})`}
                  </button>
                </form>
              )}

              {/* TAB 2: Card Funding (Stripe 3D-Secure 2.0 Simulation) */}
              {activeTab === 'card' && (
                <form onSubmit={handleCardDepositSubmit} className="space-y-4">
                  {/* Card Visual / Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-[#131d31] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Card Number (Sandbox Test Card)</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-[#131d31] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full bg-[#131d31] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">CVC / CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="842"
                          className="w-full bg-[#131d31] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
                      <input
                        type="number"
                        min="10"
                        step="50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg pl-7 pr-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>3D Secure 2.0 Strong Customer Authentication</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">PCI DSS Level 1</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    {isProcessing ? 'Initiating 3D Secure Verification...' : `Proceed to 3D Secure Verification ($${parseFloat(amount || '0').toLocaleString('en-US')})`}
                  </button>
                </form>
              )}

              {/* TAB 3: Quick Grants */}
              {activeTab === 'quick' && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <Zap className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white">Instant Sandbox Capital Grants</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Instantly grant simulated liquidity to your paper trading account with 1-click. Ideal for stress-testing large position orders.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { amt: 5000, label: 'Retail Grant' },
                      { amt: 25000, label: 'Pattern Day Trader (PDT)' },
                      { amt: 100000, label: 'Proprietary Desk' },
                      { amt: 500000, label: 'Institutional Vault' },
                    ].map((grant) => (
                      <button
                        key={grant.amt}
                        onClick={() => handleQuickGrant(grant.amt)}
                        disabled={isProcessing}
                        className="p-3.5 bg-[#131d31] hover:bg-[#1a2640] border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition-all cursor-pointer group"
                      >
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {grant.label}
                        </span>
                        <span className="text-lg font-bold font-mono text-emerald-400 block mt-0.5 group-hover:text-emerald-300">
                          +${grant.amt.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Instant Credit to Buying Power
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Withdrawal (Disbursement) */}
              {activeTab === 'withdraw' && (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div className="bg-[#0a0e17] p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Available to Withdraw</span>
                    <span className="font-mono tabular-nums font-bold text-white text-sm">
                      ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">
                      Destination Bank Account
                    </label>
                    <select
                      value={selectedMethodId}
                      onChange={(e) => setSelectedMethodId(e.target.value)}
                      className="w-full bg-[#131d31] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {paymentMethods
                        .filter((m) => m.type === 'ach')
                        .map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.institutionOrBrand} ({method.accountNumberMasked})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">
                      Withdrawal Amount (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
                      <input
                        type="number"
                        min="1"
                        max={cashBalance}
                        step="100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-[#131d31] border border-slate-700/80 rounded-lg pl-7 pr-3 py-2 text-white font-mono tabular-nums text-sm focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-slate-800 text-[11px] text-slate-400">
                    ACH disbursements are typically processed within 1–2 business days. The funds will immediately be deducted from your trading terminal buying power.
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || parseFloat(amount || '0') > cashBalance || parseFloat(amount || '0') <= 0}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing Disbursement...' : `Confirm Withdrawal ($${parseFloat(amount || '0').toLocaleString('en-US')})`}
                  </button>
                </form>
              )}
            </>
          )}

          {/* STEP 2: 3D Secure SMS OTP Challenge */}
          {step === 'challenge' && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">3D Secure 2.0 Challenge</h4>
                <p className="text-xs text-slate-400 mt-1">
                  A 6-digit one-time passcode was generated for verification of{' '}
                  <span className="font-bold text-white">${parseFloat(amount).toLocaleString('en-US')}</span>.
                </p>
                <div className="bg-[#131d31] inline-block px-3 py-1 rounded border border-slate-800 text-xs font-mono text-blue-400 font-bold mt-2">
                  Sandbox Code: 892-104
                </div>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-3 mt-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 text-center">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="892104"
                    className="w-48 mx-auto block bg-[#131d31] border border-slate-700 rounded-lg px-3 py-2 text-center text-white font-mono tracking-widest text-lg font-bold focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  {isProcessing ? 'Authenticating Token...' : 'Confirm & Authorize Payment'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Back to Payment Form
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && successInfo && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">Payment Transaction Approved</h4>
                <p className="text-xs text-slate-400 mt-1">
                  ${successInfo.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been updated in your buying power.
                </p>
              </div>

              <div className="bg-[#0a0e17] rounded-xl p-3.5 border border-slate-800 text-xs font-mono text-left space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Reference ID:</span>
                  <span className="text-white font-bold">{successInfo.ref}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Gateway:</span>
                  <span className="text-slate-200">{successInfo.method}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Settlement Status:</span>
                  <span className="text-emerald-400 font-semibold">Immediate Credit (Paper)</span>
                </div>
              </div>

              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Return to Trading Terminal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
