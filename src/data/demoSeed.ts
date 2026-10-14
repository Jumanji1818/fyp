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
 * Dedicated resettable demo snapshot. Keeping this separate from the app's
 * initial defaults lets the demo dataset be refreshed independently. Deep
 * copies ensure edits made during a demo session do not mutate seed constants.
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
