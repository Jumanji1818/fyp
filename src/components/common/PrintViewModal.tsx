import React from 'react';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface DocumentData {
  type: 'Award Letter' | 'Purchase Order' | 'Payment Voucher' | 'Procurement Report';
  reference: string;
  title: string;
  date: string;
  recipientName: string;
  recipientAddress?: string;
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
}

interface PrintViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentData | null;
}

export const PrintViewModal: React.FC<PrintViewModalProps> = ({ isOpen, onClose, doc }) => {
  const { settings, currentOrganization } = useApp();

  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07130E]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0D1F17] border border-[#1F3A2D] rounded-[20px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Controls Bar */}
        <div className="px-6 py-3.5 border-b border-[#1F3A2D] flex items-center justify-between bg-[#132A20] text-xs print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold text-[#F2EFE6]">{doc.type}: {doc.reference}</span>
            <span className="text-[#A8B5AB]">· Green & Gold Official Document</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-medium hover:brightness-110 transition-all text-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A8B5AB] hover:text-[#F2EFE6] hover:bg-[#1F3A2D] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Page Body (Styled in Green & Gold) */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-[#12241B] font-sans selection:bg-[#D4AF37]/20 print:p-0 print:m-0 print:text-black">
          {/* Header */}
          <div className="border-b-2 border-[#14573A] pb-6 mb-6">
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
                <p className="text-xs text-[#5B6B61]">Tel: {currentOrganization.phone || settings.phone} | Email: {currentOrganization.email || settings.email}</p>
              </div>

              {/* Document Banner */}
              <div className="text-right">
                <div className="inline-block bg-[#0B3A27] text-[#D4AF37] px-4 py-1.5 rounded-lg font-serif-heading font-bold text-sm tracking-widest uppercase border border-[#B8941F]">
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8941F] mb-1">Issued To / Vendor</div>
              <div className="font-bold text-sm text-[#14573A]">{doc.recipientName}</div>
              {doc.recipientAddress && <div className="text-[#5B6B61] mt-0.5">{doc.recipientAddress}</div>}
              {doc.department && <div className="text-[#5B6B61] mt-0.5">Procuring Unit: <span className="font-semibold text-[#12241B]">{doc.department}</span></div>}
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
              <p className="leading-relaxed">{doc.terms}</p>
            </div>
          )}

          {/* Signatures & Execution Section */}
          <div className="pt-8 border-t border-[#E2DCC8] grid grid-cols-3 gap-6 text-xs text-center">
            <div>
              <div className="h-14 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1">
                <span className="font-serif-heading italic text-[#14573A] font-semibold text-sm">Chidiebere O.</span>
              </div>
              <div className="font-bold text-[#14573A] mt-1.5">Procurement Officer</div>
              <div className="text-[10px] text-[#5B6B61]">{currentOrganization.name}</div>
            </div>

            <div>
              <div className="h-14 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1">
                <span className="font-serif-heading italic text-[#14573A] font-semibold text-sm">Folake Oshodi, FCA</span>
              </div>
              <div className="font-bold text-[#14573A] mt-1.5">Finance Controller</div>
              <div className="text-[10px] text-[#5B6B61]">Audit & Accounts</div>
            </div>

            <div>
              <div className="h-14 border-b border-dashed border-[#14573A]/60 flex items-end justify-center pb-1">
                <span className="font-serif-heading italic text-[#B8941F] font-bold text-sm">Babatunde Adeleke</span>
              </div>
              <div className="font-bold text-[#14573A] mt-1.5">Approving Authority</div>
              <div className="text-[10px] text-[#5B6B61]">Executive Board</div>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="mt-8 pt-4 border-t border-[#E2DCC8] flex justify-between items-center text-[10px] text-[#5B6B61]">
            <span>Generated electronically by PROCURA Enterprise Procurement System</span>
            <span className="font-mono">Security Checksum: PR-{doc.reference}-VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
