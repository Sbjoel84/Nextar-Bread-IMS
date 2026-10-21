// ============================================================================
// NEXTAR BREAD BAKERY DBMS/ERP - COMPREHENSIVE TYPE DEFINITIONS
// Business: Nextar Bread Bakery (Kubwa, Abuja, FCT, Nigeria)
// Currency: NGN (₦) | Timezone: Africa/Lagos
// ============================================================================

export type UserRole =
  | 'SUPER_ADMIN'
  | 'MANAGING_DIRECTOR'
  | 'GENERAL_MANAGER'
  | 'PRODUCTION_MANAGER'
  | 'PRODUCTION_OFFICER'
  | 'QC_OFFICER'
  | 'STOREKEEPER'
  | 'PROCUREMENT_OFFICER'
  | 'SALES_MANAGER'
  | 'MARKETER'
  | 'DISTRIBUTOR'
  | 'DISPATCH_OFFICER'
  | 'ACCOUNTANT'
  | 'CASHIER'
  | 'AUDITOR';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  branch: string;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  permissions?: string[]; // keys from src/shared/permissions.ts; Super Admin implicitly has all
}

export interface AccessRequest {
  id: string;
  requestNumber: string; // ACR-YYYY-NNNN
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  permissions: string[];
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  decidedById?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
  createdAt: string;
}

// A browser (device) bound to a user. Only a Super Admin can move a device to another user.
export interface DeviceSession {
  id: string;
  userId: string;
  impersonatorId?: string; // Super Admin viewing the system as userId
  createdAt: string;
  lastSeenAt: string;
}

