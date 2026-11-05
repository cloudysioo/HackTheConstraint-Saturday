import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { FileSearch, ZoomIn, ZoomOut, RotateCcw, Layers, CheckCircle2 } from 'lucide-react';
import { Medication } from '../types/medication';
import { PrescriptionPreview } from './PrescriptionPreview';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentUrl?: string;
  medications: Medication[];
  initialActiveMedicationId?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentName,
  documentUrl,
  medications,
  initialActiveMedicationId,
}) => {
  const [activeMedicationId, setActiveMedicationId] = useState<string | undefined>(
    initialActiveMedicationId || (medications.length > 0 ? medications[0].id : undefined)
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Sync initialActiveMedicationId if prop changes
  React.useEffect(() => {
    if (initialActiveMedicationId) {
      setActiveMedicationId(initialActiveMedicationId);
    }
  }, [initialActiveMedicationId]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 145));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 85));
  const handleResetZoom = () => setZoomLevel(100);

  const selectedMed = medications.find((m) => m.id === activeMedicationId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-5xl" onClose={onClose} className="p-4 sm:p-6 max-h-[92vh] flex flex-col">
        
        {/* Modal Header & Controls */}
        <DialogHeader className="border-b border-neutral-200 pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-primary flex items-center justify-center shrink-0 border border-secondary/30">
                <FileSearch className="h-5 w-5 text-secondary-dark" />
              </div>
              <div>
                <DialogTitle className="text-xl text-neutral-900 flex items-center gap-2">
                  <span>Document Viewer: {documentName}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Original scanned prescription with AI optical bounding boxes
                </DialogDescription>
              </div>
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200 self-start sm:self-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 px-2 text-xs"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono px-1 font-semibold text-neutral-600 min-w-[42px] text-center">
                {zoomLevel}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 px-2 text-xs"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-5 bg-neutral-300 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetZoom}
                className="h-8 px-2 text-xs"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Medication Selector Tabs (Quick Jump to highlighted line) */}
        <div className="flex items-center gap-2 pb-3 overflow-x-auto border-b border-neutral-100 text-xs shrink-0">
          <span className="font-semibold text-neutral-500 flex items-center gap-1 whitespace-nowrap">
            <Layers className="h-3.5 w-3.5" />
            Extracted Lines:
          </span>
          {medications.map((med) => {
            const isActive = activeMedicationId === med.id;
            return (
              <button
                key={med.id}
                onClick={() => setActiveMedicationId(med.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <span>{med.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {med.strength}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Document Canvas with Bounding Box Overlay */}
        <div className="flex-1 overflow-auto bg-neutral-100/80 rounded-xl p-4 sm:p-8 border border-neutral-200 flex justify-center items-start my-2 min-h-[350px]">
          <div
            className="transition-transform duration-200 origin-top shadow-lg max-w-3xl w-full"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <PrescriptionPreview
              highlightMedicationId={activeMedicationId}
              medications={medications}
              compact={false}
              documentUrl={documentUrl}
              documentName={documentName}
            />
          </div>
        </div>

        {/* Active Inspection Legend & Patient Note */}
        {selectedMed && (
          <div className="mt-2 bg-[#F8F9FA] border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 shrink-0" />
              <span className="font-semibold text-neutral-900">
                Current Box: {selectedMed.name} ({selectedMed.strength})
              </span>
              <span className="text-neutral-500 hidden sm:inline">— {selectedMed.instructions}</span>
            </div>
            <div className="text-neutral-500 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span>OCR Source Confidence: 99.4%</span>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};
