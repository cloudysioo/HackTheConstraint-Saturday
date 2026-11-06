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
  Building,
  Phone,
  Calendar,
  Lock,
  Mail,
  User,
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

  // ── Shared fields ────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Patient-specific ─────────────────────────────────────
  const [dob, setDob] = useState('');
  const [mrn, setMrn] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [clinic, setClinic] = useState('');

  // ── Physician-specific ───────────────────────────────────
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [physicianClinic, setPhysicianClinic] = useState('');

  // ── Password strength ────────────────────────────────────
  const getPasswordStrength = (pw: string): { label: string; color: string; pct: number } => {
    if (!pw) return { label: '', color: '', pct: 0 };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-warning', pct: 20 };
    if (score <= 2) return { label: 'Fair', color: 'bg-yellow-400', pct: 45 };
    if (score <= 3) return { label: 'Good', color: 'bg-secondary', pct: 70 };
    return { label: 'Strong', color: 'bg-success', pct: 100 };
  };
  const strength = getPasswordStrength(password);

  const handleTabSwitch = (role: UserRole) => {
    setActiveTab(role);
    setError(null);
    setSuccess(null);
  };

  // ── Form Submission ──────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (activeTab === 'patient') {
      if (!dob) {
        setError('Date of birth is required for patient registration.');
        return;
      }
    } else {
      if (!registrationNumber.trim()) {
        setError('Medical Registration Number is required for physician registration.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (activeTab === 'patient') {
        const result = await registerPatient({
          name: name.trim(),
          email: email.trim(),
          password,
          dob,
          mrn: mrn.trim() || undefined,
          phone: phone.trim() || undefined,
          assignedDoctor: assignedDoctor.trim() || undefined,
          clinic: clinic.trim() || undefined,
        });

        if (!result.success) {
          setError(result.error || 'Registration failed. Please try again.');
        } else {
          setSuccess(`Account created! Welcome, ${result.user?.name}. Redirecting to your medication chart…`);
        }
      } else {
        const result = await registerPhysician({
          name: name.trim(),
          email: email.trim(),
          password,
          registrationNumber: registrationNumber.trim(),
          title: title.trim() || undefined,
          specialty: specialty.trim() || undefined,
          clinic: physicianClinic.trim() || undefined,
          licenseNumber: licenseNumber.trim() || undefined,
        });

        if (!result.success) {
          setError(result.error || 'Registration failed. Please try again.');
        } else {
          setSuccess(
            `Registration submitted! Reg #${registrationNumber} has been submitted to the Admin Team for clinical verification.`
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-slate-900 flex items-center justify-center p-4 py-8 sm:py-12">
      <div className="w-full max-w-xl">
        {/* Header / Branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/medtrace-logo-cropped.png"
              alt="medTrace"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <span className="text-xs font-bold uppercase tracking-widest bg-secondary/20 text-secondary px-2.5 py-1 rounded-full border border-secondary/30">
              Continuity Engine
            </span>
          </div>
          <p className="text-white/80 text-sm">Create your medTrace account</p>
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200">
          {/* Role Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              type="button"
              onClick={() => handleTabSwitch('patient')}
              className={`flex-1 py-3.5 px-4 text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'patient'
                  ? 'border-b-2 border-secondary text-primary bg-secondary/5 font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <UserCheck className="h-4 w-4 text-secondary" />
              <span>Register as Patient</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('physician')}
              className={`flex-1 py-3.5 px-4 text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'physician'
                  ? 'border-b-2 border-secondary text-primary bg-secondary/5 font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Stethoscope className="h-4 w-4 text-secondary" />
              <span>Register as Physician</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Error banner */}
            {error && (
              <div className="mb-5 p-3.5 bg-critical/10 border border-critical/30 rounded-xl text-xs text-critical flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div className="mb-5 p-3.5 bg-success/10 border border-success/30 rounded-xl text-xs text-success flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{success}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder={activeTab === 'patient' ? 'e.g. Maya Lin' : 'e.g. Dr. Sunita Gupta'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder={activeTab === 'patient' ? 'patient@email.com' : 'physician@hospital.org'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} transition-all`} style={{ width: `${strength.pct}%` }} />
                      </div>
                      <span className="text-[10px] text-neutral-500 font-semibold">{strength.label}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                    />
                  </div>
                </div>
              </div>

              {/* ── Patient Specific Fields ── */}
              {activeTab === 'patient' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="tel"
                          placeholder="(555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Medical Record Number (MRN)
                      </label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Auto-generated if blank (e.g. PT-94021)"
                          value={mrn}
                          onChange={(e) => setMrn(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Primary Clinic / Hospital
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="e.g. Metro Health Primary Care"
                          value={clinic}
                          onChange={(e) => setClinic(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Primary Attending Doctor
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="e.g. Dr. Rajesh Iyer, MD"
                        value={assignedDoctor}
                        onChange={(e) => setAssignedDoctor(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* ── Physician Specific Fields ── */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Medical Registration Number (State/National Registry) *
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. MED-512891042 or REG-748291"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold border border-secondary/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary bg-secondary/5"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Used for clinical verification and closed-loop prescription adjudication.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Medical Specialty / Department *
                      </label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Cardiology, Neurology, Pulmonology"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Clinic / Hospital Affiliation
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="e.g. Metro Heart Institute"
                          value={physicianClinic}
                          onChange={(e) => setPhysicianClinic(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Consultant Cardiologist"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        State License / NPI (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NPI-1049281749"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                    <span>
                      Physician registrations are submitted to the Clinical Administrative Team for credential validation before chart write access is unlocked.
                    </span>
                  </div>
                </>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all mt-4 ${
                  activeTab === 'patient'
                    ? 'bg-secondary hover:bg-secondary-hover'
                    : 'bg-primary hover:bg-primary-hover'
                } disabled:opacity-60 disabled:cursor-not-allowed shadow-md`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>
                  {isLoading
                    ? 'Creating Account…'
                    : activeTab === 'patient'
                    ? 'Create Patient Account'
                    : 'Submit Physician Registration'}
                </span>
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center pt-3 border-t border-neutral-100">
              <p className="text-xs text-neutral-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-bold text-secondary hover:text-secondary-hover underline underline-offset-2"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
          <span>medTrace Continuity Engine · HIPAA Compliant · Closed-Loop Handover Safety</span>
        </div>
      </div>
    </div>
  );
};
