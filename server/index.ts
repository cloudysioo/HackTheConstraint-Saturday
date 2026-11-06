import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { processPrescriptionOCR, ExtractedMedItem } from './services/ocrService';
import { sendOtpEmail } from './emailService';
import {
  mockDoctors,
  mockPatients,
  initialMockMedications,
  initialAuditLogs,
} from '../src/data/mockData';
import { initialAuthUsers } from '../src/data/mockUsers';
import { initialSeedComparisons } from '../src/services/dbService';

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

// Shared state with file-backed persistence for cross-device synchronization
let currentMedications: any[] = [...initialMockMedications];
let currentDocument: any = null;
let auditLogs: any[] = [...initialAuditLogs];
let comparisonReports: any[] = [...initialSeedComparisons];
let patientsList: any[] = [...mockPatients];
let doctorsDirectory: any[] = [...mockDoctors];
let registeredUsers: any[] = [...initialAuthUsers];

// File-backed persistence helper
const DB_FILE = path.resolve(process.cwd(), 'server/data/database.json');
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.medications) && parsed.medications.length > 0) currentMedications = parsed.medications;
    if (parsed.document) currentDocument = parsed.document;
    if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0) auditLogs = parsed.auditLogs;
    if (Array.isArray(parsed.comparisonReports) && parsed.comparisonReports.length > 0) comparisonReports = parsed.comparisonReports;
    if (Array.isArray(parsed.patients) && parsed.patients.length > 0) patientsList = parsed.patients;
    if (Array.isArray(parsed.doctors) && parsed.doctors.length > 0) doctorsDirectory = parsed.doctors;
    if (Array.isArray(parsed.users) && parsed.users.length > 0) registeredUsers = parsed.users;
  }
} catch (e) {
  console.warn('[DB File] Could not load database.json:', e);
}

function persistDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({
        medications: currentMedications,
        document: currentDocument,
        auditLogs,
        comparisonReports,
        patients: patientsList,
        doctors: doctorsDirectory,
        users: registeredUsers,
      }, null, 2)
    );
  } catch (e) {
    console.warn('[DB File] Could not persist database.json:', e);
  }
}

// Initial write to ensure file exists
persistDb();

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'medTrace OCR Engine',
    medicationsCount: currentMedications.length,
    patientsCount: patientsList.length,
    timestamp: new Date().toISOString(),
  });
});

// ── PATIENTS & CARE TEAM (CROSS-DEVICE SYNC) ─────────────────

// GET all patients
app.get('/api/patients', (_req, res) => {
  res.json({
    success: true,
    patients: patientsList,
    timestamp: new Date().toISOString(),
  });
});

// POST register / sync a patient profile
app.post('/api/patients/sync', (req, res) => {
  const patient = req.body;
  if (!patient || !patient.id) {
    return res.status(400).json({ error: 'Patient object with id is required' });
  }
  const idx = patientsList.findIndex((p) => p.id === patient.id);
  if (idx >= 0) {
    patientsList[idx] = { ...patientsList[idx], ...patient };
  } else {
    patientsList.unshift(patient);
  }
  persistDb();
  res.json({ success: true, patients: patientsList });
});

