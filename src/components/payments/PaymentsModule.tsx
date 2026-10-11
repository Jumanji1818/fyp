import React, { useState } from 'react';
import {
  CreditCard,
  Printer,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Plus,
  FileText,
  Building,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { PrintViewModal, DocumentData } from '../common/PrintViewModal';
import { PaymentRecord, PurchaseOrder } from '../../types';

export const PaymentsModule: React.FC = () => {
  const {
    purchaseOrders,
    payments,
    recordPayment,
    celebrationOpen,
    setCelebrationOpen,
    currentOrganization,
  } = useApp();

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('Full disbursement against store receiving certificate.');
  const [printDoc, setPrintDoc] = useState<DocumentData | null>(null);

  // Filter POs for current organization
  const orgPOs = purchaseOrders.filter((po) =>
    po.organizationId ? po.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  // Eligible POs for payment (those with remaining unpaid balance)
  const payablePOs = orgPOs.filter((po) => po.paidAmount < po.totalAmount && po.status !== 'Cancelled');
  const selectedPO = orgPOs.find((po) => po.id === selectedPOId) || payablePOs[0];

  const orgPayments = payments.filter((p) => {
    return orgPOs.some((po) => po.id === p.purchaseOrderId || po.referenceNumber === p.poReference);
  });

  const maxPayable = selectedPO ? selectedPO.totalAmount - selectedPO.paidAmount : 0;

  const handleOpenRecord = (po?: PurchaseOrder) => {
    const target = po || payablePOs[0];
    if (target) {
      setSelectedPOId(target.id);
      setAmount(target.totalAmount - target.paidAmount); // Pre-fill with remaining amount
    }
    setRefNumber(`NIBSS-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setRecordModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || amount <= 0 || amount > maxPayable) return;

    const newPayment = recordPayment({
      purchaseOrderId: selectedPO.id,
      poReference: selectedPO.referenceNumber,
      vendorId: selectedPO.vendorId,
      vendorName: selectedPO.vendorName,
      departmentId: selectedPO.departmentId,
      departmentName: selectedPO.departmentName,
      amount,
      paymentDate,
      method,
      referenceNumber: refNumber,
      notes,
    });

    setRecordModalOpen(false);

    // Open green & gold Payment Voucher PDF preview (Section 6.9)
    setPrintDoc({
      type: 'Payment Voucher',
      reference: newPayment.voucherNumber,
      title: `Official Remittance Disbursement Voucher: ${selectedPO.referenceNumber}`,
      date: newPayment.paymentDate,
      recipientName: newPayment.vendorName,
      recipientAddress: 'Nigeria',
      department: newPayment.departmentName,
      amount: newPayment.amount,
      paymentMethod: `${newPayment.method} (Ref: ${newPayment.referenceNumber})`,
      notes: newPayment.notes,
      metaFields: [
        { label: 'Purchase Order Ref', value: newPayment.poReference },
        { label: 'Payment Voucher ID', value: newPayment.voucherNumber },
        { label: 'Disbursement Status', value: 'Settled & Authenticated' },
      ],
    });
  };

  const openPrintVoucher = (p: PaymentRecord) => {
    setPrintDoc({
      type: 'Payment Voucher',
      reference: p.voucherNumber,
      title: `Official Remittance Disbursement Voucher: ${p.poReference}`,
      date: p.paymentDate,
      recipientName: p.vendorName,
      recipientAddress: 'Nigeria',
      department: p.departmentName,
      amount: p.amount,
      paymentMethod: `${p.method} (Ref: ${p.referenceNumber})`,
      notes: p.notes,
      metaFields: [
        { label: 'Purchase Order Ref', value: p.poReference },
        { label: 'Payment Voucher ID', value: p.voucherNumber },
        { label: 'Disbursement Status', value: 'Settled' },
      ],
    });
  };

  const totalDisbursed = orgPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
            Payments & Disbursement Vouchers
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Strict overpayment protection, electronic payment vouchers, and full procurement lifecycle completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenRecord()}
            disabled={payablePOs.length === 0}
            className="py-2.5 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 shadow-lg disabled:opacity-40"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" /> Record Payment Voucher
          </button>
        </div>
      </div>

      {/* Due & Overdue Payments Card (Section 6.9) */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
        <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6] mb-3">
          Obligations Due for Payment Disbursement
        </h3>

        <div className="space-y-3 text-xs">
          {payablePOs.length === 0 ? (
            <div className="py-8 text-center text-[#A8B5AB]">
              All purchase order commitments have been fully settled! No pending disbursements.
            </div>
          ) : (
            payablePOs.map((po) => {
              const unpaid = po.totalAmount - po.paidAmount;
              const isDelivered = po.status === 'Delivered';

              return (
                <div
                  key={po.id}
                  className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#D4AF37]">{po.referenceNumber}</span>
                      <span className="font-semibold text-[#F2EFE6]">{po.vendorName}</span>
                      <StatusChip status={po.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-[#A8B5AB] mt-1">
                      Department: {po.departmentName} · Total Contract: ₦{po.totalAmount.toLocaleString()} · Paid So Far: ₦{po.paidAmount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#E0A93B] font-semibold mt-0.5">
                      Outstanding Payable Balance: ₦{unpaid.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRecord(po)}
                    className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 shadow shrink-0"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" /> Pay Balance
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Disbursed Payment Vouchers Table */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
        <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6] mb-3">
          Historical Payment Vouchers Log
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
              <tr>
                <th className="py-2.5 px-3">Voucher No</th>
                <th className="py-2.5 px-3">PO Reference</th>
                <th className="py-2.5 px-3">Beneficiary Supplier</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Amount Disbursed</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3">Disbursed Date</th>
                <th className="py-2.5 px-3 text-right">Voucher PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {orgPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#A8B5AB]">
                    No payment vouchers disbursed for {currentOrganization.name} yet.
                  </td>
                </tr>
              ) : (
                orgPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#132A20]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#E8CF7A]">{p.voucherNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-[#F2EFE6]">{p.poReference}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{p.vendorName}</td>
                    <td className="py-2.5 px-3 text-[#A8B5AB]">{p.departmentName}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#3FB67A]">
                      ₦{p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-[#F2EFE6]">{p.method}</td>
                    <td className="py-2.5 px-3 text-[#A8B5AB]">{p.paymentDate}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openPrintVoucher(p)}
                        className="p-1 rounded bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37]"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL (Section 6.9: "Overpayment is blocked") */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Payment Disbursement"
        subtitle="Authorize electronic fund settlement against verified purchase orders."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Select Purchase Order *</label>
            <select
              value={selectedPOId}
              onChange={(e) => {
                setSelectedPOId(e.target.value);
                const po = orgPOs.find((p) => p.id === e.target.value);
                if (po) setAmount(po.totalAmount - po.paidAmount);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            >
              {payablePOs.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.referenceNumber} - {po.vendorName} (Unpaid: ₦{(po.totalAmount - po.paidAmount).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">
                Disbursement Amount (₦) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={maxPayable} // OVERPAYMENT STRICTLY BLOCKED! (Section 6.9)
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] font-mono outline-none"
              />
              <span className="text-[10px] text-[#A8B5AB] mt-0.5 block">
                Maximum payable: ₦{maxPayable.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Disbursement Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              >
                <option value="Bank Transfer">Bank Transfer (NIBSS)</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Cash">Petty Cash Voucher</option>
              </select>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Transaction Ref / Cheque No *</label>
              <input
                type="text"
                required
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Voucher Description / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="flex justify-between pt-3 border-t border-[#1F3A2D]">
            <button
              type="button"
              onClick={() => setRecordModalOpen(false)}
              className="px-4 py-2 text-[#A8B5AB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={amount <= 0 || amount > maxPayable}
              className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold flex items-center gap-1.5 hover:brightness-110 shadow disabled:opacity-40"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" /> Authorize Voucher & Disburse
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT VIEW MODAL */}
      <PrintViewModal isOpen={!!printDoc} onClose={() => setPrintDoc(null)} doc={printDoc} />
    </div>
  );
};
