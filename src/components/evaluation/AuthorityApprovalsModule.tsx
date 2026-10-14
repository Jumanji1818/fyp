import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, ShieldCheck, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/** Approving Authority sign-off for awards above the organisation's approval threshold. */
export const AuthorityApprovalsModule: React.FC = () => {
  const { tenders, bids, departments, purchaseOrders, authorityApproveAward, currentOrganization, settings } = useApp();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const orgTenders = tenders.filter((t) =>
    t.organizationId ? t.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const pending = orgTenders.filter((t) => t.awaitingAuthorityApproval);
  const decided = orgTenders.filter((t) => t.status === 'Awarded').slice(0, 5);
  const threshold = currentOrganization.approvalThreshold || settings.approvalThreshold;
  const naira = (n: number) => `\u20a6${n.toLocaleString()}`;

  const decide = (tenderId: string, approved: boolean) => {
    const reason = (notes[tenderId] || '').trim();
    if (!approved && !reason) {
      setMessage('A reason is required when rejecting an award.');
      return;
    }
    authorityApproveAward(tenderId, approved, reason || undefined);
    setMessage(approved ? 'Award approved. The Purchase Order has been issued to the vendor.' : 'Award rejected and returned to the Procurement Officer.');
    setTimeout(() => setMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">High-Value Award Approvals</span>
        <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6] mt-0.5">Awards above {naira(threshold)}</h2>
        <p className="text-xs text-[#A8B5AB] mt-1">
          No Purchase Order is issued until you approve. Rejecting returns the tender to the Procurement Officer.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-[#1F6F4A]/25 border border-[#3FB67A]/40 text-xs text-[#F2EFE6]">{message}</div>
      )}

      {pending.length === 0 ? (
        <div className="p-12 text-center text-[#A8B5AB] bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] text-xs">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-[#3FB67A]" />
          Nothing is waiting for your sign-off.
        </div>
      ) : (
        pending.map((t) => {
          const bid = bids.find((b) => b.id === t.pendingAuthorityBidId);
          const dept = departments.find((d) => d.id === t.departmentId);
          if (!bid) return null;
          return (
            <div key={t.id} className="p-5 rounded-2xl bg-[#0D1F17] border border-[#D4AF37]/40 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] text-[#A8B5AB]">{t.referenceNumber} · {dept?.name || t.departmentName}</div>
                  <h3 className="text-lg font-bold font-serif-heading text-[#F2EFE6]">{t.title}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#A8B5AB]">Recommended award</div>
                  <div className="text-xl font-bold text-[#E0A93B]">{naira(bid.totalAmount)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><div className="text-[#A8B5AB]">Vendor</div><div className="text-[#F2EFE6] font-semibold">{bid.vendorName}</div></div>
                <div><div className="text-[#A8B5AB]">Bid reference</div><div className="text-[#F2EFE6] font-semibold">{bid.referenceNumber}</div></div>
                <div><div className="text-[#A8B5AB]">Proposed delivery</div><div className="text-[#F2EFE6] font-semibold">{bid.proposedDeliveryDate}</div></div>
                <div><div className="text-[#A8B5AB]">Weighted score</div><div className="text-[#F2EFE6] font-semibold">{bid.computedScores ? bid.computedScores.totalWeightedScore.toFixed(1) : 'n/a'}</div></div>
              </div>
              <textarea
                value={notes[t.id] || ''}
                onChange={(e) => setNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                placeholder="Comment (required if rejecting)"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={() => decide(t.id, false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D9534F]/50 text-[#D9534F] text-xs font-semibold hover:bg-[#D9534F]/15">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => decide(t.id, true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/60 text-[#F2EFE6] text-xs font-semibold hover:brightness-110">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Approve &amp; issue PO
                </button>
              </div>
            </div>
          );
        })
      )}

      {decided.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
          <h3 className="text-sm font-bold text-[#F2EFE6] mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-[#D4AF37]" /> Recently awarded</h3>
          <ul className="space-y-2 text-xs">
            {decided.map((t) => {
              const po = purchaseOrders.find((p) => p.tenderId === t.id);
              return (
                <li key={t.id} className="flex items-center justify-between text-[#A8B5AB]">
                  <span>{t.referenceNumber} · {t.title}</span>
                  <span className="flex items-center gap-1 text-[#3FB67A]"><Clock className="w-3 h-3" />{po ? po.referenceNumber : 'Awarded'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
