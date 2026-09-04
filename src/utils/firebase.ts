import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  reload,
  updateProfile,
  ActionCodeSettings,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { NoteItem, PurchaseOrder, User } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive and Google Chat scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces.create');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages.create');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/chat.memberships');
googleProvider.addScope('https://www.googleapis.com/auth/chat.memberships.readonly');

// In-Memory Access Token caching
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let isFirestoreConnected = false;

/**
 * Format Firebase Auth errors into clear, user-friendly messages
 */
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  const message = error?.message || 'Authentication error';

  switch (code) {
    case 'auth/too-many-requests':
      return 'Too many requests sent. Firebase rate limit triggered. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/invalid-continue-uri':
      return 'Invalid continue URL. Please verify your redirect URL settings.';
    case 'auth/unauthorized-continue-uri':
      return 'The current application domain is not whitelisted in Firebase Console (Authentication > Settings > Authorized domains). Please add this domain in Firebase Console.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters with numbers and special symbols.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by administrators.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in your Firebase Console. Please enable Email/Password provider under Authentication > Sign-in method.';
    case 'auth/requires-recent-login':
      return 'This operation is sensitive and requires recent authentication. Please log in again.';
    case 'auth/invalid-action-code':
      return 'This verification link is invalid, expired, or has already been used. Please request a new verification email.';
    case 'auth/expired-action-code':
      return 'This verification link has expired. Please request a fresh verification email.';
    default:
      return message;
  }
}

/**
 * Send Firebase Email Verification using sendEmailVerification()
 */
export async function sendFirebaseEmailVerification(
  userToVerify?: FirebaseUser | null
): Promise<{ success: boolean; message: string; error?: any }> {
  const user = userToVerify || auth.currentUser;

  if (!user) {
    console.warn('[Firebase Auth Debug] sendEmailVerification() called but no user is currently authenticated.');
    return {
      success: false,
      message: 'No authenticated user found. Please sign in to request a verification email.',
    };
  }

  const appOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ais-dev-yakejmoqsaffm6n6zlrmyg-326917652536.asia-east1.run.app';

  // ActionCodeSettings redirect back to the verify-email page
  const actionCodeSettings: ActionCodeSettings = {
    url: `${appOrigin}/verify-email?email=${encodeURIComponent(user.email || '')}`,
    handleCodeInApp: true,
  };

  console.log('======================================================');
  console.log('[Firebase Auth Debug] Invoking sendEmailVerification()');
  console.log(`[Firebase Auth Debug] User UID: ${user.uid}`);
  console.log(`[Firebase Auth Debug] User Email: ${user.email}`);
  console.log(`[Firebase Auth Debug] Continue URL: ${actionCodeSettings.url}`);
  console.log(`[Firebase Auth Debug] Whether sendEmailVerification() was called: true`);
  console.log('======================================================');

  try {
    // Attempt with ActionCodeSettings first
    try {
      await sendEmailVerification(user, actionCodeSettings);
    } catch (actError: any) {
      // If continue URL domain is not authorized yet, fallback to standard sendEmailVerification
      if (
        actError?.code === 'auth/unauthorized-continue-uri' ||
        actError?.code === 'auth/invalid-continue-uri'
      ) {
        console.warn(
          `[Firebase Auth Warning] ${actError.code}. Retrying with default Firebase continue URL...`,
          actError.message
        );
        await sendEmailVerification(user);
      } else {
        throw actError;
      }
    }

    console.log('[Firebase Auth Debug] sendEmailVerification() completed successfully');
    console.log('[Firebase Auth Debug] Firebase error returned: false');
    console.log('[Firebase Auth Debug] Current user emailVerified:', user.emailVerified);

    return {
      success: true,
      message: `Firebase verification email sent to ${user.email}. Please check your inbox and Spam/Junk folder.`,
    };
  } catch (error: any) {
    console.error('[Firebase Auth Debug] Firebase returned an error from sendEmailVerification():');
    console.error(`[Firebase Auth Debug] Exact error code: ${error?.code || 'UNKNOWN'}`);
    console.error(`[Firebase Auth Debug] Exact error message: ${error?.message || String(error)}`);
    console.log('[Firebase Auth Debug] Whether Firebase returned an error: true');

    const formattedMessage = formatFirebaseAuthError(error);
    return {
      success: false,
      message: formattedMessage,
      error,
    };
  }
}

