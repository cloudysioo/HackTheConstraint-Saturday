export type UserRole = 'patient' | 'physician';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}

export interface PatientUser extends BaseUser {
  role: 'patient';
  dob: string;
  mrn: string; // Medical Record Number
  assignedDoctor: string;
  clinic: string;
  phone?: string;
}

export interface PhysicianUser extends BaseUser {
  role: 'physician';
  npi: string; // National Provider Identifier
  title: string;
  specialty: string;
  clinic: string;
  licenseNumber?: string;
}

export type AuthUser = PatientUser | PhysicianUser;

export interface PatientRegisterInput {
  name: string;
  email: string;
  password: string;
  dob: string;
  mrn?: string;
  assignedDoctor?: string;
  clinic?: string;
  phone?: string;
}

export interface PhysicianRegisterInput {
  name: string;
  email: string;
  password: string;
  npi: string;
  title?: string;
  specialty?: string;
  clinic?: string;
  licenseNumber?: string;
}
