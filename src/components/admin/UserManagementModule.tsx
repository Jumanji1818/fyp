import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  KeyRound,
  UserX,
  Plus,
  Search,
  Check,
  UserPlus,
  Copy,
  CheckCheck,
  Lock,
  Mail,
  Building,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { Modal } from '../common/Modal';
import { User, UserRole } from '../../types';

export const UserManagementModule: React.FC = () => {
  const {
    users,
    departments,
    currentOrganization,
    adminApproveUser,
    adminUpdateUserRole,
    adminToggleUserStatus,
    adminResetUserPassword,
    provisionStaffUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [assignedRole, setAssignedRole] = useState<UserRole>('Request Officer');
  const [assignedDept, setAssignedDept] = useState<string>('');

  // Provisioning state
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [provFullName, setProvFullName] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provRole, setProvRole] = useState<UserRole>('Request Officer');
  const [provDeptId, setProvDeptId] = useState('');
  const [provTempPassword, setProvTempPassword] = useState(() => `Procura#${Math.floor(1000 + Math.random() * 9000)}`);
  const [provRequireChange, setProvRequireChange] = useState(true);
  const [provError, setProvError] = useState('');

  // Success credential popup
  const [createdCredentials, setCreatedCredentials] = useState<{
    user: User;
    tempPass: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter departments strictly for this organization
  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );

  // Filter users strictly for this organization
  const [viewScope, setViewScope] = useState<'all' | 'active' | 'pending'>('all');

  const orgUsers = users.filter((u) => {
    if (u.role === 'Vendor') return false;
    return u.organizationId ? u.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald';
  });

  const filteredUsers = orgUsers.filter((u) => {
    if (viewScope === 'active' && u.status !== 'Active') return false;
    if (viewScope === 'pending' && u.status !== 'Pending') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAssign = (user: User) => {
    setRoleModalUser(user);
    setAssignedRole(user.role === 'Pending' ? 'Request Officer' : (user.role as UserRole));
    setAssignedDept(user.departmentId || orgDepts[0]?.id || '');
  };

  const handleSaveRole = () => {
    if (!roleModalUser) return;
    if (roleModalUser.role === 'Pending') {
      adminApproveUser(roleModalUser.id, assignedRole, assignedDept);
    } else {
      adminUpdateUserRole(roleModalUser.id, assignedRole, assignedDept);
    }
    setRoleModalUser(null);
  };

  const handleOpenProvisionModal = () => {
    setProvFullName('');
    setProvEmail('');
    setProvPhone('');
    setProvRole('Request Officer');
    setProvDeptId(orgDepts[0]?.id || '');
    setProvTempPassword(`Procura#${Math.floor(1000 + Math.random() * 9000)}`);
    setProvRequireChange(true);
    setProvError('');
    setProvisionModalOpen(true);
  };

  const handleConfirmProvision = (e: React.FormEvent) => {
    e.preventDefault();
    setProvError('');

    if (!provFullName.trim() || !provEmail.trim()) {
      setProvError('Full Name and Email are required.');
      return;
    }

    const result = provisionStaffUser({
      fullName: provFullName.trim(),
      email: provEmail.trim(),
      phone: provPhone.trim(),
      role: provRole,
      departmentId: provDeptId,
      tempPassword: provTempPassword,
      mustChangePassword: provRequireChange,
    });

    if (result.success && result.user) {
      setProvisionModalOpen(false);
      setCreatedCredentials({
        user: result.user,
        tempPass: result.tempPassword,
      });
    } else {
      setProvError(result.error || 'Failed to provision account.');
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Procura Login Credentials for ${currentOrganization.name}\n` +
      `Name: ${createdCredentials.user.fullName}\n` +
      `Role: ${createdCredentials.user.role}\n` +
      `Email: ${createdCredentials.user.email}\n` +
      `Temporary Password: ${createdCredentials.tempPass}\n` +
      `Note: You must change your temporary password upon first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 text-xs text-[#F2EFE6]">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
              Staff Accounts & Role Governance
            </h2>
          </div>
          <p className="text-xs text-[#A8B5AB]">
            Governing entity:{' '}
            <strong className="text-[#D4AF37]">{currentOrganization.name}</strong>.
            Provision confidential role accounts with temporary passwords; users must set their own passwords upon login.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Scope Toggle */}
          <div className="flex items-center bg-[#132A20] p-1 rounded-xl border border-[#1F3A2D]">
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewScope === 'all' ? 'bg-[#1F6F4A] text-white shadow' : 'text-[#A8B5AB]'
              }`}
            >
              All Staff ({orgUsers.length})
            </button>
            <button
              onClick={() => setViewScope('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewScope === 'active' ? 'bg-[#1F6F4A] text-white shadow' : 'text-[#A8B5AB]'
              }`}
            >
              Active ({orgUsers.filter((u) => u.status === 'Active').length})
            </button>
            <button
              onClick={() => setViewScope('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewScope === 'pending' ? 'bg-[#1F6F4A] text-white shadow' : 'text-[#A8B5AB]'
              }`}
            >
              Pending ({orgUsers.filter((u) => u.status === 'Pending').length})
            </button>
          </div>

          <button
            onClick={handleOpenProvisionModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs flex items-center gap-2 hover:brightness-110 shadow active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4 text-[#D4AF37]" /> Provision Staff Account
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-[#0D1F17] p-3 rounded-xl border border-[#1F3A2D]">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, role, email..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-xs text-[#F2EFE6] outline-none"
          />
          <Search className="w-3.5 h-3.5 text-[#A8B5AB] absolute left-2.5 top-2" />
        </div>

        <span className="text-[11px] text-[#A8B5AB]">
          Showing {filteredUsers.length} authorized user accounts
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] shadow-xl overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Sign-In Email</th>
                <th className="py-3 px-4">Role Entitlement</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Security State</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3A2D]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A8B5AB]">
                    No staff accounts match your current filter. Use "Provision Staff Account" above to create an account.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPending = u.status === 'Pending';
                  const deptName =
                    departments.find((d) => d.id === u.departmentId)?.name || 'General Operations';

                  return (
                    <tr key={u.id} className="hover:bg-[#132A20]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#132A20] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-[11px] text-[#D4AF37]">
                            {u.avatar || u.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[#F2EFE6] block">{u.fullName}</span>
                            <span className="text-[10px] text-[#A8B5AB]">{u.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#A8B5AB] font-mono">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            isPending ? 'text-[#E0A93B]' : 'text-[#D4AF37]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#A8B5AB]">{deptName}</td>
                      <td className="py-3 px-4 text-center">
                        {u.mustChangePassword ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#E0A93B]/20 text-[#E0A93B] border border-[#E0A93B]/40 text-[10px] font-semibold inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Temp Password
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#3FB67A]/20 text-[#3FB67A] border border-[#3FB67A]/40 text-[10px] font-semibold inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Permanent Password
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusChip status={u.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <button
                              onClick={() => handleOpenAssign(u)}
                              className="px-2.5 py-1 rounded-lg bg-[#1F6F4A] hover:bg-[#2C9E62] text-white font-semibold text-xs flex items-center gap-1 shadow"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Approve & Assign Role
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenAssign(u)}
                                className="px-2 py-1 rounded bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] font-semibold text-[11px]"
                                title="Modify Role"
                              >
                                Edit Role
                              </button>
                              <button
                                onClick={() => adminResetUserPassword(u.id)}
                                className="p-1 rounded bg-[#132A20] hover:bg-[#1F3A2D] text-[#A8B5AB]"
                                title="Reset to Temporary Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              {u.role !== 'Organization Admin' && (
                                <button
                                  onClick={() => adminToggleUserStatus(u.id)}
                                  className={`p-1 rounded ${
                                    u.status === 'Active'
                                      ? 'bg-[#132A20] text-[#D9534F] hover:bg-[#D9534F]/20'
                                      : 'bg-[#132A20] text-[#3FB67A] hover:bg-[#3FB67A]/20'
                                  }`}
                                  title={u.status === 'Active' ? 'Deactivate User' : 'Reactivate User'}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
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

      {/* PROVISION NEW STAFF MODAL */}
      <Modal
        isOpen={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        title="Provision Staff Role Account"
        subtitle={`Generate authorized login credentials for staff in ${currentOrganization.name}.`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleConfirmProvision} className="space-y-4 text-xs">
          {provError && (
            <div className="p-2.5 rounded-xl bg-[#D9534F]/20 border border-[#D9534F]/40 text-[#D9534F]">
              {provError}
            </div>
          )}

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Staff Full Name *</label>
            <input
              type="text"
              required
              value={provFullName}
              onChange={(e) => setProvFullName(e.target.value)}
              placeholder="e.g. Arc. Zainab Bello"
              className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Official Email *</label>
              <input
                type="email"
                required
                value={provEmail}
                onChange={(e) => setProvEmail(e.target.value)}
                placeholder="zainab@company.com"
                className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={provPhone}
                onChange={(e) => setProvPhone(e.target.value)}
                placeholder="+234 802 000 0000"
                className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Assigned Role *</label>
              <select
                value={provRole}
                onChange={(e) => setProvRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
              >
                <option value="Request Officer">Request Officer</option>
                <option value="Department Head">Department Head</option>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Finance Officer">Finance Officer</option>
                <option value="Approving Authority">Approving Authority</option>
              </select>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Department</label>
              <select
                value={provDeptId}
                onChange={(e) => setProvDeptId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#07130E] border border-[#1F3A2D] text-[#F2EFE6] focus:border-[#D4AF37] outline-none"
              >
                {orgDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generated Temporary Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#A8B5AB] font-medium">Temporary Password</label>
              <button
                type="button"
                onClick={() =>
                  setProvTempPassword(`Procura#${Math.floor(1000 + Math.random() * 9000)}`)
                }
                className="text-[11px] text-[#D4AF37] hover:underline"
              >
                Generate New
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={provTempPassword}
                onChange={(e) => setProvTempPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#132A20] border border-[#D4AF37]/50 text-[#D4AF37] font-mono font-bold outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="requireChange"
              checked={provRequireChange}
              onChange={(e) => setProvRequireChange(e.target.checked)}
              className="rounded accent-[#D4AF37] bg-[#07130E] border-[#1F3A2D]"
            />
            <label htmlFor="requireChange" className="text-xs text-[#A8B5AB] cursor-pointer">
              Enforce password change upon first sign-in (Recommended)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1F3A2D]">
            <button
              type="button"
              onClick={() => setProvisionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-[#A8B5AB] hover:text-[#F2EFE6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#1F6F4A] hover:bg-[#2C9E62] text-white font-semibold shadow"
            >
              Create & Issue Credentials
            </button>
          </div>
        </form>
      </Modal>

      {/* SUCCESS CREDENTIALS POPUP */}
      {createdCredentials && (
        <Modal
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          title="Account Provisioned Successfully"
          subtitle="Share these temporary login credentials with the staff member."
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-[#F2EFE6]">
            <div className="p-4 rounded-xl bg-[#132A20] border border-[#D4AF37]/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#A8B5AB]">Entity:</span>
                <span className="font-bold text-[#F2EFE6]">{currentOrganization.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#A8B5AB]">Staff Name:</span>
                <span className="font-semibold text-[#F2EFE6]">{createdCredentials.user.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#A8B5AB]">Role:</span>
                <span className="font-semibold text-[#D4AF37]">{createdCredentials.user.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#A8B5AB]">Sign-In Email:</span>
                <span className="font-mono text-[#F2EFE6]">{createdCredentials.user.email}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#1F3A2D]">
                <span className="text-[11px] text-[#A8B5AB]">Temporary Password:</span>
                <span className="font-mono font-bold text-sm text-[#D4AF37]">
                  {createdCredentials.tempPass}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#07130E] border border-[#1F3A2D] text-[11px] text-[#A8B5AB]">
              The user will be prompted to replace this temporary password with their own confidential password upon first login.
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={copyCredentials}
                className="px-4 py-2 rounded-xl bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#D4AF37]/50 font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-[#3FB67A]" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Credentials Copied!' : 'Copy Credentials'}
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-2 rounded-xl bg-[#1F6F4A] text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT ROLE MODAL */}
      {roleModalUser && (
        <Modal
          isOpen={!!roleModalUser}
          onClose={() => setRoleModalUser(null)}
          title={`Assign Role Entitlement: ${roleModalUser.fullName}`}
          subtitle="Define operational permissions and department association."
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Select Role</label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              >
                <option value="Request Officer">Request Officer</option>
                <option value="Department Head">Department Head</option>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Finance Officer">Finance Officer</option>
                <option value="Approving Authority">Approving Authority</option>
                <option value="Organization Admin">Organization Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Assigned Department</label>
              <select
                value={assignedDept}
                onChange={(e) => setAssignedDept(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              >
                {orgDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-[#A8B5AB]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="px-5 py-2 rounded-lg bg-[#1F6F4A] text-white font-semibold hover:brightness-110 shadow"
              >
                Save Role Assignment
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
