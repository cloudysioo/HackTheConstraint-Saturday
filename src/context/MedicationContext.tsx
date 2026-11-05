import React, { createContext, useContext, useState } from 'react';
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
  mockUploadedDocument,
  initialMockMedications,
  initialAuditLogs,
} from '../data/mockData';

interface MedicationContextType {
  medications: Medication[];
  activePortal: 'patient' | 'clinician';
  setActivePortal: (portal: 'patient' | 'clinician') => void;
  patient: PatientProfile;
  clinician: ClinicianProfile;
  document: UploadedDocument;
  auditLogs: AuditLogEntry[];
  flagMedication: (id: string, discrepancyType: FlagDiscrepancyType, comment: string) => void;
  resolveMedication: (
    id: string,
    action: 'APPROVE_EXTRACTION' | 'REVISE_MEDICATION' | 'DISMISS_FLAG',
    note: string,
    revisedValues?: { strength?: string; instructions?: string }
  ) => void;
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
  const [document, setDocument] = useState<UploadedDocument>(mockUploadedDocument);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  // Helper to format timestamps
  const getFormattedTime = () => {
    return `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Flag a medication (Patient action)
  const flagMedication = (id: string, discrepancyType: FlagDiscrepancyType, comment: string) => {
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

    // Append to audit log
    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp,
      medicationId: id,
      medicationName: targetMedName || 'Medication',
      actor: `${mockPatient.name} (Patient)`,
      role: 'PATIENT',
      eventType: 'FLAG_CREATED',
      summary: `Patient flagged discrepancy (${discrepancyType}): "${comment}"`,
      details: `Discrepancy category: ${discrepancyType}. Queued for Dr. Sarah Jenkins.`,
    };

    setAuditLogs((prev) => [newAuditEntry, ...prev]);
  };

  // Resolve medication flag or pending state (Clinician action)
  const resolveMedication = (
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
            summary = `Dr. Jenkins amended prescription: Strength set to ${revisedValues.strength || med.strength}. Note: "${note}"`;
          } else if (action === 'APPROVE_EXTRACTION') {
            eventType = 'EXTRACTION_APPROVED';
            summary = `Dr. Jenkins confirmed and approved AI extraction. Note: "${note}"`;
          } else {
            eventType = 'FLAG_DISMISSED';
            summary = `Dr. Jenkins reaffirmed original prescription after review. Note: "${note}"`;
          }

          return updatedMed;
        }
        return med;
      })
    );

    // Append to audit trail
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
  };

  // Upload simulation
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

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp,
      medicationId: 'upload',
      medicationName: fileName,
      actor: `${mockPatient.name} (Patient)`,
      role: 'PATIENT',
      eventType: 'FLAG_CREATED',
      summary: `Uploaded document "${fileName}" for OCR processing and reconciliation.`,
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);
  };

  // Metrics
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
        flagMedication,
        resolveMedication,
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
