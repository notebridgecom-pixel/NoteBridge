import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import * as archiverModule from 'archiver';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { INITIAL_NOTES, INITIAL_ORDERS, INITIAL_WITHDRAWALS } from './src/data/mockData';

const archiver = ((archiverModule as any).default || archiverModule) as typeof archiverModule;

dotenv.config();

// Central Persistent Storage Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const PDFS_DIR = path.join(DATA_DIR, 'pdfs');
const NOTES_FILE = path.join(DATA_DIR, 'server_notes.json');
const ORDERS_FILE = path.join(DATA_DIR, 'server_orders.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'server_withdrawals.json');
const VERIFICATION_TOKENS_FILE = path.join(DATA_DIR, 'server_verification_tokens.json');

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
    if (!fs.existsSync(VERIFICATION_TOKENS_FILE)) {
      fs.writeFileSync(VERIFICATION_TOKENS_FILE, JSON.stringify([], null, 2), 'utf-8');
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

  // --- EMAIL OTP DISPATCH SERVICE (Nodemailer / SMTP) ---
  const OFFICIAL_SENDER = 'notebridge.com@gmail.com';

  async function sendOtpEmailToRecipient({
    toEmail,
    code,
    purposeLabel = 'Student Email Verification',
    userName = 'Student',
  }: {
    toEmail: string;
    code: string;
    purposeLabel?: string;
    userName?: string;
  }) {
    let rawSmtpHost = (process.env.SMTP_HOST || '').trim();
    let rawSmtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || '').trim();
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    // Detect if rawSmtpHost is mistakenly set to an email address (e.g., notebridge.com@gmail.com)
    let smtpHost = 'smtp.gmail.com';
    let smtpUser = OFFICIAL_SENDER;

    if (rawSmtpHost.includes('@')) {
      // User entered an email in the SMTP_HOST variable
      if (!rawSmtpUser) {
        rawSmtpUser = rawSmtpHost;
      }
      if (rawSmtpHost.toLowerCase().includes('gmail.com')) {
        smtpHost = 'smtp.gmail.com';
      } else if (rawSmtpHost.toLowerCase().includes('outlook.com') || rawSmtpHost.toLowerCase().includes('hotmail.com')) {
        smtpHost = 'smtp-mail.outlook.com';
      } else if (rawSmtpHost.toLowerCase().includes('yahoo.com')) {
        smtpHost = 'smtp.mail.yahoo.com';
      } else {
        const domain = rawSmtpHost.split('@')[1];
        smtpHost = domain ? `smtp.${domain}` : 'smtp.gmail.com';
      }
    } else if (rawSmtpHost.length > 0) {
      smtpHost = rawSmtpHost;
    }

    if (rawSmtpUser.length > 0) {
      smtpUser = rawSmtpUser;
    }

    const emailSubject = `[NoteBridge] ${code} is your Verification Code`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 28px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 12px; margin-bottom: 12px;">
              <span style="color: #93c5fd; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">NoteBridge Security</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Student Verification Code</h1>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px;">
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
              Hello <strong>${userName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              We received a request for <strong>${purposeLabel}</strong> associated with your email address (<code>${toEmail}</code>). Use the 6-digit verification code below to proceed:
            </p>

            <!-- OTP Highlight Card -->
            <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">
                Your 6-Digit One-Time Password
              </div>
              <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 8px 0;">
                ${code}
              </div>
              <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 6px;">
                ⏰ Valid for 10 minutes
              </div>
            </div>

            <!-- Security Advisory -->
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #92400e; margin: 0; line-height: 1.5;">
                🛡️ <strong>Security Reminder:</strong> Never share this verification code with anyone. NoteBridge administrators or faculty will never ask for your OTP.
              </p>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
              If you did not initiate this request, please ignore this email or update your password immediately.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 4px 0;">
              Sent by <strong>NoteBridge Academic Hub</strong> • Official Student Verification
            </p>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0; font-family: monospace;">
              ${OFFICIAL_SENDER}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`\n======================================================`);
    console.log(`[NoteBridge Email OTP Dispatcher]`);
    console.log(`Recipient: ${toEmail}`);
    console.log(`Purpose:   ${purposeLabel}`);
    console.log(`OTP Code:  ${code}`);
    console.log(`Sender:    ${smtpUser}`);
    console.log(`======================================================\n`);

    if (smtpPass && smtpPass.length > 0) {
      try {
        const isGmail = smtpHost.includes('gmail.com') || smtpUser.toLowerCase().includes('@gmail.com');
        const transporterConfig: any = isGmail
          ? {
              service: 'gmail',
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpSecure,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
              connectionTimeout: 8000,
              greetingTimeout: 8000,
              socketTimeout: 10000,
            };

        const transporter = nodemailer.createTransport(transporterConfig);

        const info = await transporter.sendMail({
          from: `"NoteBridge Security" <${smtpUser}>`,
          to: toEmail,
          subject: emailSubject,
          text: `Your NoteBridge verification code is: ${code}. It expires in 10 minutes. Do not share it with anyone.`,
          html: htmlBody,
        });

        console.log(`[NoteBridge SMTP SUCCESS] Delivered OTP email to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId, deliveredViaSmtp: true };
      } catch (smtpErr: any) {
        console.warn(`[NoteBridge SMTP Notice] Live email transmission to ${toEmail} encountered:`, smtpErr?.message || smtpErr);
        return { success: true, deliveredViaSmtp: false, error: smtpErr?.message };
      }
    } else {
      console.log(`[NoteBridge SMTP Notice] SMTP_PASS / GMAIL_APP_PASSWORD is not set in environment. Dispatched email event logged to server console.`);
      return { success: true, deliveredViaSmtp: false, notice: 'Logged to server console. Provide SMTP_PASS for live SMTP transmission.' };
    }
  }

  // --- EMAIL VERIFICATION TOKEN HELPERS & ENDPOINTS ---
  interface VerificationTokenRecord {
    token: string;
    code: string;
    email: string;
    userName: string;
    createdAt: number;
    expiresAt: number;
    used: boolean;
    invalidated?: boolean;
    verifiedAt?: string;
  }

  function loadVerificationTokens(): VerificationTokenRecord[] {
    try {
      ensureDataStorage();
      if (!fs.existsSync(VERIFICATION_TOKENS_FILE)) return [];
      const raw = fs.readFileSync(VERIFICATION_TOKENS_FILE, 'utf-8');
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  function saveVerificationTokens(tokens: VerificationTokenRecord[]): void {
    try {
      ensureDataStorage();
      fs.writeFileSync(VERIFICATION_TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save verification tokens:', e);
    }
  }

  async function sendVerificationEmailToRecipient({
    toEmail,
    userName,
    token,
    code,
    appBaseUrl,
  }: {
    toEmail: string;
    userName: string;
    token: string;
    code: string;
    appBaseUrl?: string;
  }) {
    const rawSmtpHost = (process.env.SMTP_HOST || '').trim();
    let rawSmtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || '').trim();
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    let smtpHost = 'smtp.gmail.com';
    let smtpUser = OFFICIAL_SENDER;

    if (rawSmtpHost.includes('@')) {
      if (!rawSmtpUser) rawSmtpUser = rawSmtpHost;
      if (rawSmtpHost.toLowerCase().includes('gmail.com')) smtpHost = 'smtp.gmail.com';
    } else if (rawSmtpHost) {
      smtpHost = rawSmtpHost;
    }
    if (rawSmtpUser) smtpUser = rawSmtpUser;

    const origin = (appBaseUrl || process.env.APP_URL || 'https://ais-dev-yakejmoqsaffm6n6zlrmyg-326917652536.asia-east1.run.app').replace(/\/$/, '');
    const verificationUrl = `${origin}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(toEmail)}`;

    const emailSubject = `Verify your email address for NoteBridge (${code})`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px -5px rgba(0,0,0,0.06);">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 28px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); padding: 8px 18px; border-radius: 999px; margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.25);">
              <span style="color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">NoteBridge Academic Network</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Verify Your Email Address</h1>
            <p style="color: #bfdbfe; font-size: 14px; margin: 8px 0 0 0;">Complete registration to unlock notes, study materials & seller tools</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 36px 28px;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-top: 0;">
              Hello <strong>${userName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Thank you for registering on <strong>NoteBridge</strong>. To verify that this email address belongs to you and protect your student account, please click the button below:
            </p>

            <!-- Primary CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 4px 14px 0 rgba(37,99,235,0.39); letter-spacing: 0.2px;">
                ✓ Verify Email Address
              </a>
            </div>

            <!-- Alternative 6-Digit Code Box -->
            <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 22px; text-align: center; margin: 28px 0;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 6px;">
                Or Enter This 6-Digit Verification Code
              </div>
              <div style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 8px 0;">
                ${code}
              </div>
              <div style="font-size: 12px; color: #64748b;">
                Enter this code on the verification screen in NoteBridge
              </div>
            </div>

            <!-- Expiration & Validity Note -->
            <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
              <p style="font-size: 13px; color: #1e40af; margin: 0; line-height: 1.5;">
                ⏳ <strong>Link Expiration:</strong> This secure verification link is valid for <strong>24 hours</strong>. If the link expires, you can request a new one from the app.
              </p>
            </div>

            <!-- Direct Link Fallback -->
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
              If the button above does not work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 11px; word-break: break-all; color: #2563eb; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 0;">
              <a href="${verificationUrl}" style="color: #2563eb; text-decoration: underline;">${verificationUrl}</a>
            </p>

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px; margin-bottom: 0;">
              If you did not create a NoteBridge account with this email address, you can safely ignore this message. No account will be activated without verification.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 4px 0;">
              Sent by <strong>NoteBridge Academic Hub</strong> • Verified Student Community
            </p>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0; font-family: monospace;">
              ${OFFICIAL_SENDER}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`\n======================================================`);
    console.log(`[NoteBridge Email Verification Dispatcher]`);
    console.log(`Recipient:       ${toEmail}`);
    console.log(`User Name:       ${userName}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log(`OTP Code:        ${code}`);
    console.log(`Token:           ${token.slice(0, 16)}...`);
    console.log(`======================================================\n`);

    if (smtpPass && smtpPass.length > 0) {
      try {
        const isGmail = smtpHost.includes('gmail.com') || smtpUser.toLowerCase().includes('@gmail.com');
        const transporterConfig: any = isGmail
          ? {
              service: 'gmail',
              auth: { user: smtpUser, pass: smtpPass },
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpSecure,
              auth: { user: smtpUser, pass: smtpPass },
              connectionTimeout: 8000,
              greetingTimeout: 8000,
              socketTimeout: 10000,
            };

        const transporter = nodemailer.createTransport(transporterConfig);
        const info = await transporter.sendMail({
          from: `"NoteBridge Verification" <${smtpUser}>`,
          to: toEmail,
          subject: emailSubject,
          text: `Hello ${userName},\n\nPlease verify your email for NoteBridge by opening:\n${verificationUrl}\n\nOr enter verification code: ${code}\n\nThis link is valid for 24 hours.`,
          html: htmlBody,
        });

        console.log(`[NoteBridge SMTP SUCCESS] Delivered Verification email to ${toEmail}. ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId, deliveredViaSmtp: true };
      } catch (smtpErr: any) {
        console.warn(`[NoteBridge SMTP Notice] Live email to ${toEmail} encountered:`, smtpErr?.message || smtpErr);
        return { success: true, deliveredViaSmtp: false, error: smtpErr?.message };
      }
    } else {
      console.log(`[NoteBridge SMTP Notice] SMTP_PASS not set. Verification link & code logged to console for testing.`);
      return { success: true, deliveredViaSmtp: false, notice: 'Logged to server console.' };
    }
  }

  // 1. POST /api/auth/send-verification-email - Generate token & send verification email
  app.post('/api/auth/send-verification-email', async (req, res) => {
    try {
      const { email, userName, appBaseUrl } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const allTokens = loadVerificationTokens();
      const now = Date.now();

      // Rate limiting: 60-second cooldown
      const recentTokens = allTokens.filter(
        (t) => t.email.toLowerCase() === normalizedEmail && now - t.createdAt < 60 * 1000
      );
      if (recentTokens.length > 0) {
        const latest = recentTokens[recentTokens.length - 1];
        const remainingSeconds = Math.ceil((60 * 1000 - (now - latest.createdAt)) / 1000);
        return res.status(429).json({
          error: `Please wait ${remainingSeconds} seconds before requesting another verification email.`,
          cooldownSeconds: remainingSeconds,
        });
      }

      // Invalidate previous unverified tokens for this email
      const updatedTokens = allTokens.map((t) => {
        if (t.email.toLowerCase() === normalizedEmail && !t.used) {
          return { ...t, used: true, invalidated: true };
        }
        return t;
      });

      // Generate cryptographically secure 64-character token + 6-digit numeric code
      const token = crypto.randomBytes(32).toString('hex');
      const minOtp = 100000;
      const maxOtp = 999999;
      const code = Math.floor(minOtp + Math.random() * (maxOtp - minOtp + 1)).toString();

      const newRecord: VerificationTokenRecord = {
        token,
        code,
        email: normalizedEmail,
        userName: userName || 'Student',
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
        used: false,
      };

      updatedTokens.push(newRecord);
      saveVerificationTokens(updatedTokens);

      // Send the email
      const emailResult = await sendVerificationEmailToRecipient({
        toEmail: normalizedEmail,
        userName: userName || 'Student',
        token,
        code,
        appBaseUrl,
      });

      return res.json({
        success: true,
        message: `Verification email sent to ${normalizedEmail}. Please check your inbox and spam folder.`,
        token, // For direct validation / testing
        cooldownSeconds: 60,
        expiresAt: newRecord.expiresAt,
        details: emailResult,
      });
    } catch (err: any) {
      console.error('Error in /api/auth/send-verification-email:', err);
      return res.status(500).json({ error: 'Failed to process verification email dispatch.' });
    }
  });

  // 2. POST /api/auth/verify-token - Validate verification token or 6-digit code
  app.post('/api/auth/verify-token', (req, res) => {
    try {
      const { token, code, email } = req.body;
      const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
      const trimmedToken = token ? String(token).trim() : '';
      const trimmedCode = code ? String(code).trim() : '';

      if (!trimmedToken && !trimmedCode) {
        return res.status(400).json({ error: 'Verification token or 6-digit code is required.' });
      }

      const allTokens = loadVerificationTokens();
      const now = Date.now();

      // Find token record
      const tokenIndex = allTokens.findIndex((t) => {
        if (trimmedToken && t.token === trimmedToken) {
          if (normalizedEmail && t.email.toLowerCase() !== normalizedEmail) return false;
          return true;
        }
        if (trimmedCode && t.code === trimmedCode) {
          if (normalizedEmail && t.email.toLowerCase() !== normalizedEmail) return false;
          return true;
        }
        return false;
      });

      if (tokenIndex === -1) {
        return res.status(400).json({
          error: 'Invalid or unrecognized verification token/code. Please request a new verification email.',
        });
      }

      const record = allTokens[tokenIndex];

      if (record.used) {
        return res.json({
          success: true,
          message: 'Email address has already been verified.',
          email: record.email,
          alreadyVerified: true,
        });
      }

      if (now > record.expiresAt) {
        return res.status(400).json({
          error: 'This verification link or code has expired (24-hour limit). Please request a fresh verification email.',
          expired: true,
        });
      }

      // Mark token as used & verified
      allTokens[tokenIndex].used = true;
      allTokens[tokenIndex].verifiedAt = new Date().toISOString();
      saveVerificationTokens(allTokens);

      return res.json({
        success: true,
        message: 'Email verified successfully! You now have full access to NoteBridge.',
        email: record.email,
        verifiedAt: allTokens[tokenIndex].verifiedAt,
      });
    } catch (err: any) {
      console.error('Error in /api/auth/verify-token:', err);
      return res.status(500).json({ error: 'Failed to verify token.' });
    }
  });

  // 3. POST /api/auth/resend-verification - Resend verification link & code
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email, userName, appBaseUrl } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const allTokens = loadVerificationTokens();
      const now = Date.now();

      // Rate limit check: 60 seconds
      const recent = allTokens.filter(
        (t) => t.email.toLowerCase() === normalizedEmail && now - t.createdAt < 60 * 1000
      );
      if (recent.length > 0) {
        const latest = recent[recent.length - 1];
        const remaining = Math.ceil((60 * 1000 - (now - latest.createdAt)) / 1000);
        return res.status(429).json({
          error: `Please wait ${remaining}s before resending.`,
          cooldownSeconds: remaining,
        });
      }

      // Invalidate old tokens
      const updated = allTokens.map((t) => {
        if (t.email.toLowerCase() === normalizedEmail && !t.used) {
          return { ...t, used: true, invalidated: true };
        }
        return t;
      });

      const token = crypto.randomBytes(32).toString('hex');
      const minOtp = 100000;
      const maxOtp = 999999;
      const code = Math.floor(minOtp + Math.random() * (maxOtp - minOtp + 1)).toString();

      const newRecord: VerificationTokenRecord = {
        token,
        code,
        email: normalizedEmail,
        userName: userName || 'Student',
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
        used: false,
      };

      updated.push(newRecord);
      saveVerificationTokens(updated);

      const emailResult = await sendVerificationEmailToRecipient({
        toEmail: normalizedEmail,
        userName: userName || 'Student',
        token,
        code,
        appBaseUrl,
      });

      return res.json({
        success: true,
        message: `New verification link and code sent to ${normalizedEmail}.`,
        token,
        cooldownSeconds: 60,
        expiresAt: newRecord.expiresAt,
        details: emailResult,
      });
    } catch (err: any) {
      console.error('Error in /api/auth/resend-verification:', err);
      return res.status(500).json({ error: 'Failed to resend verification email.' });
    }
  });

  // 4. GET /api/auth/check-status - Check if an email is verified on server
  app.get('/api/auth/check-status', (req, res) => {
    try {
      const email = String(req.query.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Email parameter required.' });
      }

      const allTokens = loadVerificationTokens();
      const verifiedToken = allTokens.find((t) => t.email.toLowerCase() === email && t.used && !t.invalidated);

      res.json({
        email,
        isVerified: Boolean(verifiedToken),
        verifiedAt: verifiedToken?.verifiedAt || null,
      });
    } catch (err: any) {
      console.error('Error in /api/auth/check-status:', err);
      res.status(500).json({ error: 'Failed to check verification status.' });
    }
  });

  // POST /api/otp/send-email - Dispatch OTP email to student
  app.post('/api/otp/send-email', async (req, res) => {
    try {
      const { email, code, purpose, purposeLabel, userName } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: 'Email and OTP code are required.' });
      }

      const result = await sendOtpEmailToRecipient({
        toEmail: email.trim().toLowerCase(),
        code: String(code).trim(),
        purposeLabel: purposeLabel || 'Student Verification',
        userName: userName || 'Student',
      });

      return res.json({
        success: true,
        message: `Verification code sent to ${email}.`,
        details: result,
      });
    } catch (err: any) {
      console.error('Error in /api/otp/send-email:', err);
      return res.status(500).json({ error: 'Failed to process email dispatch' });
    }
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
        status: newNote.status || 'approved',
        sellerVerified: newNote.sellerVerified ?? true,
        createdAt: newNote.createdAt || new Date().toISOString().split('T')[0],
        salesCount: typeof newNote.salesCount === 'number' ? newNote.salesCount : 0,
        rating: typeof newNote.rating === 'number' ? newNote.rating : 0,
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

  // 9. DELETE /api/orders/:id - Permanently remove order record
  app.delete('/api/orders/:id', (req, res) => {
    try {
      ensureDataStorage();
      const { id } = req.params;
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const orders: any[] = JSON.parse(raw);
      const filtered = orders.filter((o) => o.id !== id && o.orderNumber !== id);
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      res.json({ success: true, message: `Order ${id} deleted` });
    } catch (err: any) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  // --- WITHDRAWALS REST API ---

  // 10. GET /api/withdrawals
  app.get('/api/withdrawals', (_req, res) => {
    try {
      ensureDataStorage();
      const raw = fs.readFileSync(WITHDRAWALS_FILE, 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.status(500).json({ error: 'Failed to retrieve withdrawals' });
    }
  });

  // 11. POST /api/withdrawals
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

  // 12. PUT /api/withdrawals/:id
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

  // 13. DELETE /api/withdrawals/:id
  app.delete('/api/withdrawals/:id', (req, res) => {
    try {
      ensureDataStorage();
      const { id } = req.params;
      const raw = fs.readFileSync(WITHDRAWALS_FILE, 'utf-8');
      const list: any[] = JSON.parse(raw);
      const filtered = list.filter((item) => item.id !== id);
      fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      res.json({ success: true, message: `Withdrawal ${id} deleted` });
    } catch {
      res.status(500).json({ error: 'Failed to delete withdrawal' });
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

  // --- RESILIENT GEMINI GENERATOR UTILITY ---
  interface ResilientGeminiOptions {
    candidateModels?: string[];
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    maxOutputTokens?: number;
    retriesPerModel?: number;
  }

  async function generateContentWithResilience(
    ai: GoogleGenAI,
    contents: any,
    options: ResilientGeminiOptions = {}
  ): Promise<{ text: string; model: string } | null> {
    const candidateModels = options.candidateModels || [
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ];
    const retriesPerModel = options.retriesPerModel ?? 1;

    for (const model of candidateModels) {
      for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
        try {
          const config: any = {};
          if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
          if (options.temperature !== undefined) config.temperature = options.temperature;
          if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
          if (options.maxOutputTokens) config.maxOutputTokens = options.maxOutputTokens;

          const response = await ai.models.generateContent({
            model,
            contents,
            config: Object.keys(config).length > 0 ? config : undefined,
          });

          const textResult = response.text?.trim();
          if (textResult && textResult.length > 0) {
            return { text: textResult, model };
          }
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          const isDemandSpikeOrRateLimit =
            err?.status === 'UNAVAILABLE' ||
            err?.status === 503 ||
            err?.code === 503 ||
            err?.status === 'RESOURCE_EXHAUSTED' ||
            err?.status === 429 ||
            err?.code === 429 ||
            errMsg.includes('503') ||
            errMsg.includes('demand') ||
            errMsg.includes('overloaded');

          console.warn(
            `[Gemini Resilience] Model ${model} (attempt ${attempt + 1}/${retriesPerModel + 1}) encountered: ${errMsg.slice(0, 140)}`
          );

          if (attempt < retriesPerModel && isDemandSpikeOrRateLimit) {
            // Brief backoff before re-attempting
            await new Promise((resolve) => setTimeout(resolve, 650));
          } else {
            // Move to next candidate model
            break;
          }
        }
      }
    }

    return null;
  }

  // API route: Generate AI Synopsis using Gemini API
  app.post('/api/gemini/synopsis', async (req, res) => {
    const { textContent, title, subject, unitsCovered } = req.body;

    if (!textContent || typeof textContent !== 'string' || textContent.trim().length < 40) {
      return res.status(400).json({
        error: 'Sufficiently long textual content body is required (at least 40 characters).',
      });
    }

    const cleanText = textContent.trim();

    // High-yield fallback heuristic generator
    const generateFallbackSynopsis = () => {
      const fallbackBullets = cleanText
        .split('\n')
        .filter((line) => line.trim().length > 15)
        .slice(0, 3)
        .map((line) => `• **Key Focus**: ${line.trim().replace(/^[-*•]\s*/, '')}`);

      const fallback =
        fallbackBullets.length > 0
          ? fallbackBullets.join('\n')
          : `• **Core Topics**: Covers fundamental principles and university syllabus requirements for ${subject || 'the course'}.\n• **Exam Revision**: Emphasizes high-frequency exam questions, theoretical frameworks, and step-by-step problem-solving.\n• **High-Yield Insights**: Synthesized from senior class notes with verified formulas and practical derivations.`;

      return {
        synopsis: fallback,
        isFallback: true,
        model: 'fallback-heuristics',
      };
    };

    try {
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
        return res.json(generateFallbackSynopsis());
      }

      const result = await generateContentWithResilience(ai, prompt, {
        candidateModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
        systemInstruction:
          'You are an expert university academic advisor and engineering professor. Your job is to create high-impact, easy-to-digest study synopses from student notes. Focus on high-yield exam takeaways, key formulas, and conceptual clarity.',
        temperature: 0.3,
        maxOutputTokens: 500,
        retriesPerModel: 1,
      });

      if (!result || !result.text) {
        return res.json(generateFallbackSynopsis());
      }

      return res.json({
        synopsis: result.text,
        isFallback: false,
        model: result.model,
      });
    } catch (error: any) {
      console.error('Gemini Synopsis API Error (recovering with fallback):', error);
      return res.json(generateFallbackSynopsis());
    }
  });

  // API route: Comprehensive Document Summarizer for uploaded files / pasted notes / marketplace notes
  app.post('/api/gemini/summarize-document', async (req, res) => {
    const {
      textContent = '',
      fileBase64,
      mimeType = 'image/jpeg',
      title = 'Academic Document',
      subject = 'General Studies',
      university = 'Indian University Syllabus',
      semester,
      mode = 'comprehensive',
    } = req.body;

    const hasText = typeof textContent === 'string' && textContent.trim().length >= 20;
    const hasFile = typeof fileBase64 === 'string' && fileBase64.length > 50;

    if (!hasText && !hasFile) {
      return res.status(400).json({
        error: 'Please provide at least 20 characters of document text or upload a valid document/image file.',
      });
    }

    // Fallback heuristics generator if Gemini API is overloaded or offline
    const generateFallbackSummary = () => {
      const cleanLines = (textContent || '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 10);

      const topics = cleanLines.slice(0, 4).map((line, idx) => ({
        topic: `Key Concept ${idx + 1}: ${line.slice(0, 45).replace(/^[-*#•\d.]+\s*/, '')}`,
        description: line,
        keyPoints: [
          `Understanding the fundamentals of ${line.slice(0, 30)}`,
          'High exam frequency with direct derivation and theoretical definitions',
          'Essential for both mid-semester tests and end-semester university evaluation',
        ],
      }));

      return {
        id: `summary-${Date.now()}`,
        title: title || 'Academic Study Summary',
        subject: subject || 'Course Subject',
        university: university || 'University Syllabus',
        semester: semester || 'Current Sem',
        mode: mode || 'comprehensive',
        executiveSummary: `This high-yield revision pack synthesizes the core syllabus components of "${title || subject}". It highlights critical definitions, numerical derivations, and 10-mark university exam questions designed for rapid comprehension.`,
        coreConcepts: topics.length > 0 ? topics : [
          {
            topic: 'Core Theoretical Foundations',
            description: `Foundational principles and operational methodologies covering ${subject || 'the course material'}.`,
            keyPoints: [
              'Primary definitions, assumptions, and governing equations',
              'Step-by-step problem-solving strategy for university exams',
              'Key distinction points often tested in 5-mark short notes',
            ],
          },
          {
            topic: 'Formulas, Derivations & Diagrams',
            description: 'Essential mathematical formulas, circuit/block diagrams, and analytical models.',
            keyPoints: [
              'State all governing equations with standard notations',
              'Draw labeled diagrams to score full presentation marks',
              'Verify boundary conditions and dimensional consistency',
            ],
          },
        ],
        highYieldFormulasAndTheorems: [
          {
            name: 'Core Governing Theorem / Formula',
            formulaOrStatement: 'Primary Principle: System Response = f(Inputs, Parameters)',
            explanation: 'Fundamental relationship used across standard numerical problems in this module.',
          },
          {
            name: 'Efficiency & Boundary Condition',
            formulaOrStatement: 'η = Output / Input × 100% | Under standard operational limits',
            explanation: 'Frequently tested in university numerical problems and viva questions.',
          },
        ],
        examProbableQuestions: [
          {
            question: `Explain the fundamental working principle and derivations for ${title || subject}.`,
            marks: 10,
            answerBulletPoints: [
              'Define the core law/principle with neat schematic diagrams',
              'State all assumptions clearly before beginning mathematical derivation',
              'Conclude with physical significance and industrial applications',
            ],
          },
          {
            question: `Differentiate between primary concepts and write short notes on ${subject} applications.`,
            marks: 5,
            answerBulletPoints: [
              'Create a tabular comparison with at least 4 distinct technical parameters',
              'Include relevant real-world use cases or experimental setups',
            ],
          },
        ],
        keyTakeaways: [
          'Revise all core definitions 24 hours prior to the examination.',
          'Memorize standard diagrams and label all terminal axes.',
          'Practice past 3 years university question papers (PYQs) for high-weightage topics.',
          'Focus on step-by-step presentation to maximize step-marking in semester evaluation.',
        ],
        quiz: [
          {
            id: 'q1',
            question: `What is the primary objective of studying ${title || subject}?`,
            options: [
              'Mastering core syllabus concepts and exam-oriented problem-solving',
              'Memorizing without understanding physical principles',
              'Skipping numerical derivations',
              'Only reviewing previous year question headings',
            ],
            correctAnswerIndex: 0,
            explanation: 'Deep conceptual understanding paired with targeted problem-solving yields maximum scores in university exams.',
          },
          {
            id: 'q2',
            question: 'Which presentation technique secures maximum marks in engineering & university theory exams?',
            options: [
              'Writing long unformatted paragraphs',
              'Drawing neat labeled diagrams, stating formulas clearly, and writing bulleted points',
              'Omitting units in numerical answers',
              'Avoiding step-by-step mathematical derivations',
            ],
            correctAnswerIndex: 1,
            explanation: 'Examiners award maximum marks for clear structure, labeled diagrams, and explicit final answers with units.',
          },
        ],
        generatedAt: new Date().toISOString(),
        sourceType: 'uploaded_doc',
        sourceFileName: title,
        wordCount: (textContent || '').split(/\s+/).length,
        model: 'fallback-heuristics',
        isFallback: true,
      };
    };

    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json(generateFallbackSummary());
      }

      // Prepare prompt & contents
      let promptText = `You are a top-tier Indian university academic professor and exam strategist.
Analyze the provided academic document / notes and generate a comprehensive, structured study summary tailored for college students preparing for semester exams and competitive technical tests.

--- DOCUMENT METADATA ---
Title: ${title || 'Academic Notes / Document'}
Subject: ${subject || 'Course Subject'}
University: ${university || 'Indian University'}
Semester: ${semester || 'Not specified'}
Study Mode Focus: ${mode}
--- END METADATA ---

`;

      if (hasText) {
        promptText += `\n--- DOCUMENT TEXT CONTENT ---\n${textContent.slice(0, 30000)}\n--- END DOCUMENT TEXT ---\n`;
      }

      promptText += `
Please generate the response STRICTLY as valid JSON adhering to this structure:
{
  "title": "Clear descriptive title of the summary",
  "subject": "${subject || 'Course Subject'}",
  "university": "${university || 'University'}",
  "executiveSummary": "2-3 sentence crystal-clear TL;DR of what this document covers and why it matters for exams",
  "coreConcepts": [
    {
      "topic": "Topic / Chapter Heading",
      "description": "Crisp 2-sentence explanation of the concept",
      "keyPoints": ["Bullet point 1 with bold terms", "Bullet point 2 with key insights", "Bullet point 3"]
    }
  ],
  "highYieldFormulasAndTheorems": [
    {
      "name": "Name of Theorem / Formula / Principle",
      "formulaOrStatement": "Mathematical notation or definitive law",
      "explanation": "When to apply it and common mistakes to avoid"
    }
  ],
  "examProbableQuestions": [
    {
      "question": "Realistic 5 or 10-mark University Exam Question",
      "marks": 10,
      "answerBulletPoints": ["Step 1 / Key definition", "Derivation / Diagram requirement", "Final conclusion / application"]
    }
  ],
  "keyTakeaways": [
    "Quick 1-sentence revision bullet 1",
    "Quick 1-sentence revision bullet 2",
    "Quick 1-sentence revision bullet 3",
    "Quick 1-sentence revision bullet 4"
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "Conceptual multiple-choice question testing understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Clear explanation of why this answer is correct"
    },
    {
      "id": "q2",
      "question": "Second practice question testing a formula or definition",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 1,
      "explanation": "Clear explanation"
    },
    {
      "id": "q3",
      "question": "Third practice question testing an application or distinction",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 2,
      "explanation": "Clear explanation"
    }
  ]
}`;

      // Build contents payload
      let contentsPayload: any;

      if (hasFile) {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
        contentsPayload = {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            { text: promptText },
          ],
        };
      } else {
        contentsPayload = promptText;
      }

      const result = await generateContentWithResilience(ai, contentsPayload, {
        candidateModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
        systemInstruction:
          'You are an expert university academic advisor, engineering professor, and syllabus examiner. Your goal is to create the ultimate high-yield, structured study summaries, cheat sheets, formulas breakdowns, and exam practice quizzes from academic notes and documents. Always return valid, well-structured JSON.',
        responseMimeType: 'application/json',
        temperature: 0.2,
        retriesPerModel: 1,
      });

      if (!result || !result.text) {
        return res.json(generateFallbackSummary());
      }

      try {
        const parsed = JSON.parse(result.text);
        const structuredResult: any = {
          id: `summary-${Date.now()}`,
          title: parsed.title || title || 'AI Document Summary',
          subject: parsed.subject || subject || 'Academic Notes',
          university: parsed.university || university,
          semester: semester || 'Semester Exam',
          mode: mode || 'comprehensive',
          executiveSummary: parsed.executiveSummary || 'Comprehensive academic summary generated from document content.',
          coreConcepts: Array.isArray(parsed.coreConcepts) ? parsed.coreConcepts : [],
          highYieldFormulasAndTheorems: Array.isArray(parsed.highYieldFormulasAndTheorems) ? parsed.highYieldFormulasAndTheorems : [],
          examProbableQuestions: Array.isArray(parsed.examProbableQuestions) ? parsed.examProbableQuestions : [],
          keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
          quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
          generatedAt: new Date().toISOString(),
          sourceType: hasFile ? 'uploaded_doc' : 'pasted_notes',
          sourceFileName: title,
          wordCount: (textContent || '').split(/\s+/).length,
          model: result.model,
          isFallback: false,
        };

        return res.json(structuredResult);
      } catch (parseErr) {
        console.warn('JSON parsing error on Gemini summary response:', parseErr);
        return res.json(generateFallbackSummary());
      }
    } catch (err: any) {
      console.error('Document Summarizer Server Error, generating resilience fallback:', err);
      return res.json(generateFallbackSummary());
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
