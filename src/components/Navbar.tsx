import React from 'react';
import { UserCheck, Stethoscope, LogOut, ShieldCheck } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';
import { useAuth } from '../context/AuthContext';
import { PatientUser, PhysicianUser } from '../types/auth';

export const Navbar: React.FC = () => {
  const { counts } = useMedications();
  const { currentUser, activeRole, logout } = useAuth();

  const patientUser = activeRole === 'patient' ? (currentUser as PatientUser) : null;
  const physicianUser = activeRole === 'physician' ? (currentUser as PhysicianUser) : null;

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-white shadow-md border-b border-primary-hover">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center space-x-3">
              <img
                src="/medtrace-logo-cropped.png"
                alt="medTrace"
                className="h-10 sm:h-12 w-auto object-contain"
              />
              <div className="hidden md:block">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary/20 text-secondary px-2 py-0.5 rounded-full border border-secondary/30">
                    Continuity Engine
                  </span>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5">
                  The Forgotten Prescription · Closed-Loop Handover Safety
                </p>
              </div>
            </div>
          </div>

          {/* Centre: active portal badge */}
          <div className="flex items-center bg-black/25 px-4 py-2 rounded-xl border border-white/15 gap-2">
            {activeRole === 'patient' ? (
              <>
                <UserCheck className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold text-white">Patient Portal</span>
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold text-white">Physician Portal</span>
                {counts.needsClinicianReview > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-warning text-white ml-1">
                    {counts.needsClinicianReview}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Right: user info + logout */}
          <div className="flex items-center gap-3">
            {/* User card */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                activeRole === 'patient'
                  ? 'bg-secondary/30 text-white'
                  : 'bg-primary-light text-secondary border border-secondary/40'
              }`}>
                {activeRole === 'physician' ? 'MD' : (currentUser?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'P')}
              </div>
              <div className="text-left text-xs leading-tight">
                <div className="font-semibold text-white">{currentUser?.name || '—'}</div>
                {patientUser && (
                  <div className="text-white/60 text-[10px]">MRN: {patientUser.mrn}</div>
                )}
                {physicianUser && (
                  <div className="text-secondary text-[10px] font-mono">NPI: {physicianUser.npi}</div>
                )}
              </div>
            </div>

            {/* HIPAA shield */}
            <div className="hidden lg:flex items-center gap-1 text-secondary/70 text-[10px] font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>HIPAA</span>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 border border-white/20 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