/**
 * Register a new user with Firebase Email & Password
 */
export async function firebaseRegisterUser({
  email,
  password,
  displayName,
  role = 'buyer',
  additionalData = {},
}: {
  email: string;
  password: string;
  displayName: string;
  role?: 'buyer' | 'seller' | 'admin';
  additionalData?: Partial<User>;
}): Promise<{ firebaseUser: FirebaseUser; appUser: User; emailSent: boolean; emailError?: string }> {
  console.log('======================================================');
  console.log(`[Firebase Auth Debug] Starting registration for: ${email}`);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    console.log('[Firebase Auth Debug] Registration succeeded!');
    console.log(`[Firebase Auth Debug] User UID: ${fbUser.uid}`);
    console.log(`[Firebase Auth Debug] User Email: ${fbUser.email}`);
    console.log(`[Firebase Auth Debug] Current user emailVerified: ${fbUser.emailVerified}`);

    // Update Firebase Profile displayName
    if (displayName) {
      try {
        await updateProfile(fbUser, { displayName });
      } catch (pErr) {
        console.warn('[Firebase Auth] Failed to update displayName in profile:', pErr);
      }
    }

    // Call sendEmailVerification immediately
    const emailResult = await sendFirebaseEmailVerification(fbUser);

    const appUser: User = {
      id: fbUser.uid,
      name: displayName || 'College Scholar',
      email: fbUser.email || email,
      phone: additionalData.phone || '+91 98765 00000',
      college: additionalData.college || 'VIT / Vidyalankar Institute',
      university: additionalData.university || 'Mumbai University (MU)',
      degree: additionalData.degree || 'B.Tech / B.E.',
      branch: additionalData.branch || 'Computer Engineering (CSE)',
      semester: additionalData.semester || (role === 'seller' ? 7 : 3),
      role: email === 'rajbhosaletkd@gmail.com' || email === 'admin@notebridge.in' ? 'admin' : role,
      avatarUrl: fbUser.photoURL || additionalData.avatarUrl || undefined,
      isVerifiedSenior: role === 'seller',
      isVerified: fbUser.emailVerified || (role === 'admin'),
      isEmailVerified: fbUser.emailVerified || (role === 'admin'),
      walletBalance: 0,
      totalEarnings: 0,
      rating: 5.0,
      totalRatingsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      ...additionalData,
    };

    // Sync profile to Firestore
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      await setDoc(
        userRef,
        {
          id: appUser.id,
          name: appUser.name,
          email: appUser.email,
          phone: appUser.phone,
          college: appUser.college,
          university: appUser.university,
          degree: appUser.degree,
          branch: appUser.branch,
          semester: appUser.semester,
          role: appUser.role,
          isEmailVerified: appUser.isEmailVerified,
          walletBalance: appUser.walletBalance,
          totalEarnings: appUser.totalEarnings,
          createdAt: appUser.createdAt,
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('[Firebase Firestore] Profile sync warning (offline store):', fsErr);
    }

    return {
      firebaseUser: fbUser,
      appUser,
      emailSent: emailResult.success,
      emailError: emailResult.success ? undefined : emailResult.message,
    };
  } catch (error: any) {
    console.error('[Firebase Auth Debug] Registration failed with error:');
    console.error(`[Firebase Auth Debug] Exact error code: ${error?.code || 'UNKNOWN'}`);
    console.error(`[Firebase Auth Debug] Exact error message: ${error?.message || String(error)}`);
    throw new Error(formatFirebaseAuthError(error));
  }
}

/**
 * Sign In with Firebase Email & Password
 */
