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
} from './seedData';

/**
 * Dedicated resettable demo snapshot.
 * Deep copies ensure edits made during a demo session do not mutate seed constants.
 *
 * Defense navigation map (use these IDs to jump quickly):
 *
 * FULL LIFECYCLE (completed + paid)
 *   req-1  →  tnd-1  →  bid-1 (Awarded)  →  po-1  →  del-1  →  pay-1
 *
 * CLOSED – READY FOR EVALUATION
 *   req-4  →  tnd-4 (Closed)  →  bid-4 + bid-5
 *
 * OPEN TENDER (live countdown)
 *   req-3  →  tnd-3 (Open until 28 Nov 2026)
 *
 * OVERDUE PO (exception handling)
 *   req-2  →  tnd-2  →  bid-3  →  po-2 (past expected delivery)
 *
 * SECONDARY ORGS
 *   Husab:  req-husab-1 → tnd-husab-1 (Open)
 *   NNPC:   req-nnpc-1  → tnd-nnpc-1  (Open)
 *
 * Demo password for every account: Procura@2026
 */
export const createDemoSeed = () => ({
  organizations: structuredClone(INITIAL_ORGANIZATIONS),
  settings: structuredClone(INITIAL_SETTINGS),
  departments: structuredClone(INITIAL_DEPARTMENTS),
  categories: structuredClone(INITIAL_CATEGORIES),
  users: structuredClone(INITIAL_USERS),
  vendors: structuredClone(INITIAL_VENDORS),
  requests: structuredClone(INITIAL_REQUESTS),
  tenders: structuredClone(INITIAL_TENDERS),
  bids: structuredClone(INITIAL_BIDS),
  purchaseOrders: structuredClone(INITIAL_PURCHASE_ORDERS),
  deliveries: structuredClone(INITIAL_DELIVERIES),
  payments: structuredClone(INITIAL_PAYMENTS),
  notifications: structuredClone(INITIAL_NOTIFICATIONS),
  auditLogs: structuredClone(INITIAL_AUDIT_LOGS),
});
