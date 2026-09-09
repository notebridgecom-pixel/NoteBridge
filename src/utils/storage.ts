import { NoteItem, User, PurchaseOrder, WithdrawalRequest, ContentReport, NoteReview, UserRole } from '../types';
import { INITIAL_NOTES, INITIAL_USERS, INITIAL_ORDERS, INITIAL_WITHDRAWALS, INITIAL_REPORTS } from '../data/mockData';
import { logSecurityEvent } from './securityLogs';

const STORAGE_KEYS = {
  NOTES: 'notebridge_notes_v2',
  USERS: 'notebridge_users_v2',
  CURRENT_USER_ID: 'notebridge_current_user_id_v2',
  ORDERS: 'notebridge_orders_v2',
  WITHDRAWALS: 'notebridge_withdrawals_v2',
  REPORTS: 'notebridge_reports_v2',
  DELETED_NOTES: 'notebridge_deleted_note_ids_v2',
};

// --- Deleted Notes Registry (Tombstones) ---
export function getDeletedNoteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_NOTES);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw);
    return new Set<string>(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set<string>();
  }
}

export function recordDeletedNoteId(noteId: string): void {
  if (!noteId) return;
  try {
    const current = getDeletedNoteIds();
    current.add(noteId);
    localStorage.setItem(STORAGE_KEYS.DELETED_NOTES, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error('Failed to record deleted note ID', e);
  }
}

export function isNoteDeleted(noteId: string): boolean {
  if (!noteId) return false;
  return getDeletedNoteIds().has(noteId);
}

// --- In-Memory & IndexedDB File Persistence Subsystem ---
const IDB_CONFIG = {
  DB_NAME: 'NoteBridgeVaultDB_v1',
  STORE_NAME: 'note_pdf_files',
  VERSION: 1,
};

// Fast memory cache for zero-latency synchronous reads during active session
export const noteFileMemoryCache = new Map<string, string>();

/** Open or create IndexedDB instance for large binary PDF documents */
function openFileDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(IDB_CONFIG.DB_NAME, IDB_CONFIG.VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_CONFIG.STORE_NAME)) {
        db.createObjectStore(IDB_CONFIG.STORE_NAME, { keyPath: 'noteId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Store a PDF file Base64 payload in IndexedDB and memory cache */
export async function saveNoteFileBlob(
  noteId: string,
  base64Data: string,
  fileName?: string,
  fileSizeMb?: number
): Promise<void> {
  if (!noteId || !base64Data) return;

  // 1. Immediately cache in memory
  noteFileMemoryCache.set(noteId, base64Data);

  // 2. Persist in IndexedDB
  try {
    const db = await openFileDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(IDB_CONFIG.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(IDB_CONFIG.STORE_NAME);
      const record = {
        noteId,
        pdfData: base64Data,
        fileName: fileName || `${noteId}.pdf`,
        fileSizeMb: fileSizeMb || 0,
        updatedAt: new Date().toISOString(),
      };
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn(`[NoteBridge FileStorage] IndexedDB write warning for note ${noteId}:`, err);
  }
}

/** Retrieve PDF Base64 payload asynchronously (checks memory cache then IndexedDB) */
export async function getNotePdfData(noteId: string): Promise<string | null> {
  if (!noteId) return null;

  // 1. Check memory cache first
  if (noteFileMemoryCache.has(noteId)) {
    return noteFileMemoryCache.get(noteId) || null;
  }

  // 2. Check IndexedDB
  try {
    const db = await openFileDatabase();
    const localData = await new Promise<string | null>((resolve) => {
      const transaction = db.transaction(IDB_CONFIG.STORE_NAME, 'readonly');
      const store = transaction.objectStore(IDB_CONFIG.STORE_NAME);
      const getReq = store.get(noteId);
      getReq.onsuccess = () => {
        if (getReq.result && getReq.result.pdfData) {
          noteFileMemoryCache.set(noteId, getReq.result.pdfData);
          resolve(getReq.result.pdfData);
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    });

    if (localData) {
      return localData;
    }
  } catch (err) {
    console.warn(`[NoteBridge FileStorage] IndexedDB read warning for note ${noteId}:`, err);
  }

  // 3. Fallback: Fetch PDF payload from central server
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(noteId)}/pdf`);
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.pdfData) {
        noteFileMemoryCache.set(noteId, serverData.pdfData);
        saveNoteFileBlob(noteId, serverData.pdfData, serverData.fileName, serverData.fileSizeMb).catch(() => {});
        return serverData.pdfData;
      }
    }
  } catch (e) {
    console.warn(`[NoteBridge FileStorage] Server PDF fetch fallback error for note ${noteId}:`, e);
  }

  return null;
}

/** Synchronously get PDF Base64 from memory cache */
export function getNotePdfDataSync(noteId: string): string | null {
  return noteFileMemoryCache.get(noteId) || null;
}

/** Delete stored PDF from cache and IndexedDB */
export async function deleteNoteFileBlob(noteId: string): Promise<void> {
  noteFileMemoryCache.delete(noteId);
  try {
    const db = await openFileDatabase();
    const transaction = db.transaction(IDB_CONFIG.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IDB_CONFIG.STORE_NAME);
    store.delete(noteId);
  } catch (err) {
    console.warn(`[NoteBridge FileStorage] Failed to delete note file ${noteId}:`, err);
  }
}

/** Preload all stored note PDF files from IndexedDB into memory cache on boot */
export async function preloadNoteFiles(): Promise<void> {
  try {
    const db = await openFileDatabase();
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(IDB_CONFIG.STORE_NAME, 'readonly');
      const store = transaction.objectStore(IDB_CONFIG.STORE_NAME);
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        if (Array.isArray(getAllReq.result)) {
          getAllReq.result.forEach((item) => {
            if (item && item.noteId && item.pdfData) {
              noteFileMemoryCache.set(item.noteId, item.pdfData);
            }
          });
        }
        resolve();
      };
      getAllReq.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[NoteBridge FileStorage] Preload files warning:', err);
  }
}

export const BUSINESS_RULES = {
  MIN_PRICE: 0, // Free to any price
  MAX_PRICE: 100000, // Open pricing
  PLATFORM_COMMISSION_RATE: 0.20, // 20% NoteBridge fee
  SELLER_PAYOUT_RATE: 0.80, // 80% to Senior seller
  MIN_WITHDRAWAL_AMOUNT: 1, // Minimum ₹1 (any positive amount)
};

/** Reset all cached state to pristine production launch state */
export function resetToCleanLaunchState(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user-admin-primary');
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to reset launch state', e);
  }
}

export function getStoredNotes(): NoteItem[] {
  try {
    const deletedIds = getDeletedNoteIds();
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) {
      const initial = INITIAL_NOTES.filter((n) => !deletedIds.has(n.id));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(initial));
      return initial;
    }
    const notes: NoteItem[] = JSON.parse(raw);
    // Ensure every note has a unique ID, filter deleted notes, and fix any legacy duplicate note-8
    const seenIds = new Set<string>();
    let hasModifiedIds = false;
    const cleanNotes: NoteItem[] = [];

    notes.forEach((n, idx) => {
      if (!n || !n.id || deletedIds.has(n.id)) {
        hasModifiedIds = true;
        return;
      }
      let id = n.id;
      if (seenIds.has(id)) {
        id = n.id === 'note-8' && seenIds.has('note-8') ? 'note-10' : `${n.id || 'note'}-${idx + 1}`;
        hasModifiedIds = true;
      }
      seenIds.add(id);

      // Hydrate pdfData from memory cache if available
      const cachedPdf = noteFileMemoryCache.get(id);
      cleanNotes.push({
        ...n,
        id,
        pdfData: cachedPdf || n.pdfData,
      });
    });

    if (hasModifiedIds) {
      // Save without bulky base64 in localStorage
      const storageSafe = cleanNotes.map((n) => ({ ...n, pdfData: undefined }));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(storageSafe));
    }
    return cleanNotes;
  } catch (e) {
    console.error('Failed to load notes from storage', e);
    const deletedIds = getDeletedNoteIds();
    return INITIAL_NOTES.filter((n) => !deletedIds.has(n.id));
  }
}

export function saveNotes(notes: NoteItem[]): void {
  try {
    const deletedIds = getDeletedNoteIds();
    const nonDeleted = notes.filter((n) => n && n.id && !deletedIds.has(n.id));

    // 1. For any notes with pdfData, ensure it is safely cached and stored in IndexedDB
    nonDeleted.forEach((n) => {
      if (n.id && n.pdfData) {
        noteFileMemoryCache.set(n.id, n.pdfData);
        saveNoteFileBlob(n.id, n.pdfData, n.pdfFileName, n.fileSizeMb).catch(() => {});
      }
    });

    // 2. Strip bulky pdfData before saving to localStorage to prevent QuotaExceededError
    const storageSafeNotes = nonDeleted.map((n) => {
      if (n.pdfData && n.pdfData.length > 500) {
        const { pdfData, ...rest } = n;
        return rest;
      }
      return n;
    });

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(storageSafeNotes));
  } catch (e) {
    console.error('Failed to save notes', e);
    // Extreme fallback: try saving minimal fields if storage quota is still high
    try {
      const deletedIds = getDeletedNoteIds();
      const minimalNotes = notes
        .filter((n) => n && n.id && !deletedIds.has(n.id))
        .map(({ pdfData, samplePages, textContent, ...rest }) => ({
          ...rest,
          samplePages: (samplePages || []).slice(0, 2),
        }));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(minimalNotes));
    } catch (err) {
      console.error('Critical storage quota fallback failed:', err);
    }
  }
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    // Ensure initial users have passwords if missing from earlier storage
    let updated = false;
    INITIAL_USERS.forEach((initU) => {
      const idx = parsed.findIndex((p) => 
        (p?.email && initU.email && p.email.toLowerCase() === initU.email.toLowerCase()) || 
        (p && p.id === initU.id)
      );
      if (idx === -1) {
        parsed.push(initU);
        updated = true;
      } else if (!parsed[idx].password && initU.password) {
        parsed[idx].password = initU.password;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load users from storage', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

export function getCurrentUser(): User | null {
  try {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) {
      return null;
    }
    const users = getStoredUsers();
    const found = users.find((u) => u.id === currentId);
    return found || null;
  } catch (e) {
    console.error('Failed to get current user', e);
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    saveUsers(users);
  } catch (e) {
    console.error('Failed to set current user', e);
  }
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  } catch (e) {
    console.error('Failed to logout', e);
  }
}

export function getStoredOrders(): PurchaseOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed: PurchaseOrder[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    
    // Deduplicate orders
    const seen = new Set<string>();
    const cleanOrders: PurchaseOrder[] = [];
    parsed.forEach((o) => {
      const key = o.id || o.orderNumber;
      if (key && !seen.has(key)) {
        seen.add(key);
        cleanOrders.push(o);
      }
    });

    if (cleanOrders.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(cleanOrders));
    }
    return cleanOrders;
  } catch (e) {
    console.error('Failed to load orders', e);
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: PurchaseOrder[]): void {
  try {
    const seen = new Set<string>();
    const cleanOrders = orders.filter((o) => {
      const key = o.id || o.orderNumber;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(cleanOrders));
  } catch (e) {
    console.error('Failed to save orders', e);
  }
}

export function getStoredWithdrawals(): WithdrawalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
      return INITIAL_WITHDRAWALS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load withdrawals', e);
    return INITIAL_WITHDRAWALS;
  }
}

export function saveWithdrawals(withdrawals: WithdrawalRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  } catch (e) {
    console.error('Failed to save withdrawals', e);
  }
}

export function getStoredReports(): ContentReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load reports', e);
    return INITIAL_REPORTS;
  }
}

export function saveReports(reports: ContentReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save reports', e);
  }
}

/** Complete a mock UPI purchase (Immediate approval - legacy) */
export function recordPurchase(params: {
  note: NoteItem;
  buyer?: User;
  currentUser?: User;
  paymentMethod: PurchaseOrder['paymentMethod'];
  upiTransactionId?: string;
}): PurchaseOrder {
  const { note, paymentMethod } = params;
  const buyer = params.buyer || params.currentUser || getCurrentUser();
  const notePrice = note?.price || 49;
  const sellerShare = Math.round(notePrice * BUSINESS_RULES.SELLER_PAYOUT_RATE * 10) / 10;
  const platformShare = Math.round(notePrice * BUSINESS_RULES.PLATFORM_COMMISSION_RATE * 10) / 10;
  const orderNumber = `NB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: PurchaseOrder = {
    id: `order-${Date.now()}`,
    orderNumber,
    noteId: note?.id || 'note-default',
    noteTitle: note?.title || 'Comprehensive Academic Notes',
    subject: note?.subject || 'Engineering Subject',
    university: note?.university || 'University',
    collegeName: note?.collegeName,
    sellerId: note?.sellerId || 'user-seller-1',
    sellerName: note?.sellerName || 'Verified Scholar',
    buyerId: buyer?.id || 'user-buyer-1',
    buyerName: buyer?.name || 'Rahul Sharma',
    buyerEmail: buyer?.email || 'rahul.sharma@vpoly.ac.in',
    buyerPhone: buyer?.phone,
    amount: notePrice,
    sellerShare,
    platformShare,
    paymentMethod,
    upiTransactionId: params.upiTransactionId || `UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    receiverName: 'Raj Sambhaji Bhosale',
    status: 'completed',
    purchasedAt: new Date().toISOString(),
    watermarkText: `Licensed to: ${buyer?.email || 'student@college.edu'} • Order #${orderNumber} • NoteBridge Anti-Leak Protection`,
  };

  // 1. Add order
  const orders = getStoredOrders();
  orders.unshift(newOrder);
  saveOrders(orders);

  // 2. Increment note sales count
  if (note?.id) {
    const notes = getStoredNotes();
    const noteIndex = notes.findIndex((n) => n.id === note.id);
    if (noteIndex >= 0) {
      notes[noteIndex].salesCount = (notes[noteIndex].salesCount || 0) + 1;
      saveNotes(notes);
    }
  }

  // 3. Update seller wallet
  if (note?.sellerId) {
    const users = getStoredUsers();
    const sellerIndex = users.findIndex((u) => u.id === note.sellerId);
    if (sellerIndex >= 0) {
      users[sellerIndex].walletBalance = (users[sellerIndex].walletBalance || 0) + sellerShare;
      users[sellerIndex].totalEarnings = (users[sellerIndex].totalEarnings || 0) + sellerShare;
      saveUsers(users);
    }
  }

  return newOrder;
}

/** Record Manual PhonePe QR Purchase with Screenshot & UTR (Pending Admin Verification) */
export function recordPendingPhonePePurchase(params: {
  note: NoteItem;
  buyer?: User;
  currentUser?: User;
  upiTransactionId: string;
  paymentScreenshotUrl?: string;
  receiverName?: string;
}): PurchaseOrder {
  const { note, upiTransactionId, paymentScreenshotUrl } = params;
  const buyer = params.buyer || params.currentUser || getCurrentUser();
  const notePrice = note?.price || 49;
  const sellerShare = Math.round(notePrice * BUSINESS_RULES.SELLER_PAYOUT_RATE * 10) / 10;
  const platformShare = Math.round(notePrice * BUSINESS_RULES.PLATFORM_COMMISSION_RATE * 10) / 10;
  const orderNumber = `NB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: PurchaseOrder = {
    id: `order-${Date.now()}`,
    orderNumber,
    noteId: note?.id || 'note-default',
    noteTitle: note?.title || 'Academic Notes',
    subject: note?.subject || 'Engineering',
    university: note?.university || 'University',
    collegeName: note?.collegeName,
    sellerId: note?.sellerId || 'user-seller-1',
    sellerName: note?.sellerName || 'Verified Scholar',
    buyerId: buyer?.id || 'user-buyer-1',
    buyerName: buyer?.name || 'Rahul Sharma',
    buyerEmail: buyer?.email || 'rahul.sharma@vpoly.ac.in',
    buyerPhone: buyer?.phone,
    amount: notePrice,
    sellerShare,
    platformShare,
    paymentMethod: 'phonepe',
    upiTransactionId: (upiTransactionId || '').trim(),
    receiverName: params.receiverName || 'Raj Sambhaji Bhosale',
    paymentScreenshotUrl,
    status: 'pending_verification',
    purchasedAt: new Date().toISOString(),
    watermarkText: `Licensed to: ${buyer?.email || 'student@college.edu'} • Order #${orderNumber} • NoteBridge Anti-Leak Protection`,
  };

  const orders = getStoredOrders();
  orders.unshift(newOrder);
  saveOrders(orders);

  return newOrder;
}

/** Admin approves pending payment verification */
export function approvePurchaseOrder(orderId: string, adminName: string = 'Raj Sambhaji Bhosale (Admin)'): PurchaseOrder | null {
  const orders = getStoredOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  const order = orders[index];
  order.status = 'completed';
  order.verifiedAt = new Date().toISOString();
  order.verifiedBy = adminName;
  saveOrders(orders);

  // 1. Increment note sales count
  const notes = getStoredNotes();
  const noteIndex = notes.findIndex((n) => n.id === order.noteId);
  if (noteIndex >= 0) {
    notes[noteIndex].salesCount = (notes[noteIndex].salesCount || 0) + 1;
    saveNotes(notes);
  }

  // 2. Note: Per instructions, seller payout is not automated yet, but track seller earnings balance
  const users = getStoredUsers();
  const sellerIndex = users.findIndex((u) => u.id === order.sellerId);
  if (sellerIndex >= 0) {
    users[sellerIndex].walletBalance = (users[sellerIndex].walletBalance || 0) + order.sellerShare;
    users[sellerIndex].totalEarnings = (users[sellerIndex].totalEarnings || 0) + order.sellerShare;
    saveUsers(users);
  }

  // 3. Log security & financial event
  logSecurityEvent({
    action: 'payment_approved',
    category: 'payment_verification',
    severity: 'success',
    performedBy: adminName,
    targetType: 'order',
    targetId: order.id,
    targetLabel: `Order #${order.orderNumber}`,
    details: `Approved PhonePe payment of ₹${order.amount} (UTR: ${order.upiTransactionId || 'N/A'}). Unlocked watermarked download for ${order.buyerName} (${order.buyerEmail}) and credited ₹${order.sellerShare} to seller ${order.sellerName}.`,
    metadata: {
      orderNumber: order.orderNumber,
      amount: `₹${order.amount}`,
      sellerShare: `₹${order.sellerShare}`,
      utr: order.upiTransactionId,
      buyerEmail: order.buyerEmail,
      sellerName: order.sellerName,
    },
  });

  return order;
}

/** Admin rejects pending payment verification */
export function rejectPurchaseOrder(orderId: string, reason: string, adminName: string = 'Raj Sambhaji Bhosale (Admin)'): PurchaseOrder | null {
  const orders = getStoredOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  const order = orders[index];
  order.status = 'rejected';
  order.rejectionReason = reason;
  order.verifiedAt = new Date().toISOString();
  order.verifiedBy = adminName;
  saveOrders(orders);

  // Log security rejection event
  logSecurityEvent({
    action: 'payment_rejected',
    category: 'payment_verification',
    severity: 'warning',
    performedBy: adminName,
    targetType: 'order',
    targetId: order.id,
    targetLabel: `Order #${order.orderNumber}`,
    details: `Rejected PhonePe payment proof for Order #${order.orderNumber} (₹${order.amount}). Reason: ${reason}. UTR: ${order.upiTransactionId || 'Missing'}.`,
    metadata: {
      orderNumber: order.orderNumber,
      amount: `₹${order.amount}`,
      utr: order.upiTransactionId,
      reason,
      buyerEmail: order.buyerEmail,
    },
  });

  return order;
}

/** Admin blocks or unblocks a student/seller account */
export function toggleUserBlockStatus(userId: string, reason?: string, adminName: string = 'Raj Sambhaji Bhosale (Admin)'): User | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  const willBeBlocked = !user.isBlocked;
  user.isBlocked = willBeBlocked;
  if (willBeBlocked) {
    user.blockedReason = reason || 'Suspicious activity or violation of NoteBridge academic policy.';
  } else {
    delete user.blockedReason;
  }
  saveUsers(users);

  logSecurityEvent({
    action: willBeBlocked ? 'user_blocked' : 'user_unblocked',
    category: 'user_management',
    severity: willBeBlocked ? 'critical' : 'info',
    performedBy: adminName,
    targetType: 'user',
    targetId: user.id,
    targetLabel: `${user.name} (${user.email})`,
    details: willBeBlocked
      ? `Account BLOCKED for user ${user.name} (${user.email}, Role: ${user.role}). Reason: ${user.blockedReason}`
      : `Account RESTORED / UNBLOCKED for user ${user.name} (${user.email}). Access reinstated.`,
    metadata: {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: willBeBlocked ? 'Blocked' : 'Active',
      reason: willBeBlocked ? user.blockedReason : undefined,
    },
  });

  return user;
}

/** Admin updates user role (buyer / seller / admin) */
export function updateUserRole(userId: string, newRole: UserRole, adminName: string = 'Raj Sambhaji Bhosale (Admin)'): User | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  const oldRole = user.role;
  user.role = newRole;
  if (newRole === 'seller') {
    user.isVerifiedSenior = true;
  }
  saveUsers(users);

  logSecurityEvent({
    action: 'user_role_changed',
    category: 'user_management',
    severity: newRole === 'admin' ? 'warning' : 'info',
    performedBy: adminName,
    targetType: 'user',
    targetId: user.id,
    targetLabel: `${user.name} (${user.email})`,
    details: `Changed role for user ${user.name} from '${oldRole}' to '${newRole}'. Permissions updated.`,
    metadata: {
      userId: user.id,
      email: user.email,
      oldRole,
      newRole,
    },
  });

  return user;
}

/** Toggle or update Senior Seller Verification Status */
export function toggleUserSeniorVerification(userId: string, isVerified: boolean, adminName: string = 'Raj Sambhaji Bhosale (Admin)'): User | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  user.isVerifiedSenior = isVerified;
  if (isVerified && user.role === 'buyer') {
    user.role = 'seller';
  }
  saveUsers(users);

  // If current logged in user is this user, update state
  const cur = getCurrentUser();
  if (cur && cur.id === userId) {
    setCurrentUser(user);
  }

  logSecurityEvent({
    action: isVerified ? 'user_role_changed' : 'user_role_changed',
    category: 'user_management',
    severity: isVerified ? 'success' : 'info',
    performedBy: adminName,
    targetType: 'user',
    targetId: user.id,
    targetLabel: `${user.name} (${user.email})`,
    details: isVerified
      ? `Senior Seller Application APPROVED for ${user.name}. Verified Senior badge granted with 80% payout royalty.`
      : `Senior Seller Verification revoked for ${user.name}.`,
    metadata: {
      userId: user.id,
      email: user.email,
      isVerifiedSenior: isVerified,
    },
  });

  return user;
}

/** Student submits an application for Senior Seller verification */
export function submitSellerApplication(userId: string, collegeIdPhotoUrl?: string): User | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  user.role = 'seller';
  user.collegeIdPhoto = collegeIdPhotoUrl || user.collegeIdPhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400';
  user.isVerifiedSenior = true;
  saveUsers(users);

  const cur = getCurrentUser();
  if (cur && cur.id === userId) {
    setCurrentUser(user);
  }

  logSecurityEvent({
    action: 'user_role_changed',
    category: 'user_management',
    severity: 'success',
    performedBy: `${user.name} (Applicant)`,
    targetType: 'user',
    targetId: user.id,
    targetLabel: `${user.name} (${user.email})`,
    details: `Seller application submitted by ${user.name} (${user.college}). Status updated to Verified Senior Seller.`,
    metadata: {
      userId: user.id,
      college: user.college,
      branch: user.branch,
      degree: user.degree,
    },
  });

  return user;
}

