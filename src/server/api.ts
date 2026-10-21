import express, { Request, Response, Router } from 'express';
import { dbManager } from './db';
import { accessRouter, getContext, getCurrentUser, permissionGuard, publicUser, sessionMiddleware, visibleAccessRequests } from './access';
import { isSuperAdmin } from '../shared/permissions';
import {
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
  SalesInvoice,
  DispatchSheet,
  BreadReturnRecord,
  CashierSession,
  PaymentReceipt,
  OperatingExpense,
  JournalEntry,
  Customer,
  Marketer,
  Employee,
  AttendanceRecord,
  User,
  BakerySettings,
} from '../types/erp';

export const apiRouter = Router();

// Next document number in the PREFIX-YYYY-NNNN series, continuing from the highest number already issued this year.
function nextDocNumber(prefix: string, existing: string[]): string {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const highest = existing.reduce((max, num) => {
    const m = pattern.exec(num || '');
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `${prefix}-${year}-${String(highest + 1).padStart(4, '0')}`;
}

function nextStaffCode(existing: string[]): string {
  const highest = existing.reduce((max, code) => {
    const m = /^NXT-EMP-(\d+)$/.exec(code || '');
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `NXT-EMP-${String(highest + 1).padStart(3, '0')}`;
}


// Every request runs as the user this device is assigned to (see ./access.ts);
// the guard refuses actions the user has no permission for.
apiRouter.use(sessionMiddleware);
apiRouter.use(permissionGuard);
apiRouter.use(accessRouter);

// ---------------------------------------------------------------------------
// 1. FAST CONSOLIDATED STATE (Instant Zero-Latency Applet Load)
// ---------------------------------------------------------------------------
apiRouter.get('/initial-state', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const currentUser = getCurrentUser();
  const { realUser } = getContext();
  const metrics = dbManager.computeDashboardMetrics();

  res.json({
    success: true,
    currentUser: publicUser(currentUser),
    realUser: realUser ? publicUser(realUser) : null,
    impersonating: Boolean(realUser && realUser.id !== currentUser.id),
    // Only a Super Admin (at the device) needs the user list, for switching
    allUsers: isSuperAdmin(realUser) ? db.users.filter(u => u.isActive).map(publicUser) : [publicUser(currentUser)],
    accessRequests: visibleAccessRequests(currentUser),
    metrics,
    products: db.products,
    rawMaterials: db.rawMaterials,
    stockLedger: db.stockLedger,
    suppliers: db.suppliers,
    purchaseOrders: db.purchaseOrders,
    goodsReceiptNotes: db.goodsReceiptNotes,
    recipes: db.recipes,
    productionOrders: db.productionOrders,
    qualityControlRecords: db.qualityControlRecords,
    finishedGoods: db.finishedGoods,
    marketers: db.marketers,
    customers: db.customers,
    salesInvoices: db.salesInvoices,
    dispatchSheets: db.dispatchSheets,
    returnRecords: db.returnRecords,
    cashierSessions: db.cashierSessions,
    payments: db.payments,
    operatingExpenses: db.operatingExpenses,
    journalEntries: db.journalEntries,
    employees: db.employees,
    attendanceRecords: db.attendanceRecords,
    auditLogs: db.auditLogs,
    notifications: db.notifications,
    settings: db.settings,
  });
});

// ---------------------------------------------------------------------------
// 2. DASHBOARD
// ---------------------------------------------------------------------------
apiRouter.get('/dashboard/metrics', (req: Request, res: Response) => {
  const metrics = dbManager.computeDashboardMetrics();
  res.json({ success: true, metrics });
});

// ---------------------------------------------------------------------------
// 3. PRODUCTS & PRICES
// ---------------------------------------------------------------------------
apiRouter.get('/products', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, products: db.products });
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: BreadProduct = {
    id: `prod-${Date.now()}`,
    name: req.body.name,
    code: req.body.code || `NXT-${Date.now().toString().slice(-4)}`,
    category: req.body.category || 'STANDARD',
    sizeGrams: Number(req.body.sizeGrams) || 800,
    isSliced: Boolean(req.body.isSliced),
    packagingType: req.body.packagingType || 'PRINTED_NYLON',
    standardRetailPrice: Number(req.body.standardRetailPrice) || 0,
    wholesalePrice: Number(req.body.wholesalePrice) || 0,
    distributorPrice: Number(req.body.distributorPrice) || 0,
    estimatedCostPrice: Number(req.body.estimatedCostPrice) || 0,
    shelfLifeDays: Number(req.body.shelfLifeDays) || 5,
    reorderAlertLevel: Number(req.body.reorderAlertLevel) || 100,
    barcode: req.body.barcode || `${Date.now()}`,
    status: req.body.status || 'ACTIVE',
    currentStockLoaves: Number(req.body.currentStockLoaves) || 0,
    createdAt: new Date().toISOString(),
  };

  db.products.push(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'PRODUCT', item.id, `Created product ${item.name} (${item.code})`);
  res.status(201).json({ success: true, product: item });
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });

  const before = { ...db.products[idx] };
  db.products[idx] = { ...db.products[idx], ...req.body };
  dbManager.persist();
  dbManager.recordAudit(actor, 'UPDATE', 'PRODUCT', req.params.id, `Updated product ${db.products[idx].name} pricing/specifications`, before, db.products[idx]);
  res.json({ success: true, product: db.products[idx] });
});

// ---------------------------------------------------------------------------
// 4. RAW MATERIALS & STOCK LEDGER
// ---------------------------------------------------------------------------
apiRouter.get('/raw-materials', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, rawMaterials: db.rawMaterials });
});

