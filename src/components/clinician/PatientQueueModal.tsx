import React, { useState } from 'react';
import {
  X,
  Search,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Users,
} from 'lucide-react';
import { PatientProfile } from '../../types/medication';

interface PatientQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientProfile[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  patientReviewCounts: Record<string, { needsReview: number; total: number; flagged: number; conflict: number }>;
}

export const PatientQueueModal: React.FC<PatientQueueModalProps> = ({
  isOpen,
  onClose,
  patients,
  selectedPatientId,
  onSelectPatient,
  patientReviewCounts,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.conditions && p.conditions.some((c) => c.toLowerCase().includes(q))) ||
      (p.careTeam && p.careTeam.some((d) => d.name.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold">Assigned Patient Queue & Multi-Doctor Roster</h3>
              <p className="text-xs text-white/70">Select a patient to reconcile prescriptions and cross-doctor handovers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search patients by name, MRN, condition, or consulting doctor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No patients found matching "{search}".
            </div>
          ) : (
            filtered.map((patient) => {
              const counts = patientReviewCounts[patient.id] || { needsReview: 0, total: 0, flagged: 0, conflict: 0 };
              const isSelected = patient.id === selectedPatientId;

              return (
                <div
                  key={patient.id}
                  onClick={() => {
                    onSelectPatient(patient.id);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/30'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 bg-white'
                  }`}
                >
                  {/* Left: Patient Details */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-secondary text-white'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-sm">{patient.name}</span>
                        <span className="font-mono text-[11px] text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                          {patient.id}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-secondary text-white font-bold px-2 py-0.2 rounded-full">
                            Active Chart
                          </span>
                        )}
                      </div>

                      {/* Care Team Specialists */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1 flex-wrap">
                        <Stethoscope className="h-3 w-3 text-secondary shrink-0" />
                        <span className="text-neutral-700 font-semibold">Co-managed with:</span>
                        <span>
                          {(patient.careTeam || [])
                            .filter((d) => d.approvalStatus !== 'PENDING_APPROVAL')
                            .map((d) => d.name.split(',')[0])
                            .join(', ') || 'Primary Care Sole Provider'}
                        </span>
                        {(patient.careTeam || []).some((d) => d.approvalStatus === 'PENDING_APPROVAL') && (
                          <span className="text-[10px] text-warning font-bold bg-warning/15 px-1.5 py-0.2 rounded">
                            {(patient.careTeam || []).filter((d) => d.approvalStatus === 'PENDING_APPROVAL').length} pending approval
                          </span>
                        )}
                      </div>

                      {/* Conditions */}
                      {patient.conditions && patient.conditions.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {patient.conditions.map((c, i) => (
                            <span key={i} className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Badges & Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {counts.conflict > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full border border-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{counts.conflict} Cross-Doctor Conflict</span>
                      </span>
                    )}

                    {counts.flagged > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full border border-amber-300">
                        <Flag className="h-3 w-3" />
                        <span>{counts.flagged} Flagged</span>
                      </span>
                    )}

                    {counts.needsReview === 0 && counts.total > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Reconciled</span>
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span>{patients.length} assigned patient charts under clinical care</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 font-semibold text-neutral-700 hover:bg-neutral-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