/** Update user's profile photo (Avatar) */
export function updateUserProfilePhoto(userId: string, avatarUrl: string): User | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  user.avatarUrl = avatarUrl.trim();
  saveUsers(users);

  const cur = getCurrentUser();
  if (cur && cur.id === userId) {
    cur.avatarUrl = user.avatarUrl;
    setCurrentUser(cur);
  }

  logSecurityEvent({
    action: 'user_role_changed',
    category: 'user_management',
    severity: 'info',
    performedBy: `${user.name} (${user.role === 'seller' ? 'Senior' : 'Junior Student'})`,
    targetType: 'user',
    targetId: user.id,
    targetLabel: `${user.name} (${user.email})`,
    details: `Profile photo updated for ${user.name} (${user.role === 'seller' ? 'Senior' : 'Junior Student'}).`,
    metadata: {
      userId: user.id,
      role: user.role,
      hasCustomAvatar: Boolean(user.avatarUrl),
    },
  });

  return user;
}

/** Update general user profile details (Name, College, Degree, Branch, Semester, Phone) */
export function updateUserProfileDetails(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'phone' | 'college' | 'university' | 'degree' | 'branch' | 'semester'>>
): User | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const user = {
    ...users[index],
    ...updates,
  };
  users[index] = user;
  saveUsers(users);

  const cur = getCurrentUser();
  if (cur && cur.id === userId) {
    const updatedCur = { ...cur, ...updates };
    setCurrentUser(updatedCur);
  }

  logSecurityEvent({
    action: 'user_role_changed',
    category: 'user_management',
    severity: 'info',
    performedBy: `${user.name}`,
    targetType: 'user',
    targetId: user.id,
    targetLabel: `${user.name} (${user.email})`,
    details: `Profile details updated for ${user.name}.`,
    metadata: {
      userId: user.id,
      updatedFields: Object.keys(updates).join(', '),
    },
  });

  return user;
}

