import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthUser,
  UserRole,
  PatientUser,
  PhysicianUser,
  PatientRegisterInput,
  PhysicianRegisterInput,
} from '../types/auth';
import { initialAuthUsers, defaultPhysicianUser, defaultPatientUser } from '../data/mockUsers';

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  activeRole: UserRole | null;
  login: (email: string, password?: string, intendedRole?: UserRole) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  loginDemo: (role: UserRole) => void;
  registerPatient: (input: PatientRegisterInput) => Promise<{ success: boolean; error?: string; user?: PatientUser }>;
  registerPhysician: (input: PhysicianRegisterInput) => Promise<{ success: boolean; error?: string; user?: PhysicianUser }>;
  logout: () => void;
  allUsers: AuthUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'medtrace_auth_user_session';
const STORAGE_KEY_USERS_DB = 'medtrace_registered_users_db';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<AuthUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored users:', e);
    }
    return initialAuthUsers;
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse current user session:', e);
    }
    return null;
  });

  // Save users db to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(allUsers));
    } catch (e) {
      console.warn('Failed to persist users to localStorage:', e);
    }
  }, [allUsers]);

  // Save current active user session
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.warn('Failed to persist session to localStorage:', e);
    }
  }, [currentUser]);

  // Login handler
  const login = async (
    email: string,
    password?: string,
    intendedRole?: UserRole
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try server backend if reachable
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, role: intendedRole }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          return { success: true, user: data.user };
        }
      }
    } catch {
      // Backend not running or unreachable, fallback to client-side auth DB
    }

    // 2. Client-side authentication lookup
    let matchedUser = allUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    // If matching by email failed, but intended role is provided and email contains "dr" or "doc", check physician
    if (!matchedUser && intendedRole) {
      matchedUser = allUsers.find((u) => u.role === intendedRole && (u.email.toLowerCase() === cleanEmail || u.name.toLowerCase().includes(cleanEmail)));
    }

    // If still not matched, check if it's default accounts
    if (!matchedUser) {
      if (intendedRole === 'physician' && (cleanEmail.includes('dr') || cleanEmail.includes('physician') || cleanEmail.includes('doctor'))) {
        matchedUser = defaultPhysicianUser;
      } else if (intendedRole === 'patient' && (cleanEmail.includes('patient') || cleanEmail.includes('sharma') || cleanEmail.includes('arjun'))) {
        matchedUser = defaultPatientUser;
      }
    }

    if (!matchedUser) {
      return {
        success: false,
        error: `No account found for "${email}". Please verify your credentials or register a new account.`,
      };
    }

    if (intendedRole && matchedUser.role !== intendedRole) {
      return {
        success: false,
        error: `This account is registered as a ${matchedUser.role}. Please log in using the ${matchedUser.role === 'physician' ? 'Physician' : 'Patient'} portal tab.`,
      };
    }

    // Check password if provided and user has a password set
    if (password && matchedUser.password && matchedUser.password !== password) {
      // In clinical demo mode, if password matches 'password123' or 'doctor123' or 'patient123' allow
      const allowedDemo = ['password123', 'doctor123', 'patient123', 'admin', 'test'];
      if (!allowedDemo.includes(password)) {
        return {
          success: false,
          error: 'Incorrect password. Please try again or use the 1-click Quick Demo Login.',
        };
      }
    }

    setCurrentUser(matchedUser);
    return { success: true, user: matchedUser };
  };

  // 1-Click Demo Login
  const loginDemo = (role: UserRole) => {
    if (role === 'physician') {
      const existing = allUsers.find((u) => u.role === 'physician') || defaultPhysicianUser;
      setCurrentUser(existing);
    } else {
      const existing = allUsers.find((u) => u.role === 'patient') || defaultPatientUser;
      setCurrentUser(existing);
    }
  };

  // Register Patient
  const registerPatient = async (
    input: PatientRegisterInput
  ): Promise<{ success: boolean; error?: string; user?: PatientUser }> => {
    const cleanEmail = input.email.trim().toLowerCase();

    // Check if email already registered
    const exists = allUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        error: `An account with email "${input.email}" already exists. Please log in instead.`,
      };
    }

    const newPatient: PatientUser = {
      id: `usr-pat-${Date.now()}`,
      role: 'patient',
      email: cleanEmail,
      name: input.name.trim(),
      password: input.password,
      dob: input.dob || '1990-01-01',
      mrn: input.mrn?.trim() || `PT-${Math.floor(10000 + Math.random() * 90000)}`,
      assignedDoctor: input.assignedDoctor?.trim() || 'Dr. Rajesh Iyer, MD',
      clinic: input.clinic?.trim() || 'Metro Health Primary Care',
      phone: input.phone?.trim() || '(555) 019-2831',
      createdAt: new Date().toISOString(),
    };

    // Try server sync
    try {
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      }).catch(() => {});
    } catch {}

    setAllUsers((prev) => [newPatient, ...prev]);
    setCurrentUser(newPatient);

    return { success: true, user: newPatient };
  };

  // Register Physician
  const registerPhysician = async (
    input: PhysicianRegisterInput
  ): Promise<{ success: boolean; error?: string; user?: PhysicianUser }> => {
    const cleanEmail = input.email.trim().toLowerCase();

    // Check if email already registered
    const exists = allUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        error: `An account with email "${input.email}" already exists. Please log in instead.`,
      };
    }

    const npiClean = input.npi.trim();
    if (!/^\d{10}$/.test(npiClean)) {
      return {
        success: false,
        error: 'National Provider Identifier (NPI) must be a valid 10-digit number.',
      };
    }

    const formattedName = input.name.trim().startsWith('Dr.')
      ? input.name.trim()
      : `Dr. ${input.name.trim()}`;

    const newPhysician: PhysicianUser = {
      id: `usr-phy-${Date.now()}`,
      role: 'physician',
      email: cleanEmail,
      name: formattedName.includes(', MD') ? formattedName : `${formattedName}, MD`,
      password: input.password,
      npi: npiClean,
      title: input.title?.trim() || 'Attending Physician',
      specialty: input.specialty?.trim() || 'Internal Medicine',
      clinic: input.clinic?.trim() || 'Metro Health Primary Care',
      licenseNumber: input.licenseNumber?.trim() || `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
    };

    // Try server sync
    try {
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhysician),
      }).catch(() => {});
    } catch {}

    setAllUsers((prev) => [newPhysician, ...prev]);
    setCurrentUser(newPhysician);

    return { success: true, user: newPhysician };
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        activeRole: currentUser?.role || null,
        login,
        loginDemo,
        registerPatient,
        registerPhysician,
        logout,
        allUsers,
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
