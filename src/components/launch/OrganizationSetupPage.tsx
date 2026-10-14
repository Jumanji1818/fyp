import { validatePassword } from '../../utils/password';
import React, { useState } from 'react';
import {
  Building,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CURRENCIES = [
    { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (₦)' },
    { code: 'USD', symbol: '\( ', label: 'US Dollar ( \))' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi (GH₵)' },
    { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling (KSh)' },
    { code: 'ZAR', symbol: 'R', label: 'South African Rand (R)' },
    { code: 'CAD', symbol: 'C\( ', label: 'Canadian Dollar (C \))' },
  ];

interface OrganizationSetupPageProps {
  onBack: () => void;
  onComplete: () => void;
}

export const OrganizationSetupPage: React.FC<OrganizationSetupPageProps> = ({
  onBack,
  onComplete,
}) => {
  const { registerOrganization, updateSettings } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 'done'>(1);

  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('company');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('NGN');

  const [departments, setDepartments] = useState<Array<{ name: string; budget: number }>>([
    { name: 'Operations & Facilities', budget: 50000000 },
    { name: 'Finance & Accounts', budget: 30000000 },
    { name: 'Procurement & Logistics', budget: 20000000 },
  ]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBudget, setNewDeptBudget] = useState<number>(10000000);

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const addDepartment = () => {
    if (!newDeptName.trim()) return;
    setDepartments([...departments, { name: newDeptName.trim(), budget: newDeptBudget }]);
    setNewDeptName('');
    setNewDeptBudget(10000000);
  };

  const removeDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    setErrorMsg('');
    if (!adminName.trim() || !adminEmail.trim() || !password.trim()) {
      setErrorMsg('Please complete all administrator fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    const pwProblem = validatePassword(password);
    if (pwProblem) {
      setErrorMsg(pwProblem);
      return;
    }

    const threshold =
      orgType === 'sole_proprietorship' || orgType === 'company'
        ? 5000000
        : orgType === 'mega_corporation'
        ? 50000000
        : 5000000;

    const mappedType =
      orgType === 'government agency' || orgType === 'mega_corporation'
        ? 'mega_corporation'
        : orgType === 'company' || orgType === 'institution'
        ? 'enterprise'
        : 'sole_proprietorship';

    const result = registerOrganization(
      {
        name: orgName.trim() || 'My Organization',
        type: mappedType as 'sole_proprietorship' | 'enterprise' | 'mega_corporation',
        industry: 'General',
        address: address.trim() || 'Nigeria',
        phone: phone.trim() || '+234 800 000 0000',
        email: email.trim() || adminEmail.trim(),
        approvalThreshold: threshold,
        initialBudget: departments.reduce((s, d) => s + d.budget, 0),
        currency: selectedCurrency.symbol,
      },
      {
        fullName: adminName.trim(),
        email: adminEmail.trim(),
        phone: adminPhone.trim() || '+234 800 000 0000',
        password,
      }
    );

    if (result.success) {
      updateSettings({
        name: orgName.trim() || 'My Organization',
        type: orgType,
        address,
        phone,
        email: email.trim() || adminEmail.trim(),
        currency: selectedCurrency.symbol,
      });
      setStep('done');
      setTimeout(() => onComplete(), 1600);
    } else {
      setErrorMsg((result as { error?: string }).error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#07130E] text-[#F2EFE6] overflow-hidden min-h-[calc(100vh-2.5rem)]">
      <div className="hidden md:flex w-[40%] p-10 bg-gradient-to-br from-[#0F3D2A] via-[#07130E] to-[#07130E] border-r border-[#1F3A2D] flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-[#D4AF37] tracking-wider">PROCURA</h2>
            <p className="text-xs text-[#A8B5AB]">Organization setup</p>
          </div>
        </div>
        <div className="relative z-10 my-8">
          <h1 className="text-3xl font-black font-serif-heading text-[#F2EFE6] leading-tight mb-4">
            Configure your <span className="text-[#D4AF37]">procurement entity.</span>
          </h1>
          <p className="text-sm text-[#A8B5AB] leading-relaxed">
            Set legal details, currency, departments, budgets, and your administrator account on a dedicated setup flow.
          </p>
        </div>
        <div className="relative z-10 text-xs text-[#A8B5AB]/70">Procura Enterprise · Setup wizard</div>
      </div>

      <div className="flex-1 p-6 md:p-12 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-lg w-full mx-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#D9534F]/20 border border-[#D9534F]/40 text-[#D9534F] text-xs">
              {errorMsg}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#1F6F4A]/30 border border-[#3FB67A] flex items-center justify-center">
                <Check className="w-8 h-8 text-[#3FB67A]" />
              </div>
              <h2 className="text-2xl font-bold font-serif-heading text-[#F2EFE6]">Organization ready</h2>
              <p className="text-sm text-[#A8B5AB]">Redirecting you to sign in…</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Organization Details</h3>
                <p className="text-xs text-[#A8B5AB]">Legal entity information and operating currency.</p>
              </div>
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Organization Legal Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                    placeholder="e.g. Apex Global Industries"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Organization Type</label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                  >
                    <option value="company">Private Company / Corporation</option>
                    <option value="sole_proprietorship">Sole Proprietor / Small Business</option>
                    <option value="government agency">Government Agency / Parastatal</option>
                    <option value="mega_corporation">Mega Corporation</option>
                    <option value="institution">Academic or Healthcare Institution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Head Office Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A8B5AB] font-medium mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A8B5AB] font-medium mb-1">Currency *</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none font-semibold"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Official Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={onBack}
                  className="px-4 py-2 text-xs font-semibold text-[#A8B5AB] hover:text-[#F2EFE6] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110"
                >
                  Next: Departments <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Department Setup</h3>
                <p className="text-xs text-[#A8B5AB]">Budgets use {selectedCurrency.label}.</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {departments.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#0D1F17] border border-[#1F3A2D] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#F2EFE6]">{d.name}</div>
                      <div className="text-[11px] text-[#D4AF37]">
                        Budget: {selectedCurrency.symbol}
                        {d.budget.toLocaleString()}
                      </div>
                    </div>
                    {departments.length > 1 && (
                      <button
                        onClick={() => removeDepartment(idx)}
                        className="text-[#D9534F] hover:bg-[#132A20] p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-[#132A20]/60 border border-[#1F3A2D] space-y-2.5 text-xs">
                <span className="font-semibold text-[#A8B5AB] block">Add Another Department</span>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Department Name"
                  className="w-full px-3 py-2 rounded-lg bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newDeptBudget}
                    onChange={(e) => setNewDeptBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                  />
                  <button
                    onClick={addDepartment}
                    className="px-3 py-2 rounded-lg bg-[#1F6F4A] text-[#F2EFE6] font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-[#A8B5AB] hover:text-[#F2EFE6]"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={departments.length === 0}
                  className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110 disabled:opacity-40"
                >
                  Next: Admin Account <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Administrator Account</h3>
                <p className="text-xs text-[#A8B5AB]">Currency: {selectedCurrency.label}</p>
              </div>
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Sign-In Email *</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A8B5AB] font-medium mb-1">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A8B5AB] font-medium mb-1">Confirm *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-[#A8B5AB] hover:text-[#F2EFE6]"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110"
                >
                  <Building className="w-3.5 h-3.5 text-[#D4AF37]" /> Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
