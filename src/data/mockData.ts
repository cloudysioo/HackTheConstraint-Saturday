import {
  Medication,
  UploadedDocument,
  PatientProfile,
  ClinicianProfile,
  AuditLogEntry,
} from '../types/medication';

export const mockPatient: PatientProfile = {
  name: 'Arjun Sharma',
  id: 'PT-94021',
  dob: '1968-04-12',
  doctor: 'Dr. Rajesh Iyer, MD',
  clinic: 'Metro Health Primary Care',
};

export const mockClinician: ClinicianProfile = {
  name: 'Dr. Rajesh Iyer, MD',
  title: 'Lead Primary Care Physician',
  npi: '184920491',
  clinic: 'Metro Health Primary Care',
};

export const mockUploadedDocument: UploadedDocument = {
  id: 'doc-001',
  fileName: 'Visit_Oct_2024.pdf',
  fileSize: '1.4 MB',
  uploadedAt: 'Today at 10:24 AM',
  status: 'EXTRACTED',
  itemCount: 4,
};

export const initialMockMedications: Medication[] = [
  {
    id: 'med-1',
    name: 'Atorvastatin',
    strength: '20mg',
    instructions: 'Take 1 tablet daily at bedtime',
    sourceDocument: 'Visit_Oct_2024.pdf',
    source: 'Visit_Oct_2024.pdf',
    status: 'VERIFIED',
    boundingBox: {
      top: 38,
      left: 12,
      width: 76,
      height: 11,
    },
    clinicianResolution: {
      action: 'APPROVE_EXTRACTION',
      clinicianName: 'Dr. Rajesh Iyer, MD',
      clinicianNote: 'Extraction matches written prescription pad exactly. Verified.',
      resolvedAt: 'Today at 10:30 AM',
    },
  },
  {
    id: 'med-2',
    name: 'Lisinopril',
    strength: '10mg',
    instructions: 'Take 1 tablet daily in the morning',
    sourceDocument: 'Visit_Oct_2024.pdf',
    source: 'Visit_Oct_2024.pdf',
    status: 'PATIENT_FLAGGED',
    patientFlagNote: 'I believe my doctor said 5mg, not 10mg.',
    boundingBox: {
      top: 52,
      left: 12,
      width: 76,
      height: 11,
    },
    flagDetails: {
      discrepancyType: 'Wrong Dosage',
      comment: 'I believe my doctor said 5mg, not 10mg.',
      submittedAt: 'Today at 10:35 AM',
    },
  },
  {
    id: 'med-3',
    name: 'Metformin',
    strength: '500mg',
    instructions: 'Take twice daily with meals',
    sourceDocument: 'Visit_Oct_2024.pdf',
    source: 'Visit_Oct_2024.pdf',
    status: 'PENDING',
    boundingBox: {
      top: 66,
      left: 12,
      width: 76,
      height: 11,
    },
  },
  {
    id: 'med-4',
    name: 'Hydrochlorothiazide',
    strength: '25mg',
    instructions: 'Take 1 tablet daily in the morning',
    sourceDocument: 'Visit_Oct_2024.pdf',
    source: 'Visit_Oct_2024.pdf',
    status: 'CONFLICT',
    boundingBox: {
      top: 80,
      left: 12,
      width: 76,
      height: 11,
    },
    conflictDetails: {
      severity: 'HIGH',
      description: 'Systemic conflict: duplicate diuretic therapy detected against existing active record (Chlorthalidone). Risk of hypotension.',
      conflictingWith: 'Active Medication: Chlorthalidone 25mg',
    },
  },
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    timestamp: 'Today at 10:24 AM',
    medicationId: 'system',
    medicationName: 'Visit_Oct_2024.pdf',
    actor: 'AI Ingestion Engine',
    role: 'SYSTEM',
    eventType: 'EXTRACTION_APPROVED',
    summary: 'Extracted 4 medication candidates from Visit_Oct_2024.pdf with high optical confidence.',
  },
  {
    id: 'audit-2',
    timestamp: 'Today at 10:25 AM',
    medicationId: 'med-4',
    medicationName: 'Hydrochlorothiazide',
    actor: 'Safety Surveillance System',
    role: 'SYSTEM',
    eventType: 'CONFLICT_DETECTED',
    summary: 'Flagged systemic conflict: duplicate diuretic therapy with existing Chlorthalidone.',
  },
  {
    id: 'audit-3',
    timestamp: 'Today at 10:30 AM',
    medicationId: 'med-1',
    medicationName: 'Atorvastatin',
    actor: 'Dr. Rajesh Iyer, MD',
    role: 'CLINICIAN',
    eventType: 'EXTRACTION_APPROVED',
    summary: 'Verified Atorvastatin 20mg against prescription pad source.',
  },
  {
    id: 'audit-4',
    timestamp: 'Today at 10:35 AM',
    medicationId: 'med-2',
    medicationName: 'Lisinopril',
    actor: 'Arjun Sharma (Patient)',
    role: 'PATIENT',
    eventType: 'FLAG_CREATED',
    summary: 'Patient flagged dosage discrepancy: "I believe my doctor said 5mg, not 10mg."',
  },
];
