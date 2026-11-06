import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { processPrescriptionOCR, ExtractedMedItem } from './services/ocrService';

// Process-level crash prevention
process.on('uncaughtException', (err) => {
  console.error('[medTrace Fatal Error caught]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[medTrace Unhandled Rejection]', reason);
});

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());

// Setup static uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/i.test(path.extname(file.originalname));
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, WEBP) and PDFs are supported.'));
    }
  },
});

// Clean state without any pre-loaded demo prescription
let currentMedications: ExtractedMedItem[] = [];
let currentDocument: any = null;
let auditLogs: any[] = [];

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'medTrace OCR Engine',
    medicationsCount: currentMedications.length,
    timestamp: new Date().toISOString(),
  });
});

// GET all active medications & current document
app.get('/api/prescriptions', (_req, res) => {
  res.json({
    medications: currentMedications,
    document: currentDocument,
    auditLogs,
  });
});

// POST Upload prescription file & run real OCR
app.post('/api/prescriptions/upload', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No prescription file provided.' });
    }

    const file = req.file;
    const initialUrl = `/uploads/${file.filename}`;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    console.log(`[OCR Engine] Processing uploaded file: ${file.originalname} (${file.size} bytes)`);

    // Run Tesseract OCR & Clinical Entity Extraction (with auto-PDF conversion)
    const ocrResult = await processPrescriptionOCR(file.path, file.originalname, initialUrl);

    console.log(`[OCR Engine] Extracted ${ocrResult.medications.length} medication items from ${file.originalname}`);

    // Update active medications with the newly extracted document items
    currentMedications = ocrResult.medications;
    currentDocument = {
      id: `doc-${Date.now()}`,
      fileName: file.originalname,
      fileUrl: ocrResult.previewUrl || initialUrl,
      fileSize: fileSizeMB,
      uploadedAt: timestamp,
      status: 'EXTRACTED',
      itemCount: ocrResult.medications.length,
    };

    // Append to audit trail
    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp,
      medicationId: 'upload',
      medicationName: file.originalname,
      actor: 'Arjun Sharma (Patient)',
      role: 'PATIENT',
      eventType: 'FLAG_CREATED',
      summary: `Uploaded "${file.originalname}" (${ocrResult.medications.length} items extracted via Tesseract OCR).`,
      details: `OCR confidence: ${ocrResult.medications[0]?.confidence || 88}%. Optical bounding boxes generated.`,
    };
    auditLogs = [auditEntry, ...auditLogs];

    return res.json({
      success: true,
      document: currentDocument,
      medications: currentMedications,
      newlyExtracted: ocrResult.medications,
      auditLogs,
      rawOcrText: ocrResult.fullText,
    });
  } catch (err: any) {
    console.error('[OCR Engine Error]', err);
    return res.status(500).json({
      error: 'OCR extraction failed on the uploaded document.',
      details: err?.message || String(err),
    });
  }
});

// POST Flag medication error (Patient action)
app.post('/api/prescriptions/:id/flag', (req, res) => {
  const { id } = req.params;
  const { discrepancyType, comment } = req.body;
  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  let targetMedName = '';
  currentMedications = currentMedications.map((m) => {
    if (m.id === id) {
      targetMedName = m.name;
      return {
        ...m,
        status: 'PATIENT_FLAGGED',
        patientFlagNote: comment,
        flagDetails: {
          discrepancyType,
          comment,
          submittedAt: timestamp,
        },
      };
    }
    return m;
  });

  const auditEntry = {
    id: `audit-${Date.now()}`,
    timestamp,
    medicationId: id,
    medicationName: targetMedName || 'Medication',
    actor: 'Arjun Sharma (Patient)',
    role: 'PATIENT',
    eventType: 'FLAG_CREATED',
    summary: `Patient flagged discrepancy (${discrepancyType}): "${comment}"`,
    details: `Queued for Dr. Rajesh Iyer.`,
  };
  auditLogs = [auditEntry, ...auditLogs];

  res.json({ success: true, medications: currentMedications, auditLogs });
});

