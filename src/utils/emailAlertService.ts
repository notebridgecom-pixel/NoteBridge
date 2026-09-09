import { NoteItem, MockEmail } from '../types';
import { getStoredUsers, getCurrentUser } from './storage';
import { logSecurityEvent } from './securityLogs';

const EMAIL_STORAGE_KEY = 'notebridge_seller_email_alerts_v1';

/**
 * Resolves the note seller's verified email and author name
 */
export function resolveSellerEmail(note: NoteItem): { email: string; name: string } {
  const users = getStoredUsers();
  
  // 1. Look up user by sellerId or exact sellerName
  const seller = users.find(
    (u) =>
      (note.sellerId && u.id.toLowerCase() === note.sellerId.toLowerCase()) ||
      (note.sellerName && u.name.trim().toLowerCase() === note.sellerName.trim().toLowerCase())
  );
  if (seller?.email) {
    return { email: seller.email, name: seller.name };
  }

  // 2. Check current logged-in user
  const currentUser = getCurrentUser();
  if (currentUser && (currentUser.id === note.sellerId || currentUser.name === note.sellerName)) {
    if (currentUser.email) {
      return { email: currentUser.email, name: currentUser.name };
    }
  }

  // 3. Normalized fallback academic address
  const safeName = (note.sellerName || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  return {
    email: `${safeName || 'scholar'}@college.edu`,
    name: note.sellerName || 'Valued Senior Scholar',
  };
}

/**
 * Retrieves all stored mock emails / alerts from localStorage
 */
export function getStoredEmailAlerts(): MockEmail[] {
  try {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new email alert into local storage
 */
export function saveStoredEmailAlert(email: MockEmail): void {
  try {
    const current = getStoredEmailAlerts();
    const updated = [email, ...current.filter((e) => e.id !== email.id)].slice(0, 100);
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save email alert to storage:', e);
  }
}

/**
 * Retrieves email alerts relevant to a specific seller ID, name, or email
 */
export function getEmailAlertsForSeller(sellerIdOrEmail: string): MockEmail[] {
  if (!sellerIdOrEmail) return [];
  const lower = sellerIdOrEmail.toLowerCase();
  return getStoredEmailAlerts().filter(
    (e) =>
      e.toEmail.toLowerCase() === lower ||
      e.toName.toLowerCase() === lower ||
      (e.meta?.noteId && e.meta.noteId.toLowerCase() === lower)
  );
}

/**
 * Marks an email alert as read
 */
export function markEmailAlertRead(emailId: string): void {
  try {
    const alerts = getStoredEmailAlerts().map((a) =>
      a.id === emailId ? { ...a, isRead: true } : a
    );
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
}

export interface TriggerEmailAlertOptions {
  note: NoteItem;
  status: 'rejected' | 'changes_requested';
  adminFeedback: string;
  moderatorName?: string;
  sellerEmailOverride?: string;
}

/**
 * Triggers an email alert notification to the note seller when their note status
 * is updated to 'rejected' or 'changes_requested', including the provided admin feedback.
 */
export async function triggerNoteStatusEmailAlert(
  options: TriggerEmailAlertOptions
): Promise<MockEmail> {
  const { note, status, adminFeedback, moderatorName, sellerEmailOverride } = options;
  const resolved = resolveSellerEmail(note);
  const sellerEmail = sellerEmailOverride || resolved.email;
  const sellerName = resolved.name;

  const isRevision = status === 'changes_requested';
  const timestamp = new Date().toISOString();

  // Email subject line
  const subject = isRevision
    ? `⚠️ [NoteBridge Action Required] Revision Requested for "${note.title}"`
    : `❌ [NoteBridge Moderation Notice] Submission Rejected for "${note.title}"`;

  // Brief preview snippet
  const previewSnippet = isRevision
    ? `Action required: The Academic Council has requested revisions for your note "${note.title}". Moderator Feedback: "${adminFeedback}"`
    : `Your note submission "${note.title}" was not approved by the Academic Council. Reason: "${adminFeedback}"`;

  // High-fidelity HTML email template
  const statusBadgeColor = isRevision ? '#d97706' : '#e11d48';
  const statusBadgeBg = isRevision ? '#fef3c7' : '#ffe4e6';
  const statusBadgeText = isRevision ? 'REVISION REQUESTED' : 'SUBMISSION REJECTED';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a, #4338ca); padding: 24px; color: #ffffff; }
    .header h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 0; font-size: 12px; color: #cbd5e1; }
    .body-content { padding: 28px; }
    .greeting { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .status-banner { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; margin-bottom: 18px; border: 1px solid ${statusBadgeColor}33; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .details-table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .details-table tr:last-child td { border-bottom: none; }
    .details-label { font-weight: 600; color: #64748b; width: 35%; }
    .details-val { font-weight: 700; color: #0f172a; }
    .feedback-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .feedback-box.rejected { background: #fff1f2; border-color: #fecdd3; }
    .feedback-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${statusBadgeColor}; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .feedback-text { font-size: 14px; line-height: 1.6; color: #334155; font-style: italic; background: #ffffff; padding: 12px 14px; border-radius: 8px; border: 1px dashed ${statusBadgeColor}44; }
    .action-guide { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .action-guide h3 { font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
    .action-guide ol { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569; }
    .footer { background: #f8fafc; padding: 18px 28px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NoteBridge Academic Council</h1>
      <p>Official Peer-to-Peer Study Note Verification & Quality Assurance</p>
    </div>
    <div class="body-content">
      <div class="status-banner">${statusBadgeText}</div>
      <div class="greeting">Dear ${sellerName},</div>
      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 18px 0;">
        ${isRevision 
          ? 'Our academic moderation committee has reviewed your recently submitted study material and identified adjustments required before it can be published live to the student marketplace.' 
          : 'Our academic moderation committee has completed verification of your note listing. Unfortunately, this submission does not meet our catalog quality or syllabus policies in its current form.'}
      </p>

      <table class="details-table">
        <tr>
          <td class="details-label">Note Title</td>
          <td class="details-val">${note.title}</td>
        </tr>
        <tr>
          <td class="details-label">Subject & Semester</td>
          <td class="details-val">${note.subject} (Sem ${note.semester})</td>
        </tr>
        <tr>
          <td class="details-label">College / University</td>
          <td class="details-val">${note.collegeName || note.university}</td>
        </tr>
        <tr>
          <td class="details-label">Listing Price</td>
          <td class="details-val">₹${note.price} (Author payout: ₹${(note.price * 0.8).toFixed(1)})</td>
        </tr>
        <tr>
          <td class="details-label">Reviewed By</td>
          <td class="details-val">${moderatorName || 'Raj Sambhaji Bhosale (Central Admin)'}</td>
        </tr>
      </table>

      <div class="feedback-box ${!isRevision ? 'rejected' : ''}">
        <div class="feedback-title">
          <span>● Moderator Feedback & Instructions</span>
        </div>
        <div class="feedback-text">
          "${adminFeedback || (isRevision ? 'Please review syllabus alignment and ensure high-resolution scans.' : 'Listing does not satisfy original handwritten notes policy.')}"
        </div>
      </div>

      <div class="action-guide">
        <h3>Recommended Next Steps</h3>
        ${isRevision ? `
          <ol>
            <li>Review the specific suggestions highlighted by the moderator above.</li>
            <li>Re-scan or replace incomplete pages to improve legibility.</li>
            <li>Visit your <strong>NoteBridge Seller Dashboard</strong> and update your document listing with the corrected PDF.</li>
            <li>Your revised submission will be prioritized in the moderation review queue.</li>
          </ol>
        ` : `
          <ol>
            <li>Ensure that study notes uploaded to NoteBridge are your original handwritten notes or personal problem solutions.</li>
            <li>Direct textbook scans, third-party copyrighted slide decks, or illegible camera photos are strictly prohibited.</li>
            <li>You may submit a fresh document that meets these guidelines anytime from your Seller Dashboard.</li>
            <li>If you believe this decision was made in error, you can contact the Academic Council at support@notebridge.edu.in.</li>
          </ol>
        `}
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">NoteBridge • Vidyalankar Engineering / Polytechnic Student Network</p>
      <p style="margin: 0;">This is an automated academic dispatch sent to verified contributor ${sellerEmail}.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Create email record
  const newEmail: MockEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    toEmail: sellerEmail,
    toName: sellerName,
    recipientRole: 'seller',
    fromEmail: 'moderation@notebridge.edu.in',
    fromName: 'NoteBridge Academic Council',
    subject,
    category: isRevision ? 'changes_requested' : 'rejection',
    previewSnippet,
    htmlContent,
    createdAt: timestamp,
    isRead: false,
    meta: {
      noteId: note.id,
      noteTitle: note.title,
      reason: adminFeedback,
      adminFeedback,
      status,
    },
  };

  // 1. Save to local browser storage
  saveStoredEmailAlert(newEmail);

  // 2. Transmit to backend email notification API
  try {
    fetch('/api/notifications/email-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailId: newEmail.id,
        to: newEmail.toEmail,
        toName: newEmail.toName,
        from: newEmail.fromEmail,
        fromName: newEmail.fromName,
        subject: newEmail.subject,
        noteId: note.id,
        noteTitle: note.title,
        status,
        feedback: adminFeedback,
        previewSnippet,
        html: htmlContent,
        sentAt: timestamp,
        moderatorName: moderatorName || 'Raj Sambhaji Bhosale (Admin)',
      }),
    }).catch((err) => {
      console.warn('Asynchronous server email dispatch notice:', err);
    });
  } catch (e) {
    console.warn('Failed to call /api/notifications/email-alert:', e);
  }

  // 3. Record in security & moderation ledger
  logSecurityEvent({
    action: isRevision ? 'note_changes_requested' : 'note_rejected',
    category: 'note_moderation',
    severity: isRevision ? 'info' : 'warning',
    performedBy: moderatorName || 'Raj Sambhaji Bhosale (Admin)',
    targetType: 'note',
    targetId: note.id,
    targetLabel: `${note.title} (${note.subject})`,
    details: `Automated email alert triggered to seller ${sellerName} <${sellerEmail}> for status '${status}'. Feedback: "${adminFeedback}"`,
    metadata: {
      sellerName,
      sellerEmail,
      noteId: note.id,
      noteTitle: note.title,
      status,
      adminFeedback,
      emailId: newEmail.id,
    },
  });

  return newEmail;
}

/**
 * Convenient alias wrapper to match diverse naming conventions
 */
export const sendNoteStatusEmailAlert = triggerNoteStatusEmailAlert;

/**
 * Evaluates note status and triggers the email alert if the status is 'rejected' or 'changes_requested'
 */
export async function notifySellerOnStatusChange(
  note: NoteItem,
  status: NoteItem['status'],
  feedback?: string,
  moderatorName?: string
): Promise<MockEmail | null> {
  if (status !== 'rejected' && status !== 'changes_requested') {
    return null;
  }

  const effectiveFeedback =
    feedback?.trim() ||
    note.adminFeedback?.trim() ||
    (status === 'rejected'
      ? 'Material does not meet the original handwritten study note guidelines or copyright policy.'
      : 'Please re-upload higher resolution scan or clearly specify covered syllabus units.');

  return triggerNoteStatusEmailAlert({
    note: { ...note, status, adminFeedback: effectiveFeedback },
    status,
    adminFeedback: effectiveFeedback,
    moderatorName,
  });
}
