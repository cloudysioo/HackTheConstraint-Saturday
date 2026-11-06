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

export interface AntiGravityExtractionResult {
  medicineName: string; // The combined name and dosage strength of the drug
  timesPerDay: number;  // The calculated raw daily frequency count
}

export interface ConsultingDoctor {
  id: string;
  doctorId?: string; // App-generated Unique Doctor ID used by patients to link account
  name: string;
  specialty: string;
  clinic: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  registrationNumber?: string;
}

export interface Medication {
  id: string;
  patientId?: string; // Patient identifier (e.g. PT-94021)
  medicineName?: string; // Strict Anti-Gravity extraction: combined name & strength
  name: string;
  strength: string;
  timesPerDay?: number;   // Strict integer count of daily intake frequency
  frequencyPerDay?: number; // Alias for timesPerDay
  instructions: string;
  sourceDocument: string;
  source?: string;
  sourceUrl?: string;
  confidence?: number;
  status: MedicationStatus;
  boundingBox?: BoundingBox;
  patientFlagNote?: string;
  flagDetails?: PatientFlagDetails;
  clinicianResolution?: ClinicianResolution;
  prescribedBy?: string; // Prescribing doctor name
  prescribingDoctorId?: string;
  doctorSpecialty?: string; // Specialty (e.g. Cardiology, Endocrinology, Primary Care)
  prescribedDate?: string;
  conflictDetails?: {
    severity: 'HIGH' | 'MEDIUM';
    description: string;
    conflictingWith?: string;
    prescribedByOtherDoctor?: string; // Prescribed by another doctor in care team
  };
}

export interface UploadedDocument {
  id: string;
  patientId?: string;
  prescribingDoctor?: string;
  fileName: string;
  fileUrl?: string;
  fileSize: string;
  uploadedAt: string;
  status: 'EXTRACTED' | 'PROCESSING' | 'ERROR';
  itemCount: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  dob: string;
  doctor: string;
  clinic: string;
  careTeam: ConsultingDoctor[]; // Multiple doctors consulting this patient
  allergies?: string[];
  conditions?: string[];
  phone?: string;
  email?: string;
}

export interface ClinicianProfile {
  name: string;
  doctorId?: string; // Unique doctor ID for patient linking
  title: string;
  npi: string;
  clinic: string;
  specialty?: string;
  assignedPatientsCount?: number;
}

export interface AuditLogEntry {
  id: string;
  patientId?: string;
  timestamp: string;
  medicationId: string;
  medicationName: string;
  actor: string;
  role: 'PATIENT' | 'CLINICIAN' | 'SYSTEM';
  eventType: 'FLAG_CREATED' | 'EXTRACTION_APPROVED' | 'MEDICATION_REVISED' | 'FLAG_DISMISSED' | 'CONFLICT_DETECTED';
  summary: string;
  details?: string;
}
