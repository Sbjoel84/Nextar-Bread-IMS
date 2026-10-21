// Permission catalog shared by the server (enforcement) and the client (navigation, Admin Panel).
// A permission is either access to a page ("page:<tab>") or the right to perform an action.
import type { User, UserRole } from '../types/erp';

export type PermissionKind = 'PAGE' | 'ACTION' | 'ADMIN';

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
  kind: PermissionKind;
  description: string;
}

const page = (tab: string, label: string, group: string): PermissionDef => ({
  key: `page:${tab}`,
  label,
  group,
  kind: 'PAGE',
  description: `Open the ${label} page`,
});

const action = (key: string, label: string, group: string, description: string): PermissionDef => ({
  key,
  label,
  group,
  kind: 'ACTION',
  description,
});

export const PERMISSIONS: PermissionDef[] = [
  // Pages
  page('dashboard', 'Executive Dashboard', 'Overview'),
  page('recipes', 'Recipes & Formulas', 'Bakery Operations'),
  page('production', 'Production & Baking', 'Bakery Operations'),
  page('quality-control', 'Quality & Traceability', 'Bakery Operations'),
  page('finished-goods', 'Finished Goods (FEFO)', 'Bakery Operations'),
  page('products', 'Bread Product Catalogue', 'Inventory & Procurement'),
  page('raw-materials', 'Raw Materials & Stock', 'Inventory & Procurement'),
  page('procurement', 'Suppliers & POs/GRN', 'Inventory & Procurement'),
  page('marketers', 'Marketers & Routes', 'Sales & Distribution'),
  page('customers', 'Customers & Debtors', 'Sales & Distribution'),
  page('sales-invoices', 'Sales & Invoicing', 'Sales & Distribution'),
  page('dispatches', 'Dispatches & Loading', 'Sales & Distribution'),
  page('returns', 'Returns & Wastage', 'Sales & Distribution'),
  page('cashier', 'Cashier Sessions', 'Finance & Governance'),
  page('payments', 'Customer Receipts', 'Finance & Governance'),
  page('finance', 'Expenses & Costing', 'Finance & Governance'),
  page('employees', 'Employees & Rota', 'Finance & Governance'),
  page('reports', 'Reports & Analytics', 'Finance & Governance'),
  page('audit-logs', 'Immutable Audit Log', 'System & Governance'),
  page('settings', 'Bakery Settings', 'System & Governance'),

  // Actions
  action('recipes.manage', 'Create recipes', 'Bakery Operations', 'Add new bread formulas'),
  action('production.launch', 'Launch baking batches', 'Bakery Operations', 'Start a batch and issue ingredients from stock'),
  action('production.output', 'Record batch output', 'Bakery Operations', 'Enter good loaves, rejects and downtime'),
  action('qc.decide', 'QC release / hold / reject', 'Bakery Operations', 'Sign QC decisions that release loaves for sale'),
  action('products.manage', 'Manage products & prices', 'Inventory & Procurement', 'Create bread products and change prices'),
  action('materials.manage', 'Manage raw materials', 'Inventory & Procurement', 'Register new raw materials'),
  action('stock.adjust', 'Post stock count adjustments', 'Inventory & Procurement', 'Correct raw-material stock after a physical count'),
  action('suppliers.manage', 'Manage suppliers', 'Inventory & Procurement', 'Register suppliers'),
  action('po.create', 'Raise purchase orders', 'Inventory & Procurement', 'Create purchase orders'),
  action('po.approve', 'Approve purchase orders', 'Inventory & Procurement', 'Approve POs above the approval threshold'),
  action('grn.post', 'Post goods receipts (GRN)', 'Inventory & Procurement', 'Receive goods into stock'),
  action('marketers.manage', 'Manage marketers', 'Sales & Distribution', 'Register marketers and routes'),
  action('customers.manage', 'Manage customers', 'Sales & Distribution', 'Register customers, price tiers and credit limits'),
  action('invoices.create', 'Create sales invoices', 'Sales & Distribution', 'Invoice customers'),
  action('dispatch.create', 'Create loading sheets', 'Sales & Distribution', 'Load vans and take loaves out of finished goods'),
  action('dispatch.reconcile', 'Reconcile deliveries', 'Sales & Distribution', 'Record delivered/returned loaves and route collections'),
  action('returns.log', 'Log returns & wastage', 'Sales & Distribution', 'Record returned bread, disposition and credit notes'),
  action('cashier.open', 'Open cashier sessions', 'Finance & Governance', 'Open a cash drawer with a float'),
  action('cashier.close', 'Close & verify cashier sessions', 'Finance & Governance', 'Count the drawer and record the variance'),
  action('payments.record', 'Record customer payments', 'Finance & Governance', 'Issue receipts against customer balances'),
  action('expenses.create', 'Post expense vouchers', 'Finance & Governance', 'Record operating expenses'),
  action('journal.post', 'Post journal entries', 'Finance & Governance', 'Post manual double-entry journals'),
  action('employees.manage', 'Manage employees', 'Finance & Governance', 'Register staff'),
  action('attendance.mark', 'Mark attendance', 'Finance & Governance', 'Record shift attendance'),
  action('settings.manage', 'Change bakery settings', 'System & Governance', 'Edit company details, thresholds and controls'),

  // Administration
  {
    key: 'access.approve',
    label: 'Approve access requests',
    group: 'Administration',
    kind: 'ADMIN',
    description: 'Approve or reject other users’ requests for access (never their own)',
  },
  {
    key: 'admin.users',
    label: 'Manage users & permissions',
    group: 'Administration',
    kind: 'ADMIN',
    description: 'Grant and remove any permission, activate/deactivate users. Super Admin only.',
  },
  {
    key: 'system.reset',
    label: 'Reset database',
    group: 'Administration',
    kind: 'ADMIN',
    description: 'Replace all records with the sample data set. Super Admin only.',
  },
];

