import { Medication, PrescriptionComparisonReport, ComparisonDiscrepancy, PatientProfile, ConsultingDoctor } from '../types/medication';
import { initialMockMedications, mockPatients, mockDoctors } from '../data/mockData';

const STORAGE_KEYS = {
  MEDICATIONS: 'medtrace_db_medications_v2',
  DOCUMENTS: 'medtrace_db_documents_v2',
  COMPARISONS: 'medtrace_db_comparisons_v2',
  AUDIT_LOGS: 'medtrace_db_audit_logs_v2',
  PATIENTS: 'medtrace_db_patients_v2',
  DOCTORS: 'medtrace_db_doctors_v2',
};

// Seed initial historical comparison to demonstrate the exact 4 flags from the clinical specification
export const initialSeedComparisons: PrescriptionComparisonReport[] = [
  {
    id: 'comp-report-seed-1',
    patientId: 'PT-94021',
    documentId: 'doc-seed-hospital',
    documentName: 'metro_hospital_discharge_summary.pdf',
    comparedAt: 'Today at 09:15 AM',
    prescribingDoctor: 'Dr. Ananya Sen, MD (Cardiology)',
    stats: {
      high: 1,
      medium: 2,
      low: 1,
      total: 4,
    },
    discrepancies: [
      {
        id: 'disc-seed-1',
        patientId: 'PT-94021',
        drugName: 'Metformin',
        genericName: 'Metformin',
        severity: 'HIGH',
        type: 'Conflict',
        description: 'Differing strengths, doses, or frequencies across visits',
        example: 'Metformin: 500 mg (GP) vs 850 mg (Hospital)',
        detectedAt: 'Today at 09:15 AM',
        status: 'PENDING_REVIEW',
        previousRecord: {
          medicineName: 'Metformin HCl 500mg',
          strength: '500 mg',
          frequency: '1 tablet twice daily',
          prescribedBy: 'Dr. Vikram Malhotra, MD (Endocrinology / GP)',
          prescribedDate: '2026-01-20',
          sourceDocument: 'endocrine_consult_note.pdf',
        },
        currentRecord: {
          medicineName: 'Metformin 850mg',
          strength: '850 mg',
          frequency: '1 tablet twice daily',
          prescribedBy: 'Metro General Hospital (Cardiology Inpatient)',
          prescribedDate: '2026-02-05',
          sourceDocument: 'metro_hospital_discharge_summary.pdf',
        },
      },
      {
        id: 'disc-seed-2',
        patientId: 'PT-94021',
        drugName: 'Amlodipine',
        genericName: 'Amlodipine',
        severity: 'MEDIUM',
        type: 'Missing Entry',
        description: 'A drug listed in previous visits disappears without an explicit stop order',
        example: 'Amlodipine present in GP & Pharmacy records, omitted at discharge',
        detectedAt: 'Today at 09:15 AM',
        status: 'PENDING_REVIEW',
        previousRecord: {
          medicineName: 'Amlodipine Besylate 5mg',
          strength: '5 mg',
          frequency: '1 tablet daily',
          prescribedBy: 'Dr. Rajesh Iyer, MD (GP & Primary Care)',
          prescribedDate: '2026-01-10',
          sourceDocument: 'metro_primary_care_handover.pdf',
        },
      },
      {
        id: 'disc-seed-3',
        patientId: 'PT-94021',
        drugName: 'Amoxicillin',
        genericName: 'Amoxicillin',
        severity: 'MEDIUM',
        type: 'Outdated',
        description: 'Time-limited therapy still shown as active after the intended end date',
        example: '7-day Amoxicillin course active 2 months post-prescription',
        detectedAt: 'Today at 09:15 AM',
        status: 'PENDING_REVIEW',
        previousRecord: {
          medicineName: 'Amoxicillin 500mg',
          strength: '500 mg',
          frequency: '1 capsule every 8 hours for 7 days',
          prescribedBy: 'Metro Urgent Care Clinic',
          prescribedDate: '2025-12-05',
          sourceDocument: 'urgent_care_bronchitis_rx.pdf',
        },
      },
      {
        id: 'disc-seed-4',
        patientId: 'PT-94021',
        drugName: 'Metformin',
        genericName: 'Metformin',
        severity: 'LOW',
        type: 'Name Variant',
        description: 'Brand vs. Generic name alignment needing quick confirmation',
        example: 'Glucophage matched with Metformin',
        detectedAt: 'Today at 09:15 AM',
        status: 'PENDING_REVIEW',
        previousRecord: {
          medicineName: 'Glucophage 500mg (Brand)',
          strength: '500 mg',
          prescribedBy: 'Dr. Vikram Malhotra, MD',
        },
        currentRecord: {
          medicineName: 'Metformin HCl 500mg (Generic)',
          strength: '500 mg',
          prescribedBy: 'Metro Health Primary Care',
        },
      },
    ],
  },
];

