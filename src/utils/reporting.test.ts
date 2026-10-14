import { describe, expect, it } from 'vitest';
import { budgetUtilizationRows, outstandingPaymentRows, serializeCsv, tenderSummaryRows } from './reporting';
import type { Department, PurchaseOrder, Tender } from '../types';

describe('report data exports', () => {
  it('exports outstanding balances from PO total less paid amount', () => {
    const po = {
      id: 'po-test', referenceNumber: 'PO-TEST-01', vendorName: 'Vendor "A"',
      departmentName: 'ICT', totalAmount: 1000, paidAmount: 250, status: 'Partially Delivered',
    } as PurchaseOrder;
    expect(outstandingPaymentRows([po])[1]).toEqual([
      'PO-TEST-01', 'Vendor "A"', 'ICT', '1000', '250', '750', 'Partially Delivered',
    ]);
    expect(outstandingPaymentRows([{ ...po, status: 'Cancelled' } as PurchaseOrder])).toHaveLength(1);
    expect(outstandingPaymentRows([{ ...po, status: 'Issued' } as PurchaseOrder])).toHaveLength(1);
  });

  it('exports remaining budget as allocation minus spent and committed', () => {
    const department = { id: 'dept', name: 'ICT', annualBudget: 1000, spent: 200, committed: 300 } as Department;
    expect(budgetUtilizationRows([department])[1]).toEqual(['ICT', '1000', '200', '300', '500']);
  });

  it('exports tender status and closing time from the selected records', () => {
    const tender = { referenceNumber: 'TND-TEST-01', title: 'Test Tender', departmentName: 'ICT', status: 'Closed', bidClosingDateTime: '2026-10-14T12:00:00Z' } as Tender;
    expect(tenderSummaryRows([tender])[1]).toEqual(['TND-TEST-01', 'Test Tender', 'ICT', 'Closed', '2026-10-14T12:00:00Z']);
  });

  it('escapes embedded quotes and line breaks and neutralizes spreadsheet formulas', () => {
    expect(serializeCsv([['Vendor', 'Amount'], ['A "quoted", Inc', 10]])).toBe('"Vendor","Amount"\r\n"A ""quoted"", Inc","10"');
    expect(serializeCsv([['=HYPERLINK("https://bad.example")', '+SUM(A1:A2)', '-cmd', '@SUM(A1:A2)']])).toBe('"\'=HYPERLINK(""https://bad.example"")","\'+SUM(A1:A2)","\'-cmd","\'@SUM(A1:A2)"');
  });
});
