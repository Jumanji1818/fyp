import React, { useState } from 'react';
import {
  ShoppingBag,
  Scale,
  Award,
  Truck,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Upload,
  Check,
  Calendar,
  Lock,
  ArrowRight,
  Printer,
  Download,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { PrintViewModal, DocumentData } from '../common/PrintViewModal';
import { Tender, Bid, BidItem, PurchaseOrder } from '../../types';

interface VendorPortalModuleProps {
  activeView: 'tenders' | 'bids' | 'contracts' | 'deliveries' | 'payments';
  onNavigateTab: (tabId: string) => void;
}

export const VendorPortalModule: React.FC<VendorPortalModuleProps> = ({
  activeView,
  onNavigateTab,
}) => {
  const {
    currentUser,
    vendors,
    tenders,
    bids,
    purchaseOrders,
    payments,
    organizations,
    submitBid,
    dispatchDelivery,
    getVendorEffectiveStatus,
  } = useApp();

  const currentVendor = vendors.find((v) => v.userId === currentUser?.id || v.id === currentUser?.vendorId) || vendors[0];

  // Vendor's open tenders matching their categories
  const matchingOpenTenders = tenders.filter((t) => {
    if (t.status !== 'Open') return false;
    if (t.restrictToMyVendors && !currentVendor.inMyVendors) return false;
    return t.categories.some((c) => currentVendor.categories.includes(c));
  });

  // Vendor's bids
  const vendorBids = bids.filter((b) => b.vendorId === currentVendor.id);

  // Vendor's awarded POs
  const vendorPOs = purchaseOrders.filter((po) => po.vendorId === currentVendor.id);

  // Vendor's payments
  const vendorPayments = payments.filter((p) => p.vendorId === currentVendor.id);

  // Submit Bid State
  const [biddingTender, setBiddingTender] = useState<Tender | null>(null);
  const [viewingSubmittedBid, setViewingSubmittedBid] = useState<Bid | null>(null);
  const [bidItems, setBidItems] = useState<BidItem[]>([]);
  const [proposedDeliveryDate, setProposedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().split('T')[0];
  });
  const [warrantyPeriod, setWarrantyPeriod] = useState('12 Months OEM Warranty');
  const [technicalProposal, setTechnicalProposal] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<{ [docName: string]: string }>({});
  const [legalWarningAck, setLegalWarningAck] = useState(false);
  const [submittedBidRef, setSubmittedBidRef] = useState<string | null>(null);

  // Dispatch state
  const [dispatchingPO, setDispatchingPO] = useState<any | null>(null);
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Print & Document Modal State
  const [printDoc, setPrintDoc] = useState<DocumentData | null>(null);
  const [viewingContractPO, setViewingContractPO] = useState<PurchaseOrder | null>(null);

  const openVendorAwardLetter = (po: PurchaseOrder) => {
    const tender = tenders.find((t) => t.id === po.tenderId || t.referenceNumber === po.tenderReference);
    const matchedBid = bids.find(
      (b) => (b.tenderId === po.tenderId || b.tenderReference === po.tenderReference) && b.vendorId === currentVendor.id
    );

    setPrintDoc({
      type: 'Award Letter',
      reference: `AL-${po.tenderReference}`,
      title: tender?.title || `Contract for ${po.tenderReference}`,
      date: new Date(po.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      recipientName: currentVendor.businessName,
      recipientAddress: currentVendor.address || 'Victoria Island, Lagos / Abuja FCT, Nigeria',
      recipientAttention: currentVendor.contactPerson || 'Managing Director',
      department: po.departmentName,
      amount: po.totalAmount,
      items: po.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      awardDetails: {
        tenderReference: po.tenderReference,
        tenderTitle: tender?.title || `Procurement Contract: ${po.tenderReference}`,
        bidReference: matchedBid?.referenceNumber,
        deliveryDate: po.expectedDeliveryDate,
        warrantyPeriod: matchedBid?.warrantyPeriod || '12 Months OEM Warranty',
        procurementOfficerName: tender?.createdByName || 'Tenders & Procurement Directorate',
      },
    });
  };

  const openVendorPrintPO = (po: PurchaseOrder) => {
    setPrintDoc({
      type: 'Purchase Order',
      reference: po.referenceNumber,
      title: `Official Executed Purchase Order & Contract: ${po.tenderReference}`,
      date: new Date(po.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      recipientName: currentVendor.businessName,
      recipientAddress: currentVendor.address,
      department: po.departmentName,
      amount: po.totalAmount,
      items: po.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      terms: po.terms,
      metaFields: [
        { label: 'Expected Delivery Date', value: po.expectedDeliveryDate },
        { label: 'Delivery Location', value: po.deliveryLocation },
        { label: 'Status', value: po.status },
        { label: 'Acknowledged', value: po.acknowledgedAt ? `Yes (${new Date(po.acknowledgedAt).toLocaleDateString()})` : 'Pending' },
      ],
    });
  };

  const openPrintBidProposal = (bid: Bid) => {
    const tender = tenders.find((t) => t.id === bid.tenderId || t.referenceNumber === bid.tenderReference);
    setPrintDoc({
      type: 'Bid Proposal',
      reference: bid.referenceNumber,
      title: `Bid Proposal: ${tender?.title || bid.tenderReference}`,
      date: new Date(bid.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      recipientName: currentVendor.businessName,
      recipientAddress: currentVendor.address,
      department: tender?.departmentName,
      amount: bid.totalAmount,
      items: bid.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      notes: bid.technicalProposal ? `Technical Methodology & Scope:\n${bid.technicalProposal}` : undefined,
      terms: `1. Committed delivery milestone: ${bid.proposedDeliveryDate}\n2. Warranty guarantee: ${bid.warrantyPeriod || '12 Months'}\n3. Proposal remains confidential until the closing time and is legally binding under procurement stipulations.`,
      metaFields: [
        { label: 'Tender Reference', value: bid.tenderReference },
        { label: 'Committed Delivery Date', value: bid.proposedDeliveryDate },
        { label: 'Warranty Period', value: bid.warrantyPeriod || '12 Months' },
        { label: 'Bid Status', value: bid.status },
      ],
    });
  };

  const openBidForm = (t: Tender) => {
    const existing = bids.find((b) => b.tenderId === t.id && b.vendorId === currentVendor.id);
    if (existing) {
      setViewingSubmittedBid(existing);
      return;
    }
    setBiddingTender(t);
    setBidItems(
      t.items.map((it) => ({
        itemId: it.id,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: 0,
        totalPrice: 0,
      }))
    );
    // Auto-fill existing uploaded vendor documents
    const docMap: Record<string, string> = {};
    t.mandatoryDocuments.forEach((doc) => {
      const found = currentVendor.documents.find((d) => d.name.toLowerCase().includes(doc.toLowerCase()));
      if (found) docMap[doc] = found.fileName;
    });
    setUploadedDocs(docMap);
    setLegalWarningAck(false);
    setSubmittedBidRef(null);
  };

  const handlePriceChange = (idx: number, unitPrice: number) => {
    const updated = [...bidItems];
    updated[idx].unitPrice = unitPrice;
    updated[idx].totalPrice = unitPrice * updated[idx].quantity;
    setBidItems(updated);
  };

  const toggleDocUpload = (docName: string) => {
    if (uploadedDocs[docName]) {
      const copy = { ...uploadedDocs };
      delete copy[docName];
      setUploadedDocs(copy);
    } else {
      setUploadedDocs({ ...uploadedDocs, [docName]: `${docName.replace(/\s+/g, '_')}_Upload.pdf` });
    }
  };

  const totalBidAmount = bidItems.reduce((acc, it) => acc + it.totalPrice, 0);

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingTender || !legalWarningAck || totalBidAmount <= 0) return;

    let newBid;
    try {
      newBid = submitBid(biddingTender.id, {
      vendorId: currentVendor.id,
      vendorName: currentVendor.businessName,
      items: bidItems,
      proposedDeliveryDate,
      warrantyPeriod,
      technicalProposal,
      uploadedDocuments: uploadedDocs,
      legalWarningAcknowledged: true,
      legalWarningTimestamp: new Date().toISOString(),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Your bid could not be submitted.');
      return;
    }

    setSubmittedBidRef(newBid.referenceNumber);
  };

  const handleConfirmDispatch = () => {
    if (!dispatchingPO || !dispatchNotes.trim()) return;
    dispatchDelivery(dispatchingPO.id, dispatchNotes);
    setDispatchingPO(null);
    setDispatchNotes('');
  };

  return (
    <div className="space-y-6">
      {/* VIEW 1: OPEN TENDERS (Matching categories) */}
      {activeView === 'tenders' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
                Matching Tender Opportunities
              </h2>
              <p className="text-xs text-[#A8B5AB]">
                Filtered for <strong>{currentVendor.businessName}</strong> based on registered categories:{' '}
                <span className="text-[#D4AF37]">{currentVendor.categories.join(', ')}</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#132A20] px-3.5 py-2 rounded-xl text-xs text-[#D4AF37] font-semibold border border-[#1F3A2D]">
              <Scale className="w-4 h-4" /> {matchingOpenTenders.length} Open Tenders
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchingOpenTenders.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-[#A8B5AB] bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] text-xs">
                No open tenders matching your categories right now. You will be notified automatically when new ones open!
              </div>
            ) : (
              matchingOpenTenders.map((t) => {
                const existingBid = bids.find((b) => b.tenderId === t.id && b.vendorId === currentVendor.id);
                const bidsCount = bids.filter((b) => b.tenderId === t.id).length;
                const daysRemaining = Math.max(
                  0,
                  Math.ceil((new Date(t.bidClosingDateTime).getTime() - Date.now()) / (1000 * 3600 * 24))
                );

                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col justify-between space-y-4 hover:border-[#D4AF37]/50 transition-all shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#D4AF37]">{t.referenceNumber}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#132A20] text-[#A8B5AB] border border-[#1F3A2D] text-[10px] font-medium">
                            {t.organizationName || organizations.find((o) => o.id === t.organizationId)?.name || 'Procura Network'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {existingBid && (
                            <span className="px-2 py-0.5 rounded-full bg-[#3FB67A]/20 border border-[#3FB67A]/40 text-[#3FB67A] font-semibold text-[10px] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Bid Submitted
                            </span>
                          )}
                          {/* Countdown chip */}
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E0A93B]/15 border border-[#E0A93B]/30 text-[#E0A93B] font-mono text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Closes in {daysRemaining} days
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-[#F2EFE6] leading-snug">{t.title}</h3>
                      <p className="text-xs text-[#A8B5AB] mt-1.5 line-clamp-2">{t.description}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-[#132A20] p-2.5 rounded-xl text-[#A8B5AB]">
                        <div>
                          <span>Delivery Period:</span>{' '}
                          <strong className="text-[#F2EFE6]">{t.requiredDeliveryPeriodDays} Days</strong>
                        </div>
                        <div>
                          {/* Competitor bid shielding: Vendors see count only! (Section 4 & 6.4) */}
                          <span>Bids Submitted:</span>{' '}
                          <strong className="text-[#D4AF37]">{bidsCount} Bids Received</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1F3A2D] flex items-center justify-between">
                      <span className="text-[11px] text-[#A8B5AB]">{t.deliveryLocation}</span>
                      {(() => {
                        const effStatus = currentVendor ? getVendorEffectiveStatus(currentVendor, t.organizationId) : { status: 'Approved' as const };
                        const isSuspendedForThisOrg = effStatus.status === 'Suspended' || effStatus.status === 'Blacklisted';

                        if (existingBid) {
                          return (
                            <button
                              onClick={() => setViewingSubmittedBid(existingBid)}
                              className="py-2 px-4 rounded-[10px] bg-[#132A20] hover:bg-[#1F3A2D] border border-[#D4AF37]/60 text-[#D4AF37] text-xs font-semibold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Submitted Bid
                            </button>
                          );
                        }

                        if (isSuspendedForThisOrg) {
                          return (
                            <div
                              className="py-1.5 px-3 rounded-[10px] bg-[#D9534F]/20 border border-[#D9534F]/40 text-[#D9534F] text-xs font-semibold flex items-center gap-1.5"
                              title={effStatus.reason || 'Vendor account is suspended by this organization.'}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Suspended by this Org
                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={() => openBidForm(t)}
                            className="py-2 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold hover:brightness-110 flex items-center gap-1.5 shadow active:scale-95 transition-all"
                          >
                            Submit Tender Bid <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MY BIDS (Section 6.4: "Unsuccessful vendors see 'Not selected' with no competitor info") */}
      {activeView === 'bids' && (
        <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-serif-heading text-[#F2EFE6]">My Submitted Bids</h2>
              <p className="text-xs text-[#A8B5AB]">
                Track evaluation progression. Competitor names and competitor pricing remain strictly confidential.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('vendor_tenders')}
              className="text-xs text-[#D4AF37] font-semibold hover:underline"
            >
              Browse Open Tenders →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#132A20] text-[#A8B5AB] uppercase tracking-wider border-b border-[#1F3A2D]">
                <tr>
                  <th className="py-3 px-4">Bid Ref</th>
                  <th className="py-3 px-4">Tender Ref</th>
                  <th className="py-3 px-4 text-right">Quoted Total</th>
                  <th className="py-3 px-4">Committed Delivery Date</th>
                  <th className="py-3 px-4">Warranty</th>
                  <th className="py-3 px-4 text-center">Bid Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3A2D]">
                {vendorBids.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#A8B5AB]">
                      No bids submitted yet.
                    </td>
                  </tr>
                ) : (
                  vendorBids.map((b) => (
                    <tr key={b.id} className="hover:bg-[#132A20]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#E8CF7A]">{b.referenceNumber}</td>
                      <td className="py-3 px-4 font-mono text-[#F2EFE6]">{b.tenderReference}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#F2EFE6]">
                        ₦{b.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-[#A8B5AB]">{b.proposedDeliveryDate}</td>
                      <td className="py-3 px-4 text-[#A8B5AB]">{b.warrantyPeriod}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusChip status={b.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-[#A8B5AB]">
                        {new Date(b.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingSubmittedBid(b)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow active:scale-95"
                          title="View your submitted bid details in read-only mode"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Bid
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: AWARDED CONTRACTS */}
      {activeView === 'contracts' && (
        <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-serif-heading text-[#F2EFE6]">Awarded Contracts</h2>
            <p className="text-xs text-[#A8B5AB]">
              Legally binding procurement contracts won through competitive evaluation. Contracts cannot be altered after execution.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {vendorPOs.length === 0 ? (
              <div className="py-10 text-center text-[#A8B5AB]">No awarded contracts yet.</div>
            ) : (
              vendorPOs.map((po) => (
                <div
                  key={po.id}
                  className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#D4AF37]">{po.referenceNumber}</span>
                      <span className="font-semibold text-sm text-[#F2EFE6]">
                        Tender: {po.tenderReference}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A8B5AB] mt-1">
                      Department: {po.departmentName} · Contract Value: <strong className="text-[#F2EFE6]">₦{po.totalAmount.toLocaleString()}</strong> · Expected Delivery:{' '}
                      <strong className="text-[#E8CF7A]">{po.expectedDeliveryDate}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <StatusChip status={po.status} />
                    <button
                      onClick={() => setViewingContractPO(po)}
                      className="px-3 py-1.5 rounded-lg bg-[#0D1F17] hover:bg-[#1F3A2D] text-[#F2EFE6] border border-[#1F3A2D] text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#A8B5AB]" /> View Contract
                    </button>
                    <button
                      onClick={() => openVendorAwardLetter(po)}
                      className="px-3 py-1.5 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow active:scale-95"
                      title="Inspect, print, or download official formal Letter of Award"
                    >
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" /> Official Award Letter
                    </button>
                    <button
                      onClick={() => openVendorPrintPO(po)}
                      className="px-3 py-1.5 rounded-lg bg-[#1F6F4A] hover:bg-[#14573A] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow active:scale-95"
                      title="Print or Save official Purchase Order & Contract document"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" /> Print / Save PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: DELIVERIES & DISPATCH (Section 6.8: "vendor marks items as Dispatched with date and notes") */}
      {activeView === 'deliveries' && (
        <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-serif-heading text-[#F2EFE6]">
              Consignment Dispatches & Logistics
            </h2>
            <p className="text-xs text-[#A8B5AB]">
              Dispatch shipments to the organization central stores. On-time delivery directly protects your reliability score!
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {vendorPOs.map((po) => (
              <div
                key={po.id}
                className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#D4AF37]">{po.referenceNumber}</span>
                    <span className="font-semibold text-[#F2EFE6]">
                      Due Date: <strong className="text-[#E0A93B]">{po.expectedDeliveryDate}</strong>
                    </span>
                    <StatusChip status={po.status} size="sm" />
                  </div>
                  <div className="text-[11px] text-[#A8B5AB] mt-1">
                    Destination: {po.deliveryLocation} · Amount: ₦{po.totalAmount.toLocaleString()}
                  </div>
                  {po.dispatchedAt && (
                    <div className="text-[11px] text-[#3FB67A] mt-1">
                      Dispatched on {new Date(po.dispatchedAt).toLocaleDateString()}: {po.dispatchNotes}
                    </div>
                  )}
                </div>

                <div>
                  {!po.dispatchedAt && po.status !== 'Closed' && po.status !== 'Delivered' && (
                    <button
                      onClick={() => setDispatchingPO(po)}
                      className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 shadow"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#D4AF37]" /> Mark as Dispatched
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: PAYMENTS */}
      {activeView === 'payments' && (
        <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-serif-heading text-[#F2EFE6]">
              Remittances & Payments Received
            </h2>
            <p className="text-xs text-[#A8B5AB]">
              All disbursements authorized by the Finance Officer with verified payment voucher references.
            </p>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                <tr>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4">Date Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3A2D]">
                {vendorPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#A8B5AB]">
                      No disbursements recorded yet.
                    </td>
                  </tr>
                ) : (
                  vendorPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#132A20]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#E8CF7A]">{p.voucherNumber}</td>
                      <td className="py-3 px-4 font-mono text-[#F2EFE6]">{p.poReference}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#3FB67A]">
                        ₦{p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-[#F2EFE6]">{p.method}</td>
                      <td className="py-3 px-4 font-mono text-[#A8B5AB]">{p.referenceNumber}</td>
                      <td className="py-3 px-4 text-[#A8B5AB]">{p.paymentDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMIT BID MODAL WITH DELIVERY WARNING & ACKNOWLEDGEMENT (Section 6.4) */}
      {biddingTender && (
        <Modal
          isOpen={!!biddingTender}
          onClose={() => setBiddingTender(null)}
          title={`Submit Tender Bid: ${biddingTender.referenceNumber}`}
          subtitle={biddingTender.title}
          maxWidth="max-w-4xl"
        >
          {submittedBidRef ? (
            /* Animated Confirmation Screen with Gold Check (Section 6.4) */
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                <Check className="w-10 h-10 text-[#D4AF37] stroke-[3.5]" />
              </div>
              <h3 className="text-2xl font-bold font-serif-heading text-[#D4AF37]">
                Bid Successfully Submitted!
              </h3>
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#132A20] border border-[#D4AF37]/50 font-mono text-sm text-[#E8CF7A]">
                Reference: {submittedBidRef}
              </div>
              <p className="text-xs text-[#A8B5AB] max-w-md mx-auto leading-relaxed">
                Your proposal is confidential until the closing time. Competing bid amounts and vendor identities remain hidden until the tender closes.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => {
                    setBiddingTender(null);
                    onNavigateTab('vendor_bids');
                  }}
                  className="px-6 py-2.5 rounded-[10px] bg-[#1F6F4A] text-[#F2EFE6] text-xs font-semibold hover:brightness-110"
                >
                  View in My Bids
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitBid} className="space-y-5 text-xs">
              {/* Line Items Pricing */}
              <div>
                <span className="font-bold text-[#F2EFE6] mb-2 block">
                  Quote Unit Prices Per Item (Total Calculates Live):
                </span>
                <div className="space-y-2">
                  {bidItems.map((item, idx) => (
                    <div
                      key={item.itemId}
                      className="p-3 rounded-xl bg-[#132A20] border border-[#1F3A2D] grid grid-cols-12 gap-3 items-center"
                    >
                      <div className="col-span-6">
                        <div className="font-semibold text-[#F2EFE6]">{item.description}</div>
                        <div className="text-[11px] text-[#A8B5AB]">
                          Quantity Required: {item.quantity} {item.unit}
                        </div>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-[#A8B5AB] block mb-0.5">Unit Price (₦)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Unit rate"
                          value={item.unitPrice || ''}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] font-mono text-right"
                        />
                      </div>

                      <div className="col-span-3 text-right">
                        <span className="text-[10px] text-[#A8B5AB] block mb-0.5">Line Total</span>
                        <span className="font-mono font-bold text-[#E8CF7A] text-sm">
                          ₦{item.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="p-3.5 rounded-xl bg-[#07130E] border border-[#1F3A2D] flex items-center justify-between">
                <span className="text-xs text-[#A8B5AB]">Total Aggregate Bid Proposal:</span>
                <span className="text-xl font-bold font-serif-heading text-[#D4AF37]">
                  ₦{totalBidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Delivery Date & DELIVERY WARNING (Section 6.4) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A8B5AB] font-medium mb-1">
                    Committed Delivery Fulfillment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={proposedDeliveryDate}
                    onChange={(e) => setProposedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                  />
                  <div className="mt-2">
                    <label className="block text-[#A8B5AB] font-medium mb-1">Warranty or Validity Period</label>
                    <input
                      type="text"
                      required
                      value={warrantyPeriod}
                      onChange={(e) => setWarrantyPeriod(e.target.value)}
                      placeholder="e.g. 18 Months OEM Warranty"
                      className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Warning Callout directly beside date field (Section 6.4) */}
                <div className="p-3.5 rounded-xl bg-[#D9534F]/10 border-2 border-[#D9534F]/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#D9534F] font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Contractual Delivery Commitment Notice</span>
                    </div>
                    <p className="text-[11px] text-[#F2EFE6]/90 leading-relaxed italic">
                      &quot;If you win this tender and fail to supply by the delivery date you commit to, the company may take legal action against you.&quot;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D9534F]/20 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="legalAck"
                      checked={legalWarningAck}
                      onChange={(e) => setLegalWarningAck(e.target.checked)}
                      className="mt-0.5 rounded accent-[#D9534F]"
                    />
                    <label htmlFor="legalAck" className="text-[11px] font-semibold text-[#F2EFE6] cursor-pointer">
                      I acknowledge and commit legally to this fulfillment schedule (Mandatory).
                    </label>
                  </div>
                </div>
              </div>

              {/* Technical proposal text */}
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Technical Proposal & Methodology</label>
                <textarea
                  rows={3}
                  value={technicalProposal}
                  onChange={(e) => setTechnicalProposal(e.target.value)}
                  placeholder="Summarize your execution approach, manufacturer authorizations, and warranty terms..."
                  className="w-full p-3 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>

              {/* Mandatory Compliance Documents Slots (Section 6.4) */}
              <div>
                <span className="font-bold text-[#F2EFE6] mb-2 block">
                  Mandatory Compliance Verification Documents:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {biddingTender.mandatoryDocuments.map((doc) => {
                    const isAttached = !!uploadedDocs[doc];
                    return (
                      <div
                        key={doc}
                        onClick={() => toggleDocUpload(doc)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                          isAttached
                            ? 'bg-[#1F6F4A]/25 border-[#3FB67A] text-[#3FB67A]'
                            : 'bg-[#132A20] border-[#1F3A2D] text-[#A8B5AB] hover:border-[#D4AF37]'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold block truncate">{doc}</span>
                          <span className="text-[10px] text-[#A8B5AB]">
                            {isAttached ? uploadedDocs[doc] : 'Click to attach slot'}
                          </span>
                        </div>
                        {isAttached ? (
                          <Check className="w-4 h-4 text-[#3FB67A] shrink-0" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#A8B5AB] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Controls: Enabled ONLY when legalWarningAck is ticked! (Section 6.4) */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1F3A2D]">
                <button
                  type="button"
                  onClick={() => setBiddingTender(null)}
                  className="px-4 py-2 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!legalWarningAck || totalBidAmount <= 0}
                  className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110 shadow-lg disabled:opacity-40"
                >
                  Submit Bid Proposal <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* DISPATCH NOTES MODAL */}
      <Modal
        isOpen={!!dispatchingPO}
        onClose={() => setDispatchingPO(null)}
        title="Dispatch Consignment"
        subtitle="Confirm logistical dispatch of materials to the client store."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Dispatch Consignment Notes *</label>
            <textarea
              rows={3}
              required
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="e.g. Dispatched via delivery van with invoice and warranty booklet..."
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setDispatchingPO(null)} className="px-4 py-2 text-[#A8B5AB]">
              Cancel
            </button>
            <button
              onClick={handleConfirmDispatch}
              disabled={!dispatchNotes.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#1F6F4A] text-white font-semibold hover:brightness-110 disabled:opacity-40"
            >
              Confirm Dispatch
            </button>
          </div>
        </div>
      </Modal>

      {/* VIEW SUBMITTED BID MODAL (Single proposal enforcement) */}
      {viewingSubmittedBid && (
        <Modal
          isOpen={!!viewingSubmittedBid}
          onClose={() => setViewingSubmittedBid(null)}
          title={`My Submitted Bid: ${viewingSubmittedBid.referenceNumber}`}
          subtitle={`Tender: ${viewingSubmittedBid.tenderReference} · Status: ${viewingSubmittedBid.status}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-[#3FB67A]/15 border border-[#3FB67A]/30 text-[#3FB67A] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                Proposal submitted and recorded. Vendors may submit only one bid per tender opportunity.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#132A20] p-3.5 rounded-xl border border-[#1F3A2D]">
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Total Quoted Sum:</span>
                <span className="text-base font-bold font-serif-heading text-[#D4AF37]">
                  ₦{viewingSubmittedBid.totalAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Committed Delivery Date:</span>
                <span className="font-semibold text-[#F2EFE6]">{viewingSubmittedBid.proposedDeliveryDate}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Warranty Period:</span>
                <span className="font-semibold text-[#F2EFE6]">{viewingSubmittedBid.warrantyPeriod || '12 Months'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-[#F2EFE6] block mb-2">Priced Bill of Quantities:</span>
              <div className="rounded-xl border border-[#1F3A2D] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F3A2D]">
                    {viewingSubmittedBid.items.map((it, idx) => (
                      <tr key={idx} className="bg-[#0D1F17]">
                        <td className="p-2.5 font-medium text-[#F2EFE6]">{it.description}</td>
                        <td className="p-2.5 text-center font-mono">{it.quantity} {it.unit}</td>
                        <td className="p-2.5 text-right font-mono text-[#A8B5AB]">₦{it.unitPrice.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#F2EFE6]">₦{it.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {viewingSubmittedBid.technicalProposal && (
              <div>
                <span className="font-bold text-[#F2EFE6] block mb-1">Technical Methodology:</span>
                <div className="p-3 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#A8B5AB]">
                  {viewingSubmittedBid.technicalProposal}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => openPrintBidProposal(viewingSubmittedBid)}
                className="px-3.5 py-2 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4AF37]" /> Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setViewingSubmittedBid(null)}
                className="px-5 py-2 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#F2EFE6]"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW CONTRACT & PURCHASE ORDER MODAL (Strictly Read-Only for Vendors) */}
      {viewingContractPO && (
        <Modal
          isOpen={!!viewingContractPO}
          onClose={() => setViewingContractPO(null)}
          title={`Contract Agreement: ${viewingContractPO.referenceNumber}`}
          subtitle={`Tender: ${viewingContractPO.tenderReference} · Status: ${viewingContractPO.status}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header summary banner */}
            <div className="p-3.5 rounded-xl bg-[#14573A]/20 border border-[#14573A] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#A8B5AB] block">Binding Contract Value</span>
                <span className="text-xl font-bold font-serif-heading text-[#D4AF37]">
                  ₦{viewingContractPO.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#A8B5AB] block">Contract Milestone Delivery</span>
                <span className="font-semibold text-[#F2EFE6]">{viewingContractPO.expectedDeliveryDate}</span>
              </div>
            </div>

            {/* Contract particulars */}
            <div className="grid grid-cols-2 gap-3 bg-[#132A20] p-3.5 rounded-xl border border-[#1F3A2D]">
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Procuring Department:</span>
                <span className="font-semibold text-[#F2EFE6]">{viewingContractPO.departmentName}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Delivery Destination:</span>
                <span className="font-semibold text-[#F2EFE6]">{viewingContractPO.deliveryLocation}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Date Issued:</span>
                <span className="font-semibold text-[#F2EFE6]">
                  {new Date(viewingContractPO.issuedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Acknowledgment Status:</span>
                <span className="font-semibold text-[#3FB67A]">
                  {viewingContractPO.acknowledgedAt
                    ? `Acknowledged on ${new Date(viewingContractPO.acknowledgedAt).toLocaleDateString()}`
                    : 'Legally Binding & Active'}
                </span>
              </div>
            </div>

            {/* Scope of Supply Table */}
            <div>
              <span className="font-bold text-[#F2EFE6] block mb-2">Scope of Supply & Priced Bill of Quantities:</span>
              <div className="rounded-xl border border-[#1F3A2D] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Rate</th>
                      <th className="p-2.5 text-right">Total (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F3A2D]">
                    {viewingContractPO.items.map((it, idx) => (
                      <tr key={idx} className="bg-[#0D1F17]">
                        <td className="p-2.5 font-medium text-[#F2EFE6]">{it.description}</td>
                        <td className="p-2.5 text-center font-mono">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#A8B5AB]">
                          ₦{it.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#F2EFE6]">
                          ₦{it.totalPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#132A20] font-bold text-[#D4AF37]">
                      <td colSpan={3} className="p-2.5 text-right uppercase">
                        Contract Total:
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        ₦{viewingContractPO.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Contract terms */}
            {viewingContractPO.terms && (
              <div>
                <span className="font-bold text-[#F2EFE6] block mb-1">Contract Stipulations & Terms:</span>
                <div className="p-3 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#A8B5AB] whitespace-pre-line leading-relaxed">
                  {viewingContractPO.terms}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1F3A2D]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openVendorAwardLetter(viewingContractPO)}
                  className="px-3.5 py-2 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow active:scale-95"
                >
                  <Award className="w-3.5 h-3.5 text-[#D4AF37]" /> Official Award Letter
                </button>
                <button
                  type="button"
                  onClick={() => openVendorPrintPO(viewingContractPO)}
                  className="px-3.5 py-2 rounded-lg bg-[#1F6F4A] hover:bg-[#14573A] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-white" /> Print / Save PDF
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingContractPO(null)}
                className="px-5 py-2 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#F2EFE6]"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINTABLE OFFICIAL DOCUMENT MODAL (Dedicated Document Isolation for Print / Save) */}
      <PrintViewModal
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        doc={printDoc}
      />
    </div>
  );
};
