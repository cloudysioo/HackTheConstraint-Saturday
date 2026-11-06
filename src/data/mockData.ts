import {
  Medication,
  UploadedDocument,
  PatientProfile,
  ClinicianProfile,
  ConsultingDoctor,
  AuditLogEntry,
} from '../types/medication';

// ── Master Consulting Doctors Directory ──────────────────────
export const mockDoctors: ConsultingDoctor[] = [
  {
    id: 'doc-iyer',
    doctorId: 'DOC-IYER-184',
    name: 'Dr. Rajesh Iyer, MD',
    specialty: 'Internal Medicine & Primary Care',
    clinic: 'Metro Health Primary Care',
    phone: '(555) 019-4820',
    email: 'doctor@medtrace.health',
    isPrimary: true,
    registrationNumber: 'MED-184920491',
  },
  {
    id: 'doc-sen',
    doctorId: 'DOC-SEN-938',
    name: 'Dr. Ananya Sen, MD',
    specialty: 'Interventional Cardiology',
    clinic: 'Metro Heart & Vascular Center',
    phone: '(555) 028-3921',
    email: 'ananya.sen@metroheart.org',
    registrationNumber: 'MED-938210482',
  },
  {
    id: 'doc-malhotra',
    doctorId: 'DOC-MALHOTRA-748',
    name: 'Dr. Vikram Malhotra, MD',
    specialty: 'Endocrinology & Diabetology',
    clinic: 'Metro Diabetes & Endocrine Institute',
    phone: '(555) 039-1182',
    email: 'v.malhotra@metroendocrine.org',
    registrationNumber: 'MED-748291048',
  },
  {
    id: 'doc-sharma',
    doctorId: 'DOC-SHARMA-638',
    name: 'Dr. Priya Sharma, MD',
    specialty: 'Pulmonology & Respiratory Medicine',
    clinic: 'Metro Respiratory Care Clinic',
    phone: '(555) 049-9281',
    email: 'p.sharma@metrochest.org',
    registrationNumber: 'MED-638291047',
  },
];

// ── Master Patients Directory (Each Patient with Multiple Consulting Doctors) ──
export const mockPatients: PatientProfile[] = [
  {
    id: 'PT-94021',
    name: 'Arjun Sharma',
    dob: '1968-04-12',
    doctor: 'Dr. Rajesh Iyer, MD',
    clinic: 'Metro Health Primary Care',
    phone: '(555) 349-2819',
    email: 'patient@medtrace.health',
    allergies: ['Penicillin', 'Sulfa Drugs'],
    conditions: ['Type 2 Diabetes', 'Coronary Stent (Post-PCI)', 'Hypertension'],
    careTeam: [
      mockDoctors[0], // Dr. Rajesh Iyer (Primary Care)
      mockDoctors[1], // Dr. Ananya Sen (Cardiology)
      mockDoctors[2], // Dr. Vikram Malhotra (Endocrinology)
    ],
  },
  {
    id: 'PT-38291',
    name: 'Meera Krishnan',
    dob: '1962-09-24',
    doctor: 'Dr. Rajesh Iyer, MD',
    clinic: 'Metro Health Primary Care',
    phone: '(555) 482-1920',
    email: 'meera.k@example.com',
    allergies: ['Aspirin (Bronchospasm)'],
    conditions: ['Adult-Onset Asthma', 'Essential Hypertension'],
    careTeam: [
      mockDoctors[0], // Dr. Rajesh Iyer (Primary Care)
      mockDoctors[3], // Dr. Priya Sharma (Pulmonology)
    ],
  },
  {
    id: 'PT-51042',
    name: 'Rohan Verma',
    dob: '1984-02-18',
    doctor: 'Dr. Rajesh Iyer, MD',
    clinic: 'Metro Health Primary Care',
    phone: '(555) 592-0192',
    email: 'rohan.verma@example.com',
    allergies: ['None Reported'],
    conditions: ['GERD', 'Arrhythmia Evaluation'],
    careTeam: [
      mockDoctors[0], // Dr. Rajesh Iyer (Primary Care)
      mockDoctors[1], // Dr. Ananya Sen (Cardiology)
    ],
  },
];

