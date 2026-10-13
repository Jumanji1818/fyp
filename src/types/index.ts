export type UserRole =
  | 'Organization Admin'
  | 'Request Officer'
  | 'Department Head'
  | 'Procurement Officer'
  | 'Finance Officer'
  | 'Approving Authority'
  | 'Vendor';

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Returned for Correction'
  | 'Approved by Department'
  | 'Rejected'
  | 'Converted to Tender'
  | 'Cancelled';

export type TenderStatus =
  | 'Draft'
  | 'Open'
  | 'Closed'
  | 'Under Evaluation'
  | 'Awarded'
  | 'Cancelled'
  | 'Re-advertised';

export type BidStatus =
  | 'Submitted'
  | 'Under Evaluation'
  | 'Awarded'
  | 'Not Selected'
  | 'Withdrawn';

export type POStatus =
  | 'Issued'
  | 'Acknowledged'
  | 'Partially Delivered'
  | 'Delivered'
  | 'Closed'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Part Paid' | 'Paid';

export type DeliveryStatus = 'Pending' | 'Dispatched' | 'Delivered' | 'Partially Delivered' | 'Overdue';

export type OrganizationType = 'sole_proprietorship' | 'enterprise' | 'mega_corporation';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  industry: string;
  address: string;
  phone: string;
  email: string;
  approvalThreshold: number;
  currency: string;
  createdAt: string;
}

export interface Department {
  id: string;
  organizationId?: string;
  name: string;
  annualBudget: number;
  spent: number;
  committed: number;
}

export interface User {
  id: string;
  organizationId?: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole | 'Pending';
  departmentId?: string;
  vendorId?: string;
  status: 'Active' | 'Pending' | 'Deactivated';
  avatar?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  mustChangePassword?: boolean;
  tempPassword?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
  active: boolean;
}

export interface VendorDocument {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  verified: boolean;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  cacNumber: string;
  taxId: string;
  yearEstablished: number;
  address: string;
  state: string;
  phone: string;
  email: string;
  contactPerson: string;
  categories: string[]; // Parent category names or IDs
  subcategories: string[];
  documents: VendorDocument[];
  inMyVendors: boolean;
  status: 'Registered' | 'Approved' | 'Suspended' | 'Blacklisted';
  suspensionReason?: string;
  organizationStatuses?: Record<string, { status: 'Registered' | 'Approved' | 'Suspended' | 'Blacklisted'; reason?: string; updatedAt?: string }>;
  reliabilityScore: number; // 0-100
  onTimeDeliveries: number;
  lateDeliveries: number;
  rejections: number;
  totalOrders: number;
  totalValueAwarded: number;
}

export interface RequestItem {
  id: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalPrice: number;
}

