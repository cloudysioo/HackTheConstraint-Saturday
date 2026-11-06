import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSearch,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  HelpCircle,
  Loader2,
  ScanText,
  FileImage,
  Zap,
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
import { Medication, UploadedDocument, PatientProfile } from '../../types/medication';
import { useMedications } from '../../context/MedicationContext';

interface PatientDashboardProps {
  patient: PatientProfile;
  document: UploadedDocument | null;
  medications: Medication[];
  onOpenFlagModal: (medication: Medication) => void;
  onOpenDocumentViewer: (medicationId?: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  document,
  medications,
  onOpenFlagModal,
  onOpenDocumentViewer,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProgressText, uploadPrescriptionFile } = useMedications();

  // Handle native file input selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      uploadPrescriptionFile(selectedFile);
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
      uploadPrescriptionFile(droppedFile);
    }
  };

  // Status badge with icon and text label (never color alone)
  const renderStatusBadge = (status: Medication['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="verified">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span>Verified by Doctor</span>
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
            <span>Under Review</span>
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
            Medication Handover Review
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Welcome, {patient.name.split(' ')[0]}. Let's review your medications.
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Upload your prescription photo or document. Our OCR engine extracts each line, and you can cross-reference it before doctor verification.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-neutral-200/90 rounded-xl p-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            MD
          </div>
          <div className="text-xs">
            <p className="text-neutral-500">Supervising Physician</p>
            <p className="font-bold text-neutral-900">{patient.doctor}</p>
            <p className="text-neutral-500">{patient.clinic}</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Upload Area with Native File Picker & Backend OCR */}
      <section aria-labelledby="upload-section-heading">
        <Card className="border border-neutral-200/90 shadow-card">
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle id="upload-section-heading" className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <span>Prescription Document Upload & OCR</span>
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                    Tesseract Engine Active
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-neutral-600">
                  Select any prescription photo (PNG, JPG, WEBP) or document (PDF) to run real optical extraction.
                </CardDescription>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-500 bg-white border border-neutral-200 px-2.5 py-1 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                HIPAA & SOC-2 Protected
              </span>
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
                    {uploadProgressText || 'Scanning optical text and medical entities...'}
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
                  <p className="text-xs sm:text-sm text-neutral-500 max-w-md mb-5">
                    Click anywhere to open your file selection menu, or drag and drop any image/PDF here (PNG, JPG, PDF up to 30MB).
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
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

            {/* Current Active Document State - Only shown when document is uploaded */}
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
                      Extracted {document.itemCount} medications • Timestamp: {document.uploadedAt} • Size: {document.fileSize}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenDocumentViewer()}
                  className="text-xs text-primary font-semibold hover:bg-success/20 hidden sm:flex items-center gap-1"
                >
                  <ScanText className="h-3.5 w-3.5 text-secondary-dark" />
                  <span>View Extracted Document</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2: Extracted Medications Table */}
      <section aria-labelledby="medication-table-heading">
        <Card className="border border-neutral-200/90 shadow-card overflow-hidden">
          <CardHeader className="bg-white border-b border-neutral-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle id="medication-table-heading" className="text-xl font-bold text-neutral-900">
                  Review Extracted Prescription Data
                </CardTitle>
                <CardDescription className="text-sm text-neutral-600 mt-1">
                  Ensure medicine name, dosage, and intake directions match what your doctor explained.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                <span className="font-medium text-neutral-500">Total:</span>
                <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full">
                  {medications.length}
                </span>
              </div>
            </div>
          </CardHeader>

          {/* If no medications extracted yet, show clean state */}
          {medications.length === 0 ? (
            <div className="py-14 sm:py-16 text-center space-y-3 px-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                <FileSearch className="h-7 w-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">
                No Prescriptions Extracted Yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                Please upload a prescription document or photo using the upload box above. Our OCR engine will extract each medication line and detect dosages.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs font-semibold"
              >
                <UploadCloud className="h-4 w-4 mr-1.5" />
                <span>Select File to Upload</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">Medication Name</TableHead>
                      <TableHead className="w-[12%]">Times / Day</TableHead>
                      <TableHead className="w-[10%]">Strength</TableHead>
                      <TableHead className="w-[26%]">Instructions</TableHead>
                      <TableHead className="w-[12%]">Source Document</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[10%] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medications.map((med) => (
                      <TableRow key={med.id} className="hover:bg-neutral-50/80 transition-colors">
                        {/* Name */}
                        <TableCell className="font-bold text-neutral-900">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-base text-neutral-900">{med.medicineName || med.name}</span>
                          </div>
                          {med.patientFlagNote && (
                            <div className="mt-1 text-xs text-warning flex items-center gap-1 font-normal">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[200px]" title={med.patientFlagNote}>
                                Note: "{med.patientFlagNote}"
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Frequency / Times Per Day */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <Zap className="h-3 w-3 text-secondary-dark" />
                            <span>{med.timesPerDay || 1}x / day</span>
                          </span>
                        </TableCell>

                        {/* Strength */}
                        <TableCell>
                          <span className="font-mono text-xs font-semibold bg-neutral-100 px-2 py-1 rounded text-neutral-800 border border-neutral-200">
                            {med.strength}
                          </span>
                        </TableCell>

                        {/* Instructions */}
                        <TableCell className="text-xs text-neutral-700 leading-relaxed">
                          {med.instructions}
                        </TableCell>

                        {/* Source Column: Teal text button "View Document" with FileSearch icon */}
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => onOpenDocumentViewer(med.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-dark hover:text-primary transition-colors focus:outline-none focus:underline"
                            title={`View ${med.name} on source document`}
                          >
                            <FileSearch className="h-4 w-4 text-secondary-dark shrink-0" />
                            <span className="truncate max-w-[120px]">{med.sourceDocument}</span>
                          </button>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {renderStatusBadge(med.status)}
                        </TableCell>

                        {/* Action Column: "Flag Error" button with Flag icon */}
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant={med.status === 'PATIENT_FLAGGED' ? 'warning' : 'outline'}
                            size="sm"
                            onClick={() => onOpenFlagModal(med)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold"
                          >
                            <Flag className="h-3.5 w-3.5 shrink-0" />
                            <span>{med.status === 'PATIENT_FLAGGED' ? 'Edit Flag' : 'Flag Error'}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Conversion */}
              <div className="block md:hidden divide-y divide-neutral-200">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-neutral-900">{med.medicineName || med.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-xs font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 border border-neutral-200">
                            {med.strength}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                            <Zap className="h-2.5 w-2.5 text-secondary-dark" />
                            <span>{med.timesPerDay || 1}x / day</span>
                          </span>
                        </div>
                      </div>
                      <div>{renderStatusBadge(med.status)}</div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Instructions</span>
                      <p className="text-xs text-neutral-700 mt-0.5">{med.instructions}</p>
                    </div>

                    {med.patientFlagNote && (
                      <div className="bg-[#fff1f2] border border-[#fca5a5] rounded-lg p-2.5 text-xs text-[#922B2B]">
                        <span className="font-bold flex items-center gap-1 mb-0.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Patient Review Note:
                        </span>
                        <p className="italic">"{med.patientFlagNote}"</p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => onOpenDocumentViewer(med.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-dark hover:underline"
                      >
                        <FileSearch className="h-4 w-4" />
                        <span>View Document</span>
                      </button>

                      <Button
                        type="button"
                        variant={med.status === 'PATIENT_FLAGGED' ? 'warning' : 'outline'}
                        size="sm"
                        onClick={() => onOpenFlagModal(med)}
                        className="h-8 text-xs font-semibold"
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        <span>{med.status === 'PATIENT_FLAGGED' ? 'Edit Flag' : 'Flag Error'}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disclaimer Banner */}
              <div className="bg-[#FFF9E6] border-t border-b border-[#F7E7A9] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-800 leading-relaxed">
                    <strong className="text-neutral-900 font-semibold block sm:inline mr-1">
                      ⚠️ If any information looks wrong, flag it. Your doctor will review your flag and update the record.
                    </strong>
                    <span className="font-bold text-[#922B2B]">
                      Do not stop taking your medication unless instructed by your doctor.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </section>

      {/* Support Banner */}
      <section className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-secondary/15 text-primary flex items-center justify-center shrink-0">
            <HelpCircle className="h-5 w-5 text-secondary-dark" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">Have questions about your prescription handover?</h4>
            <p className="text-xs text-neutral-600 mt-0.5">
              Contact Dr. Rajesh Iyer's clinic care team directly at <span className="font-semibold text-neutral-800">(555) 234-5678</span>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
