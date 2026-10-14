import { INITIAL_USERS } from '../../data/seedData';
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
  Building2,
  Scissors,
  Landmark,
  ChevronDown,
  Check,
  UserCheck,
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
  const { login, organizations, currentOrganization, switchOrganization, users } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  // Available staff/admin accounts for the selected organization
  const orgStaff = users.filter(
    (u) => u.organizationId === currentOrganization.id && u.role !== 'Vendor'
  );
  const orgAdmin =
    orgStaff.find((u) => u.role === 'Organization Admin') || orgStaff[0];

  // Lockout tracking for 5 failed attempts
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

  const fillAccount = (accEmail: string, accPass: string = 'Procura@2026') => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage('');
  };

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

  const OrgIcon =
    currentOrganization.type === 'sole_proprietorship'
      ? Scissors
      : currentOrganization.type === 'mega_corporation'
      ? Landmark
      : Building2;

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[#07130E] text-[#F2EFE6] min-h-[calc(100vh-2.5rem)] relative overflow-hidden font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1F6F4A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Clean, Focused Auth Card */}
      <div
        className={`relative z-10 w-full max-w-md p-6 md:p-8 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-2xl ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {onGoToWelcome && (
          <button
            type="button"
            onClick={onGoToWelcome}
            className="inline-flex items-center gap-1.5 text-xs text-[#A8B5AB] hover:text-[#D4AF37] mb-4 transition-colors font-medium"
          >
            <span>←</span> Back to Welcome Screen
          </button>
        )}

        {/* Header & Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/60 text-[#D4AF37] shadow-lg mb-2.5">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-serif-heading text-[#F2EFE6] tracking-wide">
            PROCURA
          </h1>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Smart Enterprise Procurement Platform
          </p>
        </div>

        {/* Active Organization Context Selector */}
        <div className="mb-5 relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[11px] font-medium text-[#A8B5AB]">Target Organization</span>
            <span className="text-[10px] text-[#D4AF37] font-mono">
              {currentOrganization.type === 'sole_proprietorship'
                ? 'Sole Proprietor'
                : currentOrganization.type === 'mega_corporation'
                ? 'Mega Corporation'
                : 'Enterprise'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#07130E] border border-[#1F3A2D] hover:border-[#D4AF37]/50 transition-all text-xs"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-6 h-6 rounded-lg bg-[#132A20] flex items-center justify-center shrink-0">
                <OrgIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <span className="font-semibold text-[#F2EFE6] truncate">
                {currentOrganization.name}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#A8B5AB] shrink-0 ml-2" />
          </button>

          {/* Org Dropdown */}
          {orgDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[#07130E] border border-[#1F3A2D] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in duration-150 max-h-56 overflow-y-auto">
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-[#A8B5AB] border-b border-[#1F3A2D] mb-1">
                Select Active Organization
              </div>
              <div className="space-y-1">
                {organizations.map((org) => {
                  const isSelected = org.id === currentOrganization.id;
                  const Icon =
                    org.type === 'sole_proprietorship'
                      ? Scissors
                      : org.type === 'mega_corporation'
                      ? Landmark
                      : Building2;

                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        switchOrganization(org.id);
                        setOrgDropdownOpen(false);
                        setEmail('');
                        setPassword('');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-[#132A20] text-[#D4AF37] font-semibold border border-[#D4AF37]/30'
                          : 'text-[#A8B5AB] hover:text-[#F2EFE6] hover:bg-[#132A20]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{org.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Lockout Warning */}
        {lockoutSeconds > 0 && (
          <div className="mb-5 p-3 rounded-xl bg-[#D9534F]/15 border border-[#D9534F]/40 flex items-center gap-2.5 text-xs text-[#D9534F]">
            <Clock className="w-4 h-4 shrink-0 animate-spin" />
            <span>
              Account locked. Please wait{' '}
              <strong>
                {Math.floor(lockoutSeconds / 60)}:{(lockoutSeconds % 60).toString().padStart(2, '0')}
              </strong>{' '}
              before retrying.
            </span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Email / Phone */}
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1.5">
              Email or Phone Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#07130E] border border-[#1F3A2D] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#F2EFE6] placeholder-[#A8B5AB]/40 outline-none transition-colors"
              />
              <Mail className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[#A8B5AB] font-medium">Password</label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-[11px] text-[#D4AF37] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#07130E] border border-[#1F3A2D] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#F2EFE6] placeholder-[#A8B5AB]/40 outline-none transition-colors font-mono"
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
            <div className="p-2.5 rounded-lg bg-[#D9534F]/15 border border-[#D9534F]/30 text-[#D9534F] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-[#D4AF37] bg-[#07130E] border-[#1F3A2D]"
            />
            <label htmlFor="rememberMe" className="text-xs text-[#A8B5AB] cursor-pointer">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to {currentOrganization.name}</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </>
            )}
          </button>
        </form>

        {/* Selected Organization Quick-Fill Account helper */}
        {orgAdmin && INITIAL_USERS.some((u) => u.id === orgAdmin.id) && (
          <div className="mt-4 p-2.5 rounded-xl bg-[#07130E]/70 border border-[#1F3A2D] flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-[10px] text-[#A8B5AB] block">
                {currentOrganization.name} Admin:
              </span>
              <span className="font-medium text-[#F2EFE6] text-[11px] truncate block">
                {orgAdmin.fullName} ({orgAdmin.email})
              </span>
            </div>
            <button
              type="button"
              onClick={() => fillAccount(orgAdmin.email)}
              className="px-2.5 py-1 rounded-lg bg-[#132A20] hover:bg-[#1F6F4A] text-[#D4AF37] hover:text-white border border-[#D4AF37]/30 text-[10px] font-semibold shrink-0 transition-colors"
            >
              Fill Account
            </button>
          </div>
        )}

        {/* Simple, Uncluttered Footer Links */}
        <div className="mt-6 pt-4 border-t border-[#1F3A2D] text-center text-xs text-[#A8B5AB] space-y-2">
          <div>
            <span>New to Procura? </span>
            <div className="inline-flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={onOpenOrgRegister}
                className="text-[#3FB67A] hover:underline font-semibold"
              >
                Register Organization / Business
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={onOpenVendorRegister}
                className="text-[#D4AF37] hover:underline font-semibold"
              >
                Register as Vendor
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#A8B5AB]/70 pt-0.5">
            Staff accounts are provisioned with temporary logins by their Organization Administrator.
          </p>
        </div>
      </div>
    </div>
  );
};
