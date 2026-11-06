export type UserRole = 'patient' | 'physician' | 'admin';

export type PhysicianApprovalStatus = 'pending' | 'approved' | 'rejected';

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
  doctorId: string; // Unique App-generated Doctor ID for patient linking (e.g. DOC-IYER-184)
  registrationNumber: string; // Medical Registration Number (replaces strict 10-digit NPI)
  npi?: string; // Optional legacy NPI
  title: string;
  specialty: string;
  clinic: string;
  licenseNumber?: string;
  approvalStatus: PhysicianApprovalStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  department?: string;
}

export type AuthUser = PatientUser | PhysicianUser | AdminUser;

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
  registrationNumber: string;
  title?: string;
  specialty?: string;
  clinic?: string;
  licenseNumber?: string;
}

export interface SendOtpResult {
  success: boolean;
  error?: string;
  previewOtp?: string;
  expiresAt?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
}