apiRouter.post('/raw-materials', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: RawMaterial = {
    id: `rm-${Date.now()}`,
    code: req.body.code || `RAW-${Date.now().toString().slice(-4)}`,
    name: req.body.name,
    category: req.body.category || 'OTHER',
    unitOfMeasure: req.body.unitOfMeasure || 'KG',
    currentStock: Number(req.body.currentStock) || 0,
    minimumStockAlert: Number(req.body.minimumStockAlert) || 10,
    standardCostPerUnit: Number(req.body.standardCostPerUnit) || 0,
    supplierId: req.body.supplierId || '',
    supplierName: req.body.supplierName || '',
    storageLocation: req.body.storageLocation || 'Main Raw Store',
    updatedAt: new Date().toISOString(),
  };

  db.rawMaterials.push(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'RAW_MATERIAL', item.id, `Created raw material ${item.name} (${item.code})`);
  res.status(201).json({ success: true, rawMaterial: item });
});

apiRouter.get('/stock-ledger', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, movements: db.stockLedger });
});

apiRouter.post('/stock-ledger/adjust', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const { rawMaterialId, quantityDelta, reason, notes } = req.body;

  const mat = db.rawMaterials.find(m => m.id === rawMaterialId);
  if (!mat) return res.status(404).json({ success: false, message: 'Raw material not found' });

  const delta = Number(quantityDelta);
  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ success: false, message: 'Invalid quantity adjustment delta' });
  }

  // Prevent negative inventory
  if (mat.currentStock + delta < 0) {
    return res.status(400).json({ success: false, message: `Cannot adjust: Stock would drop below zero (Current: ${mat.currentStock})` });
  }

  const prev = mat.currentStock;
  mat.currentStock += delta;
  mat.updatedAt = new Date().toISOString();

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString(),
    rawMaterialId: mat.id,
    rawMaterialName: mat.name,
    movementType: delta > 0 ? 'PHYSICAL_COUNT_ADJUSTMENT' : 'DAMAGED_WRITE_OFF',
    quantityDelta: delta,
    unit: mat.unitOfMeasure,
    previousBalance: prev,
    newBalance: mat.currentStock,
    referenceDocNumber: `ADJ-${Date.now().toString().slice(-6)}`,
    performedBy: `${actor.fullName} (${actor.role})`,
    notes: `${reason || 'Stock audit adjustment'}: ${notes || ''}`,
  };

  db.stockLedger.unshift(movement);
  dbManager.persist();
  dbManager.recordAudit(actor, 'UPDATE', 'INVENTORY_STOCK', mat.id, `Stock adjustment of ${delta} ${mat.unitOfMeasure} for ${mat.name}. Balance: ${mat.currentStock}`);
  res.json({ success: true, movement, rawMaterial: mat });
});

// ---------------------------------------------------------------------------
// 5. SUPPLIERS & PROCUREMENT
// ---------------------------------------------------------------------------
apiRouter.get('/suppliers', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, suppliers: db.suppliers });
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: Supplier = {
    id: `sup-${Date.now()}`,
    code: req.body.code || `SUP-${Date.now().toString().slice(-4)}`,
    name: req.body.name,
    contactPerson: req.body.contactPerson || '',
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || 'Abuja, Nigeria',
    supplyCategories: req.body.supplyCategories || ['FLOUR'],
    paymentTerms: req.body.paymentTerms || 'NET_14',
    creditLimit: Number(req.body.creditLimit) || 0,
    outstandingPayable: Number(req.body.outstandingPayable) || 0,
    rating: Number(req.body.rating) || 5,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.suppliers.push(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'SUPPLIER', item.id, `Registered supplier ${item.name}`);
  res.status(201).json({ success: true, supplier: item });
});

apiRouter.get('/procurement/orders', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, orders: db.purchaseOrders });
});

apiRouter.post('/procurement/orders', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const totalAmount = (req.body.items || []).reduce((sum: number, it: any) => sum + (Number(it.totalPrice) || 0), 0);
  const settings = db.settings;

  const po: PurchaseOrder = {
    id: `po-${Date.now()}`,
    poNumber: nextDocNumber('PO', db.purchaseOrders.map(d => d.poNumber)),
    supplierId: req.body.supplierId,
    supplierName: req.body.supplierName,
    orderDate: req.body.orderDate || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: req.body.expectedDeliveryDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    items: req.body.items || [],
    subtotal: totalAmount,
    vatAmount: 0,
    totalAmount,
    status: totalAmount > settings.poApprovalThresholdAmount ? 'SUBMITTED' : 'APPROVED',
    approvalRequired: totalAmount > settings.poApprovalThresholdAmount,
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };

  if (po.status === 'APPROVED') {
    po.approvedBy = `${actor.fullName} (${actor.role})`;
    po.approvedAt = new Date().toISOString();
  }

  db.purchaseOrders.unshift(po);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'PURCHASE_ORDER', po.id, `Created Purchase Order ${po.poNumber} for ₦${totalAmount.toLocaleString()} to ${po.supplierName}`);
  res.status(201).json({ success: true, order: po });
});

apiRouter.put('/procurement/orders/:id/approve', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const po = db.purchaseOrders.find(p => p.id === req.params.id);
  if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });

  po.status = 'APPROVED';
  po.approvedBy = `${actor.fullName} (${actor.role})`;
  po.approvedAt = new Date().toISOString();
  dbManager.persist();
  dbManager.recordAudit(actor, 'APPROVE', 'PURCHASE_ORDER', po.id, `Approved Purchase Order ${po.poNumber}`);
  res.json({ success: true, order: po });
});