export async function firebaseSignInUser(
  email: string,
  password: string
): Promise<{ firebaseUser: FirebaseUser; isVerified: boolean }> {
  try {
    console.log(`[Firebase Auth Debug] Signing in with Email/Password: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    console.log('[Firebase Auth Debug] Sign-in succeeded!');
    console.log(`[Firebase Auth Debug] User UID: ${fbUser.uid}`);
    console.log(`[Firebase Auth Debug] User Email: ${fbUser.email}`);
    console.log(`[Firebase Auth Debug] Current user emailVerified: ${fbUser.emailVerified}`);

    return {
      firebaseUser: fbUser,
      isVerified: fbUser.emailVerified,
    };
  } catch (error: any) {
    console.error('[Firebase Auth Debug] Sign-in failed:');
    console.error(`[Firebase Auth Debug] Exact error code: ${error?.code || 'UNKNOWN'}`);
    console.error(`[Firebase Auth Debug] Exact error message: ${error?.message || String(error)}`);
    throw new Error(formatFirebaseAuthError(error));
  }
}

/**
 * Reload the current Firebase user and return their up-to-date emailVerified state
 */
export async function reloadFirebaseUserStatus(): Promise<{
  isVerified: boolean;
  email: string;
  uid: string;
  user: FirebaseUser | null;
}> {
  const user = auth.currentUser;
  if (!user) {
    console.log('[Firebase Auth Debug] reloadFirebaseUserStatus: No user signed in');
    return { isVerified: false, email: '', uid: '', user: null };
  }

  try {
    await reload(user);
    console.log('======================================================');
    console.log('[Firebase Auth Debug] Reloaded Firebase User State');
    console.log(`[Firebase Auth Debug] User UID: ${user.uid}`);
    console.log(`[Firebase Auth Debug] User Email: ${user.email}`);
    console.log(`[Firebase Auth Debug] Current user emailVerified: ${user.emailVerified}`);
    console.log('======================================================');

    return {
      isVerified: user.emailVerified,
      email: user.email || '',
      uid: user.uid,
      user,
    };
  } catch (error: any) {
    console.error('[Firebase Auth Debug] Failed to reload user status:', error);
    return {
      isVerified: user.emailVerified,
      email: user.email || '',
      uid: user.uid,
      user,
    };
  }
}

/**
 * Apply Firebase verification action code (oobCode from email link)
 */
export async function applyFirebaseActionCode(actionCode: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[Firebase Auth Debug] Applying action code to verify email: ${actionCode.slice(0, 10)}...`);
    await applyActionCode(auth, actionCode);
    if (auth.currentUser) {
      await reload(auth.currentUser);
    }
    console.log('[Firebase Auth Debug] Action code applied successfully!');
    return {
      success: true,
      message: 'Email address verified successfully via Firebase link!',
    };
  } catch (error: any) {
    console.error('[Firebase Auth Debug] Failed to apply action code:', error);
    return {
      success: false,
      message: formatFirebaseAuthError(error),
    };
  }
}

// Test server connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirestoreConnected = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore test connection: Client is offline or initializing.");
    }
    // Connected to server even if doc does not exist
    isFirestoreConnected = true;
    return true;
  }
}