// POST Patient requests doctor to join care team (Waiting for Approval)
app.post('/api/patients/care-team/request', (req, res) => {
  const { patientId, doctor, actor } = req.body;
  if (!patientId || !doctor || !doctor.name) {
    return res.status(400).json({ error: 'patientId and doctor are required.' });
  }

  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const pendingDoctor = {
    ...doctor,
    approvalStatus: 'PENDING_APPROVAL',
    requestedAt: timestamp,
  };

  let patientFound = false;
  patientsList = patientsList.map((p) => {
    if (p.id === patientId) {
      patientFound = true;
      const careTeam = p.careTeam || [];
      const exists = careTeam.some(
        (d: any) =>
          d.id === doctor.id ||
          (d.doctorId && doctor.doctorId && d.doctorId === doctor.doctorId) ||
          d.name.toLowerCase() === doctor.name.toLowerCase()
      );
      if (exists) {
        return {
          ...p,
          careTeam: careTeam.map((d: any) =>
            d.id === doctor.id ||
            (d.doctorId && doctor.doctorId && d.doctorId === doctor.doctorId) ||
            d.name.toLowerCase() === doctor.name.toLowerCase()
              ? { ...d, ...pendingDoctor }
              : d
          ),
        };
      }
      return {
        ...p,
        careTeam: [...careTeam, pendingDoctor],
      };
    }
    return p;
  });

  if (!patientFound) {
    patientsList.unshift({
      id: patientId,
      name: actor || 'Patient User',
      dob: '1985-05-15',
      doctor: 'Dr. Rajesh Iyer, MD',
      clinic: 'Metro Health Primary Care',
      phone: '(555) 019-2810',
      careTeam: [mockDoctors[0], pendingDoctor],
      allergies: [],
      conditions: ['Primary Care Evaluation'],
    });
  }

  // Ensure doctor is in directory
  if (!doctorsDirectory.some((d: any) => d.name.toLowerCase() === doctor.name.toLowerCase())) {
    doctorsDirectory.push(pendingDoctor);
  }

  const auditLog = {
    id: `audit-${Date.now()}`,
    patientId,
    timestamp,
    medicationId: doctor.id || 'care-team',
    medicationName: 'Care Team Request',
    actor: actor || 'Patient',
    role: 'PATIENT',
    eventType: 'FLAG_CREATED',
    summary: `Requested ${doctor.name} (${doctor.specialty}) to join care team — Waiting for doctor approval`,
    details: `Co-managing clinic: ${doctor.clinic || 'Specialist Clinic'}. Request dispatched across devices to doctor queue.`,
  };
  auditLogs = [auditLog, ...auditLogs];

  persistDb();
  console.log(`[Care Team Cross-Device] Request sent: ${doctor.name} for patient ${patientId}`);

  res.json({
    success: true,
    patients: patientsList,
    doctor: pendingDoctor,
    auditLogs,
  });
});

// POST Doctor approves patient's linking request
app.post('/api/patients/care-team/approve', (req, res) => {
  const { patientId, doctorId, actor } = req.body;
  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'patientId and doctorId are required.' });
  }

  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  let approvedDocName = '';

  patientsList = patientsList.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        careTeam: (p.careTeam || []).map((d: any) => {
          if (
            d.id === doctorId ||
            d.doctorId === doctorId ||
            d.name === doctorId ||
            (d.registrationNumber && d.registrationNumber === doctorId)
          ) {
            approvedDocName = d.name;
            return { ...d, approvalStatus: 'APPROVED' };
          }
          return d;
        }),
      };
    }
    return p;
  });

  const auditLog = {
    id: `audit-${Date.now()}`,
    patientId,
    timestamp,
    medicationId: doctorId,
    medicationName: approvedDocName || 'Consulting Doctor',
    actor: actor || 'Attending Physician',
    role: 'CLINICIAN',
    eventType: 'EXTRACTION_APPROVED',
    summary: `Doctor approved care team request: ${approvedDocName || 'Specialist'} is now an active co-managing clinician.`,
    details: `Care team link activated for closed-loop prescription reconciliation across devices.`,
  };
  auditLogs = [auditLog, ...auditLogs];

  persistDb();
  console.log(`[Care Team Cross-Device] Approved: ${approvedDocName} for patient ${patientId}`);

  res.json({
    success: true,
    patients: patientsList,
    approvedDoctorName: approvedDocName,
    auditLogs,
  });
});

// POST Doctor declines patient care team request
app.post('/api/patients/care-team/reject', (req, res) => {
  const { patientId, doctorId, actor } = req.body;
  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  patientsList = patientsList.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        careTeam: (p.careTeam || []).filter(
          (d: any) =>
            d.id !== doctorId &&
            d.doctorId !== doctorId &&
            d.name !== doctorId &&
            d.registrationNumber !== doctorId
        ),
      };
    }
    return p;
  });

  const auditLog = {
    id: `audit-${Date.now()}`,
    patientId,
    timestamp,
    medicationId: doctorId,
    medicationName: 'Care Team Request',
    actor: actor || 'Physician',
    role: 'CLINICIAN',
    eventType: 'FLAG_DISMISSED',
    summary: `Doctor declined patient care team request.`,
    details: `Request dismissed from queue across devices.`,
  };
  auditLogs = [auditLog, ...auditLogs];

  persistDb();
  res.json({ success: true, patients: patientsList, auditLogs });
});

