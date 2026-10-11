import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { ProgressBar } from '../common/ProgressBar';
import { Modal } from '../common/Modal';
import { PurchaseRequest, RequestItem, RequestStatus } from '../../types';

interface RequestsModuleProps {
  initialSelectedId?: string;
}

export const RequestsModule: React.FC<RequestsModuleProps> = ({ initialSelectedId }) => {
  const {
    requests,
    departments,
    categories,
    currentUser,
    currentOrganization,
    createRequest,
    updateRequest,
  } = useApp();

  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const [selectedReq, setSelectedReq] = useState<PurchaseRequest | null>(() => {
    if (initialSelectedId) {
      return requests.find((r) => r.id === initialSelectedId) || null;
    }
    return null;
  });

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newModalOpen, setNewModalOpen] = useState<boolean>(false);

  // New Request Form State
  const [title, setTitle] = useState('');
  const [deptId, setDeptId] = useState(
    currentUser?.departmentId || orgDepts[0]?.id || 'dept-works'
  );
  const [priority, setPriority] = useState<'Low' | 'Normal' | 'High' | 'Urgent'>('Normal');
  const [neededByDate, setNeededByDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split('T')[0];
  });
  const [justification, setJustification] = useState('');
  const [items, setItems] = useState<RequestItem[]>([
    {
      id: 'item-1',
      description: '',
      category: categories[0]?.name || 'Building and Construction',
      subcategory: categories[0]?.subcategories[0] || 'Civil Works',
      quantity: 1,
      unit: 'Units',
      estimatedUnitPrice: 0,
      totalPrice: 0,
    },
  ]);

  const [editingReturnedId, setEditingReturnedId] = useState<string | null>(null);

  // Calculations for New Request
  const grandTotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
  const targetDept = departments.find((d) => d.id === deptId);
  const remainingDeptBudget = targetDept
    ? Math.max(0, targetDept.annualBudget - targetDept.spent - targetDept.committed)
    : 0;
  const isBudgetExceeded = grandTotal > remainingDeptBudget;

  const handleItemChange = (index: number, field: keyof RequestItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-update subcategory if category changes
    if (field === 'category') {
      const catObj = categories.find((c) => c.name === value);
      if (catObj && catObj.subcategories.length > 0) {
        newItems[index].subcategory = catObj.subcategories[0];
      }
    }

    // Auto calculate totalPrice
    if (field === 'quantity' || field === 'estimatedUnitPrice') {
      const q = field === 'quantity' ? Number(value) : newItems[index].quantity;
      const p = field === 'estimatedUnitPrice' ? Number(value) : newItems[index].estimatedUnitPrice;
      newItems[index].totalPrice = q * p;
    }

    setItems(newItems);
  };

  const addItemLine = () => {
    setItems([
      ...items,
      {
        id: 'item-' + Date.now(),
        description: '',
        category: categories[0]?.name || 'Building and Construction',
        subcategory: categories[0]?.subcategories[0] || 'Civil Works',
        quantity: 1,
        unit: 'Units',
        estimatedUnitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const removeItemLine = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSave = (status: RequestStatus) => {
    if (!title.trim()) return;

    if (editingReturnedId) {
      updateRequest(editingReturnedId, {
        title,
        priority,
        neededByDate,
        justification,
        items,
        estimatedTotal: grandTotal,
        status: 'Submitted', // Resubmit
      });
      setEditingReturnedId(null);
    } else {
      createRequest({
        title,
        departmentId: deptId,
        priority,
        neededByDate,
        justification,
        items,
        status,
      });
    }

    setNewModalOpen(false);
    // Reset form
    setTitle('');
    setJustification('');
    setItems([
      {
        id: 'item-1',
        description: '',
        category: categories[0]?.name || 'Building and Construction',
        subcategory: categories[0]?.subcategories[0] || 'Civil Works',
        quantity: 1,
        unit: 'Units',
        estimatedUnitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const openReturnedForEditing = (req: PurchaseRequest) => {
    setEditingReturnedId(req.id);
    setTitle(req.title);
    setDeptId(req.departmentId);
    setPriority(req.priority);
    setNeededByDate(req.neededByDate);
    setJustification(req.justification);
    setItems(req.items);
    setSelectedReq(null);
    setNewModalOpen(true);
  };

  // Filter list with strict RBAC enforcement
  const filtered = requests.filter((r) => {
    // Multi-tenant organization isolation
    const matchOrg = r.organizationId
      ? r.organizationId === currentOrganization.id
      : currentOrganization.id === 'org-emerald';
    if (!matchOrg) return false;

    // RBAC: Department Heads only see their department's requests
    if (currentUser?.role === 'Department Head') {
      const matchDept =
        r.departmentId === currentUser.departmentId ||
        r.departmentName.toLowerCase().includes(currentUser.departmentId?.replace('dept-', '').toLowerCase() || '');
      if (!matchDept) return false;
    }
    // RBAC: Request Officers see requests from their department or created by them
    if (currentUser?.role === 'Request Officer') {
      const isOwner = r.requesterId === currentUser.id || r.requesterName === currentUser.fullName;
      const isDept = r.departmentId === currentUser.departmentId;
      if (!isOwner && !isDept) return false;
    }

    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.referenceNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0D1F17] p-4 rounded-2xl border border-[#1F3A2D]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ref, title, department..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
            />
            <Search className="w-3.5 h-3.5 text-[#A8B5AB] absolute left-3 top-2.5" />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none shrink-0"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Returned for Correction">Returned</option>
            <option value="Approved by Department">Approved</option>
            <option value="Converted to Tender">Converted to Tender</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingReturnedId(null);
            setNewModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" /> New Request
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] uppercase tracking-wider font-semibold border-b border-[#1F3A2D] sticky top-0">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Request Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Estimated Cost</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Needed By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A8B5AB]">
                    <FileText className="w-8 h-8 mx-auto text-[#1F3A2D] mb-2" />
                    No purchase requests match the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((req, idx) => (
                  <tr
                    key={req.id}
                    className={`hover:bg-[#132A20]/70 cursor-pointer transition-colors ${
                      idx % 2 === 1 ? 'bg-[#07130E]/30' : ''
                    }`}
                    onClick={() => setSelectedReq(req)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#E8CF7A]">{req.referenceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-[#F2EFE6] max-w-xs truncate">{req.title}</td>
                    <td className="py-3 px-4 text-[#A8B5AB]">{req.departmentName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#F2EFE6]">
                      ₦{req.estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          req.priority === 'Urgent'
                            ? 'bg-[#D9534F]/20 text-[#D9534F]'
                            : req.priority === 'High'
                            ? 'bg-[#E0A93B]/20 text-[#E0A93B]'
                            : 'bg-[#132A20] text-[#A8B5AB]'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusChip status={req.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-[#A8B5AB]">{req.neededByDate}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReq(req);
                        }}
                        className="p-1 rounded hover:bg-[#1F3A2D] text-[#D4AF37]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW REQUEST MODAL / DRAWER WITH SMART BUDGET BAR */}
      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title={editingReturnedId ? 'Edit & Resubmit Purchase Request' : 'New Purchase Requisition'}
        subtitle="Specify line items, estimates, and justification for departmental review"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5 text-xs">
          {/* Top section: Title, Department, Priority, Needed By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[#A8B5AB] font-medium mb-1">Requisition Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Procurement of High-Capacity 500kVA Soundproof Generator"
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Procuring Department</label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              >
                {orgDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A8B5AB] font-medium mb-1">Needed By Date</label>
                <input
                  type="date"
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#A8B5AB] font-medium mb-1">Business Justification *</label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain the operational necessity and consequence if not procured..."
                className="w-full px-3.5 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* ITEM LINES WITH LIVE CALCULATION */}
          <div className="pt-2 border-t border-[#1F3A2D]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#F2EFE6]">Requisition Items & Estimates</span>
              <button
                type="button"
                onClick={addItemLine}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item Line
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#132A20] border border-[#1F3A2D] grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Item description or spec..."
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3 sm:col-span-1">
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] outline-none text-center"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] outline-none text-center"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Unit Price (₦)"
                      value={item.estimatedUnitPrice || ''}
                      onChange={(e) => handleItemChange(idx, 'estimatedUnitPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] outline-none text-right font-mono"
                    />
                  </div>

                  <div className="col-span-5 sm:col-span-1 text-right font-mono font-bold text-[#E8CF7A] truncate">
                    ₦{item.totalPrice.toLocaleString()}
                  </div>

                  <div className="col-span-1 text-right">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemLine(idx)}
                        className="text-[#D9534F] hover:bg-[#07130E] p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SMART BEHAVIOR: Real-Time Department Budget Card (Section 6.1) */}
          <div className="p-4 rounded-xl bg-[#07130E] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#A8B5AB]">Calculated Requisition Total:</div>
              <div className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
                ₦{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Department Budget Status Bar */}
            <div className="flex-1 max-w-sm">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#A8B5AB]">Dept Remaining Budget:</span>
                <span className="font-mono font-semibold text-[#F2EFE6]">
                  ₦{remainingDeptBudget.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#132A20] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isBudgetExceeded ? 'bg-[#D9534F] w-full' : 'bg-[#3FB67A]'
                  }`}
                  style={{
                    width: isBudgetExceeded
                      ? '100%'
                      : `${Math.min(100, (grandTotal / (remainingDeptBudget || 1)) * 100)}%`,
                  }}
                />
              </div>

              {isBudgetExceeded ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[#D9534F] mt-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>This exceeds your department&apos;s remaining budget</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-[#3FB67A] mt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Within authorized departmental budget</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1F3A2D]">
            <button
              type="button"
              onClick={() => setNewModalOpen(false)}
              className="px-4 py-2 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB]"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave('Draft')}
                className="px-4 py-2 rounded-[10px] bg-[#132A20] text-[#E8CF7A] font-semibold hover:bg-[#1F3A2D]"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave('Submitted')}
                disabled={!title.trim() || grandTotal <= 0}
                className="px-6 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110 shadow-lg disabled:opacity-40"
              >
                Submit Requisition
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* REQUEST DETAIL MODAL WITH LIFECYCLE STEPPER & RETURNED NOTE */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={`Requisition: ${selectedReq.referenceNumber}`}
          subtitle={selectedReq.title}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Horizontal Lifecycle Stepper (Section 6) */}
            <ProgressBar
              currentStage={
                selectedReq.status === 'Converted to Tender'
                  ? 'Procurement'
                  : selectedReq.status === 'Approved by Department'
                  ? 'Procurement'
                  : selectedReq.status === 'Submitted'
                  ? 'Dept Approval'
                  : 'Request'
              }
            />

            {/* Returned for Correction Note (Section 6.1: "shows reviewer's comment in a gold-bordered note") */}
            {selectedReq.status === 'Returned for Correction' && (
              <div className="p-4 rounded-xl bg-[#07130E] border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] space-y-2">
                <div className="flex items-center justify-between text-[#D4AF37] font-bold">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> Reviewer Correction Comment:
                  </span>
                  <span className="text-[11px] text-[#A8B5AB]">By {selectedReq.reviewerName}</span>
                </div>
                <p className="text-xs text-[#F2EFE6] italic leading-relaxed">
                  &quot;{selectedReq.reviewComment || 'Please modify the estimates or provide missing documentation.'}&quot;
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => openReturnedForEditing(selectedReq)}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold text-xs hover:brightness-110"
                  >
                    Edit & Resubmit Request →
                  </button>
                </div>
              </div>
            )}

            {/* Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#132A20] p-4 rounded-xl border border-[#1F3A2D]">
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Department:</span>
                <span className="font-semibold text-[#F2EFE6]">{selectedReq.departmentName}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Requested By:</span>
                <span className="font-semibold text-[#F2EFE6]">{selectedReq.requesterName}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Needed By:</span>
                <span className="font-semibold text-[#F2EFE6]">{selectedReq.neededByDate}</span>
              </div>
              <div>
                <span className="text-[#A8B5AB] block text-[11px]">Priority / Status:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-[#F2EFE6]">{selectedReq.priority}</span>
                  <StatusChip status={selectedReq.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Justification */}
            <div className="p-3.5 rounded-xl bg-[#07130E] border border-[#1F3A2D]">
              <span className="text-[#A8B5AB] font-semibold block mb-1">Operational Justification:</span>
              <p className="text-[#F2EFE6] leading-relaxed">{selectedReq.justification}</p>
            </div>

            {/* Items Table */}
            <div>
              <span className="font-bold text-[#F2EFE6] mb-2 block">Line Items Breakdown:</span>
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Est. Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {selectedReq.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 font-medium text-[#F2EFE6]">{it.description}</td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{it.category} ({it.subcategory})</td>
                      <td className="py-2.5 px-3 text-center text-[#F2EFE6]">{it.quantity} {it.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#A8B5AB]">
                        ₦{it.estimatedUnitPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D4AF37]">
                        ₦{it.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#1F3A2D] bg-[#132A20] font-bold text-[#F2EFE6]">
                    <td colSpan={4} className="py-3 px-3 text-right uppercase">
                      Total Estimated Value:
                    </td>
                    <td className="py-3 px-3 text-right font-serif-heading text-sm text-[#D4AF37]">
                      ₦{selectedReq.estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1F3A2D]">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-5 py-2 rounded-[10px] bg-[#132A20] text-[#F2EFE6] font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