export const PERMISSION_KEYS = PERMISSIONS.map(p => p.key);
export const SUPER_ADMIN_ONLY = new Set(['admin.users', 'system.reset']);

export const permissionLabel = (key: string) => PERMISSIONS.find(p => p.key === key)?.label || key;

const pages = (...tabs: string[]) => tabs.map(t => `page:${t}`);
const ALL_PAGES = PERMISSIONS.filter(p => p.kind === 'PAGE').map(p => p.key);

// Default permissions a role starts with. The Super Admin can change any user's set afterwards.
export const ROLE_TEMPLATES: Record<UserRole, string[]> = {
  SUPER_ADMIN: [...PERMISSION_KEYS],
  MANAGING_DIRECTOR: [...ALL_PAGES.filter(p => p !== 'page:settings'), 'po.approve', 'access.approve'],
  GENERAL_MANAGER: [
    ...ALL_PAGES,
    'po.approve', 'access.approve', 'settings.manage', 'employees.manage', 'attendance.mark', 'cashier.close',
  ],
  PRODUCTION_MANAGER: [
    ...pages('dashboard', 'recipes', 'production', 'quality-control', 'finished-goods', 'raw-materials', 'reports', 'employees'),
    'recipes.manage', 'production.launch', 'production.output', 'attendance.mark',
  ],
  PRODUCTION_OFFICER: [
    ...pages('dashboard', 'recipes', 'production', 'finished-goods'),
    'production.launch', 'production.output',
  ],
  QC_OFFICER: [
    ...pages('dashboard', 'production', 'quality-control', 'finished-goods', 'returns'),
    'qc.decide',
  ],
  STOREKEEPER: [
    ...pages('dashboard', 'raw-materials', 'procurement', 'finished-goods'),
    'stock.adjust', 'grn.post', 'materials.manage',
  ],
  PROCUREMENT_OFFICER: [
    ...pages('dashboard', 'procurement', 'raw-materials'),
    'po.create', 'suppliers.manage',
  ],
  SALES_MANAGER: [
    ...pages('dashboard', 'products', 'marketers', 'customers', 'sales-invoices', 'dispatches', 'returns', 'payments', 'reports'),
    'products.manage', 'marketers.manage', 'customers.manage', 'invoices.create',
  ],
  MARKETER: [
    ...pages('dashboard', 'customers', 'sales-invoices', 'returns'),
    'returns.log',
  ],
  DISTRIBUTOR: [...pages('dashboard', 'sales-invoices')],
  DISPATCH_OFFICER: [
    ...pages('dashboard', 'finished-goods', 'dispatches', 'returns'),
    'dispatch.create', 'dispatch.reconcile', 'returns.log',
  ],
  ACCOUNTANT: [
    ...pages('dashboard', 'procurement', 'customers', 'sales-invoices', 'cashier', 'payments', 'finance', 'reports'),
    'payments.record', 'expenses.create', 'journal.post', 'cashier.close',
  ],
  CASHIER: [
    ...pages('dashboard', 'sales-invoices', 'cashier', 'payments'),
    'cashier.open', 'payments.record',
  ],
  AUDITOR: [...ALL_PAGES.filter(p => p !== 'page:settings')],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGING_DIRECTOR: 'Managing Director',
  GENERAL_MANAGER: 'General Manager',
  PRODUCTION_MANAGER: 'Production Manager',
  PRODUCTION_OFFICER: 'Production Officer',
  QC_OFFICER: 'QC Officer',
  STOREKEEPER: 'Storekeeper',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  SALES_MANAGER: 'Sales Manager',
  MARKETER: 'Marketer',
  DISTRIBUTOR: 'Distributor',
  DISPATCH_OFFICER: 'Dispatch Officer',
  ACCOUNTANT: 'Accountant',
  CASHIER: 'Cashier',
  AUDITOR: 'Auditor',
};

export const isSuperAdmin = (user?: Pick<User, 'role'> | null) => user?.role === 'SUPER_ADMIN';

export function hasPermission(user: Pick<User, 'role' | 'permissions' | 'isActive'> | null | undefined, key: string): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (SUPER_ADMIN_ONLY.has(key)) return false;
  return (user.permissions || []).includes(key);
}

export const canOpenPage = (user: Parameters<typeof hasPermission>[0], tab: string) => {
  if (tab === 'my-access') return Boolean(user?.isActive);
  if (tab === 'admin') return hasPermission(user, 'admin.users') || hasPermission(user, 'access.approve');
  return hasPermission(user, `page:${tab}`);
};