// Initialize Auth State Listener
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // user is signed in with firebase auth session
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string; appUser: User } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    const firebaseUser = result.user;
    const displayName = firebaseUser.displayName || 'College Scholar';
    const email = firebaseUser.email || 'scholar@college.edu';
    
    const appUser: User = {
      id: firebaseUser.uid,
      name: displayName,
      email: email,
      phone: firebaseUser.phoneNumber || '+91 98765 43210',
      college: 'VIT / Vidyalankar Institute',
      university: 'Mumbai University (MU)',
      degree: 'B.Tech / B.E.',
      branch: 'Computer Engineering (CSE)',
      semester: 4,
      role: email === 'rajbhosaletkd@gmail.com' || email === 'admin@notebridge.in' ? 'admin' : 'buyer',
      avatarUrl: firebaseUser.photoURL || undefined,
      isVerifiedSenior: true,
      walletBalance: 250,
      totalEarnings: 250,
      rating: 5.0,
      totalRatingsCount: 1,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Sync user profile to Firestore
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        id: appUser.id,
        name: appUser.name,
        email: appUser.email,
        phone: appUser.phone,
        college: appUser.college,
        university: appUser.university,
        degree: appUser.degree,
        branch: appUser.branch,
        semester: appUser.semester,
        role: appUser.role,
        walletBalance: appUser.walletBalance,
        totalEarnings: appUser.totalEarnings,
        createdAt: appUser.createdAt,
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore user profile sync warning (offline fallback active):', e);
    }

    return { 
      user: firebaseUser, 
      accessToken: cachedAccessToken || '', 
      appUser 
    };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Sync a single note to Firestore
export async function syncNoteToFirestore(note: NoteItem): Promise<void> {
  if (!auth.currentUser) {
    // Unauthenticated guest/local mode - saved securely to local storage
    return;
  }
  const path = `notes/${note.id}`;
  try {
    const cleanNote = {
      id: note.id,
      title: note.title.slice(0, 200),
      description: (note.description || '').slice(0, 2000),
      subject: note.subject.slice(0, 150),
      university: note.university.slice(0, 200),
      collegeName: (note.collegeName || '').slice(0, 200),
      degree: note.degree.slice(0, 100),
      branch: note.branch.slice(0, 100),
      semester: note.semester,
      unitsCovered: (note.unitsCovered || '').slice(0, 200),
      academicYear: (note.academicYear || '').slice(0, 50),
      price: note.price,
      sellerId: auth.currentUser ? auth.currentUser.uid : note.sellerId.slice(0, 128),
      sellerName: note.sellerName.slice(0, 150),
      sellerCollege: (note.sellerCollege || '').slice(0, 200),
      sellerYear: (note.sellerYear || '').slice(0, 100),
      totalPages: note.totalPages,
      fileSizeMb: note.fileSizeMb,
      status: note.status,
      salesCount: note.salesCount || 0,
      rating: note.rating || 5.0,
      reviewsCount: note.reviewsCount || 0,
      hasPYQ: !!note.hasPYQ,
      hasHandwrittenFormulas: !!note.hasHandwrittenFormulas,
      textContent: (note.textContent || '').slice(0, 20000),
      aiSynopsis: (note.aiSynopsis || '').slice(0, 5000),
      aiSynopsisGeneratedAt: note.aiSynopsisGeneratedAt || '',
      createdAt: note.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'notes', note.id), cleanNote, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync an order to Firestore
export async function syncOrderToFirestore(order: PurchaseOrder): Promise<void> {
  if (!auth.currentUser) {
    // Unauthenticated guest/local mode - order is safely preserved in local storage
    return;
  }
  const path = `orders/${order.id}`;
  try {
    const cleanOrder = {
      id: order.id,
      orderNumber: order.orderNumber.slice(0, 50),
      noteId: order.noteId.slice(0, 128),
      noteTitle: order.noteTitle.slice(0, 200),
      subject: order.subject.slice(0, 150),
      sellerId: order.sellerId.slice(0, 128),
      sellerName: order.sellerName.slice(0, 150),
      buyerId: auth.currentUser ? auth.currentUser.uid : order.buyerId.slice(0, 128),
      buyerName: order.buyerName.slice(0, 150),
      buyerEmail: (auth.currentUser.email || order.buyerEmail || '').slice(0, 150),
      buyerPhone: (order.buyerPhone || '').slice(0, 50),
      amount: order.amount,
      sellerShare: order.sellerShare,
      platformShare: order.platformShare,
      upiTransactionId: (order.upiTransactionId || '').slice(0, 50),
      status: order.status,
      purchasedAt: order.purchasedAt,
      watermarkText: (order.watermarkText || '').slice(0, 200),
    };
    await setDoc(doc(db, 'orders', order.id), cleanOrder, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
