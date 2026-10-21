import React, { useState } from 'react';
import {
  ProductionOrder,
  RawMaterial,
  BreadProduct,
  SalesInvoice,
  Marketer,
  Customer,
  DispatchSheet,
  BreadReturnRecord,
  CashierSession,
  PaymentReceipt,
  OperatingExpense,
} from '../types/erp';
import { formatNaira, formatDateNG, downloadCSV } from '../utils/formatters';
import { SalesRevenueTrendChart } from '../components/SalesRevenueTrendChart';
import { MonthlyProfitSummary } from '../components/MonthlyProfitSummary';
import {
  BarChart3,
  Download,
  Calendar,
  Flame,
  Boxes,
  FileText,
  Users,
  Store,
  Send,
  RotateCcw,
  Coins,
} from 'lucide-react';

interface ReportsViewProps {
  productionOrders: ProductionOrder[];
  rawMaterials: RawMaterial[];
  products: BreadProduct[];
  invoices: SalesInvoice[];
  marketers: Marketer[];
  customers: Customer[];
  dispatches: DispatchSheet[];
  returns: BreadReturnRecord[];
  cashierSessions: CashierSession[];
  payments: PaymentReceipt[];
  expenses: OperatingExpense[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  productionOrders,
  rawMaterials,
  products,
  invoices,
  marketers,
  customers,
  dispatches,
  returns,
  cashierSessions,
  payments,
  expenses,
}) => {
  const [reportType, setReportType] = useState<
    'production' | 'inventory' | 'sales' | 'marketers' | 'debtors' | 'dispatches' | 'returns' | 'cashier'
  >('production');

  // Export handlers for each report
  const handleExportCSV = () => {
    if (reportType === 'production') {
      const headers = ['Batch Number', 'Product', 'Shift', 'Date', 'Planned', 'Good Loaves', 'Rejects', 'Yield %', 'QC Status'];
      const rows = productionOrders.map(p => [
        p.batchNumber,
        p.productName,
        p.shift,
        formatDateNG(p.scheduledDate),
        p.targetLoaves,
        p.actualGoodLoaves,
        p.rejectedLoaves,
        `${p.yieldEfficiencyPercent}%`,
        p.qcStatus,
      ]);
      downloadCSV('nextar_production_report', headers, rows);
    } else if (reportType === 'inventory') {
      const headers = ['Item Code', 'Material Name', 'Category', 'Current Stock', 'Unit', 'Cost / Unit (NGN)', 'Total Valuation (NGN)', 'Storage Location'];
      const rows = rawMaterials.map(m => [
        m.code,
        m.name,
        m.category,
        m.currentStock,
        m.unitOfMeasure,
        m.standardCostPerUnit,
        m.currentStock * m.standardCostPerUnit,
        m.storageLocation,
      ]);
      downloadCSV('nextar_raw_materials_valuation', headers, rows);
    } else if (reportType === 'sales') {
      const headers = ['Invoice #', 'Customer', 'Date', 'Gross Amount (NGN)', 'Discount (NGN)', 'Net Payable (NGN)', 'Amount Paid (NGN)', 'Amount Due (NGN)', 'Status'];
      const rows = invoices.map(i => [
        i.invoiceNumber,
        i.customerName,
        formatDateNG(i.invoiceDate),
        i.subtotal,
        i.discountAmount,
        i.netPayableAmount,
        i.amountPaid,
        i.amountDue,
        i.status,
      ]);
      downloadCSV('nextar_sales_invoices_report', headers, rows);
    } else if (reportType === 'marketers') {
      const headers = ['Marketer Code', 'Full Name', 'Territory', 'Commission Rule', 'Daily Allocation', 'Total Sales YTD (NGN)', 'Pending Route Collections (NGN)'];
      const rows = marketers.map(m => [
        m.marketerCode,
        m.fullName,
        m.assignedTerritory,
        m.commissionType === 'PERCENTAGE' ? `${m.commissionRate}%` : `NGN ${m.commissionRate}/loaf`,
        m.dailyAllocationLimitLoaves,
        m.ytdTotalSales,
        m.currentOwedBalance,
      ]);
      downloadCSV('nextar_marketers_performance', headers, rows);
    } else if (reportType === 'debtors') {
      const headers = ['Customer Code', 'Outlet Name', 'Contact Phone', 'Classification', 'Price Tier', 'Credit Limit (NGN)', 'Outstanding Debt (NGN)', 'Terms (Days)'];
      const rows = customers.map(c => [
        c.customerCode,
        c.businessName,
        c.phone,
        c.customerType,
        c.priceTier,
        c.creditLimit,
        c.currentOutstandingBalance,
        c.creditDays,
      ]);
      downloadCSV('nextar_debtors_aging_report', headers, rows);
    } else if (reportType === 'dispatches') {
      const headers = ['Dispatch #', 'Driver', 'Vehicle', 'Route', 'Loaves Loaded', 'Loaves Delivered', 'Returns', 'Cash Collected (NGN)', 'POS/Transfer (NGN)', 'Status'];
      const rows = dispatches.map(d => [
        d.dispatchNumber,
        d.driverName,
        d.vehicleNumberPlate,
        d.destinationRoute,
        d.totalLoavesLoaded,
        d.totalLoavesDelivered,
        d.totalLoavesReturned,
        d.cashCollectedOnRoute,
        d.bankTransferOnRoute,
        d.status,
      ]);
      downloadCSV('nextar_dispatch_reconciliation', headers, rows);
    } else if (reportType === 'returns') {
      const headers = ['Return Ref', 'Customer', 'Date', 'Loaves Returned', 'Primary Reason', 'Disposition', 'Salvage Amount (NGN)', 'Credit Note (NGN)'];
      const rows = returns.map(r => [
        r.returnNumber,
        r.customerName || 'Route Return',
        formatDateNG(r.date),
        r.totalLoavesReturned,
        r.items[0]?.reason || 'Stale',
        r.dispositionAction,
        r.salvageRecoveryAmount,
        r.creditNoteAmount,
      ]);
      downloadCSV('nextar_returns_wastage_report', headers, rows);
    } else if (reportType === 'cashier') {
      const headers = ['Session Code', 'Cashier', 'Shift', 'Opening Float (NGN)', 'Cash Sales (NGN)', 'Transfers (NGN)', 'Expected Cash (NGN)', 'Counted Cash (NGN)', 'Variance (NGN)', 'Status'];
      const rows = cashierSessions.map(c => [
        c.sessionCode,
        c.cashierName,
        c.shift,
        c.openingFloat,
        c.totalCashSales + c.totalCreditCollections,
        c.totalBankTransfers,
        c.expectedPhysicalCash,
        c.actualPhysicalCashCounted || 0,
        c.cashVariance || 0,
        c.status,
      ]);
      downloadCSV('nextar_cashier_reconciliations', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Executive Reports & Certified Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Production yields, ingredient variances, debtor aging, dispatch reconciliations, and instant CSV export for Excel/management audits.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export Current Report (CSV)</span>
        </button>
      </div>

      <SalesRevenueTrendChart invoices={invoices} />

      <MonthlyProfitSummary invoices={invoices} expenses={expenses} />

      {/* Report Selector Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'production', label: '1. Production & Baking Output', icon: Flame },
          { id: 'inventory', label: '2. Raw Store Valuation', icon: Boxes },
          { id: 'sales', label: '3. Sales Invoices Summary', icon: FileText },
          { id: 'marketers', label: '4. Marketer Routes & Liability', icon: Users },
          { id: 'debtors', label: '5. Customer Debtors Aging', icon: Store },
          { id: 'dispatches', label: '6. Dispatch Delivery Reconciliation', icon: Send },
          { id: 'returns', label: '7. Stale Returns & Salvage', icon: RotateCcw },
          { id: 'cashier', label: '8. Cashier Shift Audits', icon: Coins },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Selected Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200">
            Certified Report View: <span className="text-blue-400 capitalize">{reportType}</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Generated from authoritative Nextar Bakery database records
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'production' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Date & Shift</th>
                  <th className="p-3">Target Loaves</th>
                  <th className="p-3">Good Loaves</th>
                  <th className="p-3">Burnt/Rejects</th>
                  <th className="p-3">Yield %</th>
                  <th className="p-3">QC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {productionOrders.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{p.batchNumber}</td>
                    <td className="p-3 font-medium text-white">{p.productName}</td>
                    <td className="p-3 text-slate-300">{formatDateNG(p.scheduledDate)} • {p.shift}</td>
                    <td className="p-3 font-mono text-slate-200">{p.targetLoaves}</td>
                    <td className="p-3 font-mono font-bold text-white">{p.actualGoodLoaves || '-'}</td>
                    <td className="p-3 font-mono text-rose-400">{p.rejectedLoaves || '-'}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{p.yieldEfficiencyPercent}%</td>
                    <td className="p-3 uppercase font-semibold text-[10px] text-cyan-300">{p.qcStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'inventory' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Material Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Unit Cost (NGN)</th>
                  <th className="p-3">Total Value (NGN)</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rawMaterials.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{m.code}</td>
                    <td className="p-3 font-medium text-white">{m.name}</td>
                    <td className="p-3 text-slate-300">{m.category}</td>
                    <td className="p-3 font-mono font-bold text-white">{m.currentStock} {m.unitOfMeasure}</td>
                    <td className="p-3 font-mono text-slate-300">{formatNaira(m.standardCostPerUnit)}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{formatNaira(m.currentStock * m.standardCostPerUnit)}</td>
                    <td className="p-3 text-slate-400">{m.storageLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'debtors' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Customer Code</th>
                  <th className="p-3">Business Name</th>
                  <th className="p-3">Territory</th>
                  <th className="p-3">Credit Limit</th>
                  <th className="p-3">Current Debt Balance</th>
                  <th className="p-3">Credit Days Allowed</th>
                  <th className="p-3">Credit Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {customers.map(c => {
                  const percent = c.creditLimit > 0 ? Math.round((c.currentOutstandingBalance / c.creditLimit) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-blue-400">{c.customerCode}</td>
                      <td className="p-3 font-semibold text-white">{c.businessName}</td>
                      <td className="p-3 text-slate-300">{c.territory}</td>
                      <td className="p-3 font-mono text-slate-300">{formatNaira(c.creditLimit)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400 text-sm">
                        {formatNaira(c.currentOutstandingBalance)}
                      </td>
                      <td className="p-3 text-slate-300">{c.creditDays} Days</td>
                      <td className="p-3 font-mono font-bold text-amber-300">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'sales' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Invoice Date</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Net Amount</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                    <td className="p-3 font-semibold text-white">{inv.customerName}</td>
                    <td className="p-3 text-slate-300">{formatDateNG(inv.invoiceDate)}</td>
                    <td className="p-3 font-mono text-slate-300">{formatNaira(inv.subtotal)}</td>
                    <td className="p-3 font-mono text-rose-300">{formatNaira(inv.discountAmount)}</td>
                    <td className="p-3 font-mono font-bold text-white">{formatNaira(inv.netPayableAmount)}</td>
                    <td className="p-3 font-mono text-emerald-400">{formatNaira(inv.amountPaid)}</td>
                    <td className="p-3 font-mono text-amber-300">{formatNaira(inv.amountDue)}</td>
                    <td className="p-3 uppercase text-[10px] font-bold text-cyan-300">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'marketers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Marketer Name</th>
                  <th className="p-3">Assigned Route</th>
                  <th className="p-3">Commission Terms</th>
                  <th className="p-3">Daily Allocation</th>
                  <th className="p-3">Total Sales YTD</th>
                  <th className="p-3">Current Route Balance Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {marketers.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{m.marketerCode}</td>
                    <td className="p-3 font-semibold text-white">{m.fullName}</td>
                    <td className="p-3 text-slate-300">{m.assignedTerritory}</td>
                    <td className="p-3 text-emerald-400 font-semibold">
                      {m.commissionType === 'PERCENTAGE' ? `${m.commissionRate}%` : `₦${m.commissionRate}/loaf`}
                    </td>
                    <td className="p-3 font-mono text-slate-300">{m.dailyAllocationLimitLoaves} loaves</td>
                    <td className="p-3 font-mono font-bold text-white">{formatNaira(m.ytdTotalSales)}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{formatNaira(m.currentOwedBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'dispatches' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Dispatch #</th>
                  <th className="p-3">Driver & Vehicle</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Loaded</th>
                  <th className="p-3">Delivered</th>
                  <th className="p-3">Returns</th>
                  <th className="p-3">Cash Collected</th>
                  <th className="p-3">POS Transfers</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dispatches.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{d.dispatchNumber}</td>
                    <td className="p-3 text-white">{d.driverName} ({d.vehicleNumberPlate})</td>
                    <td className="p-3 text-slate-300">{d.destinationRoute}</td>
                    <td className="p-3 font-mono font-bold text-white">{d.totalLoavesLoaded}</td>
                    <td className="p-3 font-mono text-emerald-400">{d.totalLoavesDelivered}</td>
                    <td className="p-3 font-mono text-rose-400">{d.totalLoavesReturned}</td>
                    <td className="p-3 font-mono text-slate-300">{formatNaira(d.cashCollectedOnRoute)}</td>
                    <td className="p-3 font-mono text-blue-400">{formatNaira(d.bankTransferOnRoute)}</td>
                    <td className="p-3 uppercase font-bold text-[10px] text-emerald-400">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'returns' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Return Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Disposition</th>
                  <th className="p-3">Salvage Recovery (NGN)</th>
                  <th className="p-3">Credit Issued (NGN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {returns.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-rose-400">{r.returnNumber}</td>
                    <td className="p-3 text-white font-medium">{r.customerName}</td>
                    <td className="p-3 text-slate-300">{formatDateNG(r.date)}</td>
                    <td className="p-3 font-mono font-bold text-white">{r.totalLoavesReturned} Loaves</td>
                    <td className="p-3 text-slate-300">{r.items[0]?.reason.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-amber-300 font-semibold">{r.dispositionAction.replace(/_/g, ' ')}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{formatNaira(r.salvageRecoveryAmount)}</td>
                    <td className="p-3 font-mono text-blue-400">{formatNaira(r.creditNoteAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'cashier' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Session Code</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3">Shift</th>
                  <th className="p-3">Opening Float</th>
                  <th className="p-3">Cash Receipts</th>
                  <th className="p-3">POS Transfers</th>
                  <th className="p-3">Expected Cash</th>
                  <th className="p-3">Counted</th>
                  <th className="p-3">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cashierSessions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">{c.sessionCode}</td>
                    <td className="p-3 font-medium text-white">{c.cashierName}</td>
                    <td className="p-3 text-slate-300">{c.shift}</td>
                    <td className="p-3 font-mono text-slate-300">{formatNaira(c.openingFloat)}</td>
                    <td className="p-3 font-mono text-emerald-400">{formatNaira(c.totalCashSales + c.totalCreditCollections)}</td>
                    <td className="p-3 font-mono text-blue-400">{formatNaira(c.totalBankTransfers)}</td>
                    <td className="p-3 font-mono text-amber-300">{formatNaira(c.expectedPhysicalCash)}</td>
                    <td className="p-3 font-mono font-bold text-white">
                      {c.actualPhysicalCashCounted !== undefined ? formatNaira(c.actualPhysicalCashCounted) : '-'}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {c.cashVariance !== undefined ? (c.cashVariance === 0 ? '✓ Balanced' : formatNaira(c.cashVariance)) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
