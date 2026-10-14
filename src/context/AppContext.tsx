import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { procuraApi, ApiUser } from '../lib/procuraApi';
import {
  Organization,
  OrganizationType,
  Department,
  User,
  Category,
  VendorProfile,
  PurchaseRequest,
  Tender,
  Bid,
  PurchaseOrder,
  PaymentRecord,
  DeliveryRecord,
  BudgetChange,
  NotificationItem,
  AuditLogEntry,
  OrganizationSettings,
  UserRole,
  RequestStatus,
  TenderStatus,
} from '../types';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_SETTINGS,
  INITIAL_DEPARTMENTS,
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_VENDORS,
  INITIAL_REQUESTS,
  INITIAL_TENDERS,
  INITIAL_BIDS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_DELIVERIES,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';

interface AppContextType {
  organizations: Organization[];
  currentOrganization: Organization;
  switchOrganization: (orgId: string) => void;
  registerOrganization: (
    orgData: {
      name: string;
      type: OrganizationType;
      industry: string;
      address: string;
      phone: string;
      email: string;
      approvalThreshold?: number;
      initialBudget?: number;
      currency?: string;
    },
    adminData: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
    }
  ) => { success: boolean; organization: Organization; adminUser: User };
  provisionStaffUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    departmentId?: string;
    tempPassword?: string;
    mustChangePassword?: boolean;
  }) => { success: boolean; user?: User; tempPassword: string; error?: string };
  changeTempPassword: (userId: string, currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (userId: string, newPass: string) => { success: boolean; error?: string };
  settings: OrganizationSettings;
  updateSettings: (newSettings: Partial<OrganizationSettings>) => void;
  departments: Department[];
  users: User[];
  categories: Category[];
  vendors: VendorProfile[];
  requests: PurchaseRequest[];
  tenders: Tender[];
  bids: Bid[];
  purchaseOrders: PurchaseOrder[];
  deliveries: DeliveryRecord[];
  payments: PaymentRecord[];
  budgetChanges: BudgetChange[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  currentUser: User | null;
  isAuthenticated: boolean;
  theme: 'dark' | 'light' | 'system';
  setTheme: (t: 'dark' | 'light' | 'system') => void;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  loadDemoData: () => void;
  resetAllData: () => void;
  addAuditLog: (action: string, recordReference: string, oldValue?: string, newValue?: string, details?: string) => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  createRequest: (data: Partial<PurchaseRequest>) => PurchaseRequest;
  updateRequest: (id: string, data: Partial<PurchaseRequest>) => void;
  approveRequest: (id: string, reviewerComment?: string) => void;
  returnRequest: (id: string, comment: string) => void;
  rejectRequest: (id: string, reason: string) => void;
  createTenderFromRequest: (requestId: string, tenderData: Partial<Tender>) => Tender;
  extendTenderDeadline: (tenderId: string, newDate: string, reason: string) => void;
  cancelTender: (tenderId: string, reason: string) => void;
  submitBid: (tenderId: string, bidData: Partial<Bid>) => Bid;
  evaluateCompliance: (bidId: string, passed: boolean, reason?: string) => void;
  evaluateTechnical: (bidId: string, score: number, comments: string) => void;
  calculateVendorRecommendations: (tenderId: string) => Bid[];
  awardTender: (tenderId: string, winningBidId: string, justification?: string) => { requiresAuthority: boolean; poCreated?: PurchaseOrder; blocked?: string };
  authorityApproveAward: (tenderId: string, approved: boolean, reason?: string) => void;
  overrideBudgetAndAward: (tenderId: string, winningBidId: string, overrideReason: string) => { requiresAuthority: boolean; poCreated?: PurchaseOrder; blocked?: string };
  acknowledgePO: (poId: string) => void;
  dispatchDelivery: (poId: string, notes: string) => void;
  receiveDelivery: (poId: string, itemsReceived: DeliveryRecord['itemsReceived']) => void;
  recordPayment: (paymentData: Omit<PaymentRecord, 'id' | 'voucherNumber' | 'recordedByUserId' | 'recordedByName'>) => PaymentRecord | null;
  toggleMyVendor: (vendorId: string) => void;
  updateVendorStatus: (vendorId: string, status: VendorProfile['status'], reason?: string, targetOrgId?: string) => void;
  getVendorEffectiveStatus: (vendor: VendorProfile, orgId?: string) => { status: VendorProfile['status']; reason?: string };
  adjustBudget: (deptId: string, newBudget: number, reason: string) => void;
  adminApproveUser: (userId: string, role: UserRole, deptId?: string) => void;
  adminUpdateUserRole: (userId: string, newRole: UserRole, deptId?: string) => void;
  adminToggleUserStatus: (userId: string) => void;
  adminResetUserPassword: (userId: string) => void;
  addCategory: (name: string, subcategories: string[]) => void;
  deactivateCategory: (categoryId: string) => void;
  reactivateCategory: (categoryId: string) => void;
  editCategory: (categoryId: string, newName: string, newSubcategories: string[]) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;
  inactivityModalOpen: boolean;
  resetInactivityTimer: () => void;
  staySignedIn: () => void;
  celebrationOpen: boolean;
  setCelebrationOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_PREFIX = 'procura_app_v1_';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Primary state loaded from LocalStorage if present, else initial seed data
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'organizations');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [currentOrganization, setCurrentOrganization] = useState<Organization>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'current_organization');
    const orgs: Organization[] = (() => {
      const savedOrgs = localStorage.getItem(STORAGE_PREFIX + 'organizations');
      return savedOrgs ? JSON.parse(savedOrgs) : INITIAL_ORGANIZATIONS;
    })();
    const savedUserStr = localStorage.getItem(STORAGE_PREFIX + 'current_user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u?.organizationId) {
          const match = orgs.find((o) => o.id === u.organizationId);
          if (match) return match;
        }
      } catch {
        // fallback
      }
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = orgs.find((o) => o.id === parsed.id);
        if (match) return match;
        return parsed;
      } catch {
        return orgs[0] || INITIAL_ORGANIZATIONS[0];
      }
    }
    return orgs[0] || INITIAL_ORGANIZATIONS[0];
  });

  const [settings, setSettings] = useState<OrganizationSettings>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'settings');
    const base = saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    // ensure settings reflect currentOrganization
    return {
      ...base,
      name: currentOrganization?.name || base.name,
      approvalThreshold: currentOrganization?.approvalThreshold || base.approvalThreshold,
      currency: currentOrganization?.currency || base.currency || '₦',
      address: currentOrganization?.address || base.address,
      phone: currentOrganization?.phone || base.phone,
      email: currentOrganization?.email || base.email,
    };
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'departments');
    const list: Department[] = saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    return list.map((d) => (d.organizationId ? d : { ...d, organizationId: 'org-emerald' }));
  });

  // Authentication identities are server-owned. Never initialize or persist user/password records from browser storage.
  const [users, setUsers] = useState<User[]>([]);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [vendors, setVendors] = useState<VendorProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [requests, setRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'requests');
    const list: PurchaseRequest[] = saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    return list.map((r) => (r.organizationId ? r : { ...r, organizationId: 'org-emerald' }));
  });

  const [tenders, setTenders] = useState<Tender[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'tenders');
    const list: Tender[] = saved ? JSON.parse(saved) : INITIAL_TENDERS;
    return list.map((t) => (t.organizationId ? t : { ...t, organizationId: 'org-emerald' }));
  });

  const [bids, setBids] = useState<Bid[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'bids');
    return saved ? JSON.parse(saved) : INITIAL_BIDS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'pos');
    const list: PurchaseOrder[] = saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
    return list.map((po) => (po.organizationId ? po : { ...po, organizationId: 'org-emerald' }));
  });

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'deliveries');
    const list: DeliveryRecord[] = saved ? JSON.parse(saved) : INITIAL_DELIVERIES;
    return list.map((del) => (del.organizationId ? del : { ...del, organizationId: 'org-emerald' }));
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'payments');
    const list: PaymentRecord[] = saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    return list.map((pay) => (pay.organizationId ? pay : { ...pay, organizationId: 'org-emerald' }));
  });

  const [budgetChanges, setBudgetChanges] = useState<BudgetChange[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'budget_changes');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'notifications');
    const list: NotificationItem[] = saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    return list.map((n) => (n.organizationId ? n : { ...n, organizationId: 'org-emerald' }));
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'audit_logs');
    const list: AuditLogEntry[] = saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    return list.map((a) => (a.organizationId ? a : { ...a, organizationId: 'org-emerald' }));
  });

  // Current session - Start on Welcome/Login screen unless explicitly authenticated in session
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [theme, setThemeState] = useState<'dark' | 'light' | 'system'>(() => {
    return settings.theme || 'dark';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [inactivityModalOpen, setInactivityModalOpen] = useState<boolean>(false);
  const [celebrationOpen, setCelebrationOpen] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'organizations', JSON.stringify(organizations));
  }, [organizations]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'current_organization', JSON.stringify(currentOrganization));
    setSettings((prev) => ({
      ...prev,
      name: currentOrganization.name,
      type:
        currentOrganization.type === 'sole_proprietorship'
          ? 'Sole Proprietor / Small Business'
          : currentOrganization.type === 'mega_corporation'
          ? 'Mega Corporation / Public Parastatal'
          : 'Enterprise / Corporate',
      approvalThreshold: currentOrganization.approvalThreshold,
      currency: currentOrganization.currency || '₦',
      address: currentOrganization.address,
      phone: currentOrganization.phone,
      email: currentOrganization.email,
    }));
  }, [currentOrganization]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'departments', JSON.stringify(departments));
  }, [departments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'vendors', JSON.stringify(vendors));
  }, [vendors]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'requests', JSON.stringify(requests));
  }, [requests]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'tenders', JSON.stringify(tenders));
  }, [tenders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'bids', JSON.stringify(bids));
  }, [bids]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'deliveries', JSON.stringify(deliveries));
  }, [deliveries]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'budget_changes', JSON.stringify(budgetChanges));
  }, [budgetChanges]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(STORAGE_PREFIX + 'current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(STORAGE_PREFIX + 'current_user');
      localStorage.removeItem(STORAGE_PREFIX + 'current_user');
    }
  }, [currentUser]);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // Apply theme to document and body elements
  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  const setTheme = (newTheme: 'dark' | 'light' | 'system') => {
    setThemeState(newTheme);
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const updateSettings = (newSettings: Partial<OrganizationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
    if (newSettings.theme) {
      setThemeState(newSettings.theme);
    }
    // Keep currentOrganization and organizations list in sync if org attributes change
    if (newSettings.name || newSettings.address || newSettings.phone || newSettings.email || newSettings.approvalThreshold !== undefined || newSettings.currency) {
      setCurrentOrganization((prev) => {
        const updatedOrg: Organization = {
          ...prev,
          name: newSettings.name ?? prev.name,
          address: newSettings.address ?? prev.address,
          phone: newSettings.phone ?? prev.phone,
          email: newSettings.email ?? prev.email,
          currency: newSettings.currency ?? prev.currency,
          approvalThreshold: newSettings.approvalThreshold ?? prev.approvalThreshold,
        };
        setOrganizations((allOrgs) =>
          allOrgs.map((o) => (o.id === prev.id ? updatedOrg : o))
        );
        return updatedOrg;
      });
    }
  };

  // Audit Log helper
  const addAuditLog = useCallback(
    (action: string, recordReference: string, oldValue?: string, newValue?: string, details?: string) => {
      const newEntry: AuditLogEntry = {
        id: 'aud-' + Date.now(),
        organizationId: currentOrganization?.id,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        userName: currentUser?.fullName || 'System',
        role: currentUser?.role || 'System',
        action,
        recordReference,
        oldValue,
        newValue,
        details,
      };
      setAuditLogs((prev) => [newEntry, ...prev]);
    },
    [currentUser, currentOrganization?.id]
  );

  // Notification helper
  const addNotification = useCallback(
    (notif: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => {
      const newItem: NotificationItem = {
        ...notif,
        id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 6),
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newItem, ...prev]);
    },
    []
  );

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Auth, Organization & Staff Provisioning
  const login = async (email: string, pass: string) => {
    try {
      const response = await procuraApi.login(email.trim(), pass);
      const apiUser: ApiUser = response.user;
      const signedInUser: User = {
        id: apiUser.id,
        organizationId: apiUser.organizationId || undefined,
        departmentId: apiUser.departmentId || undefined,
        vendorId: apiUser.vendorId || undefined,
        fullName: apiUser.fullName,
        email: apiUser.email,
        phone: '',
        role: apiUser.role as UserRole,
        status: apiUser.status === 'pending' ? 'Pending' : apiUser.status === 'deactivated' ? 'Deactivated' : 'Active',
        avatar: apiUser.fullName.substring(0, 2).toUpperCase(),
        mustChangePassword: apiUser.mustChangePassword,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(signedInUser);
      // Never trust a locally selected organization as an authorization boundary.
      if (apiUser.organizationId) {
        try {
          const responseOrg = await procuraApi.currentOrganization();
          const row = responseOrg.organization;
          const serverOrg: Organization = {
            id: String(row.id),
            name: String(row.name),
            type: row.type as OrganizationType,
            industry: String(row.industry || ''),
            address: String(row.address || ''),
            phone: String(row.phone || ''),
            email: String(row.email || ''),
            approvalThreshold: Number(row.approval_threshold || 0),
            currency: String(row.currency || 'NGN') === 'NGN' ? '₦' : String(row.currency || '₦'),
            createdAt: String(row.created_at || new Date().toISOString()),
          };
          setCurrentOrganization(serverOrg);
          setOrganizations((previous) => [serverOrg, ...previous.filter((item) => item.id !== serverOrg.id)]);
        } catch {
          // Authentication succeeded; organization details can be refreshed after the API is available.
        }
      }
      return { success: true, mustChangePassword: apiUser.mustChangePassword };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unable to sign in. Check the API connection.' };
    }
  };

  const registerOrganization = (
    orgData: {
      name: string;
      type: OrganizationType;
      industry: string;
      address: string;
      phone: string;
      email: string;
      approvalThreshold?: number;
      initialBudget?: number;
      currency?: string;
    },
    adminData: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
    }
  ) => {
    const orgId = 'org-' + Date.now();
    const threshold =
      orgData.approvalThreshold ||
      (orgData.type === 'sole_proprietorship'
        ? 500000
        : orgData.type === 'mega_corporation'
        ? 50000000
        : 5000000);

    const newOrg: Organization = {
      id: orgId,
      name: orgData.name,
      type: orgData.type,
      industry: orgData.industry,
      address: orgData.address,
      phone: orgData.phone,
      email: orgData.email,
      approvalThreshold: threshold,
      currency: orgData.currency || '₦',
      createdAt: new Date().toISOString(),
    };

    // Auto-seed initial departments suited for the business type
    let newDepts: Department[] = [];
    if (orgData.type === 'sole_proprietorship') {
      newDepts = [
        {
          id: `dept-${orgId}-main`,
          organizationId: orgId,
          name: 'Studio & Production Operations',
          annualBudget: orgData.initialBudget || 20000000,
          spent: 0,
          committed: 0,
        },
      ];
    } else if (orgData.type === 'mega_corporation') {
      newDepts = [
        {
          id: `dept-${orgId}-ops`,
          organizationId: orgId,
          name: 'Division Operations & Infrastructure',
          annualBudget: orgData.initialBudget ? Math.round(orgData.initialBudget * 0.6) : 300000000,
          spent: 0,
          committed: 0,
        },
        {
          id: `dept-${orgId}-fin`,
          organizationId: orgId,
          name: 'Corporate Finance & Treasury',
          annualBudget: orgData.initialBudget ? Math.round(orgData.initialBudget * 0.25) : 150000000,
          spent: 0,
          committed: 0,
        },
        {
          id: `dept-${orgId}-proc`,
          organizationId: orgId,
          name: 'Strategic Procurement & Contracts',
          annualBudget: orgData.initialBudget ? Math.round(orgData.initialBudget * 0.15) : 80000000,
          spent: 0,
          committed: 0,
        },
      ];
    } else {
      newDepts = [
        {
          id: `dept-${orgId}-ops`,
          organizationId: orgId,
          name: 'Operations & Procurement',
          annualBudget: orgData.initialBudget ? Math.round(orgData.initialBudget * 0.6) : 50000000,
          spent: 0,
          committed: 0,
        },
        {
          id: `dept-${orgId}-fin`,
          organizationId: orgId,
          name: 'Finance & Accounts',
          annualBudget: orgData.initialBudget ? Math.round(orgData.initialBudget * 0.4) : 30000000,
          spent: 0,
          committed: 0,
        },
      ];
    }

    const adminUser: User = {
      id: 'user-' + Date.now(),
      organizationId: orgId,
      fullName: adminData.fullName,
      email: adminData.email,
      phone: adminData.phone,
      role: 'Organization Admin',
      status: 'Active',
      avatar: adminData.fullName.substring(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    setOrganizations((prev) => [newOrg, ...prev]);
    setDepartments((prev) => [...newDepts, ...prev]);
    setUsers((prev) => [adminUser, ...prev]);
    setCurrentOrganization(newOrg);
    setCurrentUser(adminUser);
    setSettings((prev) => ({
      ...prev,
      name: newOrg.name,
      type:
        newOrg.type === 'sole_proprietorship'
          ? 'Sole Proprietor / Small Business'
          : newOrg.type === 'mega_corporation'
          ? 'Mega Corporation / Public Parastatal'
          : 'Enterprise / Corporate',
      approvalThreshold: newOrg.approvalThreshold,
      currency: newOrg.currency || '₦',
      address: newOrg.address,
      phone: newOrg.phone,
      email: newOrg.email,
    }));

    addAuditLog(
      'Registered New Organization',
      newOrg.name,
      undefined,
      newOrg.type,
      `New organization registered by ${adminUser.fullName}. Type: ${newOrg.type}, Industry: ${newOrg.industry}`
    );

    return { success: true, organization: newOrg, adminUser };
  };

  const switchOrganization = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (!target) return;
    // Authenticated staff cannot cross organization boundaries by switching UI context.
    // The login screen can still select an organization before authentication.
    if (currentUser && currentUser.role !== 'Vendor' && currentUser.organizationId && currentUser.organizationId !== orgId) return;
    setCurrentOrganization(target);
    setSettings((prev) => ({
      ...prev,
      name: target.name,
      type:
        target.type === 'sole_proprietorship'
          ? 'Sole Proprietor / Small Business'
          : target.type === 'mega_corporation'
          ? 'Mega Corporation / Public Parastatal'
          : 'Enterprise / Corporate',
      approvalThreshold: target.approvalThreshold,
      currency: target.currency || '₦',
      address: target.address,
      phone: target.phone,
      email: target.email,
    }));

    addAuditLog(
      'Organization Context Switched',
      target.name,
      undefined,
      target.type,
      `Active context switched to ${target.name}`
    );
  };

  const provisionStaffUser = (data: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    departmentId?: string;
    tempPassword?: string;
    mustChangePassword?: boolean;
  }) => {
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return {
        success: false,
        tempPassword: '',
        error: 'A user account with this email address already exists.',
      };
    }

    const tempPass = data.tempPassword || `Procura#${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: 'user-' + Date.now(),
      organizationId: currentOrganization.id,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      departmentId:
        data.departmentId ||
        departments.find((d) => d.organizationId === currentOrganization.id)?.id,
      status: 'Active',
      avatar: data.fullName.substring(0, 2).toUpperCase(),
      mustChangePassword: data.mustChangePassword !== false,
      tempPassword: tempPass,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    addAuditLog(
      'Provisioned Staff Account',
      newUser.fullName,
      undefined,
      newUser.role,
      `Provisioned for ${currentOrganization.name} with temporary login credentials. Temporary password must be changed on first login.`
    );

    return { success: true, user: newUser, tempPassword: tempPass };
  };

  const changeTempPassword = async (userId: string, currentPass: string, newPass: string) => {
    if (!currentUser || currentUser.id !== userId) return { success: false, error: 'Sign in to the account whose password you are changing.' };
    if (newPass.length < 8) return { success: false, error: 'Password must be at least 8 characters.' };
    try {
      await procuraApi.changePassword(currentPass, newPass);
      setCurrentUser((previous) => previous ? { ...previous, mustChangePassword: false } : null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unable to change password.' };
    }
  };

  const resetUserPassword = (_userId: string, _newPass: string) => ({
    success: false,
    error: 'Secure password recovery is not configured yet. Contact your organization administrator.',
  });

  const logout = () => {
    void procuraApi.logout().catch(() => {});
    if (currentUser) {
      addAuditLog('User Logout', 'AUTH', `Role: ${currentUser.role}`, 'Logged Out', 'User ended session.');
    }
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      addAuditLog('Switched User Session', 'SWITCH', undefined, `Switched to ${found.fullName} (${found.role})`);
    }
  };

  const loadDemoData = () => {
    setOrganizations(INITIAL_ORGANIZATIONS);
    setCurrentOrganization(INITIAL_ORGANIZATIONS[0]);
    setSettings(INITIAL_SETTINGS);
    setDepartments(INITIAL_DEPARTMENTS);
    setCategories(INITIAL_CATEGORIES);
    setUsers(INITIAL_USERS);
    setVendors(INITIAL_VENDORS);
    setRequests(INITIAL_REQUESTS);
    setTenders(INITIAL_TENDERS);
    setBids(INITIAL_BIDS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setDeliveries(INITIAL_DELIVERIES);
    setPayments(INITIAL_PAYMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
  };

  const resetAllData = () => {
    loadDemoData();
  };

  // Request Workflows
  const createRequest = (data: Partial<PurchaseRequest>): PurchaseRequest => {
    const isSole = currentOrganization.type === 'sole_proprietorship';
    const orgPrefix =
      currentOrganization.id === 'org-husab'
        ? 'REQ-HUSB'
        : currentOrganization.id === 'org-nnpc'
        ? 'REQ-NNPC'
        : 'REQ-2026';

    const count =
      requests.filter((r) =>
        r.organizationId ? r.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
      ).length + 1;
    const ref = `${orgPrefix}-${count.toString().padStart(4, '0')}`;

    const orgDepts = departments.filter((d) =>
      d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
    );
    const assignedDeptId = data.departmentId || currentUser?.departmentId || orgDepts[0]?.id || 'dept-works';
    const assignedDept = departments.find((d) => d.id === assignedDeptId) || orgDepts[0];

    // Determine initial status: If explicitly supplied, use it; for sole proprietors, if not draft, default to direct approval
    const finalStatus: RequestStatus = data.status
      ? data.status
      : isSole
      ? 'Approved by Department'
      : 'Submitted';

    const isApproved = finalStatus === 'Approved by Department';

    const newReq: PurchaseRequest = {
      id: 'req-' + Date.now(),
      organizationId: currentOrganization.id,
      referenceNumber: ref,
      title: data.title || 'Untitled Request',
      departmentId: assignedDeptId,
      departmentName: assignedDept?.name || 'Operations',
      requesterId: currentUser?.id || 'unknown',
      requesterName: currentUser?.fullName || 'Requester',
      priority: data.priority || 'Normal',
      neededByDate: data.neededByDate || new Date().toISOString().split('T')[0],
      justification: data.justification || '',
      items: data.items || [],
      estimatedTotal: (data.items || []).reduce((acc, it) => acc + it.totalPrice, 0),
      status: finalStatus,
      reviewerId: isApproved ? currentUser?.id : undefined,
      reviewerName: isApproved ? currentUser?.fullName || (isSole ? 'Business Owner' : 'Administrator') : undefined,
      reviewComment: isApproved
        ? isSole
          ? 'Directly self-approved by Sole Proprietor / Business Owner'
          : 'Directly approved by Organization Administrator'
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);

    if (isApproved) {
      addAuditLog(
        isSole ? 'Requisition Self-Approved' : 'Requisition Directly Authorized',
        ref,
        undefined,
        'Approved by Department',
        `Authorized by ${newReq.reviewerName}. Estimated total: ₦${newReq.estimatedTotal.toLocaleString()}`
      );
      addNotification({
        userId: newReq.requesterId,
        title: isSole ? 'Requisition Self-Approved' : 'Requisition Approved',
        message: `${ref} is authorized and ready for tender conversion or purchase order generation.`,
        type: 'success',
        recordType: 'request',
        recordId: newReq.id,
      });
      addNotification({
        forRole: 'Procurement Officer',
        title: 'Approved Requisition in Queue',
        message: `Requisition ${ref} (${newReq.title}) is ready for tender conversion.`,
        type: 'info',
        recordType: 'request',
        recordId: newReq.id,
      });
    } else {
      addAuditLog(
        'Created Purchase Request',
        ref,
        undefined,
        `Status: ${newReq.status}`,
        `Estimated total: ₦${newReq.estimatedTotal.toLocaleString()}`
      );

      if (newReq.status === 'Submitted') {
        if (isSole) {
          addNotification({
            userId: currentUser?.id,
            title: 'New Requisition Awaiting Sign-Off',
            message: `Your requisition ${ref} is saved and awaiting your approval sign-off.`,
            type: 'info',
            recordType: 'request',
            recordId: newReq.id,
          });
        } else {
          addNotification({
            forRole: 'Department Head',
            title: 'New Purchase Request Submitted',
            message: `${newReq.requesterName} submitted ${ref} (${newReq.title}).`,
            type: 'info',
            recordType: 'request',
            recordId: newReq.id,
          });
        }
      }
    }

    return newReq;
  };

  const updateRequest = (id: string, data: Partial<PurchaseRequest>) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...data, updatedAt: new Date().toISOString() };
          addAuditLog('Updated Request', r.referenceNumber, `Status: ${r.status}`, `Status: ${updated.status}`, `Updated fields in request`);
          return updated;
        }
        return r;
      })
    );
  };

  // Next sequential reference number (max existing + 1) - never collides after deletions or across lists
  const nextRef = (prefix: string, existing: string[]) => {
    const year = new Date().getFullYear();
    const re = new RegExp('^' + prefix + '-' + year + '-(\\d+)$');
    const max = existing.reduce((m, r) => {
      const x = re.exec(r || '');
      return x ? Math.max(m, parseInt(x[1], 10)) : m;
    }, 0);
    return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`;
  };

  // Who may approve / return / reject a purchase request (separation of duties)
  const canReviewRequest = (r: PurchaseRequest): boolean => {
    if (!currentUser) return false;
    if (['Approved by Department', 'Converted to Tender', 'Rejected', 'Cancelled'].includes(r.status)) return false;
    if (currentOrganization.type === 'sole_proprietorship') return currentUser.role === 'Organization Admin';
    if (r.requesterId === currentUser.id) return false; // no self-approval
    if (currentUser.role === 'Organization Admin') return true;
    if (currentUser.role === 'Department Head') {
      return !currentUser.departmentId || currentUser.departmentId === r.departmentId;
    }
    return false;
  };

  const approveRequest = (id: string, reviewerComment?: string) => {
    const target = requests.find((r) => r.id === id);
    if (!target || !canReviewRequest(target)) return;
    const isSole = currentOrganization.type === 'sole_proprietorship';
    const isAdmin = currentUser?.role === 'Organization Admin';
    const approverTitle = isSole
      ? 'Business Owner'
      : isAdmin
      ? 'Organization Admin'
      : 'Department Head';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          addAuditLog(
            `${approverTitle} Approval Granted`,
            r.referenceNumber,
            r.status,
            'Approved by Department',
            reviewerComment || `Approved by ${approverTitle}`
          );
          addNotification({
            userId: r.requesterId,
            title: `Request Approved by ${approverTitle}`,
            message: `Your request ${r.referenceNumber} has been approved and moved to Procurement.`,
            type: 'success',
            recordType: 'request',
            recordId: r.id,
          });
          addNotification({
            forRole: 'Procurement Officer',
            title: 'Approved Request in Queue',
            message: `Request ${r.referenceNumber} is ready for tender conversion.`,
            type: 'info',
            recordType: 'request',
            recordId: r.id,
          });
          return {
            ...r,
            status: 'Approved by Department',
            reviewerId: currentUser?.id,
            reviewerName: currentUser?.fullName || approverTitle,
            reviewComment: reviewerComment || `Approved by ${approverTitle}`,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  const returnRequest = (id: string, comment: string) => {
    const target = requests.find((r) => r.id === id);
    if (!target || !canReviewRequest(target)) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          addAuditLog('Returned Request for Correction', r.referenceNumber, r.status, 'Returned for Correction', comment);
          addNotification({
            userId: r.requesterId,
            title: 'Request Returned for Correction',
            message: `Your request ${r.referenceNumber} requires modification: "${comment}"`,
            type: 'warning',
            recordType: 'request',
            recordId: r.id,
          });
          return {
            ...r,
            status: 'Returned for Correction',
            reviewerId: currentUser?.id,
            reviewerName: currentUser?.fullName,
            reviewComment: comment,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  const rejectRequest = (id: string, reason: string) => {
    const target = requests.find((r) => r.id === id);
    if (!target || !canReviewRequest(target)) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          addAuditLog('Rejected Request', r.referenceNumber, r.status, 'Rejected', reason);
          addNotification({
            userId: r.requesterId,
            title: 'Request Rejected',
            message: `Your request ${r.referenceNumber} was rejected: "${reason}"`,
            type: 'danger',
            recordType: 'request',
            recordId: r.id,
          });
          return {
            ...r,
            status: 'Rejected',
            reviewerId: currentUser?.id,
            reviewerName: currentUser?.fullName,
            reviewComment: reason,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  // Tender Creation & Matching
  const createTenderFromRequest = (requestId: string, tenderData: Partial<Tender>): Tender => {
    const req = requests.find((r) => r.id === requestId);
    const ref = nextRef('TND', tenders.map((t) => t.referenceNumber));

    // Auto-match vendors by categories
    const targetCats = tenderData.categories || (req?.items ? [...new Set(req.items.map((i) => i.category))] : []);
    const matchingVendors = vendors.filter((v) => {
      if (tenderData.restrictToMyVendors && !v.inMyVendors) return false;
      return v.categories.some((c) => targetCats.includes(c));
    });

    const newTender: Tender = {
      id: 'tnd-' + Date.now(),
      organizationId: currentOrganization.id,
      organizationName: currentOrganization.name,
      referenceNumber: ref,
      requestId,
      requestReference: req ? req.referenceNumber : '',
      title: tenderData.title || req?.title || 'Tender',
      description: tenderData.description || req?.justification || '',
      departmentId: req?.departmentId || 'dept-works',
      departmentName: req?.departmentName || 'Works & Infrastructure',
      categories: targetCats,
      items:
        tenderData.items ||
        (req?.items.map((i) => ({
          id: 'ti-' + i.id,
          description: i.description,
          category: i.category,
          subcategory: i.subcategory,
          quantity: i.quantity,
          unit: i.unit,
          specifications: 'Standard commercial grade as specified.',
        })) || []),
      deliveryLocation:
        tenderData.deliveryLocation ||
        `${currentOrganization.name} Central Facility, ${currentOrganization.address || 'Abuja'}`,
      requiredDeliveryPeriodDays: tenderData.requiredDeliveryPeriodDays || 21,
      bidOpeningDate: new Date().toISOString().split('T')[0],
      bidClosingDateTime:
        tenderData.bidClosingDateTime ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      evaluationWeights: tenderData.evaluationWeights || settings.defaultEvaluationWeights,
      mandatoryDocuments: tenderData.mandatoryDocuments || settings.requiredComplianceDocs,
      restrictToMyVendors: !!tenderData.restrictToMyVendors,
      status: 'Open',
      matchingVendorsNotifiedCount: matchingVendors.length,
      createdAt: new Date().toISOString(),
    };

    setTenders((prev) => [newTender, ...prev]);

    // Mark request as Converted to Tender
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'Converted to Tender', tenderId: newTender.id } : r))
    );

    // Notify matching vendors
    matchingVendors.forEach((v) => {
      addNotification({
        userId: v.userId,
        forRole: 'Vendor',
        title: 'New Tender Opportunity',
        message: `Tender ${ref} (${newTender.title}) has been published in your category.`,
        type: 'info',
        recordType: 'tender',
        recordId: newTender.id,
      });
    });

    addAuditLog(
      'Published Tender',
      ref,
      `Request: ${req?.referenceNumber}`,
      'Status: Open',
      `Auto-notified ${matchingVendors.length} registered vendors matching categories: ${targetCats.join(', ')}`
    );

    return newTender;
  };

  const extendTenderDeadline = (tenderId: string, newDate: string, reason: string) => {
    const tender = tenders.find((t) => t.id === tenderId);
    if (!tender || !currentUser) return;
    if (!['Procurement Officer', 'Organization Admin'].includes(currentUser.role)) return;
    if (tender.organizationId && tender.organizationId !== currentOrganization.id) return;
    const oldDeadline = new Date(tender.bidClosingDateTime).getTime();
    const proposedDeadline = new Date(newDate).getTime();
    // A tender can only be extended before its original deadline while it remains open.
    if (tender.status !== 'Open' || !Number.isFinite(oldDeadline) || oldDeadline <= Date.now()) return;
    if (!Number.isFinite(proposedDeadline) || proposedDeadline <= oldDeadline || proposedDeadline <= Date.now()) return;
    if (!reason.trim()) return;
    setTenders((prev) => prev.map((t) => {
      if (t.id !== tenderId) return t;
      addAuditLog('Extended Tender Deadline', t.referenceNumber, t.bidClosingDateTime, newDate, `Reason: ${reason.trim()}`);
      return { ...t, bidClosingDateTime: newDate, extendedDeadlineReason: reason.trim() };
    }));
  };

  const cancelTender = (tenderId: string, reason: string) => {
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id === tenderId) {
          addAuditLog('Cancelled Tender', t.referenceNumber, t.status, 'Cancelled', `Reason: ${reason}`);
          return {
            ...t,
            status: 'Cancelled',
            cancellationReason: reason,
          };
        }
        return t;
      })
    );
  };

  // Vendor Bidding - Enforce single bid submission per vendor (Section 6.4)
  const submitBid = (tenderId: string, bidData: Partial<Bid>): Bid => {
    const tnd = tenders.find((t) => t.id === tenderId);
    const vendor = vendors.find((v) => v.id === (bidData.vendorId || currentUser?.vendorId));
    if (!tnd) throw new Error('This tender no longer exists.');
    if (!vendor) throw new Error('Your vendor profile could not be found. Please sign in again.');
    if (tnd.status !== 'Open') throw new Error('This tender is not open for bidding.');
    if (new Date(tnd.bidClosingDateTime).getTime() < Date.now()) throw new Error('The bid closing time for this tender has passed.');
    if (!vendor.categories.some((c) => tnd.categories.includes(c))) throw new Error('Your registered supply categories do not match this tender.');
    const bidTotal = (bidData.items || []).reduce((acc, it) => acc + (it.totalPrice || 0), 0);
    if (!(bidData.items || []).length || bidTotal <= 0 || (bidData.items || []).some((it) => !(it.unitPrice > 0))) {
      throw new Error('Every item needs a unit price greater than zero.');
    }
    const targetVendorId = vendor.id;

    // Check if vendor has already submitted a bid for this tender
    const existing = bids.find((b) => b.tenderId === tenderId && b.vendorId === targetVendorId);
    if (existing) {
      return existing; // Vendor can only submit a bid once per tender!
    }

    // Check if vendor is suspended specifically by the procuring organization
    if (vendor && tnd?.organizationId) {
      const eff = getVendorEffectiveStatus(vendor, tnd.organizationId);
      if (eff.status === 'Suspended' || eff.status === 'Blacklisted') {
        throw new Error(`Vendor ${vendor.businessName} is currently ${eff.status.toLowerCase()} by this organization.`);
      }
    }

    const ref = nextRef('BID', bids.map((b) => b.referenceNumber));
    const total = (bidData.items || []).reduce((acc, it) => acc + it.totalPrice, 0);

    const newBid: Bid = {
      id: 'bid-' + Date.now(),
      referenceNumber: ref,
      tenderId,
      tenderReference: tnd?.referenceNumber || '',
      vendorId: targetVendorId,
      vendorName: vendor.businessName,
      items: bidData.items || [],
      totalAmount: total,
      proposedDeliveryDate: bidData.proposedDeliveryDate || new Date().toISOString().split('T')[0],
      warrantyPeriod: bidData.warrantyPeriod || '12 Months',
      technicalProposal: bidData.technicalProposal || '',
      uploadedDocuments: bidData.uploadedDocuments || {},
      legalWarningAcknowledged: !!bidData.legalWarningAcknowledged,
      legalWarningTimestamp: bidData.legalWarningTimestamp || new Date().toISOString(),
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
    };

    setBids((prev) => [newBid, ...prev]);
    addAuditLog('Submitted Bid', ref, undefined, `Tender: ${tnd?.referenceNumber}`, `Total: ₦${total.toLocaleString()}, Legal acknowledgement recorded.`);

    addNotification({
      forRole: 'Procurement Officer',
      title: 'New Bid Received',
      message: `A new bid was submitted for ${tnd?.referenceNumber} by ${newBid.vendorName}.`,
      type: 'info',
      recordType: 'tender',
      recordId: tenderId,
    });

    return newBid;
  };

  // Evaluation & Scoring Algorithm
  const evaluateCompliance = (bidId: string, passed: boolean, reason?: string) => {
    setBids((prev) =>
      prev.map((b) => {
        if (b.id === bidId) {
          addAuditLog('Compliance Evaluation', b.referenceNumber, undefined, passed ? 'Passed' : 'Disqualified', reason);
          return {
            ...b,
            compliancePassed: passed,
            complianceReason: reason,
          };
        }
        return b;
      })
    );
  };

  const evaluateTechnical = (bidId: string, score: number, comments: string) => {
    setBids((prev) =>
      prev.map((b) => {
        if (b.id === bidId) {
          addAuditLog('Technical Evaluation Score', b.referenceNumber, undefined, `Score: ${score}/100`, comments);
          return {
            ...b,
            technicalScore: score,
            technicalComments: comments,
          };
        }
        return b;
      })
    );
  };

  const calculateVendorRecommendations = (tenderId: string): Bid[] => {
    const tnd = tenders.find((t) => t.id === tenderId);
    if (!tnd) return [];

    const tenderBids = bids.filter((b) => b.tenderId === tenderId && b.compliancePassed !== false);
    if (tenderBids.length === 0) return [];

    const weights = tnd.evaluationWeights;

    // 1. Price Score: Lowest bid gets 100, others get lowest / their price * 100
    const prices = tenderBids.map((b) => b.totalAmount).filter((p) => p > 0);
    const minPrice = Math.min(...prices);

    // 2. Delivery Time Score: Calculate days from today or tender open date to proposed delivery date
    const deliveryDays = tenderBids.map((b) => {
      const days = Math.max(1, Math.round((new Date(b.proposedDeliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
      return days;
    });
    const minDays = Math.min(...deliveryDays);

    const scoredBids = tenderBids.map((bid) => {
      const vendor = vendors.find((v) => v.id === bid.vendorId);
      const priceScore = minPrice > 0 && bid.totalAmount > 0 ? (minPrice / bid.totalAmount) * 100 : 0;

      const currentDays = Math.max(1, Math.round((new Date(bid.proposedDeliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
      const deliveryScore = minDays > 0 ? (minDays / currentDays) * 100 : 100;

      // Reliability Score: from vendor history (neutral 60 if new)
      const reliabilityScore = vendor ? vendor.reliabilityScore : 60;

      // Technical Score: entered by officer (defaults to 75 if not yet entered)
      const technicalScore = bid.technicalScore !== undefined ? bid.technicalScore : 75;

      const totalWeightedScore =
        (priceScore * weights.price +
          deliveryScore * weights.deliveryTime +
          reliabilityScore * weights.vendorReliability +
          technicalScore * weights.technicalScore) /
        100;

      return {
        ...bid,
        computedScores: {
          priceScore: parseFloat(priceScore.toFixed(1)),
          deliveryScore: parseFloat(deliveryScore.toFixed(1)),
          reliabilityScore: parseFloat(reliabilityScore.toFixed(1)),
          technicalScore: parseFloat(technicalScore.toFixed(1)),
          totalWeightedScore: parseFloat(totalWeightedScore.toFixed(2)),
          rank: 0,
        },
      };
    });

    // Rank bids descending by total weighted score
    scoredBids.sort((a, b) => (b.computedScores?.totalWeightedScore || 0) - (a.computedScores?.totalWeightedScore || 0));
    scoredBids.forEach((b, idx) => {
      if (b.computedScores) b.computedScores.rank = idx + 1;
    });

    // Update in state only if scores actually changed
    setBids((prev) => {
      let hasChanges = false;
      const next = prev.map((b) => {
        const found = scoredBids.find((sb) => sb.id === b.id);
        if (!found) return b;
        const curScore = b.computedScores?.totalWeightedScore;
        const nextScore = found.computedScores?.totalWeightedScore;
        const curRank = b.computedScores?.rank;
        const nextRank = found.computedScores?.rank;
        if (curScore !== nextScore || curRank !== nextRank) {
          hasChanges = true;
          return found;
        }
        return b;
      });
      return hasChanges ? next : prev;
    });

    return scoredBids;
  };

  // Award Decision & PO Generation
  const awardTender = (
    tenderId: string,
    winningBidId: string,
    justification?: string,
    budgetOverrideReason?: string
  ): { requiresAuthority: boolean; poCreated?: PurchaseOrder; blocked?: string } => {
    const tnd = tenders.find((t) => t.id === tenderId);
    const winBid = bids.find((b) => b.id === winningBidId);
    if (!tnd || !winBid) return { requiresAuthority: false, blocked: 'Tender or bid not found.' };
    // Procurement submits recommendations; Finance may submit a documented budget override.
    // Only the Approving Authority can finalize an award and generate a purchase order.
    if (
      currentUser?.role !== 'Procurement Officer' &&
      !(currentUser?.role === 'Finance Officer' && !!budgetOverrideReason?.trim())
    ) return { requiresAuthority: false, blocked: 'Only Procurement can recommend an award; Finance may submit a documented budget override.' };
    if (tnd.organizationId && tnd.organizationId !== currentOrganization.id) {
      return { requiresAuthority: false, blocked: 'This tender belongs to another organization.' };
    }
    if (tnd.status === 'Awarded' || tnd.awaitingAuthorityApproval) {
      return { requiresAuthority: false, blocked: 'This tender has already been awarded or is awaiting authority approval.' };
    }
    if (winBid.tenderId !== tenderId) return { requiresAuthority: false, blocked: 'That bid does not belong to this tender.' };
    if (winBid.compliancePassed === false) return { requiresAuthority: false, blocked: 'This bid failed the compliance check and cannot be awarded.' };

    const dept = departments.find((d) => d.id === tnd.departmentId);

    // Budget enforcement (only a Finance override reason lets an over-budget award through)
    if (dept && !budgetOverrideReason) {
      const remaining = dept.annualBudget - dept.spent - dept.committed;
      if (winBid.totalAmount > remaining) {
        return { requiresAuthority: false, blocked: `Award exceeds the ${dept.name} remaining budget. A Finance budget override is required.` };
      }
    }

    {
      // Every award recommendation requires Approving Authority sign-off before a PO exists.
      setTenders((prev) =>
        prev.map((t) =>
          t.id === tenderId
            ? { ...t, status: 'Under Evaluation', awaitingAuthorityApproval: true, pendingAuthorityBidId: winBid.id }
            : t
        )
      );
      addNotification({
        forRole: 'Approving Authority',
        title: 'Award Awaiting Your Sign-off',
        message: `Tender ${tnd.referenceNumber} has an award recommendation for ${winBid.vendorName} at ${currentOrganization.currency || '₦'}${winBid.totalAmount.toLocaleString()}. Your decision is required before a purchase order can be issued.`,
        type: 'warning',
        recordType: 'tender',
        recordId: tenderId,
      });
      addAuditLog(
        'Award Recommendation Sent for Authority Approval',
        tnd.referenceNumber,
        'Under Evaluation',
        'Awaiting Approving Authority',
        `${winBid.vendorName} at \u20a6${winBid.totalAmount.toLocaleString()}. ${justification || ''}${budgetOverrideReason ? ' Budget override: ' + budgetOverrideReason : ''}`
      );
      return { requiresAuthority: true };
    }

    return { requiresAuthority: true };
  };

  const finalizeAward = (
    tenderId: string,
    winBid: Bid,
    vendor?: VendorProfile,
    dept?: Department,
    justification?: string
  ) => {
    const tnd = tenders.find((t) => t.id === tenderId);
    const poRef = nextRef('PO', purchaseOrders.map((p) => p.referenceNumber));

    // Update tender status and store awardedBidId
    setTenders((prev) =>
      prev.map((t) =>
        t.id === tenderId
          ? {
              ...t,
              status: 'Awarded',
              awaitingAuthorityApproval: false,
              pendingAuthorityBidId: undefined,
              awardedBidId: winBid.id,
            }
          : t
      )
    );

    // Update bids status: winner = Awarded, others = Not Selected
    setBids((prev) =>
      prev.map((b) => {
        if (b.tenderId === tenderId) {
          return {
            ...b,
            status: b.id === winBid.id ? 'Awarded' : 'Not Selected',
          };
        }
        return b;
      })
    );

    // Generate Purchase Order
    const newPO: PurchaseOrder = {
      id: 'po-' + Date.now(),
      organizationId: currentOrganization.id,
      referenceNumber: poRef,
      tenderId,
      tenderReference: tnd?.referenceNumber || '',
      awardId: 'award-' + Date.now(),
      vendorId: winBid.vendorId,
      vendorName: winBid.vendorName,
      vendorAddress: vendor?.address || 'Nigeria',
      vendorPhone: vendor?.phone || '',
      vendorEmail: vendor?.email || '',
      departmentId: dept?.id || 'dept-works',
      departmentName: dept?.name || 'Works',
      items: winBid.items.map((bi) => ({
        id: 'poi-' + bi.itemId,
        description: bi.description,
        quantity: bi.quantity,
        unit: bi.unit,
        unitPrice: bi.unitPrice,
        totalPrice: bi.totalPrice,
        receivedQuantity: 0,
      })),
      totalAmount: winBid.totalAmount,
      expectedDeliveryDate: winBid.proposedDeliveryDate,
      deliveryLocation: tnd?.deliveryLocation || `${currentOrganization.name} Operating Facility, ${currentOrganization.address || 'Nigeria'}`,
      terms: 'Payment strictly net 14 days upon delivery acceptance and verification.',
      status: 'Issued',
      issuedAt: new Date().toISOString(),
      paidAmount: 0,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    // Update Department Committed Budget
    if (dept) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === dept.id ? { ...d, committed: d.committed + winBid.totalAmount } : d))
      );
    }

    // Notifications
    addNotification({
      userId: vendor?.userId,
      forRole: 'Vendor',
      title: 'Congratulations! Tender Awarded',
      message: `Your bid for ${tnd?.referenceNumber} (${tnd?.title}) was accepted. Purchase Order ${poRef} has been issued.`,
      type: 'success',
      recordType: 'po',
      recordId: newPO.id,
    });

    addAuditLog(
      'Tender Awarded & PO Issued',
      tnd?.referenceNumber || '',
      'Under Evaluation',
      `Awarded to ${winBid.vendorName}`,
      `PO Reference ${poRef} issued for ₦${winBid.totalAmount.toLocaleString()}. ${justification || ''}`
    );

    return { requiresAuthority: false, poCreated: newPO };
  };

  const authorityApproveAward = (tenderId: string, approved: boolean, reason?: string) => {
    const tnd = tenders.find((t) => t.id === tenderId);
    const winBidId = tnd?.pendingAuthorityBidId || bids.find((b) => b.tenderId === tenderId)?.id;
    const winBid = bids.find((b) => b.id === winBidId);
    if (!tnd || !winBid) return;
    if (currentUser?.role !== 'Approving Authority') return;
    if (!tnd.awaitingAuthorityApproval) return;

    if (approved) {
      const vendor = vendors.find((v) => v.id === winBid.vendorId);
      const dept = departments.find((d) => d.id === tnd.departmentId);
      finalizeAward(tenderId, winBid, vendor, dept, `Approved by Authority: ${reason || 'Approved'}`);
    } else {
      setTenders((prev) =>
        prev.map((t) =>
          t.id === tenderId
            ? { ...t, awaitingAuthorityApproval: false, pendingAuthorityBidId: undefined }
            : t
        )
      );
      addAuditLog('Award Rejected by Approving Authority', tnd.referenceNumber, 'Awaiting Authority', 'Under Evaluation', reason || 'Rejected');
      addNotification({
        forRole: 'Procurement Officer',
        title: 'Award Decision Returned by Approving Authority',
        message: `Award for ${tnd.referenceNumber} was not approved: "${reason}". Returned to evaluation.`,
        type: 'danger',
        recordType: 'tender',
        recordId: tenderId,
      });
    }
  };

  const overrideBudgetAndAward = (tenderId: string, winningBidId: string, overrideReason: string) => {
    const tnd = tenders.find((t) => t.id === tenderId);
    if (!tnd) return { requiresAuthority: false, blocked: 'Tender not found.' };
    addAuditLog(
      'Budget Override Approved by Finance',
      tnd.referenceNumber,
      'Budget Exceeded',
      'Override Granted',
      `Reason: ${overrideReason}`
    );
    return awardTender(tenderId, winningBidId, `Budget override: ${overrideReason}`, overrideReason);
  };

  // PO & Delivery Actions
  const acknowledgePO = (poId: string) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          addAuditLog('PO Acknowledged by Vendor', po.referenceNumber, po.status, 'Acknowledged', 'Vendor accepted terms and timeline');
          addNotification({
            forRole: 'Procurement Officer',
            title: 'Purchase Order Acknowledged',
            message: `${po.vendorName} acknowledged ${po.referenceNumber}. Delivery expected ${po.expectedDeliveryDate}.`,
            type: 'info',
            recordType: 'po',
            recordId: po.id,
          });
          return { ...po, status: 'Acknowledged', acknowledgedAt: new Date().toISOString() };
        }
        return po;
      })
    );
  };

  const dispatchDelivery = (poId: string, notes: string) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          addAuditLog('Items Dispatched by Vendor', po.referenceNumber, po.status, 'Dispatched', notes);
          addNotification({
            forRole: 'Procurement Officer',
            title: 'Items Dispatched by Vendor',
            message: `${po.vendorName} dispatched items for ${po.referenceNumber}. Notes: ${notes}`,
            type: 'info',
            recordType: 'po',
            recordId: po.id,
          });
          return {
            ...po,
            dispatchedAt: new Date().toISOString(),
            dispatchNotes: notes,
          };
        }
        return po;
      })
    );
  };

  const receiveDelivery = (poId: string, itemsReceived: DeliveryRecord['itemsReceived']) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const expected = new Date(po.expectedDeliveryDate);
    const actual = new Date(todayStr);

    const diffDays = Math.round((actual.getTime() - expected.getTime()) / (1000 * 3600 * 24));
    const isOnTime = diffDays <= 0;
    const lateDays = isOnTime ? 0 : diffDays;

    // Cumulative accepted quantity per PO line (previous deliveries + this one; rejected goods never count)
    const acceptedNow = po.items.map((it, idx) => {
      const rec = itemsReceived[idx];
      // Partial acceptance counts toward received quantity; rejected lines never do.
      const outstanding = Math.max(0, it.quantity - (it.receivedQuantity || 0));
      return rec && rec.status !== 'Rejected' ? Math.max(0, Math.min(rec.received, outstanding)) : 0;
    });
    const newReceived = po.items.map((it, idx) => Math.min(it.quantity, (it.receivedQuantity || 0) + acceptedNow[idx]));
    const isFull = po.items.every((it, idx) => newReceived[idx] >= it.quantity);
    const hasAcceptedItems = acceptedNow.some((n) => n > 0);
    const hasRejectedItems = itemsReceived.some((item) => item.status === 'Rejected');

    // Record every inspection, including fully rejected consignments, for a resolution trail.
    const newDelivery: DeliveryRecord = {
      id: 'del-' + Date.now(),
      organizationId: currentOrganization.id,
      purchaseOrderId: poId,
      poReference: po.referenceNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      dispatchDate: po.dispatchedAt || todayStr,
      dispatchNotes: po.dispatchNotes || 'Standard delivery consignment',
      receivedDate: todayStr,
      receivedByUserId: currentUser?.id || 'officer',
      receivedByName: currentUser?.fullName || 'Receiving Officer',
      itemsReceived,
      isFullyDelivered: isFull,
      onTime: isOnTime,
      lateDays,
      resolutionStatus: hasRejectedItems ? 'Pending' : undefined,
    };

    setDeliveries((prev) => [
      newDelivery,
      ...prev.map((delivery) =>
        delivery.purchaseOrderId === poId && delivery.resolutionStatus === 'Pending' && isFull
          ? { ...delivery, resolutionStatus: 'Resolved' as const, resolutionNotes: `Outstanding quantities were accepted during reinspection on ${todayStr}.` }
          : delivery
      ),
    ]);

    // Update PO status
    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          return {
            ...p,
            status: isFull ? 'Delivered' : hasAcceptedItems ? 'Partially Delivered' : p.status,
            actualDeliveryDate: todayStr,
            deliveredOnTime: isOnTime,
            lateDays,
            items: p.items.map((it, idx) => ({
              ...it,
              receivedQuantity: newReceived[idx],
            })),
          };
        }
        return p;
      })
    );

    // Update Vendor reliability metrics
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === po.vendorId) {
          const onTime = isOnTime ? v.onTimeDeliveries + 1 : v.onTimeDeliveries;
          const late = !isOnTime ? v.lateDeliveries + 1 : v.lateDeliveries;
          const total = onTime + late;
          const newScore = total > 0 ? Math.round((onTime / total) * 100) : v.reliabilityScore;
          return {
            ...v,
            onTimeDeliveries: onTime,
            lateDeliveries: late,
            reliabilityScore: newScore,
          };
        }
        return v;
      })
    );

    addAuditLog(
      'Store Receiving Inspection Recorded',
      po.referenceNumber,
      po.status,
      isFull ? 'Delivered' : hasAcceptedItems ? 'Partially Delivered' : 'Rejected / Resolution Required',
      `Accepted quantities recorded. Rejected lines: ${itemsReceived.filter((item) => item.status === 'Rejected').length}. On-time: ${isOnTime ? 'Yes' : `Late by ${lateDays} days`}`
    );

    if (hasRejectedItems) {
      addNotification({
        forRole: 'Procurement Officer',
        title: 'Rejected Delivery Requires Resolution',
        message: `Inspection for ${po.referenceNumber} includes rejected line items. Arrange replacement, return, or a documented resolution before closure.`,
        type: 'warning',
        recordType: 'po',
        recordId: po.id,
      });
    }

    if (hasAcceptedItems) {
      addNotification({
        forRole: 'Finance Officer',
        title: 'Delivery Received - Payment Review',
        message: `Accepted goods for ${po.referenceNumber} were recorded. Review payment only against accepted quantities and the outstanding PO balance.`,
        type: 'info',
        recordType: 'po',
        recordId: po.id,
      });
    }
  };

  // Payments
  const recordPayment = (
    paymentData: Omit<PaymentRecord, 'id' | 'voucherNumber' | 'recordedByUserId' | 'recordedByName'>
  ): PaymentRecord | null => {
    const voucherNumber = nextRef('PV', payments.map((p) => p.voucherNumber));
    const po = purchaseOrders.find((p) => p.id === paymentData.purchaseOrderId);
    if (!po) return null;
    if (!['Delivered', 'Partially Delivered'].includes(po.status)) return null; // pay only against received goods
    const outstanding = po.totalAmount - po.paidAmount;
    if (!(paymentData.amount > 0) || paymentData.amount > outstanding + 0.005) return null;

    const newPayment: PaymentRecord = {
      ...paymentData,
      id: 'pay-' + Date.now(),
      voucherNumber,
      recordedByUserId: currentUser?.id || 'finance',
      recordedByName: currentUser?.fullName || 'Finance Officer',
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Update PO paid amount and status
    if (po) {
      const updatedPaid = po.paidAmount + paymentData.amount;
      const isFullyPaid = updatedPaid >= po.totalAmount;
      const isCompleted = isFullyPaid && (po.status === 'Delivered' || po.items.every((i) => i.receivedQuantity >= i.quantity));

      setPurchaseOrders((prev) =>
        prev.map((p) =>
          p.id === po.id
            ? {
                ...p,
                paidAmount: updatedPaid,
                status: isCompleted ? 'Closed' : p.status,
              }
            : p
        )
      );

      // Update Department budget: reduce committed, increase spent
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === po.departmentId
            ? {
                ...d,
                spent: d.spent + paymentData.amount,
                committed: Math.max(0, d.committed - paymentData.amount),
              }
            : d
        )
      );

      // Trigger Celebration Animation if fully closed!
      if (isCompleted) {
        setCelebrationOpen(true);
      }
    }

    addAuditLog(
      'Recorded Payment',
      voucherNumber,
      undefined,
      `Paid: ₦${paymentData.amount.toLocaleString()}`,
      `Method: ${paymentData.method}, Ref: ${paymentData.referenceNumber}`
    );

    addNotification({
      userId: vendors.find((v) => v.id === paymentData.vendorId)?.userId,
      forRole: 'Vendor',
      title: 'Payment Remittance Issued',
      message: `Payment voucher ${voucherNumber} of ₦${paymentData.amount.toLocaleString()} has been processed for ${paymentData.poReference}.`,
      type: 'success',
      recordType: 'payment',
      recordId: newPayment.id,
    });

    return newPayment;
  };

  // Vendor Directory Management
  const toggleMyVendor = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const newVal = !v.inMyVendors;
          addAuditLog('Updated Vendor List', v.businessName, v.inMyVendors ? 'In My Vendors' : 'Standard', newVal ? 'Added to My Vendors' : 'Removed from My Vendors');
          return { ...v, inMyVendors: newVal };
        }
        return v;
      })
    );
  };

  const updateVendorStatus = (
    vendorId: string,
    status: VendorProfile['status'],
    reason?: string,
    targetOrgId?: string
  ) => {
    const orgId = targetOrgId || currentOrganization.id;
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const orgStatuses = { ...(v.organizationStatuses || {}) };
          const previousStatus = orgStatuses[orgId]?.status || 'Approved';
          orgStatuses[orgId] = {
            status,
            reason,
            updatedAt: new Date().toISOString(),
          };
          addAuditLog(
            'Vendor Status Changed',
            `${v.businessName} (${currentOrganization.name})`,
            previousStatus,
            status,
            reason
          );
          return {
            ...v,
            organizationStatuses: orgStatuses,
          };
        }
        return v;
      })
    );
  };

  const getVendorEffectiveStatus = (
    vendor: VendorProfile,
    orgId?: string
  ): { status: VendorProfile['status']; reason?: string } => {
    const targetOrg = orgId || currentOrganization.id;
    if (vendor.organizationStatuses && vendor.organizationStatuses[targetOrg]) {
      return vendor.organizationStatuses[targetOrg];
    }
    // Default fallback: unless specifically suspended by this target organization, vendor is active & approved
    return { status: vendor.status === 'Registered' ? 'Registered' : 'Approved' };
  };

  // Budget Adjustments
  const adjustBudget = (deptId: string, newBudget: number, reason: string) => {
    if (currentUser?.role !== 'Finance Officer') return;
    const dept = departments.find((d) => d.id === deptId);
    if (!dept || (dept.organizationId && dept.organizationId !== currentOrganization.id)) return;
    if (!Number.isFinite(newBudget) || newBudget < 0 || !reason.trim()) return;

    const oldBudget = dept.annualBudget;
    const newChange: BudgetChange = {
      id: 'bc-' + Date.now(),
      departmentId: deptId,
      departmentName: dept.name,
      previousBudget: oldBudget,
      newBudget,
      reason,
      changedBy: currentUser?.fullName || 'Finance',
      changedAt: new Date().toISOString(),
    };

    setBudgetChanges((prev) => [newChange, ...prev]);
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, annualBudget: newBudget } : d))
    );

    addAuditLog('Adjusted Department Budget', dept.name, `₦${oldBudget.toLocaleString()}`, `₦${newBudget.toLocaleString()}`, reason);
  };

  // Admin User Management
  const adminApproveUser = (userId: string, role: UserRole, deptId?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          addAuditLog('Approved Staff Account', u.fullName, 'Pending', role, `Department: ${deptId || 'None'}`);
          return { ...u, role, departmentId: deptId, status: 'Active' };
        }
        return u;
      })
    );
  };

  const adminUpdateUserRole = (userId: string, newRole: UserRole, deptId?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          addAuditLog('Changed User Role', u.fullName, u.role, newRole, `Dept: ${deptId || u.departmentId}`);
          return { ...u, role: newRole, departmentId: deptId || u.departmentId };
        }
        return u;
      })
    );
  };

  const adminToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Deactivated' : 'Active';
          addAuditLog('Toggled User Status', u.fullName, u.status, nextStatus);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const adminResetUserPassword = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      addAuditLog('Admin Password Reset', user.fullName, undefined, 'Temporary Password Set', 'Forced change required at next sign in.');
    }
  };

  // Categories
  const addCategory = (name: string, subcategories: string[]) => {
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name,
      subcategories,
      active: true,
    };
    setCategories((prev) => [...prev, newCat]);
    addAuditLog('Created Category', name, undefined, 'Active', `Subcategories: ${subcategories.join(', ')}`);
  };

  const deactivateCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          addAuditLog('Deactivated Category', c.name, 'Active', 'Inactive', 'Category can no longer be tagged on new tenders');
          return { ...c, active: false };
        }
        return c;
      })
    );
  };

  const reactivateCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          addAuditLog('Reactivated Category', c.name, 'Inactive', 'Active', 'Category reactivated for procurement use');
          return { ...c, active: true };
        }
        return c;
      })
    );
  };

  const editCategory = (categoryId: string, newName: string, newSubcategories: string[]) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          addAuditLog('Edited Category', c.name, undefined, newName, `Subcategories: ${newSubcategories.join(', ')}`);
          return { ...c, name: newName, subcategories: newSubcategories };
        }
        return c;
      })
    );
  };

  // Export & Import Database JSON
  const exportDatabaseJson = (): string => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      organization: currentOrganization.name,
      settings,
      departments,
      users,
      categories,
      vendors,
      requests,
      tenders,
      bids,
      purchaseOrders,
      deliveries,
      payments,
      budgetChanges,
      notifications,
      auditLogs,
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) setSettings(data.settings);
      if (data.departments) setDepartments(data.departments);
      if (data.users) setUsers(data.users);
      if (data.categories) setCategories(data.categories);
      if (data.vendors) setVendors(data.vendors);
      if (data.requests) setRequests(data.requests);
      if (data.tenders) setTenders(data.tenders);
      if (data.bids) setBids(data.bids);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.deliveries) setDeliveries(data.deliveries);
      if (data.payments) setPayments(data.payments);
      if (data.notifications) setNotifications(data.notifications);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      return true;
    } catch {
      return false;
    }
  };

  // Inactivity Timer
  const resetInactivityTimer = useCallback(() => {
    setInactivityModalOpen(false);
  }, []);

  const staySignedIn = () => {
    setInactivityModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        organizations,
        currentOrganization,
        switchOrganization,
        registerOrganization,
        provisionStaffUser,
        changeTempPassword,
    resetUserPassword,
        settings,
        updateSettings,
        departments,
        users,
        categories,
        vendors,
        requests,
        tenders,
        bids,
        purchaseOrders,
        deliveries,
        payments,
        budgetChanges,
        notifications,
        auditLogs,
        currentUser,
        isAuthenticated: !!currentUser,
        theme,
        setTheme,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        login,
        logout,
        switchUser,
        loadDemoData,
        resetAllData,
        addAuditLog,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        createRequest,
        updateRequest,
        approveRequest,
        returnRequest,
        rejectRequest,
        createTenderFromRequest,
        extendTenderDeadline,
        cancelTender,
        submitBid,
        evaluateCompliance,
        evaluateTechnical,
        calculateVendorRecommendations,
        awardTender,
        authorityApproveAward,
        overrideBudgetAndAward,
        acknowledgePO,
        dispatchDelivery,
        receiveDelivery,
        recordPayment,
        toggleMyVendor,
        updateVendorStatus,
        getVendorEffectiveStatus,
        adjustBudget,
        adminApproveUser,
        adminUpdateUserRole,
        adminToggleUserStatus,
        adminResetUserPassword,
        addCategory,
        deactivateCategory,
        reactivateCategory,
        editCategory,
        menuOpen,
        setMenuOpen,
        toggleMenu,
        exportDatabaseJson,
        importDatabaseJson,
        inactivityModalOpen,
        resetInactivityTimer,
        staySignedIn,
        celebrationOpen,
        setCelebrationOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
