import React, { useState } from 'react';
import { User, UserRole, OtpPurpose } from '../types';
import { setCurrentUser, saveUsers, getStoredUsers } from '../utils/storage';
import { UNIVERSITIES, BRANCHES, DEGREES } from '../data/mockData';
import { 
  googleSignIn, 
  firebaseRegisterUser, 
  firebaseSignInUser, 
  sendFirebaseEmailVerification, 
  formatFirebaseAuthError 
} from '../utils/firebase';
import { sendEmailOtp } from '../utils/otpService';
import { sendVerificationEmail } from '../utils/verificationService';
import { EmailOtpVerificationModal } from '../components/EmailOtpVerificationModal';
import { 
  ShieldCheck, 
  BookOpen, 
  UploadCloud, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Lock, 
  User as UserIcon,
  Phone,
  Mail,
  Building,
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  Camera,
  KeyRound,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Logo } from '../components/Logo';

interface AuthPageProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onNavigateHome: () => void;
  onNavigateToVerifyEmail?: (email: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  currentUser,
  onLoginSuccess,
  onNavigateHome,
  onNavigateToVerifyEmail,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form Fields
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [university, setUniversity] = useState(UNIVERSITIES[1]);
  const [degree, setDegree] = useState('B.Tech / B.E.');
  const [branch, setBranch] = useState(BRANCHES[1]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [avatarPhotoUrl, setAvatarPhotoUrl] = useState<string>('');

  // Notifications & Loaders
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // OTP Verification Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>('signup');
  const [pendingSignupUser, setPendingSignupUser] = useState<User | null>(null);
  const [pendingLoginUser, setPendingLoginUser] = useState<User | null>(null);
  const [isPasswordResetStage, setIsPasswordResetStage] = useState(false);

  // Password validation helpers
  const targetPassword = isForgotPassword ? newPassword : password;
  const hasMinLength = targetPassword.length >= 8;
  const hasNumber = /\d/.test(targetPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(targetPassword);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorNotice('Please select an image file (PNG, JPG, WebP) for profile photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleAuth = async () => {
    setErrorNotice('');
    setSuccessNotice('');
    setIsGoogleSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res?.appUser) {
        // Mark email as verified if signed in via Google
        const updatedAppUser: User = {
          ...res.appUser,
          isVerified: true,
          isEmailVerified: true,
        };
        setCurrentUser(updatedAppUser);
        setSuccessNotice(`Google Sign-In Verified! Logged in as ${updatedAppUser.name}`);
        setTimeout(() => onLoginSuccess(updatedAppUser), 400);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Google Sign-In was cancelled or failed. Please use email & password.');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  /** Initiates OTP flow for passwordless login */
  const handleRequestLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorNotice('Please enter your registered email address.');
      return;
    }

    const users = getStoredUsers();
    const matchedUser = users.find((u) => (u?.email || '').toLowerCase() === normalizedEmail);

    if (!matchedUser) {
      setErrorNotice(`No account found for "${email}". Please check the email or sign up below.`);
      return;
    }

    if (matchedUser.isBlocked) {
      setErrorNotice(`This account has been suspended by NoteBridge moderators. Reason: ${matchedUser.blockedReason || 'Security policy violation'}.`);
      return;
    }

    setPendingLoginUser(matchedUser);
    setOtpPurpose('login');

    setIsSendingOtp(true);
    const res = sendEmailOtp({
      email: normalizedEmail,
      purpose: 'login',
      userName: matchedUser.name,
    });
    setIsSendingOtp(false);

    if (res.success) {
      setIsOtpModalOpen(true);
      setSuccessNotice(`6-digit login OTP sent to ${normalizedEmail}`);
    } else {
      setErrorNotice(res.message);
    }
  };

  /** Initiates OTP flow for Forgot Password */
  const handleRequestForgotPasswordOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorNotice('Please enter your registered email address to receive reset instructions.');
      return;
    }

    const users = getStoredUsers();
    const matchedUser = users.find((u) => (u?.email || '').toLowerCase() === normalizedEmail);

    if (!matchedUser) {
      setErrorNotice(`No account found for "${email}". Please verify your email.`);
      return;
    }

    setPendingLoginUser(matchedUser);
    setOtpPurpose('reset_password');

    setIsSendingOtp(true);
    const res = sendEmailOtp({
      email: normalizedEmail,
      purpose: 'reset_password',
      userName: matchedUser.name,
    });
    setIsSendingOtp(false);

    if (res.success) {
      setIsOtpModalOpen(true);
      setSuccessNotice(`Password recovery code sent to ${normalizedEmail}`);
    } else {
      setErrorNotice(res.message);
    }
  };

  /** Save new password after OTP verification */
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!pendingLoginUser) {
      setErrorNotice('Session expired. Please restart the password reset process.');
      return;
    }

    if (!isPasswordValid) {
      setErrorNotice('New password must have at least 8 characters, 1 number, and 1 special symbol.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorNotice('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    const users = getStoredUsers();
    const updatedUsers = users.map((u) => {
      if (u.id === pendingLoginUser.id || u.email.toLowerCase() === pendingLoginUser.email.toLowerCase()) {
        return {
          ...u,
          password: newPassword.trim(),
          isVerified: true,
          isEmailVerified: true,
        };
      }
      return u;
    });

    saveUsers(updatedUsers);
    const updatedUser = updatedUsers.find((u) => u.id === pendingLoginUser.id) || pendingLoginUser;
    setCurrentUser(updatedUser);

    setSuccessNotice('Password successfully reset! Logging you in...');
    setTimeout(() => {
      onLoginSuccess(updatedUser);
    }, 600);
  };

  /** Handles standard form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!normalizedEmail) {
      setErrorNotice('Please enter a valid email address.');
      return;
    }

    const users = getStoredUsers();

    if (isSignUp) {
      // 1. Validate fields
      if (!name.trim()) {
        setErrorNotice('Please provide your full name.');
        return;
      }
      if (!college.trim()) {
        setErrorNotice('Please provide your college name.');
        return;
      }

      // Password Complexity Validation (min 8 chars, >=1 number, >=1 special char)
      const hasMinLength = trimmedPassword.length >= 8;
      const hasNumber = /\d/.test(trimmedPassword);
      const hasSpecialChar = /[^A-Za-z0-9]/.test(trimmedPassword);

      if (!hasMinLength || !hasNumber || !hasSpecialChar) {
        const missingReqs: string[] = [];
        if (!hasMinLength) missingReqs.push('at least 8 characters');
        if (!hasNumber) missingReqs.push('at least one number (0-9)');
        if (!hasSpecialChar) missingReqs.push('at least one special character (e.g. !@#$%^&*)');
        setErrorNotice(`Password must meet complexity requirements: ${missingReqs.join(', ')}.`);
        return;
      }

      // 2. Check local users
      const existingUser = users.find((u) => (u?.email || '').toLowerCase() === normalizedEmail);
      if (existingUser && existingUser.password) {
        setErrorNotice(`An account with "${email}" is already registered. Please switch to "Sign In" or use another email.`);
        return;
      }

      setIsSendingOtp(true);
      try {
        // Register user with Firebase Auth + sendEmailVerification()
        const { firebaseUser, appUser, emailSent, emailError } = await firebaseRegisterUser({
          email: normalizedEmail,
          password: trimmedPassword,
          displayName: name.trim(),
          role,
          additionalData: {
            avatarUrl: avatarPhotoUrl || undefined,
            phone: phone.trim() || '+91 98765 00000',
            college: college.trim(),
            university,
            degree,
            branch,
            semester: role === 'seller' ? 7 : 3,
            isVerifiedSenior: role === 'seller' && Boolean(collegeIdFile),
          },
        });

        // Persist user locally
        const existingIdx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
        let updatedUsers: User[];
        if (existingIdx >= 0) {
          updatedUsers = [...users];
          updatedUsers[existingIdx] = appUser;
        } else {
          updatedUsers = [...users, appUser];
        }
        saveUsers(updatedUsers);
        setCurrentUser(appUser);

        if (emailSent) {
          setSuccessNotice(`Verification email sent to ${normalizedEmail}! Please check your Inbox and Spam/Junk folder.`);
        } else if (emailError) {
          setErrorNotice(emailError);
        }

        if (onNavigateToVerifyEmail) {
          onNavigateToVerifyEmail(normalizedEmail);
        } else {
          setPendingSignupUser(appUser);
          setOtpPurpose('signup');
          setIsOtpModalOpen(true);
          setSuccessNotice(`Verification email sent to ${normalizedEmail}`);
        }
      } catch (authError: any) {
        console.error('[AuthPage Registration Error]', authError);
        setErrorNotice(authError.message || 'Registration failed. Please check your credentials.');
      } finally {
        setIsSendingOtp(false);
      }
    } else {
      // STANDARD SIGN IN WITH PASSWORD
      if (!trimmedPassword) {
        setErrorNotice('Please enter your password.');
        return;
      }

      setIsSendingOtp(true);
      try {
        // Attempt Firebase sign-in
        let signedInFirebase = false;
        try {
          const { firebaseUser, isVerified } = await firebaseSignInUser(normalizedEmail, trimmedPassword);
          signedInFirebase = true;

          let matchedUser = users.find((u) => (u?.email || '').toLowerCase() === normalizedEmail);
          if (!matchedUser) {
            matchedUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'College Scholar',
              email: normalizedEmail,
              phone: '+91 98765 00000',
              college: 'VIT / Vidyalankar Institute',
              university: 'Mumbai University (MU)',
              degree: 'B.Tech / B.E.',
              branch: 'Computer Engineering (CSE)',
              semester: 4,
              role: normalizedEmail === 'rajbhosaletkd@gmail.com' ? 'admin' : 'buyer',
              isVerified: isVerified || normalizedEmail === 'rajbhosaletkd@gmail.com',
              isEmailVerified: isVerified || normalizedEmail === 'rajbhosaletkd@gmail.com',
              walletBalance: 0,
              totalEarnings: 0,
              rating: 5.0,
              totalRatingsCount: 0,
              createdAt: new Date().toISOString().split('T')[0],
            };
            saveUsers([...users, matchedUser]);
          } else {
            matchedUser.isEmailVerified = isVerified || matchedUser.isEmailVerified;
            matchedUser.isVerified = isVerified || matchedUser.isVerified;
            saveUsers(users);
          }

          if (!isVerified && matchedUser.role !== 'admin') {
            setCurrentUser(matchedUser);
            // Send verification email
            sendFirebaseEmailVerification(firebaseUser).catch((err) =>
              console.warn('[Firebase Auth] Verification email warning:', err)
            );

            if (onNavigateToVerifyEmail) {
              onNavigateToVerifyEmail(normalizedEmail);
              return;
            } else {
              setPendingLoginUser(matchedUser);
              setOtpPurpose('signup');
              setIsOtpModalOpen(true);
              setSuccessNotice(`Please verify your email. A verification link was sent to ${matchedUser.email}`);
              return;
            }
          }

          setCurrentUser(matchedUser);
          setSuccessNotice(`Authentication successful! Welcome back, ${matchedUser.name}.`);
          setTimeout(() => onLoginSuccess(matchedUser), 400);
          return;
        } catch (fbErr: any) {
          // Fallback to local stored credentials if offline/demo
          console.warn('[Firebase Auth Signin Notice]', fbErr?.message);
          const matchedUser = users.find((u) => (u?.email || '').toLowerCase() === normalizedEmail);
          if (!matchedUser) {
            setErrorNotice(fbErr.message || `No account found for "${email}". Please verify your credentials or click "Create an Account" to sign up.`);
            return;
          }

          if (matchedUser.isBlocked) {
            setErrorNotice(`This account has been suspended by NoteBridge moderators. Reason: ${matchedUser.blockedReason || 'Security policy violation'}.`);
            return;
          }

          if (matchedUser.password && matchedUser.password !== trimmedPassword) {
            setErrorNotice('Incorrect password. Please verify your credentials or click "Forgot Password?" below.');
            return;
          }

          // Check if user requires email verification
          if (matchedUser.isEmailVerified === false && matchedUser.role !== 'admin') {
            setCurrentUser(matchedUser);
            sendVerificationEmail(matchedUser.email, matchedUser.name).catch((err) =>
              console.warn('Login verification email dispatch warning:', err)
            );

            if (onNavigateToVerifyEmail) {
              onNavigateToVerifyEmail(matchedUser.email);
              return;
            } else {
              setPendingLoginUser(matchedUser);
              setOtpPurpose('signup');
              setIsOtpModalOpen(true);
              setSuccessNotice(`Please verify your email with the link sent to ${matchedUser.email}`);
              return;
            }
          }

          setCurrentUser(matchedUser);
          setSuccessNotice(`Authentication successful! Welcome back, ${matchedUser.name}.`);
          setTimeout(() => onLoginSuccess(matchedUser), 400);
        }
      } catch (err: any) {
        setErrorNotice(err.message || 'Sign-in failed.');
      } finally {
        setIsSendingOtp(false);
      }
    }
  };

  /** Triggered once OTP is verified in modal */
  const handleOtpVerificationSuccess = () => {
    setIsOtpModalOpen(false);

    if (otpPurpose === 'signup' && (pendingSignupUser || pendingLoginUser)) {
      const targetUser = pendingSignupUser || pendingLoginUser;
      if (!targetUser) return;
      const users = getStoredUsers();
      const userToSave: User = {
        ...targetUser,
        isVerified: true,
        isEmailVerified: true,
      };
      const existingIndex = users.findIndex((u) => u.id === userToSave.id || u.email.toLowerCase() === userToSave.email.toLowerCase());
      let updatedUsers: User[];
      if (existingIndex >= 0) {
        updatedUsers = [...users];
        updatedUsers[existingIndex] = userToSave;
      } else {
        updatedUsers = [...users, userToSave];
      }
      saveUsers(updatedUsers);
      setCurrentUser(userToSave);
      setSuccessNotice(`Email verified & Account activated! Welcome to NoteBridge, ${userToSave.name}.`);
      setTimeout(() => onLoginSuccess(userToSave), 500);
    } else if (otpPurpose === 'login' && pendingLoginUser) {
      const userToLogin: User = {
        ...pendingLoginUser,
        isVerified: true,
        isEmailVerified: true,
      };
      setCurrentUser(userToLogin);
      setSuccessNotice(`Email OTP Verified! Welcome back, ${userToLogin.name}.`);
      setTimeout(() => onLoginSuccess(userToLogin), 500);
    } else if (otpPurpose === 'reset_password') {
      setIsPasswordResetStage(true);
      setSuccessNotice('Email verified! Please enter your new password below.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-block">
          <Logo size="lg" showTagline={true} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          {isForgotPassword
            ? isPasswordResetStage
              ? 'Set New Account Password'
              : 'Reset Password via Email OTP'
            : isSignUp
            ? 'Join the NoteBridge College Community'
            : 'Welcome back to NoteBridge'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {isForgotPassword
            ? 'Verify your registered student email to securely recover your account.'
            : 'The verified peer-to-peer academic notes marketplace for university students.'}
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        {/* Error Alert Box */}
        {errorNotice && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">Authentication Alert</p>
              <p className="leading-relaxed">{errorNotice}</p>
            </div>
          </div>
        )}

        {/* Success Alert Box */}
        {successNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: FORGOT PASSWORD - NEW PASSWORD FORM (AFTER OTP VERIFIED) */}
        {/* ========================================================================= */}
        {isForgotPassword && isPasswordResetStage ? (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Resetting password for: <strong>{pendingLoginUser?.email}</strong>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  New Password *
                </label>
                <span className={`text-[10px] font-semibold ${isPasswordValid ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {isPasswordValid ? '✓ Strong Password' : 'Min 8 chars, 1 number & 1 symbol'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorNotice('');
                  }}
                  className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 ${
                    newPassword.length > 0
                      ? isPasswordValid
                        ? 'border-emerald-300 focus:ring-emerald-500'
                        : 'border-amber-300 focus:ring-amber-500'
                      : 'border-slate-200 focus:ring-blue-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setErrorNotice('');
                  }}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-98"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Update Password & Log In</span>
            </button>
          </form>
        ) : isForgotPassword ? (
          /* ========================================================================= */
          /* VIEW 2: FORGOT PASSWORD - REQUEST EMAIL OTP FORM */
          /* ========================================================================= */
          <form onSubmit={handleRequestForgotPasswordOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Student Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="yourname@college.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorNotice('');
                  }}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-98"
            >
              {isSendingOtp ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              <span>Send 6-Digit Password Reset OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setIsPasswordResetStage(false);
                setErrorNotice('');
              }}
              className="w-full py-2 text-xs text-slate-600 hover:text-slate-900 font-semibold transition text-center"
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          /* ========================================================================= */
          /* VIEW 3: MAIN AUTH FORM (SIGN IN OR SIGN UP) */
          /* ========================================================================= */
          <>
            {/* Role Selector Tabs (Only for Sign Up) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Select Your Account Type:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                      role === 'buyer'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${role === 'buyer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Student Buyer</p>
                      <p className="text-[11px] text-slate-500">Access & buy verified notes</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                      role === 'seller'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${role === 'seller' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Senior Seller</p>
                      <p className="text-[11px] text-slate-500">Upload notes & earn 80%</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Google Authentication */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleSigningIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-2xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-3 active:scale-98"
              >
                {isGoogleSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Continue with Google Account</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isSignUp ? 'or register with student email' : 'or choose sign in method'}
                </span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
            </div>

            {/* Sign In Method Selector (Password vs Instant Email OTP) */}
            {!isSignUp && (
              <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setErrorNotice('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    loginMethod === 'password'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp');
                    setErrorNotice('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    loginMethod === 'otp'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Instant Email OTP</span>
                </button>
              </div>
            )}

            {/* PASSWORDLESS EMAIL OTP LOGIN */}
            {!isSignUp && loginMethod === 'otp' ? (
              <form onSubmit={handleRequestLoginOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Student Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="yourname@college.edu or gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorNotice('');
                      }}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-98"
                >
                  {isSendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>Send 6-Digit Login Code</span>
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  🔒 We will dispatch a 6-digit cryptographic OTP to your inbox for passwordless entry.
                </p>
              </form>
            ) : (
              /* STANDARD SIGN UP OR PASSWORD SIGN IN FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setErrorNotice('');
                        }}
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}

                {isSignUp && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        College / Institute Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. VIT / Vidyalankar"
                        value={college}
                        onChange={(e) => {
                          setCollege(e.target.value);
                          setErrorNotice('');
                        }}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        University *
                      </label>
                      <select
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {UNIVERSITIES.filter((u) => u !== 'All Universities').map((uni) => (
                          <option key={uni} value={uni}>{uni}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Stream / Degree Program *
                      </label>
                      <select
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {DEGREES.filter((d) => d !== 'All Degrees' && d !== 'All Streams').map((deg) => (
                          <option key={deg} value={deg}>{deg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Branch / Specialization *
                      </label>
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {BRANCHES.filter((b) => b !== 'All Branches').map((br) => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Email ID *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="yourname@college.edu or gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorNotice('');
                      }}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setErrorNotice('');
                        }}
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password *
                    </label>
                    {isSignUp ? (
                      <span className={`text-[10px] font-semibold ${isPasswordValid ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {isPasswordValid ? '✓ Strong Password' : 'Min 8 chars, 1 number & 1 special symbol'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorNotice('');
                          setSuccessNotice('');
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={isSignUp ? 'Create a secure password (e.g. Student@2026)' : 'Enter password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorNotice('');
                      }}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 ${
                        isSignUp && password.length > 0
                          ? isPasswordValid
                            ? 'border-emerald-300 focus:ring-emerald-500'
                            : 'border-amber-300 focus:ring-amber-500'
                          : 'border-slate-200 focus:ring-blue-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Live Password Complexity Checklist for Sign Up */}
                  {isSignUp && (
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-[11px]">
                      <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                        Password Requirements:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        <div className={`flex items-center gap-1.5 font-medium transition ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>8+ characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium transition ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>At least 1 number</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium transition ${hasSpecialChar ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${hasSpecialChar ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 special symbol (!@#$)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Profile Photo Upload for Seniors & Juniors */}
                {isSignUp && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Profile Photo (Optional)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Upload a clear profile photo or avatar for your {role === 'seller' ? 'Senior Creator' : 'Student'} account.
                    </p>
                    <div className="flex items-center gap-3">
                      {avatarPhotoUrl ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-600 shadow-sm flex-shrink-0">
                          <img src={avatarPhotoUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                          {name.trim() ? name.trim().charAt(0).toUpperCase() : <Camera className="w-5 h-5 text-slate-400" />}
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                        {avatarPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarPhotoUrl('')}
                            className="text-[10px] text-rose-600 hover:underline mt-1 block"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional College-ID Verification for Sellers */}
                {isSignUp && role === 'seller' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Optional College-ID Verification (Recommended)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Upload your student ID card or semester marksheet photo to receive the <strong>“Verified Senior”</strong> trust badge on all your listings.
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setCollegeIdFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-98"
                >
                  {isSendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>
                        {isSignUp
                          ? `Verify Email & Create ${role === 'seller' ? 'Senior' : 'Student'} Account`
                          : 'Sign In to NoteBridge'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Quick Testing Credentials helper */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Quick Test Accounts (Click to Pre-fill):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setEmail('notebridge.com@gmail.com');
                setPassword('NoteBridge@2026');
                setErrorNotice('');
              }}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Official Hub Account
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                  Admin / Seller
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-mono mt-0.5 truncate">
                notebridge.com@gmail.com
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setEmail('rajbhosaletkd@gmail.com');
                setPassword('Admin@123');
                setErrorNotice('');
              }}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Raj Bhosale (Admin)
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">
                rajbhosaletkd@gmail.com
              </p>
            </button>
          </div>
        </div>

        {/* Toggle Login vs Register */}
        {!isForgotPassword && (
          <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorNotice('');
                    setSuccessNotice('');
                  }}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to NoteBridge?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorNotice('');
                    setSuccessNotice('');
                  }}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Create an Account (Free)
                </button>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Email OTP Verification Modal */}
      <EmailOtpVerificationModal
        isOpen={isOtpModalOpen}
        email={email}
        purpose={otpPurpose}
        userName={isSignUp ? name : pendingLoginUser?.name}
        title={
          otpPurpose === 'signup'
            ? 'Verify Your Student Email'
            : otpPurpose === 'reset_password'
            ? 'Verify Password Recovery Code'
            : 'Enter 6-Digit Login Code'
        }
        subtitle={
          otpPurpose === 'signup'
            ? 'A 6-digit confirmation code was sent to your student email. Enter it below to activate your account.'
            : otpPurpose === 'reset_password'
            ? 'Enter the 6-digit password reset code sent to your registered email.'
            : 'Enter the 6-digit code sent to your inbox to instantly log in.'
        }
        onVerified={handleOtpVerificationSuccess}
        onClose={() => setIsOtpModalOpen(false)}
        onChangeEmail={() => {
          setIsOtpModalOpen(false);
        }}
      />
    </div>
  );
};
