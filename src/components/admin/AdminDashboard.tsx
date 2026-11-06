import React, { useState } from 'react';
import {
  ShieldCheck,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building,
  Mail,
  Search,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PhysicianUser } from '../../types/auth';

export const AdminDashboard: React.FC = () => {
  const { currentUser, logout, getAllPhysicians, approvePhysician, rejectPhysician } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const physicians = getAllPhysicians();

  const pendingDoctors = physicians.filter((p) => p.approvalStatus === 'pending');
  const approvedDoctors = physicians.filter((p) => p.approvalStatus === 'approved');
  const rejectedDoctors = physicians.filter((p) => p.approvalStatus === 'rejected');

  const filteredList = physicians.filter((p) => {
    if (activeTab === 'pending' && p.approvalStatus !== 'pending') return false;
    if (activeTab === 'approved' && p.approvalStatus !== 'approved') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.registrationNumber && p.registrationNumber.toLowerCase().includes(q)) ||
        (p.specialty && p.specialty.toLowerCase().includes(q)) ||
        (p.clinic && p.clinic.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleApprove = async (physician: PhysicianUser) => {
    setProcessingId(physician.id);
    setActionMessage(null);
    try {
      const res = await approvePhysician(physician.id);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Doctor ${physician.name} (Reg #${physician.registrationNumber || 'N/A'}) has been approved! They now have full Physician Portal access.`,
        });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (physician: PhysicianUser) => {
    const reason = window.prompt(
      `Enter reason for rejecting ${physician.name}'s registration:`,
      'Unable to verify medical registration number with state council.'
    );
    if (reason === null) return; // User cancelled

    setProcessingId(physician.id);
    setActionMessage(null);
    try {
      const res = await rejectPhysician(physician.id, reason);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Registration for ${physician.name} has been rejected.`,
        });
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-neutral-900 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-neutral-900 text-white shadow-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Portal Identity */}
            <div className="flex items-center space-x-3.5">
              <img
                src="/medtrace-logo-cropped.png"
                alt="medTrace"
                className="h-10 sm:h-11 w-auto object-contain brightness-0 invert"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">
                    Administrator Console
                  </span>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5 hidden sm:block">
                  Clinical Credentialing & Portal Access Control
                </p>
              </div>
            </div>

            {/* Right: Admin identity & Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-xs">
                <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                  AD
                </div>
                <div className="text-left text-xs leading-tight hidden sm:block">
                  <div className="font-semibold text-white">{currentUser?.name || 'Administrator'}</div>
                  <div className="text-white/60 text-[10px]">{currentUser?.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 border border-white/20 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Alert if action taken */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-start gap-3 border shadow-sm ${
              actionMessage.type === 'success'
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-critical/10 border-critical/30 text-critical'
            }`}
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-semibold">{actionMessage.text}</div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs hover:opacity-75 font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Pending Reviews */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pending Reviews</p>
                <p className="text-3xl font-extrabold text-amber-600 mt-1">{pendingDoctors.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Doctors awaiting license verification</p>
            {pendingDoctors.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
            )}
          </div>

          {/* Approved Doctors */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Physicians</p>
                <p className="text-3xl font-extrabold text-primary mt-1">{approvedDoctors.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Stethoscope className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Verified with active portal access</p>
          </div>

          {/* Rejected Applications */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Rejected</p>
                <p className="text-3xl font-extrabold text-neutral-700 mt-1">{rejectedDoctors.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Failed credential verification</p>
          </div>

          {/* Platform Status */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Credential Engine</p>
                <p className="text-base font-bold text-success mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Operational
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Closed-loop handover audit enabled</p>
          </div>
        </div>

        {/* Doctor Verification Management Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Physician Credential Verification</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review submitted medical registration numbers and grant access to the Physician Portal.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search doctor, reg #, clinic…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-60"
                />
              </div>

              {/* Tabs */}
              <div className="flex items-center bg-neutral-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'pending'
                      ? 'bg-white text-primary font-bold shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Pending ({pendingDoctors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('approved')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'approved'
                      ? 'bg-white text-primary font-bold shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Approved ({approvedDoctors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'all'
                      ? 'bg-white text-primary font-bold shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  All ({physicians.length})
                </button>
              </div>
            </div>
          </div>

          {/* Table List */}
          {filteredList.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-700">No physicians found</h3>
              <p className="text-xs text-neutral-500 mt-1">
                {activeTab === 'pending'
                  ? 'There are currently no doctor registration records pending review.'
                  : 'Try adjusting your search filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Doctor & Contact</th>
                    <th className="px-5 py-3.5">Medical Registration No</th>
                    <th className="px-5 py-3.5">Title & Specialty</th>
                    <th className="px-5 py-3.5">Hospital / Practice</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150">
                  {filteredList.map((doc) => {
                    const isPending = doc.approvalStatus === 'pending';
                    const isApproved = doc.approvalStatus === 'approved';
                    const isProcessing = processingId === doc.id;

                    return (
                      <tr
                        key={doc.id}
                        className={`hover:bg-neutral-50/70 transition-colors ${
                          isPending ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Doctor Name & Email */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                              MD
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 text-sm">{doc.name}</div>
                              <div className="text-neutral-500 flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" />
                                <span>{doc.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Medical Registration Number */}
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold bg-neutral-100 text-primary px-2.5 py-1 rounded border border-neutral-200 text-xs">
                            {doc.registrationNumber || doc.npi || 'PENDING'}
                          </span>
                          {doc.licenseNumber && (
                            <div className="text-[10px] text-neutral-400 mt-1">
                              Lic: {doc.licenseNumber}
                            </div>
                          )}
                        </td>

                        {/* Title & Specialty */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-neutral-800">{doc.title || 'Physician'}</div>
                          <div className="text-neutral-500 text-[11px]">{doc.specialty || 'General Medicine'}</div>
                        </td>

                        {/* Hospital / Clinic */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Building className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                            <span>{doc.clinic || 'Metro Health Primary Care'}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="h-3 w-3" />
                              Under Review
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Approved
                            </span>
                          )}
                          {doc.approvalStatus === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(doc)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Approve Access</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(doc)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : isApproved ? (
                              <button
                                type="button"
                                onClick={() => handleReject(doc)}
                                disabled={isProcessing}
                                className="text-neutral-500 hover:text-rose-600 text-xs font-semibold underline underline-offset-2"
                              >
                                Revoke Access
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApprove(doc)}
                                disabled={isProcessing}
                                className="text-neutral-500 hover:text-emerald-600 text-xs font-semibold underline underline-offset-2"
                              >
                                Re-approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