export const mockPatient: PatientProfile = mockPatients[0];

export const mockClinician: ClinicianProfile = {
  name: 'Dr. Rajesh Iyer, MD',
  title: 'Lead Primary Care Physician',
  npi: '184920491',
  clinic: 'Metro Health Primary Care',
  specialty: 'Internal Medicine & Primary Care',
  assignedPatientsCount: mockPatients.length,
};

// ── Realistic Cross-Doctor Medications Roster ─────────────────
export const initialMockMedications: Medication[] = [
  // ── Patient 1: Arjun Sharma (Consults 3 Doctors) ─────────────
  {
    id: 'med-101',
    patientId: 'PT-94021',
    name: 'Lisinopril',
    strength: '10mg',
    instructions: 'Take 1 tablet daily in the morning with water',
    sourceDocument: 'metro_primary_care_handover.pdf',
    confidence: 96,
    status: 'VERIFIED',
    prescribedBy: 'Dr. Rajesh Iyer, MD',
    doctorSpecialty: 'Internal Medicine & Primary Care',
    prescribedDate: '2026-01-15',
  },
  {
    id: 'med-102',
    patientId: 'PT-94021',
    name: 'Metformin HCl',
    strength: '500mg',
    instructions: 'Take 1 tablet twice daily with meals',
    sourceDocument: 'endocrine_consult_note.pdf',
    confidence: 94,
    status: 'VERIFIED',
    prescribedBy: 'Dr. Vikram Malhotra, MD',
    doctorSpecialty: 'Endocrinology & Diabetology',
    prescribedDate: '2026-01-20',
  },
  {
    id: 'med-103',
    patientId: 'PT-94021',
    name: 'Atorvastatin Calcium',
    strength: '20mg',
    instructions: 'Take 1 tablet at bedtime daily',
    sourceDocument: 'cardiology_stent_discharge.pdf',
    confidence: 98,
    status: 'VERIFIED',
    prescribedBy: 'Dr. Ananya Sen, MD',
    doctorSpecialty: 'Interventional Cardiology',
    prescribedDate: '2026-02-01',
  },
  {
    id: 'med-104',
    patientId: 'PT-94021',
    name: 'Clopidogrel (Plavix)',
    strength: '75mg',
    instructions: 'Take 1 tablet daily (dual antiplatelet post-stent)',
    sourceDocument: 'cardiology_stent_discharge.pdf',
    confidence: 92,
    status: 'PATIENT_FLAGGED',
    prescribedBy: 'Dr. Ananya Sen, MD',
    doctorSpecialty: 'Interventional Cardiology',
    prescribedDate: '2026-02-01',
    patientFlagNote: 'Dr. Sen verbally told me during my 6-month checkup to stop this, but it still shows active on my chart.',
    flagDetails: {
      discrepancyType: 'Wrong Instructions',
      comment: 'Dr. Sen verbally told me during my 6-month checkup to stop this, but it still shows active on my chart.',
      submittedAt: 'Today at 08:30 AM',
    },
  },
  {
    id: 'med-105',
    patientId: 'PT-94021',
    name: 'Ibuprofen',
    strength: '400mg',
    instructions: 'Take 1 tablet every 8 hours as needed for back pain',
    sourceDocument: 'primary_care_walkin_rx.pdf',
    confidence: 89,
    status: 'CONFLICT',
    prescribedBy: 'Dr. Rajesh Iyer, MD',
    doctorSpecialty: 'Internal Medicine & Primary Care',
    prescribedDate: '2026-02-04',
    conflictDetails: {
      severity: 'HIGH',
      description: 'Severe Cross-Doctor Drug Interaction: Ibuprofen (prescribed by Primary Care) co-administered with Clopidogrel (prescribed by Cardiology) significantly elevates gastrointestinal bleeding & ulceration risk.',
      conflictingWith: 'Clopidogrel (Plavix) 75mg',
      prescribedByOtherDoctor: 'Dr. Ananya Sen, MD (Interventional Cardiology)',
    },
  },

  // ── Patient 2: Meera Krishnan ────────────────────────────────
  {
    id: 'med-201',
    patientId: 'PT-38291',
    name: 'Amlodipine Besylate',
    strength: '5mg',
    instructions: 'Take 1 tablet once daily in the morning',
    sourceDocument: 'hypertension_followup.pdf',
    confidence: 95,
    status: 'VERIFIED',
    prescribedBy: 'Dr. Rajesh Iyer, MD',
    doctorSpecialty: 'Internal Medicine & Primary Care',
    prescribedDate: '2026-01-22',
  },
  {
    id: 'med-202',
    patientId: 'PT-38291',
    name: 'Montelukast Sodium',
    strength: '10mg',
    instructions: 'Take 1 tablet daily at bedtime for asthma control',
    sourceDocument: 'respiratory_care_rx.pdf',
    confidence: 87,
    status: 'PENDING',
    prescribedBy: 'Dr. Priya Sharma, MD',
    doctorSpecialty: 'Pulmonology & Respiratory Medicine',
    prescribedDate: '2026-02-03',
  },
  {
    id: 'med-203',
    patientId: 'PT-38291',
    name: 'Fluticasone Propionate Inhaler',
    strength: '110mcg',
    instructions: 'Inhale 2 puffs twice daily; rinse mouth after use',
    sourceDocument: 'respiratory_care_rx.pdf',
    confidence: 97,
    status: 'VERIFIED',
    prescribedBy: 'Dr. Priya Sharma, MD',
    doctorSpecialty: 'Pulmonology & Respiratory Medicine',
    prescribedDate: '2026-02-03',
  },

  // ── Patient 3: Rohan Verma ───────────────────────────────────
  {
    id: 'med-301',
    patientId: 'PT-51042',
    name: 'Pantoprazole Sodium',
    strength: '40mg',
    instructions: 'Take 1 tablet once daily 30 minutes before breakfast',
    sourceDocument: 'gi_wellness_rx.pdf',
    confidence: 96,
    status: 'VERIFIED',
    prescribedBy: 'Dr. Rajesh Iyer, MD',
    doctorSpecialty: 'Internal Medicine & Primary Care',
    prescribedDate: '2026-01-28',
  },
  {
    id: 'med-302',
    patientId: 'PT-51042',
    name: 'Bisoprolol Fumarate',
    strength: '5mg',
    instructions: 'Take 1 tablet daily in the morning',
    sourceDocument: 'cardio_arrhythmia_eval.pdf',
    confidence: 93,
    status: 'VERIFIED',
    prescribedBy: 'Dr. Ananya Sen, MD',
    doctorSpecialty: 'Interventional Cardiology',
    prescribedDate: '2026-02-02',
  },
];

