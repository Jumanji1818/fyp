import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { appStorage } from '../utils/storage';
import { createPasswordRecord, verifyPassword, validatePassword, generateTempPassword, normalizeAnswer, LoginLockout } from '../utils/password';
import { BID_EVALUATOR_ROLES, canViewBid, canCommitBudget, approvalRequiresAuthority, canRecordPayment as canRecordPaymentRule, applyAcceptedDelivery, calculateReliabilityScore, calculateWeightedScores, resolveBudgetOverride, canVendorBid, remainingCommitmentAfterCancellation, isSoloOwnerFlow } from '../utils/procurementRules';
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
  BudgetOverrideRequest,
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
  ) => { success: boolean; error?: string; organization?: Organization; adminUser?: User };
  provisionStaffUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    departmentId?: string;
    tempPassword?: string;
    mustChangePassword?: boolean;
  }) => { success: boolean; user?: User; tempPassword: string; error?: string };
  changeTempPassword: (userId: string, currentPass: string, newPass: string) => { success: boolean; error?: string };
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
  budgetOverrideRequests: BudgetOverrideRequest[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  currentUser: User | null;
  isAuthenticated: boolean;
  theme: 'dark' | 'light' | 'system';
  setTheme: (t: 'dark' | 'light' | 'system') => void;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;
  login: (email: string, pass: string) => { success: boolean; error?: string; mustChangePassword?: boolean };
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
  cancelRequest: (requestId: string, reason: string) => void;
  cancelPurchaseOrder: (poId: string, reason: string) => void;
  submitBid: (tenderId: string, bidData: Partial<Bid>) => Bid;
  evaluateCompliance: (bidId: string, passed: boolean, reason?: string) => void;
  evaluateTechnical: (bidId: string, score: number, comments: string) => void;
  calculateVendorRecommendations: (tenderId: string) => Bid[];
  awardTender: (tenderId: string, winningBidId: string, justification?: string) => { requiresAuthority: boolean; poCreated?: PurchaseOrder; blocked?: string };
  authorityApproveAward: (tenderId: string, approved: boolean, reason?: string) => void;
  overrideBudgetAndAward: (tenderId: string, winningBidId: string, overrideReason: string) => { requiresAuthority: boolean; poCreated?: PurchaseOrder; blocked?: string };
  decideBudgetOverride: (requestId: string, approved: boolean, comment: string) => void;
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
  adminResetUserPassword: (userId: string) => string | null;
  registerStaffAccount: (data: {
    fullName: string; email: string; phone: string; departmentId?: string;
    securityQuestion?: string; securityAnswer?: string; password: string;
  }) => { success: boolean; error?: string };
  registerVendorAccount: (vendor: VendorProfile, user: User, password: string) => { success: boolean; error?: string };
  resetPasswordWithAnswer: (email: string, answer: string, newPassword: string) => { success: boolean; error?: string };
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
    const saved = appStorage.getItem(STORAGE_PREFIX + 'organizations');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [currentOrganization, setCurrentOrganization] = useState<Organization>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'current_organization');
    const orgs: Organization[] = (() => {
      const savedOrgs = appStorage.getItem(STORAGE_PREFIX + 'organizations');
      return savedOrgs ? JSON.parse(savedOrgs) : INITIAL_ORGANIZATIONS;
    })();
    const savedUserStr = appStorage.getItem(STORAGE_PREFIX + 'current_user');
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
    const saved = appStorage.getItem(STORAGE_PREFIX + 'settings');
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
    const saved = appStorage.getItem(STORAGE_PREFIX + 'departments');
    const list: Department[] = saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    return list.map((d) => (d.organizationId ? d : { ...d, organizationId: 'org-emerald' }));
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'users');
    const list: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return list.map((u) => (u.organizationId || u.role === 'Vendor' ? u : { ...u, organizationId: 'org-emerald' }));
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [vendors, setVendors] = useState<VendorProfile[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [requests, setRequests] = useState<PurchaseRequest[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'requests');
    const list: PurchaseRequest[] = saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    return list.map((r) => (r.organizationId ? r : { ...r, organizationId: 'org-emerald' }));
  });

  const [tenders, setTenders] = useState<Tender[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'tenders');
    const list: Tender[] = saved ? JSON.parse(saved) : INITIAL_TENDERS;
    return list.map((t) => (t.organizationId ? t : { ...t, organizationId: 'org-emerald' }));
  });

  const [bids, setBids] = useState<Bid[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'bids');
    return saved ? JSON.parse(saved) : INITIAL_BIDS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'pos');
    const list: PurchaseOrder[] = saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
    return list.map((po) => (po.organizationId ? po : { ...po, organizationId: 'org-emerald' }));
  });

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'deliveries');
    const list: DeliveryRecord[] = saved ? JSON.parse(saved) : INITIAL_DELIVERIES;
    return list.map((del) => (del.organizationId ? del : { ...del, organizationId: 'org-emerald' }));
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'payments');
    const list: PaymentRecord[] = saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    return list.map((pay) => (pay.organizationId ? pay : { ...pay, organizationId: 'org-emerald' }));
  });

  const [budgetChanges, setBudgetChanges] = useState<BudgetChange[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'budget_changes');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgetOverrideRequests, setBudgetOverrideRequests] = useState<BudgetOverrideRequest[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'budget_override_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'notifications');
    const list: NotificationItem[] = saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    return list.map((n) => (n.organizationId ? n : { ...n, organizationId: 'org-emerald' }));
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = appStorage.getItem(STORAGE_PREFIX + 'audit_logs');
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
    appStorage.setItem(STORAGE_PREFIX + 'organizations', JSON.stringify(organizations));
  }, [organizations]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'current_organization', JSON.stringify(currentOrganization));
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
    appStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'departments', JSON.stringify(departments));
  }, [departments]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'vendors', JSON.stringify(vendors));
  }, [vendors]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'requests', JSON.stringify(requests));
  }, [requests]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'tenders', JSON.stringify(tenders));
  }, [tenders]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'bids', JSON.stringify(bids));
  }, [bids]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'deliveries', JSON.stringify(deliveries));
  }, [deliveries]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'budget_changes', JSON.stringify(budgetChanges));
  }, [budgetChanges]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'budget_override_requests', JSON.stringify(budgetOverrideRequests));
  }, [budgetOverrideRequests]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    appStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(STORAGE_PREFIX + 'current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(STORAGE_PREFIX + 'current_user');
      appStorage.removeItem(STORAGE_PREFIX + 'current_user');
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
        id: 'aud-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
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
        organizationId: notif.organizationId || currentOrganization?.id,
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
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
  const loginLockout = useRef(new LoginLockout());

  const answerRecord = (answer: string) => {
    const r = createPasswordRecord(normalizeAnswer(answer));
    return { securityAnswerSalt: r.passwordSalt, securityAnswerHash: r.passwordHash };
  };
  const answerMatches = (u: User, answer: string) => {
    if (u.securityAnswerHash) {
      return verifyPassword(normalizeAnswer(answer), { passwordSalt: u.securityAnswerSalt, passwordHash: u.securityAnswerHash });
    }
    return !!u.securityAnswer && normalizeAnswer(answer) === normalizeAnswer(u.securityAnswer); // seeded demo accounts
  };

  const lockMessage = (key: string): string | null => loginLockout.current.message(key);
  const registerFailure = (key: string) => loginLockout.current.fail(key);

  const login = (email: string, pass: string) => {
    const key = email.trim().toLowerCase();
    const locked = lockMessage(key);
    if (locked) return { success: false, error: locked };
    const found = users.find((u) => u.email.toLowerCase() === key);
    if (found && !found.passwordHash) {
      return { success: false, error: 'This account has no password yet. Use "Forgot password" to set one.' };
    }
    if (!found || !verifyPassword(pass, found)) {
      registerFailure(key);
      return { success: false, error: 'Incorrect email or password.' };
    }
    loginLockout.current.clear(key);
    if (found) {
      if (found.status === 'Pending') {
        return { success: false, error: 'Your account is pending administrator approval.' };
      }
      if (found.status === 'Deactivated') {
        return { success: false, error: 'Your account has been deactivated. Contact Admin.' };
      }

      // If user belongs to an organization, switch active organization to theirs
      let targetOrg = currentOrganization;
      if (found.organizationId) {
        const org = organizations.find((o) => o.id === found.organizationId);
        if (org) {
          targetOrg = org;
          setCurrentOrganization(org);
          setSettings((prev) => ({
            ...prev,
            name: org.name,
            type:
              org.type === 'sole_proprietorship'
                ? 'Sole Proprietor / Small Business'
                : org.type === 'mega_corporation'
                ? 'Mega Corporation / Public Parastatal'
                : 'Enterprise / Corporate',
            approvalThreshold: org.approvalThreshold,
            currency: org.currency || '₦',
            address: org.address,
            phone: org.phone,
            email: org.email,
          }));
        }
      }

      setCurrentUser(found);
      addAuditLog(
        'User Login',
        'AUTH',
        undefined,
        `Logged in as ${found.role}`,
        `User ${found.fullName} authenticated successfully in ${targetOrg.name}.`
      );

      return {
        success: true,
        mustChangePassword: !!found.mustChangePassword,
      };
    }
    return { success: false, error: 'Incorrect email or password.' };
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
    const pwErr = validatePassword(adminData.password);
    if (pwErr) return { success: false, error: pwErr };
    if (users.some((u) => u.email.toLowerCase() === adminData.email.trim().toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }
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
      ...createPasswordRecord(adminData.password),
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
    // A signed-in staff member can never hop into another organisation (that would bypass sign-in)
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

    const tempPass = data.tempPassword || generateTempPassword();
    if (tempPass.length < 8) {
      return { success: false, tempPassword: '', error: 'Temporary password must be at least 8 characters.' };
    }

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
      ...createPasswordRecord(tempPass),
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

  const changeTempPassword = (userId: string, currentPass: string, newPass: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User account not found.' };
    if (currentUser?.id !== userId) return { success: false, error: 'You can only change your own password.' };
    if (!verifyPassword(currentPass, target)) return { success: false, error: 'Your current (temporary) password is incorrect.' };
    const err = validatePassword(newPass);
    if (err) return { success: false, error: err };
    if (newPass === currentPass) return { success: false, error: 'New password must be different from your temporary password.' };

    const rec = createPasswordRecord(newPass);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...rec, mustChangePassword: false, tempPassword: undefined } : u)));
    setCurrentUser((prev) => (prev ? { ...prev, ...rec, mustChangePassword: false, tempPassword: undefined } : null));

    addAuditLog(
      'Updated First-Login Password',
      target.fullName,
      'Temporary Password',
      'Permanent Password Set',
      'User successfully changed their temporary password on first login.'
    );
    return { success: true };
  };

  const registerStaffAccount: AppContextType['registerStaffAccount'] = (data) => {
    const pwErr = validatePassword(data.password);
    if (pwErr) return { success: false, error: pwErr };
    if (users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }
    const newUser: User = {
      id: 'user-' + Date.now(),
      organizationId: currentOrganization.id,
      fullName: data.fullName,
      email: data.email.trim(),
      phone: data.phone,
      role: 'Pending',
      departmentId: data.departmentId,
      status: 'Pending',
      securityQuestion: data.securityQuestion,
      ...(data.securityAnswer ? answerRecord(data.securityAnswer) : {}),
      ...createPasswordRecord(data.password),
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    addNotification({
      forRole: 'Organization Admin',
      title: 'New Staff Registration',
      message: `${newUser.fullName} (${newUser.email}) is waiting for a role assignment.`,
      type: 'info',
    });
    return { success: true };
  };

  const registerVendorAccount: AppContextType['registerVendorAccount'] = (vendor, user, password) => {
    const pwErr = validatePassword(password);
    if (pwErr) return { success: false, error: pwErr };
    if (users.some((u) => u.email.toLowerCase() === user.email.trim().toLowerCase())) {
      return { success: false, error: 'An account with this login email already exists.' };
    }
    const { securityAnswer, ...userRest } = user;
    const userId = user.id || 'user-' + Date.now();
    const newUser: User = {
      ...userRest,
      id: userId,
      role: 'Vendor',
      status: 'Active',
      organizationId: undefined,
      vendorId: vendor.id,
      ...(securityAnswer ? answerRecord(securityAnswer) : {}),
      ...createPasswordRecord(password),
    };
    const newVendor: VendorProfile = {
      ...vendor,
      userId,
      status: 'Registered',
      inMyVendors: false,
      organizationStatuses: {},
    };
    setVendors((prev) => [newVendor, ...prev]);
    setUsers((prev) => [newUser, ...prev]);
    addAuditLog('Vendor Registered', newVendor.businessName, undefined, 'Registered', 'Vendor account created; Procurement approval is required before bidding.');
    addNotification({
      forRole: 'Procurement Officer',
      title: 'New Vendor Registration',
      message: `${newVendor.businessName} registered and is waiting for Procurement approval.`,
      type: 'info',
    });
    setCurrentUser(newUser);
    return { success: true };
  };

  const resetPasswordWithAnswer: AppContextType['resetPasswordWithAnswer'] = (email, answer, newPassword) => {
    const key = 'reset:' + email.trim().toLowerCase();
    const locked = lockMessage(key);
    if (locked) return { success: false, error: locked };
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !user.securityQuestion || !answerMatches(user, answer)) {
      registerFailure(key);
      return { success: false, error: 'Incorrect answer to the security question.' };
    }
    const err = validatePassword(newPassword);
    if (err) return { success: false, error: err };
    const rec = createPasswordRecord(newPassword);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...rec, mustChangePassword: false } : u)));
    loginLockout.current.clear(key);
    addAuditLog('Offline Password Reset', user.email, undefined, 'Password Updated', 'Reset via security question.');
    return { success: true };
  };

  const logout = () => {
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
    setBudgetOverrideRequests([]);
    setCurrentUser(INITIAL_USERS[0]);
    appStorage.clear();
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
    const tnd = tenders.find((t) => t.id === tenderId);
    if (!tnd || !currentUser) return;
    if (!['Procurement Officer', 'Organization Admin'].includes(currentUser.role)) return;
    if (tnd.status !== 'Open') return;
    if (new Date(newDate).getTime() <= new Date(tnd.bidClosingDateTime).getTime()) return; // must move the deadline later
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id === tenderId) {
          addAuditLog('Extended Tender Deadline', t.referenceNumber, t.bidClosingDateTime, newDate, `Reason: ${reason}`);
          return {
            ...t,
            bidClosingDateTime: newDate,
            extendedDeadlineReason: reason,
          };
        }
        return t;
      })
    );
  };

  const cancelTender = (tenderId: string, reason: string) => {
    const target = tenders.find((t) => t.id === tenderId);
    if (!target || (target.organizationId && target.organizationId !== currentOrganization.id) || !reason.trim() || !['Procurement Officer', 'Organization Admin'].includes(currentUser?.role || '') || target.status === 'Cancelled') return;
    const linkedPO = purchaseOrders.find((po) => po.tenderId === tenderId);
    if (linkedPO && !cancelPurchaseOrder(linkedPO.id, reason)) return;
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
    const request = requests.find((r) => r.id === target.requestId);
    addNotification({ forRole: 'Procurement Officer', title: 'Tender Cancelled', message: `${target.referenceNumber} was cancelled. Reason: ${reason.trim()}`, type: 'danger', recordType: 'tender', recordId: tenderId });
    if (request) addNotification({ userId: request.requesterId, title: 'Tender Cancelled', message: `Tender ${target.referenceNumber} for your request ${request.referenceNumber} was cancelled: ${reason.trim()}`, type: 'warning', recordType: 'tender', recordId: tenderId });
  };

  const cancelRequest = (requestId: string, reason: string) => {
    const request = requests.find((entry) => entry.id === requestId);
    if (!request || (request.organizationId && request.organizationId !== currentOrganization.id) || !reason.trim() || request.status === 'Cancelled' || request.status === 'Converted to Tender') return;
    const isOwner = currentUser?.id === request.requesterId;
    const isAdmin = ['Organization Admin', 'Department Head'].includes(currentUser?.role || '');
    if (!isOwner && !isAdmin) return;
    setRequests((prev) => prev.map((entry) => entry.id === requestId ? { ...entry, status: 'Cancelled', updatedAt: new Date().toISOString(), reviewComment: reason.trim() } : entry));
    addAuditLog('Cancelled Purchase Request', request.referenceNumber, request.status, 'Cancelled', reason.trim());
    addNotification({ forRole: 'Department Head', title: 'Purchase Request Cancelled', message: `${request.referenceNumber} was cancelled by ${currentUser?.fullName || 'a user'}: ${reason.trim()}`, type: 'warning', recordType: 'request', recordId: requestId });
    addNotification({ forRole: 'Procurement Officer', title: 'Purchase Request Cancelled', message: `${request.referenceNumber} is no longer available for sourcing.`, type: 'info', recordType: 'request', recordId: requestId });
  };

  const cancelPurchaseOrder = (poId: string, reason: string): boolean => {
    const po = purchaseOrders.find((entry) => entry.id === poId);
    if (!po || (po.organizationId && po.organizationId !== currentOrganization.id) || !reason.trim() || !['Procurement Officer', 'Organization Admin'].includes(currentUser?.role || '') || !['Issued', 'Acknowledged'].includes(po.status)) return false;
    const release = remainingCommitmentAfterCancellation(po.totalAmount, po.paidAmount);
    setPurchaseOrders((prev) => prev.map((entry) => entry.id === poId ? { ...entry, status: 'Cancelled' } : entry));
    setDepartments((prev) => prev.map((entry) => entry.id === po.departmentId ? { ...entry, committed: Math.max(0, entry.committed - release) } : entry));
    setVendors((prev) => prev.map((vendor) => vendor.id === po.vendorId ? { ...vendor, totalOrders: Math.max(0, vendor.totalOrders - 1), totalValueAwarded: Math.max(0, vendor.totalValueAwarded - po.totalAmount) } : vendor));
    setTenders((prev) => prev.map((entry) => entry.id === po.tenderId ? { ...entry, status: 'Cancelled', awaitingAuthorityApproval: false, pendingAuthorityBidId: undefined, cancellationReason: reason.trim() } : entry));
    addAuditLog('Cancelled Purchase Order', po.referenceNumber, po.status, 'Cancelled', `Released remaining commitment ₦${release.toLocaleString()}. Reason: ${reason.trim()}`);
    addNotification({ userId: vendors.find((vendor) => vendor.id === po.vendorId)?.userId, forRole: 'Vendor', title: 'Purchase Order Cancelled', message: `${po.referenceNumber} was cancelled: ${reason.trim()}`, type: 'danger', recordType: 'po', recordId: poId });
    addNotification({ forRole: 'Finance Officer', title: 'Purchase Order Cancelled', message: `${po.referenceNumber} was cancelled. ₦${release.toLocaleString()} of unpaid commitment was released.`, type: 'warning', recordType: 'po', recordId: poId });
    return true;
  };

  // Vendor Bidding - Enforce single bid submission per vendor (Section 6.4)
  const submitBid = (tenderId: string, bidData: Partial<Bid>): Bid => {
    const tnd = tenders.find((t) => t.id === tenderId);
    const vendor = vendors.find((v) => v.id === (bidData.vendorId || currentUser?.vendorId));
    if (!tnd) throw new Error('This tender no longer exists.');
    if (currentUser?.role !== 'Vendor' || !currentUser.vendorId || currentUser.vendorId !== (bidData.vendorId || currentUser.vendorId)) throw new Error('Only the signed-in vendor may submit a bid for their own account.');
    if (!vendor || vendor.id !== currentUser.vendorId) throw new Error('Your vendor profile could not be found. Please sign in again.');
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

    // Vendors must be explicitly approved by this organization before bidding.
    const effectiveStatus = getVendorEffectiveStatus(vendor, tnd.organizationId || currentOrganization.id);
    if (!canVendorBid(effectiveStatus.status)) {
      throw new Error(effectiveStatus.status === 'Suspended' || effectiveStatus.status === 'Blacklisted'
        ? `Vendor ${vendor.businessName} is currently ${effectiveStatus.status.toLowerCase()} by this organization.`
        : 'Your vendor account must be approved by Procurement before you can bid.');
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
    const target = bids.find((b) => b.id === bidId);
    const tender = target && tenders.find((t) => t.id === target.tenderId);
    if (!target || !tender || (tender.organizationId && tender.organizationId !== currentOrganization.id) || Date.now() < new Date(tender.bidClosingDateTime).getTime()) return;
    if (!['Procurement Officer', 'Organization Admin'].includes(currentUser?.role || '')) return;
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
    const target = bids.find((b) => b.id === bidId);
    const tender = target && tenders.find((t) => t.id === target.tenderId);
    if (!target || !tender || (tender.organizationId && tender.organizationId !== currentOrganization.id) || Date.now() < new Date(tender.bidClosingDateTime).getTime()) return;
    if (!['Procurement Officer', 'Organization Admin'].includes(currentUser?.role || '')) return;
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
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
    if (!tnd || (tnd.organizationId && tnd.organizationId !== currentOrganization.id) || !currentUser || !BID_EVALUATOR_ROLES.includes(currentUser.role as UserRole)) return [];
    if (Date.now() < new Date(tnd.bidClosingDateTime).getTime()) return [];
    const tenderBids = bids.filter((b) => b.tenderId === tenderId && b.compliancePassed !== false);
    if (!tenderBids.length) return [];
    const scoredBids = calculateWeightedScores(
      tenderBids,
      tnd.evaluationWeights,
      (bid) => vendors.find((v) => v.id === bid.vendorId)?.reliabilityScore ?? 60,
    );
    setBids((prev) => prev.map((bid) => {
      const scored = scoredBids.find((entry) => entry.id === bid.id);
      return scored ? { ...bid, computedScores: scored.computedScores } : bid;
    }));
    return scoredBids;
  };

  const awardTender = (
    tenderId: string,
    winningBidId: string,
    justification?: string,
    budgetOverrideReason?: string
  ): { requiresAuthority: boolean; poCreated?: PurchaseOrder; blocked?: string } => {
    const tnd = tenders.find((t) => t.id === tenderId);
    const winBid = bids.find((b) => b.id === winningBidId);
    if (!tnd || !winBid || (tnd.organizationId && tnd.organizationId !== currentOrganization.id)) return { requiresAuthority: false, blocked: 'Tender or bid not found in the active organization.' };
    if (tnd.status === 'Awarded' || tnd.awaitingAuthorityApproval) {
      return { requiresAuthority: false, blocked: 'This tender has already been awarded or is awaiting authority approval.' };
    }
    if (winBid.tenderId !== tenderId) return { requiresAuthority: false, blocked: 'That bid does not belong to this tender.' };
    if (Date.now() < new Date(tnd.bidClosingDateTime).getTime()) return { requiresAuthority: false, blocked: 'Bids remain confidential until the closing time. Awarding is not available yet.' };
    if (!['Procurement Officer', 'Organization Admin'].includes(currentUser?.role || '')) return { requiresAuthority: false, blocked: 'You are not permitted to award this tender.' };
    if (winBid.compliancePassed === false) return { requiresAuthority: false, blocked: 'This bid failed the compliance check and cannot be awarded.' };

    const vendor = vendors.find((v) => v.id === winBid.vendorId);
    const dept = departments.find((d) => d.id === tnd.departmentId);

    // An officer-entered reason is not an approval. Only a separate Finance decision authorizes an over-budget award.
    const remaining = dept ? dept.annualBudget - dept.spent - dept.committed : Number.POSITIVE_INFINITY;
    const approvedOverride = budgetOverrideRequests.find((request) =>
      request.tenderId === tenderId && request.bidId === winningBidId && request.status === 'Approved'
    );
    if (dept && !canCommitBudget(dept.annualBudget, dept.spent, dept.committed, winBid.totalAmount, !!approvedOverride)) {
      return { requiresAuthority: false, blocked: `Award exceeds the ${dept.name} remaining budget. Submit a Finance override request and wait for approval.` };
    }
    if (dept && winBid.totalAmount > remaining && !approvedOverride) {
      return { requiresAuthority: false, blocked: 'A Finance-approved budget override is required before this award can continue.' };
    }

    const threshold = currentOrganization.approvalThreshold || settings.approvalThreshold;
    const requiresAuthority = approvalRequiresAuthority(winBid.totalAmount, threshold);
    const approvedOverrideReason = approvedOverride?.reason;

    if (requiresAuthority) {
      // High-value: NO purchase order until the Approving Authority signs off
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
        message: `Tender ${tnd.referenceNumber} recommended for ${winBid.vendorName} at \u20a6${winBid.totalAmount.toLocaleString()} exceeds the \u20a6${threshold.toLocaleString()} threshold.`,
        type: 'warning',
        recordType: 'tender',
        recordId: tenderId,
      });
      addAuditLog(
        'High-Value Award Sent for Authority Approval',
        tnd.referenceNumber,
        'Under Evaluation',
        'Awaiting Approving Authority',
        `${winBid.vendorName} at \u20a6${winBid.totalAmount.toLocaleString()}. ${justification || ''}${approvedOverrideReason ? ' Finance-approved budget override: ' + approvedOverrideReason : ''}`
      );
      return { requiresAuthority: true };
    }

    return finalizeAward(tenderId, winBid, vendor, dept, `${justification || ''}${approvedOverrideReason ? ' Finance-approved budget override: ' + approvedOverrideReason : ''}`);
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
    setVendors((prev) => prev.map((entry) => entry.id === winBid.vendorId ? {
      ...entry,
      totalOrders: entry.totalOrders + 1,
      totalValueAwarded: entry.totalValueAwarded + winBid.totalAmount,
    } : entry));

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
    if (!tnd || !winBid || (tnd.organizationId && tnd.organizationId !== currentOrganization.id)) return;
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
    const tender = tenders.find((t) => t.id === tenderId);
    const bid = bids.find((b) => b.id === winningBidId && b.tenderId === tenderId);
    const dept = tender && departments.find((d) => d.id === tender.departmentId);
    if (!tender || !bid || !dept) return { requiresAuthority: false, blocked: 'Tender, bid, or department not found.' };
    const isSoloOwner = isSoloOwnerFlow(currentOrganization.type, currentUser?.organizationId, currentOrganization.id);
    if (currentUser?.role !== 'Procurement Officer' && !isSoloOwner) {
      return { requiresAuthority: false, blocked: 'Only the Procurement Officer can submit a budget override request.' };
    }
    if (!overrideReason.trim()) return { requiresAuthority: false, blocked: 'A reason is required for the Finance override request.' };
    const remaining = dept.annualBudget - dept.spent - dept.committed;
    if (bid.totalAmount <= remaining) return awardTender(tenderId, winningBidId, 'Within remaining budget.');
    const existing = budgetOverrideRequests.find((request) => request.tenderId === tenderId && request.bidId === winningBidId && request.status === 'Pending');
    if (existing) return { requiresAuthority: false, blocked: 'A budget override request is already waiting for Finance.' };
    const request: BudgetOverrideRequest = {
      id: 'bor-' + Date.now(),
      organizationId: tender.organizationId || currentOrganization.id,
      tenderId,
      tenderReference: tender.referenceNumber,
      bidId: winningBidId,
      vendorName: bid.vendorName,
      departmentId: dept.id,
      departmentName: dept.name,
      awardAmount: bid.totalAmount,
      remainingBudget: remaining,
      reason: overrideReason.trim(),
      requestedByUserId: currentUser.id,
      requestedByName: currentUser.fullName,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setBudgetOverrideRequests((prev) => [request, ...prev]);
    addAuditLog('Budget Override Requested', tender.referenceNumber, `Remaining budget: ₦${remaining.toLocaleString()}`, `Requested award: ₦${bid.totalAmount.toLocaleString()}`, request.reason);
    addNotification({
      forRole: 'Finance Officer',
      title: 'Budget Override Request',
      message: `${currentUser.fullName} requests a budget override for ${tender.referenceNumber}. Finance approval is required before award.`,
      type: 'warning',
      recordType: 'tender',
      recordId: tenderId,
    });
    addNotification({
      forRole: 'Procurement Officer',
      userId: currentUser.id,
      title: 'Budget Override Sent to Finance',
      message: `The override request for ${tender.referenceNumber} is pending Finance review. No award or PO has been created.`,
      type: 'info',
      recordType: 'tender',
      recordId: tenderId,
    });
    return { requiresAuthority: false, blocked: 'Budget override request submitted to Finance. The award remains blocked until Finance approves it.' };
  };

  const decideBudgetOverride = (requestId: string, approved: boolean, comment: string) => {
    const request = budgetOverrideRequests.find((entry) => entry.id === requestId);
    const isSoloOwner = isSoloOwnerFlow(currentOrganization.type, currentUser?.organizationId, currentOrganization.id);
    if (!request || request.organizationId !== currentOrganization.id || (currentUser?.role !== 'Finance Officer' && !isSoloOwner) || !comment.trim()) return;
    const status = resolveBudgetOverride(request.status, approved);
    if (!status) return;
    setBudgetOverrideRequests((prev) => prev.map((entry) => entry.id === requestId ? {
      ...entry, status, financeComment: comment.trim(), decidedByUserId: currentUser.id,
      decidedByName: currentUser.fullName, decidedAt: new Date().toISOString(),
    } : entry));
    addAuditLog(approved ? 'Budget Override Approved by Finance' : 'Budget Override Rejected by Finance',
      request.tenderReference, 'Pending Finance Decision', status, comment.trim());
    addNotification({
      forRole: 'Procurement Officer',
      userId: request.requestedByUserId,
      title: approved ? 'Budget Override Approved' : 'Budget Override Rejected',
      message: approved
        ? `Finance approved the override for ${request.tenderReference}. Return to evaluation to continue the award; Authority sign-off still applies where required.`
        : `Finance rejected the override for ${request.tenderReference}: ${comment.trim()}. The award remains blocked.`,
      type: approved ? 'success' : 'danger',
      recordType: 'tender',
      recordId: request.tenderId,
    });
  };

  // PO & Delivery Actions
  const acknowledgePO = (poId: string) => {
    const target = purchaseOrders.find((po) => po.id === poId);
    if (!target || currentUser?.role !== 'Vendor' || currentUser.vendorId !== target.vendorId || target.status !== 'Issued') return;
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
    const target = purchaseOrders.find((po) => po.id === poId);
    if (!target || currentUser?.role !== 'Vendor' || currentUser.vendorId !== target.vendorId || !['Acknowledged', 'Partially Delivered'].includes(target.status) || !notes.trim()) return;
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
    const isSoloOwner = isSoloOwnerFlow(currentOrganization.type, currentUser?.organizationId, currentOrganization.id);
    if (!po || !['Request Officer', 'Organization Admin'].includes(currentUser?.role || '') && !isSoloOwner) return;
    if ((po.organizationId && po.organizationId !== currentOrganization.id) || ['Cancelled', 'Closed', 'Delivered'].includes(po.status)) return;
    if (!Array.isArray(itemsReceived) || itemsReceived.length !== po.items.length) return;
    if (itemsReceived.some((item) => !item || !Number.isFinite(item.received) || item.received < 0 || !['Accepted', 'Partially Accepted', 'Rejected'].includes(item.status))) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const expected = new Date(po.expectedDeliveryDate);
    const actual = new Date(todayStr);

    const diffDays = Math.round((actual.getTime() - expected.getTime()) / (1000 * 3600 * 24));
    const isOnTime = diffDays <= 0;
    const lateDays = isOnTime ? 0 : diffDays;

    // Cumulative accepted quantity per PO line (previous deliveries + this one; rejected goods never count)
    const receipt = applyAcceptedDelivery(po.items, itemsReceived);
    const acceptedNow = receipt.acceptedQuantities;
    const newReceived = receipt.receivedQuantities;
    const isFull = receipt.isFullyDelivered;
    if (acceptedNow.every((n) => n === 0) && !itemsReceived.some((item) => item.status === 'Rejected')) return; // record rejected deliveries for audit and reliability.

    const newDelivery: DeliveryRecord = {
      id: 'del-' + Date.now(),
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
    };

    setDeliveries((prev) => [newDelivery, ...prev]);

    // Update PO status
    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          return {
            ...p,
            status: isFull ? 'Delivered' : acceptedNow.some((quantity) => quantity > 0) ? 'Partially Delivered' : p.status,
            actualDeliveryDate: acceptedNow.some((quantity) => quantity > 0) ? todayStr : p.actualDeliveryDate,
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
          const isFirstCompleteReceipt = isFull && !deliveries.some((delivery) => delivery.purchaseOrderId === poId && delivery.isFullyDelivered);
          const onTime = v.onTimeDeliveries + (isFirstCompleteReceipt && isOnTime ? 1 : 0);
          const late = v.lateDeliveries + (isFirstCompleteReceipt && !isOnTime ? 1 : 0);
          const rejected = v.rejections + itemsReceived.filter((item) => item.status === 'Rejected').length;
          return {
            ...v,
            onTimeDeliveries: onTime,
            lateDeliveries: late,
            rejections: rejected,
            totalOrders: v.totalOrders,
            reliabilityScore: calculateReliabilityScore(onTime, late, rejected),
          };
        }
        return v;
      })
    );

    addAuditLog(
      'Store Received Consignment',
      po.referenceNumber,
      po.status,
      isFull ? 'Delivered' : 'Partially Delivered',
      `On-Time: ${isOnTime ? 'Yes' : `Late by ${lateDays} days`}`
    );

    addNotification({
      forRole: 'Finance Officer',
      title: 'Delivery Received - Payment Due',
      message: `Items for ${po.referenceNumber} have been received and verified. Payment is now due.`,
      type: 'info',
      recordType: 'po',
      recordId: po.id,
    });
  };

  // Payments
  const recordPayment = (
    paymentData: Omit<PaymentRecord, 'id' | 'voucherNumber' | 'recordedByUserId' | 'recordedByName'>
  ): PaymentRecord | null => {
    const isSoloOwner = isSoloOwnerFlow(currentOrganization.type, currentUser?.organizationId, currentOrganization.id);
    if (currentUser?.role !== 'Finance Officer' && !isSoloOwner) return null;
    const voucherNumber = nextRef('PV', payments.map((p) => p.voucherNumber));
    const po = purchaseOrders.find((p) => p.id === paymentData.purchaseOrderId);
    if (!po || (po.organizationId && po.organizationId !== currentOrganization.id)) return null;
    if (!canRecordPaymentRule(po, paymentData.amount)) return null;

    const newPayment: PaymentRecord = {
      ...paymentData,
      organizationId: po.organizationId || currentOrganization.id,
      purchaseOrderId: po.id,
      poReference: po.referenceNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      departmentId: po.departmentId,
      departmentName: po.departmentName,
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
    if (!['Procurement Officer', 'Organization Admin'].includes(currentUser?.role || '') || !reason?.trim() || targetOrgId && targetOrgId !== currentOrganization.id) return;
    const orgId = targetOrgId || currentOrganization.id;
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const orgStatuses = { ...(v.organizationStatuses || {}) };
          const previousStatus = orgStatuses[orgId]?.status || v.status;
          orgStatuses[orgId] = {
            status,
            reason,
            updatedAt: new Date().toISOString(),
          };
          addAuditLog(
            status === 'Approved' ? 'Vendor Approved by Procurement' : status === 'Suspended' ? 'Vendor Suspended' : status === 'Blacklisted' ? 'Vendor Blacklisted' : 'Vendor Status Changed',
            `${v.businessName} (${currentOrganization.name})`,
            previousStatus,
            status,
            reason
          );
          addNotification({
            userId: v.userId,
            forRole: 'Vendor',
            title: status === 'Approved' ? 'Vendor Account Approved' : status === 'Suspended' ? 'Vendor Account Suspended' : status === 'Blacklisted' ? 'Vendor Account Blacklisted' : 'Vendor Status Updated',
            message: status === 'Approved'
              ? `${currentOrganization.name} approved your vendor account. You may now bid on eligible tenders.`
              : `${currentOrganization.name} changed your vendor status to ${status}. Reason: ${reason}`,
            type: status === 'Approved' ? 'success' : status === 'Suspended' || status === 'Blacklisted' ? 'danger' : 'info',
          });
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
    return { status: vendor.status };
  };

  // Budget Adjustments
  const adjustBudget = (deptId: string, newBudget: number, reason: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept || (dept.organizationId && dept.organizationId !== currentOrganization.id) || !Number.isFinite(newBudget) || newBudget <= 0 || !reason.trim()) return;
    if (!['Finance Officer', 'Organization Admin'].includes(currentUser?.role || '')) return;
    if (newBudget < dept.spent + dept.committed) return;

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

  const adminResetUserPassword = (userId: string): string | null => {
    if (currentUser?.role !== 'Organization Admin') return null;
    const user = users.find((u) => u.id === userId);
    if (!user) return null;
    if (user.organizationId && user.organizationId !== currentOrganization.id) return null;
    const temp = generateTempPassword();
    const rec = createPasswordRecord(temp);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...rec, mustChangePassword: true } : u)));
    addAuditLog('Admin Password Reset', user.fullName, undefined, 'Temporary Password Set', 'Forced change required at next sign in.');
    return temp;
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
      bids: visibleBids,
      bidsRedacted: visibleBids.length !== bids.length,
      purchaseOrders,
      deliveries,
      payments,
      budgetChanges,
      notifications,
      auditLogs,
      budgetOverrideRequests,
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.bidsRedacted) return false; // Refuse incomplete backups without changing any existing data.
      if (data.settings) setSettings(data.settings);
      if (data.departments) setDepartments(data.departments);
      if (data.users) setUsers(data.users);
      if (data.categories) setCategories(data.categories);
      if (data.vendors) setVendors(data.vendors);
      if (data.requests) setRequests(data.requests);
      if (data.tenders) setTenders(data.tenders);
      if (data.bids && Array.isArray(data.bids)) setBids(data.bids);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.deliveries) setDeliveries(data.deliveries);
      if (data.payments) setPayments(data.payments);
      if (data.notifications) setNotifications(data.notifications);
      if (data.budgetOverrideRequests && Array.isArray(data.budgetOverrideRequests)) setBudgetOverrideRequests(data.budgetOverrideRequests.map((request: BudgetOverrideRequest) => ({ ...request, status: 'Pending', financeComment: undefined, decidedByUserId: undefined, decidedByName: undefined, decidedAt: undefined })));
      // Audit history is intentionally excluded from imports; only audited application actions may append entries.
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

  const visibleBids = bids.filter((bid) => {
    const tender = tenders.find((entry) => entry.id === bid.tenderId);
    if (!tender) return false;
    if (currentUser?.role === 'Vendor') return canViewBid(bid, tender, currentUser.role, currentUser.vendorId);
    if (tender.organizationId && tender.organizationId !== currentOrganization.id) return false;
    return canViewBid(bid, tender, currentUser?.role, currentUser?.vendorId);
  });

  return (
    <AppContext.Provider
      value={{
        organizations,
        currentOrganization,
        switchOrganization,
        registerOrganization,
        provisionStaffUser,
        changeTempPassword,
        settings,
        updateSettings,
        departments,
        users,
        categories,
        vendors,
        requests,
        tenders,
        bids: visibleBids,
        purchaseOrders,
        deliveries,
        payments,
        budgetChanges,
        budgetOverrideRequests,
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
        cancelRequest,
        cancelPurchaseOrder,
        submitBid,
        evaluateCompliance,
        evaluateTechnical,
        calculateVendorRecommendations,
        awardTender,
        authorityApproveAward,
        overrideBudgetAndAward,
        decideBudgetOverride,
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
        registerStaffAccount,
        registerVendorAccount,
        resetPasswordWithAnswer,
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
