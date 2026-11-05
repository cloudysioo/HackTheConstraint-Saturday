import React from 'react';
import { Pill, UserCheck, Stethoscope } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';

export const Navbar: React.FC = () => {
  const { activePortal, setActivePortal, patient, clinician, counts } = useMedications();

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-white shadow-md border-b border-primary-hover">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-secondary shadow-inner">
              <Pill className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  MedTrace
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-secondary/20 text-secondary px-2 py-0.5 rounded-full border border-secondary/30">
                  Continuity Engine
                </span>
              </div>
              <p className="text-xs text-white/70 hidden md:block">
                The Forgotten Prescription • Closed-Loop Handover Safety
              </p>
            </div>
          </div>

          {/* Central Portal Switcher */}
          <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/15">
            <button
              type="button"
              onClick={() => setActivePortal('patient')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePortal === 'patient'
                  ? 'bg-white text-primary shadow-sm font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-secondary" />
              <span>Patient Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePortal('clinician')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activePortal === 'clinician'
                  ? 'bg-white text-primary shadow-sm font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5 text-secondary" />
              <span>Clinician Portal</span>
              {counts.needsClinicianReview > 0 && (
                <span className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-warning text-white">
                  {counts.needsClinicianReview}
                </span>
              )}
            </button>
          </div>

          {/* User Context & Credentials */}
          <div className="hidden lg:flex items-center pl-3 border-l border-white/20">
            {activePortal === 'patient' ? (
              <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                <div className="w-7 h-7 rounded-full bg-secondary/30 text-white flex items-center justify-center font-bold text-xs">
                  JD
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-white">{patient.name}</div>
                  <div className="text-white/60 text-[10px]">MRN: {patient.id}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                <div className="w-7 h-7 rounded-full bg-primary-light text-secondary flex items-center justify-center font-bold text-xs border border-secondary/40">
                  MD
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-white">{clinician.name}</div>
                  <div className="text-secondary text-[10px] font-mono">NPI: {clinician.npi}</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
