import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Send,
  Building,
  Award,
  Truck,
  CreditCard,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Play,
  RotateCcw,
  X,
  ExternalLink,
} from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string, itemId?: string) => void;
}

export const ProcurementProcessWalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    currentOrganization,
    currentUser,
    requests,
    tenders,
    bids,
    purchaseOrders,
    payments,
    createRequest,
    approveRequest,
    createTenderFromRequest,
    submitBid,
    switchUser,
    users,
  } = useApp();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [demoRunning, setDemoRunning] = useState<boolean>(false);
  const [demoFeedback, setDemoFeedback] = useState<string | null>(null);

  // Calculate live stats for the current organization
  const orgRequests = requests.filter((r) =>
    r.organizationId ? r.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const orgTenders = tenders.filter((t) =>
    t.organizationId ? t.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const orgPOs = purchaseOrders.filter((p) =>
    p.organizationId ? p.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const orgPayments = payments.filter((p) =>
    p.organizationId ? p.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const steps = [
    {
      number: 1,
      title: 'Requisition Creation',
      tab: 'requests',
      role: 'Request Officer / Department Staff',
      icon: FileText,
      description:
        'A department member identifies needed equipment, materials, or services. They specify items, estimated cost, and department budget verification.',
      statusText: `${orgRequests.length} Requisitions logged`,
      actionLabel: 'Open Requisitions Module',
    },
    {
      number: 2,
      title: 'Department Head Approval',
      tab: 'approvals',
      role: 'Department Head / Approving Authority',
      icon: CheckCircle2,
      description:
        'The Department Head reviews the requisition, business justification, and remaining departmental budget before authorizing the procurement.',
      statusText: `${orgRequests.filter((r) => r.status === 'Approved by Department' || r.status === 'Converted to Tender').length} Approved Requisitions`,
      actionLabel: 'Go to Department Approvals',
    },
    {
      number: 3,
      title: 'Tender / RFQ Publishing',
      tab: 'tenders',
      role: 'Procurement Officer',
      icon: Send,
      description:
        'Procurement transforms approved requisitions into an official Tender with criteria weights (Price 40%, Delivery 20%, Reliability 25%, Technical 15%) and mandatory compliance rules.',
      statusText: `${orgTenders.length} Tenders created`,
      actionLabel: 'Go to Tenders & RFQs',
    },
    {
      number: 4,
      title: 'Sealed Vendor Bidding',
      tab: 'vendor_tenders',
      role: 'Registered Supplier / Contractor',
      icon: Building,
      description:
        'Vendors submit sealed commercial bids, upload mandatory statutory compliance certificates (CAC, Tax Clearance, PenCom), and accept fraud prevention disclosures.',
      statusText: `${bids.length} Total Bids submitted (Sealed)`,
      actionLabel: 'View Vendor Portal Bidding',
    },
    {
      number: 5,
      title: 'Compliance & Smart Contract Award',
      tab: 'evaluation',
      role: 'Procurement Officer / Admin',
      icon: Award,
      description:
        'Stage 1: Verify statutory certificates by clicking "Pass Compliance". Stage 2: The smart algorithm ranks bids and recommends the winning contractor. Awarding automatically issues the Purchase Order.',
      statusText: `${orgTenders.filter((t) => t.status === 'Awarded').length} Awarded Contracts`,
      actionLabel: 'Go to Evaluation & Scoring',
    },
    {
      number: 6,
      title: 'Store Receiving (GRN) & Payment Voucher',
      tab: 'orders',
      role: 'Storekeeper & Finance Officer',
      icon: CreditCard,
      description:
        'Goods are inspected upon arrival, generating an electronic GRN. Finance conducts strict 3-way matching (PR + PO + GRN) with automated 5% WHT and VAT deductions.',
      statusText: `${orgPOs.length} POs · ${orgPayments.length} Payments Settled`,
      actionLabel: 'Go to Purchase Orders & GRN',
    },
  ];

  // Quick 1-click Guided Flow Generator
  const handleLaunchQuickDemoFlow = () => {
    setDemoRunning(true);
    setDemoFeedback('Initializing sample procurement process...');

    try {
      // 1. Create a fresh sample purchase request
      const req = createRequest({
        title: 'Emergency High-Capacity Server Upgrade',
        departmentId: 'dept-works',
        departmentName: 'Operations & Facilities',
        justification: 'Critical hardware upgrade necessary to avoid data bottleneck during quarterly peak.',
        estimatedTotal: 18500000,
        items: [
          {
            id: 'it-' + Date.now(),
            description: 'Dell PowerEdge R750 Enterprise Rack Server',
            quantity: 2,
            unit: 'Units',
            estimatedUnitPrice: 7500000,
            totalPrice: 15000000,
            category: 'IT Hardware & Infrastructure',
            subcategory: 'Servers & Storage',
          },
          {
            id: 'it-2-' + Date.now(),
            description: 'APC Smart-UPS On-Line 6kVA Power Module',
            quantity: 1,
            unit: 'Unit',
            estimatedUnitPrice: 3500000,
            totalPrice: 3500000,
            category: 'IT Hardware & Infrastructure',
            subcategory: 'Power Solutions',
          },
        ],
      });

      // 2. Auto-approve it
      approveRequest(req.id, 'Procurement justified under annual tech infrastructure budget.');

      // 3. Create a tender for it
      const deadline = new Date(Date.now() - 3600000).toISOString(); // Closed ready for evaluation!
      const tnd = createTenderFromRequest(req.id, {
        title: 'Tender: Enterprise Server & Power Infrastructure Supply',
        description: 'Supply, deployment, and manufacturer warranty for 2x Dell Enterprise Rack Servers and APC Smart-UPS.',
        departmentId: 'dept-works',
        departmentName: 'Operations & Facilities',
        categories: ['IT Hardware & Infrastructure', 'Engineering & Construction'],
        bidClosingDateTime: deadline,
        requiredDeliveryPeriodDays: 14,
        deliveryLocation: 'Plot 412 CBD Head Office',
        mandatoryDocuments: ['CAC Certificate', 'Tax Clearance Certificate (TCC)', 'PenCom Compliance Certificate'],
        evaluationWeights: {
          price: 40,
          deliveryTime: 20,
          vendorReliability: 25,
          technicalScore: 15,
        },
      });

      // 4. Submit 2 competing bids
      submitBid(tnd.id, {
        vendorId: 'vendor-1',
        proposedDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        warrantyPeriod: '24 Months',
        technicalProposal: 'OEM Authorized Partner supply with 3-year ProSupport Plus on-site warranty.',
        uploadedDocuments: {
          'CAC Certificate': 'Apex_CAC_Verified.pdf',
          'Tax Clearance Certificate (TCC)': 'Apex_TCC_2025.pdf',
          'PenCom Compliance Certificate': 'Apex_PenCom_Valid.pdf',
        },
        legalWarningAcknowledged: true,
        items: [
          {
            itemId: 'bi-1',
            description: 'Dell PowerEdge R750 Enterprise Rack Server',
            quantity: 2,
            unit: 'Units',
            unitPrice: 7200000,
            totalPrice: 14400000,
          },
          {
            itemId: 'bi-2',
            description: 'APC Smart-UPS On-Line 6kVA Power Module',
            quantity: 1,
            unit: 'Unit',
            unitPrice: 3400000,
            totalPrice: 3400000,
          },
        ],
      });

      submitBid(tnd.id, {
        vendorId: 'vendor-2',
        proposedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        warrantyPeriod: '12 Months',
        technicalProposal: 'Tier-1 Certified Supplier with standard manufacturer warranty.',
        uploadedDocuments: {
          'CAC Certificate': 'Sahara_CAC_Certified.pdf',
          'Tax Clearance Certificate (TCC)': 'Sahara_TCC_2025.pdf',
          'PenCom Compliance Certificate': 'Sahara_PenCom_Current.pdf',
        },
        legalWarningAcknowledged: true,
        items: [
          {
            itemId: 'bi-3',
            description: 'Dell PowerEdge R750 Enterprise Rack Server',
            quantity: 2,
            unit: 'Units',
            unitPrice: 7600000,
            totalPrice: 15200000,
          },
          {
            itemId: 'bi-4',
            description: 'APC Smart-UPS On-Line 6kVA Power Module',
            quantity: 1,
            unit: 'Unit',
            unitPrice: 3200000,
            totalPrice: 3200000,
          },
        ],
      });

      setDemoFeedback('✓ Success! New Tender ready for evaluation. Navigating to Evaluation & Scoring...');
      setTimeout(() => {
        setDemoRunning(false);
        onClose();
        onNavigateTab('evaluation', tnd.id);
      }, 1200);
    } catch (err: any) {
      setDemoFeedback(`Error setting up demo: ${err?.message || 'Check connection'}`);
      setDemoRunning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Procura End-to-End Procurement Lifecycle"
      subtitle={`Comprehensive process overview for ${currentOrganization.name}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Banner with 1-Click Test Flow */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1F6F4A] via-[#132A20] to-[#0D1F17] border-2 border-[#D4AF37] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
                Interactive End-to-End Demonstration
              </h3>
              <p className="text-xs text-[#A8B5AB] mt-0.5 max-w-xl">
                Want to test the full lifecycle immediately? Click the button to automatically generate a requisition, approve it, launch a closed tender with two competing bids, and take you straight to the evaluation stage.
              </p>
            </div>
          </div>

          <button
            onClick={handleLaunchQuickDemoFlow}
            disabled={demoRunning}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F25] hover:brightness-110 text-[#07130E] text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all shrink-0 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{demoRunning ? 'Preparing Demo...' : 'Start Demo Flow'}</span>
          </button>
        </div>

        {demoFeedback && (
          <div className="p-3 rounded-xl bg-[#132A20] border border-[#3FB67A]/50 text-xs text-[#3FB67A] font-semibold text-center animate-in fade-in">
            {demoFeedback}
          </div>
        )}

        {/* 6 Step Interactive Roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCurrent = activeStep === st.number;

            return (
              <div
                key={st.number}
                onClick={() => setActiveStep(st.number)}
                className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-[#132A20] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50'
                    : 'bg-[#0D1F17] border-[#1F3A2D] hover:border-[#1F3A2D]/80 hover:bg-[#132A20]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                      {st.number}
                    </span>
                    <span className="text-[10px] text-[#A8B5AB] font-mono px-2 py-0.5 rounded-full bg-[#07130E] border border-[#1F3A2D]">
                      {st.statusText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="font-bold text-sm text-[#F2EFE6] font-serif-heading">{st.title}</h4>
                  </div>

                  <div className="text-[10px] font-semibold text-[#3FB67A] mb-2">{st.role}</div>

                  <p className="text-[11px] text-[#A8B5AB] leading-relaxed mb-4">{st.description}</p>
                </div>

                <div className="pt-2 border-t border-[#1F3A2D] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onNavigateTab(st.tab);
                    }}
                    className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    <span>{st.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Roles Quick Guide */}
        <div className="p-4 rounded-xl bg-[#0D1F17] border border-[#1F3A2D] text-xs space-y-2">
          <h4 className="font-bold text-[#F2EFE6] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Governance & Separation of Duties
          </h4>
          <p className="text-[11px] text-[#A8B5AB] leading-relaxed">
            In compliance with enterprise standards and Section 1 of the governance specifications, actions require appropriate authorization:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="p-2 rounded-lg bg-[#132A20] border border-[#1F3A2D]">
              <span className="text-[#3FB67A] font-bold block">Request Officer</span>
              <span className="text-[#A8B5AB]">Creates PRs & specs</span>
            </div>
            <div className="p-2 rounded-lg bg-[#132A20] border border-[#1F3A2D]">
              <span className="text-[#D4AF37] font-bold block">Procurement Officer</span>
              <span className="text-[#A8B5AB]">Creates tenders, evaluates & awards</span>
            </div>
            <div className="p-2 rounded-lg bg-[#132A20] border border-[#1F3A2D]">
              <span className="text-[#4F9DBF] font-bold block">Approving Authority</span>
              <span className="text-[#A8B5AB]">Approves above threshold</span>
            </div>
            <div className="p-2 rounded-lg bg-[#132A20] border border-[#1F3A2D]">
              <span className="text-[#E0A93B] font-bold block">Finance Officer</span>
              <span className="text-[#A8B5AB]">Verifies GRN & pays voucher</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] text-[#F2EFE6] text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </Modal>
  );
};
