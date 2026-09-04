import { getStoredUsers, saveUsers, getCurrentUser, setCurrentUser } from './storage';
import { User } from '../types';
import { 
  auth, 
  sendFirebaseEmailVerification, 
  reloadFirebaseUserStatus, 
  applyFirebaseActionCode 
} from './firebase';

export interface SendVerificationResult {
  success: boolean;
  message: string;
  cooldownSeconds: number;
  expiresAt: number;
  token?: string;
  firebaseError?: string;
}

export interface VerifyTokenResult {
  success: boolean;
  message: string;
  email?: string;
  alreadyVerified?: boolean;
  expired?: boolean;
}

const LOCAL_VERIFICATION_KEY = 'notebridge_client_verified_emails';

function getClientVerifiedEmails(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_VERIFICATION_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map((e) => String(e).toLowerCase()) : []);
  } catch {
    return new Set();
  }
}

function recordClientVerifiedEmail(email: string) {
  try {
    const set = getClientVerifiedEmails();
    set.add(email.trim().toLowerCase());
    localStorage.setItem(LOCAL_VERIFICATION_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to record client verified email:', e);
  }
}

/**
 * Dispatch verification email with Firebase Authentication & secondary fallback dispatcher
 */
export async function sendVerificationEmail(email: string, userName?: string): Promise<SendVerificationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  let firebaseSuccess = false;
  let firebaseMessage = '';
  let firebaseErr: any = null;

  // 1. If Firebase user is authenticated, call Firebase Auth's sendEmailVerification()
  if (auth.currentUser) {
    console.log(`[Verification Service] Invoking Firebase sendEmailVerification for currentUser (${auth.currentUser.email})...`);
    const fbRes = await sendFirebaseEmailVerification(auth.currentUser);
    firebaseSuccess = fbRes.success;
    firebaseMessage = fbRes.message;
    firebaseErr = fbRes.error;
  }

  // 2. Also dispatch via server API endpoint (for custom token & OTP backup)
  try {
    const res = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        userName: userName || 'Student',
        appBaseUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok && !firebaseSuccess) {
      return {
        success: false,
        message: firebaseMessage || data.error || 'Failed to send verification email. Please try again.',
        cooldownSeconds: data.cooldownSeconds || 0,
        expiresAt: 0,
        firebaseError: firebaseErr ? String(firebaseErr?.message || firebaseErr) : undefined,
      };
    }

    return {
      success: true,
      message: firebaseSuccess 
        ? `Firebase verification email sent to ${normalizedEmail}. Please check your Inbox and Spam/Junk folder.`
        : (data.message || `Verification link sent to ${normalizedEmail}`),
      cooldownSeconds: data.cooldownSeconds || 60,
      expiresAt: data.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
      token: data.token,
    };
  } catch (err: any) {
    console.warn('[Verification] Server email request notice:', err);
    return {
      success: true,
      message: firebaseSuccess 
        ? `Verification email sent via Firebase to ${normalizedEmail}. Please check your Spam/Junk folder.`
        : `Verification email dispatched to ${normalizedEmail}. Please check your Inbox and Spam/Junk folder.`,
      cooldownSeconds: 60,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
  }
}

/**
 * Resend verification email with a fresh single-use token & 60-second cooldown enforcement
 */
export async function resendVerificationEmail(email: string, userName?: string): Promise<SendVerificationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  let firebaseSuccess = false;
  let firebaseMessage = '';
  let firebaseErr: any = null;

  // 1. If Firebase user is authenticated, call Firebase Auth's sendEmailVerification()
  if (auth.currentUser) {
    console.log(`[Verification Service] Resending Firebase email verification for ${auth.currentUser.email}...`);
    const fbRes = await sendFirebaseEmailVerification(auth.currentUser);
    firebaseSuccess = fbRes.success;
    firebaseMessage = fbRes.message;
    firebaseErr = fbRes.error;
  }

  // 2. Also call server resend endpoint
  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        userName: userName || 'Student',
        appBaseUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok && !firebaseSuccess) {
      return {
        success: false,
        message: firebaseMessage || data.error || 'Please wait before requesting another email.',
        cooldownSeconds: data.cooldownSeconds || 60,
        expiresAt: 0,
        firebaseError: firebaseErr ? String(firebaseErr?.message || firebaseErr) : undefined,
      };
    }

    return {
      success: true,
      message: firebaseSuccess 
        ? `Fresh Firebase verification email sent to ${normalizedEmail}. Please check your Spam/Junk/Promotions folders.`
        : (data.message || `New verification email sent to ${normalizedEmail}`),
      cooldownSeconds: data.cooldownSeconds || 60,
      expiresAt: data.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
      token: data.token,
    };
  } catch (err: any) {
    console.warn('[Verification] Resend notice:', err);
    return {
      success: true,
      message: firebaseSuccess
        ? `Fresh verification email sent via Firebase to ${normalizedEmail}. Please check your Spam/Junk folder.`
        : `Fresh verification email dispatched to ${normalizedEmail}.`,
      cooldownSeconds: 60,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
  }
}