// Post Goods Receipt Note (GRN) - 3-Way Match & Automatic Stock Ledger Posting
apiRouter.post('/procurement/grn', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const { poId, supplierInvoiceRef, items, remarks } = req.body;

  const po = db.purchaseOrders.find(p => p.id === poId);
  if (!po) return res.status(404).json({ success: false, message: 'Associated Purchase Order not found' });

  const grn: GoodsReceiptNote = {
    id: `grn-${Date.now()}`,
    grnNumber: nextDocNumber('GRN', db.goodsReceiptNotes.map(d => d.grnNumber)),
    poId: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId,
    supplierName: po.supplierName,
    supplierInvoiceRef: supplierInvoiceRef || 'N/A',
    receivedDate: new Date().toISOString().slice(0, 10),
    receivedBy: `${actor.fullName} (${actor.role})`,
    items: items || [],
    isReconciledWithInvoice: Boolean(supplierInvoiceRef),
    remarks: remarks || '',
    createdAt: new Date().toISOString(),
  };

  // Update Raw Material inventory & Stock Ledger atomically
  for (const item of grn.items) {
    const rawMat = db.rawMaterials.find(rm => rm.id === item.rawMaterialId);
    if (rawMat) {
      const prev = rawMat.currentStock;
      rawMat.currentStock += item.quantityReceived;
      rawMat.lastRestockedDate = grn.receivedDate;
      if (item.supplierLotNumber) rawMat.supplierLotNumber = item.supplierLotNumber;
      if (item.expiryDate) rawMat.expiryDate = item.expiryDate;
      rawMat.updatedAt = new Date().toISOString();

      const ledgerEntry: StockMovement = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        rawMaterialId: rawMat.id,
        rawMaterialName: rawMat.name,
        movementType: 'PURCHASE_RECEIPT',
        quantityDelta: item.quantityReceived,
        unit: item.unit,
        previousBalance: prev,
        newBalance: rawMat.currentStock,
        referenceDocNumber: grn.grnNumber,
        performedBy: grn.receivedBy,
        notes: `Received against PO ${po.poNumber}. Supplier Inv: ${grn.supplierInvoiceRef}`,
      };
      db.stockLedger.unshift(ledgerEntry);
    }
  }

  // Received goods (at PO prices, incl. VAT) become a payable to the supplier
  const supplier = db.suppliers.find(s => s.id === po.supplierId);
  if (supplier) {
    const receivedValue = grn.items.reduce((acc, item) => {
      const poItem = po.items.find(i => i.rawMaterialId === item.rawMaterialId);
      return acc + (Number(item.quantityReceived) || 0) * (poItem?.unitPrice || 0);
    }, 0);
    const vatRate = po.subtotal > 0 ? po.vatAmount / po.subtotal : 0;
    supplier.outstandingPayable += Math.round(receivedValue * (1 + vatRate));
  }

  // Update PO received status
  po.status = 'RECEIVED';
  db.goodsReceiptNotes.unshift(grn);
  dbManager.persist();

  dbManager.recordAudit(actor, 'CREATE', 'GOODS_RECEIPT_NOTE', grn.id, `Posted GRN ${grn.grnNumber} for PO ${po.poNumber} from ${po.supplierName}`);
  res.status(201).json({ success: true, grn, purchaseOrder: po });
});

// ---------------------------------------------------------------------------
// 6. RECIPES & PRODUCTION
// ---------------------------------------------------------------------------
apiRouter.get('/recipes', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, recipes: db.recipes });
});

apiRouter.post('/recipes', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: Recipe = {
    id: `rcp-${Date.now()}`,
    recipeCode: req.body.recipeCode || `RCP-${Date.now().toString().slice(-4)}`,
    productId: req.body.productId,
    productName: req.body.productName,
    version: 1,
    batchBaseFlourKg: Number(req.body.batchBaseFlourKg) || 50,
    expectedTheoreticalYieldLoaves: Number(req.body.expectedTheoreticalYieldLoaves) || 100,
    standardBakingTimeMins: Number(req.body.standardBakingTimeMins) || 38,
    standardOvenTempCelsius: Number(req.body.standardOvenTempCelsius) || 215,
    ingredients: req.body.ingredients || [],
    preparationInstructions: req.body.preparationInstructions || [],
    isApproved: true,
    approvedBy: `${actor.fullName} (${actor.role})`,
    updatedAt: new Date().toISOString(),
  };

  db.recipes.push(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'RECIPE', item.id, `Created standard baking recipe ${item.recipeCode} for ${item.productName}`);
  res.status(201).json({ success: true, recipe: item });
});

apiRouter.get('/production/orders', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, orders: db.productionOrders });
});