/** Add a note review */
export function addNoteReview(params: {
  noteId: string;
  user?: User | null;
  rating: number;
  criteria?: {
    handwriting?: number;
    syllabusCoverage?: number;
    examRelevance?: number;
    conceptClarity?: number;
  };
  tags?: string[];
  userCourse?: string;
  userGradeAchieved?: string;
  comment: string;
}): NoteReview | null {
  const { noteId, user, rating, criteria, tags, userCourse, userGradeAchieved, comment } = params;
  const notes = getStoredNotes();
  const noteIndex = notes.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) return null;

  const note = notes[noteIndex];
  const newReview: NoteReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: user?.id || 'verified-buyer',
    userName: user?.name || 'Verified Student',
    userCollege: user?.college || 'Polytechnic & Engineering',
    userCourse: userCourse || (user?.degree && user?.branch ? `${user.degree} ${user.branch}` : undefined),
    userGradeAchieved: userGradeAchieved || undefined,
    rating,
    criteria: criteria || {
      handwriting: rating,
      syllabusCoverage: rating,
      examRelevance: rating,
      conceptClarity: rating,
    },
    tags: tags && tags.length > 0 ? tags : undefined,
    comment,
    createdAt: new Date().toISOString().split('T')[0],
    verifiedPurchase: true,
    helpfulCount: 0,
    helpfulUserIds: [],
  };

  const existingReviews = note.reviews || [];
  // If user already wrote a review, replace it; otherwise prepend
  const userExistingIdx = user?.id ? existingReviews.findIndex((r) => r.userId === user.id) : -1;
  let updatedReviews: NoteReview[];
  if (userExistingIdx >= 0) {
    updatedReviews = [...existingReviews];
    updatedReviews[userExistingIdx] = {
      ...newReview,
      id: existingReviews[userExistingIdx].id,
      helpfulCount: existingReviews[userExistingIdx].helpfulCount || 0,
      helpfulUserIds: existingReviews[userExistingIdx].helpfulUserIds || [],
    };
  } else {
    updatedReviews = [newReview, ...existingReviews];
  }

  const totalRatingSum = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Math.round((totalRatingSum / updatedReviews.length) * 10) / 10;

  notes[noteIndex].reviews = updatedReviews;
  notes[noteIndex].reviewsCount = updatedReviews.length;
  notes[noteIndex].rating = avgRating;
  saveNotes(notes);

  // Sync with backend API asynchronously
  try {
    fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: avgRating,
        reviewsCount: updatedReviews.length,
        reviews: updatedReviews,
      }),
    }).catch(() => {});
  } catch {}

  // Mark userRated on order
  if (user?.id) {
    const orders = getStoredOrders();
    const orderIndex = orders.findIndex((o) => o.noteId === noteId && o.buyerId === user.id);
    if (orderIndex >= 0) {
      orders[orderIndex].userRated = true;
      orders[orderIndex].userRating = rating;
      saveOrders(orders);
    }
  }

  return newReview;
}

