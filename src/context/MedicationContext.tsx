import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Medication,
  UploadedDocument,
  PatientProfile,
  ClinicianProfile,
  AuditLogEntry,
  FlagDiscrepancyType,
} from '../types/medication';
import {
  mockPatient,
  mockClinician,
  initialMockMedications,
  initialAuditLogs,
} from '../data/mockData';

interface MedicationContextType {
  medications: Medication[];
  activePortal: 'patient' | 'clinician';
  setActivePortal: (portal: 'patient' | 'clinician') => void;
  patient: PatientProfile;
  clinician: ClinicianProfile;
  document: UploadedDocument | null;
  auditLogs: AuditLogEntry[];
  isUploading: boolean;
  uploadProgressText: string;
  rawOcrText?: string;
  flagMedication: (id: string, discrepancyType: FlagDiscrepancyType, comment: string) => Promise<void>;
  resolveMedication: (
    id: string,
    action: 'APPROVE_EXTRACTION' | 'REVISE_MEDICATION' | 'DISMISS_FLAG',
    note: string,
    revisedValues?: { strength?: string; instructions?: string }
  ) => Promise<void>;
  uploadPrescriptionFile: (file: File) => Promise<boolean>;
  uploadDocument: (fileName: string) => void;
  counts: {
    total: number;
    verified: number;
    flagged: number;
    pending: number;
    conflict: number;
    needsClinicianReview: number;
  };
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>(initialMockMedications);
  const [activePortal, setActivePortal] = useState<'patient' | 'clinician'>('patient');
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [rawOcrText, setRawOcrText] = useState<string | undefined>(undefined);

