import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  Users,
  Plus,
  ArrowRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Sliders,
  Scale,
  XCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { ProgressBar } from '../common/ProgressBar';
import { Modal } from '../common/Modal';
import { Tender, PurchaseRequest } from '../../types';

interface TendersModuleProps {
  initialSelectedId?: string;
  onNavigateToEvaluation?: (tenderId: string) => void;
}

export const TendersModule: React.FC<TendersModuleProps> = ({
  initialSelectedId,
  onNavigateToEvaluation,
}) => {
  const {
    tenders,
    requests,
    vendors,
    categories,
    createTenderFromRequest,
    extendTenderDeadline,
    cancelTender,
    settings,
    currentOrganization,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tenders' | 'approved_queue'>('tenders');

  // Multi-tenant organization isolation for tenders
  const orgTenders = tenders.filter((t) =>
    t.organizationId ? t.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const [selectedTender, setSelectedTender] = useState<Tender | null>(() => {
    if (initialSelectedId) {
      return orgTenders.find((t) => t.id === initialSelectedId) || null;
    }
    return null;
  });

  // Convert to tender modal
  const [convertingRequest, setConvertingRequest] = useState<PurchaseRequest | null>(null);
  const [tenderTitle, setTenderTitle] = useState('');
  const [tenderDesc, setTenderDesc] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Central Warehouse, Abuja');
  const [deliveryDays, setDeliveryDays] = useState<number>(21);
  const [closingDate, setClosingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 16);
  });
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [restrictMyVendors, setRestrictMyVendors] = useState<boolean>(false);

  // Criteria Weights (defaults from settings)
  const [weights, setWeights] = useState({
    price: settings.defaultEvaluationWeights.price,
    deliveryTime: settings.defaultEvaluationWeights.deliveryTime,
    vendorReliability: settings.defaultEvaluationWeights.vendorReliability,
    technicalScore: settings.defaultEvaluationWeights.technicalScore,
  });

  // Mandatory Compliance Docs
  const [mandatoryDocs, setMandatoryDocs] = useState<string[]>([
    'CAC Certificate',
    'Tax Clearance Certificate (TCC)',
    'PenCom Compliance Certificate',
  ]);

  // Extend Deadline Modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [newClosingDate, setNewClosingDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  // Cancel Tender Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Approved requests in queue ready to be converted into tenders for this organization
  const approvedRequests = requests.filter((r) => {
    const matchOrg = r.organizationId
      ? r.organizationId === currentOrganization.id
      : currentOrganization.id === 'org-emerald';
    return matchOrg && r.status === 'Approved by Department';
  });

  // Matched vendors count calculation
  const targetCats = selectedCats.length > 0 ? selectedCats : categories.slice(0, 1).map((c) => c.name);
  const matchingVendors = vendors.filter((v) => {
    if (restrictMyVendors && !v.inMyVendors) return false;
    return v.categories.some((c) => targetCats.includes(c));
  });

  const openConvertModal = (req: PurchaseRequest) => {
    setConvertingRequest(req);
    setTenderTitle(req.title);
    setTenderDesc(req.justification);
    const reqCats = [...new Set(req.items.map((i) => i.category))];
    setSelectedCats(reqCats.length > 0 ? reqCats : [categories[0].name]);
    setWeights(settings.defaultEvaluationWeights);
  };

  const handlePublishTender = () => {
    if (!convertingRequest) return;
    const newTender = createTenderFromRequest(convertingRequest.id, {
      title: tenderTitle,
      description: tenderDesc,
      deliveryLocation,
      requiredDeliveryPeriodDays: deliveryDays,
      bidClosingDateTime: new Date(closingDate).toISOString(),
      categories: selectedCats,
      evaluationWeights: weights,
      mandatoryDocuments: mandatoryDocs,
      restrictToMyVendors: restrictMyVendors,
    });
    setConvertingRequest(null);
    setSelectedTender(newTender);
  };

  const handleConfirmExtend = () => {
    if (!selectedTender || !newClosingDate || !extendReason.trim()) return;
    extendTenderDeadline(selectedTender.id, new Date(newClosingDate).toISOString(), extendReason);
    setExtendModalOpen(false);
    setExtendReason('');
  };

  const handleConfirmCancel = () => {
    if (!selectedTender || !cancelReason.trim()) return;
    cancelTender(selectedTender.id, cancelReason);
    setCancelModalOpen(false);
    setCancelReason('');
    setSelectedTender(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between bg-[#0D1F17] p-3 rounded-2xl border border-[#1F3A2D]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tenders')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'tenders'
                ? 'bg-[#132A20] text-[#D4AF37] border border-[#D4AF37]/40 shadow'
                : 'text-[#A8B5AB] hover:text-[#F2EFE6]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> All Tenders ({orgTenders.length})
          </button>
          <button
            onClick={() => setActiveTab('approved_queue')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'approved_queue'
                ? 'bg-[#132A20] text-[#D4AF37] border border-[#D4AF37]/40 shadow'
                : 'text-[#A8B5AB] hover:text-[#F2EFE6]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#3FB67A]" /> Approved Requests Queue ({approvedRequests.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ALL TENDERS */}
      {activeTab === 'tenders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgTenders.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] text-[#A8B5AB]">
              No tenders created yet for {currentOrganization.name}. Convert approved requisitions from the queue tab above.
            </div>
          ) : (
            orgTenders.map((t) => {
            const isClosed = t.status === 'Closed' || new Date(t.bidClosingDateTime).getTime() <= Date.now();
            const daysRemaining = Math.max(
              0,
              Math.ceil((new Date(t.bidClosingDateTime).getTime() - Date.now()) / (1000 * 3600 * 24))
            );

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTender(t)}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] cursor-pointer flex flex-col justify-between transition-all group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-[#D4AF37]">{t.referenceNumber}</span>
                    <StatusChip status={t.status} size="sm" />
                  </div>

                  <h3 className="font-bold text-sm text-[#F2EFE6] group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                    {t.title}
                  </h3>

                  <div className="text-[11px] text-[#A8B5AB] mt-2 line-clamp-2">{t.description}</div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.categories.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-[#132A20] text-[#E8CF7A] text-[10px] border border-[#1F3A2D]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1F3A2D] flex items-center justify-between text-xs">
                  {/* Countdown timer chip (Section 6.3) */}
                  {t.status === 'Open' ? (
                    <span className="px-2 py-1 rounded-full bg-[#E0A93B]/15 border border-[#E0A93B]/30 text-[#E0A93B] font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Closes in {daysRemaining} days
                    </span>
                  ) : (
                    <span className="text-[#A8B5AB] font-mono text-[11px]">Bidding Closed</span>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-[#A8B5AB]">
                    <Users className="w-3.5 h-3.5 text-[#3FB67A]" />
                    <span>{t.matchingVendorsNotifiedCount} notified</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* TAB 2: APPROVED REQUESTS READY FOR TENDER CONVERSION (Section 6.3) */}
      {activeTab === 'approved_queue' && (
        <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
          <div className="mb-4">
            <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
              Approved Purchase Requests Queue
            </h3>
            <p className="text-xs text-[#A8B5AB]">
              These requisitions have received Department Head approval and are queued for tender advertisement.
            </p>
          </div>

          <div className="space-y-3">
            {approvedRequests.length === 0 ? (
              <div className="py-12 text-center text-[#A8B5AB] text-xs">
                No approved requisitions currently pending in queue.
              </div>
            ) : (
              approvedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#D4AF37] text-xs">{req.referenceNumber}</span>
                      <span className="font-semibold text-sm text-[#F2EFE6]">{req.title}</span>
                    </div>
                    <div className="text-xs text-[#A8B5AB] mt-1">
                      Department: {req.departmentName} · Est: ₦{req.estimatedTotal.toLocaleString()} · Items:{' '}
                      {req.items.length}
                    </div>
                  </div>

                  <button
                    onClick={() => openConvertModal(req)}
                    className="px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D4AF37]" /> Convert to Tender
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONVERT REQUEST TO TENDER MODAL (Section 6.3) */}
      {convertingRequest && (
        <Modal
          isOpen={!!convertingRequest}
          onClose={() => setConvertingRequest(null)}
          title={`Convert ${convertingRequest.referenceNumber} to Tender`}
          subtitle="Pre-filled from approved requisition. Configure criteria weights and mandatory compliance."
          maxWidth="max-w-4xl"
        >
          <div className="space-y-5 text-xs">
            {/* Title & Desc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[#A8B5AB] font-medium mb-1">Tender Title</label>
                <input
                  type="text"
                  value={tenderTitle}
                  onChange={(e) => setTenderTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Delivery Location</label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Delivery Period (Days)</label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">Bid Closing Date & Time</label>
                  <input
                    type="datetime-local"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Smart Vendor Matching Preview (Section 6.3: "X matching vendors notified") */}
            <div className="p-4 rounded-xl bg-[#07130E] border border-[#1F3A2D] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3FB67A]" />
                  <span className="font-bold text-[#F2EFE6]">
                    Database Category Match: {matchingVendors.length} Registered Vendors
                  </span>
                </div>
                <p className="text-[11px] text-[#A8B5AB] mt-0.5">
                  Procura will automatically notify all {matchingVendors.length} matching vendors upon publish.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="restrictVendors"
                  checked={restrictMyVendors}
                  onChange={(e) => setRestrictMyVendors(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
                <label htmlFor="restrictVendors" className="text-xs text-[#A8B5AB] cursor-pointer">
                  Restrict to &quot;My Vendors&quot; approved list only
                </label>
              </div>
            </div>

            {/* Evaluation Criteria Weights (Section 6.5) */}
            <div className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> Smart Evaluation Weights (Must sum to 100%)
                </span>
                <span
                  className={`font-mono font-bold ${
                    weights.price + weights.deliveryTime + weights.vendorReliability + weights.technicalScore === 100
                      ? 'text-[#3FB67A]'
                      : 'text-[#D9534F]'
                  }`}
                >
                  Sum: {weights.price + weights.deliveryTime + weights.vendorReliability + weights.technicalScore}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#A8B5AB] text-[11px] mb-1">Price Weight (%)</label>
                  <input
                    type="number"
                    value={weights.price}
                    onChange={(e) => setWeights({ ...weights, price: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B5AB] text-[11px] mb-1">Delivery Speed (%)</label>
                  <input
                    type="number"
                    value={weights.deliveryTime}
                    onChange={(e) => setWeights({ ...weights, deliveryTime: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B5AB] text-[11px] mb-1">Reliability History (%)</label>
                  <input
                    type="number"
                    value={weights.vendorReliability}
                    onChange={(e) => setWeights({ ...weights, vendorReliability: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[#A8B5AB] text-[11px] mb-1">Technical Score (%)</label>
                  <input
                    type="number"
                    value={weights.technicalScore}
                    onChange={(e) => setWeights({ ...weights, technicalScore: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => setConvertingRequest(null)}
                className="px-4 py-2 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePublishTender}
                disabled={
                  weights.price + weights.deliveryTime + weights.vendorReliability + weights.technicalScore !== 100
                }
                className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110 shadow-lg disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" /> Publish Tender & Notify Vendors
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* TENDER DETAIL VIEW */}
      {selectedTender && (
        <Modal
          isOpen={!!selectedTender}
          onClose={() => setSelectedTender(null)}
          title={`Tender: ${selectedTender.referenceNumber}`}
          subtitle={selectedTender.title}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Stepper */}
            <ProgressBar
              currentStage={
                selectedTender.status === 'Awarded'
                  ? 'Award'
                  : selectedTender.status === 'Closed' || selectedTender.status === 'Under Evaluation'
                  ? 'Evaluation'
                  : 'Bidding'
              }
            />

            {/* Top metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D]">
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Department:</span>
                <span className="font-semibold text-[#F2EFE6]">{selectedTender.departmentName}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Delivery Location:</span>
                <span className="font-semibold text-[#F2EFE6] truncate block">{selectedTender.deliveryLocation}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Closing Deadline:</span>
                <span className="font-semibold text-[#E0A93B]">
                  {new Date(selectedTender.bidClosingDateTime).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Status:</span>
                <StatusChip status={selectedTender.status} size="sm" />
              </div>
            </div>

            {/* Extended Deadline Reason if present */}
            {selectedTender.extendedDeadlineReason && (
              <div className="p-3 rounded-xl bg-[#07130E] border border-[#D4AF37] text-xs">
                <span className="font-bold text-[#D4AF37] block mb-0.5">Deadline Extension Notice:</span>
                <p className="text-[#F2EFE6]">{selectedTender.extendedDeadlineReason}</p>
              </div>
            )}

            {/* Items */}
            <div>
              <span className="font-bold text-[#F2EFE6] mb-2 block">Tender Specifications & Scope:</span>
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#132A20] text-[#A8B5AB]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Specifications</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {selectedTender.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{it.description}</td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{it.specifications}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#D4AF37]">
                        {it.quantity} {it.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions for Officer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1F3A2D]">
              <div className="flex gap-2">
                <button
                  onClick={() => setExtendModalOpen(true)}
                  className="px-3.5 py-2 rounded-[10px] bg-[#132A20] hover:bg-[#1F3A2D] text-[#E0A93B] font-semibold"
                >
                  Extend Deadline
                </button>
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-3.5 py-2 rounded-[10px] bg-[#132A20] hover:bg-[#D9534F]/20 text-[#D9534F] font-semibold"
                >
                  Cancel Tender
                </button>
              </div>

              {(selectedTender.status === 'Closed' || selectedTender.status === 'Under Evaluation') && onNavigateToEvaluation && (
                <button
                  onClick={() => {
                    onNavigateToEvaluation(selectedTender.id);
                    setSelectedTender(null);
                  }}
                  className="px-5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg"
                >
                  <Scale className="w-4 h-4 text-[#D4AF37]" /> Open Bids Evaluation Screen →
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* EXTEND DEADLINE MODAL (Section 6.3: "reason required") */}
      <Modal
        isOpen={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        title="Extend Tender Bid Closing Deadline"
        subtitle="Reason will be logged and all notified vendors will receive notification."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">New Closing Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={newClosingDate}
              onChange={(e) => setNewClosingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Extension Justification *</label>
            <textarea
              rows={3}
              required
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              placeholder="e.g. Addendum to borehole technical specifications requested by bidders..."
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setExtendModalOpen(false)} className="px-4 py-2 text-[#A8B5AB]">
              Cancel
            </button>
            <button
              onClick={handleConfirmExtend}
              disabled={!newClosingDate || !extendReason.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#E0A93B] text-[#07130E] font-semibold hover:brightness-110 disabled:opacity-40"
            >
              Confirm Extension
            </button>
          </div>
        </div>
      </Modal>

      {/* CANCEL TENDER MODAL (Section 6.3: "reason required") */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Tender Advert"
        subtitle="This action will terminate the procurement and record the reason in the audit trail."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Cancellation Reason *</label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Requisition requirements superseded by organizational restructure..."
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D9534F]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setCancelModalOpen(false)} className="px-4 py-2 text-[#A8B5AB]">
              Back
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#D9534F] text-white font-semibold hover:brightness-110 disabled:opacity-40"
            >
              Cancel Tender
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
