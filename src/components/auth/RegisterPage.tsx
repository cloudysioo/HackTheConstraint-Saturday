import React, { useState, useEffect, useRef } from 'react';
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
  Mail,
  KeyRound,
  RefreshCw,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const {
    registerPatient,
    registerPhysician,
    sendRegistrationOtp,
    verifyRegistrationOtp,
  } = useAuth();

  // Multi-step flow: 'details' -> 'otp'
  const [step, setStep] = useState<'details' | 'otp'>('details');

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

  // ── OTP State ────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serviceUsed, setServiceUsed] = useState<string | null>(null);

  const handleAutoFillOtp = (code: string) => {
    const digits = code.trim().slice(0, 6).split('');
    while (digits.length < 6) digits.push('');
    setOtpDigits(digits);
    setError(null);
    otpInputRefs.current[5]?.focus();
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

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

  // ── Step 1: Validate details and send OTP ─────────────────
  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    if (activeTab === 'patient') {
      if (!dob) { setError('Date of birth is required for patient registration.'); return; }
    } else {
      if (!registrationNumber.trim()) {
        setError('Medical Registration Number is required for physician registration.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await sendRegistrationOtp(email, activeTab, name);
      if (!res.success) {
        setError(res.error || 'Failed to dispatch verification code to your email.');
        return;
      }

      if (res.previewOtp) setDispatchedOtp(res.previewOtp);
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
      if (res.serviceUsed) setServiceUsed(res.serviceUsed);

      setStep('otp');
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Resend OTP ────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await sendRegistrationOtp(email, activeTab, name);
      if (res.success) {
        if (res.previewOtp) setDispatchedOtp(res.previewOtp);
        if (res.previewUrl) setPreviewUrl(res.previewUrl);
        if (res.serviceUsed) setServiceUsed(res.serviceUsed);
        setResendCooldown(60);
      } else {
        setError(res.error || 'Failed to resend verification code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP Input Navigation ─────────────────────────────────
  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setError(null);

    // Auto-advance
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtpDigits(updated);
    setError(null);

    const nextEmpty = updated.findIndex((d) => !d);
    if (nextEmpty !== -1) {
      otpInputRefs.current[nextEmpty]?.focus();
    } else {
      otpInputRefs.current[5]?.focus();
    }
  };

  // ── Step 2: Verify OTP and Complete Registration ─────────
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the full 6-digit verification code received in your email.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Verify OTP
      const verifyRes = await verifyRegistrationOtp(email, fullOtp);
      if (!verifyRes.success) {
        setError(verifyRes.error || 'Invalid verification code. Please check your email.');
        return;
      }

      // 2. Complete Account Registration
      if (activeTab === 'patient') {
        const result = await registerPatient({
          name,
          email,
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
          setSuccess(`Email verified! Welcome, ${result.user?.name}. Redirecting to Patient Portal…`);
        }
      } else {
        const result = await registerPhysician({
          name,
          email,
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
            `Email verified! Your registration (Reg #${registrationNumber}) has been submitted to the Admin Team for verification. Your account is under review.`
          );
        }
      }
    } finally {
      setIsLoading(false);
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
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/medtrace-logo-cropped.png"
              alt="medTrace"
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </div>
          <p className="text-white/80 text-sm">Create your verified medTrace account</p>
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={step === 'otp' ? () => setStep('details') : onNavigateToLogin}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 'otp' ? 'Back to account details' : 'Back to Login'}
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Stepper Progress Header */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex items-center justify-between text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${step === 'details' ? 'text-primary' : 'text-success'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'details' ? 'bg-primary text-white' : 'bg-success text-white'
              }`}>
                {step === 'otp' ? '✓' : '1'}
              </span>
              <span>1. Account Information</span>
            </div>
            <ArrowRight className="h-3 w-3 text-neutral-300" />
            <div className={`flex items-center gap-1.5 font-semibold ${step === 'otp' ? 'text-secondary font-bold' : 'text-neutral-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'otp' ? 'bg-secondary text-white' : 'bg-neutral-200 text-neutral-600'
              }`}>
                2
              </span>
              <span>2. Email OTP Verification</span>
            </div>
          </div>

          {/* Role Tabs (Only on Details step) */}
          {step === 'details' && (
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
          )}

          <div className="p-7">
            {/* Error & Success Alerts */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-warning/10 border border-warning/30 rounded-xl mb-4">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-sm text-warning font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 p-3.5 bg-success/10 border border-success/30 rounded-xl mb-4">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-success font-medium">{success}</p>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                STEP 1: DETAILS FORM
            ───────────────────────────────────────────────────────────── */}
            {step === 'details' && (
              <form onSubmit={handleProceedToOtp} className="space-y-4" noValidate>
                {/* Role info banner */}
                <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 ${
                  activeTab === 'patient' ? 'bg-secondary/10' : 'bg-primary/5 border border-primary/10'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'patient' ? 'bg-secondary/20 text-secondary' : 'bg-primary/15 text-primary'
                  }`}>
                    {activeTab === 'patient' ? <UserPlus className="h-4 w-4" /> : <IdCard className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">
                      {activeTab === 'patient' ? 'Patient Registration' : 'Physician Registration'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {activeTab === 'patient'
                        ? 'Create your account to view prescriptions and track medications with handover safety.'
                        : 'Submit your credentials for clinical review. Your medical registration will be verified by the admin team.'}
                    </p>
                  </div>
                </div>

                {/* Shared Profile Fields */}
                <div>
                  <label htmlFor="reg-name" className={labelClass}>Full Name *</label>
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeTab === 'patient' ? 'Jane Smith' : 'Rajesh Iyer (Dr. added automatically)'}
                    className={inputClass}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className={labelClass}>Email Address (OTP will be sent here) *</label>
                  <div className="relative">
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={activeTab === 'patient' ? 'jane.smith@email.com' : 'dr.iyer@clinic.com'}
                      className={`${inputClass} pl-10`}
                      disabled={isLoading}
                      autoComplete="email"
                      spellCheck={false}
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    A real 6-digit verification code will be sent to your email inbox.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-password" className={labelClass}>Password *</label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className={`${inputClass} pr-10`}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {password && (
                      <div className="mt-1.5">
                        <div className="h-1 w-full bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${strength.color}`}
                            style={{ width: `${strength.pct}%` }}
                          />
                        </div>
                        <p className={`text-[10px] mt-0.5 font-semibold ${
                          strength.pct <= 20 ? 'text-warning' :
                          strength.pct <= 45 ? 'text-yellow-500' :
                          strength.pct <= 70 ? 'text-secondary' : 'text-success'
                        }`}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-confirm" className={labelClass}>Confirm Password *</label>
                    <input
                      id="reg-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`${inputClass} ${confirmPassword && confirmPassword !== password ? 'border-warning ring-1 ring-warning/40' : ''}`}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[10px] text-warning mt-0.5 font-semibold">Passwords do not match</p>
                    )}
                  </div>
                </div>

                {/* Patient-specific Details */}
                {activeTab === 'patient' && (
                  <div className="border-t border-neutral-100 pt-4 space-y-3">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Medical Details</p>
                    <div>
                      <label htmlFor="reg-dob" className={labelClass}>Date of Birth *</label>
                      <input
                        id="reg-dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={inputClass}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-phone" className={labelClass}>Phone Number</label>
                        <input
                          id="reg-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(555) 000-0000"
                          className={inputClass}
                          disabled={isLoading}
                          autoComplete="tel"
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-mrn" className={labelClass}>Medical Record # (MRN)</label>
                        <input
                          id="reg-mrn"
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
                      <label htmlFor="reg-doctor" className={labelClass}>Assigned Doctor</label>
                      <input
                        id="reg-doctor"
                        type="text"
                        value={assignedDoctor}
                        onChange={(e) => setAssignedDoctor(e.target.value)}
                        placeholder="Dr. Rajesh Iyer, MD"
                        className={inputClass}
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-clinic" className={labelClass}>Clinic / Hospital</label>
                      <input
                        id="reg-clinic"
                        type="text"
                        value={clinic}
                        onChange={(e) => setClinic(e.target.value)}
                        placeholder="Metro Health Primary Care"
                        className={inputClass}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Physician-specific Details */}
                {activeTab === 'physician' && (
                  <div className="border-t border-neutral-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Medical Registration & Credentials</p>
                      <span className="text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/20">
                        Admin Review Required
                      </span>
                    </div>

                    <div>
                      <label htmlFor="reg-num" className={labelClass}>Medical Registration Number *</label>
                      <input
                        id="reg-num"
                        type="text"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="e.g. MCI-84920, REG-104921, or State Council #"
                        className={`${inputClass} font-mono`}
                        disabled={isLoading}
                        required
                      />
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-secondary" />
                        This registration number will be reviewed and verified by our Admin Team before portal activation.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-title" className={labelClass}>Title / Designation</label>
                        <input
                          id="reg-title"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Attending Physician"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-specialty" className={labelClass}>Specialty / Department</label>
                        <input
                          id="reg-specialty"
                          type="text"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="Internal Medicine / Cardiology"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-license" className={labelClass}>State / Council License</label>
                        <input
                          id="reg-license"
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="MD-XXXXXXX (optional)"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-phy-clinic" className={labelClass}>Hospital / Practice Name</label>
                        <input
                          id="reg-phy-clinic"
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
                )}

                {/* Continue to OTP button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all mt-4 ${
                    activeTab === 'patient'
                      ? 'bg-secondary hover:bg-secondary-hover'
                      : 'bg-primary hover:bg-primary-hover'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isLoading ? 'Sending Verification Code…' : 'Continue to Email Verification ➔'}
                </button>
              </form>
            )}

            {/* ─────────────────────────────────────────────────────────────
                STEP 2: EMAIL OTP VERIFICATION
            ───────────────────────────────────────────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-800">Check Your Email</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    We've sent a 6-digit one-time security code to:
                  </p>
                  <p className="text-sm font-semibold text-primary mt-0.5">{email}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Please check your inbox (and spam folder) and enter the code below.
                  </p>
                </div>

                {/* Dispatched OTP & Live Preview Sandbox Banner */}
                {dispatchedOtp && (
                  <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Mail className="h-4 w-4 text-secondary" />
                        <span>Security Code Dispatched</span>
                      </div>
                      {serviceUsed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {serviceUsed}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-secondary/20 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 text-[11px]">Verification Code:</span>
                        <span className="font-mono text-base font-extrabold tracking-widest text-primary">
                          {dispatchedOtp}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoFillOtp(dispatchedOtp)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-secondary hover:bg-secondary-hover text-white rounded-md transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <span>Auto-fill Code</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    {previewUrl && (
                      <div className="pt-0.5 flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500">Live preview inbox active:</span>
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-secondary-dark hover:underline inline-flex items-center gap-1"
                        >
                          <span>Open Sent Email ↗</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 6-Digit PIN Boxes */}
                <div className="py-2">
                  <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide text-center">
                    Enter 6-Digit Security Code
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-lg border transition-all ${
                          digit
                            ? 'border-secondary bg-secondary/5 text-primary ring-2 ring-secondary/30'
                            : 'border-neutral-300 text-neutral-800 hover:border-neutral-400 focus:border-secondary focus:ring-2 focus:ring-secondary/40'
                        }`}
                        disabled={isLoading || !!success}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Notice for Physicians */}
                {activeTab === 'physician' && (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600 flex items-start gap-2">
                    <Clock className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <span>
                      After email verification, your application with registration number <strong>{registrationNumber}</strong> will be submitted to the Admin Team for clinical credential check.
                    </span>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || !!success || otpDigits.join('').length < 6}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all ${
                    activeTab === 'patient'
                      ? 'bg-secondary hover:bg-secondary-hover'
                      : 'bg-primary hover:bg-primary-hover'
                  } disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isLoading
                    ? 'Verifying & Submitting…'
                    : success
                    ? 'Verified!'
                    : `Verify & Complete ${activeTab === 'patient' ? 'Patient' : 'Physician'} Registration`}
                </button>

                {/* Resend & Back controls */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => { setStep('details'); setError(null); }}
                    className="text-neutral-500 hover:text-neutral-800 underline underline-offset-2"
                  >
                    ← Edit account details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className={`flex items-center gap-1 font-semibold ${
                      resendCooldown > 0
                        ? 'text-neutral-400 cursor-not-allowed'
                        : 'text-secondary hover:text-secondary-hover underline underline-offset-2'
                    }`}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : 'Didn’t get code? Resend OTP'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-5 text-center pt-2">
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
          <span>Email Verification · HIPAA Compliant · Clinical Credential Verification</span>
        </div>
      </div>
    </div>
  );
};
