import React, { useState } from 'react';
import {
  Truck,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Building,
  Eye,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { PrintViewModal, DocumentData } from '../common/PrintViewModal';
import { PurchaseOrder } from '../../types';

interface PurchaseOrdersModuleProps {
  initialPoId?: string;
}

export const PurchaseOrdersModule: React.FC<PurchaseOrdersModuleProps> = ({ initialPoId }) => {
  const { purchaseOrders, currentUser, acknowledgePO, currentOrganization } = useApp();

  const orgPOs = purchaseOrders.filter((po) =>
    po.organizationId ? po.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(() => {
    if (initialPoId) {
      return orgPOs.find((p) => p.id === initialPoId) || null;
    }
    return null;
  });

  const [printDoc, setPrintDoc] = useState<DocumentData | null>(null);

  const openPrintPO = (po: PurchaseOrder) => {
    setPrintDoc({
      type: 'Purchase Order',
      reference: po.referenceNumber,
      title: `Official Purchase Order for ${po.tenderReference}`,
      date: new Date(po.issuedAt).toLocaleDateString('en-GB'),
      recipientName: po.vendorName,
      recipientAddress: po.vendorAddress,
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
        { label: 'Delivery Destination', value: po.deliveryLocation },
        { label: 'Order Status', value: po.status },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
            Purchase Orders (PO) Management
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Legally binding purchase contracts generated automatically upon contract award.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#132A20] px-3.5 py-2 rounded-xl text-xs text-[#D4AF37] font-semibold border border-[#1F3A2D]">
          <Truck className="w-4 h-4" /> {orgPOs.length} Total Purchase Orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] uppercase tracking-wider font-semibold border-b border-[#1F3A2D]">
              <tr>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Procuring Dept</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-center">Expected Delivery</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {orgPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A8B5AB]">
                    No purchase orders recorded for {currentOrganization.name} yet.
                  </td>
                </tr>
              ) : (
                orgPOs.map((po, idx) => {
                const isOverdue =
                  po.status !== 'Closed' &&
                  po.status !== 'Delivered' &&
                  new Date(po.expectedDeliveryDate).getTime() < Date.now();

                return (
                  <tr
                    key={po.id}
                    className={`hover:bg-[#132A20]/70 cursor-pointer transition-colors ${
                      idx % 2 === 1 ? 'bg-[#07130E]/30' : ''
                    }`}
                    onClick={() => setSelectedPO(po)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#E8CF7A]">{po.referenceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-[#F2EFE6]">{po.vendorName}</td>
                    <td className="py-3 px-4 text-[#A8B5AB]">{po.departmentName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#F2EFE6]">
                      ₦{po.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={isOverdue ? 'text-[#D9534F] font-bold' : 'text-[#F2EFE6]'}>
                        {po.expectedDeliveryDate}
                      </span>
                      {isOverdue && (
                        <span className="block text-[10px] text-[#D9534F] font-semibold">OVERDUE</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusChip status={po.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {/* Vendor Acknowledge Button if vendor role (Section 6.7) */}
                        {currentUser?.role === 'Vendor' && po.status === 'Issued' && (
                          <button
                            onClick={() => acknowledgePO(po.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#1F6F4A] hover:bg-[#2C9E62] text-white font-semibold flex items-center gap-1 text-[11px]"
                          >
                            <Check className="w-3 h-3" /> Acknowledge PO
                          </button>
                        )}
                        <button
                          onClick={() => openPrintPO(po)}
                          className="p-1.5 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#1F3A2D]"
                          title="Print / Save PDF (Green & Gold Template)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO DETAIL MODAL */}
      {selectedPO && (
        <Modal
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          title={`Purchase Order: ${selectedPO.referenceNumber}`}
          subtitle={`Issued to ${selectedPO.vendorName}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D]">
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Vendor:</span>
                <span className="font-semibold text-[#F2EFE6]">{selectedPO.vendorName}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Department:</span>
                <span className="font-semibold text-[#F2EFE6]">{selectedPO.departmentName}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Committed Delivery:</span>
                <span className="font-semibold text-[#E0A93B]">{selectedPO.expectedDeliveryDate}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Current Status:</span>
                <StatusChip status={selectedPO.status} size="sm" />
              </div>
            </div>

            <div>
              <span className="font-bold text-[#F2EFE6] mb-2 block">Contract Line Items:</span>
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#132A20] text-[#A8B5AB]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Ordered</th>
                    <th className="py-2.5 px-3 text-center">Received</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {selectedPO.items.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5 px-3 text-[#F2EFE6]">{i.description}</td>
                      <td className="py-2.5 px-3 text-center text-[#A8B5AB]">{i.quantity} {i.unit}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#3FB67A]">
                        {i.receivedQuantity} {i.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#A8B5AB]">
                        ₦{i.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D4AF37]">
                        ₦{i.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#1F3A2D] bg-[#132A20] font-bold">
                    <td colSpan={4} className="py-2.5 px-3 text-right">Gross Total Value:</td>
                    <td className="py-2.5 px-3 text-right font-serif-heading text-sm text-[#D4AF37]">
                      ₦{selectedPO.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3.5 rounded-xl bg-[#07130E] border border-[#1F3A2D]">
              <span className="font-bold text-[#D4AF37] block mb-1">Contractual Stipulations:</span>
              <p className="text-[#A8B5AB]">{selectedPO.terms}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1F3A2D]">
              <button
                onClick={() => openPrintPO(selectedPO)}
                className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-1.5 hover:brightness-110"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4AF37]" /> Export Official PDF
              </button>

              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 rounded-[10px] bg-[#132A20] text-[#F2EFE6] font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT VIEW MODAL */}
      <PrintViewModal isOpen={!!printDoc} onClose={() => setPrintDoc(null)} doc={printDoc} />
    </div>
  );
};
