import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle,
  RotateCcw,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { PurchaseRequest } from '../../types';

export const DepartmentApprovalsModule: React.FC = () => {
  const {
    requests,
    currentUser,
    departments,
    approveRequest,
    returnRequest,
    rejectRequest,
    currentOrganization,
  } = useApp();

  const [activeReq, setActiveReq] = useState<PurchaseRequest | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [reasonText, setReasonText] = useState('');

  // Department Head reviews requests from their department only (Section 4 & 6.2)
  const deptRequests = requests.filter((r) => {
    const matchOrg = r.organizationId
      ? r.organizationId === currentOrganization.id
      : currentOrganization.id === 'org-emerald';
    if (!matchOrg) return false;
    if (currentUser?.departmentId && r.departmentId !== currentUser.departmentId) return false;
    return r.status === 'Submitted';
  });

  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const targetDept = orgDepts.find((d) => d.id === currentUser?.departmentId) || orgDepts[0];
  const remainingBudget = targetDept
    ? Math.max(0, targetDept.annualBudget - targetDept.spent - targetDept.committed)
    : 0;

  const handleApprove = (req: PurchaseRequest) => {
    approveRequest(req.id, 'Approved by Department Head. Budget verified.');
    setActiveReq(null);
  };

  const handleConfirmReturn = () => {
    if (!commentText.trim() || !activeReq) return;
    returnRequest(activeReq.id, commentText);
    setReturnModalOpen(false);
    setCommentText('');
    setActiveReq(null);
  };

  const handleConfirmReject = () => {
    if (!reasonText.trim() || !activeReq) return;
    rejectRequest(activeReq.id, reasonText);
    setRejectModalOpen(false);
    setReasonText('');
    setActiveReq(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
            Department Requisition Approvals
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Operating Unit: <strong className="text-[#D4AF37]">{targetDept?.name || 'Department'}</strong> · Inbox of pending staff purchase requests.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#132A20] px-4 py-2.5 rounded-xl border border-[#1F3A2D] text-xs">
          <div>
            <span className="text-[#A8B5AB] block text-[10px]">Remaining Dept Budget:</span>
            <span className="font-bold text-[#D4AF37] font-serif-heading text-sm">
              ₦{remainingBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-8 bg-[#1F3A2D]" />
          <div>
            <span className="text-[#A8B5AB] block text-[10px]">Awaiting Sign-Off:</span>
            <span className="font-bold text-[#E0A93B] font-mono text-sm">{deptRequests.length} Requests</span>
          </div>
        </div>
      </div>

      {/* List of Pending Requests */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] uppercase tracking-wider font-semibold border-b border-[#1F3A2D]">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Title & Items</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4 text-right">Estimated Cost</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Budget Impact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {deptRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#A8B5AB]">
                    <CheckSquare className="w-8 h-8 mx-auto text-[#3FB67A] mb-2" />
                    All department requisitions have been processed! No pending items.
                  </td>
                </tr>
              ) : (
                deptRequests.map((req, idx) => {
                  const exceeds = req.estimatedTotal > remainingBudget;

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-[#132A20]/80 cursor-pointer transition-colors ${
                        idx % 2 === 1 ? 'bg-[#07130E]/30' : ''
                      }`}
                      onClick={() => setActiveReq(req)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#E8CF7A]">{req.referenceNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#F2EFE6]">{req.title}</div>
                        <div className="text-[11px] text-[#A8B5AB] mt-0.5 truncate max-w-sm">
                          {req.items.map((i) => `${i.description} (${i.quantity} ${i.unit})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#A8B5AB]">{req.requesterName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#F2EFE6]">
                        ₦{req.estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#132A20] text-[#E8CF7A]">
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {exceeds ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#D9534F] font-semibold bg-[#D9534F]/10 px-2 py-0.5 rounded-full border border-[#D9534F]/30">
                            <AlertTriangle className="w-3 h-3" /> Exceeds
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#3FB67A] font-semibold bg-[#3FB67A]/10 px-2 py-0.5 rounded-full border border-[#3FB67A]/30">
                            <CheckCircle className="w-3 h-3" /> Within Cap
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(req)}
                            className="px-2.5 py-1 rounded-lg bg-[#1F6F4A] hover:bg-[#2C9E62] text-white font-semibold flex items-center gap-1 text-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setActiveReq(req);
                              setReturnModalOpen(true);
                            }}
                            className="p-1 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#E0A93B]"
                            title="Return for correction"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveReq(req);
                              setRejectModalOpen(true);
                            }}
                            className="p-1 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D9534F]"
                            title="Reject request"
                          >
                            <XCircle className="w-3.5 h-3.5" />
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

      {/* DETAIL MODAL */}
      {activeReq && !returnModalOpen && !rejectModalOpen && (
        <Modal
          isOpen={!!activeReq}
          onClose={() => setActiveReq(null)}
          title={`Review Requisition: ${activeReq.referenceNumber}`}
          subtitle={`Submitted by ${activeReq.requesterName} on ${activeReq.neededByDate}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] space-y-1">
              <span className="font-bold text-[#D4AF37] block">Operational Justification:</span>
              <p className="text-[#F2EFE6] leading-relaxed">{activeReq.justification}</p>
            </div>

            <div>
              <span className="font-bold text-[#F2EFE6] mb-2 block">Line Items:</span>
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#132A20] text-[#A8B5AB]">
                  <tr>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Est. Unit Price</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {activeReq.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 text-[#F2EFE6]">{it.description}</td>
                      <td className="py-2 px-3 text-center text-[#A8B5AB]">{it.quantity} {it.unit}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#A8B5AB]">₦{it.estimatedUnitPrice.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#D4AF37]">₦{it.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#1F3A2D] bg-[#132A20] font-bold">
                    <td colSpan={3} className="py-2.5 px-3 text-right">Total Requisition Cost:</td>
                    <td className="py-2.5 px-3 text-right text-sm text-[#D4AF37] font-serif-heading">
                      ₦{activeReq.estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3.5 rounded-xl bg-[#07130E] border border-[#1F3A2D] flex items-center justify-between">
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Budget Impact Evaluation:</span>
                <span className="text-[#F2EFE6] font-semibold">
                  Department Cap: ₦{targetDept?.annualBudget.toLocaleString()} | Remaining: ₦{remainingBudget.toLocaleString()}
                </span>
              </div>
              {activeReq.estimatedTotal > remainingBudget ? (
                <span className="text-[#D9534F] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Exceeds Remaining Cap
                </span>
              ) : (
                <span className="text-[#3FB67A] font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Budget Authorized
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1F3A2D]">
              <div className="flex gap-2">
                <button
                  onClick={() => setReturnModalOpen(true)}
                  className="px-4 py-2 rounded-[10px] bg-[#132A20] text-[#E0A93B] font-semibold hover:bg-[#1F3A2D] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Return for Correction
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="px-4 py-2 rounded-[10px] bg-[#D9534F]/20 text-[#D9534F] font-semibold hover:bg-[#D9534F]/30 border border-[#D9534F]/40 flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Request
                </button>
              </div>

              <button
                onClick={() => handleApprove(activeReq)}
                className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110 shadow-lg"
              >
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" /> Approve & Forward to Procurement
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* RETURN FOR CORRECTION MODAL (Section 6.2: "comment required") */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Return Request for Correction"
        subtitle="Mandatory feedback for the Request Officer to modify line items or details."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Correction Comment *</label>
            <textarea
              rows={4}
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="e.g. Please reduce the quantity from 2 to 1 or attach the inventory audit verification report..."
              className="w-full p-3 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="px-4 py-2 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReturn}
              disabled={!commentText.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#E0A93B] text-[#07130E] font-semibold hover:brightness-110 disabled:opacity-40"
            >
              Return Request
            </button>
          </div>
        </div>
      </Modal>

      {/* REJECT MODAL (Section 6.2: "reason required") */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Purchase Requisition"
        subtitle="Mandatory reason for audit logging and notifying the requester."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Rejection Reason *</label>
            <textarea
              rows={4}
              required
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="e.g. Denied due to budgetary freeze on capital expenditures this fiscal quarter..."
              className="w-full p-3 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D9534F]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={!reasonText.trim()}
              className="px-5 py-2 rounded-[10px] bg-[#D9534F] text-white font-semibold hover:brightness-110 disabled:opacity-40"
            >
              Reject Requisition
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
