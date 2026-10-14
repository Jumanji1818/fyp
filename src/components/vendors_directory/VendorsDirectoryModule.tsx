import React, { useState } from 'react';
import {
  Building,
  Search,
  Filter,
  Star,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Truck,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { VendorProfile } from '../../types';
import { isSoloOwnerFlow } from '../../utils/procurementRules';

export const VendorsDirectoryModule: React.FC = () => {
  const {
    vendors,
    toggleMyVendor,
    updateVendorStatus,
    getVendorEffectiveStatus,
    currentOrganization,
    currentUser,
    bids,
    purchaseOrders,
    categories,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);

  const activeVendor = vendors.find((v) => v.id === activeVendorId) || null;
  const canManageVendors = currentUser?.role === 'Procurement Officer' || isSoloOwnerFlow(currentOrganization.type, currentUser?.organizationId, currentOrganization.id);
  const activeEffectiveStatus = activeVendor ? getVendorEffectiveStatus(activeVendor) : { status: 'Approved' };

  // Suspend modal
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const filtered = vendors.filter((v) => {
    const effStatus = getVendorEffectiveStatus(v).status;
    if (selectedCategory !== 'All' && !v.categories.includes(selectedCategory)) return false;
    if (selectedStatus !== 'All' && effStatus !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.businessName.toLowerCase().includes(q) ||
        v.cacNumber.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmSuspend = () => {
    if (!activeVendor || !suspendReason.trim()) return;
    updateVendorStatus(activeVendor.id, 'Suspended', suspendReason);
    setSuspendModalOpen(false);
    setSuspendReason('');
    setActionFeedback(`Vendor suspended for ${currentOrganization.name}.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleReinstate = () => {
    if (!activeVendor) return;
    updateVendorStatus(activeVendor.id, 'Approved', `Reinstated for ${currentOrganization.name}`);
    setActionFeedback(`Vendor reinstated for ${currentOrganization.name}.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleBlacklist = () => {
    if (!activeVendor) return;
    updateVendorStatus(activeVendor.id, 'Blacklisted', `Blacklisted for ${currentOrganization.name}`);
    setActionFeedback(`Vendor blacklisted for ${currentOrganization.name}.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
            Global Vendor Directory & Supplier Network
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Universal supplier registry shared across all organizations, businesses, and sole proprietors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor name, CAC..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#A8B5AB] absolute left-2.5 top-2" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none max-w-[180px] truncate"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Registered">Registered</option>
            <option value="Suspended">Suspended</option>
            <option value="Blacklisted">Blacklisted</option>
          </select>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => setActiveVendorId(vendor.id)}
            className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] cursor-pointer flex flex-col justify-between transition-all group shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#D4AF37] font-semibold">{vendor.cacNumber}</span>
                <StatusChip status={getVendorEffectiveStatus(vendor).status} size="sm" />
              </div>

              <h3 className="font-bold text-sm text-[#F2EFE6] group-hover:text-[#D4AF37] transition-colors">
                {vendor.businessName}
              </h3>

              <div className="text-[11px] text-[#A8B5AB] mt-1">
                Contact: {vendor.contactPerson} · {vendor.state}
              </div>

              {/* Reliability Rating (Section 7.2) */}
              <div className="mt-3 flex items-center justify-between bg-[#132A20] p-2.5 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-[#D4AF37]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold">{vendor.reliabilityScore}%</span>
                  <span className="text-[10px] text-[#A8B5AB]">Reliability</span>
                </div>
                <span className="text-[11px] text-[#A8B5AB]">
                  {vendor.onTimeDeliveries}/{vendor.totalOrders} On-Time
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {vendor.categories.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded bg-[#07130E] text-[#A8B5AB] text-[10px] border border-[#1F3A2D]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1F3A2D] flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
              {/* My Vendors Toggle (Section 7.2: "A vendor can be added to My Vendors or removed") */}
              {canManageVendors && (
              <button
                onClick={() => toggleMyVendor(vendor.id)}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  vendor.inMyVendors
                    ? 'bg-[#3FB67A]/20 border-[#3FB67A] text-[#3FB67A]'
                    : 'bg-[#132A20] border-[#1F3A2D] text-[#A8B5AB] hover:text-[#F2EFE6]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {vendor.inMyVendors ? 'In My Vendors' : 'Add to My Vendors'}
              </button>
              )}

              <button
                onClick={() => setActiveVendorId(vendor.id)
                className="text-[#D4AF37] hover:underline font-semibold text-[11px]"
              >
                View Profile →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VENDOR DETAIL MODAL */}
      {activeVendor && (
        <Modal
          isOpen={!!activeVendor}
          onClose={() => setActiveVendorId(null)}
          title={activeVendor.businessName}
          subtitle={`CAC: ${activeVendor.cacNumber} · TIN: ${activeVendor.taxId}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs">
            {/* Real-time Status Badge & Alert */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#07130E] border border-[#1F3A2D]">
              <div className="flex items-center gap-2">
                <span className="text-[#A8B5AB]">Status for {currentOrganization.name}:</span>
                <StatusChip status={activeEffectiveStatus.status} size="sm" />
              </div>
              {actionFeedback && (
                <span className="text-[#3FB67A] font-semibold animate-in fade-in flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {actionFeedback}
                </span>
              )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#132A20] p-4 rounded-xl border border-[#1F3A2D]">
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Reliability Score:</span>
                <span className="text-xl font-bold font-serif-heading text-[#D4AF37]">
                  {activeVendor.reliabilityScore}%
                </span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Completed Orders:</span>
                <span className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
                  {activeVendor.totalOrders}
                </span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Late Deliveries:</span>
                <span className="text-xl font-bold font-serif-heading text-[#D9534F]">
                  {activeVendor.lateDeliveries}
                </span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Total Awarded:</span>
                <span className="text-lg font-bold font-serif-heading text-[#3FB67A]">
                  ₦{activeVendor.totalValueAwarded.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Profile info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#A8B5AB] block">Address:</span>
                <span className="font-semibold text-[#F2EFE6]">{activeVendor.address}, {activeVendor.state}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block">Contact Person:</span>
                <span className="font-semibold text-[#F2EFE6]">{activeVendor.contactPerson} ({activeVendor.phone})</span>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div>
              <span className="font-bold text-[#F2EFE6] block mb-2">Verified Compliance Documents:</span>
              <div className="space-y-1.5">
                {activeVendor.documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-semibold text-[#F2EFE6]">{d.name}</span>
                      <span className="text-[#A8B5AB] font-mono text-[10px]">({d.fileName})</span>
                    </div>
                    <span className="text-[#3FB67A] text-[10px] font-semibold">Verified Archive</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Management Actions: Suspend / Blacklist / Reinstate (Section 7.2) */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1F3A2D]">
              {canManageVendors && <div className="flex gap-2">
                {activeEffectiveStatus.status !== 'Suspended' ? (
                  <button
                    onClick={() => setSuspendModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#E0A93B]/20 text-[#E0A93B] border border-[#E0A93B]/40 hover:bg-[#E0A93B]/30 font-semibold transition-all active:scale-95"
                  >
                    Suspend for {currentOrganization.name}
                  </button>
                ) : (
                  <button
                    onClick={handleReinstate}
                    className="px-3.5 py-1.5 rounded-lg bg-[#3FB67A]/20 text-[#3FB67A] border border-[#3FB67A]/40 hover:bg-[#3FB67A]/30 font-semibold transition-all active:scale-95"
                  >
                    Reinstate for {currentOrganization.name}
                  </button>
                )}

                {activeEffectiveStatus.status !== 'Blacklisted' ? (
                  <button
                    onClick={handleBlacklist}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/40 hover:bg-[#D9534F]/30 font-semibold transition-all active:scale-95"
                  >
                    Blacklist
                  </button>
                ) : (
                  <button
                    onClick={handleReinstate}
                    className="px-3.5 py-1.5 rounded-lg bg-[#3FB67A]/20 text-[#3FB67A] border border-[#3FB67A]/40 hover:bg-[#3FB67A]/30 font-semibold transition-all active:scale-95"
                  >
                    Remove from Blacklist
                  </button>
                )}
              </div>}

              <button
                onClick={() => setActiveVendorId(null)
                className="px-4 py-2 rounded-lg bg-[#132A20] text-[#F2EFE6] hover:bg-[#1F3A2D]"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SUSPEND MODAL (Section 7.2: "reason required") */}
      <Modal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend Vendor Bidding Eligibility"
        subtitle="Suspended vendors cannot submit bids for any tenders."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Suspension Reason *</label>
            <textarea
              rows={3}
              required
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Failure to comply with warranty replacement agreement on past consignment..."
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setSuspendModalOpen(false)} className="px-4 py-2 text-[#A8B5AB]">
              Cancel
            </button>
            <button
              onClick={handleConfirmSuspend}
              disabled={!suspendReason.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#E0A93B] text-[#07130E] font-semibold disabled:opacity-40"
            >
              Confirm Suspension
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