/** Upvote / toggle helpful vote for a review */
export function voteReviewHelpful(noteId: string, reviewId: string, voterId: string): { helpfulCount: number; hasVoted: boolean } {
  const notes = getStoredNotes();
  const noteIndex = notes.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) return { helpfulCount: 0, hasVoted: false };

  const note = notes[noteIndex];
  const reviews = note.reviews || [];
  const revIndex = reviews.findIndex((r) => r.id === reviewId);
  if (revIndex === -1) return { helpfulCount: 0, hasVoted: false };

  const review = reviews[revIndex];
  const currentVoters = new Set(review.helpfulUserIds || []);
  let hasVoted = false;

  if (currentVoters.has(voterId)) {
    // Unvote
    currentVoters.delete(voterId);
    hasVoted = false;
  } else {
    // Add vote
    currentVoters.add(voterId);
    hasVoted = true;
  }

  const updatedHelpfulCount = currentVoters.size;
  reviews[revIndex] = {
    ...review,
    helpfulCount: updatedHelpfulCount,
    helpfulUserIds: Array.from(currentVoters),
  };

  notes[noteIndex].reviews = reviews;
  saveNotes(notes);

  // Async server update
  try {
    fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews }),
    }).catch(() => {});
  } catch {}

  return { helpfulCount: updatedHelpfulCount, hasVoted };
}

