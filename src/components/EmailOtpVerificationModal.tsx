import React, { useState, useEffect } from 'react';
import { OtpPurpose } from '../types';
import { OtpInput } from './OtpInput';
import { 
  sendEmailOtp, 
  verifyEmailOtp, 
  getOtpCooldownRemaining, 
  getActiveOtpRecord
} from '../utils/otpService';
import { 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Loader2, 
  Clock,
  Info
} from 'lucide-react';

interface EmailOtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  purpose: OtpPurpose;
  userName?: string;
  title?: string;
  subtitle?: string;
  onVerified: () => void;
  onClose: () => void;
  onChangeEmail?: () => void;
}

export const EmailOtpVerificationModal: React.FC<EmailOtpVerificationModalProps> = ({
  isOpen,
  email,
  purpose,
  userName,
  title,
  subtitle,
  onVerified,
  onClose,
  onChangeEmail,
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes default

  // Sync cooldown and timer on open
  useEffect(() => {
    if (!isOpen || !email) return;

    setOtpCode('');
    setErrorMessage('');
    setSuccessNotice('');

    const initialCooldown = getOtpCooldownRemaining(email, purpose);
    setCooldown(initialCooldown);

    const record = getActiveOtpRecord(email, purpose);
    if (record) {
      const remaining = Math.max(0, Math.floor((record.expiresAt - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);
    } else {
      // Send initial OTP automatically if none active
      const res = sendEmailOtp({ email, purpose, userName });
      if (res.success) {
        setSuccessNotice(`Verification code sent to ${email}`);
        setCooldown(res.cooldownSeconds);
        setTimeLeftSeconds(600);
      }
    }
  }, [isOpen, email, purpose, userName]);

  // Handle live countdown intervals
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const codeToVerify = otpCode.trim();
    if (codeToVerify.length !== 6) {
      setErrorMessage('Please enter the full 6-digit numeric verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = verifyEmailOtp({
        email,
        code: codeToVerify,
        purpose,
        userName,
      });

      setIsVerifying(false);

      if (result.success) {
        setSuccessNotice('Email successfully verified!');
        setTimeout(() => {
          onVerified();
        }, 400);
      } else {
        setErrorMessage(result.message);
      }
    }, 350);
  };

  const handleResend = () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessNotice('');

    setTimeout(() => {
      const res = sendEmailOtp({ email, purpose, userName });
      setIsResending(false);

      if (res.success) {
        setCooldown(res.cooldownSeconds);
        setTimeLeftSeconds(600);
        setOtpCode('');
        setSuccessNotice(`New 6-digit verification code sent to ${email}`);
      } else {
        setErrorMessage(res.message);
      }
    }, 300);
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-100 dark:border-blue-800/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition"
            title="Cancel Verification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
            {title || 'Verify Your Student Email'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {subtitle || 'A 6-digit confirmation code was sent to your student email. Enter it below to activate your account.'}
          </p>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              {onChangeEmail && (
                <button
                  type="button"
                  onClick={onChangeEmail}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex-shrink-0"
                >
                  Change
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successNotice && !errorMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="leading-snug">{successNotice}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-3">
            <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              Enter 6-Digit Verification Code
            </label>

            <OtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val);
                setErrorMessage('');
              }}
              isError={Boolean(errorMessage)}
              disabled={isVerifying}
              autoFocus={true}
              idPrefix="modal-otp"
            />

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 px-1">
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Expires in <strong className="font-mono text-slate-700 dark:text-slate-200">{formattedTimer}</strong></span>
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className={`text-[11px] font-bold flex items-center gap-1 transition ${
                  cooldown > 0 || isResending
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline'
                }`}
              >
                {isResending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className={`w-3 h-3 ${cooldown > 0 ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'}`} />
                )}
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </div>

          {/* Help tip */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>Didn't receive the email? Check your spam or junk folder, or wait for the cooldown to request a new code.</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={otpCode.length !== 6 || isVerifying}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email & Continue</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </>
              )}
            </button>

            {onChangeEmail && (
              <button
                type="button"
                onClick={onChangeEmail}
                className="w-full py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
              >
                ← Back to Edit Email
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