export interface BreadProduct {
  id: string;
  name: string;
  code: string;
  category: 'STANDARD' | 'PREMIUM' | 'SPECIALTY' | 'MINI';
  sizeGrams: number;
  isSliced: boolean;
  packagingType: 'POLY_BAG' | 'PRINTED_NYLON' | 'FOIL_TRAY' | 'PAPER_BAND';
  standardRetailPrice: number; // ₦
  wholesalePrice: number;     // ₦
  distributorPrice: number;   // ₦
  estimatedCostPrice: number; // ₦
  shelfLifeDays: number;
  reorderAlertLevel: number;
  barcode: string;
  status: 'ACTIVE' | 'DISCONTINUED';
  currentStockLoaves: number;
  createdAt: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: 'FLOUR' | 'SUGAR' | 'YEAST' | 'FAT_OIL' | 'SALT' | 'IMPROVER' | 'PRESERVATIVE' | 'PACKAGING' | 'OTHER';
  unitOfMeasure: 'BAG_50KG' | 'BAG_25KG' | 'KG' | 'GRAMS' | 'LITRES' | 'CARTON_15KG' | 'PACK_500G' | 'BUNDLE_1000' | 'PCS';
  currentStock: number;
  minimumStockAlert: number;
  standardCostPerUnit: number; // ₦
  supplierId: string;
  supplierName: string;
  storageLocation: string;
  supplierLotNumber?: string;
  expiryDate?: string;
  lastRestockedDate?: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  rawMaterialId: string;
  rawMaterialName: string;
  movementType:
    | 'PURCHASE_RECEIPT'
    | 'ISSUE_TO_PRODUCTION'
    | 'PRODUCTION_RETURN'
    | 'WAREHOUSE_TRANSFER'
    | 'PHYSICAL_COUNT_ADJUSTMENT'
    | 'DAMAGED_WRITE_OFF';
  quantityDelta: number; // positive = in, negative = out
  unit: string;
  previousBalance: number;
  newBalance: number;
  referenceDocNumber: string; // PO, GRN, BATCH or ADJ number
  performedBy: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string; // e.g. Idu Industrial Area, Abuja
  supplyCategories: string[];
  paymentTerms: 'ADVANCE' | 'CASH_ON_DELIVERY' | 'NET_7' | 'NET_14' | 'NET_30';
  creditLimit: number;
  outstandingPayable: number;
  rating: number; // 1-5
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface PurchaseOrderItem {
  rawMaterialId: string;
  name: string;
  quantityOrdered: number;
  quantityReceived: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-YYYY-XXXX
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // GRN-YYYY-XXXX
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceRef: string;
  receivedDate: string;
  receivedBy: string;
  items: {
    rawMaterialId: string;
    name: string;
    quantityReceived: number;
    unit: string;
    unitCost: number;
    supplierLotNumber: string;
    expiryDate?: string;
    condition: 'EXCELLENT' | 'ACCEPTABLE' | 'DAMAGED_REJECTED';
  }[];
  isReconciledWithInvoice: boolean;
  remarks?: string;
  createdAt: string;
}

export interface RecipeIngredient {
  rawMaterialId: string;
  rawMaterialName: string;
  quantityPerBatch: number;
  unit: string;
}

export interface Recipe {
  id: string;
  recipeCode: string;
  productId: string;
  productName: string;
  version: number;
  batchBaseFlourKg: number; // e.g. 50kg (1 bag)
  expectedTheoreticalYieldLoaves: number; // e.g. 100 loaves
  standardBakingTimeMins: number;
  standardOvenTempCelsius: number;
  ingredients: RecipeIngredient[];
  preparationInstructions: string[];
  isApproved: boolean;
  approvedBy?: string;
  updatedAt: string;
}

export interface ProductionOrder {
  id: string;
  batchNumber: string; // NXT-YYYYMMDD-S1-001
  recipeId: string;
  productId: string;
  productName: string;
  scheduledDate: string;
  shift: 'MORNING_BAKE' | 'AFTERNOON_BAKE' | 'NIGHT_BAKE';
  targetLoaves: number;
  actualGoodLoaves: number;
  rejectedLoaves: number; // burnt, deformed, collapsed
  doughScrapKg: number;
  yieldEfficiencyPercent: number; // (actualGoodLoaves / targetLoaves) * 100
  ingredientsIssued: {
    rawMaterialId: string;
    rawMaterialName: string;
    plannedQty: number;
    actualQty: number;
    unit: string;
  }[];
  mixingStartTime?: string;
  bakingEndTime?: string;
  downtimeMinutes: number;
  downtimeReason?: string;
  leadBaker: string;
  supervisor: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'AWAITING_QC' | 'COMPLETED' | 'CANCELLED';
  qcStatus: 'PENDING' | 'RELEASED' | 'ON_HOLD' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export interface QualityControlRecord {
  id: string;
  batchId: string;
  batchNumber: string;
  productName: string;
  inspectionDate: string;
  inspectorName: string;
  sampleLoavesTested: number;
  targetWeightGrams: number;
  actualAverageWeightGrams: number;
  weightVariancePercentage: number;
  isWeightCompliant: boolean; // within +/- 3%
  crumbTextureRating: 1 | 2 | 3 | 4 | 5; // 5 best
  crustColorRating: 1 | 2 | 3 | 4 | 5;
  aromaTasteRating: 1 | 2 | 3 | 4 | 5;
  moisturePassed: boolean;
  packagingSealingPassed: boolean;
  overallDecision: 'RELEASED' | 'ON_HOLD' | 'REJECTED';
  rejectionReason?: string;
  correctiveAction?: string;
  releasedAt?: string;
  traceabilityChain: {
    flourLot: string;
    yeastLot: string;
    bakingShift: string;
    ovenNumber: string;
  };
}

export interface FinishedGoodsItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  quantityProduced: number;
  quantityAvailableForDispatch: number;
  quantityReserved: number;
  quantityDispatched: number;
  quantityReturned: number;
  warehouseLocation: string;
  unitRetailPrice: number;
  status: 'AVAILABLE' | 'RESERVED' | 'EXHAUSTED' | 'EXPIRED';
}

export interface Marketer {
  id: string;
  marketerCode: string;
  fullName: string;
  phone: string;
  email: string;
  assignedTerritory: string; // e.g. Kubwa Village & Phase 4, Gwarinpa, Bwari
  commissionType: 'PERCENTAGE' | 'FIXED_PER_LOAF';
  commissionRate: number; // e.g. 5% or ₦30 per loaf
  monthlySalesTargetLoaves: number;
  dailyAllocationLimitLoaves: number;
  currentOwedBalance: number; // ₦
  ytdTotalSales: number;     // ₦
  status: 'ACTIVE' | 'SUSPENDED';
  assignedVehiclePlate?: string;
  joinedDate: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  businessName: string;
  customerType: 'SUPERMARKET' | 'DISTRIBUTOR' | 'WHOLESALER' | 'BREAD_DEPOT' | 'RETAIL_KIOSK' | 'INSTITUTION';
  phone: string;
  email: string;
  address: string;
  territory: string;
  assignedMarketerId?: string;
  assignedMarketerName?: string;
  priceTier: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  creditLimit: number; // ₦
  creditDays: number;  // 7, 14, 30
  currentOutstandingBalance: number; // ₦
  status: 'ACTIVE' | 'SUSPENDED' | 'CREDIT_LOCKED';
  notes?: string;
  createdAt: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string; // INV-YYYY-XXXX
  customerId: string;
  customerName: string;
  marketerId?: string;
  marketerName?: string;
  invoiceDate: string;
  dueDate: string;
  items: SalesOrderItem[];
  subtotal: number;
  discountAmount: number;
  netPayableAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentType: 'CASH' | 'BANK_TRANSFER' | 'CREDIT';
  status: 'DRAFT' | 'POSTED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  dispatchRef?: string;
  postedBy: string;
  createdAt: string;
}

export interface DispatchSheetItem {
  productId: string;
  productName: string;
  batchNumber: string;
  quantityLoaded: number;
  quantityDelivered: number;
  quantityReturned: number;
  unitPrice: number;
}

export interface DispatchSheet {
  id: string;
  dispatchNumber: string; // DSP-YYYY-XXXX
  date: string;
  driverName: string;
  driverPhone: string;
  vehicleNumberPlate: string;
  marketerId?: string;
  marketerName?: string;
  destinationRoute: string; // e.g. Kubwa - Gwarinpa Expressway
  items: DispatchSheetItem[];
  totalLoavesLoaded: number;
  totalLoavesDelivered: number;
  totalLoavesReturned: number;
  totalValueDelivered: number; // ₦
  cashCollectedOnRoute: number; // ₦
  bankTransferOnRoute: number;  // ₦
  status: 'PREPARED' | 'IN_TRANSIT' | 'DELIVERED' | 'RECONCILED';
  dispatchedBy: string;
  reconciledBy?: string;
  reconciledAt?: string;
  reconciliationNotes?: string;
  createdAt: string;
}

export interface BreadReturnRecord {
  id: string;
  returnNumber: string; // RET-YYYY-XXXX
  date: string;
  dispatchId?: string;
  dispatchNumber?: string;
  customerId?: string;
  customerName?: string;
  marketerId?: string;
  marketerName?: string;
  items: {
    productId: string;
    productName: string;
    batchNumber: string;
    quantity: number;
    reason: 'STALE_UNSOLD' | 'TRANSIT_CRUSHED' | 'PACKAGING_DEFECT' | 'OVER_BAKED' | 'MOULD_SUSPECTED';
  }[];
  totalLoavesReturned: number;
  dispositionAction: 'SELL_AS_ANIMAL_FEED' | 'TOAST_AS_BREADCRUMBS' | 'TOTAL_DESTROY_WRITEOFF';
  salvageRecoveryAmount: number; // ₦ received from selling to poultry/fish farm
  creditNoteIssuedToCustomer: boolean;
  creditNoteAmount: number;
  approvedBy: string;
  inspectionNotes?: string;
  status: 'LOGGED' | 'INSPECTED' | 'DISPOSITIONED_AND_CLOSED';
  createdAt: string;
}

export interface CashierSession {
  id: string;
  sessionCode: string; // CSH-YYYYMMDD-S1
  cashierId: string;
  cashierName: string;
  shift: 'MORNING' | 'EVENING';
  openedAt: string;
  closedAt?: string;
  openingFloat: number; // ₦
  totalCashSales: number;
  totalBankTransfers: number;
  totalCreditCollections: number;
  totalExpensesPaidOut: number;
  expectedPhysicalCash: number; // (openingFloat + cashSales + creditCollections - expensesPaid)
  actualPhysicalCashCounted?: number;
  cashVariance?: number; // actual - expected (negative = shortage)
  status: 'OPEN' | 'CLOSED' | 'SUPERVISOR_VERIFIED';
  supervisorName?: string;
  supervisorNotes?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // RCT-YYYY-XXXX
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  marketerId?: string;
  paymentDate: string;
  amountPaid: number; // ₦
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS_MONIEPOINT' | 'POS_OPAY';
  bankReferenceNumber?: string;
  cashierSessionId?: string;
  recordedBy: string;
  idempotencyKey: string;
  isReversed: boolean;
  reversalReason?: string;
  createdAt: string;
}

export interface OperatingExpense {
  id: string;
  voucherNumber: string; // EXP-YYYY-XXXX
  expenseDate: string;
  category:
    | 'DIESEL_GENERATOR'
    | 'GAS_OVEN_FUEL'
    | 'ELECTRICITY_AEDC'
    | 'VEHICLE_FUEL_AND_MAINTENANCE'
    | 'DAILY_BAKERY_LABOUR'
    | 'PACKAGING_MATERIALS'
    | 'WATER_TREATMENT_AND_SALT'
    | 'FACTORY_SANITATION_AND_SAFETY'
    | 'OFFICE_AND_ADMIN'
    | 'OTHER';
  description: string;
  amount: number; // ₦
  beneficiaryName: string;
  paymentMethod: 'CASH_FLOAT' | 'COMPANY_BANK_TRANSFER';
  approvedBy: string;
  receiptAttachmentRef?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // JRN-YYYY-XXXX
  date: string;
  narration: string;
  sourceModule: 'SALES' | 'PURCHASE' | 'PRODUCTION' | 'PAYMENT' | 'EXPENSE' | 'MANUAL';
  lines: {
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  postedBy: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  staffCode: string; // NXT-EMP-001
  fullName: string;
  phone: string;
  email?: string;
  department: 'BAKING' | 'MIXING' | 'PACKAGING' | 'QUALITY' | 'SALES' | 'LOGISTICS' | 'MAINTENANCE' | 'FINANCE' | 'ADMIN';
  designation: string;
  shiftPattern: 'MORNING' | 'NIGHT' | 'ROTATING' | 'DAY_OFFICE';
  dateEmployed: string;
  basicSalaryNaira: number;
  emergencyContact: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  shift: string;
  timeIn: string;
  timeOut?: string;
  status: 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';
  overtimeHours?: number;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorUsername: string;
  actorRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REVERSE' | 'RECONCILE' | 'QC_RELEASE' | 'QC_REJECT';
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  module: string;
  timestamp: string;
  isRead: boolean;
  linkAction?: string;
}

export interface BakerySettings {
  bakeryName: string;
  locationAddress: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  rcNumber: string;
  taxIdentificationNumber: string;
  currencySymbol: string;
  defaultTimezone: string;
  autoReorderAlertThreshold: number;
  poApprovalThresholdAmount: number; // ₦ above which GM approval is compulsory
  creditLimitStrictEnforcement: boolean;
  dailyProductionTargetLoaves: number;
  operatingWarehouses: {
    id: string;
    name: string;
    type: 'RAW_STORE' | 'PRODUCTION_FLOOR' | 'DISPATCH_BAY' | 'STALE_HOLDING';
  }[];
}

export interface DashboardMetrics {
  todayProductionLoaves: number;
  plannedProductionLoaves: number;
  productionYieldEfficiency: number; // percentage
  finishedGoodsStockLoaves: number;
  finishedGoodsReadyForDispatch: number;
  finishedGoodsOnHoldQC: number;
  rawMaterialsTotalValuation: number; // ₦
  lowStockItemsCount: number;
  todaySalesInvoicedNaira: number;    // ₦
  todaySalesCashCollectedNaira: number; // ₦
  todayDispatchedLoaves: number;
  todayReturnedLoaves: number;
  todayReturnsWastagePercent: number;
  totalReceivablesDebtorsNaira: number; // ₦
  totalPayablesCreditorsNaira: number;  // ₦
  todayOperatingExpensesNaira: number; // ₦
  estimatedGrossProfitTodayNaira: number; // ₦
  pendingApprovalsCount: number;
  activeCashierSessionsOpen: number;
  unreconciledDispatchesCount: number;
  recentActivity: {
    id: string;
    time: string;
    action: string;
    badge: string;
    user: string;
  }[];
}
