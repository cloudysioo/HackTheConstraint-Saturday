import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MedicationProvider, useMedications } from './context/MedicationContext';
import { Navbar } from './components/Navbar';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { ClinicianDashboard } from './components/clinician/ClinicianDashboard';
import { FlagErrorModal } from './components/FlagErrorModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Medication, FlagDiscrepancyType } from './types/medication';

type AuthView = 'login' | 'register';

// ───────────────────────────────────────────────
// Inner app: requires AuthProvider already mounted
// ───────────────────────────────────────────────
const AuthGate: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthView('register')} />;
  }

  // User is authenticated → mount the full app with medication state
  return (
    <MedicationProvider>
      <MainAppContent />
    </MedicationProvider>
  );
};

// ───────────────────────────────────────────────
// Main app content (shown after login)
// ───────────────────────────────────────────────
const MainAppContent: React.FC = () => {
  const {
    medications,
    patient,
    document,
    flagMedication,
  } = useMedications();

  const { activeRole } = useAuth();

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
      {/* Top navigation */}
      <Navbar />

      {/* Route based on logged-in role */}
      <div className="flex-1">
        {activeRole === 'patient' ? (
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

      {/* Patient: Flag Error Modal */}
      <FlagErrorModal
        medication={selectedMedForFlag}
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        onSubmitFlag={handleSubmitFlag}
      />

      {/* Patient: Document Viewer Modal */}
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

// ───────────────────────────────────────────────
// Root — AuthProvider wraps everything
// ───────────────────────────────────────────────
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
};

export default App;
