import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle,
  XCircle,
  Award,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Sliders,
  DollarSign,
  Clock,
  Star,
  ShieldAlert,
  ArrowRight,
  Printer,
  Sparkles,
  Loader2,
  Truck,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { PrintViewModal, DocumentData } from '../common/PrintViewModal';
import { Tender, Bid } from '../../types';

interface EvaluationModuleProps {
  initialTenderId?: string;
  onNavigateToPO?: (poId: string) => void;
}

export const EvaluationModule: React.FC<EvaluationModuleProps> = ({
  initialTenderId,
  onNavigateToPO,
}) => {
  const {
    tenders,
    bids,
    vendors,
    departments,
    purchaseOrders,
    currentUser,
    evaluateCompliance,
    evaluateTechnical,
    calculateVendorRecommendations,
    awardTender,
    overrideBudgetAndAward,
    authorityApproveAward,
    settings,
    setCelebrationOpen,
    currentOrganization,
  } = useApp();

  // Allow Procurement Officer, Organization Admin, and Approving Authority to evaluate and award contracts
  // (The Approving Authority only signs off high-value awards in its own screen - separation of duties)
  const canAwardContract =
    currentUser?.role === 'Procurement Officer' || currentUser?.role === 'Organization Admin';

  // Closed tenders ready for evaluation or currently under evaluation for this organization
  const evaluatableTenders = tenders.filter(
    (t) =>
      (t.status === 'Closed' || t.status === 'Under Evaluation' || t.status === 'Awarded') &&
      (t.organizationId ? t.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald')
  );

  const [selectedTenderId, setSelectedTenderId] = useState<string>(
    initialTenderId || evaluatableTenders[0]?.id || ''
  );

  const currentTender = tenders.find((t) => t.id === selectedTenderId) || evaluatableTenders[0];
  const tenderBids = bids.filter((b) => b.tenderId === currentTender?.id);

  // Selected bid for award override justification
  const [selectedWinnerBidId, setSelectedWinnerBidId] = useState<string>('');
  const [justificationModalOpen, setJustificationModalOpen] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);

  // Finance Budget Override modal
  const [budgetOverrideModalOpen, setBudgetOverrideModalOpen] = useState(false);
  const [budgetOverrideReason, setBudgetOverrideReason] = useState('');

  // Printable Award Letter state
  const [awardLetterDoc, setAwardLetterDoc] = useState<DocumentData | null>(null);

  // Technical score inputs per bid
  const [techScores, setTechScores] = useState<Record<string, number>>({});
  const [techComments, setTechComments] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Recalculate recommendation scores when selected tender changes
  useEffect(() => {
    if (currentTender?.id) {
      calculateVendorRecommendations(currentTender.id);
    }
  }, [currentTender?.id]);

  const handlePassCompliance = (bidId: string, vendorName: string, ref: string) => {
    evaluateCompliance(bidId, true);
    if (currentTender) {
      calculateVendorRecommendations(currentTender.id);
    }
    setToastMessage(`✓ Compliance Approved: ${vendorName} (${ref}) has passed statutory compliance! Stage 2 scoring and recommendation unlocked.`);
    setTimeout(() => {
      document.getElementById('stage2-scoring')?.scrollIntoView({ behavior: 'smooth' });
    }, 250);
  };

  const handleDisqualify = (bidId: string, vendorName: string, ref: string) => {
    evaluateCompliance(bidId, false, 'Failed mandatory statutory criteria');
    if (currentTender) {
      calculateVendorRecommendations(currentTender.id);
    }
    setToastMessage(`⚠ Disqualified: ${vendorName} (${ref}) has been disqualified due to missing mandatory statutory documents.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Find ranked compliant bids
  const compliantBids = tenderBids.filter((b) => b.compliancePassed !== false);
  const recommendedBid = compliantBids.reduce<Bid | null>((best, curr) => {
    if (!curr.computedScores) return best;
    if (!best || !best.computedScores) return curr;
    return curr.computedScores.totalWeightedScore > best.computedScores.totalWeightedScore ? curr : best;
  }, null);

  const isAlreadyAwarded = currentTender?.status === 'Awarded' || !!currentTender?.awardedBidId;
  const awardedBid = bids.find((b) => b.id === currentTender?.awardedBidId || (isAlreadyAwarded && b.status === 'Awarded')) || recommendedBid;
  const associatedPO = purchaseOrders.find((po) => po.tenderId === currentTender?.id);

  // Department remaining budget check
  const dept = departments.find((d) => d.id === currentTender?.departmentId);
  const deptRemainingBudget = dept ? Math.max(0, dept.annualBudget - dept.spent - dept.committed) : 0;

  // Handle Award Click
  const handleAwardBid = (bid: Bid) => {
    if (!canAwardContract) return;
    if (isAlreadyAwarded || isAwarding || currentTender?.awaitingAuthorityApproval) return;

    if (bid.totalAmount > deptRemainingBudget) {
      // Blocked by budget cap! Trigger Finance Override flow (Section 6.6)
      setSelectedWinnerBidId(bid.id);
      setBudgetOverrideModalOpen(true);
      return;
    }

    if (recommendedBid && bid.id !== recommendedBid.id) {
      // Overriding recommended vendor! Justification required (Section 6.5)
      setSelectedWinnerBidId(bid.id);
      setJustificationModalOpen(true);
      return;
    }

    executeAward(bid.id, 'Standard award to ranked top recommended supplier.');
  };

  const executeAward = (bidId: string, justification?: string, budgetOverride?: string) => {
    setIsAwarding(true);
    const winBid = bids.find((b) => b.id === bidId);

    setTimeout(() => {
      const result = budgetOverride
        ? overrideBudgetAndAward(currentTender.id, bidId, budgetOverride)
        : awardTender(currentTender.id, bidId, justification);
      setIsAwarding(false);
      if (result.blocked) {
        setToastMessage('\u26a0 ' + result.blocked);
        setTimeout(() => setToastMessage(null), 7000);
        return;
      }
      if (result.requiresAuthority) {
        setToastMessage('\u2713 Sent to the Approving Authority for sign-off. The Purchase Order and Award Letter are issued once it is approved.');
        setTimeout(() => setToastMessage(null), 9000);
        return;
      }
      setCelebrationOpen(true);

      // Awarded! Generate and show formal Award Letter (Section 6.6)
      const awardedVendor = vendors.find((v) => v.id === winBid?.vendorId);
      setAwardLetterDoc({
        type: 'Award Letter',
        reference: `AL-${currentTender.referenceNumber}`,
        title: currentTender.title,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        recipientName: winBid?.vendorName || 'Awarded Vendor',
        recipientAddress: awardedVendor?.address || 'Victoria Island, Lagos / Abuja FCT, Nigeria',
        recipientAttention: awardedVendor?.contactPerson || 'Managing Director / Corporate Contracts Representative',
        department: currentTender.departmentName,
        amount: winBid?.totalAmount,
        items: winBid?.items && winBid.items.length > 0
          ? winBid.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unit: it.unit,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
            }))
          : currentTender.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unit: it.unit,
              unitPrice: (winBid?.totalAmount || 0) / (currentTender.items.length || 1),
              totalPrice: (winBid?.totalAmount || 0) / (currentTender.items.length || 1),
            })),
        awardDetails: {
          tenderReference: currentTender.referenceNumber,
          tenderTitle: currentTender.title,
          bidReference: winBid?.referenceNumber,
          deliveryDate: winBid?.proposedDeliveryDate || currentTender.bidClosingDateTime,
          warrantyPeriod: winBid?.warrantyPeriod || '12 Months Comprehensive OEM Warranty',
          procurementOfficerName: currentTender.createdByName || currentUser?.fullName,
        },
      });
    }, 250);
  };

  const handleConfirmOverrideAward = () => {
    if (!overrideJustification.trim() || !selectedWinnerBidId) return;
    executeAward(selectedWinnerBidId, overrideJustification);
    setJustificationModalOpen(false);
    setOverrideJustification('');
  };

  const handleConfirmBudgetOverride = () => {
    if (!budgetOverrideReason.trim() || !selectedWinnerBidId) return;
    executeAward(selectedWinnerBidId, `Budget override: ${budgetOverrideReason}`, budgetOverrideReason);
    setBudgetOverrideModalOpen(false);
    setBudgetOverrideReason('');
  };

  if (!currentTender) {
    return (
      <div className="p-12 text-center text-[#A8B5AB] bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] text-xs">
        No tenders currently closed and awaiting evaluation. When a tender reaches its closing countdown, it unlocks here automatically.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tender Selector Header */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
            Stage 5: Bid Evaluation & Smart Recommendation
          </span>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6] mt-0.5">
            {currentTender.referenceNumber}: {currentTender.title}
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Bids revealed: {tenderBids.length} sealed submissions. Weights: Price {currentTender.evaluationWeights.price}% · Delivery {currentTender.evaluationWeights.deliveryTime}% · Reliability {currentTender.evaluationWeights.vendorReliability}% · Tech {currentTender.evaluationWeights.technicalScore}%.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currentTender.id}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none"
          >
            {evaluatableTenders.map((t) => (
              <option key={t.id} value={t.id}>
                {t.referenceNumber} ({t.status})
              </option>
            ))}
          </select>

          <StatusChip status={currentTender.status} />
        </div>
      </div>

      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#132A20] border-2 border-[#3FB67A] text-[#F2EFE6] text-xs font-semibold shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#3FB67A]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[#A8B5AB] hover:text-white">✕</button>
        </div>
      )}

      {/* STAGE 1: COMPLIANCE CHECK (Pass/Fail) (Section 6.5) */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#D4AF37]" /> Stage 1: Statutory Compliance Verification
            </h3>
            <p className="text-[11px] text-[#A8B5AB] mt-0.5">
              Verify each bidder&apos;s mandatory statutory certificates. Passing compliance unlocks Stage 2 Technical & Commercial Scoring.
            </p>
          </div>
          <div className="text-xs text-[#A8B5AB]">
            <span className="text-[#3FB67A] font-bold">{compliantBids.length}</span> of {tenderBids.length} bids qualified
          </div>
        </div>

        <div className="space-y-3">
          {tenderBids.map((b) => {
            const isDisqualified = b.compliancePassed === false;
            const isPassed = b.compliancePassed === true;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                  isDisqualified
                    ? 'bg-[#D9534F]/10 border-[#D9534F]/40'
                    : isPassed
                    ? 'bg-[#1F6F4A]/15 border-[#3FB67A]/60 shadow-md'
                    : 'bg-[#132A20] border-[#1F3A2D]'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#D4AF37]">{b.referenceNumber}</span>
                    <span className="font-bold text-[#F2EFE6]">{b.vendorName}</span>
                    <span className="text-[#A8B5AB]">· ₦{b.totalAmount.toLocaleString()}</span>
                    {isPassed ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#3FB67A]/25 text-[#3FB67A] text-[10px] font-bold flex items-center gap-1 border border-[#3FB67A]/40">
                        <CheckCircle className="w-3 h-3" /> Compliance Verified
                      </span>
                    ) : isDisqualified ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#D9534F]/25 text-[#D9534F] text-[10px] font-bold flex items-center gap-1 border border-[#D9534F]/40">
                        <XCircle className="w-3 h-3" /> Disqualified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#E0A93B]/20 text-[#E0A93B] text-[10px] font-medium flex items-center gap-1 border border-[#E0A93B]/30">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#A8B5AB] mt-2 flex flex-wrap gap-2.5">
                    {currentTender.mandatoryDocuments.map((doc) => {
                      const present = !!b.uploadedDocuments[doc];
                      return (
                        <span
                          key={doc}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded bg-[#07130E] border ${
                            present ? 'text-[#3FB67A] border-[#3FB67A]/30' : 'text-[#D9534F] border-[#D9534F]/30'
                          }`}
                        >
                          {present ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {doc}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1F3A2D]">
                  <button
                    onClick={() => handlePassCompliance(b.id, b.vendorName, b.referenceNumber)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow active:scale-95 ${
                      isPassed
                        ? 'bg-[#3FB67A] text-[#07130E] ring-2 ring-[#3FB67A]/40'
                        : 'bg-[#132A20] hover:bg-[#1F6F4A]/40 text-[#3FB67A] border border-[#3FB67A]/50'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isPassed ? '✓ Passed Compliance' : 'Pass Compliance'}</span>
                  </button>
                  <button
                    onClick={() => handleDisqualify(b.id, b.vendorName, b.referenceNumber)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                      isDisqualified
                        ? 'bg-[#D9534F] text-white ring-2 ring-[#D9534F]/40'
                        : 'bg-[#132A20] hover:bg-[#D9534F]/30 text-[#A8B5AB] hover:text-[#D9534F] border border-[#1F3A2D]'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Disqualify</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guidance transition to Stage 2 */}
        {compliantBids.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-[#132A20] border border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <div>
                <span className="font-bold text-[#F2EFE6] block">
                  Stage 1 Completed: {compliantBids.length} Qualified Bidders Ranked
                </span>
                <span className="text-[11px] text-[#A8B5AB]">
                  Proceed down to Stage 2 to review the algorithm ranking and award the winning contractor.
                </span>
              </div>
            </div>
            <a
              href="#stage2-scoring"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 shrink-0 shadow"
            >
              <span>Scroll to Award Selection</span>
              <span>↓</span>
            </a>
          </div>
        )}
      </div>

      {/* STAGE 2: SMART VENDOR RECOMMENDATION & COMPARISON TABLE (Section 6.5) */}
      <div id="stage2-scoring" className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#D4AF37]" /> Stage 2: Technical & Commercial Weighted Scoring
          </h3>
          <p className="text-[11px] text-[#A8B5AB] mt-0.5">
            Objective algorithm combining quoted price (40%), proposed delivery turnaround (20%), past vendor reliability (25%), and technical score (15%).
          </p>
        </div>

        {/* HIGHLIGHTED CARD: AWARDED BANNER OR SMART RECOMMENDATION */}
        {isAlreadyAwarded ? (
          <div className="p-5 rounded-2xl bg-[#1F6F4A]/20 border-2 border-[#3FB67A] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3FB67A]/25 border border-[#3FB67A] flex items-center justify-center text-[#3FB67A] shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#3FB67A] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Contract Officially Awarded
                </div>
                <h4 className="text-lg font-bold font-serif-heading text-[#F2EFE6] mt-0.5">
                  Awarded Supplier: <span className="text-[#D4AF37]">{awardedBid?.vendorName}</span>
                </h4>
                <p className="text-xs text-[#A8B5AB] mt-0.5">
                  Contract Amount: <strong>₦{(awardedBid?.totalAmount || 0).toLocaleString()}</strong>
                  {associatedPO ? ` · Purchase Order Ref: ${associatedPO.referenceNumber}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (awardedBid) {
                    const awardedVendor = vendors.find((v) => v.id === awardedBid.vendorId);
                    setAwardLetterDoc({
                      type: 'Award Letter',
                      reference: `AL-${currentTender.referenceNumber}`,
                      title: currentTender.title,
                      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
                      recipientName: awardedBid.vendorName,
                      recipientAddress: awardedVendor?.address || 'Victoria Island, Lagos / Abuja FCT, Nigeria',
                      recipientAttention: awardedVendor?.contactPerson || 'Managing Director / Corporate Contracts Representative',
                      department: currentTender.departmentName,
                      amount: awardedBid.totalAmount,
                      items: awardedBid.items && awardedBid.items.length > 0
                        ? awardedBid.items.map((it) => ({
                            description: it.description,
                            quantity: it.quantity,
                            unit: it.unit,
                            unitPrice: it.unitPrice,
                            totalPrice: it.totalPrice,
                          }))
                        : currentTender.items.map((it) => ({
                            description: it.description,
                            quantity: it.quantity,
                            unit: it.unit,
                            unitPrice: (awardedBid.totalAmount || 0) / (currentTender.items.length || 1),
                            totalPrice: (awardedBid.totalAmount || 0) / (currentTender.items.length || 1),
                          })),
                      awardDetails: {
                        tenderReference: currentTender.referenceNumber,
                        tenderTitle: currentTender.title,
                        bidReference: awardedBid.referenceNumber,
                        deliveryDate: awardedBid.proposedDeliveryDate || currentTender.bidClosingDateTime,
                        warrantyPeriod: awardedBid.warrantyPeriod || '12 Months Comprehensive OEM Warranty',
                        procurementOfficerName: currentTender.createdByName || currentUser?.fullName,
                      },
                    });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
              >
                <Printer className="w-3.5 h-3.5" /> View Award Letter
              </button>
              {associatedPO && (
                <button
                  onClick={() => onNavigateToPO?.(associatedPO.id)}
                  className="px-4 py-2 rounded-xl bg-[#1F6F4A] hover:bg-[#14573A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                >
                  <Truck className="w-3.5 h-3.5" /> View PO
                </button>
              )}
            </div>
          </div>
        ) : recommendedBid ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1F6F4A]/40 via-[#132A20] to-[#0D1F17] border-2 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Procura Smart Algorithm Recommendation
              </div>
              <h4 className="text-xl font-bold font-serif-heading text-[#F2EFE6] mt-1">
                Recommended: <span className="text-[#D4AF37]">{recommendedBid.vendorName}</span>
              </h4>
              <p className="text-xs text-[#A8B5AB] mt-1 max-w-2xl leading-relaxed">
                Ranked #1 with a total weighted score of{' '}
                <strong className="text-[#D4AF37]">{recommendedBid.computedScores?.totalWeightedScore} / 100</strong>.
                Competitively priced at ₦{recommendedBid.totalAmount.toLocaleString()} with excellent reliability history and proven track record.
              </p>
            </div>

            {canAwardContract ? (
              <button
                onClick={() => handleAwardBid(recommendedBid)}
                disabled={isAwarding}
                className="py-2.5 px-6 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] text-xs font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg shrink-0 active:scale-95 transition-all disabled:opacity-50"
              >
                {isAwarding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" /> Awarding Contract...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-[#D4AF37]" /> Proceed to Award Winner
                  </>
                )}
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-[11px] text-[#A8B5AB] shrink-0 text-right">
                <span className="text-[#D4AF37] font-semibold block">Overall Governance View</span>
                Contract awarding is authorized for Admin & Procurement
              </div>
            )}
          </div>
        ) : null}

        {/* COMPARISON TABLE OF ALL COMPLIANT BIDS (Section 6.5) */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
              <tr>
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3">Bidder Name</th>
                <th className="py-3 px-3 text-right">Quoted Price (40%)</th>
                <th className="py-3 px-3 text-center">Delivery Date (20%)</th>
                <th className="py-3 px-3 text-center">Reliability (25%)</th>
                <th className="py-3 px-3 text-center">Tech Score (15%)</th>
                <th className="py-3 px-3 text-right">Total Score</th>
                <th className="py-3 px-3 text-center">Risk Flags</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {compliantBids.map((b) => {
                const vendor = vendors.find((v) => v.id === b.vendorId);
                const hasLateRecord = vendor && vendor.lateDeliveries > 0;
                const isUnderquoting = b.totalAmount < 6000000; // possible under-quote flag

                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-[#132A20]/80 transition-colors ${
                      b.computedScores?.rank === 1 ? 'bg-[#D4AF37]/5 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-sm">
                      {b.computedScores?.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#07130E] inline-flex items-center justify-center font-bold">
                          1
                        </span>
                      ) : (
                        b.computedScores?.rank || '-'
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#F2EFE6]">{b.vendorName}</div>
                      <div className="text-[11px] text-[#A8B5AB] font-mono">{b.referenceNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#F2EFE6]">
                      <div>₦{b.totalAmount.toLocaleString()}</div>
                      <div className="text-[10px] text-[#D4AF37] font-normal">
                        Score: {b.computedScores?.priceScore || 0}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="text-[#F2EFE6]">{b.proposedDeliveryDate}</div>
                      <div className="text-[10px] text-[#A8B5AB]">
                        Score: {b.computedScores?.deliveryScore || 0}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="text-[#F2EFE6]">{vendor?.reliabilityScore || 60}%</div>
                      <div className="text-[10px] text-[#A8B5AB]">
                        {vendor ? `${vendor.onTimeDeliveries} on-time` : 'New Vendor (60)'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={b.technicalScore !== undefined ? b.technicalScore : 75}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          evaluateTechnical(b.id, val, 'Scored during review session');
                        }}
                        className="w-14 px-1.5 py-1 rounded bg-[#07130E] border border-[#1F3A2D] text-center font-mono text-[#F2EFE6] text-xs"
                      />
                    </td>
                    <td className="py-3 px-3 text-right font-serif-heading font-bold text-base text-[#D4AF37]">
                      {b.computedScores?.totalWeightedScore || '-'}
                    </td>
                    {/* RISK FLAGS (Section 6.5) */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {hasLateRecord && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/30"
                            title="Vendor has late delivery history"
                          >
                            Late History
                          </span>
                        )}
                        {isUnderquoting && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#E0A93B]/20 text-[#E0A93B] border border-[#E0A93B]/30"
                            title="Quoted significantly below median"
                          >
                            Low Quoting
                          </span>
                        )}
                        {!hasLateRecord && !isUnderquoting && (
                          <span className="text-[#3FB67A] text-[10px]">Low Risk</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isAlreadyAwarded ? (
                        b.id === awardedBid?.id || b.status === 'Awarded' ? (
                          <span className="px-2.5 py-1 rounded-md bg-[#3FB67A]/20 text-[#3FB67A] font-bold text-xs border border-[#3FB67A]/40 inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Awarded Winner
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#A8B5AB]">Not Selected</span>
                        )
                      ) : canAwardContract ? (
                        <button
                          onClick={() => handleAwardBid(b)}
                          disabled={isAwarding}
                          className="px-3 py-1.5 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] font-semibold text-xs border border-[#D4AF37]/40 active:scale-95 disabled:opacity-50"
                        >
                          Select
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#A8B5AB]">Review Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERRIDE JUSTIFICATION MODAL (Section 6.5: "officer must type a justification saved in audit log") */}
      <Modal
        isOpen={justificationModalOpen}
        onClose={() => setJustificationModalOpen(false)}
        title="Selection Override Justification"
        subtitle="You are selecting a supplier different from the top algorithmically ranked recommendation."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#E0A93B]/10 border border-[#E0A93B]/30 text-[#E0A93B]">
            <span className="font-bold block mb-1">Audit Trail Requirement:</span>
            Governance rules mandate an explicit commercial rationale whenever departing from the top ranked recommendation.
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Commercial Justification *</label>
            <textarea
              rows={4}
              required
              value={overrideJustification}
              onChange={(e) => setOverrideJustification(e.target.value)}
              placeholder="e.g. Selected vendor possesses exclusive manufacturer dealership warranty and local warehouse spare parts..."
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setJustificationModalOpen(false)} className="px-4 py-2 text-[#A8B5AB]">
              Cancel
            </button>
            <button
              onClick={handleConfirmOverrideAward}
              disabled={!overrideJustification.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#E0A93B] text-[#07130E] font-semibold hover:brightness-110 disabled:opacity-40"
            >
              Confirm Justified Award
            </button>
          </div>
        </div>
      </Modal>

      {/* BUDGET ENFORCEMENT & FINANCE OVERRIDE MODAL (Section 6.6) */}
      <Modal
        isOpen={budgetOverrideModalOpen}
        onClose={() => setBudgetOverrideModalOpen(false)}
        title="Department Budget Cap Exceeded"
        subtitle="Award is blocked until Finance Officer authorizes a budget override."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#D9534F]/15 border border-[#D9534F]/40 text-[#D9534F]">
            <span className="font-bold block mb-1">Budget Enforcement Block:</span>
            The bid amount exceeds the department&apos;s remaining budget of ₦{deptRemainingBudget.toLocaleString()}.
            An approved Finance override is required to finalize this commitment.
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Finance Override Authorization Reason *</label>
            <textarea
              rows={3}
              required
              value={budgetOverrideReason}
              onChange={(e) => setBudgetOverrideReason(e.target.value)}
              placeholder="e.g. Budget variance approved via virement from general capital reserves..."
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setBudgetOverrideModalOpen(false)} className="px-4 py-2 text-[#A8B5AB]">
              Cancel
            </button>
            <button
              onClick={handleConfirmBudgetOverride}
              disabled={!budgetOverrideReason.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#1F6F4A] text-white font-semibold hover:brightness-110 disabled:opacity-40"
            >
              Authorize & Award Contract
            </button>
          </div>
        </div>
      </Modal>

      {/* PRINTABLE AWARD LETTER MODAL (Section 6.6) */}
      <PrintViewModal
        isOpen={!!awardLetterDoc}
        onClose={() => setAwardLetterDoc(null)}
        doc={awardLetterDoc}
      />
    </div>
  );
};
