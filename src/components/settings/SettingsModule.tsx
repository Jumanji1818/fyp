import React, { useState } from 'react';
import {
  User,
  Palette,
  Bell,
  Shield,
  Building,
  Sliders,
  Database,
  Info,
  Check,
  Download,
  Upload,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

export const SettingsModule: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    users,
    theme,
    setTheme,
    exportDatabaseJson,
    importDatabaseJson,
    logout,
  } = useApp();

  const isAdmin = currentUser?.role === 'Organization Admin';
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Profile
  const [name, setName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Procurement Rules
  const [threshold, setThreshold] = useState<number>(settings.approvalThreshold);
  const [minDays, setMinDays] = useState<number>(settings.minimumTenderDays);
  const [penaltyText, setPenaltyText] = useState(settings.deliveryPenaltyText);
  const [weights, setWeights] = useState({ ...settings.defaultEvaluationWeights });

  // Organization
  const [orgName, setOrgName] = useState(settings.name);
  const [orgAddress, setOrgAddress] = useState(settings.address);
  const [orgPhone, setOrgPhone] = useState(settings.phone);
  const [orgEmail, setOrgEmail] = useState(settings.email);

  // Backup confirmation
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [pendingRestoreJson, setPendingRestoreJson] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      currentUser.fullName = name;
      currentUser.email = email;
      currentUser.phone = phone;
    }
    showSaved();
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: orgName,
      address: orgAddress,
      phone: orgPhone,
      email: orgEmail,
    });
    showSaved();
  };

  const handleSaveProcurementRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      approvalThreshold: threshold,
      minimumTenderDays: minDays,
      deliveryPenaltyText: penaltyText,
      defaultEvaluationWeights: weights,
    });
    showSaved();
  };

  const showSaved = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Procura_Database_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPendingRestoreJson(content);
        setRestoreConfirmOpen(true);
      };
      reader.readAsText(file);
    }
  };

  const executeRestore = () => {
    if (pendingRestoreJson) {
      const success = importDatabaseJson(pendingRestoreJson);
      if (success) {
        showSaved();
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-6 shadow-xl text-xs">
      {/* Left Tab List (Section 8) */}
      <div className="w-full md:w-60 space-y-1 shrink-0 border-b md:border-b-0 md:border-r border-[#1F3A2D] pb-4 md:pb-0 md:pr-4">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security', icon: Shield },
          ...(isAdmin
            ? [
                { id: 'organization', label: 'Organization', icon: Building },
                { id: 'procurement_rules', label: 'Procurement Rules', icon: Sliders },
                { id: 'backup', label: 'Backup & Restore', icon: Database },
              ]
            : []),
          { id: 'about', label: 'About Procura', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all text-left ${
                isActive
                  ? 'bg-[#132A20] text-[#D4AF37] font-semibold border border-[#D4AF37]/30 shadow'
                  : 'text-[#A8B5AB] hover:text-[#F2EFE6] hover:bg-[#132A20]/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Tab Content */}
      <div className="flex-1 max-w-2xl">
        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-[#1F6F4A]/20 border border-[#3FB67A] text-[#3FB67A] flex items-center gap-2">
            <Check className="w-4 h-4" /> Changes successfully saved and applied.
          </div>
        )}

        {/* 1. PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">Personal Profile</h3>
              <p className="text-[#A8B5AB] mt-0.5">Manage your operator name and contact information.</p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border-2 border-[#D4AF37] flex items-center justify-center font-bold text-lg text-[#D4AF37] shadow">
                {currentUser?.avatar || currentUser?.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-[#F2EFE6] text-sm block">{currentUser?.fullName}</span>
                <span className="text-[#D4AF37] block">{currentUser?.role}</span>
              </div>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
                />
              </div>
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Telephone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-[10px] bg-[#1F6F4A] text-white font-semibold hover:brightness-110"
            >
              Save Profile Changes
            </button>
          </form>
        )}

        {/* 2. APPEARANCE (Section 8: "theme Light, Dark, Follow system with live preview thumbnails") */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                Appearance & Display
              </h3>
              <p className="text-[#A8B5AB] mt-0.5">
                Customize desktop visual theme, animations, and typography sizing.
              </p>
            </div>

            {/* Theme Live Previews */}
            <div>
              <span className="font-semibold text-[#F2EFE6] block mb-2">Color Theme:</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Dark Mode', desc: 'Dark green & gold', icon: Moon },
                  { id: 'light', label: 'Light Mode', desc: 'Warm ivory & emerald', icon: Sun },
                  { id: 'system', label: 'Follow System', desc: 'Auto OS match', icon: Monitor },
                ].map((th) => {
                  const Icon = th.icon;
                  const isSelected = theme === th.id;
                  return (
                    <div
                      key={th.id}
                      onClick={() => setTheme(th.id as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#132A20] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 text-[#D4AF37]'
                          : 'bg-[#07130E] border-[#1F3A2D] text-[#A8B5AB] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2" />
                      <div className="font-semibold text-[#F2EFE6]">{th.label}</div>
                      <div className="text-[10px] text-[#A8B5AB]">{th.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Animation Level (Full, Reduced, Off) (Section 8 & 11) */}
            <div>
              <span className="font-semibold text-[#F2EFE6] block mb-2">Animation Level:</span>
              <div className="grid grid-cols-3 gap-3">
                {['Full', 'Reduced', 'Off'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateSettings({ animationLevel: lvl as any })}
                    className={`py-2 px-3 rounded-lg border font-semibold ${
                      settings.animationLevel === lvl
                        ? 'bg-[#132A20] border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#07130E] border-[#1F3A2D] text-[#A8B5AB]'
                    }`}
                  >
                    {lvl} Motion
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-[#A8B5AB] mt-1 block">
                Off removes all transitions and auto-skips the intro splash.
              </span>
            </div>

            {/* Table Density */}
            <div>
              <span className="font-semibold text-[#F2EFE6] block mb-2">Table Density:</span>
              <div className="flex gap-3">
                {['Comfortable', 'Compact'].map((den) => (
                  <button
                    key={den}
                    type="button"
                    onClick={() => updateSettings({ tableDensity: den as any })}
                    className={`py-1.5 px-4 rounded-lg border font-semibold ${
                      settings.tableDensity === den
                        ? 'bg-[#132A20] border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#07130E] border-[#1F3A2D] text-[#A8B5AB]'
                    }`}
                  >
                    {den}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                Notification Preferences
              </h3>
              <p className="text-[#A8B5AB] mt-0.5">Toggle alert categories for deadlines and updates.</p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'deadlines', label: 'Tender Deadlines & Countdown Alerts' },
                { id: 'approvals', label: 'Requisition & Department Approval Actions' },
                { id: 'awards', label: 'Tender Award Announcements & PO Issuances' },
                { id: 'payments', label: 'Payment Remittances & Voucher Notifications' },
              ].map((pref) => (
                <div
                  key={pref.id}
                  className="p-3 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex items-center justify-between"
                >
                  <span className="text-[#F2EFE6]">{pref.label}</span>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                    className="accent-[#D4AF37] w-4 h-4"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SECURITY (Section 8: "inactivity timeout 10, 30, 60 minutes") */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                Security & Inactivity Policy
              </h3>
              <p className="text-[#A8B5AB] mt-0.5">Configure station timeout and credentials.</p>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">
                Auto Sign-Out Inactivity Timeout
              </label>
              <select
                value={settings.inactivityTimeoutMinutes}
                onChange={(e) => updateSettings({ inactivityTimeoutMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
              >
                <option value={10}>10 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/30 hover:bg-[#D9534F]/30 font-semibold"
              >
                Sign Out of This Workstation
              </button>
            </div>
          </div>
        )}

        {/* 5. ORGANIZATION (Admin) */}
        {activeTab === 'organization' && isAdmin && (
          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                Organization Information
              </h3>
              <p className="text-[#A8B5AB] mt-0.5">Primary legal entity information appearing on official vouchers.</p>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
              />
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Corporate Address</label>
              <input
                type="text"
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
                />
              </div>
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-[10px] bg-[#1F6F4A] text-white font-semibold hover:brightness-110"
            >
              Update Organization Info
            </button>
          </form>
        )}

        {/* 6. PROCUREMENT RULES (Admin) (Section 8) */}
        {activeTab === 'procurement_rules' && isAdmin && (
          <form onSubmit={handleSaveProcurementRules} className="space-y-4">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                Procurement Rules & Governance
              </h3>
              <p className="text-[#A8B5AB] mt-0.5">Threshold policies and default weighting criteria.</p>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">
                Executive Approval Threshold (₦)
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] font-mono"
              />
              <span className="text-[10px] text-[#A8B5AB] mt-0.5 block">
                Awards exceeding this amount require Approving Authority sign-off.
              </span>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">
                Default Vendor Delivery Warning Notice
              </label>
              <textarea
                rows={3}
                value={penaltyText}
                onChange={(e) => setPenaltyText(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-[10px] bg-[#1F6F4A] text-white font-semibold hover:brightness-110"
            >
              Save Procurement Rules
            </button>
          </form>
        )}

        {/* 7. BACKUP & RESTORE (Admin) (Section 8) */}
        {activeTab === 'backup' && isAdmin && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                Database Backup & Disaster Recovery
              </h3>
              <p className="text-[#A8B5AB] mt-0.5">
                Export full local Drift database schema and all audit logs to a JSON snapshot or restore.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#F2EFE6] block">Backup Database Now</span>
                <span className="text-[11px] text-[#A8B5AB]">
                  Creates a timestamped snapshot of users, tenders, bids, POs, payments, and audits.
                </span>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold flex items-center gap-1.5 hover:brightness-110 shadow"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" /> Download JSON Backup
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#F2EFE6] block">Restore from Backup JSON</span>
                <span className="text-[11px] text-[#A8B5AB]">
                  Imports state from a previously generated Procura backup archive.
                </span>
              </div>
              <label className="px-4 py-2 rounded-[10px] bg-[#07130E] border border-[#1F3A2D] hover:bg-[#1F3A2D] text-[#D4AF37] font-semibold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Select File to Restore
                <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* 8. ABOUT PROCURA (Section 8: "credits, licenses") */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-lg">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.2 14.5l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif-heading text-[#F2EFE6]">
                  Procura Enterprise
                </h3>
                <span className="text-[11px] text-[#D4AF37]">
                  Final Year Project · Smart Procurement from Request to Payment
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] space-y-2 text-[#A8B5AB]">
              <p>
                <strong className="text-[#F2EFE6]">Version:</strong> 2026.1.0-Release (Windows Native Architecture)
              </p>
              <p>
                <strong className="text-[#F2EFE6]">Architecture:</strong> Standalone native desktop application with role-based access enforced in the data layer.
              </p>
              <p>
                <strong className="text-[#F2EFE6]">Design System:</strong> Fraunces Serif and Manrope Typography, Deep Green & Gold Palette.
              </p>
              <p>
                <strong className="text-[#F2EFE6]">License:</strong> Proprietary Institutional License. All Rights Reserved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RESTORE CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={executeRestore}
        title="Restore Database from Backup?"
        consequence="All existing tenders, bids, orders, and audits will be overwritten with the imported backup archive."
        confirmLabel="Overwrite & Restore Database"
      />
    </div>
  );
};
