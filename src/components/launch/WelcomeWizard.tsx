import React, { useState } from 'react';
import {
  Shield,
  FileCheck,
  Award,
  History,
  Building,
  Layers,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Department } from '../../types';

interface WelcomeWizardProps {
  onGoToSignIn: () => void;
  onGoToVendorRegister: () => void;
  onFinishSetup: () => void;
}

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({
  onGoToSignIn,
  onGoToVendorRegister,
  onFinishSetup,
}) => {
  const { loadDemoData, updateSettings } = useApp();
  const [step, setStep] = useState<'welcome' | 1 | 2 | 3 | 'done'>('welcome');

  // Step 1: Org details
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('company');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Departments
  const [departments, setDepartments] = useState<Array<{ name: string; budget: number }>>([
    { name: 'Operations & Facilities', budget: 50000000 },
    { name: 'Finance & Accounts', budget: 30000000 },
    { name: 'Procurement & Logistics', budget: 20000000 },
  ]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBudget, setNewDeptBudget] = useState<number>(10000000);

  // Step 3: Admin account
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('Procura@2026');
  const [confirmPassword, setConfirmPassword] = useState('Procura@2026');

  const addDepartment = () => {
    if (!newDeptName.trim()) return;
    setDepartments([...departments, { name: newDeptName.trim(), budget: newDeptBudget }]);
    setNewDeptName('');
    setNewDeptBudget(10000000);
  };

  const removeDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const handleCompleteWizard = () => {
    updateSettings({
      name: orgName,
      type: orgType,
      address,
      phone,
      email,
    });
    setStep('done');
    setTimeout(() => {
      onFinishSetup();
    }, 1800);
  };

  const handleLoadDemo = () => {
    loadDemoData();
    setStep('done');
    setTimeout(() => {
      onFinishSetup();
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#07130E] text-[#F2EFE6] overflow-hidden min-h-[calc(100vh-2.5rem)]">
      {/* Left 55%: Brand Panel */}
      <div className="w-full md:w-[55%] p-8 md:p-14 bg-gradient-to-br from-[#0F3D2A] via-[#07130E] to-[#07130E] border-r border-[#1F3A2D] flex flex-col justify-between relative overflow-hidden">
        {/* Subtle radial gold glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-lg">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.2 14.5l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-[#D4AF37] tracking-wider">PROCURA</h2>
            <p className="text-xs text-[#A8B5AB]">Smart procurement, from request to payment</p>
          </div>
        </div>

        {/* Main Pitch */}
        <div className="relative z-10 my-10 max-w-lg">
          <h1 className="text-3xl md:text-5xl font-black font-serif-heading text-[#F2EFE6] leading-tight mb-6">
            Procurement that <span className="text-[#D4AF37]">thinks ahead.</span>
          </h1>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0D1F17]/60 border border-[#1F3A2D]/80">
              <div className="w-8 h-8 rounded-lg bg-[#1F6F4A]/30 border border-[#3FB67A]/40 flex items-center justify-center text-[#3FB67A] shrink-0 mt-0.5">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#F2EFE6]">Transparent Bidding</h4>
                <p className="text-xs text-[#A8B5AB] mt-0.5">
                  Automated category matching, confidential tender evaluation, and live countdown closings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0D1F17]/60 border border-[#1F3A2D]/80">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#F2EFE6]">Smart Vendor Scoring</h4>
                <p className="text-xs text-[#A8B5AB] mt-0.5">
                  Algorithmically ranked bids weighing price, delivery speed, historical reliability, and technical merit.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0D1F17]/60 border border-[#1F3A2D]/80">
              <div className="w-8 h-8 rounded-lg bg-[#4F9DBF]/20 border border-[#4F9DBF]/40 flex items-center justify-center text-[#4F9DBF] shrink-0 mt-0.5">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#F2EFE6]">Full Audit Trail & Budget Guard</h4>
                <p className="text-xs text-[#A8B5AB] mt-0.5">
                  Immutable role logging, strict department budget limits, and high-threshold executive approvals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-[#A8B5AB]/70 flex items-center justify-between">
          <span>Procura Enterprise · Version 2026.1</span>
          <span>Currency: Nigerian Naira (₦)</span>
        </div>
      </div>

      {/* Right 45%: Surface Card / Setup Wizard */}
      <div className="w-full md:w-[45%] p-8 md:p-12 flex flex-col justify-center bg-[#07130E] relative overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          {/* Welcome mode: initial buttons */}
          {step === 'welcome' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-serif-heading text-[#F2EFE6] mb-2">Welcome to Procura</h2>
                <p className="text-xs text-[#A8B5AB] leading-relaxed">
                  Start fresh by configuring your organization and departments, or launch with full demonstration data ready out of the box.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Building className="w-4 h-4 text-[#D4AF37]" />
                  Set up my organization
                </button>

                <button
                  onClick={onGoToVendorRegister}
                  className="w-full py-3 px-4 rounded-[10px] bg-[#0D1F17] border border-[#D4AF37] text-[#D4AF37] font-semibold text-sm hover:bg-[#132A20] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  I am a vendor, register
                </button>

                <button
                  onClick={handleLoadDemo}
                  className="w-full py-3 px-4 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/60 text-[#E8CF7A] font-semibold text-xs transition-all flex items-center justify-center gap-2"
                  title="Loads enterprise sample data with pre-populated records across roles"
                >
                  <Database className="w-3.5 h-3.5 text-[#3FB67A]" />
                  Load Demo Data (Recommended for Testing)
                </button>
              </div>

              <div className="pt-4 border-t border-[#1F3A2D] text-center">
                <button
                  onClick={onGoToSignIn}
                  className="text-xs text-[#D4AF37] hover:underline font-medium"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              {/* Progress Dots */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                  <span className="w-3 h-3 rounded-full bg-[#1F3A2D]" />
                  <span className="w-3 h-3 rounded-full bg-[#1F3A2D]" />
                </div>
                <span className="text-xs text-[#A8B5AB]">Step 1 of 3: Organization</span>
              </div>

              <div>
                <h3 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Organization Details</h3>
                <p className="text-xs text-[#A8B5AB]">Enter the legal entity information for procurement operations.</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Organization Legal Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-[#F2EFE6] outline-none"
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
                    <option value="government agency">Government Agency / Parastatal</option>
                    <option value="institution">Academic or Healthcare Institution</option>
                    <option value="other">Other Corporation</option>
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
                    <label className="block text-[#A8B5AB] font-medium mb-1">Currency</label>
                    <input
                      type="text"
                      value="Nigerian Naira (₦)"
                      disabled
                      className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#D4AF37] font-semibold outline-none cursor-not-allowed"
                    />
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
                  onClick={() => setStep('welcome')}
                  className="px-4 py-2 text-xs font-semibold text-[#A8B5AB] hover:text-[#F2EFE6]"
                >
                  Back
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

          {/* Step 2: Departments */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3FB67A]" />
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                  <span className="w-3 h-3 rounded-full bg-[#1F3A2D]" />
                </div>
                <span className="text-xs text-[#A8B5AB]">Step 2 of 3: Departments & Budgets</span>
              </div>

              <div>
                <h3 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Department Setup</h3>
                <p className="text-xs text-[#A8B5AB]">Define departments and their initial annual spending budgets.</p>
              </div>

              {/* Existing Departments list */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {departments.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#0D1F17] border border-[#1F3A2D] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#F2EFE6]">{d.name}</div>
                      <div className="text-[11px] text-[#D4AF37]">Budget: ₦{d.budget.toLocaleString()}</div>
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

              {/* Add Department Form */}
              <div className="p-3 rounded-xl bg-[#132A20]/60 border border-[#1F3A2D] space-y-2.5 text-xs">
                <span className="font-semibold text-[#A8B5AB] block">Add Another Department</span>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Department Name (e.g. Security, Legal)"
                  className="w-full px-3 py-2 rounded-lg bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newDeptBudget}
                    onChange={(e) => setNewDeptBudget(Number(e.target.value))}
                    placeholder="Annual Budget (₦)"
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

          {/* Step 3: Administrator Account */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3FB67A]" />
                  <span className="w-3 h-3 rounded-full bg-[#3FB67A]" />
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                </div>
                <span className="text-xs text-[#A8B5AB]">Step 3 of 3: Organization Admin</span>
              </div>

              <div>
                <h3 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Create Administrator</h3>
                <p className="text-xs text-[#A8B5AB]">
                  This primary account has full authority to manage users, approvals, and procurement rules.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A8B5AB] font-medium mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A8B5AB] font-medium mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-[10px] bg-[#0D1F17] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                    />
                  </div>
                </div>

                {/* Password Strength Meter */}
                <div className="p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D]">
                  <div className="flex justify-between items-center text-[10px] text-[#A8B5AB] mb-1">
                    <span>Password Strength</span>
                    <span className="text-[#3FB67A] font-semibold">Strong (Salted Hash)</span>
                  </div>
                  <div className="w-full h-1 bg-[#07130E] rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-[#3FB67A]" />
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
                  onClick={handleCompleteWizard}
                  className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110 shadow-lg"
                >
                  Complete Setup <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                </button>
              </div>
            </div>
          )}

          {/* Done state with animated check */}
          {step === 'done' && (
            <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                <Check className="w-10 h-10 text-[#D4AF37] stroke-[3.5]" />
              </div>
              <h3 className="text-2xl font-bold font-serif-heading text-[#D4AF37]">Organization Ready!</h3>
              <p className="text-xs text-[#A8B5AB]">
                Database initialized and Administrator security credentials provisioned.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