// POST Patient cancels pending request
app.post('/api/patients/care-team/cancel', (req, res) => {
  const { patientId, doctorId } = req.body;

  patientsList = patientsList.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        careTeam: (p.careTeam || []).filter(
          (d: any) =>
            d.id !== doctorId &&
            d.doctorId !== doctorId &&
            d.name !== doctorId &&
            d.registrationNumber !== doctorId
        ),
      };
    }
    return p;
  });

  persistDb();
  res.json({ success: true, patients: patientsList });
});

// POST Patient removes consulting doctor
app.post('/api/patients/care-team/remove', (req, res) => {
  const { patientId, doctorId, actor } = req.body;
  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  let removedDocName = '';

  patientsList = patientsList.map((p) => {
    if (p.id === patientId) {
      const target = (p.careTeam || []).find(
        (d: any) =>
          d.id === doctorId ||
          d.doctorId === doctorId ||
          d.name === doctorId ||
          d.registrationNumber === doctorId
      );
      if (target) removedDocName = target.name;

      return {
        ...p,
        careTeam: (p.careTeam || []).filter(
          (d: any) =>
            d.id !== doctorId &&
            d.doctorId !== doctorId &&
            d.name !== doctorId &&
            d.registrationNumber !== doctorId
        ),
      };
    }
    return p;
  });

  const auditLog = {
    id: `audit-${Date.now()}`,
    patientId,
    timestamp,
    medicationId: doctorId,
    medicationName: removedDocName || 'Consulting Doctor',
    actor: actor || 'Patient',
    role: 'PATIENT',
    eventType: 'FLAG_DISMISSED',
    summary: `Removed ${removedDocName || 'physician'} from care team.`,
    details: `Consulting doctor unlinked from patient chart across devices.`,
  };
  auditLogs = [auditLog, ...auditLogs];

  persistDb();
  res.json({ success: true, patients: patientsList, auditLogs });
});

// POST Patient erases all their data
app.post('/api/patients/clear-data', (req, res) => {
  const { patientId, actor } = req.body;
  const timestamp = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  currentMedications = currentMedications.filter((m) => (m.patientId || 'PT-94021') !== patientId);
  comparisonReports = comparisonReports.filter((c) => (c.patientId || 'PT-94021') !== patientId);

  patientsList = patientsList.map((p) => {
    if (p.id === patientId) {
      return {
        ...p,
        careTeam: (p.careTeam || []).filter((d: any) => d.isPrimary),
      };
    }
    return p;
  });

  const auditLog = {
    id: `audit-${Date.now()}`,
    patientId,
    timestamp,
    medicationId: 'data-wipe',
    medicationName: 'Complete Health Record Purge',
    actor: actor || 'Patient',
    role: 'PATIENT',
    eventType: 'FLAG_DISMISSED',
    summary: `Patient requested complete health data erasure. All medication charts purged.`,
    details: `Right to Erasure executed across devices.`,
  };
  auditLogs = [auditLog, ...auditLogs.filter((l) => l.patientId !== patientId)];

  persistDb();
  res.json({ success: true, patients: patientsList, auditLogs });
});

// ── DOCTORS DIRECTORY (CROSS-DEVICE SYNC) ────────────────────
app.get('/api/doctors', (_req, res) => {
  res.json({ success: true, doctors: doctorsDirectory });
});

app.post('/api/doctors', (req, res) => {
  const doctor = req.body;
  if (!doctor || !doctor.name) {
    return res.status(400).json({ error: 'Doctor object with name is required' });
  }
  const exists = doctorsDirectory.some((d: any) => d.name.toLowerCase() === doctor.name.toLowerCase());
  if (!exists) {
    doctorsDirectory.push(doctor);
    persistDb();
  }
  res.json({ success: true, doctors: doctorsDirectory });
});

// ── AUTH & USER ACCOUNTS (CROSS-DEVICE SYNC) ─────────────────
app.get('/api/auth/users', (_req, res) => {
  res.json({
    success: true,
    users: registeredUsers,
  });
});