/** Upload new note */
export function createNewNoteListing(params: Omit<NoteItem, 'id' | 'createdAt' | 'status' | 'salesCount' | 'rating' | 'reviewsCount' | 'reviews'> & { status?: NoteItem['status'] }): NoteItem {
  const notes = getStoredNotes();
  const noteId = `note-${Date.now()}`;

  // If pdfData is provided, cache it immediately and save to IndexedDB
  if (params.pdfData) {
    noteFileMemoryCache.set(noteId, params.pdfData);
    saveNoteFileBlob(noteId, params.pdfData, params.pdfFileName, params.fileSizeMb).catch(() => {});
  }

  const newNote: NoteItem = {
    ...params,
    id: noteId,
    status: params.status || 'pending', // Awaiting Academic Council syllabus & copyright review by Admin
    salesCount: 0,
    rating: 5.0,
    reviewsCount: 0,
    reviews: [],
    createdAt: new Date().toISOString().split('T')[0],
  };

  notes.unshift(newNote);
  saveNotes(notes);

  logSecurityEvent({
    action: 'note_uploaded',
    category: 'note_moderation',
    severity: 'info',
    performedBy: `${params.sellerName} (Author)`,
    targetType: 'note',
    targetId: newNote.id,
    targetLabel: `${newNote.title} (${newNote.subject})`,
    details: `Author ${params.sellerName} uploaded note '${newNote.title}' for ${newNote.subject} (Sem ${newNote.semester}) priced at ₹${newNote.price}. Pending syllabus verification.`,
    metadata: {
      noteTitle: newNote.title,
      subject: newNote.subject,
      price: `₹${newNote.price}`,
      sellerName: params.sellerName,
    },
  });

  return newNote;
}

