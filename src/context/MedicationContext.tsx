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
import { processClientPrescriptionOCR } from '../services/clientOcrService';
import {
  processGeminiPrescriptionOCR,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from '../services/geminiOcrService';

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
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
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
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(getStoredGeminiApiKey());

  const setGeminiApiKey = (key: string) => {
    setStoredGeminiApiKey(key);
    setGeminiApiKeyState(key);
  };

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

  // Upload prescription file: supports Local Backend (Apple Vision), Gemini 1.5 Flash Vision, and In-Browser OCR
  const uploadPrescriptionFile = async (file: File): Promise<boolean> => {
    setIsUploading(true);
    setUploadProgressText('Processing prescription document...');

    // 1. Try local Express backend if running (e.g. on local Mac with Apple Vision)
    try {
      const formData = new FormData();
      formData.append('prescription', file);

      setUploadProgressText('Connecting to medTrace OCR Engine...');

      const response = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
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
      }
    } catch {
      // Local backend unavailable, move to cloud AI / client engine
    }

    // 2. Try Gemini 1.5 Flash Vision (Apple-level or better handwriting OCR)
    const effectiveKey = geminiApiKey || getStoredGeminiApiKey();
    if (effectiveKey && effectiveKey.trim().length > 5) {
      try {
        setUploadProgressText('Running Gemini 1.5 Flash Multimodal OCR & Clinical Resolution...');
        const geminiResult = await processGeminiPrescriptionOCR(file, effectiveKey.trim(), (msg) => {
          setUploadProgressText(msg);
        });

        setDocument(geminiResult.document);
        setMedications(geminiResult.medications);
        setAuditLogs((prev) => [geminiResult.auditLog, ...prev]);
        if (geminiResult.rawOcrText) setRawOcrText(geminiResult.rawOcrText);

        setIsUploading(false);
        setUploadProgressText('');
        return true;
      } catch (geminiErr: any) {
        console.warn('Gemini Flash OCR error, falling back to in-browser engine:', geminiErr);
      }
    }

    // 3. Fallback: In-browser WebAssembly OCR
    try {
      setUploadProgressText('Running in-browser Optical Character Recognition...');
      const clientResult = await processClientPrescriptionOCR(file, (msg) => {
        setUploadProgressText(msg);
      });

      setDocument(clientResult.document);
      setMedications(clientResult.medications);
      setAuditLogs((prev) => [clientResult.auditLog, ...prev]);
      if (clientResult.rawOcrText) setRawOcrText(clientResult.rawOcrText);

      setIsUploading(false);
      setUploadProgressText('');
      return true;
    } catch (clientErr: any) {
      console.error('In-browser client OCR error:', clientErr);
      setIsUploading(false);
      setUploadProgressText('');
      return false;
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
        geminiApiKey,
        setGeminiApiKey,
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
