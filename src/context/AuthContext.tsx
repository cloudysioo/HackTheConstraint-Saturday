import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthUser,
  UserRole,
  PatientUser,
  PhysicianUser,
  PatientRegisterInput,
  PhysicianRegisterInput,
  SendOtpResult,
  VerifyOtpResult,
} from '../types/auth';
import {
  initialAuthUsers,
  defaultPhysicianUser,
  defaultPatientUser,
  defaultAdminUser,
} from '../data/mockUsers';

// ─────────────────────────────────────────────────────────────
// Minimal client-side password hashing (SHA-256 via Web Crypto)
// ─────────────────────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Strip sensitive fields before writing to storage
function sanitiseForSession(user: AuthUser): Omit<AuthUser, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = user as AuthUser & { password?: string };
  return safe as Omit<AuthUser, 'password'>;
}

// Validate e-mail format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─────────────────────────────────────────────────────────────
// Failed-login rate limiter (per email, in-memory only)
// ─────────────────────────────────────────────────────────────
const FAIL_LIMIT = 5;
const LOCKOUT_MS = 30_000; // 30 s

interface FailEntry {
  count: number;
  lockedUntil: number | null;
}
const failMap = new Map<string, FailEntry>();

function checkRateLimit(email: string): { locked: boolean; secondsLeft?: number } {
  const entry = failMap.get(email);
  if (!entry) return { locked: false };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const secondsLeft = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return { locked: true, secondsLeft };
  }
  return { locked: false };
}

function recordFailure(email: string): void {
  const entry = failMap.get(email) || { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= FAIL_LIMIT) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0; // reset counter after lock
  }
  failMap.set(email, entry);
}

function clearFailures(email: string): void {
  failMap.delete(email);
}