/** Update AI synopsis for a note */
export function updateNoteSynopsis(noteId: string, synopsis: string): NoteItem | null {
  const notes = getStoredNotes();
  const index = notes.findIndex((n) => n.id === noteId);
  if (index === -1) return null;

  notes[index].aiSynopsis = synopsis;
  notes[index].aiSynopsisGeneratedAt = new Date().toISOString();
  saveNotes(notes);
  return notes[index];
}

/** Request withdrawal */
export function requestSellerWithdrawal(params: {
  seller: User;
  amount: number;
  upiId: string;
}): WithdrawalRequest {
  const { seller, amount, upiId } = params;
  const newReq: WithdrawalRequest = {
    id: `w-${Date.now()}`,
    sellerId: seller.id,
    sellerName: seller.name,
    amount,
    upiId,
    status: 'processing',
    requestedAt: new Date().toISOString(),
  };

  const withdrawals = getStoredWithdrawals();
  withdrawals.unshift(newReq);
  saveWithdrawals(withdrawals);

  // Deduct from wallet balance
  const users = getStoredUsers();
  const uIndex = users.findIndex((u) => u.id === seller.id);
  if (uIndex >= 0) {
    users[uIndex].walletBalance = Math.max(0, (users[uIndex].walletBalance || 0) - amount);
    saveUsers(users);
  }

  logSecurityEvent({
    action: 'payout_requested',
    category: 'finance_payout',
    severity: 'info',
    performedBy: `${seller.name} (Seller)`,
    targetType: 'user',
    targetId: seller.id,
    targetLabel: `Payout Req #${newReq.id}`,
    details: `Seller ${seller.name} requested withdrawal of ₹${amount} to UPI ID '${upiId}'. Wallet balance updated.`,
    metadata: {
      sellerName: seller.name,
      amount: `₹${amount}`,
      upiId,
      requestId: newReq.id,
    },
  });

  return newReq;
}

