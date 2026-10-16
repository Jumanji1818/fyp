import React from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Building,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  Plus,
  Star,
  ArrowRight,
  ShieldAlert,
  Percent,
  Truck,
  Scale,
  Compass,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { StatusChip } from '../common/StatusChip';
import { UserRole } from '../../types';

interface RoleDashboardProps {
  onNavigate: (tabId: string, itemId?: string) => void;
  onOpenNewRequest: () => void;
  onOpenWalkthrough?: () => void;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({
  onNavigate,
  onOpenNewRequest,
  onOpenWalkthrough,
}) => {
  const {
    currentUser,
    departments,
    requests,
    tenders,
    bids,
    purchaseOrders,
    payments,
    vendors,
    users,
    auditLogs,
    settings,
    currentOrganization,
  } = useApp();

  const role = (currentUser?.role || 'Organization Admin') as UserRole;
  const currencySymbol =
    currentOrganization?.currency === 'NGN' ||
    currentOrganization?.currency === 'Naira' ||
    !currentOrganization?.currency
      ? '₦'
      : currentOrganization.currency;

  // Multi-tenant organization data scoping:
  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const orgRequests = requests.filter((r) =>
    r.organizationId ? r.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const orgTenders = tenders.filter((t) =>
    t.organizationId ? t.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const orgPOs = purchaseOrders.filter((po) =>
    po.organizationId ? po.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  const orgPayments = payments.filter((p) =>
    orgPOs.some((po) => po.id === p.purchaseOrderId || po.referenceNumber === p.poReference)
  );

  const orgUsers = users.filter((u) => {
    if (u.role === 'Vendor') return false;
    return u.organizationId ? u.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald';
  });

  const orgAuditLogs = auditLogs.filter((log) => {
    if (log.organizationId) {
      return log.organizationId === currentOrganization.id;
    }
    return currentOrganization.id === 'org-emerald' || log.userName === currentUser?.fullName;
  });

  // Whitelisted vendors for this organization:
  const myVendors = vendors.filter((v) =>
    currentOrganization.id === 'org-emerald' ? v.inMyVendors : false
  );

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Compute common metrics strictly scoped to the active organization
  const totalSpendThisYear = orgPayments.reduce((acc, p) => acc + p.amount, 0);
  const activeTenders = orgTenders.filter((t) => t.status === 'Open');
  const isSole = currentOrganization.type === 'sole_proprietorship';
  const pendingRequestsCount = orgRequests.filter((r) => r.status === 'Submitted').length;
  const pendingStaffCount = orgUsers.filter((u) => u.status === 'Pending').length;
  const overduePOs = orgPOs.filter((po) => {
    if (po.status === 'Closed' || po.status === 'Cancelled' || po.status === 'Delivered') return false;
    return new Date(po.expectedDeliveryDate).getTime() < new Date().getTime();
  });

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F3D2A] via-[#0D1F17] to-[#132A20] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
            {currentOrganization.name} · Role Portal
          </div>
          <h2 className="text-2xl font-bold font-serif-heading text-[#F2EFE6] mt-1">
            {getGreeting()}, {currentUser?.fullName}
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            You are operating under the <strong>{role}</strong> profile with authorized data governance permissions.
          </p>
        </div>

        {/* Quick action buttons per role */}
        <div className="flex items-center gap-2.5">
          {onOpenWalkthrough && (
            <button
              onClick={onOpenWalkthrough}
              className="py-2.5 px-3.5 rounded-[10px] bg-[#132A20] hover:bg-[#1F6F4A] border border-[#D4AF37]/50 text-[#D4AF37] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow active:scale-95"
              title="Launch interactive procurement lifecycle guide"
            >
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden sm:inline">Procurement Guide</span>
            </button>
          )}

          {role === 'Request Officer' && (
            <button
              onClick={onOpenNewRequest}
              className="py-2.5 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] text-xs font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" /> New Purchase Request
            </button>
          )}

          {role === 'Procurement Officer' && (
            <button
              onClick={() => onNavigate('requests')}
              className="py-2.5 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] text-xs font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg"
            >
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" /> Convert Approved Requests
            </button>
          )}

          {role === 'Finance Officer' && (
            <button
              onClick={() => onNavigate('payments')}
              className="py-2.5 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] text-xs font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg"
            >
              <CreditCard className="w-4 h-4 text-[#D4AF37]" /> Record Payment Voucher
            </button>
          )}

          {role === 'Vendor' && (
            <button
              onClick={() => onNavigate('vendor_tenders')}
              className="py-2.5 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] text-xs font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg"
            >
              <Scale className="w-4 h-4 text-[#D4AF37]" /> Browse Open Tenders
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          ROLE 1: ORGANIZATION ADMIN DASHBOARD (Section 7.1)
          ========================================================================= */}
      {role === 'Organization Admin' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate('payments')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Total Annual Spend</span>
                <DollarSign className="w-4 h-4 text-[#3FB67A]" />
              </div>
              <div className="mt-2 text-2xl font-bold font-serif-heading text-[#F2EFE6]">
                <AnimatedCounter value={totalSpendThisYear} prefix={currencySymbol} />
              </div>
              <div className="text-[11px] text-[#3FB67A] mt-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Fully audited payments
                </span>
                <span className="text-[10px] text-[#A8B5AB] group-hover:text-[#D4AF37]">View Ledger →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('tenders')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Active Tenders</span>
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="mt-2 text-2xl font-bold font-serif-heading text-[#D4AF37]">
                <AnimatedCounter value={activeTenders.length} />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>{orgTenders.filter((t) => t.status === 'Closed' || t.status === 'Under Evaluation').length} closed awaiting evaluation</span>
                <span className="text-[10px] text-[#A8B5AB] group-hover:text-[#D4AF37]">Manage →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('vendors')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#4F9DBF]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Registered Vendors</span>
                <Building className="w-4 h-4 text-[#4F9DBF]" />
              </div>
              <div className="mt-2 text-2xl font-bold font-serif-heading text-[#F2EFE6]">
                <AnimatedCounter value={vendors.length} />
              </div>
              <div className="text-[11px] text-[#4F9DBF] mt-1 flex items-center justify-between">
                <span>{myVendors.length} in My Vendors whitelist</span>
                <span className="text-[10px] text-[#A8B5AB] group-hover:text-[#D4AF37]">Directory →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate(isSole ? 'approvals' : pendingStaffCount > 0 ? 'users' : 'approvals')}
              className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-lg cursor-pointer hover:border-[#D4AF37]/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB]">
                <span>{isSole ? 'Requisitions Pending Approval' : 'Pending Approvals'}</span>
                {isSole ? <CheckCircle className="w-4 h-4 text-[#E0A93B]" /> : <Users className="w-4 h-4 text-[#E0A93B]" />}
              </div>
              <div className="mt-2 text-2xl font-bold font-serif-heading text-[#E0A93B]">
                <AnimatedCounter value={isSole ? pendingRequestsCount : (pendingStaffCount || pendingRequestsCount)} />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1">
                {isSole
                  ? `${pendingRequestsCount} requisition${pendingRequestsCount === 1 ? '' : 's'} awaiting your authorization`
                  : pendingStaffCount > 0
                  ? 'Staff accounts awaiting role assignment'
                  : `${pendingRequestsCount} requisitions in approval queue`}
              </div>
            </div>
          </div>

          {/* Charts & Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spend by Department Bar Chart */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                  Department Budget Spend Utilization
                </h3>
                <span className="text-[11px] text-[#D4AF37]">Live Drift Aggregation</span>
              </div>

              <div className="space-y-4">
                {orgDepts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#A8B5AB]">
                    No departmental budgets configured yet for {currentOrganization.name}.
                  </div>
                ) : (
                  orgDepts.map((dept) => {
                    const percentUsed = dept.annualBudget > 0
                      ? Math.min(100, Math.round(((dept.spent + dept.committed) / dept.annualBudget) * 100))
                      : 0;
                    const isHigh = percentUsed >= 80;
                    const isFull = percentUsed >= 100;

                    return (
                      <div key={dept.id} className="text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-[#F2EFE6]">{dept.name}</span>
                          <span className="font-mono text-[#A8B5AB]">
                            {currencySymbol}{(dept.spent + dept.committed).toLocaleString()} / {currencySymbol}{dept.annualBudget.toLocaleString()} (
                            <strong className={isFull ? 'text-[#D9534F]' : isHigh ? 'text-[#E0A93B]' : 'text-[#3FB67A]'}>
                              {percentUsed}%
                            </strong>
                            )
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#132A20] rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-[#1F6F4A] to-[#3FB67A] transition-all duration-700"
                            style={{ width: dept.annualBudget > 0 ? `${(dept.spent / dept.annualBudget) * 100}%` : '0%' }}
                            title={`Spent: ${currencySymbol}${dept.spent.toLocaleString()}`}
                          />
                          <div
                            className="h-full bg-[#E0A93B] transition-all duration-700"
                            style={{ width: dept.annualBudget > 0 ? `${(dept.committed / dept.annualBudget) * 100}%` : '0%' }}
                            title={`Committed: ${currencySymbol}${dept.committed.toLocaleString()}`}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[#1F3A2D] flex items-center justify-between text-[11px] text-[#A8B5AB]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#3FB67A]" /> Disbursed Payments
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#E0A93B]" /> Committed Awards
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('budgets')}
                  className="text-[#D4AF37] hover:underline font-semibold"
                >
                  Manage Budgets →
                </button>
              </div>
            </div>

            {/* Tender Status Breakdown */}
            <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6] mb-3">
                  Tender Status Breakdown
                </h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    { label: 'Open for Bidding', count: orgTenders.filter((t) => t.status === 'Open').length, color: '#D4AF37' },
                    { label: 'Awaiting Evaluation', count: orgTenders.filter((t) => t.status === 'Closed' || t.status === 'Under Evaluation').length, color: '#4F9DBF' },
                    { label: 'Awarded Contracts', count: orgTenders.filter((t) => t.status === 'Awarded').length, color: '#3FB67A' },
                    { label: 'Cancelled / Archived', count: orgTenders.filter((t) => t.status === 'Cancelled').length, color: '#A8B5AB' },
                  ].map((s) => (
                    <div key={s.label} className="p-2.5 rounded-xl bg-[#132A20] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[#F2EFE6]">{s.label}</span>
                      </div>
                      <span className="font-bold font-mono text-[#D4AF37]">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Staff Approvals Card */}
              {pendingStaffCount > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-[#E0A93B]/10 border border-[#E0A93B]/30 text-xs">
                  <div className="flex items-center justify-between text-[#E0A93B] font-semibold mb-1">
                    <span>{pendingStaffCount} Staff Awaiting Role</span>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] text-[#A8B5AB]">
                    Assign roles in Users Management to permit staff access.
                  </p>
                  <button
                    onClick={() => onNavigate('users')}
                    className="mt-2 text-[11px] text-[#D4AF37] font-semibold hover:underline"
                  >
                    Review staff approvals →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Audit Activity Feed */}
          <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                Recent Audit Trail Actions (Immutable)
              </h3>
              <button onClick={() => onNavigate('audit')} className="text-xs text-[#D4AF37] hover:underline">
                View All Audit Logs →
              </button>
            </div>

            <div className="divide-y divide-[#1F3A2D] text-xs">
              {orgAuditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#A8B5AB]">
                  No audit logs recorded for this organization yet.
                </div>
              ) : (
                orgAuditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      <div>
                        <div className="font-semibold text-[#F2EFE6]">
                          {log.action} <span className="font-mono text-[#D4AF37]">({log.recordReference})</span>
                        </div>
                        <div className="text-[11px] text-[#A8B5AB]">
                          By {log.userName} ({log.role}) · {log.details || log.newValue}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-[#A8B5AB] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 2: REQUEST OFFICER DASHBOARD (Section 7.1)
          ========================================================================= */}
      {role === 'Request Officer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigate('requests')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Total Requisitions Raised</span>
                <FileText className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#F2EFE6] mt-1">
                <AnimatedCounter value={orgRequests.length} />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>All draft & submitted requests</span>
                <span className="text-[#D4AF37]">View →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('requests')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#E0A93B]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Submitted / Under Review</span>
                <Clock className="w-4 h-4 text-[#E0A93B]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#E0A93B] mt-1">
                <AnimatedCounter value={orgRequests.filter((r) => r.status === 'Submitted').length} />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>In departmental review</span>
                <span className="text-[#E0A93B]">Track →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('requests')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Approved & Tendered</span>
                <CheckCircle className="w-4 h-4 text-[#3FB67A]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#3FB67A] mt-1">
                <AnimatedCounter
                  value={
                    orgRequests.filter(
                      (r) => r.status === 'Approved by Department' || r.status === 'Converted to Tender'
                    ).length
                  }
                />
              </div>
              <div className="text-[11px] text-[#3FB67A] mt-1 flex items-center justify-between">
                <span>Converted to tender</span>
                <span className="text-[#3FB67A]">Inspect →</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                Recent Purchase Requests
              </h3>
              <button onClick={() => onNavigate('requests')} className="text-xs text-[#D4AF37] hover:underline">
                View All Requests →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {orgRequests.length === 0 ? (
                <div className="py-6 text-center text-[#A8B5AB]">
                  No purchase requisitions raised yet for {currentOrganization.name}.
                </div>
              ) : (
                orgRequests.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onNavigate('requests', r.id)}
                    className="p-3 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#D4AF37]">{r.referenceNumber}</span>
                        <span className="font-semibold text-[#F2EFE6]">{r.title}</span>
                      </div>
                      <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                        Needed: {r.neededByDate} · Est. Total: {currencySymbol}{r.estimatedTotal.toLocaleString()}
                      </div>
                    </div>
                    <StatusChip status={r.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 3: DEPARTMENT HEAD DASHBOARD (Section 7.1)
          ========================================================================= */}
      {role === 'Department Head' && (() => {
        const userDept =
          orgDepts.find(
            (d) =>
              d.id === currentUser?.departmentId ||
              d.name.toLowerCase().includes(currentUser?.departmentId?.replace('dept-', '').toLowerCase() || '')
          ) || orgDepts[0];

        const deptHeadRemaining = userDept
          ? Math.max(0, userDept.annualBudget - userDept.spent - userDept.committed)
          : 0;

        const deptRequests = orgRequests.filter(
          (r) =>
            r.departmentId === userDept?.id ||
            r.departmentName.toLowerCase().includes(userDept?.name.toLowerCase() || '')
        );

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => onNavigate('approvals')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#E0A93B]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Awaiting My Approval</span>
                  <CheckCircle className="w-4 h-4 text-[#E0A93B]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#E0A93B] mt-1">
                  <AnimatedCounter value={deptRequests.filter((r) => r.status === 'Submitted').length} />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>Requires {userDept?.name || 'Department'} sign-off</span>
                  <span className="text-[#E0A93B]">Open Inbox →</span>
                </div>
              </div>

              <div
                onClick={() => onNavigate('requests')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Approved This Month</span>
                  <TrendingUp className="w-4 h-4 text-[#3FB67A]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#3FB67A] mt-1">
                  <AnimatedCounter
                    value={
                      deptRequests.filter(
                        (r) => r.status === 'Approved by Department' || r.status === 'Converted to Tender'
                      ).length
                    }
                  />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>Forwarded to Procurement</span>
                  <span className="text-[#3FB67A]">View All →</span>
                </div>
              </div>

              <div
                onClick={() => onNavigate('budgets')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Department Budget Remaining</span>
                  <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#D4AF37] mt-1">
                  {currencySymbol}{deptHeadRemaining.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>{userDept?.name || 'Department'}</span>
                  <span className="text-[#D4AF37]">Budget Details →</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                  Requisitions Requiring Review ({userDept?.name || 'Department'})
                </h3>
                <button onClick={() => onNavigate('approvals')} className="text-xs text-[#D4AF37] hover:underline">
                  Open Department Inbox →
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {deptRequests.filter((r) => r.status === 'Submitted').length === 0 ? (
                  <div className="py-6 text-center text-[#A8B5AB]">
                    No purchase requisitions pending approval for {userDept?.name || 'this department'}.
                  </div>
                ) : (
                  deptRequests
                    .filter((r) => r.status === 'Submitted')
                    .map((r) => (
                      <div
                        key={r.id}
                        onClick={() => onNavigate('approvals', r.id)}
                        className="p-3.5 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] cursor-pointer flex items-center justify-between border border-[#1F3A2D]"
                      >
                        <div>
                          <div className="font-semibold text-[#F2EFE6] flex items-center gap-2">
                            <span className="font-mono text-[#D4AF37]">{r.referenceNumber}</span>
                            {r.title}
                          </div>
                          <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                            Requester: {r.requesterName} · Est: {currencySymbol}{r.estimatedTotal.toLocaleString()} · Priority: {r.priority}
                          </div>
                        </div>
                        <button className="px-3 py-1.5 rounded-lg bg-[#1F6F4A] text-[#F2EFE6] text-xs font-semibold hover:brightness-110">
                          Review & Approve
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          ROLE 4: PROCUREMENT OFFICER DASHBOARD (Section 7.1)
          ========================================================================= */}
      {role === 'Procurement Officer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate('requests')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Approved Requests Waiting</span>
                <FileText className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#D4AF37] mt-1">
                <AnimatedCounter
                  value={orgRequests.filter((r) => r.status === 'Approved by Department').length}
                />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>Ready to tender</span>
                <span className="text-[#D4AF37]">Convert →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('tenders')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Active Tenders</span>
                <ShoppingBag className="w-4 h-4 text-[#3FB67A]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#3FB67A] mt-1">
                <AnimatedCounter value={activeTenders.length} />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>Countdowns running</span>
                <span className="text-[#3FB67A]">Monitor →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('evaluation')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#4F9DBF]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Awaiting Evaluation</span>
                <Scale className="w-4 h-4 text-[#4F9DBF]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#4F9DBF] mt-1">
                <AnimatedCounter
                  value={orgTenders.filter((t) => t.status === 'Closed' || t.status === 'Under Evaluation').length}
                />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>Bids sealed & ready</span>
                <span className="text-[#4F9DBF]">Score Bids →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('deliveries')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D9534F]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Overdue Deliveries</span>
                <Truck className="w-4 h-4 text-[#D9534F]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#D9534F] mt-1">
                <AnimatedCounter value={overduePOs.length} />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>Requires supplier notice</span>
                <span className="text-[#D9534F]">Track POs →</span>
              </div>
            </div>
          </div>

          {/* Tenders Closing Soon with Countdowns */}
          <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
            <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6] mb-3">
              Tenders Closing Soon
            </h3>
            <div className="space-y-2.5 text-xs">
              {orgTenders.filter((t) => t.status === 'Open').length === 0 ? (
                <div className="py-6 text-center text-[#A8B5AB]">
                  No active tenders currently open for {currentOrganization.name}.
                </div>
              ) : (
                orgTenders
                  .filter((t) => t.status === 'Open')
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onNavigate('tenders', t.id)}
                      className="p-3.5 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] cursor-pointer flex items-center justify-between border border-[#1F3A2D]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#D4AF37]">{t.referenceNumber}</span>
                          <span className="font-semibold text-[#F2EFE6]">{t.title}</span>
                        </div>
                        <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                          Categories: {t.categories.join(', ')} · Bids Received:{' '}
                          {bids.filter((b) => b.tenderId === t.id).length}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-[#E0A93B]/20 border border-[#E0A93B] text-[#E0A93B] font-mono text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Open
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 5: FINANCE OFFICER DASHBOARD (Section 7.1)
          ========================================================================= */}
      {role === 'Finance Officer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate('payments')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Total Disbursements Paid</span>
                <CreditCard className="w-4 h-4 text-[#3FB67A]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#3FB67A] mt-1">
                <AnimatedCounter value={totalSpendThisYear} prefix={currencySymbol} />
              </div>
              <div className="text-[11px] text-[#3FB67A] mt-1 flex items-center justify-between">
                <span>Disbursed via vouchers</span>
                <span className="text-[#3FB67A]">Vouchers →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('orders')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#E0A93B]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Committed Pending Payment</span>
                <TrendingUp className="w-4 h-4 text-[#E0A93B]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#E0A93B] mt-1">
                <AnimatedCounter
                  value={orgPOs.reduce((acc, po) => acc + (po.totalAmount - po.paidAmount), 0)}
                  prefix={currencySymbol}
                />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>Active PO obligations</span>
                <span className="text-[#E0A93B]">Inspect POs →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('payments')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Payments Due</span>
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#D4AF37] mt-1">
                <AnimatedCounter
                  value={orgPOs.filter((po) => po.status === 'Delivered' && po.paidAmount < po.totalAmount).length}
                />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>Inspection passed</span>
                <span className="text-[#D4AF37]">Disburse →</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('deliveries')}
              className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D9534F]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                <span>Overdue Deliveries</span>
                <Truck className="w-4 h-4 text-[#D9534F]" />
              </div>
              <div className="text-2xl font-bold font-serif-heading text-[#D9534F] mt-1">
                <AnimatedCounter value={overduePOs.length} />
              </div>
              <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                <span>Withhold payments</span>
                <span className="text-[#D9534F]">Receiving →</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                Budget Utilization by Operating Unit
              </h3>
              <button onClick={() => onNavigate('budgets')} className="text-xs text-[#D4AF37] hover:underline">
                Budget Management →
              </button>
            </div>
            <div className="space-y-3">
              {orgDepts.length === 0 ? (
                <div className="py-6 text-center text-[#A8B5AB] text-xs">
                  No departments found for {currentOrganization.name}.
                </div>
              ) : (
                orgDepts.map((d) => (
                  <div key={d.id} className="text-xs bg-[#132A20] p-3 rounded-xl">
                    <div className="flex justify-between font-semibold text-[#F2EFE6] mb-1">
                      <span>{d.name}</span>
                      <span className="font-mono text-[#D4AF37]">
                        {currencySymbol}{d.spent.toLocaleString()} / {currencySymbol}{d.annualBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#07130E] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1F6F4A] to-[#D4AF37]"
                        style={{ width: d.annualBudget > 0 ? `${(d.spent / d.annualBudget) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 6: APPROVING AUTHORITY DASHBOARD (Section 7.1)
          ========================================================================= */}
      {role === 'Approving Authority' && (() => {
        const highValueAwaiting = orgTenders.filter(
          (t) => !!t.awaitingAuthorityApproval
        );
        const authorizedDecisions = orgTenders.filter((t) => t.status === 'Awarded').length;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => onNavigate('awards')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#E0A93B]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>High-Value Awards Awaiting My Sign-off</span>
                  <Award className="w-4 h-4 text-[#E0A93B]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#E0A93B] mt-1">
                  <AnimatedCounter value={highValueAwaiting.length} />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>Exceeds {currencySymbol}{(currentOrganization.approvalThreshold || settings.approvalThreshold).toLocaleString()} threshold</span>
                  <span className="text-[#E0A93B]">Decide →</span>
                </div>
              </div>

              <div
                onClick={() => onNavigate('tenders')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Active Entity Tenders</span>
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#D4AF37] mt-1">
                  <AnimatedCounter value={orgTenders.length} />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>Total tenders under management</span>
                  <span className="text-[#D4AF37]">Inspect →</span>
                </div>
              </div>

              <div
                onClick={() => onNavigate('audit')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Decisions Authorized</span>
                  <CheckCircle className="w-4 h-4 text-[#3FB67A]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#3FB67A] mt-1">
                  <AnimatedCounter value={authorizedDecisions} />
                </div>
                <div className="text-[11px] text-[#3FB67A] mt-1 flex items-center justify-between">
                  <span>Past approvals logged in audit trail</span>
                  <span className="text-[#3FB67A]">Audit Log →</span>
                </div>
              </div>
            </div>

            {/* Executive Decision Matrix Table - Gives Approving Authority deep context */}
            <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                    Executive Contract Decision Queue & High-Value Approvals
                  </h3>
                  <p className="text-xs text-[#A8B5AB] mt-0.5">
                    Statutory threshold enforcement for {currentOrganization.name}. Full scoring, financial comparison, and compliance data before authorization.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('awards')}
                  className="text-xs text-[#D4AF37] font-semibold hover:underline"
                >
                  Open Full Awards Matrix →
                </button>
              </div>

              {highValueAwaiting.length === 0 ? (
                <div className="py-8 text-center bg-[#132A20]/40 rounded-xl border border-[#1F3A2D] text-xs text-[#A8B5AB]">
                  <CheckCircle className="w-8 h-8 text-[#3FB67A] mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-sm text-[#F2EFE6]">All High-Value Tenders Have Been Formally Authorized</p>
                  <p className="text-xs mt-1">No contracts currently pending executive sign-off.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highValueAwaiting.map((t) => {
                    const tBids = bids.filter((b) => b.tenderId === t.id);
                    const topBid = tBids.sort((a, b) => (b.computedScores?.totalWeightedScore || 0) - (a.computedScores?.totalWeightedScore || 0))[0];
                    const tDept = orgDepts.find((d) => d.id === t.departmentId);
                    const tenderEst = orgRequests.find((r) => r.id === t.requestId)?.estimatedTotal || t.estimatedBudget || (topBid?.totalAmount || 0);
                    const savings = topBid ? Math.max(0, tenderEst - topBid.totalAmount) : 0;

                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#E8CF7A]">{t.referenceNumber}</span>
                            <span className="font-semibold text-sm text-[#F2EFE6]">{t.title}</span>
                            <StatusChip status={t.status} size="sm" />
                          </div>
                          <div className="text-[11px] text-[#A8B5AB]">
                            Department: <strong className="text-[#F2EFE6]">{tDept?.name || 'Assigned Department'}</strong> · Tender Est: {currencySymbol}{tenderEst.toLocaleString()}
                          </div>
                          {topBid ? (
                            <div className="text-xs text-[#D4AF37] mt-1 flex flex-wrap items-center gap-3">
                              <span>Recommended Winner: <strong>{topBid.vendorName}</strong></span>
                              <span>•</span>
                              <span>Quoted: <strong className="text-[#F2EFE6]">{currencySymbol}{topBid.totalAmount.toLocaleString()}</strong></span>
                              <span>•</span>
                              <span className="text-[#3FB67A]">Savings: {currencySymbol}{savings.toLocaleString()}</span>
                              <span>•</span>
                              <span>Score: <strong>{topBid.computedScores?.totalWeightedScore || 92}/100</strong></span>
                            </div>
                          ) : (
                            <div className="text-xs text-[#A8B5AB] mt-1">
                              {tBids.length} sealed bids received · Under evaluation by Procurement Committee
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onNavigate('awards', t.id)}
                            className="px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110 shadow-lg active:scale-95 transition-all"
                          >
                            <Award className="w-4 h-4 text-[#D4AF37]" /> Review Dossier & Authorize Award →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          ROLE 7: VENDOR DASHBOARD (Section 7.1)
          ========================================================================= */}
      {role === 'Vendor' && (() => {
        const currentVendor = vendors.find((v) => v.userId === currentUser?.id || v.id === currentUser?.vendorId) || vendors[0];
        const vendorMatchingTenders = tenders.filter(
          (t) => t.status === 'Open' && t.categories.some((c) => currentVendor?.categories.includes(c))
        );
        const vendorSubmittedBids = bids.filter((b) => b.vendorId === currentVendor?.id);
        const vendorWonContracts = purchaseOrders.filter((po) => po.vendorId === currentVendor?.id);
        const vendorTotalReceived = payments
          .filter((p) => p.vendorId === currentVendor?.id)
          .reduce((acc, p) => acc + p.amount, 0);

        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div
                onClick={() => onNavigate('vendor_tenders')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Matching Open Tenders</span>
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#D4AF37] mt-1">
                  <AnimatedCounter value={vendorMatchingTenders.length} />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>Based on your categories</span>
                  <span className="text-[#D4AF37]">Bid →</span>
                </div>
              </div>

              <div
                onClick={() => onNavigate('vendor_bids')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#F2EFE6]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Bids Submitted</span>
                  <Scale className="w-4 h-4 text-[#A8B5AB]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#F2EFE6] mt-1">
                  <AnimatedCounter value={vendorSubmittedBids.length} />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>Competitor bids hidden</span>
                  <span className="text-[#F2EFE6]">View Bids →</span>
                </div>
              </div>

              <div
                onClick={() => onNavigate('vendor_contracts')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Contracts Won</span>
                  <Award className="w-4 h-4 text-[#3FB67A]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#3FB67A] mt-1">
                  <AnimatedCounter value={vendorWonContracts.length} />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>PO issued & executed</span>
                  <span className="text-[#3FB67A]">Contracts →</span>
                </div>
              </div>

              <div
                onClick={() => onNavigate('vendor_payments')}
                className="p-5 rounded-2xl bg-[#0D1F17] hover:bg-[#132A20] border border-[#1F3A2D] hover:border-[#3FB67A]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between text-xs text-[#A8B5AB] group-hover:text-[#F2EFE6]">
                  <span>Payments Received</span>
                  <CreditCard className="w-4 h-4 text-[#3FB67A]" />
                </div>
                <div className="text-2xl font-bold font-serif-heading text-[#3FB67A] mt-1">
                  <AnimatedCounter value={vendorTotalReceived} prefix={currencySymbol} />
                </div>
                <div className="text-[11px] text-[#A8B5AB] mt-1 flex items-center justify-between">
                  <span>Direct bank transfer</span>
                  <span className="text-[#3FB67A]">Receipts →</span>
                </div>
              </div>

              {/* Vendor Reliability Score Card with Explanation (Section 7.1) */}
              <div
                onClick={() => onNavigate('vendor_contracts')}
                className="p-5 rounded-2xl bg-[#132A20] hover:bg-[#1F3A2D] border border-[#D4AF37]/50 shadow-lg cursor-pointer transition-all active:scale-[0.99] group"
              >
                <span className="text-xs text-[#A8B5AB] flex items-center justify-between group-hover:text-[#F2EFE6]">
                  <span>Reliability Score</span>
                  <Star className="w-4 h-4 text-[#D4AF37] fill-current" />
                </span>
                <div className="text-2xl font-bold font-serif-heading text-[#D4AF37] mt-1">
                  {currentVendor?.reliabilityScore || 60}%
                </div>
                <div className="text-[10px] text-[#A8B5AB] mt-1 leading-snug">
                  Deliveries: {currentVendor?.onTimeDeliveries || 0} on-time, {currentVendor?.lateDeliveries || 0} late, {currentVendor?.rejections || 0} rejections.
                </div>
              </div>
            </div>

            {/* Quick Open Tenders Link */}
            <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                  Matching Tenders Available to Bid
                </h3>
                <button onClick={() => onNavigate('vendor_tenders')} className="text-xs text-[#D4AF37] hover:underline">
                  View All Open Tenders →
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {vendorMatchingTenders.length === 0 ? (
                  <div className="py-6 text-center text-[#A8B5AB]">
                    No open tenders currently matching your registered categories.
                  </div>
                ) : (
                  vendorMatchingTenders.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onNavigate('vendor_tenders')}
                      className="p-3.5 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] cursor-pointer flex items-center justify-between border border-[#1F3A2D]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#D4AF37]">{t.referenceNumber}</span>
                          <span className="font-semibold text-[#F2EFE6]">{t.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#07130E] text-[#A8B5AB]">
                            {t.organizationName || 'Procura Entity'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                          Location: {t.deliveryLocation} · Period: {t.requiredDeliveryPeriodDays} Days
                        </div>
                      </div>
                      <span className="text-xs text-[#D4AF37] font-semibold">Bid Now →</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Open Tenders Link */}
            <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">
                  Matching Tender Opportunities for Your Business
                </h3>
                <button
                  onClick={() => onNavigate('vendor_tenders')}
                  className="text-xs text-[#D4AF37] hover:underline"
                >
                  View Full Tenders List →
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#132A20] border border-[#1F3A2D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#D4AF37]">TND-2026-0003</span>
                    <span className="font-bold text-[#F2EFE6]">
                      Perimeter Drainage & Stormwater Culvert Reconstruction
                    </span>
                  </div>
                  <div className="text-xs text-[#A8B5AB] mt-1">
                    Category: Building and Construction · Required Delivery: 30 days · Bids received: 3
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('vendor_tenders')}
                  className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold hover:brightness-110 shrink-0"
                >
                  Inspect Specs & Submit Bid
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
