import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Clock,
  FileSearch,
  ShieldAlert,
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
import { Medication } from '../../types/medication';
import { ProvenanceViewer } from './ProvenanceViewer';
import { ClinicianAuditLog } from './ClinicianAuditLog';

export const ClinicianDashboard: React.FC = () => {
  const { medications, counts, patient, clinician, document } = useMedications();
  const [selectedMedForProvenance, setSelectedMedForProvenance] = useState<Medication | null>(null);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState(false);
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
      
      {/* Clinician Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <Stethoscope className="h-3.5 w-3.5 text-secondary" />
            Clinician Handover & Reconciliation Queue
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Patient Reconciliation: {patient.name}
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Review patient discrepancies and unverified optical extractions against source documents before committing to the electronic health record.
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
            <p className="text-neutral-500 font-mono text-[11px]">NPI: {clinician.npi}</p>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Triage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Needs Review (Primary urgency) */}
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
            <span>Systemic Conflicts</span>
            <AlertTriangle className="h-4 w-4 text-critical" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-critical">
            {counts.conflict}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">High-risk medication interactions</p>
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
              High-Risk Clinical Conflict Detected in Handover Ingestion
            </h4>
            <p className="text-neutral-700 mt-0.5 leading-relaxed">
              Hydrochlorothiazide 25mg is concurrently prescribed with active Chlorthalidone therapy. Click <strong>Review Provenance</strong> to deprecate duplicate diuretic therapy or adjust clinical intent.
            </p>
          </div>
        </div>
      )}

      {/* Triage Queue Table */}
      <Card className="border border-neutral-200 shadow-card overflow-hidden">
        
        <CardHeader className="bg-white border-b border-neutral-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-neutral-900">
                Prescription Provenance & Reconciliation Queue
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Source Document: <span className="font-mono text-neutral-700 font-semibold">{document ? document.fileName : 'Awaiting Ingestion'}</span>
              </CardDescription>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg border border-neutral-200 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('NEEDS_REVIEW')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeFilter === 'NEEDS_REVIEW'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Needs Review ({counts.needsClinicianReview})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All ({counts.total})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('VERIFIED')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeFilter === 'VERIFIED'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Verified ({counts.verified})
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Triage Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Medication & Strength</TableHead>
                <TableHead className="w-[24%]">Extracted Instructions</TableHead>
                <TableHead className="w-[14%]">Status</TableHead>
                <TableHead className="w-[24%]">Discrepancy / Provenance Context</TableHead>
                <TableHead className="w-[18%] text-right">Clinician Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-xs text-neutral-500">
                    No prescription medications in this triage filter. When a patient uploads a prescription, it will appear here for clinical sign-off.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedications.map((med) => (
                  <TableRow key={med.id} className="hover:bg-neutral-50/80 transition-colors">
                  
                  {/* Medication & Strength */}
                  <TableCell>
                    <div className="font-bold text-neutral-900 text-sm">{med.medicineName || med.name}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
                        {med.strength}
                      </span>
                      <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full inline-block">
                        {med.timesPerDay || 1}x / day
                      </span>
                    </div>
                  </TableCell>

                  {/* Instructions */}
                  <TableCell className="text-xs text-neutral-700 leading-relaxed">
                    {med.instructions}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {renderStatusBadge(med.status)}
                  </TableCell>

                  {/* Context / Flags */}
                  <TableCell>
                    {med.status === 'PATIENT_FLAGGED' && med.patientFlagNote && (
                      <div className="bg-[#fff1f2] border border-[#fca5a5] p-2 rounded text-xs text-[#922B2B]">
                        <span className="font-bold flex items-center gap-1">
                          <Flag className="h-3 w-3 text-warning" />
                          Patient Note:
                        </span>
                        <p className="italic mt-0.5 truncate max-w-[240px]" title={med.patientFlagNote}>
                          "{med.patientFlagNote}"
                        </p>
                      </div>
                    )}

                    {med.status === 'CONFLICT' && med.conflictDetails && (
                      <div className="bg-[#fdf2f2] border border-[#f87171] p-2 rounded text-xs text-[#922B2B]">
                        <span className="font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-critical" />
                          Therapy Conflict:
                        </span>
                        <p className="mt-0.5 text-[11px]">{med.conflictDetails.conflictingWith}</p>
                      </div>
                    )}

                    {med.status === 'VERIFIED' && med.clinicianResolution && (
                      <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <span className="truncate max-w-[240px]" title={med.clinicianResolution.clinicianNote}>
                          Signed: "{med.clinicianResolution.clinicianNote}"
                        </span>
                      </div>
                    )}

                    {med.status === 'PENDING' && (
                      <div className="text-xs text-neutral-500 italic">
                        Raw OCR extraction • Pending physician verification
                      </div>
                    )}
                  </TableCell>

                  {/* Action Button */}
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant={med.status === 'VERIFIED' ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleOpenProvenance(med)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <FileSearch className="h-3.5 w-3.5" />
                      <span>{med.status === 'VERIFIED' ? 'Re-examine' : 'Review & Sign Off'}</span>
                    </Button>
                  </TableCell>

                </TableRow>
              )))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Audit Trail Section */}
      <ClinicianAuditLog />

      {/* Provenance Reconciliation Modal */}
      <ProvenanceViewer
        medication={selectedMedForProvenance}
        isOpen={isProvenanceModalOpen}
        onClose={() => setIsProvenanceModalOpen(false)}
      />

    </main>
  );
};
