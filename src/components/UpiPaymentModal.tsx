import React, { useState, useEffect } from 'react';
import { NoteItem, User, PurchaseOrder } from '../types';
import { recordPendingPhonePePurchase, recordPurchase, BUSINESS_RULES } from '../utils/storage';
import { PhonePeQrCard } from './PhonePeQrCard';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  UploadCloud, 
  FileImage, 
  AlertCircle, 
  Check, 
  ArrowRight,
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UpiPaymentModalProps {
  note: NoteItem;
  buyer?: User;
  currentUser?: User;
  onClose: () => void;
  onSuccess: (order: PurchaseOrder) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  note,
  buyer,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const effectiveBuyer = buyer || currentUser;
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<PurchaseOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes session

  const receiverName = 'RAJ SAMBHAJI BHOSALE';

  // 10 minute countdown timer
  useEffect(() => {
    if (submittedOrder) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [submittedOrder]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!upiTransactionId.trim()) {
      setErrorMessage('Please enter the 12-digit UPI Transaction ID / UTR Number from your PhonePe app.');
      return;
    }

    if (upiTransactionId.trim().length < 8) {
      setErrorMessage('Please enter a valid UPI Transaction / Reference ID (at least 8-12 alphanumeric characters).');
      return;
    }

    if (!screenshotPreview && !screenshotFile) {
      setErrorMessage('Please upload the screenshot of your PhonePe payment confirmation.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const order = recordPendingPhonePePurchase({
        note,
        buyer: effectiveBuyer,
        currentUser: effectiveBuyer,
        upiTransactionId: upiTransactionId.trim(),
        paymentScreenshotUrl: screenshotPreview || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        receiverName,
      });

      setSubmittedOrder(order);
      setIsSubmitting(false);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#5f259f', '#3B82F6', '#10B981'],
        });
      } catch (e) {
        // Safe fallback
      }

      onSuccess(order);
    }, 1000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      id="upi-payment-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="upi-payment-dialog"
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5f259f] to-[#3a1366] text-white p-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                {submittedOrder ? 'Payment Submitted For Verification' : 'PhonePe QR Payment'}
              </h3>
              <p className="text-xs text-purple-200 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>Pay to Verified Receiver: <strong>{receiverName}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {!submittedOrder ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Note Mini Summary */}
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                  Purchasing Notes
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {note.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {note.subject} • {note.collegeName || note.university}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-slate-500 block">Total Due</span>
                <span className="text-lg font-black text-purple-900">₹{note.price}</span>
              </div>
            </div>

            {/* Step 1: Scan PhonePe QR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#5f259f] text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Scan & Pay ₹{note.price} using PhonePe or Any UPI App
                  </h4>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimer(timerSeconds)}</span>
                </div>
              </div>

              {/* High Fidelity PhonePe QR Card */}
              <PhonePeQrCard
                amount={note.price}
                receiverName={receiverName}
                noteTitle={note.title}
              />
            </div>

            {/* Step 2: Upload Proof & Submit Transaction ID */}
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5f259f] text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Upload Payment Screenshot & Enter UPI UTR
                </h4>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* UPI ID / UTR Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  12-Digit UPI Transaction ID / UTR Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423819283741 or T260822..."
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Find this in your PhonePe / GPay payment receipt under "UPI Transaction ID" or "UTR".
                </span>
              </div>

              {/* Screenshot Upload Drag & Drop */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Payment Confirmation Screenshot *
                </label>

                <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl p-4 bg-purple-50/40 text-center relative cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {screenshotPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot"
                        className="w-16 h-16 object-cover rounded-xl border border-purple-300 shadow-xs"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-purple-950 block">
                          ✓ Screenshot Attached
                        </span>
                        <span className="text-[11px] text-purple-700">
                          {screenshotFile ? screenshotFile.name : 'Sample PhonePe receipt'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Click or Drag & Drop your PhonePe screenshot
                      </span>
                      <span className="text-[10px] text-slate-500">
                        PNG, JPG, or JPEG up to 10MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-[#5f259f] to-[#451675] hover:from-[#521f8a] hover:to-[#381161] text-white font-bold rounded-2xl shadow-lg shadow-purple-900/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting for Verification...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Payment for Admin Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Verification Pending Confirmation Screen */
          <div className="p-6 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                Payment Verification Pending
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Payment Received & Under Admin Review
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your payment to <strong>{receiverName}</strong> has been logged with Transaction UTR <strong>{submittedOrder.upiTransactionId}</strong>.
              </p>
            </div>

            {/* Order Reference Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-slate-900">{submittedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Note:</span>
                <span className="font-bold text-slate-900 truncate max-w-[220px]">{submittedOrder.noteTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-purple-900">₹{submittedOrder.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receiver:</span>
                <span className="font-bold text-slate-900">{submittedOrder.receiverName}</span>
              </div>
            </div>

            {/* What happens next explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-left text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">What happens next?</span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  1. The Admin checks the PhonePe transaction reference with Raj Sambhaji Bhosale.<br />
                  2. Once approved, the clean PDF download (without any watermark) unlocks automatically in your <strong>Buyer Library</strong>.<br />
                  3. You'll receive a confirmation notification.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Go to My Library to Track Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
