import React, { useState } from 'react';
import { MedicationProvider, useMedications } from './context/MedicationContext';
import { Navbar } from './components/Navbar';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { ClinicianDashboard } from './components/clinician/ClinicianDashboard';
import { FlagErrorModal } from './components/FlagErrorModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { Medication, FlagDiscrepancyType } from './types/medication';

const MainAppContent: React.FC = () => {
  const {
    medications,
    activePortal,
    patient,
    document,
    flagMedication,
  } = useMedications();

  // Modals state for Patient Portal
  const [selectedMedForFlag, setSelectedMedForFlag] = useState<Medication | null>(null);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState<boolean>(false);
  const [viewerActiveMedicationId, setViewerActiveMedicationId] = useState<string | undefined>(undefined);

  const handleOpenFlagModal = (medication: Medication) => {
    setSelectedMedForFlag(medication);
    setIsFlagModalOpen(true);
  };

  const handleOpenDocumentViewer = (medicationId?: string) => {
    setViewerActiveMedicationId(medicationId);
    setIsViewerModalOpen(true);
  };

  const handleSubmitFlag = (
    medicationId: string,
    discrepancyType: FlagDiscrepancyType,
    comment: string
  ) => {
    flagMedication(medicationId, discrepancyType, comment);
  };

  return (
    <div className="min-h-screen bg-background text-neutral-900 flex flex-col font-sans">
      {/* Universal Top Navigation with Portal Switcher */}
      <Navbar />

      {/* Main View Router based on active portal */}
      <div className="flex-1">
        {activePortal === 'patient' ? (
          <PatientDashboard
            patient={patient}
            document={document}
            medications={medications}
            onOpenFlagModal={handleOpenFlagModal}
            onOpenDocumentViewer={handleOpenDocumentViewer}
          />
        ) : (
          <ClinicianDashboard />
        )}
      </div>

      {/* Patient View 2: Flag Error Modal */}
      <FlagErrorModal
        medication={selectedMedForFlag}
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        onSubmitFlag={handleSubmitFlag}
      />

      {/* Patient View 3: Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        documentName={document ? document.fileName : 'Prescription'}
        documentUrl={document ? document.fileUrl : undefined}
        medications={medications}
        initialActiveMedicationId={viewerActiveMedicationId}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MedicationProvider>
      <MainAppContent />
    </MedicationProvider>
  );
};

export default App;
