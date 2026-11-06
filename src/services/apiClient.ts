import { PatientProfile, ConsultingDoctor } from '../types/medication';
import { AuthUser } from '../types/auth';

/**
 * Robust Cross-Device API Client
 * Sends care team requests, doctor approvals, and patient synchronizations
 * to the shared server backend so multiple devices (phones, laptops, tablets)
 * stay in perfect real-time sync.
 */
export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return null;
      }
      return (await res.json()) as T;
    } catch {
      // Backend unreachable or offline
      return null;
    }
  }

  // ── Patients & Care Team Synchronization ────────────────────

  static async getPatients(): Promise<PatientProfile[] | null> {
    const data = await this.request<{ success: boolean; patients: PatientProfile[] }>('/api/patients');
    return data && Array.isArray(data.patients) ? data.patients : null;
  }

  static async syncPatient(patient: PatientProfile): Promise<PatientProfile[] | null> {
    const data = await this.request<{ success: boolean; patients: PatientProfile[] }>('/api/patients/sync', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
    return data?.patients || null;
  }

  static async requestCareTeamDoctor(
    patientId: string,
    doctor: ConsultingDoctor,
    actor: string
  ): Promise<{ success: boolean; patients: PatientProfile[]; doctor: ConsultingDoctor } | null> {
    return this.request<{ success: boolean; patients: PatientProfile[]; doctor: ConsultingDoctor }>(
      '/api/patients/care-team/request',
      {
        method: 'POST',
        body: JSON.stringify({ patientId, doctor, actor }),
      }
    );
  }

  static async approveCareTeamDoctor(
    patientId: string,
    doctorId: string,
    actor: string
  ): Promise<{ success: boolean; patients: PatientProfile[] } | null> {
    return this.request<{ success: boolean; patients: PatientProfile[] }>(
      '/api/patients/care-team/approve',
      {
        method: 'POST',
        body: JSON.stringify({ patientId, doctorId, actor }),
      }
    );
  }

  static async rejectCareTeamDoctor(
    patientId: string,
    doctorId: string,
    actor: string
  ): Promise<{ success: boolean; patients: PatientProfile[] } | null> {
    return this.request<{ success: boolean; patients: PatientProfile[] }>(
      '/api/patients/care-team/reject',
      {
        method: 'POST',
        body: JSON.stringify({ patientId, doctorId, actor }),
      }
    );
  }

  static async cancelCareTeamDoctor(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; patients: PatientProfile[] } | null> {
    return this.request<{ success: boolean; patients: PatientProfile[] }>(
      '/api/patients/care-team/cancel',
      {
        method: 'POST',
        body: JSON.stringify({ patientId, doctorId }),
      }
    );
  }

  static async removeCareTeamDoctor(
    patientId: string,
    doctorId: string,
    actor: string
  ): Promise<{ success: boolean; patients: PatientProfile[] } | null> {
    return this.request<{ success: boolean; patients: PatientProfile[] }>(
      '/api/patients/care-team/remove',
      {
        method: 'POST',
        body: JSON.stringify({ patientId, doctorId, actor }),
      }
    );
  }

  static async clearPatientData(
    patientId: string,
    actor: string
  ): Promise<{ success: boolean; patients: PatientProfile[] } | null> {
    return this.request<{ success: boolean; patients: PatientProfile[] }>(
      '/api/patients/clear-data',
      {
        method: 'POST',
        body: JSON.stringify({ patientId, actor }),
      }
    );
  }

  // ── Doctor Directory ─────────────────────────────────────────

  static async getDoctors(): Promise<ConsultingDoctor[] | null> {
    const data = await this.request<{ success: boolean; doctors: ConsultingDoctor[] }>('/api/doctors');
    return data && Array.isArray(data.doctors) ? data.doctors : null;
  }

  static async saveDoctor(doctor: ConsultingDoctor): Promise<ConsultingDoctor[] | null> {
    const data = await this.request<{ success: boolean; doctors: ConsultingDoctor[] }>('/api/doctors', {
      method: 'POST',
      body: JSON.stringify(doctor),
    });
    return data?.doctors || null;
  }

  // ── Users & Credential Authentication ───────────────────────

  static async getUsers(): Promise<AuthUser[] | null> {
    const data = await this.request<{ success: boolean; users: AuthUser[] }>('/api/auth/users');
    return data && Array.isArray(data.users) ? data.users : null;
  }

  static async registerUser(user: AuthUser): Promise<boolean> {
    const data = await this.request<{ success: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return Boolean(data?.success);
  }

  static async approvePhysician(physicianId: string, actor: string): Promise<boolean> {
    const data = await this.request<{ success: boolean }>('/api/auth/physicians/approve', {
      method: 'POST',
      body: JSON.stringify({ physicianId, actor }),
    });
    return Boolean(data?.success);
  }

  static async rejectPhysician(physicianId: string, reason?: string): Promise<boolean> {
    const data = await this.request<{ success: boolean }>('/api/auth/physicians/reject', {
      method: 'POST',
      body: JSON.stringify({ physicianId, reason }),
    });
    return Boolean(data?.success);
  }
}