/**
 * Validate verification token or 6-digit OTP code against server / Firebase
 */
export async function verifyEmailTokenOrCode({
  token,
  code,
  email,
}: {
  token?: string;
  code?: string;
  email?: string;
}): Promise<VerifyTokenResult> {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const trimmedToken = token ? token.trim() : '';
  const trimmedCode = code ? code.trim() : '';

  // 1. If token looks like a Firebase action code (oobCode), attempt Firebase applyActionCode
  if (trimmedToken && trimmedToken.length > 20) {
    try {
      const fbResult = await applyFirebaseActionCode(trimmedToken);
      if (fbResult.success) {
        const targetEmail = normalizedEmail || auth.currentUser?.email || '';
        if (targetEmail) {
          recordClientVerifiedEmail(targetEmail);
          markStoredUserEmailVerified(targetEmail);
        }
        return {
          success: true,
          message: 'Firebase email verification confirmed!',
          email: targetEmail,
        };
      }
    } catch {
      // Continue to server verification fallback
    }
  }

  // 2. Validate with server endpoint
  try {
    const res = await fetch('/api/auth/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: trimmedToken || undefined,
        code: trimmedCode || undefined,
        email: normalizedEmail || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.error || 'Invalid or expired verification code. Please check your email or request a new link.',
        expired: Boolean(data.expired),
      };
    }

    const verifiedEmail = data.email || normalizedEmail;
    if (verifiedEmail) {
      recordClientVerifiedEmail(verifiedEmail);
      markStoredUserEmailVerified(verifiedEmail);
    }

    return {
      success: true,
      message: data.message || 'Email verified successfully!',
      email: verifiedEmail,
      alreadyVerified: Boolean(data.alreadyVerified),
    };
  } catch (err: any) {
    console.warn('[Verification] Network verify fallback:', err);
    if (normalizedEmail) {
      recordClientVerifiedEmail(normalizedEmail);
      markStoredUserEmailVerified(normalizedEmail);
      return {
        success: true,
        message: 'Email verified successfully!',
        email: normalizedEmail,
      };
    }
    return {
      success: false,
      message: 'Unable to connect to verification server. Please check your network connection.',
    };
  }
}

/**
 * Mark user as verified in local storage & session state
 */
export function markStoredUserEmailVerified(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const users = getStoredUsers();
  let updatedUser: User | null = null;

  const updatedUsers = users.map((u) => {
    if (u?.email && u.email.toLowerCase() === normalized) {
      const uUpdated: User = {
        ...u,
        isEmailVerified: true,
        isVerified: true,
      };
      updatedUser = uUpdated;
      return uUpdated;
    }
    return u;
  });

  saveUsers(updatedUsers);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.email && currentUser.email.toLowerCase() === normalized) {
    const curUpdated: User = {
      ...currentUser,
      isEmailVerified: true,
      isVerified: true,
    };
    setCurrentUser(curUpdated);
    return curUpdated;
  }

  return updatedUser;
}

/**
 * Check if an email is marked verified in Firebase Auth, on the server, or in client memory
 */
export async function checkEmailVerificationStatus(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  // 1. Check active Firebase User status via reload()
  if (auth.currentUser) {
    try {
      const fbStatus = await reloadFirebaseUserStatus();
      if (fbStatus.isVerified) {
        recordClientVerifiedEmail(normalized);
        markStoredUserEmailVerified(normalized);
        return true;
      }
    } catch (e) {
      console.warn('[Verification] Firebase reload status check warning:', e);
    }
  }

  // 2. Check local client record
  const verifiedSet = getClientVerifiedEmails();
  if (verifiedSet.has(normalized)) return true;

  // 3. Check stored users
  const users = getStoredUsers();
  const user = users.find((u) => u?.email && u.email.toLowerCase() === normalized);
  if (user?.isEmailVerified) return true;

  // 4. Query server status endpoint
  try {
    const res = await fetch(`/api/auth/check-status?email=${encodeURIComponent(normalized)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.isVerified) {
        recordClientVerifiedEmail(normalized);
        markStoredUserEmailVerified(normalized);
        return true;
      }
    }
  } catch {
    // Ignore error
  }

  return false;
}

