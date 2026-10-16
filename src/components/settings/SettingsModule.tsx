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
  Layers,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

export const SettingsModule: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    currentOrganization,
    users,
    departments,
    addDepartment,
    deleteDepartment,
    updateDepartment,
    theme,
    setTheme,
    exportDatabaseJson,
    importDatabaseJson,
    logout,
  } = useApp();

  const CURRENCIES = [
    { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (₦)' },
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi (GH₵)' },
    { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling (KSh)' },
    { code: 'ZAR', symbol: 'R', label: 'South African Rand (R)' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (C$)' },
  ];

  const isAdmin = currentUser?.role === 'Organization Admin';
  const isOrgManager =
    isAdmin ||
    currentUser?.role === 'Finance Officer' ||
    currentOrganization.type === 'sole_proprietorship';

  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

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
  const [orgCurrency, setOrgCurrency] = useState(
    currentOrganization?.currency || settings.currency || '₦'
  );

  // Department Management
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBudget, setNewDeptBudget] = useState<number>(15000000);
  const [editingDept, setEditingDept] = useState<{ id: string; name: string; budget: number } | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deptNotice, setDeptNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || newDeptBudget < 0) return;
    addDepartment(newDeptName.trim(), newDeptBudget, currentOrganization.id);
    setNewDeptName('');
    setNewDeptBudget(15000000);
    setDeptNotice({ type: 'success', message: `Department "${newDeptName.trim()}" created successfully.` });
    setTimeout(() => setDeptNotice(null), 4000);
  };

  const handleUpdateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name.trim()) return;
    updateDepartment(editingDept.id, editingDept.name.trim(), editingDept.budget);
    setEditingDept(null);
    setDeptNotice({ type: 'success', message: 'Department updated successfully.' });
    setTimeout(() => setDeptNotice(null), 4000);
  };

  const handleConfirmDeleteDept = () => {
    if (!deptToDelete) return;
    const result = deleteDepartment(deptToDelete.id);
    if (!result.success) {
      setDeptNotice({ type: 'error', message: result.message || 'Cannot delete department.' });
    } else {
      setDeptNotice({ type: 'success', message: `Department "${deptToDelete.name}" removed.` });
    }
    setDeptToDelete(null);
    setTimeout(() => setDeptNotice(null), 5000);
  };

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
      currency: orgCurrency,
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
          ...(isAdmin || isOrgManager
            ? [
                { id: 'organization', label: 'Organization Info', icon: Building },
                { id: 'departments', label: 'Departments & Units', icon: Layers },
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

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Operating Currency</label>
              <select
                value={orgCurrency}
                onChange={(e) => setOrgCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.symbol}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#A8B5AB] mt-1 block">
                All financial dashboard widgets, requisitions, budgets, and vouchers will display in this currency.
              </span>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-[10px] bg-[#1F6F4A] text-white font-semibold hover:brightness-110"
            >
              Update Organization Info
            </button>
          </form>
        )}

        {/* DEPARTMENTS & UNITS MANAGEMENT TAB */}
        {activeTab === 'departments' && isOrgManager && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                Departments & Operational Units ({currentOrganization.name})
              </h3>
              <p className="text-[#A8B5AB] mt-0.5">
                Add, manage, or remove departments and allocate annual baseline budget caps.
              </p>
            </div>

            {/* Department Action Notice */}
            {deptNotice && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  deptNotice.type === 'error'
                    ? 'bg-[#D9534F]/15 border-[#D9534F]/40 text-[#D9534F]'
                    : 'bg-[#3FB67A]/15 border-[#3FB67A]/40 text-[#3FB67A]'
                }`}
              >
                <span>{deptNotice.message}</span>
                <button onClick={() => setDeptNotice(null)} className="p-0.5 hover:opacity-75">
                  ✕
                </button>
              </div>
            )}

            {/* Create New Department Form */}
            <form onSubmit={handleAddDept} className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] space-y-3">
              <span className="font-bold text-[#F2EFE6] block text-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#D4AF37]" /> Create New Department
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A8B5AB] text-[11px] mb-1 font-medium">Department Name</label>
                  <input
                    type="text"
                    required
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Design Studio, Marketing, Quality Assurance"
                    className="w-full px-3 py-2 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[#A8B5AB] text-[11px] mb-1 font-medium">
                    Annual Budget Allocation ({currentOrganization.currency || '₦'})
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newDeptBudget}
                    onChange={(e) => setNewDeptBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] font-mono outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 shadow"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Add Department
                </button>
              </div>
            </form>

            {/* Existing Departments List */}
            <div className="space-y-3">
              <span className="font-bold text-[#F2EFE6] block text-xs">
                Active Departments ({orgDepts.length})
              </span>

              {orgDepts.length === 0 ? (
                <div className="py-8 text-center text-[#A8B5AB] bg-[#132A20]/40 rounded-xl border border-[#1F3A2D]">
                  No departments created yet for {currentOrganization.name}. Use the form above to add your first department.
                </div>
              ) : (
                orgDepts.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-[#F2EFE6] text-xs flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{d.name}</span>
                      </div>
                      <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                        Annual Budget Cap: <strong className="text-[#D4AF37] font-mono">{currentOrganization.currency || '₦'}{d.annualBudget.toLocaleString()}</strong> · Spent: {currentOrganization.currency || '₦'}{d.spent.toLocaleString()} · Committed: {currentOrganization.currency || '₦'}{d.committed.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingDept({ id: d.id, name: d.name, budget: d.annualBudget })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#07130E] hover:bg-[#1F3A2D] text-[#A8B5AB] hover:text-[#D4AF37] border border-[#1F3A2D] text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeptToDelete({ id: d.id, name: d.name })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#07130E] hover:bg-[#D9534F]/20 text-[#A8B5AB] hover:text-[#D9534F] border border-[#1F3A2D] text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Edit Department Sub-Modal */}
            {editingDept && (
              <div className="p-4 rounded-xl bg-[#07130E] border-2 border-[#D4AF37]/50 space-y-3 animate-in fade-in">
                <span className="font-bold text-[#D4AF37] block text-xs">Edit Department Details</span>
                <form onSubmit={handleUpdateDept} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#A8B5AB] text-[11px] mb-1">Department Name</label>
                      <input
                        type="text"
                        required
                        value={editingDept.name}
                        onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[#A8B5AB] text-[11px] mb-1">Annual Budget Cap ({currentOrganization.currency || '₦'})</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={editingDept.budget}
                        onChange={(e) => setEditingDept({ ...editingDept, budget: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] font-mono outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingDept(null)}
                      className="px-3 py-1.5 rounded-lg border border-[#1F3A2D] text-[#A8B5AB] text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#1F6F4A] text-[#F2EFE6] font-semibold text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
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

      {/* DEPARTMENT DELETE CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        onConfirm={handleConfirmDeleteDept}
        title={`Remove Department "${deptToDelete?.name}"?`}
        consequence="The department will be permanently removed from your organization structure. Departments with active requisitions or open tenders cannot be removed."
        confirmLabel="Remove Department"
      />
    </div>
  );
};