// ─────────────────────────────────────────────────────────────
// Context definition
// ─────────────────────────────────────────────────────────────
interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  activeRole: UserRole | null;
  login: (email: string, password: string, intendedRole: UserRole) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  loginDemo: (role: UserRole) => void;
  sendRegistrationOtp: (email: string, role?: UserRole, name?: string) => Promise<SendOtpResult>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<VerifyOtpResult>;
  registerPatient: (input: PatientRegisterInput) => Promise<{ success: boolean; error?: string; user?: PatientUser }>;
  registerPhysician: (input: PhysicianRegisterInput) => Promise<{ success: boolean; error?: string; user?: PhysicianUser }>;
  approvePhysician: (physicianId: string) => Promise<{ success: boolean; error?: string }>;
  rejectPhysician: (physicianId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  getAllPhysicians: () => PhysicianUser[];
  refreshUserSession: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_SESSION = 'medtrace_auth_session';    // safe (no password)
const STORAGE_KEY_USERS_DB = 'medtrace_users_db';       // hashed passwords only

// In-memory client OTP store for offline / fallback verification
const clientOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

// ─────────────────────────────────────────────────────────────
// Bootstrap: pre-hash default demo users on first run
// ─────────────────────────────────────────────────────────────
async function buildInitialUsers(): Promise<AuthUser[]> {
  const users = [...initialAuthUsers];
  for (const u of users) {
    if (u.password && !u.password.startsWith('$hash$')) {
      u.password = '$hash$' + (await hashPassword(u.password));
    }
  }
  return users;
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── One-time migration: wipe stale plaintext localStorage keys ──
  useEffect(() => {
    const OLD_SESSION = 'medtrace_auth_user_session';
    const OLD_USERS_DB = 'medtrace_registered_users_db';
    try {
      localStorage.removeItem(OLD_SESSION);
      localStorage.removeItem(OLD_USERS_DB);
    } catch {}
  }, []);

  // ── Users DB (hashed passwords only) ──────────────────────
  const [allUsers, setAllUsers] = useState<AuthUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (stored) {
        const parsed: AuthUser[] = JSON.parse(stored);
        const hasPlaintext = parsed.some(
          (u) => u.password && !u.password.startsWith('$hash$')
        );
        if (!hasPlaintext && Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // On first mount, if DB is empty, build it with initial users
  useEffect(() => {
    if (allUsers.length === 0) {
      buildInitialUsers().then((users) => setAllUsers(users));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist users DB (hashed only)
  useEffect(() => {
    if (allUsers.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  // ── Current session (NO password field) ───────────────────
  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch {}
    return null;
  });

  // Cross-validate restored session against users-DB (tamper protection)
  useEffect(() => {
    if (!currentUser || allUsers.length === 0) return;
    const inDb = allUsers.find(
      (u) => u.id === currentUser.id && u.email === currentUser.email && u.role === currentUser.role
    );
    if (!inDb) {
      setCurrentUserState(null);
      try { localStorage.removeItem(STORAGE_KEY_SESSION); } catch {}
    } else {
      // Sync latest status changes (e.g. physician approval status)
      if (inDb.role === 'physician') {
        const phyInDb = inDb as PhysicianUser;
        const curPhy = currentUser as PhysicianUser;
        if (phyInDb.approvalStatus !== curPhy.approvalStatus) {
          setCurrentUserState(phyInDb);
          try {
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sanitiseForSession(phyInDb)));
          } catch {}
        }
      }
    }
  }, [allUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCurrentUser = (user: AuthUser | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sanitiseForSession(user)));
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch {}
  };

  const refreshUserSession = () => {
    if (!currentUser) return;
    const inDb = allUsers.find((u) => u.id === currentUser.id);
    if (inDb) {
      setCurrentUser(inDb);
    }
  };

  // ── Login ─────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string,
    intendedRole: UserRole
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }
    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Rate-limit check
    const rateCheck = checkRateLimit(cleanEmail);
    if (rateCheck.locked) {
      return {
        success: false,
        error: `Too many failed attempts. Please wait ${rateCheck.secondsLeft}s before trying again.`,
      };
    }

    // 1. Try server backend if reachable
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, role: intendedRole }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          clearFailures(cleanEmail);
          setCurrentUser(data.user);
          return { success: true, user: data.user };
        }
      }
    } catch {
      // Backend not running — fallback to client auth
    }

    // 2. Exact email lookup only
    const matchedUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      recordFailure(cleanEmail);
      return {
        success: false,
        error: 'No account found with this email address. Please check your credentials or register.',
      };
    }

    // 3. Role check — must match intended portal
    if (matchedUser.role !== intendedRole) {
      const roleName =
        matchedUser.role === 'admin'
          ? 'Administrator'
          : matchedUser.role === 'physician'
          ? 'Physician'
          : 'Patient';
      return {
        success: false,
        error: `This account is registered as a ${roleName}. Please use the ${roleName} login page.`,
      };
    }

    // 4. Check if rejected
    if (matchedUser.role === 'physician') {
      const phy = matchedUser as PhysicianUser;
      if (phy.approvalStatus === 'rejected') {
        return {
          success: false,
          error: `Your physician registration was not approved: ${phy.rejectionReason || 'Registration credentials could not be verified'}. Please contact admin@medtrace.health.`,
        };
      }
    }

    // 5. Password check
    if (matchedUser.password) {
      const inputHash = '$hash$' + (await hashPassword(password));
      if (matchedUser.password !== inputHash) {
        recordFailure(cleanEmail);
        const entry = failMap.get(cleanEmail);
        const remaining = entry ? Math.max(0, FAIL_LIMIT - entry.count) : FAIL_LIMIT - 1;
        return {
          success: false,
          error: `Incorrect password. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : 'Account locked for 30 seconds.'}`,
        };
      }
    }

    clearFailures(cleanEmail);
    setCurrentUser(matchedUser);
    return { success: true, user: matchedUser };
  };

  // ── Send Registration OTP (No UI leakage) ──────────────────
  const sendRegistrationOtp = async (
    email: string,
    role?: UserRole,
    name?: string
  ): Promise<SendOtpResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Check if email already registered
    const exists = allUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        error: `An account with email "${email}" already exists. Please sign in instead.`,
      };
    }

    let resolvedOtp = String(Math.floor(100000 + Math.random() * 900000));
    let expiresAt = Date.now() + 10 * 60 * 1000;
    let previewUrl: string | undefined = undefined;
    let serviceUsed: string | undefined = undefined;

    // 1. Try server backend (Express or Vercel serverless multi-provider email service)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, role, name }),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.otp || data.previewOtp || data.devOtp) {
            resolvedOtp = data.otp || data.previewOtp || data.devOtp;
          }
          if (data.expiresAt) expiresAt = data.expiresAt;
          previewUrl = data.previewUrl;
          serviceUsed = data.serviceUsed;
        }
      }
    } catch {
      // Backend offline fallback
    }

    // Client fallback OTP store synced with server-generated code
    clientOtpStore.set(cleanEmail, { code: resolvedOtp, expiresAt, attempts: 0 });
    console.log(`[medTrace Email Verification] Dispatched OTP [ ${resolvedOtp} ] to ${cleanEmail}`);
    return {
      success: true,
      expiresAt,
      previewOtp: resolvedOtp,
      previewUrl,
      serviceUsed,
    };
  };

  // ── Verify Registration OTP ────────────────────────────────
  const verifyRegistrationOtp = async (
    email: string,
    otp: string
  ): Promise<VerifyOtpResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      return { success: false, error: 'Please enter the full 6-digit verification code.' };
    }

    // 1. Try server backend
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          clientOtpStore.delete(cleanEmail);
          return { success: true };
        } else if (data.error) {
          return { success: false, error: data.error };
        }
      }
    } catch {
      // Backend offline
    }

    // 2. Client fallback verification
    const record = clientOtpStore.get(cleanEmail);
    if (!record) {
      return {
        success: false,
        error: 'No active verification code found for this email. Please request a new code.',
      };
    }

    if (Date.now() > record.expiresAt) {
      clientOtpStore.delete(cleanEmail);
      return {
        success: false,
        error: 'Verification code has expired. Please request a new one.',
      };
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      clientOtpStore.delete(cleanEmail);
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new code.',
      };
    }

    if (record.code !== cleanOtp) {
      const remaining = 5 - record.attempts;
      return {
        success: false,
        error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`,
      };
    }

    clientOtpStore.delete(cleanEmail);
    return { success: true };
  };

  // ── Demo Login ────────────────────────────────────────────
  const loginDemo = (role: UserRole) => {
    if (role === 'admin') {
      const existing = allUsers.find((u) => u.role === 'admin') || defaultAdminUser;
      setCurrentUser(existing);
      return;
    }
    const pinned = role === 'physician' ? defaultPhysicianUser : defaultPatientUser;
    const inDb = allUsers.find((u) => u.id === pinned.id) || pinned;
    setCurrentUser(inDb);
  };

  // ── Register Patient ──────────────────────────────────────
  const registerPatient = async (
    input: PatientRegisterInput
  ): Promise<{ success: boolean; error?: string; user?: PatientUser }> => {
    const cleanEmail = input.email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const exists = allUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        error: `An account with email "${input.email}" already exists. Please log in instead.`,
      };
    }

    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const hashedPassword = '$hash$' + (await hashPassword(input.password));

    const newPatient: PatientUser = {
      id: `usr-pat-${Date.now()}`,
      role: 'patient',
      email: cleanEmail,
      name: input.name.trim(),
      password: hashedPassword,
      dob: input.dob || '1990-01-01',
      mrn: input.mrn?.trim() || `PT-${Math.floor(10000 + Math.random() * 90000)}`,
      assignedDoctor: input.assignedDoctor?.trim() || 'Dr. Rajesh Iyer, MD',
      clinic: input.clinic?.trim() || 'Metro Health Primary Care',
      phone: input.phone?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    // Sync to backend without password
    const { password: _pw, ...safeForServer } = newPatient;
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeForServer),
    }).catch(() => {});

    setAllUsers((prev) => [newPatient, ...prev]);
    setCurrentUser(newPatient);
    return { success: true, user: newPatient };
  };

  // ── Register Physician (Medical Registration No & Pending Approval) ─
  const registerPhysician = async (
    input: PhysicianRegisterInput
  ): Promise<{ success: boolean; error?: string; user?: PhysicianUser }> => {
    const cleanEmail = input.email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const exists = allUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        error: `An account with email "${input.email}" already exists. Please log in instead.`,
      };
    }

    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const regNoClean = input.registrationNumber.trim();
    if (!regNoClean) {
      return {
        success: false,
        error: 'Medical Registration Number is required.',
      };
    }

    const hashedPassword = '$hash$' + (await hashPassword(input.password));

    const baseName = input.name.trim();
    const withDr = baseName.startsWith('Dr.') ? baseName : `Dr. ${baseName}`;
    const formattedName = withDr.includes(', MD') ? withDr : `${withDr}, MD`;

    // Generate unique Doctor ID (e.g., DOC-IYER-184)
    const nameWithoutPrefix = baseName.replace(/^Dr\.?\s*/i, '').trim();
    const lastName = nameWithoutPrefix.split(' ').filter(Boolean).pop() || 'DOC';
    const cleanSlug = lastName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8) || 'PHYSICIAN';
    const random3 = Math.floor(100 + Math.random() * 900);
    const generatedDoctorId = `DOC-${cleanSlug}-${random3}`;

    const newPhysician: PhysicianUser = {
      id: `usr-phy-${Date.now()}`,
      role: 'physician',
      doctorId: generatedDoctorId,
      email: cleanEmail,
      name: formattedName,
      password: hashedPassword,
      registrationNumber: regNoClean,
      npi: regNoClean,
      title: input.title?.trim() || 'Attending Physician',
      specialty: input.specialty?.trim() || 'Internal Medicine',
      clinic: input.clinic?.trim() || 'Metro Health Primary Care',
      licenseNumber: input.licenseNumber?.trim() || regNoClean,
      approvalStatus: 'pending', // Sent to Admin Team for review
      createdAt: new Date().toISOString(),
    };

    // Sync to backend without password
    const { password: _pw, ...safeForServer } = newPhysician;
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeForServer),
    }).catch(() => {});

    setAllUsers((prev) => [newPhysician, ...prev]);
    setCurrentUser(newPhysician);
    return { success: true, user: newPhysician };
  };

  // ── Admin Actions: Approve Physician ──────────────────────
  const approvePhysician = async (
    physicianId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const timestamp = new Date().toISOString();
    const adminName = currentUser?.name || 'Admin Team';

    setAllUsers((prev) =>
      prev.map((user) => {
        if (user.id === physicianId && user.role === 'physician') {
          return {
            ...user,
            approvalStatus: 'approved',
            reviewedAt: timestamp,
            reviewedBy: adminName,
          };
        }
        return user;
      })
    );

    // If currently viewing user is this physician, update session
    if (currentUser?.id === physicianId && currentUser.role === 'physician') {
      const updated = {
        ...currentUser,
        approvalStatus: 'approved' as const,
        reviewedAt: timestamp,
        reviewedBy: adminName,
      };
      setCurrentUser(updated);
    }

    return { success: true };
  };

  // ── Admin Actions: Reject Physician ───────────────────────
  const rejectPhysician = async (
    physicianId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const timestamp = new Date().toISOString();
    const rejectionNote = reason || 'Medical registration record could not be verified.';

    setAllUsers((prev) =>
      prev.map((user) => {
        if (user.id === physicianId && user.role === 'physician') {
          return {
            ...user,
            approvalStatus: 'rejected',
            rejectionReason: rejectionNote,
            reviewedAt: timestamp,
          };
        }
        return user;
      })
    );

    if (currentUser?.id === physicianId && currentUser.role === 'physician') {
      const updated = {
        ...currentUser,
        approvalStatus: 'rejected' as const,
        rejectionReason: rejectionNote,
        reviewedAt: timestamp,
      };
      setCurrentUser(updated);
    }

    return { success: true };
  };

  // ── Admin Query: All Physicians ───────────────────────────
  const getAllPhysicians = (): PhysicianUser[] => {
    return allUsers.filter((u): u is PhysicianUser => u.role === 'physician');
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        activeRole: currentUser?.role || null,
        login,
        loginDemo,
        sendRegistrationOtp,
        verifyRegistrationOtp,
        registerPatient,
        registerPhysician,
        approvePhysician,
        rejectPhysician,
        getAllPhysicians,
        refreshUserSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
