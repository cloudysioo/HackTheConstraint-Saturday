import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Flag, ShieldAlert, CheckCircle, FileText, Info } from 'lucide-react';
import { Medication, FlagDiscrepancyType } from '../types/medication';
import { PrescriptionPreview } from './PrescriptionPreview';

interface FlagErrorModalProps {
  medication: Medication | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFlag: (
    medicationId: string,
    discrepancyType: FlagDiscrepancyType,
    comment: string
  ) => void;
}

export const FlagErrorModal: React.FC<FlagErrorModalProps> = ({
  medication,
  isOpen,
  onClose,
  onSubmitFlag,
}) => {
  const [discrepancyType, setDiscrepancyType] = useState<FlagDiscrepancyType>('Wrong Dosage');
  const [comment, setComment] = useState('');
  const [acknowledgedSafety, setAcknowledgedSafety] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Initialize or reset form when medication changes
  useEffect(() => {
    if (medication) {
      if (medication.flagDetails) {
        setDiscrepancyType(medication.flagDetails.discrepancyType);
        setComment(medication.flagDetails.comment);
        setAcknowledgedSafety(true);
      } else {
        setDiscrepancyType('Wrong Dosage');
        setComment('');
        setAcknowledgedSafety(false);
      }
      setSubmittedSuccess(false);
    }
  }, [medication]);

  if (!medication) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgedSafety) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitFlag(medication.id, discrepancyType, comment);
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 400);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        maxWidth="max-w-4xl"
        onClose={onClose}
        className="p-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto shadow-2xl"
      >
        {/* Sticky Header - Never cut off from top */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-neutral-200/80 bg-white shrink-0 pr-14">
          <DialogHeader className="mb-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0 border border-warning/20">
                <Flag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-neutral-900 leading-snug">
                  Report an Error for {medication.name}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                  Your doctor will review your notes against the clinic's master medical records.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {submittedSuccess ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-success/15 text-success rounded-full mx-auto flex items-center justify-center border border-success/30">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Flag Submitted to Clinician</h3>
            <p className="text-sm text-neutral-600 max-w-md mx-auto">
              Your flag for <span className="font-semibold text-neutral-800">{medication.name}</span> has been saved and routed to Dr. Rajesh Iyer for verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 text-left">
              {/* Visual Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
                {/* Left Side: Extracted Data (Read-Only) */}
                <div className="md:col-span-5 bg-neutral-50 rounded-xl p-3.5 sm:p-4 border border-neutral-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-200">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        What We Extracted (AI)
                      </span>
                      <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">
                        Read-Only
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[11px] text-neutral-500 font-medium block">Medication Name</span>
                        <p className="text-sm sm:text-base font-bold text-neutral-900">{medication.name}</p>
                      </div>

                      <div>
                        <span className="text-[11px] text-neutral-500 font-medium block">Extracted Strength</span>
                        <p className="text-xs sm:text-sm font-semibold text-neutral-800 bg-white px-2.5 py-1 rounded border border-neutral-200 font-mono">
                          {medication.strength}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] text-neutral-500 font-medium block">Extracted Instructions</span>
                        <p className="text-xs text-neutral-700 bg-white px-2.5 py-1.5 rounded border border-neutral-200 leading-relaxed">
                          {medication.instructions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-200/80 text-[11px] text-neutral-500 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                    <span>
                      The AI only reads the image. It cannot modify your clinical plan.
                    </span>
                  </div>
                </div>

                {/* Right Side: Original Scanned Document */}
                <div className="md:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      Original Document Snippet
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-medium text-warning flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                      Yellow Box = Extraction Line
                    </span>
                  </div>

                  <div className="rounded-xl border border-neutral-200 overflow-hidden bg-neutral-100 max-h-[190px] overflow-y-auto shadow-inner">
                    <PrescriptionPreview
                      highlightMedicationId={medication.id}
                      compact={true}
                      documentUrl={medication.sourceUrl}
                      documentName={medication.sourceDocument}
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 pt-3 border-t border-neutral-200">
                {/* Dropdown: What looks wrong? */}
                <div>
                  <label
                    htmlFor="discrepancyType"
                    className="block text-xs sm:text-sm font-semibold text-neutral-900 mb-1"
                  >
                    What looks wrong? <span className="text-warning">*</span>
                  </label>
                  <select
                    id="discrepancyType"
                    value={discrepancyType}
                    onChange={(e) => setDiscrepancyType(e.target.value as FlagDiscrepancyType)}
                    className="w-full h-10 rounded-lg border border-neutral-300 bg-white px-3 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer font-medium"
                  >
                    <option value="Wrong Dosage">Wrong Dosage (e.g. 10mg instead of 5mg)</option>
                    <option value="Wrong Medicine">Wrong Medicine Name</option>
                    <option value="Wrong Instructions">Wrong Instructions (timing, frequency, meals)</option>
                    <option value="Other">Other Discrepancy or Unclear Writing</option>
                  </select>
                </div>

                {/* Textarea: Tell your doctor */}
                <div>
                  <label
                    htmlFor="patientComment"
                    className="block text-xs sm:text-sm font-semibold text-neutral-900 mb-1"
                  >
                    Tell your doctor what you think is correct <span className="text-warning">*</span>
                  </label>
                  <Textarea
                    id="patientComment"
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="I believe my doctor said 5mg, not 10mg."
                    required
                    className="resize-none text-xs sm:text-sm"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Describe what your physician discussed with you or what is printed on your medicine strip.
                  </p>
                </div>

                {/* Safety Checkbox */}
                <div className="bg-[#fff1f2] border border-[#fca5a5] rounded-xl p-3 sm:p-3.5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledgedSafety}
                      onChange={(e) => setAcknowledgedSafety(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-400 text-primary focus:ring-primary accent-primary shrink-0"
                      required
                    />
                    <div className="text-xs leading-relaxed text-neutral-800">
                      <span className="font-bold text-[#922B2B] flex items-center gap-1.5 mb-0.5">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[#922B2B]" />
                        Safety Confirmation
                      </span>
                      <span>
                        I understand this is a request for review and <strong>not a change to my prescription</strong>. I will not stop or alter my medication until confirmed by my doctor.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-neutral-200/80 bg-neutral-50 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!acknowledgedSafety || !comment.trim() || isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 h-9 sm:h-10 text-xs sm:text-sm font-semibold"
              >
                <Flag className="h-4 w-4" />
                <span>{isSubmitting ? 'Submitting to Doctor...' : 'Submit to Doctor'}</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
