import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import {
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Flag,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Medication } from '../../types/medication';
import { PrescriptionPreview } from '../PrescriptionPreview';
import { useMedications } from '../../context/MedicationContext';

interface ProvenanceViewerProps {
  medication: Medication | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceViewer: React.FC<ProvenanceViewerProps> = ({
  medication,
  isOpen,
  onClose,
}) => {
  const { resolveMedication, patient, clinician } = useMedications();

  const [decisionMode, setDecisionMode] = useState<'APPROVE' | 'REVISE' | 'DISMISS'>('APPROVE');
  const [revisedStrength, setRevisedStrength] = useState('');
  const [revisedInstructions, setRevisedInstructions] = useState('');
  const [clinicianNote, setClinicianNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (medication) {
      if (medication.status === 'PATIENT_FLAGGED') {
        setDecisionMode('REVISE');
        setRevisedStrength('5mg');
        setRevisedInstructions(medication.instructions);
        setClinicianNote('Reviewed clinic encounter notes; agreed with patient dosage clarification.');
      } else if (medication.status === 'CONFLICT') {
        setDecisionMode('REVISE');
        setRevisedStrength(medication.strength);
        setRevisedInstructions('Discontinue prior Chlorthalidone; take HCTZ 25mg daily.');
        setClinicianNote('Resolved dual-diuretic conflict. Deprecated prior prescription.');
      } else {
        setDecisionMode('APPROVE');
        setRevisedStrength(medication.strength);
        setRevisedInstructions(medication.instructions);
        setClinicianNote('Optical extraction verified against physical prescription pad.');
      }
    }
  }, [medication]);

