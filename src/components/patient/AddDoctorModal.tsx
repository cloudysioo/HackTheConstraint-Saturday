import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  AlertCircle,
  Search,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { ConsultingDoctor } from '../../types/medication';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDoctor: (doctor: ConsultingDoctor) => void;
  availableDoctors: ConsultingDoctor[];
  currentCareTeam: ConsultingDoctor[];
}

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({
  isOpen,
  onClose,
  onAddDoctor,
  availableDoctors,
  currentCareTeam,
}) => {
  const [selectedDirectoryDoctorId, setSelectedDirectoryDoctorId] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Custom doctor fields
  const [customName, setCustomName] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [customClinic, setCustomClinic] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Pending vs approved doctors in care team
  const pendingDoctors = currentCareTeam.filter((d) => d.approvalStatus === 'PENDING_APPROVAL');
  const approvedDoctors = currentCareTeam.filter((d) => d.approvalStatus !== 'PENDING_APPROVAL');

  // Live filter all available directory doctors by name, specialty, clinic, or ID
  const filteredDoctors = availableDoctors.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.clinic.toLowerCase().includes(q) ||
      (doc.doctorId && doc.doctorId.toLowerCase().includes(q))
    );
  });

  const handleLinkDirectoryDoctor = () => {
    if (!selectedDirectoryDoctorId) {
      setError('Please select a physician from the directory.');
      return;
    }
    const doc = availableDoctors.find((d) => d.id === selectedDirectoryDoctorId);
    if (doc) {
      onAddDoctor({
        ...doc,
        approvalStatus: 'PENDING_APPROVAL',
        requestedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
      setSelectedDirectoryDoctorId('');
      onClose();
    }
  };

  const handleAddCustomDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setError('Doctor name is required.');
      return;
    }
    if (!customSpecialty.trim()) {
      setError('Medical specialty is required (e.g. Cardiology, Neurology, Dermatology).');
      return;
    }

    const formattedName = customName.trim().startsWith('Dr.')
      ? customName.trim()
      : `Dr. ${customName.trim()}`;

    const newDoctor: ConsultingDoctor = {
      id: `doc-${Date.now()}`,
      name: formattedName.includes(', MD') ? formattedName : `${formattedName}, MD`,
      specialty: customSpecialty.trim(),
      clinic: customClinic.trim() || 'Consultant Specialist Clinic',
      phone: customPhone.trim() || '(555) 019-0000',
      email: customEmail.trim() || '',
      registrationNumber: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
      approvalStatus: 'PENDING_APPROVAL',
      requestedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };

    onAddDoctor(newDoctor);
    setCustomName('');
    setCustomSpecialty('');
    setCustomClinic('');
    setCustomPhone('');
    setCustomEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Stethoscope className="h-4.5 w-4.5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold">Add Consulting Doctor to Care Team</h3>
              <p className="text-xs text-white/70">Enable cross-specialist prescription handover</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs text-warning font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pending Approval Section */}
          {pendingDoctors.length > 0 && (
            <div className="p-3.5 bg-warning-light/35 border border-warning-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  <span>Waiting for Doctor's Approval ({pendingDoctors.length})</span>
                </span>
                <span className="text-[10px] font-bold text-warning uppercase tracking-wider">
                  Pending Request
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                The doctor has been notified and must accept the request before full medication cross-checking is unlocked.
              </p>
              <div className="space-y-1.5 pt-1">
                {pendingDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-warning-border/70 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-neutral-900">{doc.name}</div>
                      <div className="text-[11px] text-primary font-medium">
                        {doc.specialty} • {doc.clinic}
                      </div>
                      {doc.requestedAt && (
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Requested {doc.requestedAt}
                        </div>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning shrink-0 border border-warning/30">
                      <Clock className="h-3 w-3" />
                      Waiting for Approval
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex border-b border-neutral-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsCustomMode(false); setError(null); }}
              className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                !isCustomMode
                  ? 'border-secondary text-primary font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Select from Health Network
            </button>
            <button
              type="button"
              onClick={() => { setIsCustomMode(true); setError(null); }}
              className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                isCustomMode
                  ? 'border-secondary text-primary font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Add External Specialist
            </button>
          </div>

          {!isCustomMode ? (
            <div className="space-y-3.5">
              <p className="text-xs text-neutral-600">
                Search and request an accredited physician to join your care team. The doctor will receive a request to review and accept your profile.
              </p>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search doctor by name, specialty, or clinic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary bg-neutral-50/70"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 rounded-full"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="p-6 bg-neutral-50 rounded-xl text-center space-y-2">
                  <p className="text-xs font-bold text-neutral-800">
                    No directory doctors found matching "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Not in the Metro Health directory? You can add them as an external specialist.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName(searchQuery);
                      setIsCustomMode(true);
                    }}
                    className="mt-1 text-xs font-bold text-secondary-dark hover:underline inline-flex items-center gap-1"
                  >
                    <span>Add "{searchQuery}" as External Specialist ➔</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pb-1">
                    <span>
                      Showing {filteredDoctors.length} specialist{filteredDoctors.length !== 1 ? 's' : ''}
                    </span>
                    {searchQuery && (
                      <span className="font-semibold text-primary">Filtered</span>
                    )}
                  </div>
                  {filteredDoctors.map((doc) => {
                    const isPending = pendingDoctors.some(
                      (d) => d.id === doc.id || d.name.toLowerCase() === doc.name.toLowerCase()
                    );
                    const isApproved = approvedDoctors.some(
                      (d) => d.id === doc.id || d.name.toLowerCase() === doc.name.toLowerCase()
                    );
                    const isDisabled = isPending || isApproved;

                    return (
                      <label
                        key={doc.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          isDisabled
                            ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed opacity-90'
                            : selectedDirectoryDoctorId === doc.id
                            ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/40 cursor-pointer'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white cursor-pointer'
                        }`}
                      >
                        <input
                          type="radio"
                          name="directoryDoctor"
                          value={doc.id}
                          disabled={isDisabled}
                          checked={selectedDirectoryDoctorId === doc.id}
                          onChange={() => {
                            if (!isDisabled) {
                              setSelectedDirectoryDoctorId(doc.id);
                              setError(null);
                            }
                          }}
                          className="mt-1 text-secondary focus:ring-secondary disabled:opacity-30"
                        />
                        <div className="flex-1 text-xs">
                          <div className="font-bold text-neutral-900 flex items-center justify-between gap-2">
                            <span>{doc.name}</span>
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-secondary/15 text-primary font-bold px-2 py-0.5 rounded-full shrink-0 border border-secondary/30">
                                <CheckCircle2 className="h-3 w-3 text-secondary" />
                                Active in Care Team
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-warning/15 text-warning font-bold px-2 py-0.5 rounded-full shrink-0 border border-warning/30">
                                <Clock className="h-3 w-3" />
                                Waiting for Approval
                              </span>
                            ) : doc.isPrimary ? (
                              <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded">
                                Primary
                              </span>
                            ) : null}
                          </div>
                          <div className="text-primary font-semibold text-[11px]">{doc.specialty}</div>
                          <div className="text-neutral-500 text-[10px] mt-0.5">{doc.clinic}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLinkDirectoryDoctor}
                  disabled={!selectedDirectoryDoctorId}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-secondary" />
                  <span>Send Request to Doctor</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddCustomDoctor} className="space-y-3.5 text-xs">
              <p className="text-xs text-neutral-600">
                Add a doctor from outside our directory. A care team request will be initiated with status <strong>Waiting for Approval</strong> until confirmed.
              </p>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Doctor's Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Priya Sharma, MD"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Specialty / Department *</label>
                <input
                  type="text"
                  placeholder="e.g. Pulmonology, Orthopedics, Cardiology"
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Clinic / Hospital Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Respiratory Care"
                  value={customClinic}
                  onChange={(e) => setCustomClinic(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="doctor@hospital.org"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-secondary" />
                  <span>Send Request to Specialist</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
