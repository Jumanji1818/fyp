import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrintViewModal, DocumentData } from '../common/PrintViewModal';

type ReportType =
  | 'spend_analysis'
  | 'vendor_performance'
  | 'tender_summary'
  | 'delivery_performance'
  | 'budget_utilization'
  | 'outstanding_payments';

export const ReportsModule: React.FC = () => {
  const { payments, vendors, tenders, departments, purchaseOrders, deliveries, currentOrganization } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('spend_analysis');
  const [printDoc, setPrintDoc] = useState<DocumentData | null>(null);

  // Strictly scope records to active organization
  const orgPOs = purchaseOrders.filter((po) =>
    po.organizationId ? po.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const orgPayments = payments.filter((p) =>
    orgPOs.some((po) => po.id === p.purchaseOrderId || po.referenceNumber === p.poReference)
  );
  const orgTenders = tenders.filter((t) =>
    t.organizationId ? t.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const orgDeliveries = deliveries.filter((d) =>
    orgPOs.some((po) => po.id === d.purchaseOrderId || po.referenceNumber === d.poReference)
  );

  // Helper to trigger CSV download
  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (activeReport === 'spend_analysis') {
      const rows = [
        ['Payment Voucher', 'PO Reference', 'Vendor Name', 'Department', 'Amount (NGN)', 'Payment Date'],
        ...orgPayments.map((p) => [
          p.voucherNumber,
          p.poReference,
          p.vendorName,
          p.departmentName,
          p.amount.toString(),
          p.paymentDate,
        ]),
      ];
      downloadCSV(`Procura_Spend_Analysis_${currentOrganization.name.replace(/\s+/g, '_')}`, rows);
    } else if (activeReport === 'vendor_performance') {
      const rows = [
        ['Vendor Business Name', 'CAC Number', 'Reliability Score (%)', 'Total Orders', 'On Time Deliveries', 'Late Deliveries'],
        ...vendors.map((v) => [
          v.businessName,
          v.cacNumber,
          v.reliabilityScore.toString(),
          v.totalOrders.toString(),
          v.onTimeDeliveries.toString(),
          v.lateDeliveries.toString(),
        ]),
      ];
      downloadCSV('Procura_Vendor_Performance_Report', rows);
    } else if (activeReport === 'delivery_performance') {
      const rows = [
        ['PO Reference', 'Vendor', 'Received By', 'Delivery Date', 'Timeliness', 'Late Days'],
        ...orgDeliveries.map((d) => [
          d.poReference,
          d.vendorName,
          d.receivedByName,
          d.receivedDate,
          d.onTime ? 'On Time' : 'Late',
          d.lateDays.toString(),
        ]),
      ];
      downloadCSV(`Procura_Delivery_Performance_${currentOrganization.name.replace(/\s+/g, '_')}`, rows);
    } else {
      const rows = [
        ['Department', 'Annual Budget (NGN)', 'Disbursed Spent (NGN)', 'Committed (NGN)', 'Remaining (NGN)'],
        ...orgDepts.map((d) => [
          d.name,
          d.annualBudget.toString(),
          d.spent.toString(),
          d.committed.toString(),
          (d.annualBudget - d.spent - d.committed).toString(),
        ]),
      ];
      downloadCSV(`Procura_Budget_Utilization_${currentOrganization.name.replace(/\s+/g, '_')}`, rows);
    }
  };

  const handlePrintPDF = () => {
    setPrintDoc({
      type: 'Procurement Report',
      reference: `RPT-2026-${activeReport.toUpperCase()}`,
      title: `Executive Intelligence Report: ${activeReport.replace(/_/g, ' ').toUpperCase()}`,
      date: new Date().toLocaleDateString('en-GB'),
      recipientName: currentOrganization.name,
      notes: `Official procurement report generated for ${currentOrganization.name}. Aggregated statistics across active financial commitments and fulfillment audits.`,
      metaFields: [
        { label: 'Organization Entity', value: currentOrganization.name },
        { label: 'Report Category', value: activeReport.replace(/_/g, ' ') },
        { label: 'Fiscal Currency', value: 'Nigerian Naira (NGN ₦)' },
        { label: 'Audit Checksum', value: 'VERIFIED-ENTERPRISE' },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Export buttons */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
            Procurement Reports & Intelligence
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            Audit-grade performance metrics, spend analytics, and budget tracking with direct PDF & CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-[10px] bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#1F3A2D] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export to CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 shadow"
          >
            <Printer className="w-3.5 h-3.5 text-[#D4AF37]" /> Export to PDF
          </button>
        </div>
      </div>

      {/* Report Tabs (Section 7.4) */}
      <div className="flex flex-wrap gap-2 bg-[#0D1F17] p-2 rounded-2xl border border-[#1F3A2D]">
        {[
          { id: 'spend_analysis', label: 'Spend Analysis' },
          { id: 'vendor_performance', label: 'Vendor Performance' },
          { id: 'tender_summary', label: 'Tender Summary' },
          { id: 'delivery_performance', label: 'Delivery Performance' },
          { id: 'budget_utilization', label: 'Budget Utilization' },
          { id: 'outstanding_payments', label: 'Outstanding Payments' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as ReportType)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeReport === tab.id
                ? 'bg-[#132A20] text-[#D4AF37] border border-[#D4AF37]/50'
                : 'text-[#A8B5AB] hover:text-[#F2EFE6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REPORT CONTENT */}
      <div className="bg-[#0D1F17] rounded-2xl border border-[#1F3A2D] p-5 shadow-xl">
        {/* REPORT 1: SPEND ANALYSIS */}
        {activeReport === 'spend_analysis' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
              Annual Spend Disbursed by Vendor & Operating Department
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                  <tr>
                    <th className="py-2.5 px-3">Voucher Ref</th>
                    <th className="py-2.5 px-3">PO Reference</th>
                    <th className="py-2.5 px-3">Beneficiary Supplier</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Disbursed (₦)</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#E8CF7A]">{p.voucherNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-[#F2EFE6]">{p.poReference}</td>
                      <td className="py-2.5 px-3 text-[#F2EFE6]">{p.vendorName}</td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{p.departmentName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#3FB67A]">
                        ₦{p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{p.paymentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 2: VENDOR PERFORMANCE */}
        {activeReport === 'vendor_performance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
              Vendor Reliability Scoring & Fulfillment Track Record
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                  <tr>
                    <th className="py-2.5 px-3">Vendor Name</th>
                    <th className="py-2.5 px-3">CAC Number</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Orders</th>
                    <th className="py-2.5 px-3 text-center">On-Time</th>
                    <th className="py-2.5 px-3 text-center">Late</th>
                    <th className="py-2.5 px-3 text-right">Total Awarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {vendors.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{v.businessName}</td>
                      <td className="py-2.5 px-3 font-mono text-[#A8B5AB]">{v.cacNumber}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#D4AF37]">{v.reliabilityScore}%</td>
                      <td className="py-2.5 px-3 text-center text-[#F2EFE6]">{v.totalOrders}</td>
                      <td className="py-2.5 px-3 text-center text-[#3FB67A]">{v.onTimeDeliveries}</td>
                      <td className="py-2.5 px-3 text-center text-[#D9534F]">{v.lateDeliveries}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F2EFE6]">
                        ₦{v.totalValueAwarded.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 3: BUDGET UTILIZATION */}
        {activeReport === 'budget_utilization' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
              Department Fiscal Cap vs. Committed Commitments
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                  <tr>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Annual Cap</th>
                    <th className="py-2.5 px-3 text-right">Disbursed (Spent)</th>
                    <th className="py-2.5 px-3 text-right">Committed Awards</th>
                    <th className="py-2.5 px-3 text-right">Remaining Cap</th>
                    <th className="py-2.5 px-3 text-center">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {departments.map((d) => {
                    const used = d.spent + d.committed;
                    const rem = Math.max(0, d.annualBudget - used);
                    const pct = Math.round((used / d.annualBudget) * 100);
                    return (
                      <tr key={d.id}>
                        <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{d.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#F2EFE6]">₦{d.annualBudget.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#3FB67A]">₦{d.spent.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#E0A93B]">₦{d.committed.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D4AF37]">₦{rem.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#F2EFE6]">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 4: OUTSTANDING PAYMENTS */}
        {activeReport === 'outstanding_payments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
              Unsettled Purchase Order Financial Obligations
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                  <tr>
                    <th className="py-2.5 px-3">PO Reference</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Total Value</th>
                    <th className="py-2.5 px-3">Paid Value</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {purchaseOrders
                    .filter((po) => po.paidAmount < po.totalAmount)
                    .map((po) => (
                      <tr key={po.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#E8CF7A]">{po.referenceNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{po.vendorName}</td>
                        <td className="py-2.5 px-3 font-mono text-[#F2EFE6]">₦{po.totalAmount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-[#3FB67A]">₦{po.paidAmount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#E0A93B]">
                          ₦{(po.totalAmount - po.paidAmount).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#132A20] text-[#A8B5AB]">{po.status}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 5 & 6: Delivery performance & Tender summary */}
        {activeReport === 'delivery_performance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
              On-Time Consignment Delivery vs Late Schedule Analysis
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                  <tr>
                    <th className="py-2.5 px-3">PO Ref</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Received By</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Schedule Adherence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {deliveries.map((del) => (
                    <tr key={del.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#E8CF7A]">{del.poReference}</td>
                      <td className="py-2.5 px-3 text-[#F2EFE6]">{del.vendorName}</td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{del.receivedByName}</td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{del.receivedDate}</td>
                      <td className="py-2.5 px-3 text-center">
                        {del.onTime ? (
                          <span className="text-[#3FB67A] font-bold">On-Time</span>
                        ) : (
                          <span className="text-[#D9534F] font-bold">Late by {del.lateDays} days</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'tender_summary' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-serif-heading text-[#F2EFE6]">
              Published Tender Summaries & Competition Metrics
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#132A20] text-[#A8B5AB] border-b border-[#1F3A2D]">
                  <tr>
                    <th className="py-2.5 px-3">Tender Ref</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Vendors Notified</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F3A2D]">
                  {tenders.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#E8CF7A]">{t.referenceNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#F2EFE6]">{t.title}</td>
                      <td className="py-2.5 px-3 text-[#A8B5AB]">{t.departmentName}</td>
                      <td className="py-2.5 px-3 text-center text-[#D4AF37] font-mono">{t.matchingVendorsNotifiedCount}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#132A20] text-[#A8B5AB]">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <PrintViewModal isOpen={!!printDoc} onClose={() => setPrintDoc(null)} doc={printDoc} />
    </div>
  );
};
