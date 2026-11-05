export type MedicationStatus = 'VERIFIED' | 'PATIENT_FLAGGED' | 'PENDING' | 'CONFLICT';

export type FlagDiscrepancyType =
  | 'Wrong Medicine'
  | 'Wrong Dosage'
  | 'Wrong Instructions'
  | 'Other';

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface PatientFlagDetails {
  discrepancyType: FlagDiscrepancyType;
  comment: string;
  submittedAt: string;
}

export interface ClinicianResolution {
  action: 'APPROVE_EXTRACTION' | 'REVISE_MEDICATION' | 'DISMISS_FLAG';
  clinicianName: string;
  clinicianNote: string;
  resolvedAt: string;
  revisedValues?: {
    name?: string;
    strength?: string;
    instructions?: string;
  };
}

export interface Medication {
  id: string;
  name: string;
  strength: string;
  instructions: string;
  sourceDocument: string;
  source?: string;
  status: MedicationStatus;
  boundingBox?: BoundingBox;
  patientFlagNote?: string;
  flagDetails?: PatientFlagDetails;
  clinicianResolution?: ClinicianResolution;
  conflictDetails?: {
    severity: 'HIGH' | 'MEDIUM';
    description: string;
    conflictingWith?: string;
  };
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'EXTRACTED' | 'PROCESSING' | 'ERROR';
  itemCount: number;
}

export interface PatientProfile {
  name: string;
  id: string;
  dob: string;
  doctor: string;
  clinic: string;
}

export interface ClinicianProfile {
  name: string;
  title: string;
  npi: string;
  clinic: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  medicationId: string;
  medicationName: string;
  actor: string;
  role: 'PATIENT' | 'CLINICIAN' | 'SYSTEM';
  eventType: 'FLAG_CREATED' | 'EXTRACTION_APPROVED' | 'MEDICATION_REVISED' | 'FLAG_DISMISSED' | 'CONFLICT_DETECTED';
  summary: string;
  details?: string;
}