export interface PurchaseRequest {
  id: string;
  organizationId?: string;
  referenceNumber: string; // REQ-2026-XXXX
  title: string;
  departmentId: string;
  departmentName: string;
  requesterId: string;
  requesterName: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  neededByDate: string;
  justification: string;
  items: RequestItem[];
  estimatedTotal: number;
  status: RequestStatus;
  reviewComment?: string;
  reviewerId?: string;
  reviewerName?: string;
  tenderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationWeights {
  price: number; // default 40
  deliveryTime: number; // default 20
  vendorReliability: number; // default 25
  technicalScore: number; // default 15
}

export interface TenderItem {
  id: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: number;
  unit: string;
  specifications: string;
}

export interface Tender {
  id: string;
  organizationId?: string;
  organizationName?: string;
  referenceNumber: string; // TND-2026-XXXX
  requestId: string;
  requestReference: string;
  title: string;
  description: string;
  departmentId: string;
  departmentName: string;
  categories: string[];
  items: TenderItem[];
  deliveryLocation: string;
  requiredDeliveryPeriodDays: number;
  bidOpeningDate: string;
  bidClosingDateTime: string; // ISO format
  evaluationWeights: EvaluationWeights;
  mandatoryDocuments: string[]; // e.g. ["CAC Certificate", "Tax Clearance Certificate", "Pension Compliance"]
  restrictToMyVendors: boolean;
  status: TenderStatus;
  matchingVendorsNotifiedCount: number;
  createdAt: string;
  extendedDeadlineReason?: string;
  cancellationReason?: string;
  pendingAuthorityBidId?: string;
  awaitingAuthorityApproval?: boolean;
  awardedBidId?: string;
  createdByName?: string; // officer who published the tender (shown on award letters / POs)
}

export interface BidItem {
  itemId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Bid {
  id: string;
  referenceNumber: string; // BID-2026-XXXX
  tenderId: string;
  tenderReference: string;
  vendorId: string;
  vendorName: string;
  items: BidItem[];
  totalAmount: number;
  proposedDeliveryDate: string;
  warrantyPeriod: string;
  technicalProposal: string;
  uploadedDocuments: { [docName: string]: string }; // docName -> fileName
  legalWarningAcknowledged: boolean;
  legalWarningTimestamp: string;
  status: BidStatus;
  submittedAt: string;
  // Evaluation results
  compliancePassed?: boolean;
  complianceReason?: string;
  technicalScore?: number; // 0-100
  technicalComments?: string;
  computedScores?: {
    priceScore: number;
    deliveryScore: number;
    reliabilityScore: number;
    technicalScore: number;
    totalWeightedScore: number;
    rank: number;
  };
}

export interface AwardDecision {
  id: string;
  tenderId: string;
  winningBidId: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  justification?: string; // if not recommended vendor
  awardedByUserId: string;
  awardedByName: string;
  awardedAt: string;
  requiresAuthorityApproval: boolean;
  authorityApproved?: boolean;
  authorityDecidedBy?: string;
  authorityDecidedAt?: string;
  authorityComments?: string;
  budgetOverrideApproved?: boolean;
  budgetOverrideBy?: string;
  budgetOverrideReason?: string;
  purchaseOrderId?: string;
}

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  organizationId?: string;
  referenceNumber: string; // PO-2026-XXXX
  tenderId: string;
  tenderReference: string;
  awardId: string;
  vendorId: string;
  vendorName: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorEmail: string;
  departmentId: string;
  departmentName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDeliveryDate: string;
  deliveryLocation: string;
  terms: string;
  status: POStatus;
  issuedAt: string;
  acknowledgedAt?: string;
  dispatchedAt?: string;
  dispatchNotes?: string;
  actualDeliveryDate?: string;
  deliveredOnTime?: boolean;
  lateDays?: number;
  paidAmount: number;
}

export interface DeliveryRecord {
  id: string;
  organizationId?: string;
  purchaseOrderId: string;
  poReference: string;
  vendorId: string;
  vendorName: string;
  dispatchDate: string;
  dispatchNotes: string;
  receivedDate: string;
  receivedByUserId: string;
  receivedByName: string;
  itemsReceived: {
    description: string;
    ordered: number;
    received: number;
    status: 'Accepted' | 'Partially Accepted' | 'Rejected';
    reason?: string;
  }[];
  isFullyDelivered: boolean;
  onTime: boolean;
  lateDays: number;
}

export interface PaymentRecord {
  id: string;
  organizationId?: string;
  voucherNumber: string; // PV-2026-XXXX
  purchaseOrderId: string;
  poReference: string;
  vendorId: string;
  vendorName: string;
  departmentId: string;
  departmentName: string;
  amount: number;
  paymentDate: string;
  method: 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber: string;
  notes: string;
  recordedByUserId: string;
  recordedByName: string;
}

export interface BudgetChange {
  id: string;
  organizationId?: string;
  departmentId: string;
  departmentName: string;
  previousBudget: number;
  newBudget: number;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export interface NotificationItem {
  id: string;
  organizationId?: string;
  userId?: string; // empty means broadcast or matched
  forRole?: UserRole;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  recordType?: 'request' | 'tender' | 'bid' | 'po' | 'payment';
  recordId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  organizationId?: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  recordReference: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface OrganizationSettings {
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  currency: string;
  approvalThreshold: number; // e.g. 5,000,000
  minimumTenderDays: number; // e.g. 7
  maxFailedLoginAttempts: number; // e.g. 5
  deliveryPenaltyText: string;
  defaultEvaluationWeights: EvaluationWeights;
  requiredComplianceDocs: string[];
  theme: 'dark' | 'light' | 'system';
  sidebarDefault: 'expanded' | 'collapsed';
  animationLevel: 'Full' | 'Reduced' | 'Off';
  fontSize: 'Normal' | 'Large';
  tableDensity: 'Comfortable' | 'Compact';
  inactivityTimeoutMinutes: number; // 10, 30, 60
  soundEnabled: boolean;
  notificationPreferences: {
    deadlines: boolean;
    approvals: boolean;
    awards: boolean;
    payments: boolean;
  };
  dailyBackupEnabled: boolean;
}
