import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Tags,
  FileCheck2,
  UserCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { VendorProfile, User } from '../../types';

interface VendorRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: () => void;
}

export const VendorRegisterModal: React.FC<VendorRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const { categories, vendors, users, switchUser, addAuditLog, addNotification } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Business details
  const [businessName, setBusinessName] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [yearEstablished, setYearEstablished] = useState<number>(2020);
  const [address, setAddress] = useState('');
  const [state, setState] = useState('FCT - Abuja');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Categories (up to 3 parent categories, and subcategories)
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  // Step 3: Documents
  const [cacUploaded, setCacUploaded] = useState(false);
  const [tccUploaded, setTccUploaded] = useState(false);
  const [pencomUploaded, setPencomUploaded] = useState(false);

  // Step 4: Account details
  const [contactPerson, setContactPerson] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('Procura@2026');
  const [securityQuestion, setSecurityQuestion] = useState("What was your primary school's name?");
  const [securityAnswer, setSecurityAnswer] = useState('Kings College');

  const [error, setError] = useState('');

  const toggleParentCategory = (catName: string) => {
    if (selectedParents.includes(catName)) {
      setSelectedParents(selectedParents.filter((c) => c !== catName));
      // Remove subcategories belonging to this parent
      const parentObj = categories.find((c) => c.name === catName);
      if (parentObj) {
        setSelectedSubs(selectedSubs.filter((s) => !parentObj.subcategories.includes(s)));
      }
    } else {
      if (selectedParents.length >= 3) {
        setError('You can select a maximum of 3 parent procurement categories.');
        return;
      }
      setError('');
      setSelectedParents([...selectedParents, catName]);
    }
  };

  const toggleSubcategory = (sub: string) => {
    if (selectedSubs.includes(sub)) {
      setSelectedSubs(selectedSubs.filter((s) => s !== sub));
    } else {
      setSelectedSubs([...selectedSubs, sub]);
    }
  };

  const handleFinish = () => {
    if (!contactPerson || !accountEmail) {
      setError('Please provide contact person name and login email.');
      return;
    }

    const vendorId = 'vendor-' + Date.now();
    const userId = 'user-vendor-' + Date.now();

    const newVendor: VendorProfile = {
      id: vendorId,
      userId,
      businessName,
      cacNumber,
      taxId,
      yearEstablished,
      address,
      state,
      phone,
      email,
      contactPerson,
      categories: selectedParents,
      subcategories: selectedSubs,
      documents: [
        {
          id: 'doc-cac-' + Date.now(),
          name: 'CAC Registration Certificate',
          type: 'application/pdf',
          fileName: `CAC_${cacNumber}.pdf`,
          fileSize: '1.2 MB',
          uploadedAt: new Date().toISOString().split('T')[0],
          verified: false,
        },
        {
          id: 'doc-tcc-' + Date.now(),
          name: 'Tax Clearance Certificate',
          type: 'application/pdf',
          fileName: `TCC_${taxId}.pdf`,
          fileSize: '1.8 MB',
          uploadedAt: new Date().toISOString().split('T')[0],
          verified: false,
        },
      ],
      inMyVendors: false, // Per spec: Registered (not yet in My Vendors)
      status: 'Registered',
      reliabilityScore: 60, // Per spec: Neutral 60 for new vendor!
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      rejections: 0,
      totalOrders: 0,
      totalValueAwarded: 0,
    };

    const newUser: User = {
      id: userId,
      fullName: contactPerson,
      email: accountEmail,
      phone,
      role: 'Vendor',
      vendorId,
      status: 'Active',
      securityQuestion,
      securityAnswer,
      createdAt: new Date().toISOString(),
    };

    vendors.push(newVendor);
    users.push(newUser);

    addAuditLog(
      'Vendor Self-Registered',
      businessName,
      undefined,
      'Status: Registered',
      `Categories: ${selectedParents.join(', ')}`
    );

    addNotification({
      forRole: 'Procurement Officer',
      title: 'New Vendor Registration',
      message: `${businessName} registered under categories: ${selectedParents.join(', ')}.`,
      type: 'info',
    });

    // Auto-login and switch to this new vendor
    switchUser(userId);
    onRegistered();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vendor Enterprise Registration"
      subtitle="Register your enterprise to bid on procurement tenders."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs">
        {/* Step indicator */}
        <div className="flex items-center justify-between border-b border-[#1F3A2D] pb-3">
          {[
            { num: 1, label: 'Business Details', icon: Building2 },
            { num: 2, label: 'Categories', icon: Tags },
            { num: 3, label: 'Documents', icon: FileCheck2 },
            { num: 4, label: 'Account', icon: UserCheck },
          ].map((s) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isPassed = step > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isPassed
                      ? 'bg-[#3FB67A] text-[#07130E]'
                      : isCurrent
                      ? 'bg-[#D4AF37] text-[#07130E] ring-4 ring-[#D4AF37]/20'
                      : 'bg-[#132A20] text-[#A8B5AB]'
                  }`}
                >
                  {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                </div>
                <span className={`hidden sm:inline ${isCurrent ? 'text-[#D4AF37] font-bold' : 'text-[#A8B5AB]'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-[#D9534F]/15 border border-[#D9534F]/40 text-[#D9534F]">
            {error}
          </div>
        )}

        {/* STEP 1: Business Details */}
        {step === 1 && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Company / Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sterling Infrastructure Nig Ltd"
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">CAC Registration (RC / BN)</label>
                <input
                  type="text"
                  required
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  placeholder="e.g. RC-1849204"
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Tax Identification Number (TIN)</label>
                <input
                  type="text"
                  required
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. TIN-09827364-0001"
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Year Established</label>
                <input
                  type="number"
                  value={yearEstablished}
                  onChange={(e) => setYearEstablished(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Operational Physical Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot or Street Address, City"
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Corporate Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.ng"
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                disabled={!businessName || !cacNumber || !taxId}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold flex items-center gap-1.5 hover:brightness-110 disabled:opacity-40"
              >
                Next: Select Categories <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Categories */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <span className="font-semibold text-[#F2EFE6] block">
                Select Up to 3 Parent Categories ({selectedParents.length}/3)
              </span>
              <p className="text-[#A8B5AB] text-[11px] mt-0.5">
                Categories determine which tenders you will be matched with and notified of.
              </p>
            </div>

            {/* Parent Category Chips */}
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const isSelected = selectedParents.includes(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleParentCategory(c.name)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#1F6F4A]/30 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#132A20] border-[#1F3A2D] text-[#F2EFE6] hover:bg-[#1F3A2D]'
                    }`}
                  >
                    <span className="font-medium truncate">{c.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#D4AF37]" />}
                  </button>
                );
              })}
            </div>

            {/* Subcategories under selected parents */}
            {selectedParents.length > 0 && (
              <div className="pt-2 border-t border-[#1F3A2D] space-y-3">
                <span className="font-semibold text-[#D4AF37] block">Select Specialization Subcategories:</span>
                {selectedParents.map((parentName) => {
                  const catObj = categories.find((c) => c.name === parentName);
                  if (!catObj) return null;
                  return (
                    <div key={parentName} className="p-3 rounded-xl bg-[#07130E] border border-[#1F3A2D]">
                      <span className="text-[11px] font-bold text-[#A8B5AB] uppercase mb-1.5 block">
                        {parentName}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {catObj.subcategories.map((sub) => {
                          const isSubSelected = selectedSubs.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => toggleSubcategory(sub)}
                              className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                                isSubSelected
                                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-semibold'
                                  : 'bg-[#132A20] border-[#1F3A2D] text-[#A8B5AB] hover:text-[#F2EFE6]'
                              }`}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs text-[#A8B5AB] hover:text-[#F2EFE6]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={selectedParents.length === 0}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold flex items-center gap-1.5 hover:brightness-110 disabled:opacity-40"
              >
                Next: Compliance Documents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Documents Upload */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <span className="font-semibold text-[#F2EFE6] block">Corporate Compliance Credentials</span>
              <p className="text-[#A8B5AB] text-[11px] mt-0.5">
                Upload mandatory government registration and tax certificates. Files are archived locally in app data.
              </p>
            </div>

            <div className="space-y-2.5">
              {/* CAC Certificate */}
              <div className="p-3.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F2EFE6]">1. CAC Certificate of Incorporation</div>
                  <div className="text-[11px] text-[#A8B5AB]">Mandatory official certificate (.pdf)</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCacUploaded(!cacUploaded)}
                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                    cacUploaded
                      ? 'bg-[#3FB67A]/20 border-[#3FB67A] text-[#3FB67A] font-semibold'
                      : 'bg-[#0D1F17] border-[#1F3A2D] text-[#D4AF37] hover:bg-[#1F3A2D]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {cacUploaded ? 'Attached (CAC_Cert.pdf)' : 'Attach Document'}
                </button>
              </div>

              {/* Tax Clearance */}
              <div className="p-3.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F2EFE6]">2. Valid Tax Clearance Certificate (TCC)</div>
                  <div className="text-[11px] text-[#A8B5AB]">FIRS certification for past year</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTccUploaded(!tccUploaded)}
                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                    tccUploaded
                      ? 'bg-[#3FB67A]/20 border-[#3FB67A] text-[#3FB67A] font-semibold'
                      : 'bg-[#0D1F17] border-[#1F3A2D] text-[#D4AF37] hover:bg-[#1F3A2D]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {tccUploaded ? 'Attached (TCC_2025.pdf)' : 'Attach Document'}
                </button>
              </div>

              {/* Optional PenCom */}
              <div className="p-3.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F2EFE6]">3. PenCom Compliance (Optional)</div>
                  <div className="text-[11px] text-[#A8B5AB]">National Pension Commission certificate</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPencomUploaded(!pencomUploaded)}
                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                    pencomUploaded
                      ? 'bg-[#3FB67A]/20 border-[#3FB67A] text-[#3FB67A] font-semibold'
                      : 'bg-[#0D1F17] border-[#1F3A2D] text-[#A8B5AB] hover:bg-[#1F3A2D]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {pencomUploaded ? 'Attached (PenCom.pdf)' : 'Attach Document'}
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs text-[#A8B5AB] hover:text-[#F2EFE6]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold flex items-center gap-1.5 hover:brightness-110"
              >
                Next: Account Setup <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Account Details */}
        {step === 4 && (
          <div className="space-y-3.5 animate-in fade-in">
            <div>
              <span className="font-semibold text-[#F2EFE6] block">Vendor Portal Account</span>
              <p className="text-[#A8B5AB] text-[11px] mt-0.5">
                Create user access credentials for submitting tender bids and tracking deliveries.
              </p>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Contact Person Full Name</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Alhaji Mustapha Danladi"
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Login Email Address</label>
                <input
                  type="email"
                  required
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="musa@apex.ng"
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
            </div>

            {/* Security Question for Offline Password Recovery */}
            <div className="p-3 rounded-xl bg-[#07130E] border border-[#1F3A2D] space-y-2">
              <span className="text-[#D4AF37] font-semibold text-[11px] block">
                Offline Security Question
              </span>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] text-xs outline-none"
              >
                <option>What was your primary school&apos;s name?</option>
                <option>What city were you born in?</option>
                <option>What is your mother&apos;s maiden name?</option>
                <option>What was your first car model?</option>
              </select>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Your answer"
                className="w-full px-3 py-1.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] text-xs outline-none"
              />
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs text-[#A8B5AB] hover:text-[#F2EFE6]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold flex items-center gap-1.5 hover:brightness-110 shadow-lg"
              >
                Complete Registration & Launch Portal <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
