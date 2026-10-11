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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';

export const BudgetsModule: React.FC = () => {
  const {
    departments,
    budgetChanges,
    adjustBudget,
    currentUser,
    currentOrganization,
  } = useApp();

  const isDeptHead = currentUser?.role === 'Department Head';
  const canAdjustBudget =
    currentUser?.role === 'Finance Officer' || currentUser?.role === 'Organization Admin';

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

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState(orgDepts[0]?.id || 'dept-works');
  const [newBudgetAmount, setNewBudgetAmount] = useState<number>(90000000);
  const [reason, setReason] = useState('');

  const targetDept = orgDepts.find((d) => d.id === targetDeptId) || orgDepts[0] || departments[0];

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
              ? `Restricted Departmental View: Displaying allocation, commitments, and disbursements exclusively for ${userDept?.name}.`
              : 'Automatic budget guards enforce requisition and award caps. Warning amber at 80% and red stop at 100%.'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#132A20] px-4 py-2.5 rounded-xl border border-[#1F3A2D] text-xs">
          <div>
            <span className="text-[#A8B5AB] block text-[10px]">
              {isDeptHead ? 'Department Annual Cap:' : 'Corporate Total Cap:'}
            </span>
            <span className="font-bold text-[#F2EFE6] font-serif-heading text-sm">
              ₦{totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-8 bg-[#1F3A2D]" />
          <div>
            <span className="text-[#A8B5AB] block text-[10px]">Disbursed (Paid):</span>
            <span className="font-bold text-[#3FB67A] font-serif-heading text-sm">
              ₦{totalSpent.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-8 bg-[#1F3A2D]" />
          <div>
            <span className="text-[#A8B5AB] block text-[10px]">Committed:</span>
            <span className="font-bold text-[#E0A93B] font-serif-heading text-sm">
              ₦{totalCommitted.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Department Cards with 80% Warning & 100% Red Indicators (Section 7.3) */}
      <div className={`grid gap-4 ${isDeptHead ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2'}`}>
        {visibleDepartments.map((d) => {
          const used = d.spent + d.committed;
          const remaining = Math.max(0, d.annualBudget - used);
          const percentUsed = Math.min(100, Math.round((used / d.annualBudget) * 100));

          // 80% warning amber, 100% red (Section 7.3)
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
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-[#132A20] overflow-hidden flex mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[#1F6F4A] to-[#3FB67A]"
                  style={{ width: `${(d.spent / d.annualBudget) * 100}%` }}
                  title="Spent Payments"
                />
                <div
                  className="h-full bg-[#E0A93B]"
                  style={{ width: `${(d.committed / d.annualBudget) * 100}%` }}
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

              {canAdjustBudget && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleOpenAdjust(d.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#07130E] hover:bg-[#132A20] border border-[#1F3A2D] text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5 transition-colors active:scale-95"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Adjust Budget Cap
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Previous Cap</th>
                <th className="py-2.5 px-3 text-right">New Adjusted Cap</th>
                <th className="py-2.5 px-3">Virement / Adjustment Reason</th>
                <th className="py-2.5 px-3">Authorized By</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {visibleChanges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#A8B5AB]">
                    No budget adjustments recorded for this department. Fiscal cap is at baseline allocation.
                  </td>
                </tr>
              ) : (
                visibleChanges.map((bc) => (
                  <tr key={bc.id}>
                    <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{bc.departmentName}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#A8B5AB]">
                      ₦{bc.previousBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D4AF37]">
                      ₦{bc.newBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-[#F2EFE6]">{bc.reason}</td>
                    <td className="py-2.5 px-3 text-[#A8B5AB]">{bc.changedBy}</td>
                    <td className="py-2.5 px-3 text-[#A8B5AB]">
                      {new Date(bc.changedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST BUDGET MODAL (Finance Officer / Org Admin only) */}
      {canAdjustBudget && (
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          title={`Adjust Budget Cap: ${targetDept?.name}`}
          subtitle="Modifications write immutably to the audit log and budget history table."
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">
                New Annual Budget Allocation (₦) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none font-mono"
              />
              <span className="text-[10px] text-[#D4AF37] mt-1 block">
                Formatted: ₦{newBudgetAmount.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">
                Virement / Fiscal Justification Reason *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Budget augmented by ₦10,000,000 from corporate reserves following board approval..."
                className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              />
            </div>

            <div className="flex justify-between pt-2 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2 text-[#A8B5AB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason.trim()}
                className="px-5 py-2 rounded-[10px] bg-[#1F6F4A] text-white font-semibold hover:brightness-110 shadow disabled:opacity-40"
              >
                Save Fiscal Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
