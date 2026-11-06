import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  AlertCircle,
  Search,
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

  // Unlinked directory doctors
  const unlinkedDoctors = availableDoctors.filter(
    (d) => !currentCareTeam.some((cd) => cd.name === d.name)
  );

  // Live filter by doctor name, specialty, clinic, or ID
  const filteredUnlinkedDoctors = unlinkedDoctors.filter((doc) => {
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
      onAddDoctor(doc);
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
    };

    onAddDoctor(newDoctor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
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

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs text-warning font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex border-b border-neutral-200 mb-5 text-xs font-bold">
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
            <div className="space-y-4">
              <p className="text-xs text-neutral-600">
                Link an accredited specialist from the Metro Health network to your chart to enable automated drug-drug interaction screening.
              </p>

              {/* Search Bar */}
              {unlinkedDoctors.length > 0 && (
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
              )}

              {unlinkedDoctors.length === 0 ? (
                <div className="p-4 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500">
                  All doctors in the local directory are already part of your care team.
                  You can add an external specialist using the tab above.
                </div>
              ) : filteredUnlinkedDoctors.length === 0 ? (
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
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pb-1">
                    <span>
                      Showing {filteredUnlinkedDoctors.length} specialist{filteredUnlinkedDoctors.length !== 1 ? 's' : ''}
                    </span>
                    {searchQuery && (
                      <span className="font-semibold text-primary">Filtered</span>
                    )}
                  </div>
                  {filteredUnlinkedDoctors.map((doc) => (
                    <label
                      key={doc.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedDirectoryDoctorId === doc.id
                          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/40'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="directoryDoctor"
                        value={doc.id}
                        checked={selectedDirectoryDoctorId === doc.id}
                        onChange={() => { setSelectedDirectoryDoctorId(doc.id); setError(null); }}
                        className="mt-1 text-secondary focus:ring-secondary"
                      />
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-neutral-900 flex items-center justify-between">
                          <span>{doc.name}</span>
                          {doc.isPrimary && (
                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-primary font-semibold text-[11px]">{doc.specialty}</div>
                        <div className="text-neutral-500 text-[10px] mt-0.5">{doc.clinic}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
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
                  disabled={unlinkedDoctors.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  Link to Care Team
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddCustomDoctor} className="space-y-3.5 text-xs">
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
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition-colors"
                >
                  Add Specialist
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