  const getFormattedTime = () => {
    return `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Sync with backend on initial load if available
  useEffect(() => {
    fetch('/api/prescriptions')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Backend not available yet');
      })
      .then((data) => {
        if (data.medications) {
          setMedications(data.medications);
        }
        if (data.document) {
          setDocument(data.document);
        }
        if (data.auditLogs) {
          setAuditLogs(data.auditLogs);
        }
      })
      .catch(() => {
        // Clean initial state
      });
  }, []);

  // Upload real file to backend OCR endpoint
  const uploadPrescriptionFile = async (file: File): Promise<boolean> => {
    setIsUploading(true);
    setUploadProgressText('Uploading document to medTrace OCR Engine...');

    try {
      const formData = new FormData();
      formData.append('prescription', file);

      setUploadProgressText('Running Tesseract Optical Text & Entity Extraction...');

      const response = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setDocument(result.document);
        setMedications(result.medications);
        if (result.auditLogs) setAuditLogs(result.auditLogs);
        if (result.rawOcrText) setRawOcrText(result.rawOcrText);

        setIsUploading(false);
        setUploadProgressText('');
        return true;
      }
      throw new Error('Upload succeeded but parsing reported false');
    } catch (err: any) {
      console.warn('Real backend upload error, falling back to local simulation:', err);
      // Fallback in case backend is offline
      const timestamp = getFormattedTime();
      const localUrl = URL.createObjectURL(file);
      const newDoc: UploadedDocument = {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        fileUrl: localUrl,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: timestamp,
        status: 'EXTRACTED',
        itemCount: 4,
      };
      setDocument(newDoc);

      const fallbackEntry: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        timestamp,
        medicationId: 'upload',
        medicationName: file.name,
        actor: 'Arjun Sharma (Patient)',
        role: 'PATIENT',
        eventType: 'FLAG_CREATED',
        summary: `Uploaded "${file.name}" for local clinical review.`,
        details: err?.message || 'Processed through frontend fallback.',
      };
      setAuditLogs((prev) => [fallbackEntry, ...prev]);

      setIsUploading(false);
      setUploadProgressText('');
      return true;
    }
  };

  // Flag a medication (Patient action)
  const flagMedication = async (id: string, discrepancyType: FlagDiscrepancyType, comment: string) => {
    const timestamp = getFormattedTime();
    let targetMedName = '';

    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          targetMedName = med.name;
          return {
            ...med,
            status: 'PATIENT_FLAGGED',
            patientFlagNote: comment,
            flagDetails: {
              discrepancyType,
              comment,
              submittedAt: timestamp,
            },
          };
        }
        return med;
      })
    );

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp,
      medicationId: id,
      medicationName: targetMedName || 'Medication',
      actor: `${mockPatient.name} (Patient)`,
      role: 'PATIENT',
      eventType: 'FLAG_CREATED',
      summary: `Patient flagged discrepancy (${discrepancyType}): "${comment}"`,
      details: `Discrepancy category: ${discrepancyType}. Queued for Dr. Rajesh Iyer.`,
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);

    // Send to backend in background
    fetch(`/api/prescriptions/${id}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discrepancyType, comment }),
    }).catch((e) => console.log('Offline flag sync note:', e));
  };

  // Resolve medication flag or pending state (Clinician action)
  const resolveMedication = async (
    id: string,
    action: 'APPROVE_EXTRACTION' | 'REVISE_MEDICATION' | 'DISMISS_FLAG',
    note: string,
    revisedValues?: { strength?: string; instructions?: string }
  ) => {
    const timestamp = getFormattedTime();
    let targetMedName = '';
    let eventType: AuditLogEntry['eventType'] = 'EXTRACTION_APPROVED';
    let summary = '';

    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          targetMedName = med.name;
          const updatedMed: Medication = {
            ...med,
            status: 'VERIFIED',
            clinicianResolution: {
              action,
              clinicianName: mockClinician.name,
              clinicianNote: note,
              resolvedAt: timestamp,
              revisedValues,
            },
          };

          if (action === 'REVISE_MEDICATION' && revisedValues) {
            if (revisedValues.strength) updatedMed.strength = revisedValues.strength;
            if (revisedValues.instructions) updatedMed.instructions = revisedValues.instructions;
            eventType = 'MEDICATION_REVISED';
            summary = `Dr. Iyer amended prescription: Strength set to ${revisedValues.strength || med.strength}. Note: "${note}"`;
          } else if (action === 'APPROVE_EXTRACTION') {
            eventType = 'EXTRACTION_APPROVED';
            summary = `Dr. Iyer confirmed and approved AI extraction. Note: "${note}"`;
          } else {
            eventType = 'FLAG_DISMISSED';
            summary = `Dr. Iyer reaffirmed original prescription after review. Note: "${note}"`;
          }

          return updatedMed;
        }
        return med;
      })
    );

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp,
      medicationId: id,
      medicationName: targetMedName || 'Medication',
      actor: mockClinician.name,
      role: 'CLINICIAN',
      eventType,
      summary,
      details: note,
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);

    // Send to backend in background
    fetch(`/api/prescriptions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note, revisedValues }),
    }).catch((e) => console.log('Offline resolve sync note:', e));
  };

  // Upload simulation helper (backward compatibility)
  const uploadDocument = (fileName: string) => {
    const timestamp = getFormattedTime();
    setDocument({
      id: `doc-${Date.now()}`,
      fileName,
      fileSize: '2.1 MB',
      uploadedAt: timestamp,
      status: 'EXTRACTED',
      itemCount: 4,
    });
  };

  const total = medications.length;
  const verified = medications.filter((m) => m.status === 'VERIFIED').length;
  const flagged = medications.filter((m) => m.status === 'PATIENT_FLAGGED').length;
  const pending = medications.filter((m) => m.status === 'PENDING').length;
  const conflict = medications.filter((m) => m.status === 'CONFLICT').length;
  const needsClinicianReview = flagged + pending + conflict;

  return (
    <MedicationContext.Provider
      value={{
        medications,
        activePortal,
        setActivePortal,
        patient: mockPatient,
        clinician: mockClinician,
        document,
        auditLogs,
        isUploading,
        uploadProgressText,
        rawOcrText,
        flagMedication,
        resolveMedication,
        uploadPrescriptionFile,
        uploadDocument,
        counts: {
          total,
          verified,
          flagged,
          pending,
          conflict,
          needsClinicianReview,
        },
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedications = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedications must be used within a MedicationProvider');
  }
  return context;
};
