import type { Department, DeliveryRecord, PaymentRecord, PurchaseOrder, Tender, VendorProfile } from '../types';

export function serializeCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export function spendAnalysisRows(payments: PaymentRecord[]): string[][] {
  return [
    ['Payment Voucher', 'PO Reference', 'Vendor Name', 'Department', 'Amount (NGN)', 'Payment Date'],
    ...payments.map((payment) => [payment.voucherNumber, payment.poReference, payment.vendorName, payment.departmentName, String(payment.amount), payment.paymentDate]),
  ];
}

export function vendorPerformanceRows(vendors: VendorProfile[]): string[][] {
  return [
    ['Vendor Business Name', 'CAC Number', 'Reliability Score (%)', 'Total Orders', 'On Time Deliveries', 'Late Deliveries'],
    ...vendors.map((vendor) => [vendor.businessName, vendor.cacNumber, String(vendor.reliabilityScore), String(vendor.totalOrders), String(vendor.onTimeDeliveries), String(vendor.lateDeliveries)]),
  ];
}

export function deliveryPerformanceRows(deliveries: DeliveryRecord[]): string[][] {
  return [
    ['PO Reference', 'Vendor', 'Received By', 'Delivery Date', 'Timeliness', 'Late Days'],
    ...deliveries.map((delivery) => [delivery.poReference, delivery.vendorName, delivery.receivedByName, delivery.receivedDate, delivery.onTime ? 'On Time' : 'Late', String(delivery.lateDays)]),
  ];
}

export function tenderSummaryRows(tenders: Tender[]): string[][] {
  return [
    ['Tender Reference', 'Title', 'Department', 'Status', 'Bid Closing Date/Time'],
    ...tenders.map((tender) => [tender.referenceNumber, tender.title, tender.departmentName, tender.status, tender.bidClosingDateTime]),
  ];
}

export function budgetUtilizationRows(departments: Department[]): string[][] {
  return [
    ['Department', 'Annual Budget (NGN)', 'Disbursed Spent (NGN)', 'Committed (NGN)', 'Remaining (NGN)'],
    ...departments.map((department) => [
      department.name, String(department.annualBudget), String(department.spent), String(department.committed),
      String(department.annualBudget - department.spent - department.committed),
    ]),
  ];
}

export function outstandingPaymentRows(purchaseOrders: PurchaseOrder[]): string[][] {
  return [
    ['PO Reference', 'Vendor', 'Department', 'PO Total (NGN)', 'Paid (NGN)', 'Outstanding (NGN)', 'PO Status'],
    ...purchaseOrders
      .filter((po) => po.status !== 'Cancelled' && po.paidAmount < po.totalAmount)
      .map((po) => [po.referenceNumber, po.vendorName, po.departmentName, String(po.totalAmount), String(po.paidAmount), String(Math.max(0, po.totalAmount - po.paidAmount)), po.status]),
  ];
}
