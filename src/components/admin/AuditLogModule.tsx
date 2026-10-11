import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  Lock,
  Calendar,
  UserCheck,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuditLogModule: React.FC = () => {
  const { auditLogs, currentUser, currentOrganization } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('All');

  const isOrgAdmin = currentUser?.role === 'Organization Admin';
  // If org admin, allow switching between "My Activities" and "All Organization Users"
  const [adminViewScope, setAdminViewScope] = useState<'my' | 'all'>(isOrgAdmin ? 'all' : 'my');

  // Enforce account & organization audit log filtering
  const userLogs = auditLogs.filter((log) => {
    if (!currentUser) return false;
    const matchOrg = log.organizationId
      ? log.organizationId === currentOrganization.id
      : currentOrganization.id === 'org-emerald';
    if (!matchOrg) return false;

    if (isOrgAdmin && adminViewScope === 'all') return true;

    // Strict account-only filtering:
    return (
      (log.userId && log.userId === currentUser.id) ||
      (log.userName && log.userName.toLowerCase() === currentUser.fullName.toLowerCase())
    );
  });

  const filtered = userLogs.filter((log) => {
    if (filterAction !== 'All' && !log.action.toLowerCase().includes(filterAction.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.recordReference.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const rows = [
      ['Timestamp', 'User Name', 'Role', 'Action', 'Record Reference', 'Old Value', 'New Value', 'Details'],
      ...filtered.map((l) => [
        l.timestamp,
        l.userName,
        l.role,
        l.action,
        l.recordReference,
        l.oldValue || '',
        l.newValue || '',
        l.details || '',
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Procura_Audit_Trail_${currentUser?.role?.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
              {isOrgAdmin && adminViewScope === 'all'
                ? `Audit Trail (${currentOrganization.name})`
                : `Account Activity Audit Log (${currentUser?.fullName})`}
            </h2>
          </div>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            {isOrgAdmin && adminViewScope === 'all'
              ? `Complete immutable system log for ${currentOrganization.name}. Cryptographically timestamped operations across all organizational roles.`
              : `Restricted Account View: Showing logged operations and security events executed exclusively by your account (${currentUser?.email}).`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin scope switch */}
          {isOrgAdmin && (
            <div className="flex items-center bg-[#132A20] p-1 rounded-xl border border-[#1F3A2D] text-xs">
              <button
                onClick={() => setAdminViewScope('my')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  adminViewScope === 'my'
                    ? 'bg-[#1F6F4A] text-white shadow'
                    : 'text-[#A8B5AB] hover:text-[#F2EFE6]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> My Activities
              </button>
              <button
                onClick={() => setAdminViewScope('all')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  adminViewScope === 'all'
                    ? 'bg-[#1F6F4A] text-white shadow'
                    : 'text-[#A8B5AB] hover:text-[#F2EFE6]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> All Staff Activities
              </button>
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, action..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#A8B5AB] absolute left-2.5 top-2" />
          </div>

          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#1F3A2D] text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Export My Log CSV
          </button>
        </div>
      </div>

      {/* Audit Log Table (Section 7.6) */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] shadow-xl overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Account / User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Old Value</th>
                <th className="py-3 px-4">New Value</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A8B5AB]">
                    No recorded activities found for this account matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[#132A20]/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#A8B5AB] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#F2EFE6] whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#132A20] text-[#D4AF37] border border-[#1F3A2D] text-[10px] font-semibold whitespace-nowrap">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#F2EFE6]">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-[#D4AF37] whitespace-nowrap">
                      {log.recordReference}
                    </td>
                    <td className="py-3 px-4 text-[#A8B5AB] max-w-[120px] truncate">
                      {log.oldValue || '-'}
                    </td>
                    <td className="py-3 px-4 text-[#3FB67A] font-semibold max-w-[120px] truncate">
                      {log.newValue || '-'}
                    </td>
                    <td className="py-3 px-4 text-[#A8B5AB] max-w-[240px] truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
