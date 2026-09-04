import React, { useState } from 'react';
import { User, WithdrawalRequest } from '../types';
import { requestSellerWithdrawal } from '../utils/storage';
import { 
  X, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Phone,
  Clock,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WithdrawModalProps {
  seller: User | null;
  onClose: () => void;
  onSuccess: (withdrawal: WithdrawalRequest) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  seller,
  onClose,
  onSuccess,
}) => {
  const availableBalance = seller?.walletBalance || 0;
  const [amount, setAmount] = useState<number>(availableBalance > 0 ? availableBalance : 0);
  const [payoutMethod, setPayoutMethod] = useState<'mobile' | 'upi'>('mobile');
  const [mobileNumber, setMobileNumber] = useState(
    seller?.phone ? seller.phone.replace(/[^0-9]/g, '').slice(-10) : ''
  );
  const [upiId, setUpiId] = useState(
    seller?.phone ? `${seller.phone.replace(/[^0-9]/g, '').slice(-10)}@upi` : ''
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdReq, setCreatedReq] = useState<WithdrawalRequest | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!seller) {
      setErrorMsg('Please sign in to a seller account first.');
      return;
    }

    if (availableBalance <= 0) {
      setErrorMsg('You have no available wallet balance to withdraw.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount (₹1 or more).');
      return;
    }
    if (amount > availableBalance) {
      setErrorMsg(`Withdrawal amount exceeds your available balance of ₹${availableBalance}.`);
      return;
    }

    let targetPayoutIdentifier = '';
    if (payoutMethod === 'mobile') {
      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
      if (cleanMobile.length < 10) {
        setErrorMsg('Please enter a valid 10-digit UPI-linked mobile number.');
        return;
      }
      targetPayoutIdentifier = `${cleanMobile} (Mobile UPI)`;
    } else {
      if (!upiId.includes('@') || upiId.trim().length < 4) {
        setErrorMsg('Please enter a valid UPI ID (e.g. username@okhdfcbank or 9876543210@paytm).');
        return;
      }
      targetPayoutIdentifier = upiId.trim();
    }

    setIsProcessing(true);

    setTimeout(() => {
      const withdrawal = requestSellerWithdrawal({
        seller,
        amount,
        upiId: targetPayoutIdentifier,
      });

      setCreatedReq(withdrawal);
      setIsProcessing(false);
      setIsSuccess(true);

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onSuccess(withdrawal);
    }, 1000);
  };

  return (
    <div 
      id="withdraw-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="withdraw-dialog"
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Withdraw Seller Earnings
              </h3>
              <p className="text-xs text-slate-500">Payout received within 3 hours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Wallet Balance Summary Card */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Available Wallet Balance
                </span>
                <div className="text-2xl font-black text-emerald-950 font-heading">
                  ₹{availableBalance}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAmount(availableBalance)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Withdraw All
              </button>
            </div>

            {/* Amount input: Any amount allowed */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Withdrawal Amount (₹) *
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Any amount (₹1+)
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min={1}
                  max={availableBalance}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                No minimum withdrawal threshold. You can withdraw any amount up to your full wallet balance.
              </span>
            </div>

            {/* Payout Destination Selector: Mobile Number vs UPI ID */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Receive Payment Via:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('mobile')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    payoutMethod === 'mobile'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mobile Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod('upi')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    payoutMethod === 'upi'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UPI ID / VPA</span>
                </button>
              </div>

              {payoutMethod === 'mobile' ? (
                <div>
                  <div className="relative mt-2">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="10-Digit Mobile Number (PhonePe/GPay/Paytm)"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      maxLength={10}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Direct transfer to your PhonePe, Google Pay, or Paytm linked mobile number.
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210@paytm or yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Enter your active UPI ID / VPA.
                  </span>
                </div>
              )}
            </div>

            {/* 3 Hours Delivery Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold block">Fast 3-Hour Payout Guarantee</span>
                <span className="text-[11px] text-emerald-800">
                  Payment will be received within 3 hours directly to your account.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing || availableBalance <= 0 || amount <= 0 || amount > availableBalance}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing Withdrawal Request...
                  </span>
                ) : (
                  <>
                    <span>Confirm Withdrawal of ₹{amount}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Withdrawal Success Screen */
          <div className="text-center py-3 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Withdrawal Request Submitted!
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                ₹{createdReq?.amount} transfer to <strong className="font-mono text-slate-800">{createdReq?.upiId}</strong>
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Transaction ID:</span>
                <span className="font-mono font-bold text-emerald-950">{createdReq?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Status:</span>
                <span className="text-emerald-800 font-bold uppercase text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full">
                  Processing (In Progress)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Estimated Arrival:</span>
                <span className="text-emerald-950 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-700" />
                  Payment will be received in 3 hours
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

