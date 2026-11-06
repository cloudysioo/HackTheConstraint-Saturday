import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Stethoscope,
  UserCheck,
  Loader2,
  ChevronRight,
  AlertCircle,
  LogIn,
  Timer,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToAdmin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateToAdmin }) => {
  const { login, loginDemo } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleTabSwitch = (role: UserRole) => {
    setActiveTab(role);
    setError(null);
    setIsLocked(false);
    // Keep email/password — user may have typed on wrong tab
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setIsLoading(true);
    setError(null);

    const result = await login(email, password, activeTab);

    setIsLoading(false);
    if (!result.success) {
      const isRateError = result.error?.includes('Too many failed');
      setIsLocked(!!isRateError);
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #2BC4C6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #2BC4C6 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/medtrace-logo-cropped.png"
              alt="medTrace"
              className="h-14 w-auto object-contain brightness-0 invert"
            />
          </div>
          <p className="text-white/80 text-sm">Continuity Engine · Closed-Loop Handover Safety</p>
        </div>

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
              Patient Login
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
              Physician Login
            </button>
          </div>

          <div className="p-7">
            {/* Role Intro Banner */}
            <div className={`flex items-start gap-3 p-3.5 rounded-xl mb-5 ${
              activeTab === 'patient' ? 'bg-secondary/10' : 'bg-primary/5 border border-primary/10'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                activeTab === 'patient' ? 'bg-secondary/20 text-secondary' : 'bg-primary/15 text-primary'
              }`}>
                {activeTab === 'patient' ? <UserCheck className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  {activeTab === 'patient' ? 'Patient Portal' : 'Physician Portal'}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {activeTab === 'patient'
                    ? 'View your prescriptions, track medications, and flag discrepancies with your care team.'
                    : 'Review patient prescriptions, resolve flagged items, and manage clinical audit logs.'}
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className={`flex items-start gap-2.5 p-3.5 rounded-xl mb-5 border ${
                isLocked
                  ? 'bg-critical/10 border-critical/30'
                  : 'bg-warning/10 border-warning/30'
              }`}>
                {isLocked
                  ? <Timer className="h-4 w-4 text-critical mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                }
                <p className={`text-sm font-medium ${isLocked ? 'text-critical' : 'text-warning'}`}>
                  {error}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder={activeTab === 'patient' ? 'patient@clinic.com' : 'doctor@clinic.com'}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors disabled:bg-neutral-50"
                  autoComplete="email"
                  disabled={isLoading || isLocked}
                  spellCheck={false}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors disabled:bg-neutral-50"
                    autoComplete="current-password"
                    disabled={isLoading || isLocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isLocked}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all ${
                  activeTab === 'patient'
                    ? 'bg-secondary hover:bg-secondary-hover'
                    : 'bg-primary hover:bg-primary-hover'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : isLocked
                  ? <Timer className="h-4 w-4" />
                  : <LogIn className="h-4 w-4" />
                }
                {isLoading
                  ? 'Signing in…'
                  : isLocked
                  ? 'Account Temporarily Locked'
                  : `Sign in as ${activeTab === 'patient' ? 'Patient' : 'Physician'}`
                }
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs text-neutral-400 uppercase tracking-widest">
                <span className="bg-white px-3">or demo access</span>
              </div>
            </div>

            {/* Quick Demo Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => loginDemo('patient')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-secondary/40 text-secondary text-xs font-semibold rounded-lg hover:bg-secondary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Patient Demo
              </button>
              <button
                type="button"
                onClick={() => loginDemo('physician')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-primary/30 text-primary text-xs font-semibold rounded-lg hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Physician Demo
              </button>
            </div>

            {/* Demo Credentials Hint */}
            <p className="text-center text-[11px] text-neutral-400 mt-2">
              Demo logins bypass credential requirements — for testing only
            </p>

            {/* Register Link */}
            <div className="mt-4 text-center">
              <p className="text-xs text-neutral-500">
                New to medTrace?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-semibold text-secondary hover:text-secondary-hover underline underline-offset-2"
                >
                  Create an account <ChevronRight className="inline h-3 w-3" />
                </button>
              </p>
            </div>

            {/* Admin Portal Link */}
            {onNavigateToAdmin && (
              <div className="mt-4 pt-3 border-t border-neutral-150 text-center">
                <button
                  type="button"
                  onClick={onNavigateToAdmin}
                  className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Lock className="h-3 w-3 text-neutral-400" />
                  <span>Clinical Administration Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>HIPAA-aware · SHA-256 hashed credentials · Audit-logged</span>
        </div>
      </div>
    </div>
  );
};
