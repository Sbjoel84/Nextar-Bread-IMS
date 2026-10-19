import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { InventoryView } from './views/InventoryView';
import { ProcurementView } from './views/ProcurementView';
import { ProductionView } from './views/ProductionView';
import { QualityControlView } from './views/QualityControlView';
import { FinishedGoodsView } from './views/FinishedGoodsView';
import { MarketersView } from './views/MarketersView';
import { CustomersView } from './views/CustomersView';
import { SalesInvoicesView } from './views/SalesInvoicesView';
import { DispatchesView } from './views/DispatchesView';
import { ReturnsView } from './views/ReturnsView';
import { CashierView } from './views/CashierView';
import { PaymentsView } from './views/PaymentsView';
import { FinanceView } from './views/FinanceView';
import { EmployeesView } from './views/EmployeesView';
import { ReportsView } from './views/ReportsView';
import { AuditLogsView } from './views/AuditLogsView';
import { SettingsView } from './views/SettingsView';

import {
  User,
  DashboardMetrics,
  BreadProduct,
  RawMaterial,
  StockMovement,
  Supplier,
  PurchaseOrder,
  GoodsReceiptNote,
  Recipe,
  ProductionOrder,
  QualityControlRecord,
  FinishedGoodsItem,
  Marketer,
  Customer,
  SalesInvoice,
  DispatchSheet,
  BreadReturnRecord,
  CashierSession,
  PaymentReceipt,
  OperatingExpense,
  JournalEntry,
  Employee,
  AttendanceRecord,
  AuditLogEntry,
  SystemNotification,
  BakerySettings,
} from './types/erp';
import { calculateRawMaterialUsage, InventoryUsageReport } from './utils/inventoryUsage';
import { initialFullDb, computeInitialMetrics } from './utils/initialState';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(initialFullDb.users[0]);
  const [allUsers, setAllUsers] = useState<User[]>(initialFullDb.users);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(computeInitialMetrics());
  const [products, setProducts] = useState<BreadProduct[]>(initialFullDb.products);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialFullDb.rawMaterials);
  const [stockLedger, setStockLedger] = useState<StockMovement[]>(initialFullDb.stockLedger);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialFullDb.suppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialFullDb.purchaseOrders);
  const [goodsReceiptNotes, setGoodsReceiptNotes] = useState<GoodsReceiptNote[]>(initialFullDb.goodsReceiptNotes);
  const [recipes, setRecipes] = useState<Recipe[]>(initialFullDb.recipes);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(initialFullDb.productionOrders);
  const [qcRecords, setQcRecords] = useState<QualityControlRecord[]>(initialFullDb.qualityControlRecords);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGoodsItem[]>(initialFullDb.finishedGoods);
  const [marketers, setMarketers] = useState<Marketer[]>(initialFullDb.marketers);
  const [customers, setCustomers] = useState<Customer[]>(initialFullDb.customers);
  const [invoices, setInvoices] = useState<SalesInvoice[]>(initialFullDb.salesInvoices);
  const [dispatches, setDispatches] = useState<DispatchSheet[]>(initialFullDb.dispatchSheets);
  const [returns, setReturns] = useState<BreadReturnRecord[]>(initialFullDb.returnRecords);
  const [cashierSessions, setCashierSessions] = useState<CashierSession[]>(initialFullDb.cashierSessions);
  const [payments, setPayments] = useState<PaymentReceipt[]>(initialFullDb.payments);
  const [expenses, setExpenses] = useState<OperatingExpense[]>(initialFullDb.operatingExpenses);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialFullDb.journalEntries);
  const [employees, setEmployees] = useState<Employee[]>(initialFullDb.employees);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialFullDb.attendanceRecords);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialFullDb.auditLogs);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialFullDb.notifications);
  const [settings, setSettings] = useState<BakerySettings | null>(initialFullDb.settings);

  // Compute initial usage calculation synchronously
  const initialUsage = calculateRawMaterialUsage(
    initialFullDb.rawMaterials,
    initialFullDb.productionOrders,
    initialFullDb.stockLedger,
    initialFullDb.settings
  );
  const [usageReport, setUsageReport] = useState<InventoryUsageReport | null>(initialUsage);

  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'info' | 'warning' | 'success' } | null>(null);

  const showToast = (text: string, type: 'info' | 'warning' | 'success' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Fast single-request bulk state fetch
  const fetchAllData = async (isInitial = false) => {
    try {
      const res = await fetch('/api/v1/initial-state').then(r => r.json());
      if (res.success) {
        setCurrentUser(res.currentUser);
        setAllUsers(res.allUsers);
        setMetrics(res.metrics);
        setProducts(res.products);
        setRawMaterials(res.rawMaterials);
        setStockLedger(res.stockLedger);
        setSuppliers(res.suppliers);
        setPurchaseOrders(res.purchaseOrders);
        setGoodsReceiptNotes(res.goodsReceiptNotes);
        setRecipes(res.recipes);
        setProductionOrders(res.productionOrders);
        setQcRecords(res.qualityControlRecords);
        setFinishedGoods(res.finishedGoods);
        setMarketers(res.marketers);
        setCustomers(res.customers);
        setInvoices(res.salesInvoices);
        setDispatches(res.dispatchSheets);
        setReturns(res.returnRecords);
        setCashierSessions(res.cashierSessions);
        setPayments(res.payments);
        setExpenses(res.operatingExpenses);
        setJournalEntries(res.journalEntries);
        setEmployees(res.employees);
        setAttendance(res.attendanceRecords);
        setAuditLogs(res.auditLogs);
        setNotifications(res.notifications);
        setSettings(res.settings);

        // Calculate raw material usage and threshold warnings
        const usage = calculateRawMaterialUsage(
          res.rawMaterials,
          res.productionOrders,
          res.stockLedger,
          res.settings
        );
        setUsageReport(usage);

        // On initial load or state refresh, if ingredients are below threshold, show a warning toast!
        if (isInitial && usage.totalBelowThreshold > 0) {
          showToast(
            `⚠️ Threshold Alert: ${usage.totalBelowThreshold} raw material ingredient(s) are below reorder threshold defined in settings!`,
            'warning'
          );
        }
      }
    } catch (err) {
      console.error('[App] Fast fetch failed, fallback:', err);
    }
  };

  const handleRecalculateUsage = () => {
    const freshUsage = calculateRawMaterialUsage(rawMaterials, productionOrders, stockLedger, settings);
    setUsageReport(freshUsage);
    if (freshUsage.totalBelowThreshold > 0) {
      showToast(
        `⚠️ Threshold Audit: ${freshUsage.totalBelowThreshold} ingredient(s) are below reorder threshold (${freshUsage.criticalMaterials.map(m => m.name).join(', ')})!`,
        'warning'
      );
    } else {
      showToast('✅ All raw material ingredients are safely above reorder threshold.', 'success');
    }
  };

  useEffect(() => {
    // Immediate threshold warning toast on first frame
    if (initialUsage.totalBelowThreshold > 0) {
      showToast(
        `⚠️ Reorder Threshold Alert: ${initialUsage.totalBelowThreshold} raw materials (${initialUsage.criticalMaterials.map(m => m.name).slice(0, 2).join(', ')}) are below reorder threshold!`,
        'warning'
      );
    }
    fetchAllData(false);
  }, []);

  // Action handlers
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/v1/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).then(r => r.json());

      if (res.success) {
        setCurrentUser(res.user);
        showToast(`Active role switched to: ${res.user.fullName} (${res.user.role})`, 'info');
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchBatch = async (data: any) => {
    const res = await fetch('/api/v1/production/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Batch ${res.order.batchNumber} launched! Ingredients issued from silo.`, 'success');
      await fetchAllData();
      // Check if any ingredient dropped below threshold after batch launch
      const freshMaterials = rawMaterials;
      const usage = calculateRawMaterialUsage(freshMaterials, productionOrders, stockLedger, settings);
      if (usage.criticalMaterials.length > 0) {
        setTimeout(() => {
          showToast(`⚠️ Low Stock Warning: ${usage.criticalMaterials[0].name} is now below reorder threshold!`, 'warning');
        }, 1500);
      }
    }
  };

  const handleCompleteBatch = async (orderId: string, data: any) => {
    const res = await fetch(`/api/v1/production/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Baking completed for ${res.order.batchNumber}. Sent to Quality Control.`, 'success');
      fetchAllData();
    }
  };

  const handleSubmitQC = async (data: any) => {
    const res = await fetch('/api/v1/quality-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`QC Decision: ${data.overallDecision} recorded for ${res.record.batchNumber}!`, 'success');
      fetchAllData();
    }
  };

  const handleAdjustStock = async (data: any) => {
    const res = await fetch('/api/v1/stock-ledger/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast('Physical stock count adjustment recorded successfully!', 'info');
      fetchAllData();
    } else {
      alert(res.message || 'Error adjusting stock');
    }
  };

  const handleCreatePO = async (data: any) => {
    const res = await fetch('/api/v1/procurement/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Purchase Order ${res.order.poNumber} issued!`, 'success');
      fetchAllData();
    }
  };

  const handleApprovePO = async (poId: string) => {
    const res = await fetch(`/api/v1/procurement/orders/${poId}/approve`, {
      method: 'PUT',
    }).then(r => r.json());
    if (res.success) {
      showToast(`Purchase Order ${res.order.poNumber} approved by GM!`, 'success');
      fetchAllData();
    }
  };

  const handleCreateGRN = async (data: any) => {
    const res = await fetch('/api/v1/procurement/grn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`GRN ${res.grn.grnNumber} posted! Silo stock updated.`, 'success');
      fetchAllData();
    }
  };

  const handleCreateInvoice = async (data: any) => {
    const res = await fetch('/api/v1/sales/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Invoice ${res.invoice.invoiceNumber} posted successfully!`, 'success');
      fetchAllData();
    } else {
      throw new Error(res.message || 'Error creating invoice');
    }
  };

  const handleCreateDispatch = async (data: any) => {
    const res = await fetch('/api/v1/dispatches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Loading sheet ${res.dispatch.dispatchNumber} authorized!`, 'success');
      fetchAllData();
    }
  };

  const handleReconcileDispatch = async (id: string, data: any) => {
    const res = await fetch(`/api/v1/dispatches/${id}/reconcile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Route delivery reconciled for ${res.dispatch.dispatchNumber}!`, 'success');
      fetchAllData();
    }
  };

  const handleAddReturn = async (data: any) => {
    const res = await fetch('/api/v1/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Return ${res.returnRecord.returnNumber} logged & dispositioned!`, 'info');
      fetchAllData();
    }
  };

  const handleOpenCashierSession = async (data: any) => {
    const res = await fetch('/api/v1/cashier/sessions/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Cashier register opened (${res.session.sessionCode})!`, 'success');
      fetchAllData();
    }
  };

  const handleCloseCashierSession = async (id: string, data: any) => {
    const res = await fetch(`/api/v1/cashier/sessions/${id}/close`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Session ${res.session.sessionCode} closed & reconciled!`, 'success');
      fetchAllData();
    }
  };

  const handleRecordPayment = async (data: any) => {
    const res = await fetch('/api/v1/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Receipt ${res.payment.receiptNumber} issued successfully!`, 'success');
      fetchAllData();
    }
  };

  const handleAddExpense = async (data: any) => {
    const res = await fetch('/api/v1/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Expense voucher ${res.expense.voucherNumber} approved!`, 'success');
      fetchAllData();
    }
  };

  const handlePostJournal = async (data: any) => {
    const res = await fetch('/api/v1/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Journal entry ${res.entry.entryNumber} balanced & posted!`, 'success');
      fetchAllData();
    } else {
      alert(res.message || 'Journal entry error');
    }
  };

  const handleAddEmployee = async (data: any) => {
    const res = await fetch('/api/v1/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Employee ${res.employee.fullName} registered!`, 'success');
      fetchAllData();
    }
  };

  const handleMarkAttendance = async (data: any) => {
    const res = await fetch('/api/v1/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Shift attendance recorded: ${res.attendance.status}`, 'info');
      fetchAllData();
    }
  };

  const handleAddProduct = async (data: any) => {
    const res = await fetch('/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Bread product ${res.product.name} created!`, 'success');
      fetchAllData();
    }
  };

  const handleUpdateProduct = async (id: string, data: any) => {
    const res = await fetch(`/api/v1/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Product ${res.product.name} updated!`, 'info');
      fetchAllData();
    }
  };

  const handleAddCustomer = async (data: any) => {
    const res = await fetch('/api/v1/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Customer ${res.customer.businessName} registered!`, 'success');
      fetchAllData();
    }
  };

  const handleAddMarketer = async (data: any) => {
    const res = await fetch('/api/v1/marketers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Marketer ${res.marketer.fullName} registered!`, 'success');
      fetchAllData();
    }
  };

  const handleAddMaterial = async (data: any) => {
    const res = await fetch('/api/v1/raw-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
    if (res.success) {
      showToast(`Raw material ${res.rawMaterial.name} registered!`, 'success');
      fetchAllData();
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<BakerySettings>) => {
    const res = await fetch('/api/v1/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).then(r => r.json());
    if (res.success) {
      setSettings(res.settings);
      showToast('Bakery configuration updated!', 'info');
      fetchAllData();
    }
  };

  const handleResetDatabase = async () => {
    const res = await fetch('/api/v1/system/reset-demo', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      showToast('Nextar Bakery database reset to authentic demo seed!', 'info');
      fetchAllData();
    }
  };

  const handleMarkNotificationsRead = async () => {
    await fetch('/api/v1/notifications/mark-read', { method: 'POST' });
    fetchAllData();
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-2.5 max-w-md ${
            toastMessage.type === 'warning'
              ? 'bg-amber-600 text-white border border-amber-400 shadow-amber-950/50'
              : toastMessage.type === 'info'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-slate-950/50'
              : 'bg-blue-600 text-white border border-blue-400/40 shadow-blue-950/50'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toastMessage.type === 'warning'
                ? 'bg-white animate-bounce'
                : 'bg-cyan-300 animate-ping'
            }`}
          ></span>
          <span className="leading-snug">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onResetDatabase={handleResetDatabase}
      />

      {/* Main Layout: Fixed Height with independent scrolling columns */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* Navigation Sidebar: Static left rail with independent nav list scroll */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser?.role}
        />

        {/* Workspace Content Canvas: Full-Width edge-to-edge independent scroll container */}
        <main className="flex-1 h-full overflow-y-auto overscroll-contain p-4 sm:p-6 bg-[#090d16] w-full min-w-0">
          <div className="w-full min-w-0 pb-16">
            {currentTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                currentUser={currentUser}
                usageReport={usageReport}
                onNavigate={setCurrentTab}
                onRecalculateUsage={handleRecalculateUsage}
                recipes={recipes}
                rawMaterials={rawMaterials}
              />
            )}

            {currentTab === 'recipes' && (
              <ProductionView
                orders={productionOrders}
                recipes={recipes}
                products={products}
                rawMaterials={rawMaterials}
                onLaunchBatch={handleLaunchBatch}
                onCompleteBatch={handleCompleteBatch}
              />
            )}

            {currentTab === 'production' && (
              <ProductionView
                orders={productionOrders}
                recipes={recipes}
                products={products}
                rawMaterials={rawMaterials}
                onLaunchBatch={handleLaunchBatch}
                onCompleteBatch={handleCompleteBatch}
              />
            )}

            {currentTab === 'quality-control' && (
              <QualityControlView
                records={qcRecords}
                pendingBatches={productionOrders}
                onSubmitInspection={handleSubmitQC}
              />
            )}

            {currentTab === 'finished-goods' && (
              <FinishedGoodsView items={finishedGoods} />
            )}

            {currentTab === 'products' && (
              <ProductsView
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
              />
            )}

            {currentTab === 'raw-materials' && (
              <InventoryView
                rawMaterials={rawMaterials}
                stockLedger={stockLedger}
                onAddMaterial={handleAddMaterial}
                onAdjustStock={handleAdjustStock}
              />
            )}

            {currentTab === 'procurement' && (
              <ProcurementView
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                goodsReceiptNotes={goodsReceiptNotes}
                rawMaterials={rawMaterials}
                onCreatePO={handleCreatePO}
                onApprovePO={handleApprovePO}
                onCreateGRN={handleCreateGRN}
              />
            )}

            {currentTab === 'marketers' && (
              <MarketersView
                marketers={marketers}
                onAddMarketer={handleAddMarketer}
              />
            )}

            {currentTab === 'customers' && (
              <CustomersView
                customers={customers}
                marketers={marketers}
                onAddCustomer={handleAddCustomer}
              />
            )}

            {currentTab === 'sales-invoices' && (
              <SalesInvoicesView
                invoices={invoices}
                customers={customers}
                products={products}
                marketers={marketers}
                onCreateInvoice={handleCreateInvoice}
              />
            )}

            {currentTab === 'dispatches' && (
              <DispatchesView
                dispatches={dispatches}
                products={products}
                marketers={marketers}
                onCreateDispatch={handleCreateDispatch}
                onReconcileDispatch={handleReconcileDispatch}
              />
            )}

            {currentTab === 'returns' && (
              <ReturnsView
                returns={returns}
                customers={customers}
                products={products}
                onAddReturn={handleAddReturn}
              />
            )}

            {currentTab === 'cashier' && (
              <CashierView
                sessions={cashierSessions}
                onOpenSession={handleOpenCashierSession}
                onCloseSession={handleCloseCashierSession}
              />
            )}

            {currentTab === 'payments' && (
              <PaymentsView
                payments={payments}
                customers={customers}
                invoices={invoices}
                onRecordPayment={handleRecordPayment}
              />
            )}

            {currentTab === 'finance' && (
              <FinanceView
                expenses={expenses}
                journalEntries={journalEntries}
                products={products}
                onAddExpense={handleAddExpense}
                onPostJournal={handlePostJournal}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeesView
                employees={employees}
                attendance={attendance}
                onAddEmployee={handleAddEmployee}
                onMarkAttendance={handleMarkAttendance}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                productionOrders={productionOrders}
                rawMaterials={rawMaterials}
                products={products}
                invoices={invoices}
                marketers={marketers}
                customers={customers}
                dispatches={dispatches}
                returns={returns}
                cashierSessions={cashierSessions}
                payments={payments}
              />
            )}

            {currentTab === 'audit-logs' && (
              <AuditLogsView logs={auditLogs} />
            )}

            {currentTab === 'settings' && settings && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetDatabase={handleResetDatabase}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
