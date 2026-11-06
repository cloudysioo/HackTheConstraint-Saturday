import React, { useState } from 'react';
import {
  Clock,
  ShieldAlert,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PhysicianUser } from '../../types/auth';

export const PhysicianPendingReview: React.FC = () => {
  const { currentUser, logout, refreshUserSession } = useAuth();
  const physician = currentUser as PhysicianUser;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    setTimeout(() => {
      refreshUserSession();
      setIsRefreshing(false);
      setRefreshMessage('Status refreshed. Your application is still pending clinical admin review.');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-primary flex flex-col items-center justify-center p-4">
      {/* Background radial highlight */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, #2BC4C6 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/medtrace-logo-cropped.png"
            alt="medTrace"
            className="h-12 w-auto mx-auto object-contain brightness-0 invert"
          />
          <p className="text-white/80 text-xs mt-2 font-medium tracking-wide">
            Continuity Engine · Physician Credential Verification
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight">Account Under Review</h2>
                <p className="text-xs text-white/85">Clinical Credentialing in Progress</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-black/20 text-white px-2.5 py-1 rounded-full border border-white/20">
              Pending Admin Approval
            </span>
          </div>

          <div className="p-7">
            {/* Greeting */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-neutral-800">
                Welcome, {physician?.name || 'Doctor'}
              </h3>
              <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                Your registration records have been securely submitted to the <strong>MedTrace Clinical Administration Team</strong>.
                To protect patient medication continuity and handover integrity, all physician access requires manual license verification.
              </p>
            </div>

            {/* Submitted Records Summary */}
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 mb-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wide">
                <span>Submitted Registration Record</span>
                <span className="text-amber-600 font-mono">Status: PENDING</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block">Registration Number</span>
                  <span className="font-mono font-bold text-primary text-sm">
                    {physician?.registrationNumber || physician?.npi || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Designation / Title</span>
                  <span className="font-semibold text-neutral-800">
                    {physician?.title || 'Attending Physician'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Specialty / Dept</span>
                  <span className="font-semibold text-neutral-800">
                    {physician?.specialty || 'General Practice'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Hospital / Clinic</span>
                  <span className="font-semibold text-neutral-800">
                    {physician?.clinic || 'Metro Health Primary Care'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Email Address</span>
                  <span className="font-semibold text-neutral-800">
                    {physician?.email}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Submission Date</span>
                  <span className="font-semibold text-neutral-800">
                    {physician?.createdAt ? new Date(physician.createdAt).toLocaleDateString() : 'Today'}
                  </span>
                </div>
              </div>
            </div>

            {/* Refresh message */}
            {refreshMessage && (
              <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-600 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>{refreshMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Checking Status…' : 'Check Approval Status'}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Support Note */}
            <div className="mt-6 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
              Need immediate emergency access? Contact{' '}
              <a href="mailto:admin@medtrace.health" className="text-secondary font-semibold hover:underline">
                admin@medtrace.health
              </a>{' '}
              with your registration certificate.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Credentialing Audit Protection · Closed-Loop Handover Safety</span>
        </div>
      </div>
    </div>
  );
};
