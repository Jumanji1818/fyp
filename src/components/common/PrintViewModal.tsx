import React, { useState } from 'react';
import { Printer, X, FileText, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { nairaAmountToWords } from '../../utils/numberToWords';

export interface DocumentData {
  type: 'Award Letter' | 'Purchase Order' | 'Payment Voucher' | 'Procurement Report' | 'Bid Proposal';
  reference: string;
  title: string;
  date: string;
  recipientName: string;
  recipientAddress?: string;
  recipientAttention?: string;
  amount?: number;
  department?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  terms?: string;
  notes?: string;
  paymentMethod?: string;
  metaFields?: Array<{ label: string; value: string }>;
  // Specialized rich fields for formal Award Letter
  awardDetails?: {
    tenderReference: string;
    tenderTitle: string;
    bidReference?: string;
    deliveryDate?: string;
    warrantyPeriod?: string;
    contractDuration?: string;
    approvingAuthorityName?: string;
    procurementOfficerName?: string;
    financeOfficerName?: string;
    specialConditions?: string[];
  };
}

interface PrintViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentData | null;
}

export const PrintViewModal: React.FC<PrintViewModalProps> = ({ isOpen, onClose, doc }) => {
  const { settings, currentOrganization, users } = useApp();
  const [busy, setBusy] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  if (!isOpen || !doc) return null;

  // One action: save the document as a PDF (desktop) or open the print dialog (browser).
  const handlePrint = async () => {
    const src = document.getElementById('printable-official-document');
    if (!src || busy) return;
    setBusy(true);
    let root = document.getElementById('print-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'print-root';
      document.body.appendChild(root);
    }
    root.innerHTML = src.innerHTML;
    document.body.classList.add('printing-doc');
    try {
      const api = (window as any).procuraDesktop;
      const fileName = `PROCURA_${doc.type.replace(/\s+/g, '_')}_${doc.reference}.pdf`;
      if (api?.savePdf) {
        const res = await api.savePdf(fileName);
        if (res?.error) alert('Could not create the PDF: ' + res.error);
        else if (res?.path) { setSavedPath(res.path); setTimeout(() => setSavedPath(null), 5000); }
      } else {
        window.print();
      }
    } finally {
      document.body.classList.remove('printing-doc');
      if (root) root.innerHTML = '';
      setBusy(false);
    }
  };

  const amountInWords = doc.amount !== undefined ? nairaAmountToWords(doc.amount) : '';

  // Signatories come from the organisation's real staff (falls back to a blank signature line)
  const staffName = (role: string) =>
    users.find((u) => u.role === role && u.status === 'Active' && (u.organizationId ? u.organizationId === currentOrganization.id : true))?.fullName;
  const isSoleOrg = currentOrganization.type === 'sole_proprietorship';
  const ownerName = staffName('Organization Admin') || '____________________';
  const procOfficer = doc.awardDetails?.procurementOfficerName || (isSoleOrg ? ownerName : staffName('Procurement Officer')) || '____________________';
  const finOfficer = doc.awardDetails?.financeOfficerName || (isSoleOrg ? `${ownerName} (Head of Operations)` : staffName('Finance Officer')) || '____________________';
  const authOfficer = doc.awardDetails?.approvingAuthorityName || (isSoleOrg ? `${ownerName} (Managing Director)` : staffName('Approving Authority')) || '____________________';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07130E]/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-[#0D1F17] border border-[#1F3A2D] rounded-[20px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none print:overflow-visible">
        {/* Modal Controls Bar (Hidden during printing) */}
        <div className="px-6 py-3.5 border-b border-[#1F3A2D] flex items-center justify-between bg-[#132A20] text-xs print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold text-[#F2EFE6]">
              {doc.type}: {doc.reference}
            </span>
            <span className="text-[#A8B5AB]">· Green & Gold Official Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            {savedPath && (
              <span className="text-[#3FB67A] font-medium flex items-center gap-1 mr-2">
                <Check className="w-3.5 h-3.5" /> PDF saved
              </span>
            )}
            <button
              onClick={handlePrint}
              disabled={busy}
              title="Save this document as a PDF (you can print it from there)"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/60 text-[#F2EFE6] font-medium hover:brightness-110 transition-all text-xs active:scale-95 shadow disabled:opacity-60"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              {busy ? 'Preparing...' : 'Print / Save PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A8B5AB] hover:text-[#F2EFE6] hover:bg-[#1F3A2D] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Page Body (Targeted with id="printable-official-document") */}
        <div
          id="printable-official-document"
          className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white text-[#12241B] font-sans selection:bg-[#D4AF37]/20 print:p-0 print:m-0 print:text-black print:overflow-visible"
        >
          {/* ============================================================== */}
          {/* CASE A: FORMAL CONTRACT AWARD LETTER (Detailed Legal Letter)   */}
          {/* ============================================================== */}
          {doc.type === 'Award Letter' ? (
            <div>
              {/* Formal Letterhead */}
              <div className="border-b-2 border-[#14573A] pb-5 mb-6 letterhead">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#14573A] border border-[#B8941F] flex items-center justify-center text-[#B8941F] shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.2 14.5l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black font-serif-heading text-[#14573A] tracking-wider leading-none">
                          {currentOrganization.name.toUpperCase()}
                        </h1>
                        <p className="text-[11px] font-semibold tracking-widest text-[#B8941F] uppercase mt-0.5">
                          Tenders Board & Procurement Directorate
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#5B6B61] max-w-lg mt-1">
                      {currentOrganization.address || settings.address || 'Headquarters, Abuja FCT, Nigeria'}
                    </p>
                    <p className="text-xs text-[#5B6B61]">
                      Tel: {currentOrganization.phone || settings.phone || '+234 9 291 4400'} | Email:{' '}
                      {currentOrganization.email || settings.email || 'procurement@procura.ng'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="inline-block bg-[#0B3A27] text-[#D4AF37] px-3.5 py-1.5 rounded-lg font-serif-heading font-bold text-xs tracking-widest uppercase border border-[#B8941F] badge">
                      OFFICIAL AWARD NOTIFICATION
                    </div>
                    <div className="text-xs text-[#5B6B61] mt-2 font-mono font-semibold">
                      Letter Ref: <span className="text-[#14573A] font-bold">{doc.reference}</span>
                    </div>
                    <div className="text-xs text-[#5B6B61]">Date: {doc.date}</div>
                  </div>
                </div>
              </div>

              {/* Reference & Addressee */}
              <div className="mb-6 text-xs text-[#12241B]">
                <div className="font-semibold text-[#5B6B61] mb-1 uppercase tracking-wider text-[10px]">TO / CONTRACTOR:</div>
                <div className="font-bold text-sm text-[#14573A] font-serif-heading">{doc.recipientName}</div>
                <div className="text-[#5B6B61]">{doc.recipientAddress || 'Federal Republic of Nigeria'}</div>
                <div className="text-[#5B6B61] italic mt-0.5">
                  Attention: {doc.recipientAttention || 'Managing Director / Corporate Contracts Representative'}
                </div>
              </div>

              {/* Salutation */}
              <div className="text-sm font-semibold text-[#12241B] mb-3">Dear Sir / Madam,</div>

              {/* Letter Subject */}
              <div className="mb-5 p-3 rounded-xl bg-[#FBF9F2] border-l-4 border-[#14573A] border-y border-r border-[#E2DCC8]">
                <div className="text-sm font-bold uppercase tracking-wide font-serif-heading text-[#14573A]">
                  LETTER OF CONTRACT AWARD: {doc.title.toUpperCase()}
                </div>
                <div className="text-xs text-[#5B6B61] mt-1 flex flex-wrap gap-x-4">
                  <span>
                    Tender Ref: <strong className="text-[#14573A]">{doc.awardDetails?.tenderReference || doc.reference}</strong>
                  </span>
                  {doc.awardDetails?.bidReference && (
                    <span>
                      Bid Ref: <strong className="text-[#14573A]">{doc.awardDetails.bidReference}</strong>
                    </span>
                  )}
                  {doc.department && (
                    <span>
                      Procuring Unit: <strong className="text-[#14573A]">{doc.department}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Letter Body Paragraphs */}
              <div className="space-y-3.5 text-xs text-[#2A3B31] leading-relaxed text-justify letter-body">
                <p>
                  <strong>1. NOTIFICATION OF CONTRACT AWARD:</strong> Following the comprehensive evaluation and scoring of bids submitted in respect of the competitive procurement for <em>"{doc.title}"</em>, we are pleased to convey the approval of the Tenders & Procurement Board awarding the subject contract to your esteemed organization, <strong>{doc.recipientName}</strong>, as the most responsive, technically qualified, and economically advantageous bidder.
                </p>

                {doc.amount !== undefined && (
                  <p>
                    <strong>2. CONTRACT SUM & STATUTORY CONSIDERATION:</strong> The approved total contract sum for this award is{' '}
                    <strong className="text-[#14573A] text-sm">
                      ₦{doc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    (<strong>{amountInWords}</strong>). This amount is inclusive of all statutory requirements, Value Added Tax (VAT), Withholding Tax (WHT), standard duties, packaging, freight, and on-site delivery insurance.
                  </p>
                )}

                {/* Scope of Supply / BoQ Table */}
                {doc.items && doc.items.length > 0 && (
                  <div className="my-4">
                    <p className="font-semibold text-[#14573A] mb-1.5">
                      <strong>3. APPROVED SCOPE OF SUPPLY & BILL OF QUANTITIES:</strong>
                    </p>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#14573A] text-white font-semibold">
                          <th className="py-2 px-3 text-center w-8">#</th>
                          <th className="py-2 px-3">Description of Materials / Scope</th>
                          <th className="py-2 px-3 text-center">Qty</th>
                          <th className="py-2 px-3 text-center">Unit</th>
                          <th className="py-2 px-3 text-right">Unit Rate (₦)</th>
                          <th className="py-2 px-3 text-right">Amount (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2DCC8]">
                        {doc.items.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FBF9F2]' : 'bg-white'}>
                            <td className="py-2 px-3 text-center text-[#5B6B61]">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-[#12241B]">{item.description}</td>
                            <td className="py-2 px-3 text-center font-mono text-[#5B6B61]">{item.quantity}</td>
                            <td className="py-2 px-3 text-center text-[#5B6B61]">{item.unit}</td>
                            <td className="py-2 px-3 text-right font-mono text-[#5B6B61]">
                              ₦{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-[#14573A]">
                              ₦{item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#14573A] font-bold text-xs bg-[#F6F4EC]">
                          <td colSpan={5} className="py-2.5 px-3 text-right text-[#14573A] uppercase tracking-wider">
                            Total Approved Contract Value (NGN):
                          </td>
                          <td className="py-2.5 px-3 text-right font-serif-heading text-sm text-[#14573A]">
                            ₦{(doc.amount || doc.items.reduce((acc, i) => acc + i.totalPrice, 0)).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <p>
                  <strong>4. COMMENCEMENT & DELIVERY SCHEDULE:</strong> Execution of this order commences with immediate effect from the date of this letter. All items and services must be fully executed and delivered in strict compliance with the agreed schedule{' '}
                  {doc.awardDetails?.deliveryDate && (
                    <span>
                      on or before <strong className="text-[#14573A]">{doc.awardDetails.deliveryDate}</strong>
                    </span>
                  )}. A comprehensive warranty period of{' '}
                  <strong>{doc.awardDetails?.warrantyPeriod || '12 Months OEM Warranty'}</strong> is mandatory and shall be formally recognized from the date of final operational commissioning.
                </p>

                <p>
                  <strong>5. INSPECTION, QUALITY ASSURANCE & LIQUIDATED DAMAGES:</strong> Materials delivered are subject to physical verification, technical examination, and acceptance by the Store Verification Committee. Defective items or non-conforming deliverables will be rejected at your sole expense. In the event of unexcused default or delayed completion beyond the contracted timeline, liquidated damages shall accrue at the rate of <strong>0.5% per week of delay</strong>, up to a maximum cap of 10% of the contract sum.
                </p>

                <p>
                  <strong>6. PAYMENT MODALITY & TERMS:</strong> Disbursement of the contract sum shall be processed upon receipt of your verified commercial invoice, backed by an endorsed Goods Receipt Note (GRN) and Quality Verification Certificate, processed within standard net credit terms via electronic direct bank transfer.
                </p>

                <p>
                  <strong>7. ACCEPTANCE OF AWARD:</strong> Please communicate your unconditional acceptance of this offer by signing, sealing, and returning the duplicate copy of this award letter along with the endorsed Form of Acceptance below within forty-eight (48) hours of receipt.
                </p>
              </div>

              {/* Complimentary Close & Signatures */}
              <div className="mt-8 pt-4 border-t border-[#E2DCC8]">
                <div className="text-xs text-[#5B6B61] mb-6">
                  Yours faithfully,
                  <div className="font-bold text-[#14573A] mt-0.5">For and on behalf of {currentOrganization.name}:</div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-xs text-center signature-grid">
                  <div className="avoid-break">
                    <div className="h-12 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1 signature-line">
                      <span className="font-serif-heading italic text-[#14573A] font-semibold text-sm">
                        {procOfficer.split(' ')[0]} O.
                      </span>
                    </div>
                    <div className="font-bold text-[#14573A] mt-1.5">{procOfficer}</div>
                    <div className="text-[10px] text-[#5B6B61]">Procurement Officer</div>
                    <div className="text-[9px] text-[#8A988E]">Tenders Committee</div>
                  </div>

                  <div className="avoid-break">
                    <div className="h-12 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1 signature-line">
                      <span className="font-serif-heading italic text-[#14573A] font-semibold text-sm">
                        {finOfficer.split(' ')[0]} F.
                      </span>
                    </div>
                    <div className="font-bold text-[#14573A] mt-1.5">{finOfficer}</div>
                    <div className="text-[10px] text-[#5B6B61]">Finance & Accounts Controller</div>
                    <div className="text-[9px] text-[#8A988E]">Internal Audit Clearance</div>
                  </div>

                  <div className="avoid-break">
                    <div className="h-12 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1 signature-line">
                      <span className="font-serif-heading italic text-[#B8941F] font-bold text-sm">
                        {authOfficer.split(' ')[0]} B.
                      </span>
                    </div>
                    <div className="font-bold text-[#14573A] mt-1.5">{authOfficer}</div>
                    <div className="text-[10px] text-[#5B6B61]">Approving Authority</div>
                    <div className="text-[9px] text-[#8A988E]">Executive Board Seal</div>
                  </div>
                </div>
              </div>

              {/* Form of Acceptance / Contractor's Counterpart Slip */}
              <div className="mt-8 p-4 rounded-xl border-2 border-dashed border-[#14573A] bg-[#FBF9F2] text-xs acceptance-box avoid-break">
                <div className="font-bold text-xs uppercase tracking-wider text-[#14573A] font-serif-heading mb-1.5 flex items-center justify-between">
                  <span>FORM OF ACCEPTANCE (To be signed & returned by Contractor)</span>
                  <span className="text-[10px] font-mono text-[#5B6B61]">Duplicate Counterpart</span>
                </div>
                <p className="text-[11px] text-[#5B6B61] leading-relaxed mb-4">
                  We, <strong>{doc.recipientName}</strong>, hereby acknowledge receipt of this Letter of Contract Award (Ref: <strong>{doc.reference}</strong>) and confirm our unconditional acceptance of the contract terms, scope, sum, and delivery milestones stipulated herein.
                </p>

                <div className="grid grid-cols-3 gap-6 pt-2 text-[11px]">
                  <div>
                    <span className="text-[#5B6B61] block mb-1">Authorized Representative Name:</span>
                    <div className="border-b border-[#14573A] pb-1 font-semibold text-[#12241B]">
                      ___________________________
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5B6B61] block mb-1">Signature & Date:</span>
                    <div className="border-b border-[#14573A] pb-1 font-semibold text-[#12241B]">
                      ___________________________
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5B6B61] block mb-1">Official Corporate Stamp:</span>
                    <div className="h-10 border border-dashed border-[#14573A]/60 rounded flex items-center justify-center text-[10px] text-[#8A988E]">
                      [ Affix Seal Here ]
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Watermark & Security Hash */}
              <div className="mt-8 pt-3 border-t border-[#E2DCC8] flex justify-between items-center text-[10px] text-[#5B6B61] avoid-break">
                <span>Certified Official Electronic Instrument · PROCURA Procurement System</span>
                <span className="font-mono">Security Checksum: AWD-{doc.reference}-AUTHORIZED-SECURE</span>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* CASE B: OTHER DOCUMENTS (PO, Voucher, Report, Bid Proposal)    */
            /* ============================================================== */
            <div>
              {/* Header */}
              <div className="border-b-2 border-[#14573A] pb-6 mb-6 letterhead">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-md bg-[#14573A] border border-[#B8941F] flex items-center justify-center text-[#B8941F]">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.2 14.5l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
                        </svg>
                      </div>
                      <h1 className="text-2xl font-black font-serif-heading text-[#14573A] tracking-wide">
                        {currentOrganization.name.toUpperCase()}
                      </h1>
                    </div>
                    <p className="text-xs text-[#5B6B61] max-w-md">{currentOrganization.address || settings.address}</p>
                    <p className="text-xs text-[#5B6B61]">
                      Tel: {currentOrganization.phone || settings.phone} | Email:{' '}
                      {currentOrganization.email || settings.email}
                    </p>
                  </div>

                  {/* Document Banner */}
                  <div className="text-right">
                    <div className="inline-block bg-[#0B3A27] text-[#D4AF37] px-4 py-1.5 rounded-lg font-serif-heading font-bold text-sm tracking-widest uppercase border border-[#B8941F] badge">
                      {doc.type}
                    </div>
                    <div className="text-xs text-[#5B6B61] mt-2 font-mono font-semibold">
                      Ref: <span className="text-[#14573A] font-bold">{doc.reference}</span>
                    </div>
                    <div className="text-xs text-[#5B6B61]">Date: {doc.date}</div>
                  </div>
                </div>
              </div>

              {/* Recipient & Meta Section */}
              <div className="grid grid-cols-2 gap-6 mb-6 text-xs bg-[#FBF9F2] p-4 rounded-xl border border-[#E2DCC8]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8941F] mb-1">
                    {doc.type === 'Bid Proposal' ? 'Bidder / Contractor' : 'Issued To / Vendor'}
                  </div>
                  <div className="font-bold text-sm text-[#14573A]">{doc.recipientName}</div>
                  {doc.recipientAddress && <div className="text-[#5B6B61] mt-0.5">{doc.recipientAddress}</div>}
                  {doc.department && (
                    <div className="text-[#5B6B61] mt-0.5">
                      Procuring Unit: <span className="font-semibold text-[#12241B]">{doc.department}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-right">
                  {doc.metaFields?.map((f, i) => (
                    <div key={i} className="col-span-2">
                      <span className="text-[#5B6B61] mr-2">{f.label}:</span>
                      <span className="font-semibold text-[#12241B]">{f.value}</span>
                    </div>
                  ))}
                  {doc.paymentMethod && (
                    <div className="col-span-2">
                      <span className="text-[#5B6B61] mr-2">Disbursement Mode:</span>
                      <span className="font-semibold text-[#14573A]">{doc.paymentMethod}</span>
                    </div>
                  )}
                  {doc.amount !== undefined && (
                    <div className="col-span-2 pt-2 border-t border-[#E2DCC8]">
                      <span className="text-[#5B6B61] mr-2 text-xs">Total Net Value:</span>
                      <span className="font-extrabold text-base text-[#14573A] font-serif-heading">
                        ₦{doc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      {amountInWords && (
                        <div className="text-[10px] text-[#5B6B61] font-normal italic mt-0.5">({amountInWords})</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Narrative / Description */}
              <div className="mb-6">
                <h2 className="font-bold text-sm text-[#14573A] font-serif-heading mb-1.5">{doc.title}</h2>
                {doc.notes && (
                  <p className="text-xs text-[#5B6B61] leading-relaxed whitespace-pre-line bg-[#FAF8F5] p-3 rounded-lg border border-[#E2DCC8]/60">
                    {doc.notes}
                  </p>
                )}
              </div>

              {/* Line Items Table if present */}
              {doc.items && doc.items.length > 0 && (
                <div className="mb-6">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#14573A] text-white font-semibold">
                        <th className="py-2 px-3 rounded-l-md">#</th>
                        <th className="py-2 px-3">Description of Supply / Service</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-center">Unit</th>
                        <th className="py-2 px-3 text-right">Unit Rate (₦)</th>
                        <th className="py-2 px-3 text-right rounded-r-md">Subtotal (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCC8]">
                      {doc.items.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FBF9F2]' : 'bg-white'}>
                          <td className="py-2.5 px-3 text-[#5B6B61]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-[#12241B]">{item.description}</td>
                          <td className="py-2.5 px-3 text-center text-[#5B6B61]">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-center text-[#5B6B61]">{item.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#5B6B61]">
                            ₦{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#14573A]">
                            ₦{item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#14573A] font-bold text-xs bg-[#F6F4EC]">
                        <td colSpan={5} className="py-3 px-3 text-right text-[#14573A] uppercase tracking-wider">
                          Gross Payable Total (NGN):
                        </td>
                        <td className="py-3 px-3 text-right font-serif-heading text-sm text-[#14573A]">
                          ₦{(doc.amount || doc.items.reduce((acc, i) => acc + i.totalPrice, 0)).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Terms & Conditions */}
              {doc.terms && (
                <div className="mb-8 p-3 rounded-xl border border-[#E2DCC8] bg-[#FBF9F2] text-[11px] text-[#5B6B61]">
                  <span className="font-bold text-[#14573A] block mb-1">Contractual Stipulations & Compliance Clauses:</span>
                  <p className="leading-relaxed whitespace-pre-line">{doc.terms}</p>
                </div>
              )}

              {/* Signatures & Execution Section */}
              <div className="pt-8 border-t border-[#E2DCC8] grid grid-cols-3 gap-6 text-xs text-center signature-grid avoid-break">
                <div>
                  <div className="h-14 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1 signature-line">
                    <span className="font-serif-heading italic text-[#14573A] font-semibold text-sm">
                      {procOfficer.split(' ')[0]} O.
                    </span>
                  </div>
                  <div className="font-bold text-[#14573A] mt-1.5">Procurement Officer</div>
                  <div className="text-[10px] text-[#5B6B61]">{currentOrganization.name}</div>
                </div>

                <div>
                  <div className="h-14 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1 signature-line">
                    <span className="font-serif-heading italic text-[#14573A] font-semibold text-sm">
                      {finOfficer.split(' ')[0]} F.
                    </span>
                  </div>
                  <div className="font-bold text-[#14573A] mt-1.5">Finance Controller</div>
                  <div className="text-[10px] text-[#5B6B61]">Audit & Accounts</div>
                </div>

                <div>
                  <div className="h-14 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1 signature-line">
                    <span className="font-serif-heading italic text-[#B8941F] font-bold text-sm">
                      {authOfficer.split(' ')[0]} B.
                    </span>
                  </div>
                  <div className="font-bold text-[#14573A] mt-1.5">Approving Authority</div>
                  <div className="text-[10px] text-[#5B6B61]">Executive Board</div>
                </div>
              </div>

              {/* Footer watermark */}
              <div className="mt-8 pt-4 border-t border-[#E2DCC8] flex justify-between items-center text-[10px] text-[#5B6B61] avoid-break">
                <span>Generated electronically by PROCURA Enterprise Procurement System</span>
                <span className="font-mono">Security Checksum: PR-{doc.reference}-VERIFIED</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
