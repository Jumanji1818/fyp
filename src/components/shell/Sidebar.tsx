import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  ShoppingBag,
  Scale,
  Award,
  Truck,
  PackageCheck,
  CreditCard,
  Building,
  PieChart,
  BarChart3,
  Users,
  Tags,
  ShieldAlert,
  Settings as SettingsIcon,
  X,
  LogOut,
  Sun,
  Moon,
  User,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const {
    currentUser,
    menuOpen,
    setMenuOpen,
    logout,
    toggleTheme,
    theme,
    settings,
    currentOrganization,
  } = useApp();

  const role = currentUser?.role as UserRole | undefined;

  // Determine allowed menu items per role (Section 4 & Section 5)
  const getNavItems = () => {
    if (role === 'Vendor') {
      return [
        { id: 'vendor_dashboard', label: 'Supplier Dashboard', icon: LayoutDashboard },
        { id: 'vendor_tenders', label: 'Open Tenders', icon: ShoppingBag },
        { id: 'vendor_bids', label: 'My Submitted Bids', icon: Scale },
        { id: 'vendor_contracts', label: 'Awarded Contracts', icon: Award },
        { id: 'vendor_deliveries', label: 'Dispatches & Logistics', icon: Truck },
        { id: 'vendor_payments', label: 'Remittance & Payments', icon: CreditCard },
        { id: 'settings', label: 'Vendor Profile & Settings', icon: SettingsIcon },
      ];
    }

    if (role === 'Request Officer') {
      return [
        { id: 'dashboard', label: 'Officer Dashboard', icon: LayoutDashboard },
        { id: 'requests', label: 'Purchase Requests', icon: FileText },
        { id: 'deliveries', label: 'Store Receiving & GRN', icon: PackageCheck },
        { id: 'settings', label: 'Account Settings', icon: SettingsIcon },
      ];
    }

    if (role === 'Department Head') {
      return [
        { id: 'dashboard', label: 'Department Dashboard', icon: LayoutDashboard },
        { id: 'approvals', label: 'Pending Dept Approvals', icon: CheckSquare },
        { id: 'requests', label: 'Department Requisitions', icon: FileText },
        { id: 'budgets', label: 'My Department Budget', icon: PieChart },
        { id: 'settings', label: 'Account Settings', icon: SettingsIcon },
      ];
    }

    if (role === 'Procurement Officer') {
      return [
        { id: 'dashboard', label: 'Procurement Dashboard', icon: LayoutDashboard },
        { id: 'requests', label: 'Approved Requests Queue', icon: FileText },
        { id: 'tenders', label: 'Tenders & Sourcing', icon: ShoppingBag },
        { id: 'evaluation', label: 'Evaluation & Scoring', icon: Scale },
        { id: 'awards', label: 'Award Contract Decisions', icon: Award },
        { id: 'orders', label: 'Purchase Orders (PO)', icon: Truck },
        { id: 'deliveries', label: 'Deliveries Verification', icon: PackageCheck },
        { id: 'vendors', label: 'Vendors Directory', icon: Building },
        { id: 'reports', label: 'Procurement Reports', icon: BarChart3 },
        { id: 'settings', label: 'System Settings', icon: SettingsIcon },
      ];
    }

    if (role === 'Finance Officer') {
      return [
        { id: 'dashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
        { id: 'payments', label: 'Disbursements & Vouchers', icon: CreditCard },
        { id: 'orders', label: 'Purchase Orders Audit', icon: Truck },
        { id: 'budgets', label: 'Corporate Budgets & Virement', icon: PieChart },
        { id: 'awards', label: 'Budget Variance Overrides', icon: Award },
        { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
        { id: 'settings', label: 'Finance Settings', icon: SettingsIcon },
      ];
    }

    if (role === 'Approving Authority') {
      return [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'awards', label: 'High-Value Award Approvals', icon: Award },
        { id: 'reports', label: 'Executive Intelligence Reports', icon: BarChart3 },
        { id: 'audit', label: 'Immutable Audit Log', icon: ShieldAlert },
        { id: 'settings', label: 'Executive Settings', icon: SettingsIcon },
      ];
    }

    // Organization Admin: Full Governance & Operations Overview
    return [
      { id: 'dashboard', label: 'Admin Command Center', icon: LayoutDashboard },
      { id: 'requests', label: 'All Purchase Requests', icon: FileText },
      { id: 'tenders', label: 'Tenders Management', icon: ShoppingBag },
      { id: 'evaluation', label: 'Bids & Scoring (Overview)', icon: Scale },
      { id: 'orders', label: 'Purchase Orders Ledger', icon: Truck },
      { id: 'deliveries', label: 'Store Receiving & GRN', icon: PackageCheck },
      { id: 'payments', label: 'Payment Disbursements', icon: CreditCard },
      { id: 'vendors', label: 'Vendor Directory & Governance', icon: Building },
      { id: 'budgets', label: 'Corporate Department Budgets', icon: PieChart },
      { id: 'reports', label: 'System Reports & BI', icon: BarChart3 },
      { id: 'users', label: 'User Roles & Approvals', icon: Users },
      { id: 'categories', label: 'Procurement Categories', icon: Tags },
      { id: 'audit', label: 'Immutable Audit Log', icon: ShieldAlert },
      { id: 'settings', label: 'Organization Settings', icon: SettingsIcon },
    ];
  };

  const navItems = getNavItems();

  if (!menuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Blurred Backdrop Screen Overlay (Section User Directive) */}
      <div
        onClick={() => setMenuOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
      />

      {/* Slide-out Navigation Drawer */}
      <aside className="relative z-50 w-72 max-w-[85vw] h-full bg-[#0D1F17] border-r border-[#1F3A2D] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-250 font-sans">
        {/* Top Header / Logo */}
        <div>
          <div className="h-16 px-5 border-b border-[#1F3A2D] flex items-center justify-between bg-[#07130E]/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-md">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.2 14.5l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
                </svg>
              </div>
              <div className="truncate">
                <span className="font-bold text-sm tracking-wide text-[#F2EFE6] font-display block">
                  PROCURA
                </span>
                <span className="text-[10px] text-[#A8B5AB] block truncate">
                  {currentOrganization.name || 'Enterprise Procurement'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMenuOpen(false)}
              className="p-1.5 rounded-lg text-[#A8B5AB] hover:text-[#D4AF37] hover:bg-[#132A20] transition-colors"
              title="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Badge */}
          <div className="px-5 py-2.5 bg-[#132A20]/40 border-b border-[#1F3A2D] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#A8B5AB]">Active Role:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1F6F4A]/30 text-[#3FB67A] border border-[#3FB67A]/40 font-semibold text-[11px]">
              {currentUser?.role || 'Guest'}
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMenuOpen(false); // Closes menu when picked
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-[#132A20] text-[#D4AF37] font-semibold shadow-sm'
                      : 'text-[#A8B5AB] hover:text-[#F2EFE6] hover:bg-[#132A20]/60'
                  }`}
                >
                  {/* Gold left bar indicator on active item */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#D4AF37] rounded-r-md" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#D4AF37]' : 'text-[#A8B5AB] group-hover:text-[#F2EFE6]'
                    }`}
                  />

                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Card & Sign Out */}
        <div className="p-4 border-t border-[#1F3A2D] bg-[#07130E]/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 flex items-center justify-center font-bold text-xs text-[#D4AF37] shrink-0 shadow">
              {currentUser?.avatar || currentUser?.fullName?.substring(0, 2).toUpperCase() || 'PR'}
            </div>
            <div className="overflow-hidden flex-1 text-left">
              <div className="font-semibold text-xs text-[#F2EFE6] truncate">
                {currentUser?.fullName}
              </div>
              <div className="text-[10px] text-[#A8B5AB] truncate">
                {currentUser?.email}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="py-1.5 px-2 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#F2EFE6] text-xs flex items-center justify-center gap-1.5 border border-[#1F3A2D] transition-colors"
              title="Toggle Light / Dark mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#E0A93B]" /> Light
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#4F9DBF]" /> Dark
                </>
              )}
            </button>

            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="py-1.5 px-2 rounded-lg bg-[#D9534F]/15 hover:bg-[#D9534F]/30 text-[#D9534F] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#D9534F]/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
