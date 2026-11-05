import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

// Start server
app.listen(PORT, () => {
  console.log(`[medTrace Backend] Running on http://localhost:${PORT}`);
  console.log(`[medTrace Backend] Static uploads served at http://localhost:${PORT}/uploads`);
});