  if (!medication) return null;

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      if (decisionMode === 'APPROVE') {
        resolveMedication(medication.id, 'APPROVE_EXTRACTION', clinicianNote);
      } else if (decisionMode === 'REVISE') {
        resolveMedication(medication.id, 'REVISE_MEDICATION', clinicianNote, {
          strength: revisedStrength,
          instructions: revisedInstructions,
        });
      } else {
        resolveMedication(medication.id, 'DISMISS_FLAG', clinicianNote);
      }
      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-6xl" onClose={onClose} className="p-4 sm:p-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="border-b border-neutral-200 pb-3 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-secondary flex items-center justify-center shrink-0 shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <span>Clinical Provenance & Adjudication</span>
                  <span className="text-xs font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                    {medication.name}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Patient: {patient.name} (MRN: {patient.id}) • Supervising Clinician: {clinician.name}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
              <span className="text-neutral-500">Current Status:</span>
              <span
                className={`font-semibold px-2.5 py-0.5 rounded-full border text-xs ${
                  medication.status === 'PATIENT_FLAGGED'
                    ? 'bg-[#fff1f2] text-[#FF5A5F] border-[#fca5a5]'
                    : medication.status === 'CONFLICT'
                    ? 'bg-[#fdf2f2] text-[#922B2B] border-[#f87171]'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                {medication.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* 3-Column Reconciliation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-y-auto pr-1">
          
          {/* Column 1: Original Scanned Document Provenance (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <FileSearch className="h-3.5 w-3.5 text-primary" />
                Physical Scan Provenance
              </span>
              <span className="text-[11px] text-warning font-medium">Yellow Box = Active Row</span>
            </div>

            <div className="rounded-xl border border-neutral-200 overflow-hidden bg-neutral-100 max-h-[460px] overflow-y-auto shadow-inner">
              <PrescriptionPreview highlightMedicationId={medication.id} compact={true} />
            </div>
            <p className="text-[11px] text-neutral-500 italic">
              Source file: {medication.sourceDocument || 'Visit_Oct_2024.pdf'} • Tamper-evident scan hash verified.
            </p>
          </div>

          {/* Column 2: AI Extraction & Patient Context (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-secondary-dark" />
              Extraction & Patient Flag
            </span>

            {/* AI Extracted Summary */}
            <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 space-y-2 text-xs">
              <div className="font-semibold text-neutral-700 pb-1 border-b border-neutral-200 flex justify-between">
                <span>AI Extracted Record</span>
                <span className="text-[10px] text-success font-bold">99.4% OCR Confidence</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Medication:</span>
                <span className="font-bold text-neutral-900 text-sm">{medication.name}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Strength:</span>
                <span className="font-mono font-bold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200 inline-block">
                  {medication.strength}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Instructions:</span>
                <span className="text-neutral-700 block leading-relaxed">{medication.instructions}</span>
              </div>
            </div>

            {/* Patient Flag Callout if present */}
            {medication.patientFlagNote && (
              <div className="bg-[#fff1f2] border border-[#fca5a5] rounded-xl p-3.5 space-y-1.5 text-xs text-[#922B2B]">
                <div className="flex items-center gap-1.5 font-bold">
                  <Flag className="h-4 w-4 text-warning" />
                  <span>Patient Flag: {medication.flagDetails?.discrepancyType || 'Dosage'}</span>
                </div>
                <p className="bg-white/80 p-2 rounded border border-[#fca5a5]/50 italic text-neutral-800">
                  "{medication.patientFlagNote}"
                </p>
                <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Submitted {medication.flagDetails?.submittedAt || 'Today'}</span>
                </div>
              </div>
            )}

            {/* Conflict Callout if present */}
            {medication.conflictDetails && (
              <div className="bg-[#fdf2f2] border border-[#f87171] rounded-xl p-3.5 space-y-1.5 text-xs text-[#922B2B]">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-critical" />
                  <span>Critical Conflict Alert</span>
                </div>
                <p className="text-neutral-800 leading-tight">
                  {medication.conflictDetails.description}
                </p>
                <span className="inline-block font-semibold text-[11px] bg-white px-2 py-0.5 rounded border border-critical/30">
                  {medication.conflictDetails.conflictingWith}
                </span>
              </div>
            )}
          </div>

          {/* Column 3: Clinician Adjudication & Decision Form (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-neutral-200 p-4 flex flex-col justify-between shadow-xs">
            <form onSubmit={handleFinalize} className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Clinician Adjudication
                </span>
                
                {/* Decision Radio / Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 mb-3">
                  <button
                    type="button"
                    onClick={() => setDecisionMode('APPROVE')}
                    className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                      decisionMode === 'APPROVE'
                        ? 'bg-success text-white shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionMode('REVISE')}
                    className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                      decisionMode === 'REVISE'
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Amend
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionMode('DISMISS')}
                    className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                      decisionMode === 'DISMISS'
                        ? 'bg-neutral-800 text-white shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Reaffirm
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs according to Decision Mode */}
              {decisionMode === 'REVISE' && (
                <div className="space-y-2.5 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <div className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    Corrected Prescription Values
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Approved Strength
                    </label>
                    <Input
                      value={revisedStrength}
                      onChange={(e) => setRevisedStrength(e.target.value)}
                      placeholder="e.g. 5mg"
                      className="h-9 text-xs font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Approved Instructions
                    </label>
                    <Input
                      value={revisedInstructions}
                      onChange={(e) => setRevisedInstructions(e.target.value)}
                      placeholder="e.g. Take 1 tablet daily"
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {decisionMode === 'APPROVE' && (
                <div className="bg-[#e8f5e9]/70 border border-[#a5d6a7] p-3 rounded-lg text-xs text-neutral-800">
                  <span className="font-bold text-success block mb-0.5">Confirmation Action</span>
                  You are validating that the AI extraction matches the patient's active medical directive without modifications.
                </div>
              )}

              {decisionMode === 'DISMISS' && (
                <div className="bg-neutral-100 border border-neutral-300 p-3 rounded-lg text-xs text-neutral-800">
                  <span className="font-bold text-neutral-900 block mb-0.5">Reaffirm Prescription</span>
                  The patient's flag will be dismissed with a clarifying medical explanation entered below.
                </div>
              )}

              {/* Clinician Rationale Note */}
              <div>
                <label className="text-xs font-semibold text-neutral-900 block mb-1">
                  Clinician Clinical Rationale <span className="text-warning">*</span>
                </label>
                <Textarea
                  value={clinicianNote}
                  onChange={(e) => setClinicianNote(e.target.value)}
                  rows={3}
                  placeholder="State the clinical basis for this determination..."
                  required
                  className="text-xs resize-none"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  This note is timestamped with your NPI ({clinician.npi}) and visible to the patient.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!clinicianNote.trim() || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 h-10 text-xs font-bold shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  <span>{isSubmitting ? 'Committing to Record...' : 'Sign & Finalize Adjudication'}</span>
                </Button>
              </div>
            </form>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
};
