import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  ChevronLeft,
  AlertCircle,
  LogIn,
  KeyRound,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onBackToUserLogin: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBackToUserLogin }) => {
  const { login, loginDemo } = useAuth();

  const [email, setEmail] = useState('admin@medtrace.health');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter admin email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = await login(email, password, 'admin');
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Admin authentication failed.');
    }
  };

  const handleQuickAdminDemo = () => {
    loginDemo('admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 30%, #f43f5e 0%, transparent 50%), radial-gradient(circle at 70% 70%, #1F4E5B 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <img
            src="/medtrace-logo-cropped.png"
            alt="medTrace"
            className="h-12 w-auto mx-auto object-contain brightness-0 invert"
          />
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3 w-3" />
            <span>Administrative Console</span>
          </div>
        </div>

        {/* Back Link */}
        <button
          type="button"
          onClick={onBackToUserLogin}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Patient & Physician Portal
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200">
          <div className="bg-neutral-900 px-6 py-4 text-white border-b border-neutral-800">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-rose-400" />
              <span>Admin Authentication</span>
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              Restricted to authorized credentialing officers and platform administrators.
            </p>
          </div>

          <div className="p-7">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-critical/10 border border-critical/30 rounded-xl mb-5">
                <AlertCircle className="h-4 w-4 text-critical mt-0.5 flex-shrink-0" />
                <p className="text-sm text-critical font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@medtrace.health"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-colors"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-colors"
                    disabled={isLoading}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4 text-rose-400" />
                )}
                {isLoading ? 'Authenticating Admin…' : 'Sign in as Administrator'}
              </button>
            </form>

            {/* Quick Demo Access */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs text-neutral-400 uppercase tracking-widest">
                <span className="bg-white px-3">or instant access</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickAdminDemo}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-rose-400/40 text-rose-700 bg-rose-50/50 hover:bg-rose-100/60 rounded-xl text-xs font-bold transition-all"
            >
              <KeyRound className="h-4 w-4 text-rose-600" />
              <span>⚡ Quick Admin Access (1-Click)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-white/50 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
          <span>Credential Review & System Administration · Audit Logged</span>
        </div>
      </div>
    </div>
  );
};
