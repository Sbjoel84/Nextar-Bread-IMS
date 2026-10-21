import fs from 'fs';
import path from 'path';
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
  User,
  UserRole,
  DashboardMetrics,
  AccessRequest,
  DeviceSession,
} from '../types/erp';
import { ROLE_TEMPLATES } from '../shared/permissions';

export interface DatabaseSchema {
  settings: BakerySettings;
  users: User[];
  products: BreadProduct[];
  rawMaterials: RawMaterial[];
  stockLedger: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceiptNotes: GoodsReceiptNote[];
  recipes: Recipe[];
  productionOrders: ProductionOrder[];
  qualityControlRecords: QualityControlRecord[];
  finishedGoods: FinishedGoodsItem[];
  marketers: Marketer[];
  customers: Customer[];
  salesInvoices: SalesInvoice[];
  dispatchSheets: DispatchSheet[];
  returnRecords: BreadReturnRecord[];
  cashierSessions: CashierSession[];
  payments: PaymentReceipt[];
  operatingExpenses: OperatingExpense[];
  journalEntries: JournalEntry[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  auditLogs: AuditLogEntry[];
  notifications: SystemNotification[];
  accessRequests: AccessRequest[];
  sessions: DeviceSession[];
}

// Bring a loaded or freshly generated database up to the current schema (access control fields).
function normalizeSchema(db: DatabaseSchema): DatabaseSchema {
  db.accessRequests = db.accessRequests || [];
  db.sessions = db.sessions || [];
  for (const u of db.users) {
    if (!Array.isArray(u.permissions)) u.permissions = [...(ROLE_TEMPLATES[u.role] || [])];
  }
  return db;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nextar_erp_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// The sample bakery records are written as if "today" were this date; generateSeedData()
// moves the whole timeline forward so this date lands on the real current day.
const SEED_ANCHOR_DATE = '2026-10-18';

function buildSampleData(): DatabaseSchema {
  const now = `${SEED_ANCHOR_DATE}T06:00:00Z`;
  const todayStr = SEED_ANCHOR_DATE;

  const settings: BakerySettings = {
    bakeryName: 'Nextar Bread Bakery',
    locationAddress: 'Plot 48, Gado Nasko Road, Phase 2 Site, Kubwa',
    city: 'Abuja',
    state: 'Federal Capital Territory',
    country: 'Nigeria',
    phone: '+234 803 555 7789, +234 812 444 9900',
    email: 'info@nextarbakery.ng',
    rcNumber: 'RC-1894205',
    taxIdentificationNumber: 'TIN-28491024-0001',
    currencySymbol: '₦',
    defaultTimezone: 'Africa/Lagos',
    autoReorderAlertThreshold: 15,
    poApprovalThresholdAmount: 500000, // ₦500,000 threshold for GM approval
    creditLimitStrictEnforcement: true,
    dailyProductionTargetLoaves: 3500,
    operatingWarehouses: [
      { id: 'wh-main-raw', name: 'Kubwa Central Raw Material Silo & Store', type: 'RAW_STORE' },
      { id: 'wh-prod-floor', name: 'Bakery Production Staging Floor', type: 'PRODUCTION_FLOOR' },
      { id: 'wh-dispatch', name: 'Finished Goods Loading Bay & Dispatch Hall', type: 'DISPATCH_BAY' },
      { id: 'wh-stale', name: 'Quarantine & Return Holding Area', type: 'STALE_HOLDING' },
    ],
  };

  const users: User[] = [
    {
      id: 'usr-admin',
      username: 'admin',
      fullName: 'Alhaji Joel Yahaya',
      email: 'joelyahaya7@gmail.com',
      phone: '+234 803 555 0101',
      role: 'SUPER_ADMIN',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
      lastLoginAt: now,
    },
    {
      id: 'usr-md',
      username: 'md.director',
      fullName: 'Chief Nnamdi Okafor',
      email: 'md@nextarbakery.ng',
      phone: '+234 802 333 4455',
      role: 'MANAGING_DIRECTOR',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-gm',
      username: 'gm.operations',
      fullName: 'Engr. Babatunde Lawal',
      email: 'gm@nextarbakery.ng',
      phone: '+234 803 777 8899',
      role: 'GENERAL_MANAGER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-pm',
      username: 'prod.manager',
      fullName: 'Master Baker Austin Eke',
      email: 'production@nextarbakery.ng',
      phone: '+234 806 123 4567',
      role: 'PRODUCTION_MANAGER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-po',
      username: 'baker.sani',
      fullName: 'Sani Abdullahi (Senior Baker)',
      email: 'sani@nextarbakery.ng',
      phone: '+234 807 456 7890',
      role: 'PRODUCTION_OFFICER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-qc',
      username: 'qc.officer',
      fullName: 'Grace Chioma Nwachukwu (Food Technologist)',
      email: 'qc@nextarbakery.ng',
      phone: '+234 808 901 2345',
      role: 'QC_OFFICER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-store',
      username: 'storekeeper',
      fullName: 'Haruna Garba',
      email: 'inventory@nextarbakery.ng',
      phone: '+234 809 345 6789',
      role: 'STOREKEEPER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-procure',
      username: 'procurement',
      fullName: 'Folashade Adeleke',
      email: 'procurement@nextarbakery.ng',
      phone: '+234 810 567 8901',
      role: 'PROCUREMENT_OFFICER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-salesmgr',
      username: 'sales.manager',
      fullName: 'Kenneth Ogbonna',
      email: 'sales@nextarbakery.ng',
      phone: '+234 811 789 0123',
      role: 'SALES_MANAGER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-mkt1',
      username: 'musa.marketer',
      fullName: 'Musa Ibrahim (Kubwa Territory)',
      email: 'musa.ibrahim@nextarbakery.ng',
      phone: '+234 813 234 5678',
      role: 'MARKETER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-dispatch',
      username: 'dispatch.head',
      fullName: 'Kabir Usman',
      email: 'logistics@nextarbakery.ng',
      phone: '+234 814 678 9012',
      role: 'DISPATCH_OFFICER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-acct',
      username: 'accountant',
      fullName: 'Zainab Bello (CPA)',
      email: 'finance@nextarbakery.ng',
      phone: '+234 815 890 1234',
      role: 'ACCOUNTANT',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-cashier',
      username: 'cashier.morning',
      fullName: 'Blessing Udoh',
      email: 'cashier@nextarbakery.ng',
      phone: '+234 816 012 3456',
      role: 'CASHIER',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-auditor',
      username: 'internal.auditor',
      fullName: 'Oluwaseun Balogun',
      email: 'audit@nextarbakery.ng',
      phone: '+234 817 123 4567',
      role: 'AUDITOR',
      branch: 'Kubwa Central',
      isActive: true,
      createdAt: now,
    },
  ];

  const products: BreadProduct[] = [
    {
      id: 'prod-001',
      name: 'Nextar Jumbo Special Loaf',
      code: 'NXT-JUMBO-1000',
      category: 'PREMIUM',
      sizeGrams: 1000,
      isSliced: false,
      packagingType: 'PRINTED_NYLON',
      standardRetailPrice: 1500,
      wholesalePrice: 1300,
      distributorPrice: 1220,
      estimatedCostPrice: 860,
      shelfLifeDays: 5,
      reorderAlertLevel: 150,
      barcode: '615400010101',
      status: 'ACTIVE',
      currentStockLoaves: 680,
      createdAt: now,
    },
    {
      id: 'prod-002',
      name: 'Nextar Family Loaf (Standard)',
      code: 'NXT-FAM-800',
      category: 'STANDARD',
      sizeGrams: 800,
      isSliced: false,
      packagingType: 'PRINTED_NYLON',
      standardRetailPrice: 1200,
      wholesalePrice: 1020,
      distributorPrice: 960,
      estimatedCostPrice: 680,
      shelfLifeDays: 5,
      reorderAlertLevel: 250,
      barcode: '615400010102',
      status: 'ACTIVE',
      currentStockLoaves: 940,
      createdAt: now,
    },
    {
      id: 'prod-003',
      name: 'Nextar Butter Bread Special',
      code: 'NXT-BTR-500',
      category: 'PREMIUM',
      sizeGrams: 500,
      isSliced: false,
      packagingType: 'PRINTED_NYLON',
      standardRetailPrice: 900,
      wholesalePrice: 760,
      distributorPrice: 720,
      estimatedCostPrice: 510,
      shelfLifeDays: 5,
      reorderAlertLevel: 120,
      barcode: '615400010103',
      status: 'ACTIVE',
      currentStockLoaves: 430,
      createdAt: now,
    },
    {
      id: 'prod-004',
      name: 'Nextar Special Sandwich Sliced',
      code: 'NXT-SDW-750',
      category: 'SPECIALTY',
      sizeGrams: 750,
      isSliced: true,
      packagingType: 'PRINTED_NYLON',
      standardRetailPrice: 1300,
      wholesalePrice: 1120,
      distributorPrice: 1050,
      estimatedCostPrice: 740,
      shelfLifeDays: 4,
      reorderAlertLevel: 100,
      barcode: '615400010104',
      status: 'ACTIVE',
      currentStockLoaves: 310,
      createdAt: now,
    },
    {
      id: 'prod-005',
      name: 'Nextar 100% Whole Wheat Bread',
      code: 'NXT-WHT-600',
      category: 'SPECIALTY',
      sizeGrams: 600,
      isSliced: true,
      packagingType: 'PRINTED_NYLON',
      standardRetailPrice: 1250,
      wholesalePrice: 1080,
      distributorPrice: 1020,
      estimatedCostPrice: 710,
      shelfLifeDays: 4,
      reorderAlertLevel: 80,
      barcode: '615400010105',
      status: 'ACTIVE',
      currentStockLoaves: 215,
      createdAt: now,
    },
    {
      id: 'prod-006',
      name: 'Nextar Coconut Sweet Bread',
      code: 'NXT-COC-500',
      category: 'SPECIALTY',
      sizeGrams: 500,
      isSliced: false,
      packagingType: 'PRINTED_NYLON',
      standardRetailPrice: 1000,
      wholesalePrice: 850,
      distributorPrice: 800,
      estimatedCostPrice: 570,
      shelfLifeDays: 5,
      reorderAlertLevel: 70,
      barcode: '615400010106',
      status: 'ACTIVE',
      currentStockLoaves: 160,
      createdAt: now,
    },
    {
      id: 'prod-007',
      name: 'Nextar Chocolate Swirl Bread',
      code: 'NXT-CHOC-500',
      category: 'SPECIALTY',
      sizeGrams: 500,
      isSliced: false,
      packagingType: 'PRINTED_NYLON',
      standardRetailPrice: 1100,
      wholesalePrice: 950,
      distributorPrice: 900,
      estimatedCostPrice: 620,
      shelfLifeDays: 4,
      reorderAlertLevel: 50,
      barcode: '615400010107',
      status: 'ACTIVE',
      currentStockLoaves: 110,
      createdAt: now,
    },
    {
      id: 'prod-008',
      name: 'Nextar Golden Dinner Rolls (6 Pcs Pack)',
      code: 'NXT-ROLL-300',
      category: 'MINI',
      sizeGrams: 300,
      isSliced: false,
      packagingType: 'POLY_BAG',
      standardRetailPrice: 700,
      wholesalePrice: 580,
      distributorPrice: 540,
      estimatedCostPrice: 380,
      shelfLifeDays: 4,
      reorderAlertLevel: 80,
      barcode: '615400010108',
      status: 'ACTIVE',
      currentStockLoaves: 185,
      createdAt: now,
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup-001',
      code: 'SUP-FMN-01',
      name: 'Flour Mills of Nigeria Plc (Golden Penny)',
      contactPerson: 'Alhaji Bashir Mohammed (Regional Sales)',
      phone: '+234 803 111 2233',
      email: 'abuja.sales@fmnplc.com',
      address: 'Idu Industrial Layout, Phase 1, Abuja',
      supplyCategories: ['FLOUR', 'SALT'],
      paymentTerms: 'NET_14',
      creditLimit: 25000000,
      outstandingPayable: 4650000,
      rating: 5,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'sup-002',
      code: 'SUP-DNG-02',
      name: 'Dangote Sugar Refinery Plc',
      contactPerson: 'Mrs. Funke Adeyemi',
      phone: '+234 802 222 3344',
      email: 'sugar.orders@dangote.com',
      address: 'Plot 14, Commercial District, Idu, Abuja',
      supplyCategories: ['SUGAR', 'SALT'],
      paymentTerms: 'NET_14',
      creditLimit: 15000000,
      outstandingPayable: 2150000,
      rating: 5,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'sup-003',
      code: 'SUP-BUA-03',
      name: 'BUA Foods Plc (Flour & Margarine)',
      contactPerson: 'Mallam Shehu Aliyu',
      phone: '+234 803 333 4455',
      email: 'sales.abuja@buagroup.com',
      address: 'Dei-Dei Building Materials Market Ext, Abuja',
      supplyCategories: ['FLOUR', 'FAT_OIL'],
      paymentTerms: 'NET_7',
      creditLimit: 12000000,
      outstandingPayable: 1800000,
      rating: 4,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'sup-004',
      code: 'SUP-PRM-04',
      name: 'Prime Packaging & Plastics Nig. Ltd',
      contactPerson: 'Chief Clement Nwosu',
      phone: '+234 805 444 5566',
      email: 'primepack.abuja@gmail.com',
      address: 'Suleja-Kubwa Industrial Axis, Niger/FCT border',
      supplyCategories: ['PACKAGING'],
      paymentTerms: 'CASH_ON_DELIVERY',
      creditLimit: 5000000,
      outstandingPayable: 450000,
      rating: 4,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'sup-005',
      code: 'SUP-SAF-05',
      name: 'Saf-Instant & Lesaffre Ingredients Ltd',
      contactPerson: 'Emmanuel Dickson',
      phone: '+234 806 555 6677',
      email: 'lesaffre.nigeria@lesaffre.com',
      address: 'Utako Modern Market Plaza, Abuja',
      supplyCategories: ['YEAST', 'IMPROVER', 'PRESERVATIVE'],
      paymentTerms: 'NET_14',
      creditLimit: 8000000,
      outstandingPayable: 920000,
      rating: 5,
      status: 'ACTIVE',
      createdAt: now,
    },
  ];

  const rawMaterials: RawMaterial[] = [
    {
      id: 'rm-001',
      code: 'RAW-FLR-01',
      name: 'Golden Penny Prime Baker Flour (50kg)',
      category: 'FLOUR',
      unitOfMeasure: 'BAG_50KG',
      currentStock: 480, // bags
      minimumStockAlert: 120,
      standardCostPerUnit: 64500, // ₦64,500 per 50kg bag
      supplierId: 'sup-001',
      supplierName: 'Flour Mills of Nigeria Plc (Golden Penny)',
      storageLocation: 'Silo A, Main Kubwa Raw Store',
      supplierLotNumber: 'GP-202610-098',
      expiryDate: '2027-04-15',
      lastRestockedDate: '2026-10-14',
      updatedAt: now,
    },
    {
      id: 'rm-002',
      code: 'RAW-SGR-01',
      name: 'Dangote Fortified Granulated Sugar (50kg)',
      category: 'SUGAR',
      unitOfMeasure: 'BAG_50KG',
      currentStock: 85, // bags
      minimumStockAlert: 25,
      standardCostPerUnit: 78000, // ₦78,000 per bag
      supplierId: 'sup-002',
      supplierName: 'Dangote Sugar Refinery Plc',
      storageLocation: 'Dry Bay 2, Main Kubwa Raw Store',
      supplierLotNumber: 'DS-26-8841',
      expiryDate: '2027-10-30',
      lastRestockedDate: '2026-10-12',
      updatedAt: now,
    },
    {
      id: 'rm-003',
      code: 'RAW-YST-01',
      name: 'Saf-Instant Gold Baker Dry Yeast (500g)',
      category: 'YEAST',
      unitOfMeasure: 'PACK_500G',
      currentStock: 340, // packs
      minimumStockAlert: 80,
      standardCostPerUnit: 4200, // ₦4,200 per 500g pack
      supplierId: 'sup-005',
      supplierName: 'Saf-Instant & Lesaffre Ingredients Ltd',
      storageLocation: 'Cool Dry Rack C-1',
      supplierLotNumber: 'SAF-NG-770',
      expiryDate: '2027-08-20',
      lastRestockedDate: '2026-10-10',
      updatedAt: now,
    },
    {
      id: 'rm-004',
      code: 'RAW-MAR-01',
      name: 'BUA Top-Bake Vegetable Margarine (15kg)',
      category: 'FAT_OIL',
      unitOfMeasure: 'CARTON_15KG',
      currentStock: 110, // cartons
      minimumStockAlert: 30,
      standardCostPerUnit: 34500, // ₦34,500 per 15kg carton
      supplierId: 'sup-003',
      supplierName: 'BUA Foods Plc (Flour & Margarine)',
      storageLocation: 'Fat Storage Room, Temp Controlled',
      supplierLotNumber: 'BUA-FAT-449',
      expiryDate: '2027-03-31',
      lastRestockedDate: '2026-10-11',
      updatedAt: now,
    },
    {
      id: 'rm-005',
      code: 'RAW-SLT-01',
      name: 'Dangote Iodized Refined Fine Salt (25kg)',
      category: 'SALT',
      unitOfMeasure: 'BAG_25KG',
      currentStock: 45, // bags
      minimumStockAlert: 15,
      standardCostPerUnit: 14000,
      supplierId: 'sup-002',
      supplierName: 'Dangote Sugar Refinery Plc',
      storageLocation: 'Dry Bay 1, Pallet 4',
      supplierLotNumber: 'DNG-SLT-021',
      expiryDate: '2028-01-01',
      lastRestockedDate: '2026-09-28',
      updatedAt: now,
    },
    {
      id: 'rm-006',
      code: 'RAW-IMP-01',
      name: 'Magimix Super Bread Improver (10kg)',
      category: 'IMPROVER',
      unitOfMeasure: 'KG',
      currentStock: 145, // kg
      minimumStockAlert: 35,
      standardCostPerUnit: 5800, // ₦5,800 per kg
      supplierId: 'sup-005',
      supplierName: 'Saf-Instant & Lesaffre Ingredients Ltd',
      storageLocation: 'Chemical Storage Cabinet A',
      supplierLotNumber: 'MGM-X992',
      expiryDate: '2027-06-15',
      lastRestockedDate: '2026-10-05',
      updatedAt: now,
    },
    {
      id: 'rm-007',
      code: 'RAW-PRV-01',
      name: 'Food Grade Calcium Propionate Anti-Mould (25kg)',
      category: 'PRESERVATIVE',
      unitOfMeasure: 'KG',
      currentStock: 95, // kg
      minimumStockAlert: 20,
      standardCostPerUnit: 6200,
      supplierId: 'sup-005',
      supplierName: 'Saf-Instant & Lesaffre Ingredients Ltd',
      storageLocation: 'Chemical Storage Cabinet B',
      supplierLotNumber: 'CP-4401',
      expiryDate: '2027-11-01',
      lastRestockedDate: '2026-09-30',
      updatedAt: now,
    },
    {
      id: 'rm-008',
      code: 'RAW-NYL-01',
      name: 'Nextar Branded Holographic Bread Nylon Wrappers',
      category: 'PACKAGING',
      unitOfMeasure: 'BUNDLE_1000',
      currentStock: 82, // bundles of 1,000 bags = 82,000 wrappers
      minimumStockAlert: 20,
      standardCostPerUnit: 26000, // ₦26,000 per 1,000 bags (₦26/bag)
      supplierId: 'sup-004',
      supplierName: 'Prime Packaging & Plastics Nig. Ltd',
      storageLocation: 'Packaging Room Bay 3',
      supplierLotNumber: 'PRM-NYL-88',
      lastRestockedDate: '2026-10-08',
      updatedAt: now,
    },
    {
      id: 'rm-009',
      code: 'RAW-MILK-01',
      name: 'Aroma-Bake Powdered Milk Flavour (1kg)',
      category: 'OTHER',
      unitOfMeasure: 'KG',
      currentStock: 38,
      minimumStockAlert: 10,
      standardCostPerUnit: 7500,
      supplierId: 'sup-005',
      supplierName: 'Saf-Instant & Lesaffre Ingredients Ltd',
      storageLocation: 'Cool Dry Rack C-2',
      expiryDate: '2027-09-12',
      updatedAt: now,
    },
    {
      id: 'rm-010',
      code: 'RAW-SES-01',
      name: 'Washed Sesame Seeds for Crust (10kg)',
      category: 'OTHER',
      unitOfMeasure: 'KG',
      currentStock: 52,
      minimumStockAlert: 15,
      standardCostPerUnit: 3200,
      supplierId: 'sup-003',
      supplierName: 'BUA Foods Plc (Flour & Margarine)',
      storageLocation: 'Dry Bay 3, Shelf 2',
      expiryDate: '2027-05-30',
      updatedAt: now,
    },
  ];

  const stockLedger: StockMovement[] = [
    {
      id: 'mov-001',
      timestamp: '2026-10-14T09:30:00Z',
      rawMaterialId: 'rm-001',
      rawMaterialName: 'Golden Penny Prime Baker Flour (50kg)',
      movementType: 'PURCHASE_RECEIPT',
      quantityDelta: 200,
      unit: 'BAG_50KG',
      previousBalance: 320,
      newBalance: 520,
      referenceDocNumber: 'GRN-2026-0041',
      performedBy: 'Haruna Garba (Storekeeper)',
      notes: 'Received batch from FMN trailer, all bags dry and inspected.',
    },
    {
      id: 'mov-002',
      timestamp: '2026-10-17T20:30:00Z',
      rawMaterialId: 'rm-001',
      rawMaterialName: 'Golden Penny Prime Baker Flour (50kg)',
      movementType: 'ISSUE_TO_PRODUCTION',
      quantityDelta: -40,
      unit: 'BAG_50KG',
      previousBalance: 520,
      newBalance: 480,
      referenceDocNumber: 'NXT-20261018-S1-001',
      performedBy: 'Haruna Garba (Storekeeper)',
      notes: 'Issued to Lead Baker Sani for Night & Morning Production run.',
    },
    {
      id: 'mov-003',
      timestamp: '2026-10-17T20:45:00Z',
      rawMaterialId: 'rm-002',
      rawMaterialName: 'Dangote Fortified Granulated Sugar (50kg)',
      movementType: 'ISSUE_TO_PRODUCTION',
      quantityDelta: -5,
      unit: 'BAG_50KG',
      previousBalance: 90,
      newBalance: 85,
      referenceDocNumber: 'NXT-20261018-S1-001',
      performedBy: 'Haruna Garba (Storekeeper)',
      notes: 'Issued for dough mix.',
    },
    {
      id: 'mov-004',
      timestamp: '2026-10-17T21:00:00Z',
      rawMaterialId: 'rm-008',
      rawMaterialName: 'Nextar Branded Holographic Bread Nylon Wrappers',
      movementType: 'ISSUE_TO_PRODUCTION',
      quantityDelta: -4,
      unit: 'BUNDLE_1000',
      previousBalance: 86,
      newBalance: 82,
      referenceDocNumber: 'NXT-20261018-S1-001',
      performedBy: 'Haruna Garba (Storekeeper)',
      notes: '4,000 wrappers issued to packaging section.',
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-001',
      poNumber: 'PO-2026-0082',
      supplierId: 'sup-001',
      supplierName: 'Flour Mills of Nigeria Plc (Golden Penny)',
      orderDate: '2026-10-12',
      expectedDeliveryDate: '2026-10-14',
      items: [
        {
          rawMaterialId: 'rm-001',
          name: 'Golden Penny Prime Baker Flour (50kg)',
          quantityOrdered: 200,
          quantityReceived: 200,
          unit: 'BAG_50KG',
          unitPrice: 64500,
          totalPrice: 12900000,
        },
      ],
      subtotal: 12900000,
      vatAmount: 0,
      totalAmount: 12900000,
      status: 'RECEIVED',
      approvalRequired: true,
      approvedBy: 'Engr. Babatunde Lawal (GM)',
      approvedAt: '2026-10-12T14:10:00Z',
      notes: 'Monthly bulk flour delivery. 30 days credit term.',
      createdAt: '2026-10-12T11:00:00Z',
    },
    {
      id: 'po-002',
      poNumber: 'PO-2026-0083',
      supplierId: 'sup-004',
      supplierName: 'Prime Packaging & Plastics Nig. Ltd',
      orderDate: '2026-10-15',
      expectedDeliveryDate: '2026-10-19',
      items: [
        {
          rawMaterialId: 'rm-008',
          name: 'Nextar Branded Holographic Bread Nylon Wrappers',
          quantityOrdered: 50,
          quantityReceived: 0,
          unit: 'BUNDLE_1000',
          unitPrice: 26000,
          totalPrice: 1300000,
        },
      ],
      subtotal: 1300000,
      vatAmount: 0,
      totalAmount: 1300000,
      status: 'APPROVED',
      approvalRequired: true,
      approvedBy: 'Engr. Babatunde Lawal (GM)',
      approvedAt: '2026-10-16T10:00:00Z',
      notes: '50,000 branded nylons for Jumbo and Family Loaves.',
      createdAt: '2026-10-15T15:20:00Z',
    },
  ];

  const goodsReceiptNotes: GoodsReceiptNote[] = [
    {
      id: 'grn-001',
      grnNumber: 'GRN-2026-0041',
      poId: 'po-001',
      poNumber: 'PO-2026-0082',
      supplierId: 'sup-001',
      supplierName: 'Flour Mills of Nigeria Plc (Golden Penny)',
      supplierInvoiceRef: 'INV-FMN-98214',
      receivedDate: '2026-10-14',
      receivedBy: 'Haruna Garba (Storekeeper)',
      items: [
        {
          rawMaterialId: 'rm-001',
          name: 'Golden Penny Prime Baker Flour (50kg)',
          quantityReceived: 200,
          unit: 'BAG_50KG',
          unitCost: 64500,
          supplierLotNumber: 'GP-202610-098',
          expiryDate: '2027-04-15',
          condition: 'EXCELLENT',
        },
      ],
      isReconciledWithInvoice: true,
      remarks: 'Inspected by QC Officer Grace. Moisture test 13.2% (Passed).',
      createdAt: '2026-10-14T09:30:00Z',
    },
  ];

  const recipes: Recipe[] = [
    {
      id: 'rcp-001',
      recipeCode: 'RCP-FAM-01',
      productId: 'prod-002',
      productName: 'Nextar Family Loaf (Standard 800g)',
      version: 2,
      batchBaseFlourKg: 50, // 1 bag of 50kg flour
      expectedTheoreticalYieldLoaves: 100, // 100 loaves @ 800g dough scaling
      standardBakingTimeMins: 38,
      standardOvenTempCelsius: 215,
      ingredients: [
        { rawMaterialId: 'rm-001', rawMaterialName: 'Golden Penny Prime Baker Flour', quantityPerBatch: 50, unit: 'KG' },
        { rawMaterialId: 'rm-002', rawMaterialName: 'Dangote Fortified Granulated Sugar', quantityPerBatch: 5.5, unit: 'KG' },
        { rawMaterialId: 'rm-003', rawMaterialName: 'Saf-Instant Gold Baker Dry Yeast', quantityPerBatch: 0.5, unit: 'KG' },
        { rawMaterialId: 'rm-004', rawMaterialName: 'BUA Top-Bake Vegetable Margarine', quantityPerBatch: 2.2, unit: 'KG' },
        { rawMaterialId: 'rm-005', rawMaterialName: 'Dangote Iodized Refined Fine Salt', quantityPerBatch: 0.8, unit: 'KG' },
        { rawMaterialId: 'rm-006', rawMaterialName: 'Magimix Super Bread Improver', quantityPerBatch: 0.25, unit: 'KG' },
        { rawMaterialId: 'rm-007', rawMaterialName: 'Calcium Propionate Anti-Mould', quantityPerBatch: 0.15, unit: 'KG' },
        { rawMaterialId: 'rm-009', rawMaterialName: 'Aroma-Bake Powdered Milk Flavour', quantityPerBatch: 0.2, unit: 'KG' },
        { rawMaterialId: 'rm-008', rawMaterialName: 'Nextar Branded Holographic Bread Nylon Wrappers', quantityPerBatch: 100, unit: 'PCS' },
      ],
      preparationInstructions: [
        'Dry blend flour, sugar, salt, milk flavour and improver in spiral mixer for 2 minutes on low speed.',
        'Add chilled water and yeast suspension; knead at high speed for 8-10 minutes until gluten window is achieved.',
        'Add softened margarine in final 3 minutes of mixing until dough is smooth, elastic and non-sticky.',
        'Scale dough into 850g dough balls to account for bake loss (final loaf 800g ± 15g).',
        'Mould and place in greased quadruple loaf tins.',
        'Proof in steam proofing chamber at 38°C and 85% RH for 90 minutes until dough crowns 1.5 inches above tin rim.',
        'Bake in rotary deck oven at 215°C for 38 minutes with initial 10-second steam burst.',
        'Depan immediately onto cooling racks; cool for minimum 60 minutes before packaging.',
      ],
      isApproved: true,
      approvedBy: 'Master Baker Austin Eke (Production Manager)',
      updatedAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'rcp-002',
      recipeCode: 'RCP-JMB-01',
      productId: 'prod-001',
      productName: 'Nextar Jumbo Special Loaf (1kg)',
      version: 2,
      batchBaseFlourKg: 50,
      expectedTheoreticalYieldLoaves: 78,
      standardBakingTimeMins: 44,
      standardOvenTempCelsius: 210,
      ingredients: [
        { rawMaterialId: 'rm-001', rawMaterialName: 'Golden Penny Prime Baker Flour', quantityPerBatch: 50, unit: 'KG' },
        { rawMaterialId: 'rm-002', rawMaterialName: 'Dangote Fortified Granulated Sugar', quantityPerBatch: 6.0, unit: 'KG' },
        { rawMaterialId: 'rm-003', rawMaterialName: 'Saf-Instant Gold Baker Dry Yeast', quantityPerBatch: 0.55, unit: 'KG' },
        { rawMaterialId: 'rm-004', rawMaterialName: 'BUA Top-Bake Vegetable Margarine', quantityPerBatch: 2.5, unit: 'KG' },
        { rawMaterialId: 'rm-005', rawMaterialName: 'Dangote Iodized Refined Fine Salt', quantityPerBatch: 0.85, unit: 'KG' },
        { rawMaterialId: 'rm-006', rawMaterialName: 'Magimix Super Bread Improver', quantityPerBatch: 0.28, unit: 'KG' },
        { rawMaterialId: 'rm-007', rawMaterialName: 'Calcium Propionate Anti-Mould', quantityPerBatch: 0.18, unit: 'KG' },
        { rawMaterialId: 'rm-008', rawMaterialName: 'Nextar Branded Holographic Bread Nylon Wrappers', quantityPerBatch: 78, unit: 'PCS' },
      ],
      preparationInstructions: [
        'Scale dough into 1,060g pieces to yield finished 1,000g loaves.',
        'Bake at 210°C for 44 minutes until golden mahogany crust forms.',
      ],
      isApproved: true,
      approvedBy: 'Master Baker Austin Eke (Production Manager)',
      updatedAt: '2026-09-15T10:00:00Z',
    },
  ];

  const productionOrders: ProductionOrder[] = [
    {
      id: 'po-batch-001',
      batchNumber: 'NXT-20261018-S1-001',
      recipeId: 'rcp-001',
      productId: 'prod-002',
      productName: 'Nextar Family Loaf (Standard 800g)',
      scheduledDate: todayStr,
      shift: 'MORNING_BAKE',
      targetLoaves: 1000, // 10 bags of flour
      actualGoodLoaves: 982,
      rejectedLoaves: 14, // 14 burnt/deformed loaves
      doughScrapKg: 3.5,
      yieldEfficiencyPercent: 98.2,
      ingredientsIssued: [
        { rawMaterialId: 'rm-001', rawMaterialName: 'Flour (50kg)', plannedQty: 10, actualQty: 10, unit: 'BAG_50KG' },
        { rawMaterialId: 'rm-002', rawMaterialName: 'Sugar (50kg)', plannedQty: 1.1, actualQty: 1.1, unit: 'BAG_50KG' },
        { rawMaterialId: 'rm-003', rawMaterialName: 'Yeast (500g)', plannedQty: 10, actualQty: 10, unit: 'PACK_500G' },
        { rawMaterialId: 'rm-004', rawMaterialName: 'Margarine (15kg)', plannedQty: 1.5, actualQty: 1.5, unit: 'CARTON_15KG' },
      ],
      mixingStartTime: '2026-10-18T05:00:00Z',
      bakingEndTime: '2026-10-18T09:15:00Z',
      downtimeMinutes: 15,
      downtimeReason: 'AEDC Public power outage; switched to 100kVA Mikano generator.',
      leadBaker: 'Sani Abdullahi',
      supervisor: 'Master Baker Austin Eke',
      status: 'COMPLETED',
      qcStatus: 'RELEASED',
      notes: 'Excellent golden crust development and uniform crumb expansion.',
      createdAt: '2026-10-18T04:30:00Z',
    },
    {
      id: 'po-batch-002',
      batchNumber: 'NXT-20261018-S1-002',
      recipeId: 'rcp-002',
      productId: 'prod-001',
      productName: 'Nextar Jumbo Special Loaf (1kg)',
      scheduledDate: todayStr,
      shift: 'MORNING_BAKE',
      targetLoaves: 700,
      actualGoodLoaves: 686,
      rejectedLoaves: 8,
      doughScrapKg: 2.0,
      yieldEfficiencyPercent: 98.0,
      ingredientsIssued: [
        { rawMaterialId: 'rm-001', rawMaterialName: 'Flour (50kg)', plannedQty: 9, actualQty: 9, unit: 'BAG_50KG' },
      ],
      mixingStartTime: '2026-10-18T08:30:00Z',
      bakingEndTime: '2026-10-18T12:00:00Z',
      downtimeMinutes: 0,
      leadBaker: 'Sani Abdullahi',
      supervisor: 'Master Baker Austin Eke',
      status: 'COMPLETED',
      qcStatus: 'RELEASED',
      notes: 'Packed and transferred to Dispatch Hall.',
      createdAt: '2026-10-18T08:00:00Z',
    },
  ];

  const qualityControlRecords: QualityControlRecord[] = [
    {
      id: 'qc-001',
      batchId: 'po-batch-001',
      batchNumber: 'NXT-20261018-S1-001',
      productName: 'Nextar Family Loaf (Standard 800g)',
      inspectionDate: '2026-10-18T09:45:00Z',
      inspectorName: 'Grace Chioma Nwachukwu (QC Officer)',
      sampleLoavesTested: 10,
      targetWeightGrams: 800,
      actualAverageWeightGrams: 805,
      weightVariancePercentage: 0.62,
      isWeightCompliant: true,
      crumbTextureRating: 5,
      crustColorRating: 5,
      aromaTasteRating: 5,
      moisturePassed: true,
      packagingSealingPassed: true,
      overallDecision: 'RELEASED',
      releasedAt: '2026-10-18T10:00:00Z',
      traceabilityChain: {
        flourLot: 'GP-202610-098',
        yeastLot: 'SAF-NG-770',
        bakingShift: 'Morning Shift Bake (Deck 1 & 2)',
        ovenNumber: 'Rotary Oven #1 (Gas fired)',
      },
    },
    {
      id: 'qc-002',
      batchId: 'po-batch-002',
      batchNumber: 'NXT-20261018-S1-002',
      productName: 'Nextar Jumbo Special Loaf (1kg)',
      inspectionDate: '2026-10-18T12:30:00Z',
      inspectorName: 'Grace Chioma Nwachukwu (QC Officer)',
      sampleLoavesTested: 8,
      targetWeightGrams: 1000,
      actualAverageWeightGrams: 1008,
      weightVariancePercentage: 0.8,
      isWeightCompliant: true,
      crumbTextureRating: 5,
      crustColorRating: 5,
      aromaTasteRating: 5,
      moisturePassed: true,
      packagingSealingPassed: true,
      overallDecision: 'RELEASED',
      releasedAt: '2026-10-18T12:45:00Z',
      traceabilityChain: {
        flourLot: 'GP-202610-098',
        yeastLot: 'SAF-NG-770',
        bakingShift: 'Morning Shift Bake (Deck 3)',
        ovenNumber: 'Rotary Oven #2 (Gas fired)',
      },
    },
  ];

  const finishedGoods: FinishedGoodsItem[] = [
    {
      id: 'fg-001',
      productId: 'prod-002',
      productName: 'Nextar Family Loaf (Standard 800g)',
      batchNumber: 'NXT-20261018-S1-001',
      productionDate: todayStr,
      expiryDate: '2026-10-23',
      quantityProduced: 982,
      quantityAvailableForDispatch: 582,
      quantityReserved: 400,
      quantityDispatched: 0,
      quantityReturned: 0,
      warehouseLocation: 'Dispatch Hall - Rack A1 (FEFO)',
      unitRetailPrice: 1200,
      status: 'AVAILABLE',
    },
    {
      id: 'fg-002',
      productId: 'prod-001',
      productName: 'Nextar Jumbo Special Loaf (1kg)',
      batchNumber: 'NXT-20261018-S1-002',
      productionDate: todayStr,
      expiryDate: '2026-10-23',
      quantityProduced: 686,
      quantityAvailableForDispatch: 436,
      quantityReserved: 250,
      quantityDispatched: 0,
      quantityReturned: 0,
      warehouseLocation: 'Dispatch Hall - Rack B1 (FEFO)',
      unitRetailPrice: 1500,
      status: 'AVAILABLE',
    },
  ];

  const marketers: Marketer[] = [
    {
      id: 'mkt-001',
      marketerCode: 'MKT-KBW-01',
      fullName: 'Musa Ibrahim',
      phone: '+234 813 234 5678',
      email: 'musa.ibrahim@nextarbakery.ng',
      assignedTerritory: 'Kubwa Central, Phase 4 & Byazhin',
      commissionType: 'PERCENTAGE',
      commissionRate: 5.0, // 5%
      monthlySalesTargetLoaves: 18000,
      dailyAllocationLimitLoaves: 800,
      currentOwedBalance: 84000, // ₦84,000 pending cash reconciliation
      ytdTotalSales: 14250000,
      status: 'ACTIVE',
      assignedVehiclePlate: 'RSH-234-AA (Tricycle)',
      joinedDate: '2025-03-01',
    },
    {
      id: 'mkt-002',
      marketerCode: 'MKT-GWR-02',
      fullName: 'Chinedu Eze',
      phone: '+234 814 345 6789',
      email: 'chinedu.eze@nextarbakery.ng',
      assignedTerritory: 'Gwarinpa Estate, 1st - 7th Avenue',
      commissionType: 'FIXED_PER_LOAF',
      commissionRate: 40, // ₦40 per loaf
      monthlySalesTargetLoaves: 22000,
      dailyAllocationLimitLoaves: 1000,
      currentOwedBalance: 120000,
      ytdTotalSales: 18900000,
      status: 'ACTIVE',
      assignedVehiclePlate: 'ABC-551-KU (Suzuki Mini Van)',
      joinedDate: '2024-11-15',
    },
    {
      id: 'mkt-003',
      marketerCode: 'MKT-BWR-03',
      fullName: 'Fatima Aliyu',
      phone: '+234 815 456 7890',
      email: 'fatima.aliyu@nextarbakery.ng',
      assignedTerritory: 'Dutse Alhaji, Usman Dam & Bwari Town',
      commissionType: 'PERCENTAGE',
      commissionRate: 5.0,
      monthlySalesTargetLoaves: 14000,
      dailyAllocationLimitLoaves: 600,
      currentOwedBalance: 45000,
      ytdTotalSales: 9800000,
      status: 'ACTIVE',
      assignedVehiclePlate: 'BWR-912-KT (Delivery Van)',
      joinedDate: '2025-06-20',
    },
    {
      id: 'mkt-004',
      marketerCode: 'MKT-WUS-04',
      fullName: 'Emmanuel Ade',
      phone: '+234 816 567 8901',
      email: 'emmanuel.ade@nextarbakery.ng',
      assignedTerritory: 'Wuse 2, Maitama Supermarkets & Utako Market',
      commissionType: 'PERCENTAGE',
      commissionRate: 6.0,
      monthlySalesTargetLoaves: 25000,
      dailyAllocationLimitLoaves: 1200,
      currentOwedBalance: 210000,
      ytdTotalSales: 24500000,
      status: 'ACTIVE',
      assignedVehiclePlate: 'KJA-782-XR (Toyota HiAce Van)',
      joinedDate: '2024-05-10',
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust-001',
      customerCode: 'CST-KBW-01',
      name: 'Mrs. Abigail Okon',
      businessName: 'Kubwa Grand Supermarket & Bakery Corner',
      customerType: 'SUPERMARKET',
      phone: '+234 803 777 0011',
      email: 'orders@kubwagrand.ng',
      address: 'Suite 12, Gado Nasko Way, Kubwa, Abuja',
      territory: 'Kubwa Central',
      assignedMarketerId: 'mkt-001',
      assignedMarketerName: 'Musa Ibrahim',
      priceTier: 'WHOLESALE',
      creditLimit: 500000,
      creditDays: 7,
      currentOutstandingBalance: 125000,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'cust-002',
      customerCode: 'CST-KBW-02',
      name: 'Alhaji Gambo Umar',
      businessName: 'Phase 4 Bread Depot & Wholesale Hub',
      customerType: 'BREAD_DEPOT',
      phone: '+234 802 888 1122',
      email: 'gambodepot@gmail.com',
      address: 'Near 2/2 Junction, Phase 4, Kubwa, Abuja',
      territory: 'Kubwa Phase 4',
      assignedMarketerId: 'mkt-001',
      assignedMarketerName: 'Musa Ibrahim',
      priceTier: 'DISTRIBUTOR',
      creditLimit: 1200000,
      creditDays: 7,
      currentOutstandingBalance: 340000,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'cust-003',
      customerCode: 'CST-GWR-03',
      name: 'Mr. Jude Chukwu',
      businessName: '3rd Avenue HyperMart Gwarinpa',
      customerType: 'SUPERMARKET',
      phone: '+234 805 999 2233',
      email: 'procure@hypermartgwr.com',
      address: 'Plot 104, 3rd Avenue, Gwarinpa Estate, Abuja',
      territory: 'Gwarinpa Estate',
      assignedMarketerId: 'mkt-002',
      assignedMarketerName: 'Chinedu Eze',
      priceTier: 'WHOLESALE',
      creditLimit: 800000,
      creditDays: 14,
      currentOutstandingBalance: 210000,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'cust-004',
      customerCode: 'CST-BWR-04',
      name: 'Hajiya Maryam Bello',
      businessName: 'Bwari College Cafeteria & Stores',
      customerType: 'INSTITUTION',
      phone: '+234 806 000 3344',
      email: 'bwaricanteen@yahoo.com',
      address: 'Near FGC Bwari, Bwari Central, Abuja',
      territory: 'Bwari Central',
      assignedMarketerId: 'mkt-003',
      assignedMarketerName: 'Fatima Aliyu',
      priceTier: 'WHOLESALE',
      creditLimit: 300000,
      creditDays: 7,
      currentOutstandingBalance: 65000,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'cust-005',
      customerCode: 'CST-WUS-05',
      name: 'Nextar Retail Kiosk (Bakery Front Kubwa)',
      businessName: 'Nextar Fresh Bread Retail Counter',
      customerType: 'RETAIL_KIOSK',
      phone: '+234 803 555 7789',
      email: 'kiosk@nextarbakery.ng',
      address: 'Bakery Gate, Plot 48 Gado Nasko Road, Kubwa',
      territory: 'Kubwa Central',
      priceTier: 'RETAIL',
      creditLimit: 0,
      creditDays: 0,
      currentOutstandingBalance: 0,
      status: 'ACTIVE',
      createdAt: now,
    },
  ];

  const salesInvoices: SalesInvoice[] = [
    {
      id: 'inv-001',
      invoiceNumber: 'INV-2026-0120',
      customerId: 'cust-001',
      customerName: 'Kubwa Grand Supermarket & Bakery Corner',
      marketerId: 'mkt-001',
      marketerName: 'Musa Ibrahim',
      invoiceDate: todayStr,
      dueDate: '2026-10-25',
      items: [
        { productId: 'prod-002', productName: 'Nextar Family Loaf (Standard 800g)', quantity: 150, unitPrice: 1020, subtotal: 153000 },
        { productId: 'prod-001', productName: 'Nextar Jumbo Special Loaf (1kg)', quantity: 80, unitPrice: 1300, subtotal: 104000 },
      ],
      subtotal: 257000,
      discountAmount: 7000,
      netPayableAmount: 250000,
      amountPaid: 125000,
      amountDue: 125000,
      paymentType: 'CREDIT',
      status: 'PARTIALLY_PAID',
      dispatchRef: 'DSP-2026-0091',
      postedBy: 'Kenneth Ogbonna (Sales Manager)',
      createdAt: '2026-10-18T10:15:00Z',
    },
    {
      id: 'inv-002',
      invoiceNumber: 'INV-2026-0121',
      customerId: 'cust-002',
      customerName: 'Phase 4 Bread Depot & Wholesale Hub',
      marketerId: 'mkt-001',
      marketerName: 'Musa Ibrahim',
      invoiceDate: todayStr,
      dueDate: '2026-10-25',
      items: [
        { productId: 'prod-002', productName: 'Nextar Family Loaf (Standard 800g)', quantity: 250, unitPrice: 960, subtotal: 240000 },
        { productId: 'prod-001', productName: 'Nextar Jumbo Special Loaf (1kg)', quantity: 120, unitPrice: 1220, subtotal: 146400 },
      ],
      subtotal: 386400,
      discountAmount: 6400,
      netPayableAmount: 380000,
      amountPaid: 40000,
      amountDue: 340000,
      paymentType: 'CREDIT',
      status: 'PARTIALLY_PAID',
      dispatchRef: 'DSP-2026-0091',
      postedBy: 'Kenneth Ogbonna (Sales Manager)',
      createdAt: '2026-10-18T10:30:00Z',
    },
  ];

  const dispatchSheets: DispatchSheet[] = [
    {
      id: 'dsp-001',
      dispatchNumber: 'DSP-2026-0091',
      date: todayStr,
      driverName: 'Kabir Usman',
      driverPhone: '+234 814 678 9012',
      vehicleNumberPlate: 'KJA-782-XR (Toyota HiAce)',
      marketerId: 'mkt-001',
      marketerName: 'Musa Ibrahim',
      destinationRoute: 'Kubwa Central & Phase 4 Morning Route',
      items: [
        { productId: 'prod-002', productName: 'Nextar Family Loaf (Standard 800g)', batchNumber: 'NXT-20261018-S1-001', quantityLoaded: 400, quantityDelivered: 395, quantityReturned: 5, unitPrice: 1020 },
        { productId: 'prod-001', productName: 'Nextar Jumbo Special Loaf (1kg)', batchNumber: 'NXT-20261018-S1-002', quantityLoaded: 200, quantityDelivered: 198, quantityReturned: 2, unitPrice: 1300 },
      ],
      totalLoavesLoaded: 600,
      totalLoavesDelivered: 593,
      totalLoavesReturned: 7,
      totalValueDelivered: 660300,
      cashCollectedOnRoute: 285000,
      bankTransferOnRoute: 210300,
      status: 'RECONCILED',
      dispatchedBy: 'Kabir Usman (Dispatch Officer)',
      reconciledBy: 'Blessing Udoh (Cashier)',
      reconciledAt: '2026-10-18T14:45:00Z',
      reconciliationNotes: '7 returns inspected: 4 stales from yesterday swap, 3 crushed in transit. All cash deposited.',
      createdAt: '2026-10-18T09:45:00Z',
    },
  ];

  const returnRecords: BreadReturnRecord[] = [
    {
      id: 'ret-001',
      returnNumber: 'RET-2026-0028',
      date: todayStr,
      dispatchId: 'dsp-001',
      dispatchNumber: 'DSP-2026-0091',
      customerId: 'cust-001',
      customerName: 'Kubwa Grand Supermarket & Bakery Corner',
      marketerId: 'mkt-001',
      marketerName: 'Musa Ibrahim',
      items: [
        {
          productId: 'prod-002',
          productName: 'Nextar Family Loaf (Standard 800g)',
          batchNumber: 'NXT-20261018-S1-001',
          quantity: 4,
          reason: 'STALE_UNSOLD',
        },
        {
          productId: 'prod-001',
          productName: 'Nextar Jumbo Special Loaf (1kg)',
          batchNumber: 'NXT-20261018-S1-002',
          quantity: 3,
          reason: 'TRANSIT_CRUSHED',
        },
      ],
      totalLoavesReturned: 7,
      dispositionAction: 'SELL_AS_ANIMAL_FEED',
      salvageRecoveryAmount: 1400, // sold to local poultry farmer @ ₦200/loaf
      creditNoteIssuedToCustomer: true,
      creditNoteAmount: 7980,
      approvedBy: 'Grace Chioma Nwachukwu (QC Officer)',
      inspectionNotes: 'No fungal mould. Approved for animal feed sales.',
      status: 'DISPOSITIONED_AND_CLOSED',
      createdAt: '2026-10-18T15:10:00Z',
    },
  ];

  const cashierSessions: CashierSession[] = [
    {
      id: 'csh-001',
      sessionCode: `CSH-${todayStr.replace(/-/g, '')}-S1`,
      cashierId: 'usr-cashier',
      cashierName: 'Blessing Udoh',
      shift: 'MORNING',
      openedAt: '2026-10-18T07:00:00Z',
      openingFloat: 50000, // ₦50,000 float for retail change
      totalCashSales: 165000,
      totalBankTransfers: 310000,
      totalCreditCollections: 125000,
      totalExpensesPaidOut: 18000, // minor petty cash
      expectedPhysicalCash: 322000, // 50,000 + 165,000 + 125,000 - 18,000
      actualPhysicalCashCounted: 322000,
      cashVariance: 0,
      status: 'OPEN',
      supervisorName: 'Zainab Bello (Accountant)',
      supervisorNotes: 'Midday check balanced. POS settlement slip verified.',
    },
  ];

  const payments: PaymentReceipt[] = [
    {
      id: 'pay-001',
      receiptNumber: 'RCT-2026-0155',
      invoiceId: 'inv-001',
      invoiceNumber: 'INV-2026-0120',
      customerId: 'cust-001',
      customerName: 'Kubwa Grand Supermarket & Bakery Corner',
      marketerId: 'mkt-001',
      paymentDate: todayStr,
      amountPaid: 125000,
      paymentMethod: 'POS_MONIEPOINT',
      bankReferenceNumber: 'MP-POS-20261018-9941',
      cashierSessionId: 'csh-001',
      recordedBy: 'Blessing Udoh (Cashier)',
      idempotencyKey: 'IDEMP-CUST001-20261018-125K',
      isReversed: false,
      createdAt: '2026-10-18T11:45:00Z',
    },
    {
      id: 'pay-002',
      receiptNumber: 'RCT-2026-0156',
      invoiceId: 'inv-002',
      invoiceNumber: 'INV-2026-0121',
      customerId: 'cust-002',
      customerName: 'Phase 4 Bread Depot & Wholesale Hub',
      marketerId: 'mkt-001',
      paymentDate: todayStr,
      amountPaid: 40000,
      paymentMethod: 'CASH',
      cashierSessionId: 'csh-001',
      recordedBy: 'Blessing Udoh (Cashier)',
      idempotencyKey: 'IDEMP-CUST002-20261018-40K',
      isReversed: false,
      createdAt: '2026-10-18T13:10:00Z',
    },
  ];

  const operatingExpenses: OperatingExpense[] = [
    {
      id: 'exp-001',
      voucherNumber: 'EXP-2026-0089',
      expenseDate: todayStr,
      category: 'GAS_OVEN_FUEL',
      description: 'LPG Gas refilling for 3 Rotary Deck Ovens (300kg @ ₦1,250/kg)',
      amount: 375000,
      beneficiaryName: 'TotalEnergies Gas Kubwa',
      paymentMethod: 'COMPANY_BANK_TRANSFER',
      approvedBy: 'Engr. Babatunde Lawal (GM)',
      receiptAttachmentRef: 'RCP-TE-44109',
      status: 'APPROVED',
      createdAt: '2026-10-18T08:30:00Z',
    },
    {
      id: 'exp-002',
      voucherNumber: 'EXP-2026-0090',
      expenseDate: todayStr,
      category: 'DIESEL_GENERATOR',
      description: 'Automotive Gas Oil (Diesel) 150 Litres for 100kVA Mikano Backup Generator',
      amount: 195000,
      beneficiaryName: 'NNPC Retail Station Kubwa',
      paymentMethod: 'COMPANY_BANK_TRANSFER',
      approvedBy: 'Engr. Babatunde Lawal (GM)',
      receiptAttachmentRef: 'RCP-NNPC-8120',
      status: 'APPROVED',
      createdAt: '2026-10-18T09:15:00Z',
    },
    {
      id: 'exp-003',
      voucherNumber: 'EXP-2026-0091',
      expenseDate: todayStr,
      category: 'DAILY_BAKERY_LABOUR',
      description: 'Daily shift stipends for 6 auxiliary oven loaders and dough molders',
      amount: 18000,
      beneficiaryName: 'Auxiliary Bakery Team',
      paymentMethod: 'CASH_FLOAT',
      approvedBy: 'Master Baker Austin Eke',
      status: 'PAID',
      createdAt: '2026-10-18T14:00:00Z',
    },
  ];

  const journalEntries: JournalEntry[] = [
    {
      id: 'jrn-001',
      entryNumber: 'JRN-2026-0045',
      date: todayStr,
      narration: 'Recording Morning Production raw materials consumption against WIP',
      sourceModule: 'PRODUCTION',
      lines: [
        { accountCode: '5100', accountName: 'Cost of Goods Sold - Flour & Ingredients', debitAmount: 760000, creditAmount: 0 },
        { accountCode: '1300', accountName: 'Raw Materials Inventory', debitAmount: 0, creditAmount: 760000 },
      ],
      totalDebit: 760000,
      totalCredit: 760000,
      postedBy: 'Zainab Bello (Accountant)',
      createdAt: '2026-10-18T11:00:00Z',
    },
    {
      id: 'jrn-002',
      entryNumber: 'JRN-2026-0046',
      date: todayStr,
      narration: 'Operating diesel and oven gas fuel expenditure',
      sourceModule: 'EXPENSE',
      lines: [
        { accountCode: '6100', accountName: 'Factory Energy & Fuel Expenses', debitAmount: 570000, creditAmount: 0 },
        { accountCode: '1100', accountName: 'GTBank Corporate Operating Account', debitAmount: 0, creditAmount: 570000 },
      ],
      totalDebit: 570000,
      totalCredit: 570000,
      postedBy: 'Zainab Bello (Accountant)',
      createdAt: '2026-10-18T13:30:00Z',
    },
  ];

  const employees: Employee[] = [
    {
      id: 'emp-001',
      staffCode: 'NXT-EMP-001',
      fullName: 'Austin Eke',
      phone: '+234 806 123 4567',
      department: 'BAKING',
      designation: 'Production Manager & Master Baker',
      shiftPattern: 'DAY_OFFICE',
      dateEmployed: '2023-01-15',
      basicSalaryNaira: 350000,
      emergencyContact: 'Mrs. Mary Eke (+234 803 999 1111)',
      isActive: true,
    },
    {
      id: 'emp-002',
      staffCode: 'NXT-EMP-002',
      fullName: 'Sani Abdullahi',
      phone: '+234 807 456 7890',
      department: 'BAKING',
      designation: 'Head Baker (Deck & Rotary Oven)',
      shiftPattern: 'ROTATING',
      dateEmployed: '2023-04-10',
      basicSalaryNaira: 180000,
      emergencyContact: 'Aliyu Abdullahi (+234 802 888 2222)',
      isActive: true,
    },
    {
      id: 'emp-003',
      staffCode: 'NXT-EMP-003',
      fullName: 'Grace Chioma Nwachukwu',
      phone: '+234 808 901 2345',
      department: 'QUALITY',
      designation: 'Quality Control Lead (Food Science)',
      shiftPattern: 'DAY_OFFICE',
      dateEmployed: '2023-09-01',
      basicSalaryNaira: 220000,
      emergencyContact: 'Chinedu Nwachukwu (+234 805 777 3333)',
      isActive: true,
    },
    {
      id: 'emp-004',
      staffCode: 'NXT-EMP-004',
      fullName: 'Haruna Garba',
      phone: '+234 809 345 6789',
      department: 'BAKING',
      designation: 'Inventory & Store Controller',
      shiftPattern: 'DAY_OFFICE',
      dateEmployed: '2023-06-01',
      basicSalaryNaira: 160000,
      emergencyContact: 'Ibrahim Garba (+234 806 666 4444)',
      isActive: true,
    },
    {
      id: 'emp-005',
      staffCode: 'NXT-EMP-005',
      fullName: 'Blessing Udoh',
      phone: '+234 816 012 3456',
      department: 'FINANCE',
      designation: 'Head Cashier & POS Auditor',
      shiftPattern: 'MORNING',
      dateEmployed: '2024-02-01',
      basicSalaryNaira: 150000,
      emergencyContact: 'Ekaette Udoh (+234 807 555 5555)',
      isActive: true,
    },
  ];

  const attendanceRecords: AttendanceRecord[] = [
    {
      id: 'att-001',
      employeeId: 'emp-001',
      employeeName: 'Austin Eke',
      department: 'BAKING',
      date: todayStr,
      shift: 'Day Shift (Production Oversight)',
      timeIn: '05:00',
      status: 'PRESENT',
    },
    {
      id: 'att-002',
      employeeId: 'emp-002',
      employeeName: 'Sani Abdullahi',
      department: 'BAKING',
      date: todayStr,
      shift: 'Morning Bake (05:00 - 14:00)',
      timeIn: '04:50',
      status: 'PRESENT',
    },
    {
      id: 'att-003',
      employeeId: 'emp-003',
      employeeName: 'Grace Chioma Nwachukwu',
      department: 'QUALITY',
      date: todayStr,
      shift: 'QC Inspection',
      timeIn: '06:00',
      status: 'PRESENT',
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-001',
      timestamp: '2026-10-18T05:00:00Z',
      actorUserId: 'usr-admin',
      actorUsername: 'admin',
      actorRole: 'SUPER_ADMIN',
      action: 'CREATE',
      entityType: 'PRODUCTION_BATCH',
      entityId: 'po-batch-001',
      description: 'Scheduled batch NXT-20261018-S1-001 for 1,000 Nextar Family Loaves',
    },
    {
      id: 'aud-002',
      timestamp: '2026-10-18T10:00:00Z',
      actorUserId: 'usr-qc',
      actorUsername: 'qc.officer',
      actorRole: 'QC_OFFICER',
      action: 'QC_RELEASE',
      entityType: 'PRODUCTION_BATCH',
      entityId: 'po-batch-001',
      description: 'Approved and released 982 loaves of Nextar Family Loaf to Dispatch Hall after weight & crumb inspection',
    },
    {
      id: 'aud-003',
      timestamp: '2026-10-18T11:45:00Z',
      actorUserId: 'usr-cashier',
      actorUsername: 'cashier.morning',
      actorRole: 'CASHIER',
      action: 'CREATE',
      entityType: 'PAYMENT_RECEIPT',
      entityId: 'pay-001',
      description: 'Posted ₦125,000 POS payment from Kubwa Grand Supermarket for invoice INV-2026-0120',
    },
  ];

  const notifications: SystemNotification[] = [
    {
      id: 'notif-001',
      title: 'Low Stock Alert: Bread Improver',
      message: 'Magimix Super Improver is at 145kg. Minimum reorder threshold is 35kg.',
      severity: 'INFO',
      module: 'INVENTORY',
      timestamp: '2026-10-18T08:00:00Z',
      isRead: false,
    },
    {
      id: 'notif-002',
      title: 'Batch Released: Nextar Family Loaf',
      message: 'Batch NXT-20261018-S1-001 (982 Loaves) passed Quality Control and is ready for dispatch.',
      severity: 'SUCCESS',
      module: 'QUALITY',
      timestamp: '2026-10-18T10:02:00Z',
      isRead: false,
    },
    {
      id: 'notif-003',
      title: 'Credit Limit Monitor',
      message: 'Phase 4 Bread Depot has ₦340,000 outstanding of ₦1,200,000 credit limit (28.3% used).',
      severity: 'INFO',
      module: 'SALES',
      timestamp: '2026-10-18T11:30:00Z',
      isRead: true,
    },
  ];

  return {
    settings,
    users,
    products,
    rawMaterials,
    stockLedger,
    suppliers,
    purchaseOrders,
    goodsReceiptNotes,
    recipes,
    productionOrders,
    qualityControlRecords,
    finishedGoods,
    marketers,
    customers,
    salesInvoices,
    dispatchSheets,
    returnRecords,
    cashierSessions,
    payments,
    operatingExpenses,
    journalEntries,
    employees,
    attendanceRecords,
    auditLogs,
    notifications,
    accessRequests: [],
    sessions: [],
  };
}

// Shift every date in the dataset by whole days: ISO dates/timestamps ("2026-10-18", "2026-10-18T10:15:00Z")
// and compact dates embedded in document codes ("NXT-20261018-S1-001", "CSH-20261018-S1").
function shiftDates<T>(value: T, days: number): T {
  if (days === 0) return value;
  const shiftIso = (y: string, m: string, d: string) => {
    const dt = new Date(Date.UTC(+y, +m - 1, +d + days));
    return dt.toISOString().slice(0, 10);
  };
  const walk = (v: any): any => {
    if (typeof v === 'string') {
      return v
        .replace(/\b(\d{4})-(\d{2})-(\d{2})(?=T|\b)/g, (_, y, m, d) => shiftIso(y, m, d))
        .replace(/(?<=-)(20\d{2})(\d{2})(\d{2})(?=-|$)/g, (_, y, m, d) => shiftIso(y, m, d).replace(/-/g, ''));
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value);
}

// Make every balance in the sample data traceable to an actual record, the same way the
// live system would have produced it: stock from stock movements, product stock from
// finished-goods lots, customer balances from invoices, payables/route balances from journals.
function backBalancesWithRecords(db: DatabaseSchema): DatabaseSchema {
  const today = SEED_ANCHOR_DATE;
  const openingDate = '2026-10-01';
  const openingTs = `${openingDate}T07:00:00Z`;
  const postedBy = 'System Opening Balances';

  // 1. Raw material stock = opening stock count + recorded movements
  for (const rm of db.rawMaterials) {
    const moves = db.stockLedger
      .filter(m => m.rawMaterialId === rm.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const movedNet = moves.reduce((acc, m) => acc + m.quantityDelta, 0);
    const opening = Math.max(0, rm.currentStock - movedNet);
    if (opening > 0) {
      const openingMove = {
        id: `mov-open-${rm.id}`,
        timestamp: openingTs,
        rawMaterialId: rm.id,
        rawMaterialName: rm.name,
        movementType: 'PHYSICAL_COUNT_ADJUSTMENT' as const,
        quantityDelta: opening,
        unit: rm.unitOfMeasure,
        previousBalance: 0,
        newBalance: opening,
        referenceDocNumber: `ADJ-OPEN-${rm.code}`,
        performedBy: postedBy,
        notes: 'Opening stock count on system go-live',
      };
      db.stockLedger.push(openingMove);
      moves.unshift(openingMove);
    }
    let running = 0;
    for (const m of moves) {
      m.previousBalance = running;
      running += m.quantityDelta;
      m.newBalance = running;
    }
    rm.currentStock = running;
  }
  db.stockLedger.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // 2. Product shelf stock = finished-goods lots available for dispatch
  for (const p of db.products) {
    const lotsAvailable = db.finishedGoods
      .filter(fg => fg.productId === p.id)
      .reduce((acc, fg) => acc + fg.quantityAvailableForDispatch, 0);
    const missing = p.currentStockLoaves - lotsAvailable;
    if (missing > 0) {
      const expiry = new Date(Date.parse(today) + Math.max(1, p.shelfLifeDays - 1) * 86400000).toISOString().slice(0, 10);
      db.finishedGoods.push({
        id: `fg-open-${p.id}`,
        productId: p.id,
        productName: p.name,
        batchNumber: `OPEN-${today.replace(/-/g, '')}-${p.code}`,
        productionDate: today,
        expiryDate: expiry,
        quantityProduced: missing,
        quantityAvailableForDispatch: missing,
        quantityReserved: 0,
        quantityDispatched: 0,
        quantityReturned: 0,
        warehouseLocation: 'Dispatch Hall - Opening Stock',
        unitRetailPrice: p.standardRetailPrice,
        status: 'AVAILABLE',
      });
    }
    p.currentStockLoaves = Math.max(p.currentStockLoaves, lotsAvailable);
  }

  // 3. Customer balance = unpaid invoice amounts (older debt carried in as a "balance b/f" invoice)
  let invSeq = 1;
  for (const c of db.customers) {
    const unpaid = db.salesInvoices
      .filter(i => i.customerId === c.id && i.status !== 'CANCELLED')
      .reduce((acc, i) => acc + i.amountDue, 0);
    const carried = c.currentOutstandingBalance - unpaid;
    if (carried > 0) {
      db.salesInvoices.push({
        id: `inv-open-${c.id}`,
        invoiceNumber: `INV-OPEN-${String(invSeq++).padStart(3, '0')}`,
        customerId: c.id,
        customerName: c.businessName,
        marketerId: c.assignedMarketerId,
        marketerName: c.assignedMarketerName,
        invoiceDate: openingDate,
        dueDate: new Date(Date.parse(openingDate) + c.creditDays * 86400000).toISOString().slice(0, 10),
        items: [{ productId: '', productName: 'Balance brought forward', quantity: 1, unitPrice: carried, subtotal: carried }],
        subtotal: carried,
        discountAmount: 0,
        netPayableAmount: carried,
        amountPaid: 0,
        amountDue: carried,
        paymentType: 'CREDIT',
        status: 'POSTED',
        postedBy,
        createdAt: openingTs,
      });
    }
    c.currentOutstandingBalance = Math.max(c.currentOutstandingBalance, unpaid);
  }

  // 4. Supplier payables and marketer route balances = opening journal entries
  let jrnSeq = 1;
  const openingJournal = (narration: string, sourceModule: 'PURCHASE' | 'SALES', debit: [string, string], credit: [string, string], amount: number) => {
    db.journalEntries.push({
      id: `jrn-open-${jrnSeq}`,
      entryNumber: `JRN-OPEN-${String(jrnSeq++).padStart(3, '0')}`,
      date: openingDate,
      narration,
      sourceModule,
      lines: [
        { accountCode: debit[0], accountName: debit[1], debitAmount: amount, creditAmount: 0 },
        { accountCode: credit[0], accountName: credit[1], debitAmount: 0, creditAmount: amount },
      ],
      totalDebit: amount,
      totalCredit: amount,
      postedBy,
      createdAt: openingTs,
    });
  };
  for (const s of db.suppliers) {
    if (s.outstandingPayable > 0) {
      openingJournal(`Opening balance b/f — amount owed to supplier ${s.name}`, 'PURCHASE',
        ['3900', 'Opening Balance Equity'], ['2100', `Accounts Payable - ${s.name}`], s.outstandingPayable);
    }
  }
  for (const m of db.marketers) {
    if (m.currentOwedBalance > 0) {
      openingJournal(`Opening balance b/f — route collections owed by marketer ${m.fullName}`, 'SALES',
        ['1210', `Marketer Route Receivable - ${m.fullName}`], ['3900', 'Opening Balance Equity'], m.currentOwedBalance);
    }
  }

  return db;
}

// Sample Nextar bakery data, dated relative to the real current day, with every balance backed by records.
export function generateSeedData(): DatabaseSchema {
  const realToday = new Date().toISOString().slice(0, 10);
  const days = Math.round((Date.parse(realToday) - Date.parse(SEED_ANCHOR_DATE)) / 86400000);
  return shiftDates(backBalancesWithRecords(buildSampleData()), days);
}

// In-Memory Database with Atomic Disk Persistence
class DatabaseManager {
  private db: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = normalizeSchema(JSON.parse(raw));
        this.isLoaded = true;
        return parsed;
      }
    } catch (e) {
      console.error('[DB] Error loading existing database, creating fresh seed:', e);
    }

    const initial = normalizeSchema(generateSeedData());
    this.saveToDisk(initial);
    this.isLoaded = true;
    return initial;
  }

  private saveToDisk(data: DatabaseSchema): void {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
      console.error('[DB] Atomic write error:', err);
    }
  }

