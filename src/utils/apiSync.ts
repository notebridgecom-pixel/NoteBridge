import { NoteItem, PurchaseOrder, WithdrawalRequest } from '../types';
import {
  getStoredNotes,
  saveNotes,
  getStoredOrders,
  saveOrders,
  getStoredWithdrawals,
  saveWithdrawals,
  noteFileMemoryCache,
  saveNoteFileBlob,
  getDeletedNoteIds,
  recordDeletedNoteId,
  getDeletedOrderIds,
  recordDeletedOrderId,
} from './storage';

/**
 * Client-Server Real-Time Data Sync Layer
 * Ensures notes, orders, and withdrawals uploaded or purchased on any device
 * (Desktop, Mobile, Tablet) are centrally persisted and broadcasted to all buyers instantly.
 */

// Fetch all notes from the central backend server
export async function fetchServerNotes(): Promise<NoteItem[]> {
  try {
    const deletedIds = getDeletedNoteIds();
    const res = await fetch('/api/notes', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      return getStoredNotes().filter((n) => !deletedIds.has(n.id));
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      const localNotes = getStoredNotes();
      const localMap = new Map(localNotes.map((n) => [n.id, n]));
      
      const seen = new Set<string>();
      const merged: NoteItem[] = [];

      data.forEach((serverNote: NoteItem) => {
        if (!serverNote || !serverNote.id || seen.has(serverNote.id) || deletedIds.has(serverNote.id)) return;
        seen.add(serverNote.id);
        const local = localMap.get(serverNote.id);
        const cachedPdf = noteFileMemoryCache.get(serverNote.id);
        merged.push({
          ...serverNote,
          pdfData: cachedPdf || local?.pdfData || serverNote.pdfData,
        });
      });

      saveNotes(merged);
      return merged;
    }
    return getStoredNotes().filter((n) => !deletedIds.has(n.id));
  } catch (err) {
    console.warn('[Sync] Fallback to local storage for notes:', err);
    return getStoredNotes();
  }
}

// Upload a note to the central server
export async function postServerNote(note: NoteItem): Promise<NoteItem> {
  try {
    // Get PDF data if available in memory
    const pdfData = note.pdfData || noteFileMemoryCache.get(note.id);
    
    const payload = {
      ...note,
      pdfData,
    };

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.note) {
        return data.note;
      }
    }
  } catch (err) {
    console.warn('[Sync] Failed to post note to server (cached locally):', err);
  }
  return note;
}

// Update a note on the server (e.g. status moderation, reviews, synopsis)
export async function updateServerNote(noteId: string, updates: Partial<NoteItem>): Promise<void> {
  try {
    await fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('[Sync] Note update sync warning:', err);
  }
}

// Delete a note on the server
export async function deleteServerNote(noteId: string): Promise<boolean> {
  if (!noteId) return false;
  recordDeletedNoteId(noteId);
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Note delete sync warning:', err);
    return false;
  }
}

// Fetch PDF document binary payload from server for reading / downloading
export async function fetchNotePdfFromServer(noteId: string): Promise<string | null> {
  if (!noteId) return null;
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(noteId)}/pdf`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.pdfData) {
        noteFileMemoryCache.set(noteId, data.pdfData);
        saveNoteFileBlob(noteId, data.pdfData, data.fileName, data.fileSizeMb).catch(() => {});
        return data.pdfData;
      }
    }
  } catch (err) {
    console.warn('[Sync] Failed to fetch PDF from server:', err);
  }
  return null;
}

// Fetch all purchase orders from the central server
export async function fetchServerOrders(): Promise<PurchaseOrder[]> {
  try {
    const deletedOrderIds = getDeletedOrderIds();
    const res = await fetch('/api/orders', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      return getStoredOrders().filter((o) => !deletedOrderIds.has(o.id) && (!o.orderNumber || !deletedOrderIds.has(o.orderNumber)));
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      const localOrders = getStoredOrders();
      const localMap = new Map(localOrders.map((o) => [o.id, o]));
      const seen = new Set<string>();
      const merged: PurchaseOrder[] = [];

      // Server orders are merged with local updates
      data.forEach((so: PurchaseOrder) => {
        if (!so) return;
        const key = so.id || so.orderNumber;
        if (!key || seen.has(key)) return;
        if (deletedOrderIds.has(so.id) || (so.orderNumber && deletedOrderIds.has(so.orderNumber))) {
          return;
        }
        seen.add(key);

        // Check if local has newer verified or updated state
        const local = localMap.get(so.id);
        if (local && (local.status === 'completed' || local.status === 'rejected') && so.status === 'pending_verification') {
          merged.push(local);
        } else {
          merged.push(so);
        }
      });

      // Preserve any local uncommitted orders
      localOrders.forEach((lo) => {
        if (!lo) return;
        if (deletedOrderIds.has(lo.id) || (lo.orderNumber && deletedOrderIds.has(lo.orderNumber))) {
          return;
        }
        const key = lo.id || lo.orderNumber;
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.unshift(lo);
        }
      });

      saveOrders(merged);
      return merged;
    }
    return getStoredOrders();
  } catch (err) {
    return getStoredOrders();
  }
}

// Post a new order to the server
export async function postServerOrder(order: PurchaseOrder): Promise<PurchaseOrder> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.order) return data.order;
    }
  } catch (err) {
    console.warn('[Sync] Failed to sync order to server:', err);
  }
  return order;
}

// Update order on the server
export async function updateServerOrder(orderId: string, updates: Partial<PurchaseOrder>): Promise<void> {
  try {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('[Sync] Order update sync warning:', err);
  }
}

// Permanently delete order on the server
export async function deleteServerOrder(orderId: string): Promise<boolean> {
  try {
    recordDeletedOrderId(orderId);
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Order delete sync warning:', err);
    return false;
  }
}

// Fetch all withdrawals from the central server
export async function fetchServerWithdrawals(): Promise<WithdrawalRequest[]> {
  try {
    const res = await fetch('/api/withdrawals', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return getStoredWithdrawals();
    const data = await res.json();
    if (Array.isArray(data)) {
      saveWithdrawals(data);
      return data;
    }
    return getStoredWithdrawals();
  } catch {
    return getStoredWithdrawals();
  }
}

// Post a new withdrawal request to the server
export async function postServerWithdrawal(withdrawal: WithdrawalRequest): Promise<void> {
  try {
    await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdrawal),
    });
  } catch (err) {
    console.warn('[Sync] Failed to sync withdrawal:', err);
  }
}

// Update withdrawal status
export async function updateServerWithdrawal(withdrawalId: string, updates: Partial<WithdrawalRequest>): Promise<void> {
  try {
    await fetch(`/api/withdrawals/${encodeURIComponent(withdrawalId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('[Sync] Withdrawal update sync warning:', err);
  }
}

// Permanently delete withdrawal on the server
export async function deleteServerWithdrawal(withdrawalId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/withdrawals/${encodeURIComponent(withdrawalId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Withdrawal delete sync warning:', err);
    return false;
  }
}
