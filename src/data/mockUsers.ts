import { PatientUser, PhysicianUser, AuthUser } from '../types/auth';

export const defaultPhysicianUser: PhysicianUser = {
  id: 'usr-phy-1',
  role: 'physician',
  email: 'doctor@medtrace.health',
  name: 'Dr. Rajesh Iyer, MD',
  password: 'password123',
  title: 'Lead Primary Care Physician',
  specialty: 'Internal Medicine & Continuity Care',
  npi: '184920491',
  clinic: 'Metro Health Primary Care',
  licenseNumber: 'MD-9204812',
  createdAt: '2026-01-10T08:00:00.000Z',
};

export const defaultPatientUser: PatientUser = {
  id: 'usr-pat-1',
  role: 'patient',
  email: 'patient@medtrace.health',
  name: 'Arjun Sharma',
  password: 'password123',
  dob: '1968-04-12',
  mrn: 'PT-94021',
  assignedDoctor: 'Dr. Rajesh Iyer, MD',
  clinic: 'Metro Health Primary Care',
  phone: '(555) 349-2819',
  createdAt: '2026-01-12T09:30:00.000Z',
};

export const initialAuthUsers: AuthUser[] = [
  defaultPhysicianUser,
  defaultPatientUser,
];
