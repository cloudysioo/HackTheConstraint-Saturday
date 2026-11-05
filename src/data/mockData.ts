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

// Start clean without any pre-loaded demo prescription
export const initialUploadedDocument: UploadedDocument | null = null;
export const mockUploadedDocument = initialUploadedDocument;

export const initialMockMedications: Medication[] = [];

export const initialAuditLogs: AuditLogEntry[] = [];