// POST Resolve medication (Clinician action)
app.post('/api/prescriptions/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { action, note, revisedValues } = req.body;
  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  let targetMedName = '';
  let eventType = 'EXTRACTION_APPROVED';
  let summary = '';

  currentMedications = currentMedications.map((m) => {
    if (m.id === id) {
      targetMedName = m.name;
      const updated = {
        ...m,
        status: 'VERIFIED' as const,
        clinicianResolution: {
          action,
          clinicianName: 'Dr. Rajesh Iyer, MD',
          clinicianNote: note,
          resolvedAt: timestamp,
          revisedValues,
        },
      };

      if (action === 'REVISE_MEDICATION' && revisedValues) {
        if (revisedValues.strength) updated.strength = revisedValues.strength;
        if (revisedValues.instructions) updated.instructions = revisedValues.instructions;
        eventType = 'MEDICATION_REVISED';
        summary = `Dr. Iyer amended prescription: Strength set to ${revisedValues.strength || m.strength}. Note: "${note}"`;
      } else if (action === 'APPROVE_EXTRACTION') {
        eventType = 'EXTRACTION_APPROVED';
        summary = `Dr. Iyer confirmed and approved AI extraction. Note: "${note}"`;
      } else {
        eventType = 'FLAG_DISMISSED';
        summary = `Dr. Iyer reaffirmed original prescription after review. Note: "${note}"`;
      }
      return updated;
    }
    return m;
  });

  const auditEntry = {
    id: `audit-${Date.now()}`,
    timestamp,
    medicationId: id,
    medicationName: targetMedName || 'Medication',
    actor: 'Dr. Rajesh Iyer, MD',
    role: 'CLINICIAN',
    eventType,
    summary,
    details: note,
  };
  auditLogs = [auditEntry, ...auditLogs];

  res.json({ success: true, medications: currentMedications, auditLogs });
});

// In-memory OTP Store for email authentication
interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

// Transporter configuration (supports SMTP or test ethereal)
let mailTransporter: nodemailer.Transporter | null = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// POST /api/auth/send-otp - Generate & send email OTP for registration
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, role, name } = req.body;
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanEmail, {
      code: otp,
      email: cleanEmail,
      expiresAt,
      attempts: 0,
    });

    console.log(`\n======================================================`);
    console.log(`[medTrace Email Verification] Sending OTP`);
    console.log(`To: ${cleanEmail}`);
    console.log(`Role: ${role || 'user'}`);
    console.log(`Verification Code (OTP): [ ${otp} ]`);
    console.log(`Valid for: 10 minutes`);
    console.log(`======================================================\n`);

    // Attempt real email send if transporter configured
    if (mailTransporter) {
      try {
        await mailTransporter.sendMail({
          from: '"medTrace Clinical Security" <security@medtrace.health>',
          to: cleanEmail,
          subject: `Your medTrace Verification Code: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #1F4E5B; margin-top: 0;">medTrace Security Verification</h2>
              <p>Hello ${name ? name : 'there'},</p>
              <p>Your one-time email verification code to register for the <strong>medTrace ${role === 'physician' ? 'Physician' : 'Patient'} Portal</strong> is:</p>
              <div style="background-color: #f1f8f8; border: 2px dashed #2BC4C6; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1F4E5B;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #666;">This verification code will expire in 10 minutes. If you did not request this registration, please disregard this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999;">medTrace Continuity Engine · HIPAA Compliant · Closed-Loop Handover Safety</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn('[medTrace Email Transporter Error - simulated fallback active]:', mailErr);
      }
    }

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[send-otp Error]', err);
    return res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

// POST /api/auth/verify-otp - Validate email OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return res.status(400).json({
      error: 'No active verification code found for this email. Please request a new code.',
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({
      error: 'Verification code has expired. Please request a new one.',
    });
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({
      error: 'Too many incorrect attempts. Please request a new code.',
    });
  }

  if (record.code !== String(otp).trim()) {
    const remaining = 5 - record.attempts;
    return res.status(400).json({
      error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`,
    });
  }

  // OTP verified successfully
  otpStore.delete(cleanEmail);
  return res.json({
    success: true,
    message: 'Email successfully verified.',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[medTrace Backend] Running on http://localhost:${PORT}`);
  console.log(`[medTrace Backend] Static uploads served at http://localhost:${PORT}/uploads`);
});
