/**
 * Procura – Enterprise Procurement System
 * DEMO SEED DATA (Defense-ready, fully linked)
 * --------------------------------------------
 * All foreign keys are consistent. Use the ID chains below for live navigation.
 *
 * PRIMARY DEMO ORG: Emerald Court Estates (org-emerald)
 *
 * FULL LIFECYCLE (completed + paid):
 *   REQ-2026-0001 → TND-2026-0001 → BID-2026-0001 (Awarded) → PO-2026-0001 → DEL-1 → PV-2026-0001
 *
 * CLOSED – READY FOR EVALUATION (demo evaluation screen):
 *   REQ-2026-0004 → TND-2026-0004 (Closed) → BID-2026-0004 + BID-2026-0005
 *
 * OPEN TENDER (live bidding / countdown):
 *   REQ-2026-0003 → TND-2026-0003 (Open)
 *
 * OVERDUE PO (exception / late delivery demo):
 *   REQ-2026-0002 → TND-2026-0002 → BID-2026-0003 → PO-2026-0002 (Overdue)
 *
 * SECONDARY ORGS:
 *   Husab Design (sole prop) – Open textile tender
 *   NNPC Limited (mega corp) – Open oil & gas valves tender
 *
 * DEMO PASSWORD (all accounts): Procura@2026
 */

import {
  Organization,
  Department,
  User,
  Category,
  VendorProfile,
  PurchaseRequest,
  Tender,
  Bid,
  PurchaseOrder,
  PaymentRecord,
  NotificationItem,
  AuditLogEntry,
  OrganizationSettings,
  DeliveryRecord,
} from '../types';

// ---------------------------------------------------------------------------
// ORGANIZATIONS
// ---------------------------------------------------------------------------
export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-emerald',
    name: 'Emerald Court Estates',
    type: 'enterprise',
    industry: 'Real Estate & Infrastructure Development',
    address: 'Plot 412, Constitution Avenue, Central Business District, Abuja, Nigeria',
    phone: '+234 9 291 8400',
    email: 'procurement@emeraldcourtestates.ng',
    approvalThreshold: 5000000,
    currency: '₦',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'org-husab',
    name: 'Husab Design',
    type: 'sole_proprietorship',
    industry: 'Fashion, Tailoring & Haute Couture',
    address: 'Suite 12, Garki Fashion Hub, Area 11, Abuja, Nigeria',
    phone: '+234 802 443 3221',
    email: 'procurement@husabdesign.ng',
    approvalThreshold: 500000,
    currency: '₦',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'org-nnpc',
    name: 'NNPC Limited',
    type: 'mega_corporation',
    industry: 'Energy, Oil & Gas Infrastructure',
    address: 'NNPC Towers, Herbert Macaulay Way, Central Business District, Abuja, Nigeria',
    phone: '+234 9 460 0000',
    email: 'tenders@nnpcgroup.com',
    approvalThreshold: 50000000,
    currency: '₦',
    createdAt: '2026-01-01T00:00:00Z',
  },
];