export class DatabaseService {
  /**
   * Loads all medications for patient from persistent storage
   */
  static getMedications(): Medication[] {
    if (typeof window === 'undefined') return initialMockMedications;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialMockMedications;
  }

  /**
   * Saves medications to persistent database
   */
  static saveMedications(medications: Medication[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    } catch (e) {
      console.warn('[DB Service] Could not save medications to localStorage:', e);
    }
  }

  /**
   * Adds new prescription medications into database and merges duplicates
   */
  static addPrescriptionMedications(newMeds: Medication[]): Medication[] {
    const existing = this.getMedications();
    // Prepend newly added medications so they appear prominently
    const updated = [...newMeds, ...existing];
    this.saveMedications(updated);
    return updated;
  }

  /**
   * Gets all historical comparison reports for a patient
   */
  static getComparisons(patientId: string): PrescriptionComparisonReport[] {
    if (typeof window === 'undefined') return initialSeedComparisons;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPARISONS);
      if (stored) {
        const parsed: PrescriptionComparisonReport[] = JSON.parse(stored);
        const filtered = parsed.filter((c) => c.patientId === patientId);
        if (filtered.length > 0) return filtered;
      }
    } catch {}
    return initialSeedComparisons.filter((c) => c.patientId === patientId);
  }

  /**
   * Saves a new comparison report to database
   */
  static saveComparison(report: PrescriptionComparisonReport): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPARISONS);
      const all: PrescriptionComparisonReport[] = stored ? JSON.parse(stored) : [...initialSeedComparisons];
      const updated = [report, ...all.filter((c) => c.id !== report.id)];
      localStorage.setItem(STORAGE_KEYS.COMPARISONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('[DB Service] Could not save comparison report:', e);
    }
  }

  /**
   * Updates discrepancy status (e.g. patient confirms or dismisses)
   */
  static updateDiscrepancyStatus(
    reportId: string,
    discrepancyId: string,
    status: ComparisonDiscrepancy['status']
  ): PrescriptionComparisonReport[] {
    if (typeof window === 'undefined') return initialSeedComparisons;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPARISONS);
      const all: PrescriptionComparisonReport[] = stored ? JSON.parse(stored) : [...initialSeedComparisons];
      const updated = all.map((report) => {
        if (report.id === reportId) {
          return {
            ...report,
            discrepancies: report.discrepancies.map((d) => (d.id === discrepancyId ? { ...d, status } : d)),
          };
        }
        return report;
      });
      localStorage.setItem(STORAGE_KEYS.COMPARISONS, JSON.stringify(updated));
      return updated;
    } catch {}
    return initialSeedComparisons;
  }

  /**
   * Loads all patient profiles (with care teams & approval states)
   */
  static getPatients(): PatientProfile[] {
    if (typeof window === 'undefined') return mockPatients;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return mockPatients;
  }

  /**
   * Persists patient profiles and their consulting care teams
   */
  static savePatients(patients: PatientProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.warn('[DB Service] Could not save patients to localStorage:', e);
    }
  }

  /**
   * Loads master consulting doctor directory
   */
  static getAvailableDoctors(): ConsultingDoctor[] {
    if (typeof window === 'undefined') return mockDoctors;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return mockDoctors;
  }

  /**
   * Persists master consulting doctor directory
   */
  static saveAvailableDoctors(doctors: ConsultingDoctor[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    } catch (e) {
      console.warn('[DB Service] Could not save doctors to localStorage:', e);
    }
  }
}
