import React, { useState } from 'react';
import {
  PieChart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  History,
  Plus,
  Sliders,
  Shield,
  Building,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';

export const BudgetsModule: React.FC = () => {
  const {
    departments,
    budgetChanges,
    adjustBudget,
    addDepartment,
    deleteDepartment,
    updateDepartment,
    currentUser,
    currentOrganization,
  } = useApp();

  const isDeptHead = currentUser?.role === 'Department Head';
  const isSole = currentOrganization.type === 'sole_proprietorship';

  // Only Finance Officer can give or adjust budget caps for entities with multiple departments/chain of command
  const canAdjustBudget =
    currentUser?.role === 'Finance Officer' || (isSole && currentUser?.role === 'Organization Admin');

  // Admin, Finance, or Sole Proprietor can manage department structure
  const canManageDepartments =
    currentUser?.role === 'Organization Admin' ||
    currentUser?.role === 'Finance Officer' ||
    isSole;

  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  // Identify department for Department Head
  const userDept =
    orgDepts.find(
      (d) =>
        d.id === currentUser?.departmentId ||
        d.name.toLowerCase().includes(currentUser?.departmentId?.replace('dept-', '').toLowerCase() || '')
    ) || orgDepts[0] || departments[0];

  const visibleDepartments = isDeptHead ? [userDept].filter(Boolean) : orgDepts;
  const visibleChanges = isDeptHead
    ? budgetChanges.filter(
        (bc) => bc.departmentId === userDept?.id || bc.departmentName === userDept?.name
      )
    : budgetChanges.filter((bc) => {
        const foundDept = orgDepts.find((d) => d.id === bc.departmentId);
        return !!foundDept;
      });

  // State for adjust modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState(orgDepts[0]?.id || '');
  const [newBudgetAmount, setNewBudgetAmount] = useState<number>(50000000);
  const [reason, setReason] = useState('');

  // State for create department modal
  const [createDeptModalOpen, setCreateDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBudget, setNewDeptBudget] = useState<number>(20000000);

  // State for edit department modal
  const [editingDept, setEditingDept] = useState<{ id: string; name: string; budget: number } | null>(null);

  // State for delete department confirmation modal
  const [deleteConfirmDept, setDeleteConfirmDept] = useState<{ id: string; name: string } | null>(null);

  // Action feedback message
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenAdjust = (deptId: string) => {
    if (!canAdjustBudget) return;
    setTargetDeptId(deptId);
    const d = departments.find((dep) => dep.id === deptId);
    if (d) setNewBudgetAmount(d.annualBudget);
    setReason('');
    setAdjustModalOpen(true);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || newBudgetAmount <= 0) return;
    adjustBudget(targetDeptId, newBudgetAmount, reason);
    setAdjustModalOpen(false);
    setActionNotice({ type: 'success', message: 'Department budget cap successfully adjusted.' });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || newDeptBudget < 0) return;

    addDepartment(newDeptName.trim(), newDeptBudget, currentOrganization.id);
    setCreateDeptModalOpen(false);
    setNewDeptName('');
    setNewDeptBudget(20000000);
    setActionNotice({ type: 'success', message: `Department "${newDeptName.trim()}" created successfully.` });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleEditDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name.trim()) return;

    updateDepartment(editingDept.id, editingDept.name.trim(), editingDept.budget);
    setEditingDept(null);
    setActionNotice({ type: 'success', message: 'Department details updated successfully.' });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRequestDelete = (deptId: string, deptName: string) => {
    setDeleteConfirmDept({ id: deptId, name: deptName });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmDept) return;
    const result = deleteDepartment(deleteConfirmDept.id);
    if (!result.success) {
      setActionNotice({ type: 'error', message: result.message || 'Cannot delete department.' });
    } else {
      setActionNotice({ type: 'success', message: `Department "${deleteConfirmDept.name}" has been removed.` });
    }
    setDeleteConfirmDept(null);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const totalBudget = visibleDepartments.reduce((acc, d) => acc + d.annualBudget, 0);
  const totalSpent = visibleDepartments.reduce((acc, d) => acc + d.spent, 0);
  const totalCommitted = visibleDepartments.reduce((acc, d) => acc + d.committed, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
              {isDeptHead
                ? `${userDept?.name} - Department Budget & Allocation`
                : 'Department Budgets & Allocation Control'}
            </h2>
          </div>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            {isDeptHead
              ? `Restricted Departmental View: Allocation, commitments, and disbursements exclusively for ${userDept?.name}.`
              : 'Enforces statutory budget caps. Only Finance Officers can adjust budget caps in organizations with a chain of command.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManageDepartments && (
            <button
              onClick={() => setCreateDeptModalOpen(true)}
              className="py-2 px-3.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" /> Add Department
            </button>
          )}

          <div className="flex items-center gap-4 bg-[#132A20] px-4 py-2 rounded-xl border border-[#1F3A2D] text-xs">
            <div>
              <span className="text-[#A8B5AB] block text-[10px]">Total Budget Cap:</span>
              <span className="font-bold text-[#F2EFE6] font-serif-heading text-sm">
                ₦{totalBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-px h-7 bg-[#1F3A2D]" />
            <div>
              <span className="text-[#A8B5AB] block text-[10px]">Disbursed:</span>
              <span className="font-bold text-[#3FB67A] font-serif-heading text-sm">
                ₦{totalSpent.toLocaleString()}
              </span>
            </div>
            <div className="w-px h-7 bg-[#1F3A2D]" />
            <div>
              <span className="text-[#A8B5AB] block text-[10px]">Committed:</span>
              <span className="font-bold text-[#E0A93B] font-serif-heading text-sm">
                ₦{totalCommitted.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
            actionNotice.type === 'error'
              ? 'bg-[#D9534F]/15 border-[#D9534F]/40 text-[#D9534F]'
              : 'bg-[#3FB67A]/15 border-[#3FB67A]/40 text-[#3FB67A]'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="font-semibold">{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Department Cards Grid */}
      <div className={`grid gap-4 ${isDeptHead ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2'}`}>
        {visibleDepartments.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] text-[#A8B5AB]">
            <Building className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 opacity-70" />
            <p className="font-semibold text-sm text-[#F2EFE6]">No Departments Configured Yet</p>
            <p className="text-xs mt-1">Click &quot;Add Department&quot; above to create department units for your business.</p>
          </div>
        ) : (
          visibleDepartments.map((d) => {
            const used = d.spent + d.committed;
            const remaining = Math.max(0, d.annualBudget - used);
            const percentUsed = d.annualBudget > 0 ? Math.min(100, Math.round((used / d.annualBudget) * 100)) : 0;

            const isOver100 = used >= d.annualBudget;
            const isOver80 = percentUsed >= 80;

            return (
              <div
                key={d.id}
                className={`p-5 rounded-2xl border transition-all shadow-lg ${
                  isOver100
                    ? 'bg-[#D9534F]/10 border-[#D9534F]/60'
                    : isOver80
                    ? 'bg-[#E0A93B]/10 border-[#E0A93B]/50'
                    : 'bg-[#0D1F17] border-[#1F3A2D]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#D4AF37]" />
                    <h3 className="font-bold text-base font-serif-heading text-[#F2EFE6]">{d.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        isOver100
                          ? 'bg-[#D9534F] text-white'
                          : isOver80
                          ? 'bg-[#E0A93B] text-[#07130E]'
                          : 'bg-[#3FB67A]/20 text-[#3FB67A]'
                      }`}
                    >
                      {percentUsed}% Utilized
                    </span>

                    {/* Department Edit / Delete Actions */}
                    {canManageDepartments && (
                      <div className="flex items-center gap-1 ml-1 border-l border-[#1F3A2D] pl-2">
                        <button
                          type="button"
                          onClick={() => setEditingDept({ id: d.id, name: d.name, budget: d.annualBudget })}
                          className="p-1.5 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#A8B5AB] hover:text-[#D4AF37] transition-colors"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(d.id, d.name)}
                          className="p-1.5 rounded-lg bg-[#132A20] hover:bg-[#D9534F]/20 text-[#A8B5AB] hover:text-[#D9534F] transition-colors"
                          title="Remove Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-[#132A20] overflow-hidden flex mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-[#1F6F4A] to-[#3FB67A]"
                    style={{ width: d.annualBudget > 0 ? `${(d.spent / d.annualBudget) * 100}%` : '0%' }}
                    title="Spent Payments"
                  />
                  <div
                    className="h-full bg-[#E0A93B]"
                    style={{ width: d.annualBudget > 0 ? `${(d.committed / d.annualBudget) * 100}%` : '0%' }}
                    title="Committed Awards"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-[#132A20] p-3 rounded-xl mb-4">
                  <div>
                    <span className="text-[#A8B5AB] block text-[10px]">Annual Cap:</span>
                    <span className="font-bold text-[#F2EFE6]">₦{d.annualBudget.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#A8B5AB] block text-[10px]">Spent / Paid:</span>
                    <span className="font-bold text-[#3FB67A]">₦{d.spent.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#A8B5AB] block text-[10px]">Remaining:</span>
                    <span className={`font-bold ${isOver100 ? 'text-[#D9534F]' : 'text-[#D4AF37]'}`}>
                      ₦{remaining.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#A8B5AB]">
                    Commitments: ₦{d.committed.toLocaleString()}
                  </span>

                  {canAdjustBudget ? (
                    <button
                      onClick={() => handleOpenAdjust(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#07130E] hover:bg-[#132A20] border border-[#1F3A2D] text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Adjust Budget Cap
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#A8B5AB] italic">
                      Finance Officer Authorization Required
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE DEPARTMENT MODAL */}
      <Modal
        isOpen={createDeptModalOpen}
        onClose={() => setCreateDeptModalOpen(false)}
        title="Add New Department Unit"
        subtitle={`Create a distinct operational department for ${currentOrganization.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Department Name (Required)</label>
            <input
              type="text"
              required
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Design & Creative Services, Logistics, Works & Housing..."
              className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Initial Annual Budget Cap (₦)</label>
            <input
              type="number"
              min={0}
              required
              value={newDeptBudget}
              onChange={(e) => setNewDeptBudget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none font-mono"
            />
            <span className="text-[11px] text-[#D4AF37] mt-1 block">
              Formatted: ₦{newDeptBudget.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1F3A2D]">
            <button
              type="button"
              onClick={() => setCreateDeptModalOpen(false)}
              className="px-4 py-2 text-[#A8B5AB] hover:text-[#F2EFE6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110 shadow"
            >
              Create Department
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <Modal
          isOpen={!!editingDept}
          onClose={() => setEditingDept(null)}
          title="Edit Department"
          subtitle={`Update name or allocated cap for ${editingDept.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleEditDepartment} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Department Name</label>
              <input
                type="text"
                required
                value={editingDept.name}
                onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Annual Budget Allocation (₦)</label>
              <input
                type="number"
                min={0}
                required
                disabled={!canAdjustBudget}
                value={editingDept.budget}
                onChange={(e) => setEditingDept({ ...editingDept, budget: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none font-mono disabled:opacity-50"
              />
              {!canAdjustBudget && (
                <span className="text-[10px] text-[#A8B5AB] italic mt-1 block">
                  Budget allocation adjustments require Finance Officer authorization.
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="px-4 py-2 text-[#A8B5AB] hover:text-[#F2EFE6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110 shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* History table of budget changes (Section 7.3) */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
            {isDeptHead
              ? `Department Budget Adjustment History (${userDept?.name})`
              : 'Historical Budget Adjustment Audit Trail'}
          </h3>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Previous Cap</th>
                <th className="py-2.5 px-3 text-right">New Budget Cap</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3">Authorized By</th>
                <th className="py-2.5 px-3">Statutory Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {visibleChanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#A8B5AB]">
                    No budget adjustments logged yet.
                  </td>
                </tr>
              ) : (
                visibleChanges.map((c) => {
                  const diff = c.newBudget - c.previousBudget;
                  const isIncrease = diff >= 0;

                  return (
                    <tr key={c.id}>
                      <td className="py-2.5 px-3 font-mono text-[#A8B5AB]">
                        {new Date(c.changedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{c.departmentName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#A8B5AB]">
                        ₦{c.previousBudget.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F2EFE6]">
                        ₦{c.newBudget.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        <span className={isIncrease ? 'text-[#3FB67A]' : 'text-[#D9534F]'}>
                          {isIncrease ? '+' : ''}₦{diff.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{c.changedBy}</td>
                      <td className="py-2.5 px-3 text-[#A8B5AB] italic max-w-xs truncate" title={c.reason}>
                        &quot;{c.reason}&quot;
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST BUDGET CAP MODAL */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Statutory Department Budget Cap"
        subtitle={`Authorized for: ${departments.find((d) => d.id === targetDeptId)?.name || 'Department'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Target Department</label>
            <select
              value={targetDeptId}
              onChange={(e) => {
                setTargetDeptId(e.target.value);
                const dep = departments.find((d) => d.id === e.target.value);
                if (dep) setNewBudgetAmount(dep.annualBudget);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            >
              {orgDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (Current: ₦{d.annualBudget.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">
              New Annual Budget Allocation (₦)
            </label>
            <input
              type="number"
              min={100000}
              step={500000}
              value={newBudgetAmount}
              onChange={(e) => setNewBudgetAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none font-mono"
            />
            <span className="text-[11px] text-[#D4AF37] mt-1 block">
              Formatted: ₦{newBudgetAmount.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">
              Reason / Virement Authority (Required for Audit Trail)
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Supplementary statutory appropriation approved by Finance Committee..."
              className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1F3A2D]">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="px-4 py-2 text-[#A8B5AB] hover:text-[#F2EFE6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110 shadow"
            >
              Authorize Budget Change
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DEPARTMENT MODAL (Replaces browser window.confirm) */}
      {deleteConfirmDept && (
        <Modal
          isOpen={!!deleteConfirmDept}
          onClose={() => setDeleteConfirmDept(null)}
          title="Remove Department Unit"
          subtitle={`Confirmation for ${deleteConfirmDept.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#D9534F]/15 border border-[#D9534F]/40 text-[#F2EFE6] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D9534F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#D9534F] block text-xs">Confirm Removal</strong>
                <p className="text-[11px] text-[#A8B5AB] mt-1 leading-relaxed">
                  Are you sure you want to remove the <strong className="text-[#F2EFE6]">&quot;{deleteConfirmDept.name}&quot;</strong> department? This action will remove the department and its budget allocation from {currentOrganization.name}.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => setDeleteConfirmDept(null)}
                className="px-4 py-2 text-[#A8B5AB] hover:text-[#F2EFE6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-[#D9534F] hover:bg-[#c9302c] text-white font-semibold text-xs transition-all shadow"
              >
                Yes, Remove Department
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
