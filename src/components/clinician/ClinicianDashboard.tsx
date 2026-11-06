import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Clock,
  FileSearch,
  ShieldAlert,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
import { useMedications } from '../../context/MedicationContext';
import { useAuth } from '../../context/AuthContext';
import { PhysicianUser } from '../../types/auth';
import { Medication, ConsultingDoctor } from '../../types/medication';
import { ProvenanceViewer } from './ProvenanceViewer';
import { ClinicianAuditLog } from './ClinicianAuditLog';
import { PatientQueueModal } from './PatientQueueModal';

export const ClinicianDashboard: React.FC = () => {
  const {
    medications,
    counts,
    patient,
    patients,
    selectedPatientId,
    setSelectedPatientId,
    patientReviewCounts,
    clinician,
    pendingDoctorRequests,
    approveDoctorRequest,
    rejectDoctorRequest,
  } = useMedications();

  const { currentUser } = useAuth();
  const physicianUser = currentUser?.role === 'physician' ? (currentUser as PhysicianUser) : null;
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const isTargetedToCurrentDoctor = (doc: ConsultingDoctor) => {
    if (!physicianUser) return true;
    const docName = doc.name.toLowerCase();
    const phyName = physicianUser.name.toLowerCase();
    const docPrefix = docName.split(',')[0].replace(/^dr\.?\s*/i, '').trim();
    const phyPrefix = phyName.split(',')[0].replace(/^dr\.?\s*/i, '').trim();

    return Boolean(
      (doc.doctorId && physicianUser.doctorId && doc.doctorId === physicianUser.doctorId) ||
      (doc.registrationNumber && physicianUser.registrationNumber && doc.registrationNumber === physicianUser.registrationNumber) ||
      (doc.email && physicianUser.email && doc.email.toLowerCase() === physicianUser.email.toLowerCase()) ||
      docPrefix.includes(phyPrefix) ||
      phyPrefix.includes(docPrefix)
    );
  };

  const [selectedMedForProvenance, setSelectedMedForProvenance] = useState<Medication | null>(null);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'FLAGGED' | 'VERIFIED'>('NEEDS_REVIEW');

  const handleOpenProvenance = (med: Medication) => {
    setSelectedMedForProvenance(med);
    setIsProvenanceModalOpen(true);
  };

  // Filter medications
  const filteredMedications = medications.filter((med) => {
    if (activeFilter === 'NEEDS_REVIEW') {
      return med.status === 'PATIENT_FLAGGED' || med.status === 'PENDING' || med.status === 'CONFLICT';
    }
    if (activeFilter === 'FLAGGED') {
      return med.status === 'PATIENT_FLAGGED';
    }
    if (activeFilter === 'VERIFIED') {
      return med.status === 'VERIFIED';
    }
    return true;
  });

  const renderStatusBadge = (status: Medication['status']) => {
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
      case 'CONFLICT':
        return (
          <Badge variant="conflict">
            <AlertTriangle className="h-3.5 w-3.5 text-critical" />
            <span>High Conflict</span>
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* ── TOP BAR: MULTI-PATIENT ROSTER & PATIENT QUEUE SELECTOR ── */}
      <div className="bg-white border-2 border-primary/20 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary text-secondary flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            MD
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary/15 text-primary px-2 py-0.5 rounded-full">
                Active Patient Chart
              </span>
              <span className="text-xs text-neutral-400">MRN:</span>
              <span className="font-mono text-xs font-bold text-primary bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                {patient.id}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                {patient.name}
              </h2>
              <span className="text-xs text-neutral-500">
                (DOB: {patient.dob})
              </span>
            </div>

            {/* Care Team Specialists co-managing this patient */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-1 flex-wrap">
              <Stethoscope className="h-3.5 w-3.5 text-secondary shrink-0" />
              <span className="font-semibold text-neutral-800">Co-managed with:</span>
              <span>
                {(patient.careTeam || [])
                  .filter((d) => d.approvalStatus !== 'PENDING_APPROVAL')
                  .map((d) => `${d.name.split(',')[0]} (${d.specialty.split('&')[0].trim()})`).join(' • ') || 'Primary Care Sole Provider'}
              </span>
              {(patient.careTeam || []).some((d) => d.approvalStatus === 'PENDING_APPROVAL') && (
                <span className="text-[10px] bg-warning/15 text-warning font-bold px-2 py-0.5 rounded-full border border-warning/30">
                  {(patient.careTeam || []).filter((d) => d.approvalStatus === 'PENDING_APPROVAL').length} request pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Patient Switcher Button */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsQueueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold shadow-sm"
          >
            <Users className="h-4 w-4 text-secondary" />
            <span>Switch Patient Queue ({patients.length})</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/80" />
          </Button>
        </div>
      </div>

      {/* ── ACTION FEEDBACK BANNER ── */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs border ${
            actionFeedback.type === 'success'
              ? 'bg-[#e8f5e9] border-[#a5d6a7] text-success'
              : 'bg-neutral-100 border-neutral-300 text-neutral-700'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── INCOMING CARE TEAM REQUESTS NOTIFICATION CARD ── */}
      {pendingDoctorRequests.length > 0 && (
        <div className="bg-gradient-to-r from-warning-light/50 via-amber-50 to-warning-light/30 border-2 border-warning-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center font-bold">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <span>Incoming Patient Care Team Requests</span>
                  <span className="text-[10px] bg-warning text-white font-extrabold px-2 py-0.5 rounded-full">
                    {pendingDoctorRequests.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-neutral-600">
                  Patients requesting specialists to join their medication care team for closed-loop reconciliation.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {pendingDoctorRequests.map(({ patient: reqPatient, doctor: reqDoc }) => {
              const isDirect = isTargetedToCurrentDoctor(reqDoc);

              return (
                <div
                  key={`${reqPatient.id}-${reqDoc.id}`}
                  className={`bg-white rounded-xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all ${
                    isDirect ? 'border-secondary/60 ring-1 ring-secondary/20' : 'border-warning-border/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      PT
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                          {reqPatient.name}
                        </span>
                        <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded border border-neutral-200">
                          {reqPatient.id}
                        </span>
                        {isDirect ? (
                          <span className="text-[10px] bg-secondary/15 text-primary font-bold px-2 py-0.5 rounded-full border border-secondary/30">
                            Direct Request for You
                          </span>
                        ) : (
                          <span className="text-[10px] bg-neutral-100 text-neutral-600 font-medium px-2 py-0.5 rounded-full border border-neutral-200">
                            Department Specialist
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400">
                          {reqDoc.requestedAt ? `Requested ${reqDoc.requestedAt}` : 'Recently requested'}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5">
                        Requested Specialist: <strong className="text-primary">{reqDoc.name}</strong> ({reqDoc.specialty}) • {reqDoc.clinic}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        rejectDoctorRequest(reqPatient.id, reqDoc.id);
                        setActionFeedback({
                          type: 'info',
                          text: `Declined care team request from ${reqPatient.name}.`,
                        });
                      }}
                      className="text-xs font-semibold text-neutral-600 hover:text-critical hover:border-critical"
                    >
                      Decline
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        approveDoctorRequest(reqPatient.id, reqDoc.id);
                        setSelectedPatientId(reqPatient.id);
                        setActionFeedback({
                          type: 'success',
                          text: `Care team link activated for ${reqPatient.name}! ${reqDoc.name} is now authorized for closed-loop medication reconciliation. Chart loaded.`,
                        });
                      }}
                      className="text-xs font-bold bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                      <span>Accept & Join Care Team</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clinician Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <Stethoscope className="h-3.5 w-3.5 text-secondary" />
            Cross-Specialist Medication Reconciliation & Safety Queue
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Handover Reconciliation for {patient.name}
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Review prescriptions from all consulting doctors. Resolve patient-reported discrepancies and address cross-specialist drug interactions.
          </p>
        </div>

        {/* Clinician Profile Badge */}
        <div className="flex items-center gap-3 bg-white border border-neutral-200/90 rounded-xl p-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-primary text-secondary flex items-center justify-center font-bold text-sm">
            MD
          </div>
          <div className="text-xs">
            <p className="text-neutral-500">Adjudicating Physician</p>
            <p className="font-bold text-neutral-900">{clinician.name}</p>
            <p className="text-neutral-500 font-mono text-[11px]">{clinician.specialty || clinician.clinic}</p>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Triage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Needs Review */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2 font-medium">
            <span>Needs Review</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-primary">
            {counts.needsClinicianReview}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Pending clinical sign-off</p>
        </div>

        {/* Metric 2: Patient Discrepancies */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2 font-medium">
            <span>Patient Flags</span>
            <Flag className="h-4 w-4 text-warning" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-warning">
            {counts.flagged}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Patient noted discrepancies</p>
        </div>

        {/* Metric 3: Systemic Conflicts */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2 font-medium">
            <span>Cross-Doctor Conflicts</span>
            <AlertTriangle className="h-4 w-4 text-critical" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-critical">
            {counts.conflict}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Multi-doctor interactions</p>
        </div>

        {/* Metric 4: Verified */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-2 font-medium">
            <span>Verified Medications</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-success">
            {counts.verified}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Approved for handover</p>
        </div>
      </div>

      {/* Critical Conflict Alert if present */}
      {counts.conflict > 0 && (
        <div className="rounded-xl border border-critical/30 bg-[#fdf2f2] p-4 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-critical/15 text-critical flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <h4 className="font-bold text-[#922B2B]">
              Cross-Doctor Clinical Handover Conflict Detected
            </h4>
            <p className="text-neutral-700 mt-0.5 leading-relaxed">
              One or more medications prescribed by different specialists in {patient.name}'s care team present drug-drug interactions or conflicting instructions. Review the provenance and flag notes below before confirming handover.
            </p>
          </div>
        </div>
      )}

      {/* Main Reconciliation Table */}
      <Card className="border border-neutral-200 shadow-card overflow-hidden">
        <CardHeader className="bg-neutral-50/50 border-b border-neutral-200/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <span>Prescription Reconciliation Queue</span>
                <span className="text-xs bg-neutral-200 text-neutral-700 font-bold px-2 py-0.5 rounded-full">
                  {filteredMedications.length} of {medications.length} Items
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-neutral-600 mt-0.5">
                Multi-specialist chart for {patient.name}. Verify extractions or resolve patient-reported flags.
              </CardDescription>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter('NEEDS_REVIEW')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeFilter === 'NEEDS_REVIEW'
                    ? 'bg-white text-primary font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Needs Review ({counts.needsClinicianReview})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('FLAGGED')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeFilter === 'FLAGGED'
                    ? 'bg-white text-warning font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Patient Flagged ({counts.flagged})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('VERIFIED')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeFilter === 'VERIFIED'
                    ? 'bg-white text-success font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Verified ({counts.verified})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All Items ({medications.length})
              </button>
            </div>
          </div>
        </CardHeader>

        <div className="p-0">
          {filteredMedications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
              <h4 className="text-sm font-bold text-neutral-800">Queue is Clear for {patient.name}</h4>
              <p className="text-xs text-neutral-500">
                {activeFilter === 'NEEDS_REVIEW'
                  ? 'All medications for this patient have been verified and reconciled.'
                  : 'No medications match the active filter.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Medication & Strength</TableHead>
                  <TableHead className="w-[22%]">Instructions</TableHead>
                  <TableHead className="w-[20%]">Prescribing Doctor</TableHead>
                  <TableHead className="w-[14%]">Status & Discrepancy</TableHead>
                  <TableHead className="w-[12%]">Confidence</TableHead>
                  <TableHead className="w-[12%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedications.map((med) => {
                  const isPrescribedByThisDoctor =
                    med.prescribedBy === clinician.name ||
                    (!med.prescribedBy && clinician.title.includes('Primary'));

                  return (
                    <TableRow key={med.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Name & Strength */}
                      <TableCell>
                        <div className="font-bold text-neutral-900 text-sm">{med.name}</div>
                        <div className="font-mono text-xs text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-neutral-200">
                          {med.strength}
                        </div>
                      </TableCell>

                      {/* Instructions */}
                      <TableCell className="text-xs text-neutral-700 leading-relaxed">
                        {med.instructions}
                      </TableCell>

                      {/* Prescribing Doctor & Specialty */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                          <Stethoscope className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span>{med.prescribedBy || patient.doctor}</span>
                        </div>
                        <div className="text-[10px] text-primary mt-0.5">
                          {med.doctorSpecialty || 'Primary Care'}
                        </div>
                        {isPrescribedByThisDoctor ? (
                          <span className="inline-block mt-1 text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded">
                            Prescribed by You
                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[9px] bg-neutral-100 text-neutral-600 font-semibold px-1.5 py-0.2 rounded border border-neutral-200">
                            External Specialist
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {renderStatusBadge(med.status)}
                        {med.patientFlagNote && (
                          <div className="text-[11px] text-warning mt-1 font-medium italic line-clamp-2">
                            "{med.patientFlagNote}"
                          </div>
                        )}
                        {med.conflictDetails && (
                          <div className="text-[11px] text-critical mt-1 font-bold">
                            ⚠️ Conflicts with: {med.conflictDetails.conflictingWith}
                          </div>
                        )}
                      </TableCell>

                      {/* Optical Confidence */}
                      <TableCell>
                        <div className="text-xs font-mono font-bold text-neutral-700">
                          {med.confidence || 95}%
                        </div>
                        <span className="text-[10px] text-neutral-400">OCR Confidence</span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenProvenance(med)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                        >
                          <FileSearch className="h-3.5 w-3.5" />
                          <span>Review & Sign</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Clinical Audit Trail for this Patient */}
      <ClinicianAuditLog />

      {/* Provenance Viewer Modal */}
      <ProvenanceViewer
        medication={selectedMedForProvenance}
        isOpen={isProvenanceModalOpen}
        onClose={() => setIsProvenanceModalOpen(false)}
      />

      {/* Multi-Patient Selection Queue Modal */}
      <PatientQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(newPatId) => setSelectedPatientId(newPatId)}
        patientReviewCounts={patientReviewCounts}
      />
    </main>
  );
};
