import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MedicationProvider, useMedications } from './context/MedicationContext';
import { Navbar } from './components/Navbar';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { ClinicianDashboard } from './components/clinician/ClinicianDashboard';
import { FlagErrorModal } from './components/FlagErrorModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { AccountSettingsModal } from './components/patient/AccountSettingsModal';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PhysicianPendingReview } from './components/physician/PhysicianPendingReview';
import { Medication, FlagDiscrepancyType } from './types/medication';
import { PhysicianUser } from './types/auth';

type AuthView = 'login' | 'register' | 'admin';

// ───────────────────────────────────────────────
// Inner app: handles routing based on auth state & role
// ───────────────────────────────────────────────
const AuthGate: React.FC = () => {
  const { isAuthenticated, currentUser, activeRole } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  // 1. Not Authenticated → Show Login, Register, or Admin Login
  if (!isAuthenticated || !currentUser) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'admin') {
      return <AdminLoginPage onBackToUserLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onNavigateToRegister={() => setAuthView('register')}
        onNavigateToAdmin={() => setAuthView('admin')}
      />
    );
  }

  // 2. Administrator Role → Clinical Admin Dashboard
  if (activeRole === 'admin') {
    return <AdminDashboard />;
  }

  // 3. Physician Role → Check Credential Approval Status
  if (activeRole === 'physician') {
    const physician = currentUser as PhysicianUser;
    if (physician.approvalStatus === 'pending' || physician.approvalStatus === 'rejected') {
      return <PhysicianPendingReview />;
    }
  }

  // 4. Approved Physician or Verified Patient → Main Portal with Medication Context
  return (
    <MedicationProvider>
      <MainAppContent />
    </MedicationProvider>
  );
};

// ───────────────────────────────────────────────
// Main app content (shown for approved physician & patients)
// ───────────────────────────────────────────────
const MainAppContent: React.FC = () => {
  const {
    medications,
    patient,
    document,
    comparisonReports,
    clearAllPatientData,
    flagMedication,
  } = useMedications();

  const { activeRole } = useAuth();

  // Modals state for Patient Portal
  const [selectedMedForFlag, setSelectedMedForFlag] = useState<Medication | null>(null);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState<boolean>(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState<boolean>(false);
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
      <Navbar onOpenAccountSettings={() => setIsAccountSettingsOpen(true)} />

      {/* Route based on logged-in role */}
      <div className="flex-1">
        {activeRole === 'patient' ? (
          <PatientDashboard
            patient={patient}
            document={document}
            medications={medications}
            onOpenFlagModal={handleOpenFlagModal}
            onOpenDocumentViewer={handleOpenDocumentViewer}
            onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
          />
        ) : (
          <ClinicianDashboard />
        )}
      </div>

      {/* Patient: Account Settings & Data Privacy Modal */}
      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        patient={patient}
        medications={medications}
        document={document}
        comparisonReports={comparisonReports}
        onClearAllData={clearAllPatientData}
      />

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
