import React, { useState } from 'react';
import {
  X,
  Settings,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Users,
  Pill,
  Lock,
  ArrowLeft,
  Calendar,
  Mail,
  Building,
  UserCheck,
} from 'lucide-react';
import { PatientProfile, Medication, UploadedDocument, PrescriptionComparisonReport } from '../../types/medication';
import { useAuth } from '../../context/AuthContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  medications: Medication[];
  document: UploadedDocument | null;
  comparisonReports: PrescriptionComparisonReport[];
  onClearAllData: (patientId: string) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  patient,
  medications,
  document,
  comparisonReports,
  onClearAllData,
}) => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'confirm_delete' | 'success'>('overview');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentView('overview');
    setDeleteConfirmationText('');
    onClose();
  };

  const handleExecuteDelete = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') return;
    onClearAllData(patient.id);
    setCurrentView('success');
    setDeleteConfirmationText('');
  };

  const activeSpecialistsCount = (patient.careTeam || []).length;
  const isDeleteConfirmed = deleteConfirmationText.trim().toUpperCase() === 'DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Settings className="h-4.5 w-4.5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold">Patient Account & Data Privacy</h3>
              <p className="text-xs text-white/70">Manage personal chart preferences & right to erasure</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/70 hover:text-white rounded-lg p-1.5 transition-colors hover:bg-white/10"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* ─────────────────────────────────────────────────────────────
              VIEW 1: OVERVIEW & SETTINGS
          ───────────────────────────────────────────────────────────── */}
          {currentView === 'overview' && (
            <>
              {/* Profile Card */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      PT
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-neutral-900">{patient.name}</h4>
                      <p className="text-[11px] text-neutral-500">Verified Patient Record</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs bg-white border border-neutral-200/90 px-2.5 py-1 rounded-md font-bold text-primary shadow-2xs">
                    MRN: {patient.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs text-neutral-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 text-[11px]">DOB:</span>
                    <strong className="text-neutral-800 text-[11px]">{patient.dob}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 text-[11px]">Email:</span>
                    <strong className="text-neutral-800 text-[11px] truncate">
                      {currentUser?.email || patient.email || 'patient@medtrace.health'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 text-[11px]">Clinic:</span>
                    <strong className="text-neutral-800 text-[11px] truncate">
                      {patient.clinic || 'Metro Health'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 text-[11px]">Primary GP:</span>
                    <strong className="text-neutral-800 text-[11px] truncate">
                      {patient.doctor || 'Dr. Rajesh Iyer'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Data Summary Stats */}
              <div>
                <h5 className="text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider">
                  Active Health Data on Chart
                </h5>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary-dark flex items-center justify-center mx-auto mb-1.5">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-extrabold text-neutral-900">{medications.length}</div>
                    <div className="text-[10px] text-neutral-500 font-semibold">Active Meds</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-extrabold text-neutral-900">{activeSpecialistsCount}</div>
                    <div className="text-[10px] text-neutral-500 font-semibold">Care Specialists</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-warning/10 text-warning flex items-center justify-center mx-auto mb-1.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-extrabold text-neutral-900">
                      {comparisonReports.length + (document ? 1 : 0)}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-semibold">Reports & Scans</div>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Clear All Patient Data */}
              <div className="rounded-xl border border-[#922B2B]/25 bg-[#922B2B]/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#922B2B]/15 text-[#922B2B] flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#922B2B] uppercase tracking-wide">
                        Danger Zone · Patient Right to Erasure
                      </h5>
                      <p className="text-xs text-neutral-700 mt-0.5 leading-relaxed">
                        Permanently wipe all medication charts, uploaded scans, cross-checking reports, and consulting doctor connections.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-[#922B2B]/15">
                  <span className="text-[11px] text-neutral-500">
                    GDPR & HIPAA compliant record erasure
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('confirm_delete');
                      setDeleteConfirmationText('');
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#922B2B] hover:bg-[#782323] rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All Data…</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 2: DEDICATED CONFIRMATION STEP
          ───────────────────────────────────────────────────────────── */}
          {currentView === 'confirm_delete' && (
            <div className="space-y-4">
              {/* Back to Overview */}
              <button
                type="button"
                onClick={() => setCurrentView('overview')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Account Overview</span>
              </button>

              {/* Warning Header Card */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-rose-950">
                    Are you absolutely sure you want to wipe all records?
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    This action is <strong>permanent and irreversible</strong>. All clinical data linked to <strong>{patient.name}</strong> ({patient.id}) will be deleted immediately.
                  </p>
                </div>
              </div>

              {/* What will be removed */}
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 text-xs space-y-2">
                <span className="font-bold text-neutral-800 text-[11px] uppercase tracking-wide">
                  The following data will be permanently wiped:
                </span>
                <ul className="space-y-1.5 text-neutral-600 text-xs pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#922B2B] shrink-0" />
                    <span><strong>{medications.length} active medication records</strong> & dosing instructions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#922B2B] shrink-0" />
                    <span>All uploaded <strong>prescription scans & OCR extraction data</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#922B2B] shrink-0" />
                    <span>Cross-specialist <strong>interaction reports & discrepancy flags</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#922B2B] shrink-0" />
                    <span>Care team consulting doctor handovers (primary doctor remains linked)</span>
                  </li>
                </ul>
              </div>

              {/* Type DELETE to Confirm Input */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-neutral-800">
                  To confirm deletion, please type <span className="font-mono font-bold text-[#922B2B] bg-[#922B2B]/10 px-1.5 py-0.5 rounded">DELETE</span> below:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider rounded-xl border transition-all ${
                      isDeleteConfirmed
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-neutral-300 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#922B2B]/30 focus:border-[#922B2B]'
                    }`}
                    autoFocus
                  />
                  {isDeleteConfirmed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ready</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('overview');
                    setDeleteConfirmationText('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel & Keep My Data
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={!isDeleteConfirmed}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#922B2B] hover:bg-[#782323] rounded-lg transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Permanently Erase All Data</span>
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VIEW 3: SUCCESS STATE
          ───────────────────────────────────────────────────────────── */}
          {currentView === 'success' && (
            <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-950">
                  Patient Health Records Erased Successfully
                </h4>
                <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed max-w-sm mx-auto">
                  All medication records, uploaded documents, comparison history, and consulting doctor connections for <strong>{patient.name}</strong> have been cleared from your chart.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <span>Return to Medication Chart</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-secondary" />
            <span className="text-[11px]">HIPAA & GDPR Right to Erasure Compliant</span>
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