/** Permanently delete a note from storage and clean up associated file blobs */
export function deleteNote(noteId: string, performedBy = 'Raj Sambhaji Bhosale (Admin)'): boolean {
  if (!noteId) return false;
  recordDeletedNoteId(noteId);
  const notes = getStoredNotes();
  const noteToDelete = notes.find((n) => n.id === noteId);

  const filtered = notes.filter((n) => n.id !== noteId);
  saveNotes(filtered);

  // Remove associated binary PDF from memory cache & IndexedDB
  noteFileMemoryCache.delete(noteId);
  deleteNoteFileBlob(noteId).catch(() => {});

  if (noteToDelete) {
    logSecurityEvent({
      action: 'note_deleted',
      category: 'note_moderation',
      severity: 'warning',
      performedBy,
      targetType: 'note',
      targetId: noteId,
      targetLabel: `${noteToDelete.title} (${noteToDelete.subject})`,
      details: `Permanently deleted note '${noteToDelete.title}' (#${noteId}) by author '${noteToDelete.sellerName}'. Removed from catalog inventory and file storage.`,
      metadata: {
        noteId,
        title: noteToDelete.title,
        subject: noteToDelete.subject,
        price: `₹${noteToDelete.price}`,
        sellerName: noteToDelete.sellerName,
      },
    });
  }

  return true;
}

/** Permanently delete an order record (e.g. test or spam orders) */
export function deleteOrder(orderId: string, performedBy = 'Raj Sambhaji Bhosale (Admin)'): boolean {
  const orders = getStoredOrders();
  const orderToDelete = orders.find((o) => o.id === orderId);
  if (!orderToDelete) return false;

  const filtered = orders.filter((o) => o.id !== orderId);
  saveOrders(filtered);

  logSecurityEvent({
    action: 'order_deleted',
    category: 'payment_verification',
    severity: 'warning',
    performedBy,
    targetType: 'order',
    targetId: orderId,
    targetLabel: `Order #${orderToDelete.orderNumber}`,
    details: `Deleted order #${orderToDelete.orderNumber} (Amount: ₹${orderToDelete.amount}, Buyer: ${orderToDelete.buyerName}) from transaction ledger.`,
    metadata: {
      orderId,
      orderNumber: orderToDelete.orderNumber,
      amount: `₹${orderToDelete.amount}`,
      buyerName: orderToDelete.buyerName,
    },
  });

  return true;
}

