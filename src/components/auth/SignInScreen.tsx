import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileCheck2,
  Scale,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SignInScreenProps {
  onSuccess: () => void;
  onOpenOrgRegister: () => void;
  onOpenVendorRegister: () => void;
  onOpenForgotPassword: () => void;
  onGoToWelcome?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSuccess,
  onOpenOrgRegister,
  onOpenVendorRegister,
  onOpenForgotPassword,
  onGoToWelcome,
}) => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lockout tracking for failed attempts
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const result = login(email.trim(), password);
      if (result.success) {
        setLoading(false);
        onSuccess();
      } else {
        setLoading(false);
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLockoutSeconds(300); // 5 minutes lockout
          setErrorMessage('Account temporarily locked due to multiple failed attempts. Please wait 5 minutes.');
        } else {
          setErrorMessage(result.error || 'Invalid email or password.');
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-5 lg:p-6 xl:p-8 bg-[#07130E] text-[#F2EFE6] min-h-[calc(100vh-1.5rem)] relative overflow-hidden font-sans">
      {/* Background ambient lighting (hidden on small screens) */}
      <div className="hidden md:absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#1F6F4A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden md:absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container - responsive: single column on mobile, split on md+ */}
      <div className="relative z-10 w-full max-w-3xl md:max-w-6xl bg-[#0D1F17] border border-[#1F3A2D] rounded-[18px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* LEFT COLUMN: Enterprise System Hero & Credentials (Visible on md+) */}
        <div className="hidden md:flex flex-col justify-between p-6 md:p-8 lg:p-10 bg-gradient-to-br from-[#0F3D2A] via-[#0D1F17] to-[#132A20] border-r border-[#1F3A2D]">
          <div className="relative w-full">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Logo & Platform Name */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/70 flex items-center justify-center text-[#D4AF37] shadow-lg shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-serif-heading text-[#F2EFE6] tracking-wider leading-none">PROCURA</h1>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mt-1">Enterprise Platform</p>
                </div>
              </div>

              <p className="text-xs text-[#A8B5AB] leading-relaxed mb-6">
                National & Corporate Public Procurement System providing statutory transparency, role-governed award authority, and automated financial settlement.
              </p>

              {/* Core Governance Pillars */}
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#07130E]/60 border border-[#1F3A2D]/80">
                  <Award className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#F2EFE6] block text-xs">Sole Approving Authority</strong>
                    <p className="text-[11px] text-[#A8B5AB] mt-0.5">Strict separation of duties. Contract awards are reserved exclusively for authorized executive review.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#07130E]/60 border border-[#1F3A2D]/80">
                  <FileCheck2 className="w-5 h-5 text-[#3FB67A] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#F2EFE6] block text-xs">Automated 3-Way Reconciliation</strong>
                    <p className="text-[11px] text-[#A8B5AB] mt-0.5">Seamless cross-matching of Requisitions, Purchase Orders, and Electronic Goods Receipt Notes (GRN).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#07130E]/60 border border-[#1F3A2D]/80">
                  <Scale className="w-5 h-5 text-[#4F9DBF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#F2EFE6] block text-xs">Immutable Audit Integrity</strong>
                    <p className="text-[11px] text-[#A8B5AB] mt-0.5">Complete cryptographic trace on all threshold approvals, budget virements, and dispatches.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#1F3A2D]/60 flex items-center justify-between text-[11px] text-[#A8B5AB]">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#3FB67A]" /> Federal Republic of Nigeria</span>
              <span className="font-mono text-[10px] text-[#D4AF37]">v2.6 Enterprise</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Form & Quick-Fill Demo Bar (full width on mobile) */}
        <div className="col-span-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
          <div>
            {onGoToWelcome && (
              <button
                type="button"
                onClick={onGoToWelcome}
                className="inline-flex items-center gap-1.5 text-xs text-[#A8B5AB] hover:text-[#D4AF37] mb-5 transition-colors font-medium"
              >
                <span>←</span> Back to Welcome Screen
              </button>
            )}

            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-serif-heading text-[#F2EFE6]">Sign In to Your Workspace</h2>
              <p className="text-xs text-[#A8B5AB] mt-1">Enter your registered corporate email and password to access your procurement dashboard.</p>
            </div>

            {/* Lockout Notification */}
            {lockoutSeconds > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-[#D9534F]/15 border border-[#D9534F]/40 flex items-center gap-2.5 text-xs text-[#D9534F]">
                <Clock className="w-4 h-4 shrink-0 animate-spin" />
                <span>
                  Account locked. Please wait <strong>{Math.floor(lockoutSeconds / 60)}:{(lockoutSeconds % 60).toString().padStart(2, '0')}</strong> before retrying.
                </span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className={`space-y-4 text-sm ${shake ? 'animate-shake' : ''}`}>
              {/* Email / Username */}
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1.5">Corporate Email or Authorized ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-[#07130E] border border-[#1F3A2D] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#F2EFE6] placeholder-[#A8B5AB]"
                  />
                  <Mail className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-3" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[#A8B5AB] font-medium">Password</label>
                  <button type="button" onClick={onOpenForgotPassword} className="text-[11px] text-[#D4AF37] hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-3 rounded-xl bg-[#07130E] border border-[#1F3A2D] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#F2EFE6] placeholder-[#A8B5AB]"
                  />
                  <Lock className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#A8B5AB] hover:text-[#F2EFE6] transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#D9534F]/15 border border-[#D9534F]/30 text-[#D9534F] text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-[#D4AF37] bg-[#07130E] border-[#1F3A2D]"
                />
                <label htmlFor="rememberMe" className="text-sm text-[#A8B5AB] cursor-pointer">Keep me authenticated on this device</label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || lockoutSeconds > 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/60 text-[#F2EFE6] font-semibold hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span>Verifying Credentials & Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Procura</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Registration Links Footer */}
          <div className="mt-6 pt-4 border-t border-[#1F3A2D] text-center text-sm text-[#A8B5AB]">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span>Need a workspace?</span>
              <button type="button" onClick={onOpenOrgRegister} className="text-[#3FB67A] hover:underline font-semibold">Register Organization</button>
              <span className="hidden sm:inline">·</span>
              <button type="button" onClick={onOpenVendorRegister} className="text-[#D4AF37] hover:underline font-semibold">Register as Vendor</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
