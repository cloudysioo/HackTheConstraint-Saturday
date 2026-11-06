import { PatientUser, PhysicianUser, AdminUser, AuthUser } from '../types/auth';

// NOTE: Passwords are stored as SHA-256 hashes prefixed with "$hash$".
// Raw value "password123" hashes to the value below.
// You can verify: https://emn178.github.io/online-tools/sha256.html
const DEMO_HASH = '$hash$ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

export const defaultPhysicianUser: PhysicianUser = {
  doctorId: 'DOC-IYER-184',
  id: 'usr-phy-demo-1',
  role: 'physician',
  email: 'doctor@medtrace.health',
  name: 'Dr. Rajesh Iyer, MD',
  password: DEMO_HASH,
  title: 'Lead Primary Care Physician',
  specialty: 'Internal Medicine & Continuity Care',
  registrationNumber: 'MED-184920491',
  npi: '1849204911',
  clinic: 'Metro Health Primary Care',
  licenseNumber: 'MD-9204812',
  approvalStatus: 'approved',
  reviewedAt: '2026-01-10T09:00:00.000Z',
  reviewedBy: 'Admin Team',
  createdAt: '2026-01-10T08:00:00.000Z',
};

export const defaultPatientUser: PatientUser = {
  id: 'usr-pat-demo-1',
  role: 'patient',
  email: 'patient@medtrace.health',
  name: 'Arjun Sharma',
  password: DEMO_HASH,
  dob: '1968-04-12',
  mrn: 'PT-94021',
  assignedDoctor: 'Dr. Rajesh Iyer, MD',
  clinic: 'Metro Health Primary Care',
  phone: '(555) 349-2819',
  createdAt: '2026-01-12T09:30:00.000Z',
};

export const defaultAdminUser: AdminUser = {
  id: 'usr-admin-1',
  role: 'admin',
  email: 'admin@medtrace.health',
  name: 'Clinical Admin Lead',
  password: DEMO_HASH,
  department: 'Medical Credentialing & Handover Safety',
  createdAt: '2026-01-01T08:00:00.000Z',
};

export const initialAuthUsers: AuthUser[] = [
  defaultPhysicianUser,
  defaultPatientUser,
  defaultAdminUser,
];