apiRouter.post('/production/orders', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const recipe = db.recipes.find(r => r.id === req.body.recipeId);
  const product = db.products.find(p => p.id === (req.body.productId || recipe?.productId));

  if (!recipe || !product) {
    return res.status(400).json({ success: false, message: 'Select a valid recipe and product for this batch.' });
  }
  const targetLoaves = Number(req.body.targetLoaves);
  if (!targetLoaves || targetLoaves <= 0) {
    return res.status(400).json({ success: false, message: 'Target loaves must be greater than zero.' });
  }

  // Ingredients can only be issued from stock that has actually been received
  const issued: { rawMaterialId: string; actualQty: number; unit: string }[] = req.body.ingredientsIssued || [];
  const shortages = issued
    .map(ing => ({ ing, rm: db.rawMaterials.find(m => m.id === ing.rawMaterialId) }))
    .filter(({ ing, rm }) => rm && ing.actualQty > rm.currentStock)
    .map(({ ing, rm }) => `${rm!.name}: need ${ing.actualQty} ${ing.unit}, have ${rm!.currentStock}`);
  if (shortages.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Insufficient raw material stock — receive goods (GRN) or post a stock count first. ${shortages.join('; ')}`,
    });
  }
  const shiftCode = req.body.shift === 'NIGHT_BAKE' ? 'S2' : 'S1';
  const dateNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const batchNum = `NXT-${dateNum}-${shiftCode}-${String(db.productionOrders.length + 1).padStart(3, '0')}`;

  const prodOrder: ProductionOrder = {
    id: `po-batch-${Date.now()}`,
    batchNumber: batchNum,
    recipeId: recipe.id,
    productId: product.id,
    productName: product.name,
    scheduledDate: req.body.scheduledDate || new Date().toISOString().slice(0, 10),
    shift: req.body.shift || 'MORNING_BAKE',
    targetLoaves,
    actualGoodLoaves: 0,
    rejectedLoaves: 0,
    doughScrapKg: 0,
    yieldEfficiencyPercent: 0,
    ingredientsIssued: req.body.ingredientsIssued || [],
    downtimeMinutes: 0,
    leadBaker: req.body.leadBaker || '',
    supervisor: `${actor.fullName} (${actor.role})`,
    status: 'IN_PROGRESS',
    qcStatus: 'PENDING',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };

  // Deduct issued raw materials from stock ledger
  for (const ing of prodOrder.ingredientsIssued) {
    const rm = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
    if (rm && ing.actualQty > 0) {
      const prev = rm.currentStock;
      rm.currentStock = Math.max(0, rm.currentStock - ing.actualQty);
      rm.updatedAt = new Date().toISOString();

      db.stockLedger.unshift({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        rawMaterialId: rm.id,
        rawMaterialName: rm.name,
        movementType: 'ISSUE_TO_PRODUCTION',
        quantityDelta: -ing.actualQty,
        unit: ing.unit,
        previousBalance: prev,
        newBalance: rm.currentStock,
        referenceDocNumber: prodOrder.batchNumber,
        performedBy: prodOrder.supervisor,
        notes: `Material consumption for batch ${prodOrder.batchNumber}`,
      });
    }
  }

  db.productionOrders.unshift(prodOrder);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'PRODUCTION_BATCH', prodOrder.id, `Launched production batch ${prodOrder.batchNumber} (${targetLoaves} loaves planned)`);
  res.status(201).json({ success: true, order: prodOrder });
});

apiRouter.put('/production/orders/:id/complete', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const order = db.productionOrders.find(p => p.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Production order not found' });

  const good = Number(req.body.actualGoodLoaves) || 0;
  const rejected = Number(req.body.rejectedLoaves) || 0;
  const scrap = Number(req.body.doughScrapKg) || 0;
  const downtime = Number(req.body.downtimeMinutes) || 0;

  order.actualGoodLoaves = good;
  order.rejectedLoaves = rejected;
  order.doughScrapKg = scrap;
  order.downtimeMinutes = downtime;
  if (req.body.downtimeReason) order.downtimeReason = req.body.downtimeReason;
  order.yieldEfficiencyPercent = order.targetLoaves > 0 ? Math.round((good / order.targetLoaves) * 100 * 10) / 10 : 100;
  order.status = 'AWAITING_QC';
  order.qcStatus = 'PENDING';
  order.bakingEndTime = new Date().toISOString();

  dbManager.persist();
  dbManager.recordAudit(actor, 'UPDATE', 'PRODUCTION_BATCH', order.id, `Completed baking for batch ${order.batchNumber}. Good output: ${good} loaves, Rejects: ${rejected}`);
  res.json({ success: true, order });
});

// ---------------------------------------------------------------------------
// 7. QUALITY CONTROL & FINISHED GOODS
// ---------------------------------------------------------------------------
apiRouter.get('/quality-control', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, records: db.qualityControlRecords });
});

apiRouter.post('/quality-control', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const { batchId, sampleLoavesTested, targetWeightGrams, actualAverageWeightGrams, crumbTextureRating, crustColorRating, aromaTasteRating, moisturePassed, packagingSealingPassed, overallDecision, rejectionReason } = req.body;

  const batch = db.productionOrders.find(b => b.id === batchId);
  if (!batch) return res.status(404).json({ success: false, message: 'Production batch not found' });

  const weightVariance = targetWeightGrams > 0
    ? Math.round((Math.abs(actualAverageWeightGrams - targetWeightGrams) / targetWeightGrams) * 100 * 10) / 10
    : 0;

  const qcRecord: QualityControlRecord = {
    id: `qc-${Date.now()}`,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    productName: batch.productName,
    inspectionDate: new Date().toISOString(),
    inspectorName: `${actor.fullName} (${actor.role})`,
    sampleLoavesTested: Number(sampleLoavesTested) || 10,
    targetWeightGrams: Number(targetWeightGrams) || 800,
    actualAverageWeightGrams: Number(actualAverageWeightGrams) || 800,
    weightVariancePercentage: weightVariance,
    isWeightCompliant: weightVariance <= 3.0,
    crumbTextureRating: Number(crumbTextureRating) as any || 5,
    crustColorRating: Number(crustColorRating) as any || 5,
    aromaTasteRating: Number(aromaTasteRating) as any || 5,
    moisturePassed: Boolean(moisturePassed),
    packagingSealingPassed: Boolean(packagingSealingPassed),
    overallDecision: overallDecision || 'RELEASED',
    rejectionReason: rejectionReason || undefined,
    releasedAt: overallDecision === 'RELEASED' ? new Date().toISOString() : undefined,
    traceabilityChain: {
      flourLot: 'GP-202610-098',
      yeastLot: 'SAF-NG-770',
      bakingShift: batch.shift,
      ovenNumber: 'Rotary Deck Ovens 1 & 2',
    },
  };

  batch.qcStatus = overallDecision;
  if (overallDecision === 'RELEASED') {
    batch.status = 'COMPLETED';

    // Deposit good loaves into Finished Goods inventory!
    const product = db.products.find(p => p.id === batch.productId);
    const shelfLife = product?.shelfLifeDays || 5;
    const expiry = new Date(Date.now() + shelfLife * 86400000).toISOString().slice(0, 10);

    const fgItem: FinishedGoodsItem = {
      id: `fg-${Date.now()}`,
      productId: batch.productId,
      productName: batch.productName,
      batchNumber: batch.batchNumber,
      productionDate: new Date().toISOString().slice(0, 10),
      expiryDate: expiry,
      quantityProduced: batch.actualGoodLoaves,
      quantityAvailableForDispatch: batch.actualGoodLoaves,
      quantityReserved: 0,
      quantityDispatched: 0,
      quantityReturned: 0,
      warehouseLocation: 'Dispatch Hall - Rack A (FEFO priority)',
      unitRetailPrice: product?.standardRetailPrice || 1200,
      status: 'AVAILABLE',
    };
    db.finishedGoods.unshift(fgItem);

    if (product) {
      product.currentStockLoaves += batch.actualGoodLoaves;
    }
  }

  db.qualityControlRecords.unshift(qcRecord);
  dbManager.persist();
  dbManager.recordAudit(actor, overallDecision === 'RELEASED' ? 'QC_RELEASE' : 'QC_REJECT', 'QUALITY_CHECK', qcRecord.id, `QC decision: ${overallDecision} for batch ${batch.batchNumber} (${batch.actualGoodLoaves} loaves)`);
  res.status(201).json({ success: true, record: qcRecord, batch });
});

apiRouter.get('/finished-goods', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, items: db.finishedGoods });
});

// ---------------------------------------------------------------------------
// 8. MARKETERS, CUSTOMERS & SALES
// ---------------------------------------------------------------------------
apiRouter.get('/marketers', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, marketers: db.marketers });
});

apiRouter.post('/marketers', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: Marketer = {
    id: `mkt-${Date.now()}`,
    marketerCode: req.body.marketerCode || `MKT-${Date.now().toString().slice(-4)}`,
    fullName: req.body.fullName,
    phone: req.body.phone || '',
    email: req.body.email || '',
    assignedTerritory: req.body.assignedTerritory || 'Kubwa Territory',
    commissionType: req.body.commissionType || 'PERCENTAGE',
    commissionRate: Number(req.body.commissionRate) || 0,
    monthlySalesTargetLoaves: Number(req.body.monthlySalesTargetLoaves) || 0,
    dailyAllocationLimitLoaves: Number(req.body.dailyAllocationLimitLoaves) || 0,
    currentOwedBalance: 0,
    ytdTotalSales: 0,
    status: 'ACTIVE',
    assignedVehiclePlate: req.body.assignedVehiclePlate || 'N/A',
    joinedDate: new Date().toISOString().slice(0, 10),
  };

  db.marketers.push(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'MARKETER', item.id, `Registered marketer ${item.fullName} for territory ${item.assignedTerritory}`);
  res.status(201).json({ success: true, marketer: item });
});

apiRouter.get('/customers', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, customers: db.customers });
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: Customer = {
    id: `cust-${Date.now()}`,
    customerCode: req.body.customerCode || `CST-${Date.now().toString().slice(-4)}`,
    name: req.body.name,
    businessName: req.body.businessName || req.body.name,
    customerType: req.body.customerType || 'SUPERMARKET',
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || 'Kubwa, Abuja',
    territory: req.body.territory || 'Kubwa Central',
    assignedMarketerId: req.body.assignedMarketerId,
    assignedMarketerName: req.body.assignedMarketerName,
    priceTier: req.body.priceTier || 'WHOLESALE',
    creditLimit: Number(req.body.creditLimit) || 0,
    creditDays: Number(req.body.creditDays) || 7,
    currentOutstandingBalance: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.customers.push(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'CUSTOMER', item.id, `Registered customer ${item.businessName} (Credit Limit: ₦${item.creditLimit.toLocaleString()})`);
  res.status(201).json({ success: true, customer: item });
});

apiRouter.get('/sales/invoices', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, invoices: db.salesInvoices });
});

apiRouter.post('/sales/invoices', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const { customerId, marketerId, items, paymentType, discountAmount } = req.body;

  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const subtotal = (items || []).reduce((acc: number, it: any) => acc + (Number(it.unitPrice) * Number(it.quantity) || 0), 0);
  const discount = Number(discountAmount) || 0;
  const netAmount = Math.max(0, subtotal - discount);

  // Credit limit enforcement
  if (paymentType === 'CREDIT' && db.settings.creditLimitStrictEnforcement) {
    if (customer.currentOutstandingBalance + netAmount > customer.creditLimit) {
      return res.status(400).json({
        success: false,
        message: `Order exceeds credit limit! Current balance: ₦${customer.currentOutstandingBalance.toLocaleString()}, New order: ₦${netAmount.toLocaleString()}, Limit: ₦${customer.creditLimit.toLocaleString()}`,
      });
    }
  }

  const invoice: SalesInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: nextDocNumber('INV', db.salesInvoices.map(d => d.invoiceNumber)),
    customerId: customer.id,
    customerName: customer.businessName,
    marketerId,
    marketerName: db.marketers.find(m => m.id === marketerId)?.fullName,
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + (customer.creditDays || 7) * 86400000).toISOString().slice(0, 10),
    items: items || [],
    subtotal,
    discountAmount: discount,
    netPayableAmount: netAmount,
    amountPaid: paymentType === 'CASH' ? netAmount : 0,
    amountDue: paymentType === 'CASH' ? 0 : netAmount,
    paymentType: paymentType || 'CREDIT',
    status: paymentType === 'CASH' ? 'PAID' : 'POSTED',
    postedBy: `${actor.fullName} (${actor.role})`,
    createdAt: new Date().toISOString(),
  };

  // Update customer balance if credit sale
  if (paymentType === 'CREDIT') {
    customer.currentOutstandingBalance += netAmount;
  }

  db.salesInvoices.unshift(invoice);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'SALES_INVOICE', invoice.id, `Created sales invoice ${invoice.invoiceNumber} for ₦${netAmount.toLocaleString()} to ${customer.businessName}`);
  res.status(201).json({ success: true, invoice, customer });
});

// ---------------------------------------------------------------------------
// 9. DISPATCHES & RETURNS
// ---------------------------------------------------------------------------
apiRouter.get('/dispatches', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, dispatches: db.dispatchSheets });
});

apiRouter.post('/dispatches', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const items = req.body.items || [];
  const totalLoaded = items.reduce((acc: number, it: any) => acc + (Number(it.quantityLoaded) || 0), 0);

  const dsp: DispatchSheet = {
    id: `dsp-${Date.now()}`,
    dispatchNumber: nextDocNumber('DSP', db.dispatchSheets.map(d => d.dispatchNumber)),
    date: new Date().toISOString().slice(0, 10),
    driverName: req.body.driverName || '',
    driverPhone: req.body.driverPhone || '',
    vehicleNumberPlate: req.body.vehicleNumberPlate || '',
    marketerId: req.body.marketerId,
    marketerName: req.body.marketerName,
    destinationRoute: req.body.destinationRoute || 'Kubwa Route',
    items,
    totalLoavesLoaded: totalLoaded,
    totalLoavesDelivered: 0,
    totalLoavesReturned: 0,
    totalValueDelivered: 0,
    cashCollectedOnRoute: 0,
    bankTransferOnRoute: 0,
    status: 'IN_TRANSIT',
    dispatchedBy: `${actor.fullName} (${actor.role})`,
    createdAt: new Date().toISOString(),
  };

  // Deduct dispatched loaves from available finished goods
  for (const it of items) {
    const fg = db.finishedGoods.find(f => f.productId === it.productId && f.quantityAvailableForDispatch >= it.quantityLoaded);
    if (fg) {
      fg.quantityAvailableForDispatch -= it.quantityLoaded;
      fg.quantityDispatched += it.quantityLoaded;
    }
  }

  db.dispatchSheets.unshift(dsp);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'DISPATCH_SHEET', dsp.id, `Created dispatch loading sheet ${dsp.dispatchNumber} (${totalLoaded} loaves) for ${dsp.destinationRoute}`);
  res.status(201).json({ success: true, dispatch: dsp });
});

apiRouter.put('/dispatches/:id/reconcile', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const dsp = db.dispatchSheets.find(d => d.id === req.params.id);
  if (!dsp) return res.status(404).json({ success: false, message: 'Dispatch not found' });

  dsp.totalLoavesDelivered = Number(req.body.totalLoavesDelivered) || 0;
  dsp.totalLoavesReturned = Number(req.body.totalLoavesReturned) || 0;
  dsp.cashCollectedOnRoute = Number(req.body.cashCollectedOnRoute) || 0;
  dsp.bankTransferOnRoute = Number(req.body.bankTransferOnRoute) || 0;
  dsp.totalValueDelivered = dsp.cashCollectedOnRoute + dsp.bankTransferOnRoute;
  dsp.status = 'RECONCILED';
  dsp.reconciledBy = `${actor.fullName} (${actor.role})`;
  dsp.reconciledAt = new Date().toISOString();
  dsp.reconciliationNotes = req.body.reconciliationNotes || '';

  dbManager.persist();
  dbManager.recordAudit(actor, 'RECONCILE', 'DISPATCH_SHEET', dsp.id, `Reconciled dispatch ${dsp.dispatchNumber}. Delivered: ${dsp.totalLoavesDelivered}, Returns: ${dsp.totalLoavesReturned}`);
  res.json({ success: true, dispatch: dsp });
});

apiRouter.get('/returns', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, returns: db.returnRecords });
});

apiRouter.post('/returns', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const items = req.body.items || [];
  const totalQty = items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0);

  const ret: BreadReturnRecord = {
    id: `ret-${Date.now()}`,
    returnNumber: nextDocNumber('RET', db.returnRecords.map(d => d.returnNumber)),
    date: new Date().toISOString().slice(0, 10),
    dispatchId: req.body.dispatchId,
    dispatchNumber: req.body.dispatchNumber,
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    marketerId: req.body.marketerId,
    marketerName: req.body.marketerName,
    items,
    totalLoavesReturned: totalQty,
    dispositionAction: req.body.dispositionAction || 'SELL_AS_ANIMAL_FEED',
    salvageRecoveryAmount: Number(req.body.salvageRecoveryAmount) || 0,
    creditNoteIssuedToCustomer: Boolean(req.body.creditNoteIssuedToCustomer),
    creditNoteAmount: Number(req.body.creditNoteAmount) || 0,
    approvedBy: `${actor.fullName} (${actor.role})`,
    inspectionNotes: req.body.inspectionNotes || '',
    status: 'DISPOSITIONED_AND_CLOSED',
    createdAt: new Date().toISOString(),
  };

  // If credit note was issued, deduct from customer outstanding balance
  if (ret.creditNoteIssuedToCustomer && ret.creditNoteAmount > 0 && ret.customerId) {
    const cust = db.customers.find(c => c.id === ret.customerId);
    if (cust) {
      cust.currentOutstandingBalance = Math.max(0, cust.currentOutstandingBalance - ret.creditNoteAmount);
    }
  }

  db.returnRecords.unshift(ret);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'BREAD_RETURN', ret.id, `Logged bread return ${ret.returnNumber} (${totalQty} loaves). Disposition: ${ret.dispositionAction}`);
  res.status(201).json({ success: true, returnRecord: ret });
});

// ---------------------------------------------------------------------------
// 10. CASHIER SESSIONS, PAYMENTS & EXPENSES
// ---------------------------------------------------------------------------
apiRouter.get('/cashier/sessions', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, sessions: db.cashierSessions });
});

apiRouter.post('/cashier/sessions/open', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const openingFloat = Number(req.body.openingFloat) || 0;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const session: CashierSession = {
    id: `csh-${Date.now()}`,
    sessionCode: `CSH-${dateStr}-S${db.cashierSessions.length + 1}`,
    cashierId: actor.id,
    cashierName: actor.fullName,
    shift: req.body.shift || 'MORNING',
    openedAt: new Date().toISOString(),
    openingFloat,
    totalCashSales: 0,
    totalBankTransfers: 0,
    totalCreditCollections: 0,
    totalExpensesPaidOut: 0,
    expectedPhysicalCash: openingFloat,
    status: 'OPEN',
  };

  db.cashierSessions.unshift(session);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'CASHIER_SESSION', session.id, `Opened cashier session ${session.sessionCode} with opening float ₦${openingFloat.toLocaleString()}`);
  res.status(201).json({ success: true, session });
});

apiRouter.put('/cashier/sessions/:id/close', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const session = db.cashierSessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Cashier session not found' });

  const actualCount = Number(req.body.actualPhysicalCashCounted) || 0;
  session.actualPhysicalCashCounted = actualCount;
  session.cashVariance = actualCount - session.expectedPhysicalCash;
  session.closedAt = new Date().toISOString();
  session.status = 'SUPERVISOR_VERIFIED';
  session.supervisorName = `${actor.fullName} (${actor.role})`;
  session.supervisorNotes = req.body.supervisorNotes || '';

  dbManager.persist();
  dbManager.recordAudit(actor, 'RECONCILE', 'CASHIER_SESSION', session.id, `Closed session ${session.sessionCode}. Count: ₦${actualCount.toLocaleString()}, Variance: ₦${session.cashVariance.toLocaleString()}`);
  res.json({ success: true, session });
});

apiRouter.get('/payments', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, payments: db.payments });
});

// Record customer payment receipt with idempotency key
apiRouter.post('/payments', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const { customerId, invoiceId, amountPaid, paymentMethod, bankReferenceNumber, idempotencyKey } = req.body;

  // Idempotency check to prevent duplicate payment postings
  if (idempotencyKey) {
    const existing = db.payments.find(p => p.idempotencyKey === idempotencyKey);
    if (existing) {
      return res.status(200).json({ success: true, payment: existing, duplicateDetected: true });
    }
  }

  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const amount = Number(amountPaid) || 0;
  if (amount <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });

  const payment: PaymentReceipt = {
    id: `pay-${Date.now()}`,
    receiptNumber: nextDocNumber('RCT', db.payments.map(d => d.receiptNumber)),
    invoiceId,
    customerId: customer.id,
    customerName: customer.businessName,
    paymentDate: new Date().toISOString().slice(0, 10),
    amountPaid: amount,
    paymentMethod: paymentMethod || 'POS_MONIEPOINT',
    bankReferenceNumber: bankReferenceNumber || undefined,
    recordedBy: `${actor.fullName} (${actor.role})`,
    idempotencyKey: idempotencyKey || `IDEMP-${Date.now()}`,
    isReversed: false,
    createdAt: new Date().toISOString(),
  };

  // Reduce customer balance
  customer.currentOutstandingBalance = Math.max(0, customer.currentOutstandingBalance - amount);

  // If tied to an invoice, reduce invoice amount due
  if (invoiceId) {
    const inv = db.salesInvoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.amountPaid += amount;
      inv.amountDue = Math.max(0, inv.netPayableAmount - inv.amountPaid);
      if (inv.amountDue === 0) inv.status = 'PAID';
      else inv.status = 'PARTIALLY_PAID';
    }
  }

  // Update active cashier session if cash/POS
  const activeSession = db.cashierSessions.find(s => s.status === 'OPEN');
  if (activeSession) {
    if (payment.paymentMethod === 'CASH') {
      activeSession.totalCashSales += amount;
      activeSession.expectedPhysicalCash += amount;
    } else {
      activeSession.totalBankTransfers += amount;
    }
  }

  db.payments.unshift(payment);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'PAYMENT_RECEIPT', payment.id, `Recorded receipt ${payment.receiptNumber} for ₦${amount.toLocaleString()} from ${customer.businessName}`);
  res.status(201).json({ success: true, payment, customer });
});

apiRouter.get('/expenses', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, expenses: db.operatingExpenses });
});

apiRouter.post('/expenses', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: OperatingExpense = {
    id: `exp-${Date.now()}`,
    voucherNumber: nextDocNumber('EXP', db.operatingExpenses.map(d => d.voucherNumber)),
    expenseDate: req.body.expenseDate || new Date().toISOString().slice(0, 10),
    category: req.body.category || 'OTHER',
    description: req.body.description,
    amount: Number(req.body.amount) || 0,
    beneficiaryName: req.body.beneficiaryName || '',
    paymentMethod: req.body.paymentMethod || 'COMPANY_BANK_TRANSFER',
    approvedBy: `${actor.fullName} (${actor.role})`,
    receiptAttachmentRef: req.body.receiptAttachmentRef || '',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  };

  db.operatingExpenses.unshift(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'OPERATING_EXPENSE', item.id, `Created expense voucher ${item.voucherNumber} for ₦${item.amount.toLocaleString()} (${item.description})`);
  res.status(201).json({ success: true, expense: item });
});

// ---------------------------------------------------------------------------
// 11. FINANCE & JOURNAL ENTRIES
// ---------------------------------------------------------------------------
apiRouter.get('/journal', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, entries: db.journalEntries });
});

apiRouter.post('/journal', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const lines = req.body.lines || [];

  const totalDebit = lines.reduce((acc: number, l: any) => acc + (Number(l.debitAmount) || 0), 0);
  const totalCredit = lines.reduce((acc: number, l: any) => acc + (Number(l.creditAmount) || 0), 0);

  // Validate double-entry balance
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({
      success: false,
      message: `Journal entry is out of balance! Debits: ₦${totalDebit.toLocaleString()}, Credits: ₦${totalCredit.toLocaleString()}`,
    });
  }

  const entry: JournalEntry = {
    id: `jrn-${Date.now()}`,
    entryNumber: nextDocNumber('JRN', db.journalEntries.map(d => d.entryNumber)),
    date: req.body.date || new Date().toISOString().slice(0, 10),
    narration: req.body.narration || 'General ledger posting',
    sourceModule: req.body.sourceModule || 'MANUAL',
    lines,
    totalDebit,
    totalCredit,
    postedBy: `${actor.fullName} (${actor.role})`,
    createdAt: new Date().toISOString(),
  };

  db.journalEntries.unshift(entry);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'JOURNAL_ENTRY', entry.id, `Posted journal entry ${entry.entryNumber} for ₦${totalDebit.toLocaleString()}`);
  res.status(201).json({ success: true, entry });
});

// Unit product costing
apiRouter.get('/finance/costing', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const costing = db.products.map(p => {
    const rawCost = p.estimatedCostPrice * 0.75;
    const energyCost = p.estimatedCostPrice * 0.15;
    const packagingCost = 26; // ₦26 per nylon
    const labourCost = p.estimatedCostPrice * 0.10;
    const totalUnitCost = rawCost + energyCost + packagingCost + labourCost;
    const wholesaleMargin = p.wholesalePrice - totalUnitCost;
    const wholesaleMarginPercent = Math.round((wholesaleMargin / p.wholesalePrice) * 100 * 10) / 10;

    return {
      productId: p.id,
      productName: p.name,
      sizeGrams: p.sizeGrams,
      retailPrice: p.standardRetailPrice,
      wholesalePrice: p.wholesalePrice,
      distributorPrice: p.distributorPrice,
      rawMaterialCost: Math.round(rawCost),
      energyCost: Math.round(energyCost),
      packagingCost,
      labourCost: Math.round(labourCost),
      totalUnitCost: Math.round(totalUnitCost),
      grossProfitPerLoaf: Math.round(wholesaleMargin),
      marginPercentage: wholesaleMarginPercent,
    };
  });

  res.json({ success: true, costing });
});

// ---------------------------------------------------------------------------
// 12. EMPLOYEES & ATTENDANCE
// ---------------------------------------------------------------------------
apiRouter.get('/employees', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, employees: db.employees });
});

apiRouter.post('/employees', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const item: Employee = {
    id: `emp-${Date.now()}`,
    staffCode: req.body.staffCode || nextStaffCode(db.employees.map(e => e.staffCode)),
    fullName: req.body.fullName,
    phone: req.body.phone || '',
    email: req.body.email || '',
    department: req.body.department || 'BAKING',
    designation: req.body.designation || 'Bakery Worker',
    shiftPattern: req.body.shiftPattern || 'ROTATING',
    dateEmployed: req.body.dateEmployed || new Date().toISOString().slice(0, 10),
    basicSalaryNaira: Number(req.body.basicSalaryNaira) || 0,
    emergencyContact: req.body.emergencyContact || '',
    isActive: true,
  };

  db.employees.push(item);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'EMPLOYEE', item.id, `Added employee ${item.fullName} (${item.designation})`);
  res.status(201).json({ success: true, employee: item });
});

apiRouter.get('/attendance', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, attendance: db.attendanceRecords });
});

apiRouter.post('/attendance', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const emp = db.employees.find(e => e.id === req.body.employeeId);
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const att: AttendanceRecord = {
    id: `att-${Date.now()}`,
    employeeId: emp.id,
    employeeName: emp.fullName,
    department: emp.department,
    date: new Date().toISOString().slice(0, 10),
    shift: req.body.shift || 'Morning Bake Shift',
    timeIn: req.body.timeIn || new Date().toTimeString().slice(0, 5),
    status: req.body.status || 'PRESENT',
    notes: req.body.notes || '',
  };

  db.attendanceRecords.unshift(att);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'ATTENDANCE', att.id, `Marked attendance for ${emp.fullName}: ${att.status}`);
  res.status(201).json({ success: true, attendance: att });
});

// ---------------------------------------------------------------------------
// 13. AUDIT LOGS, NOTIFICATIONS, SETTINGS & BACKUP
// ---------------------------------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, auditLogs: db.auditLogs });
});

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, notifications: db.notifications });
});

apiRouter.post('/notifications/mark-read', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  for (const n of db.notifications) {
    n.isRead = true;
  }
  dbManager.persist();
  res.json({ success: true, message: 'All notifications marked as read' });
});

apiRouter.get('/settings', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.json({ success: true, settings: db.settings });
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const before = { ...db.settings };
  db.settings = { ...db.settings, ...req.body };
  dbManager.persist();
  dbManager.recordAudit(actor, 'UPDATE', 'SETTINGS', 'global-settings', 'Updated bakery corporate & operational settings', before, db.settings);
  res.json({ success: true, settings: db.settings });
});

// Backup & Reset endpoints
apiRouter.get('/system/backup', (req: Request, res: Response) => {
  const db = dbManager.getRaw();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=nextar_erp_backup_${new Date().toISOString().slice(0, 10)}.json`);
  res.send(JSON.stringify({ ...db, sessions: [] }, null, 2));
});

apiRouter.post('/system/reset-demo', (req: Request, res: Response) => {
  const actor = getCurrentUser();
  const fresh = dbManager.resetToSeed();
  dbManager.recordAudit(actor, 'REVERSE', 'DATABASE', 'full-database', 'Reset database to the Nextar sample data set');
  res.json({ success: true, message: 'Database reset to the Nextar sample data set', database: fresh });
});
