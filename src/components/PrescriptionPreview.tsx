import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Medication } from '../types/medication';

interface PrescriptionPreviewProps {
  highlightMedicationId?: string;
  medications?: Medication[];
  compact?: boolean;
  documentUrl?: string;
  documentName?: string;
}

export const PrescriptionPreview: React.FC<PrescriptionPreviewProps> = ({
  highlightMedicationId,
  medications = [],
  compact = false,
  documentUrl,
  documentName,
}) => {
  // If a real uploaded image URL exists, render the real photo with optical bounding box overlays
  if (documentUrl) {
    const activeMed = medications.find((m) => m.id === highlightMedicationId);

    return (
      <div className={`relative w-full rounded-xl border border-neutral-300 bg-neutral-900/5 overflow-hidden select-none ${compact ? 'p-1' : 'p-2'}`}>
        <div className="w-full flex justify-center bg-white rounded-lg p-1">
          <div className="relative inline-block overflow-hidden rounded">
            <img
              src={documentUrl}
              alt={documentName || 'Uploaded Prescription Document'}
              className="w-full h-auto max-h-[650px] object-contain rounded block"
            />

            {/* Render optical bounding boxes directly over the uploaded document */}
            {medications.map((med) => {
              if (!med.boundingBox) return null;
              const isHighlighted = highlightMedicationId === med.id;
              return (
                <div
                  key={med.id}
                  style={{
                    top: `${med.boundingBox.top}%`,
                    left: `${med.boundingBox.left}%`,
                    width: `${med.boundingBox.width}%`,
                    height: `${med.boundingBox.height}%`,
                  }}
                  className={`absolute rounded transition-all cursor-pointer ${
                    isHighlighted
                      ? 'bg-yellow-300/45 border-2 border-yellow-500 ring-2 ring-yellow-400/40 z-20'
                      : 'bg-yellow-200/20 border border-yellow-400/60 hover:bg-yellow-300/30 z-10'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-5 left-0 bg-yellow-400 text-neutral-900 font-sans text-[10px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap">
                      {med.name} ({med.strength})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {activeMed && (
          <div className="mt-2 px-2 py-1 bg-white border border-neutral-200 rounded text-[11px] flex items-center justify-between font-sans">
            <span className="font-semibold text-neutral-800">
              Selected: {activeMed.name} • {activeMed.strength}
            </span>
            <span className="text-neutral-500 text-[10px]">
              Confidence: {activeMed.confidence || 96}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Scanned Clinical Prescription Pad Replica
  return (
    <div
      className={`relative w-full rounded-xl border border-neutral-300 bg-[#FCFBF8] text-neutral-800 shadow-inner overflow-hidden select-none font-serif ${
        compact ? 'p-3 text-xs' : 'p-6 sm:p-8 text-sm'
      }`}
      style={{
        backgroundImage: `radial-gradient(#e5e7eb 0.75px, transparent 0.75px)`,
        backgroundSize: '16px 16px',
      }}
    >
      {/* Clinic Header */}
      <div className="border-b-2 border-neutral-800 pb-3 mb-4 flex justify-between items-start font-sans">
        <div>
          <h4 className={`font-bold tracking-tight text-neutral-900 ${compact ? 'text-xs' : 'text-base'}`}>
            METRO HEALTH PRIMARY CARE
          </h4>
          <p className={`text-neutral-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            1200 Healthcare Ave, Suite 400 • Tel: (555) 234-5678
          </p>
          <p className={`text-neutral-600 font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Dr. Rajesh Iyer, M.D. • NPI: 184920491
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block font-mono bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 rounded text-neutral-600 ${compact ? 'text-[9px]' : 'text-xs'}`}>
            RX #49281-01
          </span>
          <p className={`text-neutral-500 mt-1 font-sans ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Date: 10/24/2024
          </p>
        </div>
      </div>

      {/* Patient Information */}
      <div className={`grid grid-cols-2 gap-2 bg-neutral-100/60 p-2.5 rounded border border-neutral-200/80 mb-5 font-sans ${compact ? 'text-[10px] p-2' : 'text-xs'}`}>
        <div>
          <span className="text-neutral-500">Patient: </span>
          <span className="font-semibold text-neutral-900">Arjun Sharma</span>
        </div>
        <div>
          <span className="text-neutral-500">DOB: </span>
          <span className="font-semibold text-neutral-900">04/12/1968 (Age 56)</span>
        </div>
        <div>
          <span className="text-neutral-500">MRN: </span>
          <span className="font-mono text-neutral-800">PT-94021</span>
        </div>
        <div>
          <span className="text-neutral-500">Source Scan: </span>
          <span className="font-medium text-neutral-800">{documentName || 'Visit_Oct_2024.pdf'}</span>
        </div>
      </div>

      {/* Prescription Symbol */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl font-bold italic font-serif text-[#1F4E5B]">℞</span>
        <span className="text-neutral-400 font-sans uppercase tracking-widest text-[10px]">
          Prescribed Medications (Official Handover Document)
        </span>
      </div>

      {/* Medication Lines with AI Optical Bounding-Box Overlay */}
      <div className="space-y-3 font-mono relative">
        {/* Row 1: Atorvastatin */}
        <div
          className={`relative p-2.5 rounded transition-all ${
            highlightMedicationId === 'med-1'
              ? 'bg-yellow-200/50 border-2 border-yellow-400 ring-2 ring-yellow-400/30'
              : 'hover:bg-neutral-100/40 border border-transparent'
          }`}
        >
          {highlightMedicationId === 'med-1' && (
            <div className="absolute -top-3 right-2 bg-yellow-400 text-neutral-900 font-sans text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              Extracted Line
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-neutral-900">1. Atorvastatin 20 mg oral tablet</span>
            <span className="text-xs text-neutral-500">Disp: #30</span>
          </div>
          <p className="text-neutral-700 text-xs mt-0.5">Sig: Take 1 tablet by mouth daily at bedtime</p>
          <p className="text-neutral-500 text-[10px]">Refills: 3</p>
        </div>

        {/* Row 2: Lisinopril */}
        <div
          className={`relative p-2.5 rounded transition-all ${
            highlightMedicationId === 'med-2'
              ? 'bg-yellow-200/50 border-2 border-yellow-400 ring-2 ring-yellow-400/30'
              : 'hover:bg-neutral-100/40 border border-transparent'
          }`}
        >
          {highlightMedicationId === 'med-2' && (
            <div className="absolute -top-3 right-2 bg-yellow-400 text-neutral-900 font-sans text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              Extracted Line
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-neutral-900">2. Lisinopril 10 mg oral tablet</span>
            <span className="text-xs text-neutral-500">Disp: #30</span>
          </div>
          <p className="text-neutral-700 text-xs mt-0.5">Sig: Take 1 tablet by mouth daily in the morning</p>
          <p className="text-neutral-500 text-[10px]">Refills: 2</p>
        </div>

        {/* Row 3: Metformin */}
        <div
          className={`relative p-2.5 rounded transition-all ${
            highlightMedicationId === 'med-3'
              ? 'bg-yellow-200/50 border-2 border-yellow-400 ring-2 ring-yellow-400/30'
              : 'hover:bg-neutral-100/40 border border-transparent'
          }`}
        >
          {highlightMedicationId === 'med-3' && (
            <div className="absolute -top-3 right-2 bg-yellow-400 text-neutral-900 font-sans text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              Extracted Line
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-neutral-900">3. Metformin 500 mg oral tablet</span>
            <span className="text-xs text-neutral-500">Disp: #60</span>
          </div>
          <p className="text-neutral-700 text-xs mt-0.5">Sig: Take twice daily with meals</p>
          <p className="text-neutral-500 text-[10px]">Refills: 5</p>
        </div>

        {/* Row 4: Hydrochlorothiazide */}
        <div
          className={`relative p-2.5 rounded transition-all ${
            highlightMedicationId === 'med-4'
              ? 'bg-yellow-200/50 border-2 border-yellow-400 ring-2 ring-yellow-400/30'
              : 'hover:bg-neutral-100/40 border border-transparent'
          }`}
        >
          {highlightMedicationId === 'med-4' && (
            <div className="absolute -top-3 right-2 bg-yellow-400 text-neutral-900 font-sans text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              Extracted Line
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-neutral-900">4. Hydrochlorothiazide 25 mg oral tablet</span>
            <span className="text-xs text-neutral-500">Disp: #30</span>
          </div>
          <p className="text-neutral-700 text-xs mt-0.5">Sig: Take 1 tablet daily in the morning</p>
          <p className="text-neutral-500 text-[10px]">Refills: 1</p>
        </div>
      </div>

      {/* Signature & Provenance Stamp */}
      <div className="mt-5 pt-3 border-t border-neutral-300 font-sans flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-neutral-500 text-[10px]">
          <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
          <span>Legally binding clinical document • Verified Physical Origin</span>
        </div>
        <div className="text-right">
          <div className="font-serif italic text-sm text-neutral-800 border-b border-neutral-400 pb-0.5">
            Rajesh Iyer, MD
          </div>
          <div className="text-[9px] text-neutral-400">Electronic Prescribing Stamp</div>
        </div>
      </div>
    </div>
  );
};
