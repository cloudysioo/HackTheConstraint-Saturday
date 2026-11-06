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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletedSuccess, setIsDeletedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsConfirmingDelete(false);
    setDeleteConfirmationText('');
    setIsDeletedSuccess(false);
    onClose();
  };

  const handleExecuteDelete = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') return;
    onClearAllData(patient.id);
    setIsDeletedSuccess(true);
    setIsConfirmingDelete(false);
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
              <h3 className="text-base font-bold">Patient Account & Data Privacy Settings</h3>
              <p className="text-xs text-white/70">Manage personal chart preferences & GDPR/HIPAA rights</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/70 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Success State */}
          {isDeletedSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-emerald-900">
                All Patient Health Data Purged Successfully
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
                All active medications, scanned prescription records, comparison reports, and consulting doctor linkages for <strong>{patient.name}</strong> have been permanently erased from medTrace.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="bg-neutral-50/80 border border-neutral-200/90 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-neutral-200/70 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Patient Profile
                    </span>
                    <h4 className="font-extrabold text-sm text-neutral-900">{patient.name}</h4>
                  </div>
                  <span className="font-mono text-xs bg-white border border-neutral-200 px-2 py-0.5 rounded font-bold text-primary">
                    MRN: {patient.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-neutral-600 pt-1">
                  <div>
                    <span className="text-neutral-400">Date of Birth:</span>{' '}
                    <strong className="text-neutral-800">{patient.dob}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Email:</span>{' '}
                    <strong className="text-neutral-800">{currentUser?.email || patient.email || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Primary Clinic:</span>{' '}
                    <strong className="text-neutral-800">{patient.clinic || 'Metro Health Center'}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Primary Doctor:</span>{' '}
                    <strong className="text-neutral-800">{patient.doctor || 'Dr. Rajesh Iyer, MD'}</strong>
                  </div>
                </div>
              </div>

              {/* Data Summary Stats */}
              <div>
                <h5 className="text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                  Active Data Stored in medTrace
                </h5>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <Pill className="h-4 w-4 text-secondary mx-auto mb-1" />
                    <div className="text-base font-extrabold text-neutral-900">{medications.length}</div>
                    <div className="text-[10px] text-neutral-500 font-medium">Medications</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                    <div className="text-base font-extrabold text-neutral-900">{activeSpecialistsCount}</div>
                    <div className="text-[10px] text-neutral-500 font-medium">Care Team Doctors</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                    <FileText className="h-4 w-4 text-warning mx-auto mb-1" />
                    <div className="text-base font-extrabold text-neutral-900">
                      {comparisonReports.length + (document ? 1 : 0)}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-medium">Scans & Reports</div>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Clear All Patient Data */}
              <div className="rounded-xl border-2 border-critical/30 bg-critical/5 p-4.5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-critical/15 text-critical flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-extrabold text-critical">
                      Danger Zone: Clear All Patient Health Data
                    </h5>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Permanently wipe all medication chart history, uploaded prescription scans, comparison reports, and consulting doctor linkages.
                    </p>
                  </div>
                </div>

                {!isConfirmingDelete ? (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-4 py-2 text-xs font-bold text-white bg-critical hover:bg-critical-hover rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove All Patient Data…</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 p-4 bg-white rounded-xl border border-critical/40 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-critical">
                      <AlertTriangle className="h-4 w-4 text-critical shrink-0" />
                      <span>Confirmation Required (Permanent Erasure)</span>
                    </div>

                    <p className="text-xs text-neutral-600 leading-normal">
                      This action <strong>cannot be undone</strong>. To confirm you wish to completely wipe all records for <strong>{patient.name}</strong>, please type <span className="font-mono font-bold text-critical bg-critical/10 px-1 py-0.5 rounded">DELETE</span> below:
                    </p>

                    <div>
                      <input
                        type="text"
                        placeholder='Type "DELETE" to confirm'
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-critical/40 focus:border-critical"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmingDelete(false);
                          setDeleteConfirmationText('');
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteDelete}
                        disabled={!isDeleteConfirmed}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-critical hover:bg-critical-hover rounded-lg transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Permanently Delete All Data</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-secondary" />
            <span>HIPAA & Digital Health Security Compliant</span>
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 font-semibold text-neutral-600 hover:bg-neutral-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
