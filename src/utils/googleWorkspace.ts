import { NoteItem, PurchaseOrder } from '../types';
import { getAccessToken, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  size?: string;
}

export interface ChatSpaceItem {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName: string;
  type?: string;
  spaceType?: string;
  spaceThreadingState?: string;
  description?: string;
}

export interface ChatMessageItem {
  name?: string;
  text: string;
  sender?: {
    displayName?: string;
    avatarUrl?: string;
  };
  createTime?: string;
}

/**
 * Ensures user has an active Google Workspace OAuth access token.
 */
export async function getValidAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google first to access Google Drive and Google Chat.');
  }
  return token;
}

/* =========================================================================
   GOOGLE DRIVE INTEGRATIONS
   ========================================================================= */

/**
 * Saves an academic note and its AI synopsis/study guide directly to Google Drive.
 */
export async function saveNoteToGoogleDrive(
  note: NoteItem,
  options?: { folderName?: string }
): Promise<{ fileId: string; webViewLink?: string; fileName: string }> {
  const token = await getValidAccessToken();

  const fileName = `[NoteBridge] ${note.subject} - ${note.title}.txt`;
  
  // Format clean academic markdown body
  const fileContent = `================================================================================
NOTEBRIDGE ACADEMIC STUDY PACK
================================================================================
Title: ${note.title}
Subject: ${note.subject}
University: ${note.university}
Branch: ${note.branch} | Semester: ${note.semester}
Author / Senior: ${note.sellerName} (${note.sellerCollege})
Rating: ${note.rating} / 5.0 (${note.reviewsCount} reviews)
Total Pages: ${note.totalPages} | Price: ₹${note.price}
Date Saved: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
================================================================================

--- SYLLABUS & UNITS COVERED ---
${note.unitsCovered}

--- AI STUDY SYNOPSIS & HIGH-YIELD EXAM HIGHLIGHTS ---
${note.aiSynopsis || 'Synopsis generated automatically on NoteBridge platform.'}

--- COMPLETE LECTURE NOTES & TEXT CONTENT ---
${note.textContent || 'Full handwritten notes and diagrams available in the clean study PDF.'}

--- SAMPLE SECTIONS & FORMULAS ---
${(note.samplePages || []).map(p => `
[Page ${p.pageNumber}: ${p.title}]
${p.sections.map(s => `• ${s.heading || 'Topic'}:\n  ${s.body}${s.formula ? `\n  Formula: ${s.formula}` : ''}${s.tips ? `\n  Exam Tip: ${s.tips}` : ''}`).join('\n')}
`).join('\n')}

================================================================================
Verified & Provided by NoteBridge (https://notebridge.in)
Protected under academic student peer-sharing license.
================================================================================
`;

  // Multipart upload to Google Drive v3
  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
    description: `Academic study notes for ${note.subject} (${note.university}) saved from NoteBridge.`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    fileContent +
    close_delim;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to save to Google Drive (Status ${response.status})`);
  }

  const result = await response.json();

  // Save backup metadata record to Firestore
  try {
    const backupId = `backup-${Date.now()}`;
    await setDoc(doc(db, 'driveBackups', backupId), {
      id: backupId,
      userId: note.sellerId || 'current-user',
      noteId: note.id,
      noteTitle: note.title,
      driveFileId: result.id,
      driveFileUrl: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Firestore driveBackup sync notice:', e);
  }

  return {
    fileId: result.id,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    fileName: result.name || fileName,
  };
}

/**
 * Lists NoteBridge study files saved in Google Drive.
 */
export async function listGoogleDriveNotes(): Promise<DriveFileItem[]> {
  const token = await getValidAccessToken();

  const query = "name contains 'NoteBridge' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime,size)&orderBy=createdTime desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to list Google Drive files');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Backs up full student purchase library to Google Drive.
 */
export async function backupLibraryToDrive(
  orders: PurchaseOrder[],
  notes: NoteItem[]
): Promise<{ backedUpCount: number; links: { title: string; link: string }[] }> {
  const links: { title: string; link: string }[] = [];

  for (const order of orders) {
    const note = notes.find(n => n.id === order.noteId);
    if (note) {
      const res = await saveNoteToGoogleDrive(note);
      links.push({
        title: note.title,
        link: res.webViewLink || `https://drive.google.com/file/d/${res.fileId}/view`,
      });
    }
  }

  return {
    backedUpCount: links.length,
    links,
  };
}

/* =========================================================================
   GOOGLE CHAT INTEGRATIONS
   ========================================================================= */

/**
 * Lists user's Google Chat Spaces / Study Rooms.
 */
export async function listGoogleChatSpaces(): Promise<ChatSpaceItem[]> {
  const token = await getValidAccessToken();

  const response = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=50', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to fetch Google Chat spaces');
  }

  const data = await response.json();
  return data.spaces || [];
}

/**
 * Creates a new Academic Study Group space in Google Chat.
 */
export async function createGoogleChatStudySpace(
  displayName: string,
  subject?: string
): Promise<ChatSpaceItem> {
  const token = await getValidAccessToken();

  const spacePayload = {
    displayName: displayName.slice(0, 128),
    spaceType: 'SPACE',
    spaceDetails: {
      description: `NoteBridge Academic Study Group for ${subject || 'Course Discussions & Exam Preparation'}.`,
    },
  };

  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(spacePayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create Google Chat space');
  }

  const newSpace: ChatSpaceItem = await response.json();

  // Save reference in Firestore
  try {
    const spaceDocId = newSpace.name.replace('spaces/', '') || `space-${Date.now()}`;
    await setDoc(doc(db, 'studySpaces', spaceDocId), {
      id: spaceDocId,
      spaceName: newSpace.name,
      displayName: newSpace.displayName || displayName,
      subject: subject || 'General Engineering',
      university: 'Mumbai University (MU)',
      createdBy: 'current-user',
      createdByName: 'Student Scholar',
      memberCount: 1,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Firestore study space sync notice:', e);
  }

  return newSpace;
}

/**
 * Posts a formatted study note, AI synopsis, or question to a Google Chat space.
 */
export async function sendGoogleChatMessage(
  spaceName: string, // e.g. "spaces/AAAA..."
  messageText: string,
  attachedNote?: NoteItem
): Promise<ChatMessageItem> {
  const token = await getValidAccessToken();

  let formattedText = messageText;

  if (attachedNote) {
    formattedText = `📚 *[NoteBridge Academic Share]*
*${attachedNote.title}*
*Subject:* ${attachedNote.subject} (${attachedNote.university} - Sem ${attachedNote.semester})
*Author:* ${attachedNote.sellerName} (${attachedNote.sellerCollege})
*Coverage:* ${attachedNote.unitsCovered} | *Rating:* ⭐ ${attachedNote.rating.toFixed(1)}

${attachedNote.aiSynopsis ? `💡 *AI Key Exam Synopsis:*\n${attachedNote.aiSynopsis}\n` : ''}
${messageText ? `💬 *Study Note / Message:*\n${messageText}\n` : ''}
🔗 *Access Note & PDF:* https://notebridge.in/notes/${attachedNote.id}`;
  }

  const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: formattedText,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to send message to Google Chat');
  }

  return await response.json();
}
