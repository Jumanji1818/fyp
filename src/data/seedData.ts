/**
 * Procura Defense Seed (compact + fully linked)
 * Password for ALL accounts: Procura@2026
 *
 * NAV MAP
 * FULL:     req-1 → tnd-1 → bid-1 → po-1 → del-1 → pay-1
 * EVAL:     req-4 → tnd-4 (Closed) → bid-4 + bid-5
 * OPEN:     req-3 → tnd-3 (Open until 28 Nov)
 * OVERDUE:  req-2 → tnd-2 → bid-3 → po-2
 */

import {
  Organization, Department, User, Category, VendorProfile,
  PurchaseRequest, Tender, Bid, PurchaseOrder, PaymentRecord,
  NotificationItem, AuditLogEntry, OrganizationSettings, DeliveryRecord,
} from '../types';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  { id: 'org-emerald', name: 'Emerald Court Estates', type: 'enterprise', industry: 'Real Estate & Infrastructure', address: 'Plot 412, Constitution Avenue, CBD, Abuja', phone: '+234 9 291 8400', email: 'procurement@emeraldcourtestates.ng', approvalThreshold: 5000000, currency: '₦', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-husab', name: 'Husab Design', type: 'sole_proprietorship', industry: 'Fashion & Tailoring', address: 'Suite 12, Garki Fashion Hub, Abuja', phone: '+234 802 443 3221', email: 'procurement@husabdesign.ng', approvalThreshold: 500000, currency: '₦', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'org-nnpc', name: 'NNPC Limited', type: 'mega_corporation', industry: 'Oil & Gas', address: 'NNPC Towers, Herbert Macaulay Way, Abuja', phone: '+234 9 460 0000', email: 'tenders@nnpcgroup.com', approvalThreshold: 50000000, currency: '₦', createdAt: '2026-01-01T00:00:00Z' },
];

export const INITIAL_SETTINGS: OrganizationSettings = {
  name: 'Emerald Court Estates', type: 'Company', address: 'Plot 412, Constitution Avenue, CBD, Abuja',
  phone: '+234 9 291 8400', email: 'procurement@emeraldcourtestates.ng', currency: '₦',
  approvalThreshold: 5000000, minimumTenderDays: 7, maxFailedLoginAttempts: 5,
  deliveryPenaltyText: 'If you win this tender and fail to supply by the delivery date, the company may take legal action and apply penalty surcharges.',
  defaultEvaluationWeights: { price: 40, deliveryTime: 20, vendorReliability: 25, technicalScore: 15 },
  requiredComplianceDocs: ['CAC Certificate', 'Tax Clearance Certificate (TCC)', 'PenCom Compliance Certificate'],
  theme: 'dark', sidebarDefault: 'expanded', animationLevel: 'Full', fontSize: 'Normal',
  tableDensity: 'Comfortable', inactivityTimeoutMinutes: 30, soundEnabled: true,
  notificationPreferences: { deadlines: true, approvals: true, awards: true, payments: true },
  dailyBackupEnabled: true,
};
