import React, { useState } from 'react';
import { CheckCircle, XCircle, ShieldAlert, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BudgetOverrideRequestsModule: React.FC = () => {
  const { budgetOverrideRequests, decideBudgetOverride, currentOrganization } = useApp();
  const [comments, setComments] = useState<Record<string, string>>({});
  const requests = budgetOverrideRequests
    .filter((request) => request.organizationId === currentOrganization.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = requests.filter((request) => request.status === 'Pending');

  const decide = (id: string, approved: boolean) => {
    const comment = comments[id]?.trim();
    if (!comment) {
      window.alert('Add a Finance decision comment before approving or rejecting.');
      return;
    }
    decideBudgetOverride(id, approved, comment);
    setComments((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#1F3A2D] bg-[#0D1F17] p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Finance Budget Override Requests</h2>
        </div>
        <p className="mt-1 text-sm text-[#A8B5AB]">Review requests from Procurement. Approval permits the award to continue, but high-value awards still require Approving Authority sign-off.</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#E0A93B]"><Clock className="h-4 w-4" /> {pending.length} awaiting Finance decision</div>
      </header>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-[#1F3A2D] bg-[#0D1F17] p-8 text-center text-sm text-[#A8B5AB]">No budget override requests have been submitted.</div>
      ) : requests.map((request) => (
        <article key={request.id} className="space-y-4 rounded-2xl border border-[#1F3A2D] bg-[#0D1F17] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#F2EFE6]">{request.tenderReference} · {request.vendorName}</h3>
              <p className="mt-1 text-xs text-[#A8B5AB]">{request.departmentName} · Requested by {request.requestedByName}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${request.status === 'Pending' ? 'border-[#E0A93B]/50 bg-[#E0A93B]/10 text-[#E0A93B]' : request.status === 'Approved' ? 'border-[#3FB67A]/50 bg-[#3FB67A]/10 text-[#3FB67A]' : 'border-[#D9534F]/50 bg-[#D9534F]/10 text-[#D9534F]'}`}>{request.status}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[#132A20] p-3"><div className="text-xs text-[#A8B5AB]">Award amount</div><div className="mt-1 font-semibold text-[#F2EFE6]">₦{request.awardAmount.toLocaleString()}</div></div>
            <div className="rounded-lg bg-[#132A20] p-3"><div className="text-xs text-[#A8B5AB]">Remaining budget</div><div className="mt-1 font-semibold text-[#F2EFE6]">₦{request.remainingBudget.toLocaleString()}</div></div>
            <div className="rounded-lg bg-[#132A20] p-3"><div className="text-xs text-[#A8B5AB]">Budget gap</div><div className="mt-1 font-semibold text-[#E0A93B]">₦{Math.max(0, request.awardAmount - request.remainingBudget).toLocaleString()}</div></div>
          </div>
          <div><div className="text-xs font-semibold text-[#A8B5AB]">Procurement justification</div><p className="mt-1 whitespace-pre-wrap text-sm text-[#F2EFE6]">{request.reason}</p></div>
          {request.status === 'Pending' ? (
            <div className="space-y-3">
              <textarea value={comments[request.id] || ''} onChange={(event) => setComments((prev) => ({ ...prev, [request.id]: event.target.value }))} rows={2} placeholder="Required Finance decision comment" className="w-full rounded-xl border border-[#1F3A2D] bg-[#07130E] p-3 text-sm text-[#F2EFE6] outline-none focus:border-[#D4AF37]" />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => decide(request.id, true)} className="inline-flex items-center gap-2 rounded-lg bg-[#1F6F4A] px-4 py-2 text-sm font-semibold text-white"><CheckCircle className="h-4 w-4" /> Approve request</button>
                <button onClick={() => decide(request.id, false)} className="inline-flex items-center gap-2 rounded-lg border border-[#D9534F]/50 bg-[#D9534F]/10 px-4 py-2 text-sm font-semibold text-[#D9534F]"><XCircle className="h-4 w-4" /> Reject request</button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#1F3A2D] p-3 text-sm text-[#A8B5AB]">
              <div>Finance decision by {request.decidedByName || 'Finance Officer'} on {request.decidedAt ? new Date(request.decidedAt).toLocaleString() : '—'}</div>
              {request.financeComment && <p className="mt-1 text-[#F2EFE6]">{request.financeComment}</p>}
            </div>
          )}
        </article>
      ))}
    </div>
  );
};
