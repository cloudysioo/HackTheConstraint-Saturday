import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSearch,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  Loader2,
  FileImage,
  Stethoscope,
  Plus,
  Users,
  Building,
  ShieldAlert,
  Trash2,
  Settings,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Medication, UploadedDocument, PatientProfile, ConsultingDoctor } from '../../types/medication';
import { useMedications } from '../../context/MedicationContext';
import { AddDoctorModal } from './AddDoctorModal';
import { PrescriptionComparisonView } from './PrescriptionComparisonView';

interface PatientDashboardProps {
  patient: PatientProfile;
  document: UploadedDocument | null;
  medications: Medication[];
  onOpenFlagModal: (medication: Medication) => void;
  onOpenDocumentViewer: (medicationId?: string) => void;
  onOpenAccountSettings?: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  document,
  medications,
  onOpenFlagModal,
  onOpenDocumentViewer,
  onOpenAccountSettings,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isUploading,
    uploadProgressText,
    uploadPrescriptionForDoctor,
    availableDoctors,
    addConsultingDoctor,
    removeConsultingDoctor,
    cancelDoctorRequest,
    filterDoctorName,
    setFilterDoctorName,
    comparisonReports,
    activeComparisonReport,
    setActiveComparisonReportId,
    updateDiscrepancyStatus,
  } = useMedications();

  // Filter approved doctors in care team (excluding pending approval)
  const approvedCareTeam = (patient.careTeam || []).filter(
    (d) => d.approvalStatus !== 'PENDING_APPROVAL'
  );

  // Selected doctor when uploading a new prescription
  const [uploadDoctorName, setUploadDoctorName] = useState<string>(
    approvedCareTeam[0]?.name || patient.doctor || 'Dr. Rajesh Iyer, MD'
  );
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [doctorToRemove, setDoctorToRemove] = useState<ConsultingDoctor | null>(null);

  // Keep uploadDoctorName aligned to an approved doctor
  useEffect(() => {
    const isCurrentlyApproved = approvedCareTeam.some((d) => d.name === uploadDoctorName);
    if (!isCurrentlyApproved && approvedCareTeam.length > 0) {
      setUploadDoctorName(approvedCareTeam[0].name);
    }
  }, [patient.careTeam, uploadDoctorName]);

  // Handle native file input selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const matchedDoc = patient.careTeam?.find((d) => d.name === uploadDoctorName);
      uploadPrescriptionForDoctor(selectedFile, uploadDoctorName, matchedDoc?.specialty);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const matchedDoc = patient.careTeam?.find((d) => d.name === uploadDoctorName);
      uploadPrescriptionForDoctor(droppedFile, uploadDoctorName, matchedDoc?.specialty);
    }
  };

  // Status badge with icon, comparison discrepancy type, and text label
  const renderStatusBadge = (status: Medication['status'], med?: Medication) => {
    // If tagged with a comparison discrepancy, render high-fidelity discrepancy badge
    if (med?.conflictDetails?.type === 'Conflict' || status === 'CONFLICT') {
      return (
        <Badge variant="conflict" className="bg-rose-50 text-rose-700 border-rose-300 gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>Conflict</span>
        </Badge>
      );
    }
    if (med?.conflictDetails?.type === 'Missing Entry') {
      return (
        <Badge className="bg-amber-50 text-amber-800 border-amber-300 gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>Missing Entry</span>
        </Badge>
      );
    }
    if (med?.conflictDetails?.type === 'Outdated') {
      return (
        <Badge className="bg-amber-50 text-amber-800 border-amber-300 gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>Outdated</span>
        </Badge>
      );
    }
    if (med?.conflictDetails?.type === 'Name Variant') {
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-300 gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span>Name Variant</span>
        </Badge>
      );
    }

    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="verified">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span>Verified</span>
          </Badge>
        );
      case 'PATIENT_FLAGGED':
        return (
          <Badge variant="flagged">
            <Flag className="h-3.5 w-3.5 text-warning" />
            <span>Patient Flagged</span>
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge variant="pending">
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
            <span>Pending Review</span>
          </Badge>
        );
    }
  };

  // Check for cross-doctor conflict among medications
  const crossDoctorConflicts = medications.filter(
    (m) => m.conflictDetails && m.conflictDetails.prescribedByOtherDoctor
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Hidden native file input for actual OS file selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
        className="hidden"
      />

      {/* Patient Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            Closed-Loop Multi-Specialist Handover
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Welcome, {patient.name.split(' ')[0]}. Here is your unified medication chart.
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            MedTrace cross-checks prescriptions across all your consulting doctors to prevent dangerous drug interactions, duplicate doses, and handover gaps.
          </p>
        </div>

        {/* Patient Profile, MRN Pill & Settings */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-3 bg-white border border-neutral-200/90 rounded-xl p-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              PT
            </div>
            <div className="text-xs">
              <p className="text-neutral-500">Patient Identifier</p>
              <p className="font-bold text-neutral-900 font-mono">{patient.id}</p>
              <p className="text-neutral-500">DOB: {patient.dob}</p>
            </div>
          </div>

          {onOpenAccountSettings && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAccountSettings}
              className="flex items-center gap-1.5 text-xs font-bold border-neutral-200 text-neutral-700 hover:text-primary hover:border-primary shadow-xs h-auto py-3 px-3.5 bg-white"
            >
              <Settings className="h-4 w-4 text-secondary" />
              <span>Account Settings</span>
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 0: Multi-Doctor Care Team Section */}
      <section aria-labelledby="care-team-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="care-team-heading" className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              <span>My Care Team (Consulting Doctors)</span>
              <span className="text-xs bg-secondary/15 text-secondary font-bold px-2 py-0.5 rounded-full">
                {patient.careTeam?.length || 1} Specialists
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Doctors co-managing your prescriptions across multiple hospitals and clinics.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddDoctorModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold border-secondary text-primary hover:bg-secondary/10"
          >
            <Plus className="h-3.5 w-3.5 text-secondary" />
            <span>Add Consulting Doctor</span>
          </Button>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(patient.careTeam || []).map((doc, idx) => {
            const docMedsCount = medications.filter(
              (m) =>
                m.prescribedBy === doc.name ||
                (m.prescribedBy &&
                  doc.name &&
                  m.prescribedBy.toLowerCase().includes(doc.name.toLowerCase().split(',')[0].trim()))
            ).length;
            const isSelectedFilter = filterDoctorName === doc.name;
            const isPending = doc.approvalStatus === 'PENDING_APPROVAL';

            if (isPending) {
              return (
                <div
                  key={doc.id || idx}
                  className="bg-warning-light/35 rounded-xl p-4 border border-warning-border transition-all shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/15 text-warning flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-neutral-900 text-sm">{doc.name}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-warning/20 text-warning font-bold px-2 py-0.5 rounded-full border border-warning/30">
                            Waiting for Approval
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-primary mt-0.5">{doc.specialty}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                          <Building className="h-3 w-3 text-neutral-400" />
                          <span>{doc.clinic}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-600 mt-2.5 bg-white/70 p-2 rounded-lg border border-warning-border/40">
                    Request sent to doctor. Waiting for doctor to review and accept into their care team before accessing your chart.
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-warning-border/50 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-neutral-400">
                      {doc.requestedAt ? `Sent ${doc.requestedAt}` : 'Pending doctor review'}
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelDoctorRequest(patient.id, doc.id)}
                      className="text-[11px] font-bold text-critical hover:underline"
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={doc.id || idx}
                className={`bg-white rounded-xl p-4 border transition-all shadow-xs relative overflow-hidden ${
                  isSelectedFilter
                    ? 'border-secondary ring-2 ring-secondary/30 bg-secondary/5'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      MD
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-neutral-900 text-sm">{doc.name}</span>
                        {doc.isPrimary ? (
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded">
                            Primary Care
                          </span>
                        ) : (
                          <span className="text-[10px] bg-secondary/15 text-primary font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-secondary/30">
                            <CheckCircle2 className="h-3 w-3 text-secondary" />
                            <span>Active Co-Manager</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-primary mt-0.5">{doc.specialty}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                        <Building className="h-3 w-3 text-neutral-400" />
                        <span>{doc.clinic}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">
                    <strong className="text-neutral-900">{docMedsCount}</strong> active medication{docMedsCount !== 1 ? 's' : ''}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFilterDoctorName(isSelectedFilter ? 'ALL' : doc.name)}
                      className="text-[11px] font-bold text-secondary-dark hover:underline"
                    >
                      {isSelectedFilter ? 'Showing All' : 'Filter Meds ➔'}
                    </button>
                    {!doc.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setDoctorToRemove(doc)}
                        title={`Remove ${doc.name} from care team`}
                        className="text-[11px] font-semibold text-neutral-400 hover:text-critical flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Remove Doctor Confirmation Modal */}
        {doctorToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
              <div className="bg-critical/10 border-b border-critical/20 p-5 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-critical/15 text-critical flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Remove Doctor from Care Team?</h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    You are removing <strong>{doctorToRemove.name}</strong> from your co-managing care team.
                  </p>
                </div>
              </div>

              <div className="p-5 text-xs text-neutral-600 space-y-2.5">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-bold text-neutral-900">{doctorToRemove.name}</div>
                  <div className="text-primary font-semibold text-[11px]">{doctorToRemove.specialty}</div>
                  <div className="text-neutral-500 text-[10px]">{doctorToRemove.clinic}</div>
                </div>
                <p className="leading-relaxed">
                  Removing this doctor will disconnect their cross-specialist prescription screening link. Their existing prescriptions will remain on your chart unless cleared in Account Settings.
                </p>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDoctorToRemove(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/60 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeConsultingDoctor(patient.id, doctorToRemove.id);
                    setDoctorToRemove(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-critical hover:bg-critical-hover rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Yes, Remove Doctor</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 0.5: Cross-Doctor Interaction Alert Banner (Core MedTrace Handover Safety) */}
      {crossDoctorConflicts.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-rose-900 flex items-center gap-2">
                  <span>Cross-Doctor Handover Interaction Alert</span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    High Risk Discrepancy
                  </span>
                </h3>
              </div>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                MedTrace detected a potential adverse interaction between medications prescribed by <strong>different consulting doctors</strong>.
                Our continuity engine has notified both doctors to ensure safe closed-loop reconciliation.
              </p>

              <div className="mt-3 space-y-2">
                {crossDoctorConflicts.map((med) => (
                  <div key={med.id} className="bg-white/90 rounded-lg p-3 border border-rose-200 text-xs">
                    <p className="font-bold text-neutral-900">
                      • {med.name} {med.strength} ({med.prescribedBy || 'Primary Care'}) vs{' '}
                      <span className="text-rose-700 font-semibold">{med.conflictDetails?.conflictingWith}</span>
                    </p>
                    <p className="text-neutral-600 mt-0.5">{med.conflictDetails?.description}</p>
                    <p className="text-[11px] text-primary font-semibold mt-1">
                      Co-prescriber: {med.conflictDetails?.prescribedByOtherDoctor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Upload Area with Prescribing Doctor Selection */}
      <section aria-labelledby="upload-section-heading">
        <Card className="border border-neutral-200/90 shadow-card">
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle id="upload-section-heading" className="text-lg font-bold text-neutral-900">
                  Prescription Document Upload & OCR
                </CardTitle>
                <CardDescription className="text-xs text-neutral-600">
                  Select any prescription photo or PDF. Tag the consulting doctor so medications are correctly mapped.
                </CardDescription>
              </div>

              {/* Prescribing Doctor Selector for Upload */}
              <div className="flex items-center gap-2 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-neutral-500 font-semibold">Prescribing Doctor:</span>
                <select
                  value={uploadDoctorName}
                  onChange={(e) => setUploadDoctorName(e.target.value)}
                  className="bg-transparent font-bold text-primary focus:outline-none cursor-pointer"
                >
                  {(patient.careTeam || []).map((doc) => {
                    const isPending = doc.approvalStatus === 'PENDING_APPROVAL';
                    return (
                      <option key={doc.id} value={doc.name} disabled={isPending}>
                        {doc.name} ({doc.specialty}) {isPending ? '— [Pending Approval - Cannot Upload]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* Interactive Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all flex flex-col items-center justify-center cursor-pointer group ${
                isDragging
                  ? 'border-secondary bg-secondary/5'
                  : 'border-neutral-300 hover:border-primary/60 bg-[#FAFCFD] hover:bg-[#f6fafb]'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center animate-pulse">
                    <Loader2 className="h-9 w-9 text-secondary-dark animate-spin" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Extracting Medical Text with OCR...
                  </h4>
                  <p className="text-xs font-mono text-primary font-medium animate-pulse">
                    {uploadProgressText || 'Scanning the document...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <UploadCloud className="h-9 w-9 text-primary stroke-[1.75]" />
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-neutral-900 mb-1">
                    Upload a photo or PDF of your prescription
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-2">
                    Click anywhere to browse or drop an image here. Will be attributed to <strong>{uploadDoctorName}</strong>.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="default"
                      className="px-6 flex items-center gap-2 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <FileImage className="h-4 w-4" />
                      <span>Browse Files</span>
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Current Active Document State */}
            {document && (
              <div className="rounded-lg bg-[#e8f5e9]/70 border border-[#a5d6a7] p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 text-success flex items-center justify-center shrink-0">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <span>Uploaded:</span>
                      <span className="font-mono text-primary font-bold">"{document.fileName}"</span>
                      <span className="text-[10px] bg-white border border-[#a5d6a7] text-success px-2 py-0.2 rounded-full font-bold">
                        OCR Processed
                      </span>
                    </p>
                    <p className="text-[11px] text-neutral-600">
                      Attributed to {uploadDoctorName} • Extracted {document.itemCount} medications • Timestamp: {document.uploadedAt}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* SECTION 1.5: Prescription Reconciliation & Longitudinal Comparison View */}
      {comparisonReports && comparisonReports.length > 0 && (
        <PrescriptionComparisonView
          reports={comparisonReports}
          activeReport={activeComparisonReport}
          onSelectReport={setActiveComparisonReportId}
          onUpdateStatus={updateDiscrepancyStatus}
          onOpenFlagModal={(drugName) => {
            const med = medications.find((m) => m.name.toLowerCase().includes(drugName.toLowerCase()));
            if (med) {
              onOpenFlagModal(med);
            } else if (medications.length > 0) {
              onOpenFlagModal(medications[0]);
            }
          }}
        />
      )}

      {/* SECTION 2: Unified Medication Reconciliation Table */}
      <section aria-labelledby="medications-table-heading">
        <Card className="border border-neutral-200/90 shadow-card overflow-hidden">
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle id="medications-table-heading" className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <span>Current Active Medications</span>
                  <span className="text-xs bg-neutral-200 text-neutral-700 font-bold px-2 py-0.5 rounded-full">
                    {medications.length} Prescribed Items
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-neutral-600">
                  Cross-referenced across all consulting specialists. Click "Flag Error" to report any discrepancy.
                </CardDescription>
              </div>

              {/* Doctor Filter Pill Selector */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs">
                <span className="text-neutral-400 font-semibold mr-1">Filter by Doctor:</span>
                <button
                  type="button"
                  onClick={() => setFilterDoctorName('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    filterDoctorName === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  All Doctors
                </button>
                {(patient.careTeam || []).map((doc) => {
                  const isSelected = filterDoctorName === doc.name;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setFilterDoctorName(doc.name)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {doc.name.split(',')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {medications.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <FileSearch className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-neutral-700">No medications found</h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  {filterDoctorName !== 'ALL'
                    ? `No medications currently prescribed by ${filterDoctorName}.`
                    : 'Upload a prescription photo using the box above to extract your medications.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[20%]">Medication Name</TableHead>
                        <TableHead className="w-[10%]">Strength</TableHead>
                        <TableHead className="w-[25%]">Instructions</TableHead>
                        <TableHead className="w-[20%]">Prescribing Doctor</TableHead>
                        <TableHead className="w-[13%]">Status</TableHead>
                        <TableHead className="w-[12%] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medications.map((med) => (
                        <TableRow key={med.id} className="hover:bg-neutral-50/80 transition-colors">
                          {/* Name */}
                          <TableCell className="font-bold text-neutral-900">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="text-sm text-neutral-900">{med.name}</span>
                            </div>
                            {med.patientFlagNote && (
                              <div className="mt-1 text-xs text-warning flex items-center gap-1 font-normal">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[200px]" title={med.patientFlagNote}>
                                  Flag: "{med.patientFlagNote}"
                                </span>
                              </div>
                            )}
                          </TableCell>

                          {/* Strength */}
                          <TableCell>
                            <span className="font-mono text-xs font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 border border-neutral-200">
                              {med.strength}
                            </span>
                          </TableCell>

                          {/* Instructions */}
                          <TableCell className="text-xs text-neutral-700 leading-relaxed">
                            {med.instructions}
                          </TableCell>

                          {/* Prescribing Doctor & Specialty */}
                          <TableCell>
                            <div className="text-xs font-semibold text-neutral-900 flex items-center gap-1">
                              <Stethoscope className="h-3.5 w-3.5 text-secondary shrink-0" />
                              <span>{med.prescribedBy || patient.doctor}</span>
                            </div>
                            <div className="text-[10px] text-primary font-medium mt-0.5">
                              {med.doctorSpecialty || 'Primary Care Specialist'}
                            </div>
                            {med.conflictDetails?.prescribedByOtherDoctor && (
                              <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                Interacts with: {med.conflictDetails.conflictingWith}
                              </div>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {renderStatusBadge(med.status, med)}
                          </TableCell>

                          {/* Action Column */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenDocumentViewer(med.id)}
                                className="p-1.5 text-neutral-500 hover:text-primary rounded hover:bg-neutral-100 transition-colors"
                                title="View on source document"
                              >
                                <FileSearch className="h-4 w-4" />
                              </button>
                              <Button
                                type="button"
                                variant={med.status === 'PATIENT_FLAGGED' ? 'warning' : 'outline'}
                                size="sm"
                                onClick={() => onOpenFlagModal(med)}
                                className="h-7 text-xs font-semibold px-2.5"
                              >
                                <Flag className="h-3 w-3 mr-1" />
                                <span>{med.status === 'PATIENT_FLAGGED' ? 'Edit' : 'Flag'}</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-neutral-200">
                  {medications.map((med) => (
                    <div key={med.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900">{med.name}</h4>
                          <span className="font-mono text-xs font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 border border-neutral-200 inline-block mt-0.5">
                            {med.strength}
                          </span>
                        </div>
                        <div>{renderStatusBadge(med.status, med)}</div>
                      </div>

                      <div className="text-xs text-neutral-600">
                        <span className="font-semibold text-neutral-800">Prescriber: </span>
                        <span>{med.prescribedBy || patient.doctor} ({med.doctorSpecialty || 'Primary Care'})</span>
                      </div>

                      <div>
                        <p className="text-xs text-neutral-700">{med.instructions}</p>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => onOpenDocumentViewer(med.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-dark"
                        >
                          <FileSearch className="h-3.5 w-3.5" />
                          <span>View Doc</span>
                        </button>
                        <Button
                          type="button"
                          variant={med.status === 'PATIENT_FLAGGED' ? 'warning' : 'outline'}
                          size="sm"
                          onClick={() => onOpenFlagModal(med)}
                          className="h-7 text-xs font-semibold px-2.5"
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          <span>{med.status === 'PATIENT_FLAGGED' ? 'Edit Flag' : 'Flag Error'}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Add Consulting Doctor Modal */}
      <AddDoctorModal
        isOpen={isAddDoctorModalOpen}
        onClose={() => setIsAddDoctorModalOpen(false)}
        onAddDoctor={(newDoc) => addConsultingDoctor(patient.id, newDoc)}
        availableDoctors={availableDoctors}
        currentCareTeam={patient.careTeam || []}
      />
    </main>
  );
};