export const initialUploadedDocument: UploadedDocument | null = null;
export const mockUploadedDocument = initialUploadedDocument;

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-init-1',
    patientId: 'PT-94021',
    timestamp: 'Today at 08:32 AM',
    medicationId: 'med-104',
    medicationName: 'Clopidogrel (Plavix)',
    actor: 'Arjun Sharma (Patient)',
    role: 'PATIENT',
    eventType: 'FLAG_CREATED',
    summary: 'Patient flagged discrepancy on Cardiology prescription: "Dr. Sen verbally told me to stop taking this"',
    details: 'Discrepancy category: Wrong Instructions. Queued for Dr. Rajesh Iyer & Dr. Ananya Sen.',
  },
  {
    id: 'audit-init-2',
    patientId: 'PT-94021',
    timestamp: 'Today at 08:33 AM',
    medicationId: 'med-105',
    medicationName: 'Ibuprofen',
    actor: 'medTrace Continuity Engine',
    role: 'SYSTEM',
    eventType: 'CONFLICT_DETECTED',
    summary: 'Cross-Doctor Safety Alert: Ibuprofen (Dr. Iyer) conflicts with Clopidogrel (Dr. Sen)',
    details: 'Co-prescribing antiplatelet with NSAID increases bleeding risk. Handover reconciliation required.',
  },
];
