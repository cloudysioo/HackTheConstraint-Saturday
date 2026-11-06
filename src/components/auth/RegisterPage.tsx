import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Stethoscope,
  UserCheck,
  Loader2,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  IdCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { registerPatient, registerPhysician } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Patient-specific
  const [dob, setDob] = useState('');
  const [mrn, setMrn] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [clinic, setClinic] = useState('');

  // Physician-specific
  const [npi, setNpi] = useState('');
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [physicianClinic, setPhysicianClinic] = useState('');

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
    setDob(''); setMrn(''); setPhone(''); setAssignedDoctor(''); setClinic('');
    setNpi(''); setTitle(''); setSpecialty(''); setLicenseNumber(''); setPhysicianClinic('');
    setError(null); setSuccess(null);
  };

  const handleTabSwitch = (role: UserRole) => {
    setActiveTab(role);
    resetForm();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    if (activeTab === 'patient') {
      if (!dob) {
        setError('Date of birth is required for patient registration.');
        setIsLoading(false);
        return;
      }
      const result = await registerPatient({
        name, email, password, dob,
        mrn: mrn || undefined,
        phone: phone || undefined,
        assignedDoctor: assignedDoctor || undefined,
        clinic: clinic || undefined,
      });
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.');
      } else {
        setSuccess(`Patient account created for ${result.user?.name}! Redirecting to your portal…`);
      }
    } else {
      if (!npi.trim()) {
        setError('National Provider Identifier (NPI) is required for physician registration.');
        setIsLoading(false);
        return;
      }
      const result = await registerPhysician({
        name, email, password, npi,
        title: title || undefined,
        specialty: specialty || undefined,
        clinic: physicianClinic || undefined,
        licenseNumber: licenseNumber || undefined,
      });
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.');
      } else {
        setSuccess(`Physician account created for ${result.user?.name}! Redirecting to Physician Portal…`);
      }
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors disabled:bg-neutral-50 disabled:text-neutral-400';
  const labelClass = 'block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex flex-col items-center justify-center p-4 py-10">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #2BC4C6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #2BC4C6 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-lg">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/medtrace-logo-cropped.png"
              alt="medTrace"
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </div>
          <p className="text-white/80 text-sm">Create your medTrace account</p>
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Login
        </button>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Portal Selector Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              type="button"
              onClick={() => handleTabSwitch('patient')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'patient'
                  ? 'border-secondary text-secondary bg-secondary/5'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Register as Patient
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('physician')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'physician'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Register as Physician
            </button>
          </div>

          <div className="p-7">
            {/* Role info banner */}
            <div className={`flex items-start gap-3 p-3 rounded-xl mb-5 ${
              activeTab === 'patient' ? 'bg-secondary/10' : 'bg-primary/5 border border-primary/10'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                activeTab === 'patient' ? 'bg-secondary/20 text-secondary' : 'bg-primary/15 text-primary'
              }`}>
                {activeTab === 'patient' ? <UserPlus className="h-4 w-4" /> : <IdCard className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  {activeTab === 'patient' ? 'Patient Account' : 'Physician Account'}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {activeTab === 'patient'
                    ? 'Register to view your prescriptions, track medications, and communicate with your care team.'
                    : 'Register to manage patient prescriptions, review flags, and maintain clinical audit trails.'}
                </p>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-warning/10 border border-warning/30 rounded-xl mb-5">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-sm text-warning font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 p-3.5 bg-success/10 border border-success/30 rounded-xl mb-5">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-success font-medium">{success}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* ===== SHARED FIELDS ===== */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeTab === 'patient' ? 'Jane Smith' : 'Rajesh Iyer (Dr. prefix added automatically)'}
                    className={inputClass}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'patient' ? 'jane.smith@email.com' : 'dr.iyer@clinic.com'}
                    className={inputClass}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className={`${inputClass} pr-10`}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={inputClass}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ===== PATIENT-SPECIFIC FIELDS ===== */}
              {activeTab === 'patient' && (
                <>
                  <div className="border-t border-neutral-100 pt-4">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Medical Details</p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Date of Birth *</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className={inputClass}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Phone Number</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(555) 000-0000"
                            className={inputClass}
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Medical Record # (MRN)</label>
                          <input
                            type="text"
                            value={mrn}
                            onChange={(e) => setMrn(e.target.value)}
                            placeholder="PT-XXXXX (auto-assigned)"
                            className={inputClass}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Assigned Doctor</label>
                        <input
                          type="text"
                          value={assignedDoctor}
                          onChange={(e) => setAssignedDoctor(e.target.value)}
                          placeholder="Dr. Rajesh Iyer, MD"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Clinic / Hospital</label>
                        <input
                          type="text"
                          value={clinic}
                          onChange={(e) => setClinic(e.target.value)}
                          placeholder="Metro Health Primary Care"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ===== PHYSICIAN-SPECIFIC FIELDS ===== */}
              {activeTab === 'physician' && (
                <>
                  <div className="border-t border-neutral-100 pt-4">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Clinical Credentials</p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>National Provider Identifier (NPI) *</label>
                        <input
                          type="text"
                          value={npi}
                          onChange={(e) => setNpi(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit NPI number"
                          className={inputClass}
                          disabled={isLoading}
                          required
                          maxLength={10}
                        />
                        <p className="text-xs text-neutral-400 mt-1">The NPI is a 10-digit unique identifier issued by CMS.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Title / Designation</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Attending Physician"
                            className={inputClass}
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Specialty</label>
                          <input
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="Internal Medicine"
                            className={inputClass}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>License Number</label>
                          <input
                            type="text"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            placeholder="MD-XXXXXXX"
                            className={inputClass}
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Clinic / Hospital</label>
                          <input
                            type="text"
                            value={physicianClinic}
                            onChange={(e) => setPhysicianClinic(e.target.value)}
                            placeholder="Metro Health Primary Care"
                            className={inputClass}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !!success}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all mt-2 ${
                  activeTab === 'patient'
                    ? 'bg-secondary hover:bg-secondary-hover'
                    : 'bg-primary hover:bg-primary-hover'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isLoading
                  ? 'Creating Account…'
                  : success
                  ? 'Account Created!'
                  : `Create ${activeTab === 'patient' ? 'Patient' : 'Physician'} Account`}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-5 text-center">
              <p className="text-xs text-neutral-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-semibold text-secondary hover:text-secondary-hover underline underline-offset-2"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>HIPAA-aware · End-to-end encrypted · Audit-logged</span>
        </div>
      </div>
    </div>
  );
};