/** Update withdrawal request status (e.g. fulfill payout / mark completed) */
export function updateWithdrawalStatus(
  withdrawalId: string, 
  status: 'processing' | 'completed' | 'rejected', 
  utrNumber?: string,
  performedBy = 'Raj Sambhaji Bhosale (Admin)'
): boolean {
  const withdrawals = getStoredWithdrawals();
  const index = withdrawals.findIndex((w) => w.id === withdrawalId);
  if (index === -1) return false;

  const prev = withdrawals[index];
  withdrawals[index] = {
    ...prev,
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : prev.completedAt,
    utrNumber: utrNumber || prev.utrNumber
  };

  saveWithdrawals(withdrawals);

  // If rejected, refund seller's wallet
  if (status === 'rejected' && prev.status !== 'rejected') {
    const users = getStoredUsers();
    const uIdx = users.findIndex((u) => u.id === prev.sellerId);
    if (uIdx >= 0) {
      users[uIdx].walletBalance = (users[uIdx].walletBalance || 0) + prev.amount;
      saveUsers(users);
    }
  }

  logSecurityEvent({
    action: 'payout_completed',
    category: 'finance_payout',
    severity: status === 'rejected' ? 'warning' : 'success',
    performedBy,
    targetType: 'user',
    targetId: prev.sellerId,
    targetLabel: `Withdrawal #${withdrawalId}`,
    details: `Withdrawal #${withdrawalId} for ${prev.sellerName} (₹${prev.amount}) status changed from ${prev.status} to ${status.toUpperCase()}${utrNumber ? ` (UTR: ${utrNumber})` : ''}.`,
    metadata: {
      withdrawalId,
      sellerName: prev.sellerName,
      amount: `₹${prev.amount}`,
      upiId: prev.upiId,
      status,
      utrNumber
    }
  });

  return true;
}

/** Delete or dismiss a withdrawal request */
export function deleteWithdrawal(withdrawalId: string, performedBy = 'Raj Sambhaji Bhosale (Admin)'): boolean {
  const withdrawals = getStoredWithdrawals();
  const reqToDelete = withdrawals.find((w) => w.id === withdrawalId);
  if (!reqToDelete) return false;

  const filtered = withdrawals.filter((w) => w.id !== withdrawalId);
  saveWithdrawals(filtered);

  logSecurityEvent({
    action: 'withdrawal_deleted',
    category: 'finance_payout',
    severity: 'info',
    performedBy,
    targetType: 'user',
    targetId: reqToDelete.sellerId,
    targetLabel: `Withdrawal #${withdrawalId}`,
    details: `Deleted withdrawal record #${withdrawalId} for seller ${reqToDelete.sellerName} (Amount: ₹${reqToDelete.amount}).`,
    metadata: {
      withdrawalId,
      sellerName: reqToDelete.sellerName,
      amount: `₹${reqToDelete.amount}`,
    },
  });

  return true;
}

/** Delete user account */
export function deleteUser(userId: string, performedBy = 'Raj Sambhaji Bhosale (Admin)'): boolean {
  const users = getStoredUsers();
  const userToDelete = users.find((u) => u.id === userId);
  if (!userToDelete) return false;

  // Protect master admin from accidental self-deletion
  if (userToDelete.email === 'rajbhosaletkd@gmail.com') {
    return false;
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveUsers(filtered);

  logSecurityEvent({
    action: 'user_deleted',
    category: 'user_management',
    severity: 'warning',
    performedBy,
    targetType: 'user',
    targetId: userId,
    targetLabel: `${userToDelete.name} (${userToDelete.email})`,
    details: `Permanently deleted user account for ${userToDelete.name} (${userToDelete.email}, Role: ${userToDelete.role}).`,
    metadata: {
      userId,
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role,
    },
  });

  return true;
}

/** Delete / dismiss copyright report */
export function deleteReport(reportId: string, performedBy = 'Raj Sambhaji Bhosale (Admin)'): boolean {
  const reports = getStoredReports();
  const reportToDelete = reports.find((r) => r.id === reportId);
  if (!reportToDelete) return false;

  const filtered = reports.filter((r) => r.id !== reportId);
  saveReports(filtered);

  logSecurityEvent({
    action: 'report_deleted',
    category: 'system_security',
    severity: 'info',
    performedBy,
    targetType: 'note',
    targetId: reportToDelete.noteId,
    targetLabel: `Report #${reportId}`,
    details: `Dismissed and deleted copyright report #${reportId} for note #${reportToDelete.noteId}.`,
    metadata: {
      reportId,
      noteId: reportToDelete.noteId,
      reason: reportToDelete.reason,
    },
  });

  return true;
}

/** Reset database to default */
export function resetAppDatabase(): void {
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user-buyer-1');
}