app.post('/api/auth/register', (req, res) => {
  const user = req.body;
  if (!user || !user.email) {
    return res.status(400).json({ error: 'User payload required.' });
  }

  const cleanEmail = user.email.trim().toLowerCase();
  const existingIdx = registeredUsers.findIndex((u: any) => u.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    registeredUsers[existingIdx] = { ...registeredUsers[existingIdx], ...user };
  } else {
    registeredUsers.unshift(user);
  }

  if (user.role === 'physician') {
    const docExists = doctorsDirectory.some(
      (d: any) => d.name.toLowerCase() === user.name.toLowerCase() || (d.doctorId && d.doctorId === user.doctorId)
    );
    if (!docExists) {
      doctorsDirectory.push({
        id: `doc-${user.id}`,
        doctorId: user.doctorId || `DOC-${user.id}`,
        name: user.name,
        specialty: user.specialty || 'General Medicine',
        clinic: user.clinic || 'Metro Health Primary Care',
        phone: user.phone || '(555) 019-4820',
        email: user.email,
        registrationNumber: user.registrationNumber,
        approvalStatus: user.approvalStatus === 'approved' ? 'APPROVED' : 'PENDING_APPROVAL',
      });
    }
  }

  persistDb();
  res.json({ success: true, user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const cleanEmail = email.trim().toLowerCase();
  const user = registeredUsers.find((u: any) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found in system.' });
  }
  if (role && user.role !== role) {
    return res.status(400).json({ error: `Account registered as ${user.role}.` });
  }
  return res.json({ success: true, user });
});

app.post('/api/auth/physicians/approve', (req, res) => {
  const { physicianId, actor } = req.body;
  let approvedPhysician: any = null;

  registeredUsers = registeredUsers.map((u: any) => {
    if (u.id === physicianId && u.role === 'physician') {
      approvedPhysician = { ...u, approvalStatus: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: actor || 'Admin Team' };
      return approvedPhysician;
    }
    return u;
  });

  if (approvedPhysician) {
    const docIdx = doctorsDirectory.findIndex((d: any) => d.doctorId === approvedPhysician.doctorId || d.name === approvedPhysician.name);
    if (docIdx >= 0) {
      doctorsDirectory[docIdx].approvalStatus = 'APPROVED';
    } else {
      doctorsDirectory.push({
        id: `doc-${approvedPhysician.id}`,
        doctorId: approvedPhysician.doctorId,
        name: approvedPhysician.name,
        specialty: approvedPhysician.specialty,
        clinic: approvedPhysician.clinic,
        phone: '(555) 019-4820',
        email: approvedPhysician.email,
        registrationNumber: approvedPhysician.registrationNumber,
        approvalStatus: 'APPROVED',
      });
    }
  }

  persistDb();
  res.json({ success: true, physician: approvedPhysician, users: registeredUsers });
});

app.post('/api/auth/physicians/reject', (req, res) => {
  const { physicianId, reason } = req.body;
  registeredUsers = registeredUsers.map((u: any) => {
    if (u.id === physicianId && u.role === 'physician') {
      return { ...u, approvalStatus: 'rejected', rejectionReason: reason || 'Credentials could not be verified' };
    }
    return u;
  });
  persistDb();
  res.json({ success: true, users: registeredUsers });
});

// GET all active medications & current document
app.get('/api/prescriptions', (_req, res) => {
  res.json({
    medications: currentMedications,
    document: currentDocument,
    auditLogs,
    comparisonReports,
  });
});

// GET all prescription comparison reports
app.get('/api/comparisons', (_req, res) => {
  res.json({ comparisonReports });
});

// POST save a comparison report
app.post('/api/comparisons', (req, res) => {
  const report = req.body;
  if (!report || !report.id) {
    return res.status(400).json({ error: 'Invalid comparison report payload' });
  }
  comparisonReports = [report, ...comparisonReports.filter((c) => c.id !== report.id)];
  persistDb();
  res.json({ success: true, comparisonReports });
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
    persistDb();

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

    // Dispatch real email via multi-provider free email service
    const emailResult = await sendOtpEmail({
      email: cleanEmail,
      otp,
      name,
      role,
    });

    console.log(`[send-otp Result] Provider: ${emailResult.service}, Preview URL: ${emailResult.previewUrl || 'N/A'}`);

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      expiresAt,
      otp,
      previewOtp: otp,
      devOtp: otp,
      previewUrl: emailResult.previewUrl,
      serviceUsed: emailResult.service,
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
