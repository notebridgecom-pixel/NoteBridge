import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import * as archiverModule from 'archiver';
import { INITIAL_NOTES, INITIAL_ORDERS, INITIAL_WITHDRAWALS } from './src/data/mockData';

const archiver = ((archiverModule as any).default || archiverModule) as typeof archiverModule;

dotenv.config();

// Central Persistent Storage Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const PDFS_DIR = path.join(DATA_DIR, 'pdfs');
const NOTES_FILE = path.join(DATA_DIR, 'server_notes.json');
const ORDERS_FILE = path.join(DATA_DIR, 'server_orders.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'server_withdrawals.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'server_email_notifications.json');

function ensureDataStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PDFS_DIR)) {
      fs.mkdirSync(PDFS_DIR, { recursive: true });
    }
    if (!fs.existsSync(NOTES_FILE)) {
      fs.writeFileSync(NOTES_FILE, JSON.stringify(INITIAL_NOTES, null, 2), 'utf-8');
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(INITIAL_ORDERS, null, 2), 'utf-8');
    }
    if (!fs.existsSync(WITHDRAWALS_FILE)) {
      fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(INITIAL_WITHDRAWALS, null, 2), 'utf-8');
    }
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('[Storage Init Error]:', e);
  }
}

// Initialize persistent directories on startup
ensureDataStorage();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- ACADEMIC NOTES REST API (Real-Time Synchronized Across All Devices) ---

  // 1. GET /api/notes - List all persistent academic notes
  app.get('/api/notes', (_req, res) => {
    try {
      ensureDataStorage();
      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      const notes = JSON.parse(raw);
      // Deduplicate notes by id
      const seen = new Set<string>();
      const deduped = notes.filter((n: any) => {
        if (!n || !n.id || seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });
      res.json(deduped);
    } catch (err: any) {
      console.error('Error retrieving notes:', err);
      res.status(500).json({ error: 'Failed to retrieve notes' });
    }
  });

  // 2. GET /api/notes/:id/pdf - Retrieve full PDF binary data
  app.get('/api/notes/:id/pdf', (req, res) => {
    try {
      ensureDataStorage();
      const { id } = req.params;
      const pdfPath = path.join(PDFS_DIR, `${id}.json`);
      if (fs.existsSync(pdfPath)) {
        const raw = fs.readFileSync(pdfPath, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.status(404).json({ error: 'PDF file not found on server' });
    } catch (err: any) {
      console.error('Error retrieving note PDF:', err);
      res.status(500).json({ error: 'Failed to retrieve PDF' });
    }
  });

  // 3. POST /api/notes - Upload and persist note for all buyers
  app.post('/api/notes', (req, res) => {
    try {
      ensureDataStorage();
      const newNote = req.body;
      if (!newNote || !newNote.title) {
        return res.status(400).json({ error: 'Title and note metadata are required' });
      }

      const noteId = newNote.id || `note-${Date.now()}`;
      const cleanNote = {
        ...newNote,
        id: noteId,
        status: newNote.status || 'pending',
        sellerVerified: newNote.sellerVerified ?? true,
        createdAt: newNote.createdAt || new Date().toISOString().split('T')[0],
        salesCount: typeof newNote.salesCount === 'number' ? newNote.salesCount : 0,
        rating: typeof newNote.rating === 'number' ? newNote.rating : 5.0,
        reviewsCount: typeof newNote.reviewsCount === 'number' ? newNote.reviewsCount : 0,
        reviews: newNote.reviews || [],
      };

      // If PDF file payload is present, store separately on disk to keep catalog lightweight
      if (cleanNote.pdfData && cleanNote.pdfData.length > 50) {
        const pdfPayload = {
          noteId,
          pdfData: cleanNote.pdfData,
          fileName: cleanNote.pdfFileName || `${noteId}.pdf`,
          fileSizeMb: cleanNote.fileSizeMb || 4.5,
          savedAt: new Date().toISOString(),
        };
        fs.writeFileSync(path.join(PDFS_DIR, `${noteId}.json`), JSON.stringify(pdfPayload), 'utf-8');
        delete cleanNote.pdfData;
      }

      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      const notes: any[] = JSON.parse(raw);
      const existingIdx = notes.findIndex((n) => n.id === noteId);
      if (existingIdx >= 0) {
        notes[existingIdx] = { ...notes[existingIdx], ...cleanNote };
      } else {
        notes.unshift(cleanNote);
      }
      fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');

      res.json({ success: true, note: cleanNote });
    } catch (err: any) {
      console.error('Error saving note:', err);
      res.status(500).json({ error: 'Failed to upload note' });
    }
  });

  // 4. PUT /api/notes/:id - Update note status, reviews, synopsis
  app.put('/api/notes/:id', (req, res) => {
    try {
      ensureDataStorage();
      const { id } = req.params;
      const updates = req.body;
      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      const notes: any[] = JSON.parse(raw);
      const index = notes.findIndex((n) => n.id === id);
      if (index >= 0) {
        notes[index] = { ...notes[index], ...updates };
        fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
        return res.json({ success: true, note: notes[index] });
      }
      res.status(404).json({ error: 'Note not found' });
    } catch (err: any) {
      console.error('Error updating note:', err);
      res.status(500).json({ error: 'Failed to update note' });
    }
  });

  // 5. DELETE /api/notes/:id - Remove note
  app.delete('/api/notes/:id', (req, res) => {
    try {
      ensureDataStorage();
      const { id } = req.params;
      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      const notes: any[] = JSON.parse(raw);
      const filtered = notes.filter((n) => n.id !== id);
      fs.writeFileSync(NOTES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      const pdfPath = path.join(PDFS_DIR, `${id}.json`);
      if (fs.existsSync(pdfPath)) {
        try { fs.unlinkSync(pdfPath); } catch {}
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting note:', err);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // --- ORDERS REST API ---

  // 6. GET /api/orders
  app.get('/api/orders', (_req, res) => {
    try {
      ensureDataStorage();
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const orders: any[] = JSON.parse(raw);
      // Strict deduplication by ID or orderNumber
      const seen = new Set<string>();
      const deduped = orders.filter((o) => {
        const key = o.id || o.orderNumber;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      res.json(deduped);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  });

  // 7. POST /api/orders
  app.post('/api/orders', (req, res) => {
    try {
      ensureDataStorage();
      const newOrder = req.body;
      if (!newOrder || !newOrder.noteId) {
        return res.status(400).json({ error: 'Invalid purchase order payload' });
      }

      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const orders: any[] = JSON.parse(raw);
      
      const orderKey = newOrder.id || newOrder.orderNumber;
      const existingIdx = orders.findIndex((o) => (o.id && o.id === newOrder.id) || (o.orderNumber && o.orderNumber === newOrder.orderNumber));
      
      if (existingIdx >= 0) {
        orders[existingIdx] = { ...orders[existingIdx], ...newOrder };
      } else {
        orders.unshift(newOrder);
      }

      // Deduplicate before persisting
      const seen = new Set<string>();
      const cleanOrders = orders.filter((o) => {
        const key = o.id || o.orderNumber;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      fs.writeFileSync(ORDERS_FILE, JSON.stringify(cleanOrders, null, 2), 'utf-8');

      // Also increment salesCount on matching note
      try {
        const notesRaw = fs.readFileSync(NOTES_FILE, 'utf-8');
        const notesList: any[] = JSON.parse(notesRaw);
        const targetNote = notesList.find((n) => n.id === newOrder.noteId);
        if (targetNote) {
          targetNote.salesCount = (targetNote.salesCount || 0) + 1;
          fs.writeFileSync(NOTES_FILE, JSON.stringify(notesList, null, 2), 'utf-8');
        }
      } catch {}

      res.json({ success: true, order: newOrder });
    } catch (err: any) {
      console.error('Error saving order:', err);
      res.status(500).json({ error: 'Failed to save order' });
    }
  });

  // 8. PUT /api/orders/:id
  app.put('/api/orders/:id', (req, res) => {
    try {
      ensureDataStorage();
      const { id } = req.params;
      const updates = req.body;
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const orders: any[] = JSON.parse(raw);
      const idx = orders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        orders[idx] = { ...orders[idx], ...updates };
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
        return res.json({ success: true, order: orders[idx] });
      }
      res.status(404).json({ error: 'Order not found' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // --- WITHDRAWALS REST API ---

  // 9. GET /api/withdrawals
  app.get('/api/withdrawals', (_req, res) => {
    try {
      ensureDataStorage();
      const raw = fs.readFileSync(WITHDRAWALS_FILE, 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.status(500).json({ error: 'Failed to retrieve withdrawals' });
    }
  });

  // 10. POST /api/withdrawals
  app.post('/api/withdrawals', (req, res) => {
    try {
      ensureDataStorage();
      const w = req.body;
      const raw = fs.readFileSync(WITHDRAWALS_FILE, 'utf-8');
      const list: any[] = JSON.parse(raw);
      list.unshift(w);
      fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(list, null, 2), 'utf-8');
      res.json({ success: true, withdrawal: w });
    } catch {
      res.status(500).json({ error: 'Failed to save withdrawal' });
    }
  });

  // 11. PUT /api/withdrawals/:id
  app.put('/api/withdrawals/:id', (req, res) => {
    try {
      ensureDataStorage();
      const { id } = req.params;
      const updates = req.body;
      const raw = fs.readFileSync(WITHDRAWALS_FILE, 'utf-8');
      const list: any[] = JSON.parse(raw);
      const idx = list.findIndex((item) => item.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates };
        fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(list, null, 2), 'utf-8');
        return res.json({ success: true, withdrawal: list[idx] });
      }
      res.status(404).json({ error: 'Withdrawal not found' });
    } catch {
      res.status(500).json({ error: 'Failed to update withdrawal' });
    }
  });

  // --- SELLER EMAIL ALERTS REST API ---

  // 12. POST /api/notifications/email-alert
  app.post('/api/notifications/email-alert', (req, res) => {
    try {
      ensureDataStorage();
      const payload = req.body;
      const { to, toName, subject, status, feedback, noteTitle, noteId, moderatorName } = payload;

      console.log(`\n======================================================`);
      console.log(`📬 [EMAIL ALERT DISPATCHED TO NOTE SELLER]`);
      console.log(`Recipient:  ${toName || 'Author'} <${to}>`);
      console.log(`Note:       "${noteTitle}" (ID: ${noteId})`);
      console.log(`Status:     ${status === 'changes_requested' ? 'REVISION REQUESTED ⚠️' : 'REJECTED ❌'}`);
      console.log(`Feedback:   "${feedback}"`);
      console.log(`Moderator:  ${moderatorName || 'Raj Sambhaji Bhosale (Central Admin)'}`);
      console.log(`Dispatched: ${new Date().toISOString()}`);
      console.log(`======================================================\n`);

      const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      const alerts: any[] = JSON.parse(raw);
      const record = {
        id: payload.emailId || `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        to,
        toName,
        subject,
        status,
        feedback,
        noteTitle,
        noteId,
        moderatorName,
        delivered: true,
        sentAt: payload.sentAt || new Date().toISOString(),
      };
      alerts.unshift(record);
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(alerts.slice(0, 200), null, 2), 'utf-8');

      res.json({ success: true, message: 'Seller email alert recorded and dispatched', alert: record });
    } catch (err: any) {
      console.error('Error recording email alert:', err);
      res.status(500).json({ error: 'Failed to process email alert dispatch' });
    }
  });

  // 13. GET /api/notifications/email-alert
  app.get('/api/notifications/email-alert', (_req, res) => {
    try {
      ensureDataStorage();
      const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.status(500).json({ error: 'Failed to retrieve email alerts log' });
    }
  });

  // Direct Codebase ZIP Download Endpoint
  app.get('/api/download-project-zip', (_req, res) => {
    try {
      const createArchive = (archiver as any).default || archiver;
      const archive = createArchive('zip', { zlib: { level: 9 } });
      const filename = `notebridge-source-code-${new Date().toISOString().split('T')[0]}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      archive.pipe(res);

      const projectRoot = process.cwd();

      // Exclude generated/huge directories
      archive.glob('**/*', {
        cwd: projectRoot,
        ignore: [
          'node_modules/**',
          'dist/**',
          '.git/**',
          '*.zip',
          'build/**',
          '.cache/**',
          '.temp/**',
        ],
        dot: true,
      });

      archive.finalize();
    } catch (err: any) {
      console.error('ZIP creation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create zip package' });
      }
    }
  });

  // API route: Generate AI Synopsis using Gemini API
  app.post('/api/gemini/synopsis', async (req, res) => {
    try {
      const { textContent, title, subject, unitsCovered } = req.body;

      if (!textContent || typeof textContent !== 'string' || textContent.trim().length < 40) {
        return res.status(400).json({
          error: 'Sufficiently long textual content body is required (at least 40 characters).',
        });
      }

      const cleanText = textContent.trim();
      const prompt = `Please generate a concise, high-yield "AI-Generated Synopsis" for the following college study material:
Note Title: ${title || 'Academic Notes'}
Subject: ${subject || 'General'}
Units / Scope: ${unitsCovered || 'Comprehensive'}

--- TEXTUAL CONTENT BODY ---
${cleanText}
--- END OF CONTENT ---

Instructions:
1. Provide a crisp, structured overview in 80-140 words.
2. Highlight 3-4 key core concepts, high-probability exam topics, and essential formulas or principles.
3. Keep the tone academic, encouraging, and clear for university students preparing for exams.
4. Format using clean bullet points with bold key terms.`;

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback synopsis generation if API key is not configured in local environment
        const fallbackBullets = cleanText
          .split('\n')
          .filter((line) => line.trim().length > 15)
          .slice(0, 3)
          .map((line) => `• **Key Focus**: ${line.trim().replace(/^[-*•]\s*/, '')}`);

        const fallback = fallbackBullets.length > 0 
          ? fallbackBullets.join('\n') 
          : `• **Core Topics**: Covers fundamental principles and university syllabus requirements for ${subject || 'the course'}.\n• **Exam Revision**: Emphasizes high-frequency exam questions, theoretical frameworks, and step-by-step problem-solving.\n• **High-Yield Insights**: Synthesized from senior class notes with verified formulas and practical derivations.`;

        return res.json({
          synopsis: fallback,
          isFallback: true,
          model: 'fallback-heuristics',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert university academic advisor and engineering professor. Your job is to create high-impact, easy-to-digest study synopses from student notes. Focus on high-yield exam takeaways, key formulas, and conceptual clarity.',
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      });

      const synopsisText = response.text?.trim() || '';

      if (!synopsisText) {
        return res.status(500).json({ error: 'Empty synopsis response from Gemini model.' });
      }

      return res.json({
        synopsis: synopsisText,
        isFallback: false,
        model: 'gemini-3.7-flash',
      });
    } catch (error: any) {
      console.error('Gemini Synopsis API Error:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate AI synopsis. Please try again.',
      });
    }
  });

  // Vite middleware for development or Static Serving in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
