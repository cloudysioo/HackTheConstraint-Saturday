import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Medication,
  UploadedDocument,
  PatientProfile,
  ClinicianProfile,
  ConsultingDoctor,
  AuditLogEntry,
  FlagDiscrepancyType,
} from '../types/medication';
import {
  mockPatient,
  mockPatients,
  mockDoctors,
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
import { useAuth } from './AuthContext';
import { PatientUser, PhysicianUser } from '../types/auth';

interface MedicationContextType {
  medications: Medication[];
  allMedications: Medication[];
  activePortal: 'patient' | 'clinician';
  setActivePortal: (portal: 'patient' | 'clinician') => void;
  patient: PatientProfile;
  patients: PatientProfile[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  availableDoctors: ConsultingDoctor[];
  addConsultingDoctor: (patientId: string, doctor: ConsultingDoctor) => void;
  filterDoctorName: string | 'ALL';
  setFilterDoctorName: (name: string | 'ALL') => void;
  patientReviewCounts: Record<string, { needsReview: number; total: number; flagged: number; conflict: number }>;
  clinician: ClinicianProfile;
  currentUserName: string;
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
  uploadPrescriptionForDoctor: (file: File, doctorName?: string, doctorSpecialty?: string) => Promise<boolean>;
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
  const { currentUser, activeRole } = useAuth();

  // Multi-patient roster
  const [patients, setPatients] = useState<PatientProfile[]>(mockPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    if (currentUser?.role === 'patient') {
      return (currentUser as PatientUser).mrn || 'PT-94021';
    }
    return 'PT-94021';
  });

  const [availableDoctors, setAvailableDoctors] = useState<ConsultingDoctor[]>(mockDoctors);
  const [filterDoctorName, setFilterDoctorName] = useState<string | 'ALL'>('ALL');

  // Multi-patient synchronization when a user logs in
  useEffect(() => {
    if (currentUser?.role === 'patient') {
      const pu = currentUser as PatientUser;
      const targetMrn = pu.mrn || 'PT-94021';
      setSelectedPatientId(targetMrn);

      setPatients((prev) => {
        const found = prev.find((p) => p.id === targetMrn);
        if (!found) {
          const registeredPatientProfile: PatientProfile = {
            id: targetMrn,
            name: pu.name,
            dob: pu.dob || '1985-05-15',
            doctor: pu.assignedDoctor || 'Dr. Rajesh Iyer, MD',
            clinic: pu.clinic || 'Metro Health Primary Care',
            phone: pu.phone || '(555) 019-2810',
            email: pu.email,
            careTeam: [
              mockDoctors[0],
              mockDoctors[1],
            ],
            allergies: [],
            conditions: ['Primary Care Evaluation'],
          };
          return [registeredPatientProfile, ...prev];
        }
        return prev;
      });
    }
  }, [currentUser]);

  // Active patient object derived from selectedPatientId
  const patient: PatientProfile =
    patients.find((p) => p.id === selectedPatientId) || patients[0] || mockPatient;

  // Clinician profile
  const clinician: ClinicianProfile = (() => {
    if (currentUser?.role === 'physician') {
      const phy = currentUser as PhysicianUser;
      return {
        name: phy.name,
        title: phy.title,
        npi: phy.registrationNumber || phy.npi || 'MED-VERIFIED',
        clinic: phy.clinic,
        specialty: phy.specialty || 'General Medicine',
        assignedPatientsCount: patients.length,
      };
    }
    return mockClinician;
  })();

  const currentUserName = currentUser?.name || 'Unknown';

  const [allMedications, setAllMedications] = useState<Medication[]>(initialMockMedications);
  const [activePortal, setActivePortal] = useState<'patient' | 'clinician'>(
    activeRole === 'physician' ? 'clinician' : 'patient'
  );
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

  // Add consulting doctor to a patient's care team
  const addConsultingDoctor = (patientId: string, doctor: ConsultingDoctor) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const exists = p.careTeam.some((d) => d.name === doctor.name);
          if (exists) return p;
          return {
            ...p,
            careTeam: [...p.careTeam, doctor],
          };
        }
        return p;
      })
    );

    // Also add to master directory if new
    setAvailableDoctors((prev) => {
      if (!prev.some((d) => d.name === doctor.name)) {
        return [...prev, doctor];
      }
      return prev;
    });

    const timestamp = getFormattedTime();
    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      patientId,
      timestamp,
      medicationId: 'care-team',
      medicationName: 'Care Team Expansion',
      actor: currentUserName,
      role: activeRole === 'physician' ? 'CLINICIAN' : 'PATIENT',
      eventType: 'FLAG_CREATED',
      summary: `Added ${doctor.name} (${doctor.specialty}) to care team`,
      details: `Co-managing clinic: ${doctor.clinic}. Cross-doctor medication reconciliation active.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Medications for current active patient (with optional doctor filter)
  const currentPatientMeds = allMedications.filter(
    (m) => (m.patientId || 'PT-94021') === selectedPatientId
  );

  const medications =
    filterDoctorName === 'ALL'
      ? currentPatientMeds
      : currentPatientMeds.filter((m) => m.prescribedBy === filterDoctorName);

  // Compute patient review counts dictionary for the doctor's roster
  const patientReviewCounts = patients.reduce(
    (acc, p) => {
      const pMeds = allMedications.filter((m) => (m.patientId || 'PT-94021') === p.id);
      const flagged = pMeds.filter((m) => m.status === 'PATIENT_FLAGGED').length;
      const pending = pMeds.filter((m) => m.status === 'PENDING').length;
      const conflict = pMeds.filter((m) => m.status === 'CONFLICT').length;
      acc[p.id] = {
        total: pMeds.length,
        flagged,
        conflict,
        needsReview: flagged + pending + conflict,
      };
      return acc;
    },
    {} as Record<string, { needsReview: number; total: number; flagged: number; conflict: number }>
  );

  // Upload prescription for specific doctor
  const uploadPrescriptionForDoctor = async (
    file: File,
    doctorName?: string,
    doctorSpecialty?: string
  ): Promise<boolean> => {
    setIsUploading(true);
    setUploadProgressText(`Scanning prescription from ${doctorName || 'doctor'}...`);

    const assigningDoctor = doctorName || patient.doctor || 'Dr. Rajesh Iyer, MD';
    const assigningSpecialty = doctorSpecialty || 'Internal Medicine & Primary Care';

    // 1. Try local Express backend
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
          const taggedMeds = (result.medications || []).map((m: Medication) => ({
            ...m,
            patientId: selectedPatientId,
            prescribedBy: assigningDoctor,
            doctorSpecialty: assigningSpecialty,
            prescribedDate: new Date().toISOString().split('T')[0],
          }));

          setDocument(result.document);
          setAllMedications((prev) => [...taggedMeds, ...prev]);
          if (result.auditLogs) setAuditLogs((prev) => [...result.auditLogs, ...prev]);
          if (result.rawOcrText) setRawOcrText(result.rawOcrText);

          setIsUploading(false);
          setUploadProgressText('');
          return true;
        }
      }
    } catch {}

    // 2. Try Gemini 1.5 Flash Vision
    const effectiveKey = geminiApiKey || getStoredGeminiApiKey();
    if (effectiveKey && effectiveKey.trim().length > 5) {
      try {
        setUploadProgressText('Running Gemini Flash Multimodal Clinical Extraction...');
        const geminiResult = await processGeminiPrescriptionOCR(file, effectiveKey.trim(), (msg) => {
          setUploadProgressText(msg);
        });

        const taggedMeds = geminiResult.medications.map((m) => ({
          ...m,
          patientId: selectedPatientId,
          prescribedBy: assigningDoctor,
          doctorSpecialty: assigningSpecialty,
          prescribedDate: new Date().toISOString().split('T')[0],
        }));

        setDocument(geminiResult.document);
        setAllMedications((prev) => [...taggedMeds, ...prev]);
        setAuditLogs((prev) => [geminiResult.auditLog, ...prev]);
        if (geminiResult.rawOcrText) setRawOcrText(geminiResult.rawOcrText);

        setIsUploading(false);
        setUploadProgressText('');
        return true;
      } catch (geminiErr: any) {
        console.warn('Gemini Flash OCR fallback to client engine:', geminiErr);
      }
    }

    // 3. Fallback: In-browser WebAssembly OCR
    try {
      setUploadProgressText('Running in-browser OCR Engine...');
      const clientResult = await processClientPrescriptionOCR(file, (msg) => {
        setUploadProgressText(msg);
      });

      const taggedMeds = clientResult.medications.map((m) => ({
        ...m,
        patientId: selectedPatientId,
        prescribedBy: assigningDoctor,
        doctorSpecialty: assigningSpecialty,
        prescribedDate: new Date().toISOString().split('T')[0],
      }));

      setDocument(clientResult.document);
      setAllMedications((prev) => [...taggedMeds, ...prev]);
      setAuditLogs((prev) => [clientResult.auditLog, ...prev]);
      if (clientResult.rawOcrText) setRawOcrText(clientResult.rawOcrText);

      setIsUploading(false);
      setUploadProgressText('');
      return true;
    } catch (clientErr: any) {
      console.error('OCR Extraction error:', clientErr);
      setIsUploading(false);
      setUploadProgressText('');
      return false;
    }
  };

  const uploadPrescriptionFile = async (file: File): Promise<boolean> => {
    return uploadPrescriptionForDoctor(file);
  };

  // Flag a medication
  const flagMedication = async (id: string, discrepancyType: FlagDiscrepancyType, comment: string) => {
    const timestamp = getFormattedTime();
    let targetMedName = '';
    let targetPrescriber = '';

    setAllMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          targetMedName = med.name;
          targetPrescriber = med.prescribedBy || clinician.name;
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
      patientId: selectedPatientId,
      timestamp,
      medicationId: id,
      medicationName: targetMedName || 'Medication',
      actor: `${currentUserName} (Patient)`,
      role: 'PATIENT',
      eventType: 'FLAG_CREATED',
      summary: `Patient flagged discrepancy (${discrepancyType}): "${comment}"`,
      details: `Prescribing Physician: ${targetPrescriber}. Queued for clinical review.`,
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);

    fetch(`/api/prescriptions/${id}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discrepancyType, comment }),
    }).catch(() => {});
  };

  // Resolve medication flag or pending state
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

    setAllMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          targetMedName = med.name;
          const updatedMed: Medication = {
            ...med,
            status: 'VERIFIED',
            clinicianResolution: {
              action,
              clinicianName: clinician.name,
              clinicianNote: note,
              resolvedAt: timestamp,
              revisedValues,
            },
          };

          if (action === 'REVISE_MEDICATION' && revisedValues) {
            if (revisedValues.strength) updatedMed.strength = revisedValues.strength;
            if (revisedValues.instructions) updatedMed.instructions = revisedValues.instructions;
            eventType = 'MEDICATION_REVISED';
            summary = `${currentUserName} amended prescription: Strength set to ${revisedValues.strength || med.strength}. Note: "${note}"`;
          } else if (action === 'APPROVE_EXTRACTION') {
            eventType = 'EXTRACTION_APPROVED';
            summary = `${currentUserName} confirmed and approved AI extraction. Note: "${note}"`;
          } else {
            eventType = 'FLAG_DISMISSED';
            summary = `${currentUserName} reaffirmed prescription after review. Note: "${note}"`;
          }

          return updatedMed;
        }
        return med;
      })
    );

    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      patientId: selectedPatientId,
      timestamp,
      medicationId: id,
      medicationName: targetMedName || 'Medication',
      actor: currentUserName,
      role: 'CLINICIAN',
      eventType,
      summary,
      details: note,
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);

    fetch(`/api/prescriptions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note, revisedValues }),
    }).catch(() => {});
  };

  const uploadDocument = (fileName: string) => {
    const timestamp = getFormattedTime();
    setDocument({
      id: `doc-${Date.now()}`,
      patientId: selectedPatientId,
      fileName,
      fileSize: '2.1 MB',
      uploadedAt: timestamp,
      status: 'EXTRACTED',
      itemCount: 4,
    });
  };

  // Counts for currently active patient
  const total = currentPatientMeds.length;
  const verified = currentPatientMeds.filter((m) => m.status === 'VERIFIED').length;
  const flagged = currentPatientMeds.filter((m) => m.status === 'PATIENT_FLAGGED').length;
  const pending = currentPatientMeds.filter((m) => m.status === 'PENDING').length;
  const conflict = currentPatientMeds.filter((m) => m.status === 'CONFLICT').length;
  const needsClinicianReview = flagged + pending + conflict;

  return (
    <MedicationContext.Provider
      value={{
        medications,
        allMedications,
        activePortal,
        setActivePortal,
        patient,
        patients,
        selectedPatientId,
        setSelectedPatientId,
        availableDoctors,
        addConsultingDoctor,
        filterDoctorName,
        setFilterDoctorName,
        patientReviewCounts,
        clinician,
        currentUserName,
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
        uploadPrescriptionForDoctor,
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
