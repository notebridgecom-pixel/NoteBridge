import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { 
  sendVerificationEmail, 
  resendVerificationEmail, 
  verifyEmailTokenOrCode, 
  checkEmailVerificationStatus 
} from '../utils/verificationService';
import { 
  getCurrentUser, 
  setCurrentUser, 
  markUserEmailVerified, 
  updateUserEmail, 
  logoutUser 
} from '../utils/storage';
import { Logo } from '../components/Logo';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Edit3, 
  LogOut, 
  Sparkles, 
  ExternalLink,
  Inbox,
  HelpCircle
} from 'lucide-react';

interface VerifyEmailPageProps {
  currentUser: User | null;
  onVerificationSuccess: (user: User) => void;
  onNavigateHome: () => void;
  onLogout: () => void;
  initialToken?: string;
  initialEmail?: string;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  currentUser,
  onVerificationSuccess,
  onNavigateHome,
  onLogout,
  initialToken,
  initialEmail,
}) => {
  // Extract token & email from props or URL
  const [token, setToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('oobCode') || params.get('code') || '';
    }
    return '';
  });

  const [email, setEmail] = useState<string>(() => {
    if (currentUser?.email) return currentUser.email;
    if (initialEmail) return initialEmail;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    }
    return '';
  });

  // State Management
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<User | null>(currentUser);

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Change Email Modal / Inline Form
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Handle Resend Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Initial Auto-Verification if Token is provided in URL
  useEffect(() => {
    if (token && !isVerifiedSuccess) {
      handleAutoVerifyToken(token, email);
    } else if (email && !currentUser?.isEmailVerified && !token) {
      // Send initial verification email if not sent recently
      sendInitialVerificationEmail();
    }
  }, [token]);

  const sendInitialVerificationEmail = async () => {
    if (!email) return;
    const res = await sendVerificationEmail(email, currentUser?.name || 'Student');
    if (res.success) {
      setStatusMessage(`Verification link and 6-digit code sent to ${email}`);
      if (res.cooldownSeconds) setResendCooldown(res.cooldownSeconds);
    }
  };

  const handleAutoVerifyToken = async (tokenToVerify: string, emailToVerify: string) => {
    setIsVerifying(true);
    setErrorMessage('');
    setStatusMessage('Validating your secure verification link...');

    try {
      const res = await verifyEmailTokenOrCode({
        token: tokenToVerify,
        email: emailToVerify || email,
      });

      if (res.success) {
        const targetEmail = res.email || emailToVerify || email;
        const updated = markUserEmailVerified(targetEmail);
        setIsVerifiedSuccess(true);
        setStatusMessage(res.message || 'Email verified successfully! Welcome to NoteBridge.');
        if (updated) {
          setVerifiedUser(updated);
        }
      } else {
        setErrorMessage(res.message || 'The verification link is invalid or has expired. Please enter the 6-digit code from your email or request a new link.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to connect to verification service. Please try entering the 6-digit code.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle 6-Digit OTP inputs
  const handleDigitChange = (index: number, value: string) => {
    // If pasted whole code
    if (value.length > 1) {
      const clean = value.replace(/\D/g, '').slice(0, 6);
      if (clean.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = clean[i] || '';
        }
        setDigits(newDigits);
        const nextIdx = Math.min(clean.length, 5);
        digitRefs[nextIdx]?.current?.focus();
        if (clean.length === 6) {
          handleVerifyCodeSubmit(clean);
        }
        return;
      }
    }

    const singleDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 5) {
      digitRefs[index + 1]?.current?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      handleVerifyCodeSubmit(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs[index - 1]?.current?.focus();
    }
  };

  // Submit 6-Digit Code
  const handleVerifyCodeSubmit = async (codeToSubmit?: string) => {
    const code = codeToSubmit || digits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setErrorMessage('Email address is missing. Please enter your email address below.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setStatusMessage('Verifying your code...');

    try {
      const res = await verifyEmailTokenOrCode({
        code,
        email,
      });

      if (res.success) {
        const targetEmail = res.email || email;
        const updated = markUserEmailVerified(targetEmail);
        setIsVerifiedSuccess(true);
        setStatusMessage(res.message || 'Email verified successfully! Your account is now fully active.');
        if (updated) {
          setVerifiedUser(updated);
        }
      } else {
        setErrorMessage(res.message || 'Invalid or expired verification code. Please check your email or request a new code.');
      }
    } catch {
      setErrorMessage('Unable to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend Verification Email
  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    if (!email) {
      setErrorMessage('Please specify an email address.');
      return;
    }

    setIsResending(true);
    setErrorMessage('');
    setStatusMessage('Sending fresh verification email...');

    try {
      const res = await resendVerificationEmail(email, currentUser?.name || 'Student');
      if (res.success) {
        setStatusMessage(res.message || `New verification link sent to ${email}`);
        setResendCooldown(res.cooldownSeconds || 60);
      } else {
        setErrorMessage(res.message || 'Failed to resend. Please wait a moment.');
        if (res.cooldownSeconds) setResendCooldown(res.cooldownSeconds);
      }
    } catch {
      setErrorMessage('Failed to send verification email. Please check your network.');
    } finally {
      setIsResending(false);
    }
  };

  // Check Status button
  const handleCheckStatus = async () => {
    if (!email || isCheckingStatus) return;
    setIsCheckingStatus(true);
    setErrorMessage('');

    try {
      const isVerified = await checkEmailVerificationStatus(email);
      if (isVerified) {
        const updated = markUserEmailVerified(email);
        setIsVerifiedSuccess(true);
        setStatusMessage('Your email has been verified! Welcome to NoteBridge.');
        if (updated) setVerifiedUser(updated);
      } else {
        setStatusMessage('Email not yet verified. Please click the verification link in your email or enter the 6-digit code.');
      }
    } catch {
      setStatusMessage('Verification check completed. If you clicked the link, you may proceed.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Change Email Address
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsUpdatingEmail(true);
    setErrorMessage('');

    try {
      const targetIdOrEmail = currentUser?.id || email;
      const updated = updateUserEmail(targetIdOrEmail, cleanEmail);
      setEmail(cleanEmail);
      setIsEditingEmail(false);
      setNewEmailInput('');
      setDigits(['', '', '', '', '', '']);

      if (updated) {
        setVerifiedUser(updated);
      }

      // Automatically dispatch new email to updated address
      const res = await sendVerificationEmail(cleanEmail, currentUser?.name || 'Student');
      if (res.success) {
        setStatusMessage(`Email address updated! Verification code sent to ${cleanEmail}.`);
        setResendCooldown(res.cooldownSeconds || 60);
      }
    } catch (err: any) {
      setErrorMessage('Failed to update email address.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Continue to App
  const handleContinue = () => {
    const active = verifiedUser || getCurrentUser();
    if (active) {
      onVerificationSuccess(active);
    } else {
      onNavigateHome();
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 relative overflow-hidden">
          {/* Decorative Top Gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          {/* Success State View */}
          {isVerifiedSuccess ? (
            <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-300 dark:border-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Student Account
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                Email Verified Successfully!
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-md mx-auto">
                Your email <strong className="text-slate-900 dark:text-slate-100">{email}</strong> is now verified. Your NoteBridge account is fully activated with complete access to browse, purchase, and sell verified academic notes.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-8 text-left">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>All platform privileges &amp; seller hub tools are now unlocked.</span>
                </div>
              </div>

              <button
                id="verify-continue-btn"
                onClick={handleContinue}
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:gap-3 cursor-pointer"
              >
                <span>Continue to NoteBridge</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Active Verification View */
            <div>
              {/* Header Icon & Title */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="w-18 h-18 bg-blue-50 dark:bg-blue-950/70 border-2 border-blue-200 dark:border-blue-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Mail className="w-9 h-9 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Verify Your Email
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Please verify your student email to unlock your account and protected features.
                </p>
              </div>

              {/* Current Email Badge with Status */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sent verification to</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{email || 'your registered email'}</p>
                  </div>
                </div>

                <button
                  id="change-email-btn"
                  onClick={() => setIsEditingEmail(!isEditingEmail)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 flex items-center gap-1.5 transition flex-shrink-0"
                  title="Correct email address"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              </div>

              {/* Inline Change Email Form */}
              {isEditingEmail && (
                <form onSubmit={handleUpdateEmail} className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-150">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Update Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="new-email-input"
                      type="email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="name@college.edu"
                      required
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      id="save-new-email-btn"
                      type="submit"
                      disabled={isUpdatingEmail}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
                    >
                      {isUpdatingEmail ? 'Updating...' : 'Save & Send'}
                    </button>
                  </div>
                </form>
              )}

              {/* Notification Alerts */}
              {statusMessage && (
                <div className="mb-6 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300 animate-in fade-in duration-200">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              {/* 6-Digit Code Entry Section */}
              <div className="mb-8">
                <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Enter 6-Digit Code From Email
                </label>

                <div className="flex justify-center items-center gap-2 sm:gap-3 mb-4">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={digitRefs[idx]}
                      id={`verify-digit-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition shadow-inner font-mono"
                    />
                  ))}
                </div>

                <button
                  id="submit-verification-code-btn"
                  onClick={() => handleVerifyCodeSubmit()}
                  disabled={isVerifying || digits.join('').length < 6}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Code &amp; Unlock Account</span>
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Actions: Resend & Status Check */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Resend Email Button with Cooldown */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Didn't receive the email?</span>
                  <button
                    id="resend-verification-email-btn"
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0 || isResending}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-600 disabled:no-underline flex items-center gap-1.5"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Resend in {resendCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend verification email</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Check Link Verification Status */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Clicked link in email?</span>
                  <button
                    id="check-verification-status-btn"
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                  >
                    {isCheckingStatus ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>I've verified my email</span>
                  </button>
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className="mt-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>Tips for receiving verification email:</span>
                </div>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pl-6 list-disc">
                  <li>Check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder.</li>
                  <li>Ensure there are no typos in your email address above.</li>
                  <li>The email comes from <strong className="text-slate-700 dark:text-slate-300 font-mono">notebridge.com@gmail.com</strong>.</li>
                  <li>Verification links remain valid for <strong>24 hours</strong>.</li>
                </ul>
              </div>

              {/* Logout & Sign in Different Account */}
              <div className="mt-6 text-center">
                <button
                  id="verify-logout-btn"
                  onClick={() => {
                    logoutUser();
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out or sign in with another account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
