import React, { useState } from 'react';
import {
  Building2,
  Scissors,
  Landmark,
  ArrowRight,
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { OrganizationType } from '../../types';

interface OrganizationRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OrganizationRegisterModal: React.FC<OrganizationRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerOrganization } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [orgType, setOrgType] = useState<OrganizationType>('sole_proprietorship');
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState<number>(15000000);

  // Admin account details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !industry.trim() || !email.trim()) {
      setErrorMsg('Please complete all organization details.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setErrorMsg('Please complete all administrator fields.');
      return;
    }

    if (adminPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (adminPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    const threshold =
      orgType === 'sole_proprietorship'
        ? 500000
        : orgType === 'mega_corporation'
        ? 50000000
        : 5000000;

    const result = registerOrganization(
      {
        name: orgName.trim(),
        type: orgType,
        industry: industry.trim(),
        address: address.trim() || 'Nigeria',
        phone: phone.trim() || '+234 800 000 0000',
        email: email.trim(),
        approvalThreshold: threshold,
        initialBudget: budgetEstimate,
      },
      {
        fullName: adminName.trim(),
        email: adminEmail.trim(),
        phone: adminPhone.trim() || '+234 800 000 0000',
        password: adminPassword,
      }
    );

    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Organization or Business"
      subtitle="Onboard your entity on Procura to manage purchasing, tenders, and vendor contracts."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs text-[#F2EFE6]">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1F3A2D]">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1 ? 'bg-[#D4AF37] text-[#07130E]' : 'bg-[#1F6F4A] text-white'
              }`}
            >
              1
            </span>
            <span className="font-semibold text-[#F2EFE6]">Organization Profile & Scale</span>
          </div>
          <div className="h-px w-12 bg-[#1F3A2D]" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2 ? 'bg-[#D4AF37] text-[#07130E]' : 'bg-[#132A20] text-[#A8B5AB]'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'font-semibold text-[#F2EFE6]' : 'text-[#A8B5AB]'}>
              Executive Admin Account
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#D9534F]/20 border border-[#D9534F]/40 text-[#D9534F] text-xs">
            {errorMsg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            {/* Entity Type Selector */}
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-2">
                Select Entity Operating Scale & Architecture *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Sole Proprietorship / Small Business */}
                <button
                  type="button"
                  onClick={() => {
                    setOrgType('sole_proprietorship');
                    if (!industry) setIndustry('Fashion, Tailoring & Textiles');
                    setBudgetEstimate(15000000);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    orgType === 'sole_proprietorship'
                      ? 'bg-[#132A20] border-[#D4AF37] text-[#F2EFE6] ring-1 ring-[#D4AF37]'
                      : 'bg-[#07130E] border-[#1F3A2D] text-[#A8B5AB] hover:border-[#1F3A2D]/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Scissors className="w-5 h-5 text-[#D4AF37]" />
                    {orgType === 'sole_proprietorship' && <CheckCircle className="w-4 h-4 text-[#D4AF37]" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#F2EFE6] mb-1">Sole Proprietor / Small Business</h4>
                    <p className="text-[11px] leading-relaxed text-[#A8B5AB]">
                      E.g. Husab Design (Tailor), studio, workshop. Streamlined single-operator direct sourcing.
                    </p>
                  </div>
                </button>

                {/* Medium / Enterprise */}
                <button
                  type="button"
                  onClick={() => {
                    setOrgType('enterprise');
                    if (!industry) setIndustry('Real Estate & Infrastructure');
                    setBudgetEstimate(80000000);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    orgType === 'enterprise'
                      ? 'bg-[#132A20] border-[#D4AF37] text-[#F2EFE6] ring-1 ring-[#D4AF37]'
                      : 'bg-[#07130E] border-[#1F3A2D] text-[#A8B5AB] hover:border-[#1F3A2D]/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="w-5 h-5 text-[#3FB67A]" />
                    {orgType === 'enterprise' && <CheckCircle className="w-4 h-4 text-[#3FB67A]" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#F2EFE6] mb-1">Corporate / Enterprise</h4>
                    <p className="text-[11px] leading-relaxed text-[#A8B5AB]">
                      E.g. Apex Global Industries, mid-sized company. Departments, heads & procurement queues.
                    </p>
                  </div>
                </button>

                {/* Mega Corporation / Parastatal */}
                <button
                  type="button"
                  onClick={() => {
                    setOrgType('mega_corporation');
                    if (!industry) setIndustry('Energy, Oil & Gas Infrastructure');
                    setBudgetEstimate(500000000);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    orgType === 'mega_corporation'
                      ? 'bg-[#132A20] border-[#D4AF37] text-[#F2EFE6] ring-1 ring-[#D4AF37]'
                      : 'bg-[#07130E] border-[#1F3A2D] text-[#A8B5AB] hover:border-[#1F3A2D]/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="w-5 h-5 text-[#4F9DBF]" />
                    {orgType === 'mega_corporation' && <CheckCircle className="w-4 h-4 text-[#4F9DBF]" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#F2EFE6] mb-1">Mega Corporation / Parastatal</h4>
                    <p className="text-[11px] leading-relaxed text-[#A8B5AB]">
                      E.g. NNPC, conglomerates, ministries. High-value statutory caps & multi-tier governance.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">
                  Entity / Business Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={
                      orgType === 'sole_proprietorship'
                        ? 'e.g. Husab Design'
                        : orgType === 'mega_corporation'
                        ? 'e.g. NNPC Limited'
                        : 'e.g. Apex Global Industries'
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                  />
                  <Briefcase className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">
                  Industry / Trade Sector *
                </label>
                <input
                  type="text"
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Bespoke Tailoring & Garments, Oil & Gas, Construction..."
                  className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Official Email *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="procurement@yourbusiness.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                  />
                  <Mail className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                  />
                  <Phone className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#A8B5AB] font-medium mb-1">Operating Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Studio / Head Office Address, City, State"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                  />
                  <MapPin className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#A8B5AB] font-medium mb-1">
                  Estimated Initial Annual Purchasing Budget (₦)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={100000}
                    value={budgetEstimate}
                    onChange={(e) => setBudgetEstimate(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none font-mono"
                  />
                  <DollarSign className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
                <span className="text-[11px] text-[#D4AF37] mt-1 block">
                  Formatted Cap: ₦{budgetEstimate.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[#A8B5AB] hover:text-[#F2EFE6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold flex items-center gap-1.5 shadow"
              >
                Continue to Admin Setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#A8B5AB] block">Registering Entity:</span>
                <span className="font-bold text-sm text-[#F2EFE6]">{orgName}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#1F6F4A]/30 text-[#3FB67A] text-[11px] font-semibold border border-[#3FB67A]/40">
                {orgType === 'sole_proprietorship'
                  ? 'Sole Proprietor'
                  : orgType === 'mega_corporation'
                  ? 'Mega Corporation'
                  : 'Enterprise'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">
                  Organization Administrator Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Hussain Abdullahi"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                  />
                  <User className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">
                  Admin Sign-In Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="hussain@husabdesign.ng"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                  />
                  <Mail className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Admin Phone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+234 802 000 0000"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
                  />
                  <Phone className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div />

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Master Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none font-mono"
                  />
                  <Lock className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none font-mono"
                  />
                  <Lock className="w-4 h-4 text-[#A8B5AB] absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[11px] text-[#A8B5AB] space-y-1">
              <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold">
                <Shield className="w-3.5 h-3.5" /> Security & Role Governance Policy
              </div>
              <p>
                As the Organization Admin, you hold executive ownership. You will be able to provision staff accounts with temporary credentials as needed, while accessing the full cross-organization vendor network.
              </p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-[#A8B5AB] hover:text-[#F2EFE6]"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold flex items-center gap-2 shadow hover:brightness-110 active:scale-95 transition-all"
              >
                Complete Organization Registration
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
