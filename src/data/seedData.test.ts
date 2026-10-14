import { describe, expect, it } from 'vitest';
import {
  INITIAL_ORGANIZATIONS, INITIAL_DEPARTMENTS, INITIAL_TENDERS,
  INITIAL_PURCHASE_ORDERS, INITIAL_DELIVERIES, INITIAL_PAYMENTS, INITIAL_AUDIT_LOGS,
} from './seedData';

describe('demo seed consistency', () => {
  it('has Authority approval recorded before every seeded high-value PO', () => {
    for (const po of INITIAL_PURCHASE_ORDERS) {
      const tender = INITIAL_TENDERS.find((entry) => entry.id === po.tenderId);
      const organization = INITIAL_ORGANIZATIONS.find((entry) => entry.id === po.organizationId);
      expect(tender, po.referenceNumber + ' tender').toBeDefined();
      expect(organization, po.referenceNumber + ' organization').toBeDefined();
      if (po.totalAmount > (organization?.approvalThreshold || 0)) {
        const approval = INITIAL_AUDIT_LOGS.find((entry) =>
          entry.action === 'Award Approved by Authority' && entry.recordReference === tender?.referenceNumber,
        );
        expect(approval, po.referenceNumber + ' Authority approval').toBeDefined();
        expect(Date.parse(approval!.timestamp)).toBeLessThanOrEqual(Date.parse(po.issuedAt));
      }
    }
  });

  it('keeps department spent plus committed within allocation', () => {
    for (const department of INITIAL_DEPARTMENTS) {
      expect(department.spent, department.name + ' spent').toBeGreaterThanOrEqual(0);
      expect(department.committed, department.name + ' committed').toBeGreaterThanOrEqual(0);
      expect(department.spent + department.committed, department.name + ' allocation').toBeLessThanOrEqual(department.annualBudget);
    }
  });

  it('never seeds payment above accepted delivery value or PO total', () => {
    for (const po of INITIAL_PURCHASE_ORDERS) {
      const payments = INITIAL_PAYMENTS.filter((payment) => payment.purchaseOrderId === po.id);
      const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const acceptedValue = po.items.reduce((sum, item) => sum + item.unitPrice * (item.receivedQuantity || 0), 0);
      expect(po.paidAmount, po.referenceNumber + ' paid amount').toBeLessThanOrEqual(po.totalAmount);
      expect(paymentTotal, po.referenceNumber + ' payment ledger').toBe(po.paidAmount);
      expect(po.paidAmount, po.referenceNumber + ' accepted delivery value').toBeLessThanOrEqual(acceptedValue);
    }
  });

  it('keeps seeded delivery receipts linked to an existing purchase order', () => {
    for (const delivery of INITIAL_DELIVERIES) {
      expect(INITIAL_PURCHASE_ORDERS.some((po) => po.id === delivery.purchaseOrderId), delivery.poReference).toBe(true);
    }
  });
});
