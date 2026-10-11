import React, { useState } from 'react';
import {
  PackageCheck,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Check,
  X,
  FileText,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { PurchaseOrder, DeliveryRecord } from '../../types';

export const StoreReceivingModule: React.FC = () => {
  const { purchaseOrders, deliveries, receiveDelivery, currentUser, currentOrganization } = useApp();

  const orgPOs = purchaseOrders.filter((po) =>
    po.organizationId ? po.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);
  const [itemsReceived, setItemsReceived] = useState<
    Array<{
      description: string;
      ordered: number;
      received: number;
      status: 'Accepted' | 'Partially Accepted' | 'Rejected';
      reason?: string;
    }>
  >([]);

  const openInspection = (po: PurchaseOrder) => {
    setActivePO(po);
    setItemsReceived(
      po.items.map((i) => ({
        description: i.description,
        ordered: i.quantity,
        received: i.quantity, // defaults to full ordered
        status: 'Accepted',
      }))
    );
  };

  const handleLineStatusChange = (
    idx: number,
    status: 'Accepted' | 'Partially Accepted' | 'Rejected',
    receivedQty: number,
    reason?: string
  ) => {
    const copy = [...itemsReceived];
    copy[idx] = {
      ...copy[idx],
      status,
      received: receivedQty,
      reason,
    };
    setItemsReceived(copy);
  };

  const handleConfirmInspection = () => {
    if (!activePO) return;
    receiveDelivery(activePO.id, itemsReceived);
    setActivePO(null);
  };

  // POs needing delivery receiving or overdue for this organization
  const deliverablePOs = orgPOs.filter((po) => po.status !== 'Closed' && po.status !== 'Cancelled');

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
            Store Receiving & Delivery Verification
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Physical inspection, verification against committed schedules, and vendor reliability scoring.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#132A20] px-3.5 py-2 rounded-xl text-xs text-[#D4AF37] font-semibold border border-[#1F3A2D]">
          <PackageCheck className="w-4 h-4 text-[#3FB67A]" /> {deliveries.length} Received Deliveries
        </div>
      </div>

      {/* POs awaiting receiving / dispatched */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
        <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6] mb-3">
          Purchase Orders In Fulfillment
        </h3>

        <div className="space-y-3 text-xs">
          {deliverablePOs.map((po) => {
            const isDispatched = !!po.dispatchedAt;
            const isOverdue =
              po.status !== 'Delivered' && new Date(po.expectedDeliveryDate).getTime() < Date.now();

            return (
              <div
                key={po.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isOverdue ? 'bg-[#D9534F]/10 border-[#D9534F]/40' : 'bg-[#132A20] border-[#1F3A2D]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#E8CF7A]">{po.referenceNumber}</span>
                    <span className="font-semibold text-[#F2EFE6]">{po.vendorName}</span>
                    <StatusChip status={po.status} size="sm" />
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9534F] text-white">
                        OVERDUE COMMITMENT
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#A8B5AB] mt-1">
                    Committed Delivery Date: <strong className="text-[#F2EFE6]">{po.expectedDeliveryDate}</strong> · Value: ₦{po.totalAmount.toLocaleString()}
                  </div>
                  {po.dispatchNotes && (
                    <div className="text-[11px] text-[#3FB67A] mt-1">
                      Vendor Dispatch Note: &quot;{po.dispatchNotes}&quot;
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {po.status !== 'Delivered' && (
                    <button
                      onClick={() => openInspection(po)}
                      className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold flex items-center gap-1.5 hover:brightness-110 shadow"
                    >
                      <PackageCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Inspect & Receive Consignment
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Deliveries Log */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
        <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6] mb-3">
          Completed Delivery Inspection Records
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
              <tr>
                <th className="py-2.5 px-3">PO Reference</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Received By</th>
                <th className="py-2.5 px-3">Date Received</th>
                <th className="py-2.5 px-3 text-center">Timeliness Performance</th>
                <th className="py-2.5 px-3 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {deliveries.map((del) => (
                <tr key={del.id}>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#E8CF7A]">{del.poReference}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{del.vendorName}</td>
                  <td className="py-2.5 px-3 text-[#A8B5AB]">{del.receivedByName}</td>
                  <td className="py-2.5 px-3 text-[#A8B5AB]">{del.receivedDate}</td>
                  <td className="py-2.5 px-3 text-center">
                    {del.onTime ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#3FB67A]/20 text-[#3FB67A] text-[10px] font-semibold border border-[#3FB67A]/30">
                        On Time (0 delay)
                      </span>
                    ) : (
                      /* Red chip for late delivery (Section 6.8) */
                      <span className="px-2 py-0.5 rounded-full bg-[#D9534F]/20 text-[#D9534F] text-[10px] font-semibold border border-[#D9534F]/30">
                        Late by {del.lateDays} days
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[#3FB67A] font-semibold">Accepted & Verified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION MODAL (Section 6.8) */}
      {activePO && (
        <Modal
          isOpen={!!activePO}
          onClose={() => setActivePO(null)}
          title={`Consignment Inspection: ${activePO.referenceNumber}`}
          subtitle={`Supplier: ${activePO.vendorName} · Committed Date: ${activePO.expectedDeliveryDate}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#07130E] border border-[#1F3A2D] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#F2EFE6]">Delivery Schedule Comparison:</span>
                <p className="text-[11px] text-[#A8B5AB] mt-0.5">
                  Today is {new Date().toLocaleDateString('en-GB')}. System will automatically calculate On-Time status or apply late penalties.
                </p>
              </div>
              <Clock className="w-5 h-5 text-[#D4AF37]" />
            </div>

            <div className="space-y-3">
              <span className="font-bold text-[#F2EFE6] block">Quantity Received & Quality Determination:</span>
              {itemsReceived.map((line, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#132A20] border border-[#1F3A2D] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#F2EFE6]">{line.description}</span>
                    <span className="text-[#A8B5AB]">Ordered: {line.ordered}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4">
                      <label className="text-[10px] text-[#A8B5AB] block mb-0.5">Quantity Accepted</label>
                      <input
                        type="number"
                        min={0}
                        max={line.ordered}
                        value={line.received}
                        onChange={(e) =>
                          handleLineStatusChange(idx, line.status, Number(e.target.value), line.reason)
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6]"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="text-[10px] text-[#A8B5AB] block mb-0.5">Quality Verdict</label>
                      <select
                        value={line.status}
                        onChange={(e) =>
                          handleLineStatusChange(idx, e.target.value as any, line.received, line.reason)
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6]"
                      >
                        <option value="Accepted">Accept Fully</option>
                        <option value="Partially Accepted">Accept Partially</option>
                        <option value="Rejected">Reject Line</option>
                      </select>
                    </div>

                    <div className="col-span-4">
                      <label className="text-[10px] text-[#A8B5AB] block mb-0.5">Remarks / Reason (if shortfall)</label>
                      <input
                        type="text"
                        placeholder="Optional remarks"
                        value={line.reason || ''}
                        onChange={(e) =>
                          handleLineStatusChange(idx, line.status, line.received, e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-3 border-t border-[#1F3A2D]">
              <button onClick={() => setActivePO(null)} className="px-4 py-2 text-[#A8B5AB]">
                Cancel
              </button>
              <button
                onClick={handleConfirmInspection}
                className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-lg"
              >
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" /> Confirm Inspection & Sign Receiving Voucher
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