  public persist(): void {
    this.saveToDisk(this.db);
  }

  public getRaw(): DatabaseSchema {
    return this.db;
  }

  public resetToSeed(): DatabaseSchema {
    // Business records are replaced; who-can-do-what (users' access, device sessions, requests) is kept.
    const previous = this.db;
    const fresh = normalizeSchema(generateSeedData());
    for (const u of fresh.users) {
      const old = previous.users.find(p => p.id === u.id);
      if (old) {
        u.permissions = old.permissions;
        u.isActive = old.isActive;
      }
    }
    fresh.users.push(...previous.users.filter(p => !fresh.users.some(u => u.id === p.id)));
    fresh.sessions = previous.sessions;
    fresh.accessRequests = previous.accessRequests;
    this.db = fresh;
    this.persist();
    return this.db;
  }

  public replaceAll(newData: DatabaseSchema): void {
    this.db = newData;
    this.persist();
  }

  private auditSuffixProvider: () => string = () => '';

  // Lets the access layer append "performed by X while viewing as Y" to audit lines
  public setAuditSuffixProvider(fn: () => string): void {
    this.auditSuffixProvider = fn;
  }

  // Helper to record an immutable audit log
  public recordAudit(
    actor: { id: string; username: string; role: UserRole },
    action: AuditLogEntry['action'],
    entityType: string,
    entityId: string,
    description: string,
    beforeSnapshot?: any,
    afterSnapshot?: any
  ): void {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorUserId: actor.id,
      actorUsername: actor.username,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      description: description + this.auditSuffixProvider(),
      beforeSnapshot,
      afterSnapshot,
    };
    this.db.auditLogs.unshift(entry);
    // Keep last 1,000 audit records
    if (this.db.auditLogs.length > 1000) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 1000);
    }
    this.persist();
  }

  // Dashboard Aggregator
  public computeDashboardMetrics(): DashboardMetrics {
    const today = new Date().toISOString().slice(0, 10);

    const todayProdBatches = this.db.productionOrders.filter(b => b.scheduledDate === today || b.createdAt.startsWith(today));
    const todayProductionLoaves = todayProdBatches.reduce((acc, b) => acc + (b.actualGoodLoaves || 0), 0);
    const plannedProductionLoaves = todayProdBatches.reduce((acc, b) => acc + (b.targetLoaves || 0), 0);
    const productionYieldEfficiency = plannedProductionLoaves > 0
      ? Math.round((todayProductionLoaves / plannedProductionLoaves) * 100 * 10) / 10
      : 0;

    const finishedGoodsStockLoaves = this.db.finishedGoods.reduce((acc, fg) => acc + (fg.quantityAvailableForDispatch || 0), 0);
    const finishedGoodsReadyForDispatch = this.db.finishedGoods.filter(fg => fg.status === 'AVAILABLE').reduce((acc, fg) => acc + (fg.quantityAvailableForDispatch || 0), 0);
    const finishedGoodsOnHoldQC = this.db.productionOrders.filter(p => p.status === 'AWAITING_QC' || p.qcStatus === 'ON_HOLD').reduce((acc, p) => acc + (p.actualGoodLoaves || p.targetLoaves || 0), 0);

    const rawMaterialsTotalValuation = this.db.rawMaterials.reduce((acc, rm) => acc + (rm.currentStock * rm.standardCostPerUnit), 0);
    const lowStockItemsCount = this.db.rawMaterials.filter(rm => rm.currentStock <= rm.minimumStockAlert).length;

    const todayInvoices = this.db.salesInvoices.filter(inv => inv.invoiceDate === today || inv.createdAt.startsWith(today));
    const todaySalesInvoicedNaira = todayInvoices.reduce((acc, inv) => acc + inv.netPayableAmount, 0);

    const todayPayments = this.db.payments.filter(p => p.paymentDate === today || p.createdAt.startsWith(today));
    const todaySalesCashCollectedNaira = todayPayments.filter(p => !p.isReversed).reduce((acc, p) => acc + p.amountPaid, 0);

    const todayDispatches = this.db.dispatchSheets.filter(d => d.date === today || d.createdAt.startsWith(today));
    const todayDispatchedLoaves = todayDispatches.reduce((acc, d) => acc + d.totalLoavesDelivered, 0);
    const todayReturnedLoaves = todayDispatches.reduce((acc, d) => acc + d.totalLoavesReturned, 0);
    const todayReturnsWastagePercent = todayDispatchedLoaves > 0
      ? Math.round((todayReturnedLoaves / (todayDispatchedLoaves + todayReturnedLoaves)) * 100 * 10) / 10
      : 0;

    const totalReceivablesDebtorsNaira = this.db.customers.reduce((acc, c) => acc + c.currentOutstandingBalance, 0);
    const totalPayablesCreditorsNaira = this.db.suppliers.reduce((acc, s) => acc + s.outstandingPayable, 0);

    const todayExpenses = this.db.operatingExpenses.filter(e => (e.expenseDate === today || e.createdAt.startsWith(today)) && e.status !== 'REJECTED');
    const todayOperatingExpensesNaira = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Approximate Gross Margin (Invoiced sales - est 60% COGS)
    const estimatedCOGS = todaySalesInvoicedNaira * 0.58;
    const estimatedGrossProfitTodayNaira = Math.max(0, todaySalesInvoicedNaira - estimatedCOGS - todayOperatingExpensesNaira);

    const pendingApprovalsCount =
      this.db.purchaseOrders.filter(p => p.status === 'SUBMITTED').length +
      this.db.productionOrders.filter(p => p.status === 'AWAITING_QC').length +
      this.db.operatingExpenses.filter(e => e.status === 'SUBMITTED').length;

    const activeCashierSessionsOpen = this.db.cashierSessions.filter(c => c.status === 'OPEN').length;
    const unreconciledDispatchesCount = this.db.dispatchSheets.filter(d => d.status !== 'RECONCILED').length;

    const recentActivity = this.db.auditLogs.slice(0, 6).map(a => ({
      id: a.id,
      time: a.timestamp,
      action: a.description,
      badge: a.action,
      user: a.actorUsername,
    }));

    return {
      todayProductionLoaves,
      plannedProductionLoaves,
      productionYieldEfficiency,
      finishedGoodsStockLoaves,
      finishedGoodsReadyForDispatch,
      finishedGoodsOnHoldQC,
      rawMaterialsTotalValuation,
      lowStockItemsCount,
      todaySalesInvoicedNaira,
      todaySalesCashCollectedNaira,
      todayDispatchedLoaves,
      todayReturnedLoaves,
      todayReturnsWastagePercent,
      totalReceivablesDebtorsNaira,
      totalPayablesCreditorsNaira,
      todayOperatingExpensesNaira,
      estimatedGrossProfitTodayNaira,
      pendingApprovalsCount,
      activeCashierSessionsOpen,
      unreconciledDispatchesCount,
      recentActivity,
    };
  }
}

export const dbManager = new DatabaseManager();
