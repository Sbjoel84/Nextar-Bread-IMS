// Access control: device sessions, per-request user context, permission enforcement,
// the Admin Panel API (users & permissions) and the access-request workflow.
import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';
import { NextFunction, Request, Response, Router } from 'express';
import { dbManager } from './db';
import { AccessRequest, DeviceSession, User, UserRole } from '../types/erp';
import {
  PERMISSION_KEYS,
  ROLE_TEMPLATES,
  SUPER_ADMIN_ONLY,
  hasPermission,
  isSuperAdmin,
  permissionLabel,
} from '../shared/permissions';

const COOKIE = 'nextar_device';
const COOKIE_MAX_AGE_DAYS = 365;

interface RequestContext {
  session: DeviceSession | null;
  user: User | null;     // who the system acts as
  realUser: User | null; // who is actually at the device (differs while a Super Admin views as someone else)
}

const context = new AsyncLocalStorage<RequestContext>();

export const getContext = (): RequestContext => context.getStore() || { session: null, user: null, realUser: null };

// The user every route acts as. Routes behind the guard always have one.
export function getCurrentUser(): User {
  const user = getContext().user;
  if (!user) throw new Error('No authenticated user in request context');
  return user;
}

dbManager.setAuditSuffixProvider(() => {
  const { user, realUser } = getContext();
  return user && realUser && user.id !== realUser.id ? ` [performed by ${realUser.fullName} while viewing as ${user.fullName}]` : '';
});

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

function setDeviceCookie(res: Response, sessionId: string) {
  res.cookie(COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE_DAYS * 86400000, path: '/' });
}

// Public view of a user (no internal fields other screens don't need)
export const publicUser = (u: User) => ({
  id: u.id,
  username: u.username,
  fullName: u.fullName,
  email: u.email,
  phone: u.phone,
  role: u.role,
  branch: u.branch,
  isActive: u.isActive,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
  permissions: u.permissions || [],
});

// 1. Resolve the device session for every API request and run the rest of the request inside it.
export function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  const db = dbManager.getRaw();
  const sid = readCookie(req, COOKIE);
  const session = sid ? db.sessions.find(s => s.id === sid) || null : null;
  let user: User | null = null;
  let realUser: User | null = null;
  if (session) {
    user = db.users.find(u => u.id === session.userId) || null;
    realUser = session.impersonatorId ? db.users.find(u => u.id === session.impersonatorId) || null : user;
    session.lastSeenAt = new Date().toISOString();
  }
  context.run({ session, user, realUser }, () => next());
}

// 2. Which permission each business endpoint needs. Anything not listed only needs a signed-in, active user.
const RULES: { method: string; path: RegExp; permission: string }[] = [
  { method: 'POST', path: /^\/products$/, permission: 'products.manage' },
  { method: 'PUT', path: /^\/products\/[^/]+$/, permission: 'products.manage' },
  { method: 'POST', path: /^\/raw-materials$/, permission: 'materials.manage' },
  { method: 'POST', path: /^\/stock-ledger\/adjust$/, permission: 'stock.adjust' },
  { method: 'POST', path: /^\/suppliers$/, permission: 'suppliers.manage' },
  { method: 'POST', path: /^\/procurement\/orders$/, permission: 'po.create' },
  { method: 'PUT', path: /^\/procurement\/orders\/[^/]+\/approve$/, permission: 'po.approve' },
  { method: 'POST', path: /^\/procurement\/grn$/, permission: 'grn.post' },
  { method: 'POST', path: /^\/recipes$/, permission: 'recipes.manage' },
  { method: 'POST', path: /^\/production\/orders$/, permission: 'production.launch' },
  { method: 'PUT', path: /^\/production\/orders\/[^/]+\/complete$/, permission: 'production.output' },
  { method: 'POST', path: /^\/quality-control$/, permission: 'qc.decide' },
  { method: 'POST', path: /^\/marketers$/, permission: 'marketers.manage' },
  { method: 'POST', path: /^\/customers$/, permission: 'customers.manage' },
  { method: 'POST', path: /^\/sales\/invoices$/, permission: 'invoices.create' },
  { method: 'POST', path: /^\/dispatches$/, permission: 'dispatch.create' },
  { method: 'PUT', path: /^\/dispatches\/[^/]+\/reconcile$/, permission: 'dispatch.reconcile' },
  { method: 'POST', path: /^\/returns$/, permission: 'returns.log' },
  { method: 'POST', path: /^\/cashier\/sessions\/open$/, permission: 'cashier.open' },
  { method: 'PUT', path: /^\/cashier\/sessions\/[^/]+\/close$/, permission: 'cashier.close' },
  { method: 'POST', path: /^\/payments$/, permission: 'payments.record' },
  { method: 'POST', path: /^\/expenses$/, permission: 'expenses.create' },
  { method: 'POST', path: /^\/journal$/, permission: 'journal.post' },
  { method: 'POST', path: /^\/employees$/, permission: 'employees.manage' },
  { method: 'POST', path: /^\/attendance$/, permission: 'attendance.mark' },
  { method: 'PUT', path: /^\/settings$/, permission: 'settings.manage' },
  { method: 'GET', path: /^\/system\/backup$/, permission: 'settings.manage' },
  { method: 'POST', path: /^\/system\/reset-demo$/, permission: 'system.reset' },
  // Read endpoints for a single page
  { method: 'GET', path: /^\/audit-logs$/, permission: 'page:audit-logs' },
  { method: 'GET', path: /^\/stock-ledger$/, permission: 'page:raw-materials' },
  { method: 'GET', path: /^\/journal$/, permission: 'page:finance' },
  { method: 'GET', path: /^\/expenses$/, permission: 'page:finance' },
  { method: 'GET', path: /^\/finance\/costing$/, permission: 'page:finance' },
  { method: 'GET', path: /^\/employees$/, permission: 'page:employees' },
  { method: 'GET', path: /^\/attendance$/, permission: 'page:employees' },
  { method: 'GET', path: /^\/cashier\/sessions$/, permission: 'page:cashier' },
];

const PUBLIC_PATHS = new Set(['/auth/session', '/auth/device-users', '/auth/claim-device']);

function deny(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ success: false, code, message });
}

// 3. Block requests from unassigned devices, inactive users, and users without the needed permission.
export function permissionGuard(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_PATHS.has(req.path)) return next();
  const { user } = getContext();
  if (!user) return deny(res, 401, 'NO_SESSION', 'This device is not assigned to a user. Select your account to continue.');
  if (!user.isActive) return deny(res, 403, 'INACTIVE', 'Your account has been deactivated. Contact the Super Admin.');
  const rule = RULES.find(r => r.method === req.method && r.path.test(req.path));
  if (rule && !hasPermission(user, rule.permission)) {
    return deny(res, 403, 'FORBIDDEN', `You do not have permission to: ${permissionLabel(rule.permission)}. Request it from My Access.`);
  }
  next();
}

// ---------------------------------------------------------------------------
// Auth, Admin Panel and Access Request endpoints
// ---------------------------------------------------------------------------
export const accessRouter = Router();

const canApproveRequests = (u: User | null) => hasPermission(u, 'access.approve');
const canManageUsers = (u: User | null) => hasPermission(u, 'admin.users');

function nextRequestNumber(existing: string[]): string {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^ACR-${year}-(\\d+)$`);
  const highest = existing.reduce((max, num) => {
    const m = pattern.exec(num || '');
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `ACR-${year}-${String(highest + 1).padStart(4, '0')}`;
}

const validGrantable = (keys: unknown): string[] =>
  Array.isArray(keys) ? Array.from(new Set(keys.filter((k): k is string => typeof k === 'string' && PERMISSION_KEYS.includes(k) && !SUPER_ADMIN_ONLY.has(k)))) : [];

const activeSuperAdmins = () => dbManager.getRaw().users.filter(u => u.role === 'SUPER_ADMIN' && u.isActive);

// Without passwords, a Super Admin account may be claimed by a device only while no device holds a
// Super Admin session (first setup, or after the Super Admin released their device).
function superAdminClaimable(): boolean {
  const db = dbManager.getRaw();
  const adminIds = new Set(activeSuperAdmins().map(u => u.id));
  return !db.sessions.some(s => adminIds.has(s.userId) || (s.impersonatorId !== undefined && adminIds.has(s.impersonatorId)));
}

// --- Device session ---------------------------------------------------------
accessRouter.get('/auth/session', (req, res) => {
  const { user, realUser } = getContext();
  res.json({
    success: true,
    user: user ? publicUser(user) : null,
    realUser: realUser ? publicUser(realUser) : null,
    impersonating: Boolean(user && realUser && user.id !== realUser.id),
  });
});

// Accounts a not-yet-assigned device can be claimed by (or that a Super Admin can switch into)
accessRouter.get('/auth/device-users', (req, res) => {
  const { session, realUser } = getContext();
  if (session && !isSuperAdmin(realUser)) return deny(res, 403, 'ASSIGNED', 'This device is already assigned.');
  const hideAdmins = !session && !superAdminClaimable();
  const users = dbManager.getRaw().users
    .filter(u => u.isActive && !(hideAdmins && isSuperAdmin(u)))
    .map(u => ({ id: u.id, fullName: u.fullName, role: u.role, username: u.username }));
  res.json({ success: true, users });
});

accessRouter.post('/auth/claim-device', (req, res) => {
  const db = dbManager.getRaw();
  const { session } = getContext();
  if (session) {
    const owner = db.users.find(u => u.id === session.userId);
    return deny(res, 409, 'ASSIGNED', `This device is already assigned to ${owner?.fullName || 'another user'}. Ask the Super Admin to release it.`);
  }
  const target = db.users.find(u => u.id === req.body.userId);
  if (!target || !target.isActive) return deny(res, 404, 'NOT_FOUND', 'Account not found or deactivated.');
  if (isSuperAdmin(target) && !superAdminClaimable()) {
    return deny(res, 403, 'FORBIDDEN', 'The Super Admin account is already in use on another device.');
  }

  const now = new Date().toISOString();
  const newSession: DeviceSession = { id: crypto.randomBytes(24).toString('hex'), userId: target.id, createdAt: now, lastSeenAt: now };
  db.sessions.push(newSession);
  target.lastLoginAt = now;
  dbManager.persist();
  dbManager.recordAudit(target, 'CREATE', 'DEVICE_SESSION', target.id, `Device assigned to ${target.fullName} (${target.role})`);
  setDeviceCookie(res, newSession.id);
  res.json({ success: true, user: publicUser(target) });
});

// Super Admin only: act as another user (to test their access), or back to themself
accessRouter.post('/auth/switch-user', (req, res) => {
  const db = dbManager.getRaw();
  const { session, realUser } = getContext();
  if (!session || !isSuperAdmin(realUser)) return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can switch users.');
  const target = db.users.find(u => u.id === req.body.userId);
  if (!target || !target.isActive) return deny(res, 404, 'NOT_FOUND', 'Account not found or deactivated.');

  if (target.id === realUser!.id) {
    session.userId = realUser!.id;
    session.impersonatorId = undefined;
  } else {
    session.userId = target.id;
    session.impersonatorId = realUser!.id;
  }
  dbManager.persist();
  dbManager.recordAudit(realUser!, 'UPDATE', 'DEVICE_SESSION', target.id,
    target.id === realUser!.id ? `${realUser!.fullName} returned to their own account` : `${realUser!.fullName} started viewing the system as ${target.fullName} (${target.role})`);
  res.json({ success: true, user: publicUser(target) });
});

// Super Admin only: unassign this device (it will ask for an account again)
accessRouter.post('/auth/release-device', (req, res) => {
  const db = dbManager.getRaw();
  const { session, realUser } = getContext();
  if (!session || !isSuperAdmin(realUser)) return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can release a device.');
  db.sessions = db.sessions.filter(s => s.id !== session.id);
  dbManager.persist();
  dbManager.recordAudit(realUser!, 'DELETE', 'DEVICE_SESSION', realUser!.id, `${realUser!.fullName} released this device`);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ success: true });
});

// --- Admin Panel: users & permissions --------------------------------------------
accessRouter.get('/admin/users', (req, res) => {
  const { user } = getContext();
  if (!canManageUsers(user) && !canApproveRequests(user)) return deny(res, 403, 'FORBIDDEN', 'You do not have access to the Admin Panel.');
  const db = dbManager.getRaw();
  const users = db.users.map(u => ({
    ...publicUser(u),
    activeDevices: db.sessions.filter(s => s.userId === u.id).length,
  }));
  res.json({ success: true, users });
});

accessRouter.post('/admin/users', (req, res) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  if (!canManageUsers(actor)) return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can create users.');
  const role = req.body.role as UserRole;
  const fullName = String(req.body.fullName || '').trim();
  const username = String(req.body.username || '').trim().toLowerCase();
  if (!fullName || !username) return deny(res, 400, 'INVALID', 'Full name and username are required.');
  if (!ROLE_TEMPLATES[role]) return deny(res, 400, 'INVALID', 'Choose a valid role.');
  if (db.users.some(u => u.username.toLowerCase() === username)) return deny(res, 400, 'INVALID', `Username "${username}" is already taken.`);

  const newUser: User = {
    id: `usr-${Date.now()}`,
    username,
    fullName,
    email: String(req.body.email || ''),
    phone: String(req.body.phone || ''),
    role,
    branch: String(req.body.branch || 'Kubwa Central'),
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: [...ROLE_TEMPLATES[role]],
  };
  db.users.push(newUser);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'USER', newUser.id, `Created user ${newUser.fullName} (${role}) with the ${role} permission template`);
  res.status(201).json({ success: true, user: publicUser(newUser) });
});

accessRouter.put('/admin/users/:id/permissions', (req, res) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  if (!canManageUsers(actor)) return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can change permissions.');
  const target = db.users.find(u => u.id === req.params.id);
  if (!target) return deny(res, 404, 'NOT_FOUND', 'User not found.');
  if (isSuperAdmin(target)) return deny(res, 400, 'INVALID', 'A Super Admin always has every permission.');

  const before = target.permissions || [];
  const after = validGrantable(req.body.permissions);
  const granted = after.filter(k => !before.includes(k));
  const removed = before.filter(k => !after.includes(k));
  target.permissions = after;
  dbManager.persist();
  if (granted.length || removed.length) {
    const parts = [
      granted.length ? `granted ${granted.map(permissionLabel).join(', ')}` : '',
      removed.length ? `removed ${removed.map(permissionLabel).join(', ')}` : '',
    ].filter(Boolean);
    dbManager.recordAudit(actor, 'UPDATE', 'USER_PERMISSIONS', target.id, `Access for ${target.fullName}: ${parts.join('; ')}`, { permissions: before }, { permissions: after });
  }
  res.json({ success: true, user: publicUser(target), granted, removed });
});

accessRouter.put('/admin/users/:id/role', (req, res) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  if (!canManageUsers(actor)) return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can change roles.');
  const target = db.users.find(u => u.id === req.params.id);
  const role = req.body.role as UserRole;
  if (!target) return deny(res, 404, 'NOT_FOUND', 'User not found.');
  if (!ROLE_TEMPLATES[role]) return deny(res, 400, 'INVALID', 'Choose a valid role.');
  if (target.id === actor.id) return deny(res, 400, 'INVALID', 'You cannot change your own role.');
  if (isSuperAdmin(target) && role !== 'SUPER_ADMIN' && activeSuperAdmins().length <= 1) {
    return deny(res, 400, 'INVALID', 'There must always be at least one active Super Admin.');
  }
  const beforeRole = target.role;
  target.role = role;
  if (req.body.applyTemplate) target.permissions = [...ROLE_TEMPLATES[role]];
  dbManager.persist();
  dbManager.recordAudit(actor, 'UPDATE', 'USER_ROLE', target.id,
    `Changed ${target.fullName}'s role from ${beforeRole} to ${role}${req.body.applyTemplate ? ' and applied the role’s default permissions' : ''}`);
  res.json({ success: true, user: publicUser(target) });
});

accessRouter.put('/admin/users/:id/status', (req, res) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  if (!canManageUsers(actor)) return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can activate or deactivate users.');
  const target = db.users.find(u => u.id === req.params.id);
  if (!target) return deny(res, 404, 'NOT_FOUND', 'User not found.');
  const isActive = Boolean(req.body.isActive);
  if (!isActive && target.id === getContext().realUser?.id) return deny(res, 400, 'INVALID', 'You cannot deactivate your own account.');
  if (!isActive && isSuperAdmin(target) && activeSuperAdmins().length <= 1) {
    return deny(res, 400, 'INVALID', 'There must always be at least one active Super Admin.');
  }
  target.isActive = isActive;
  if (!isActive) db.sessions = db.sessions.filter(s => s.userId !== target.id && s.impersonatorId !== target.id);
  dbManager.persist();
  dbManager.recordAudit(actor, 'UPDATE', 'USER_STATUS', target.id, `${isActive ? 'Activated' : 'Deactivated'} ${target.fullName}${isActive ? '' : ' and signed out their devices'}`);
  res.json({ success: true, user: publicUser(target) });
});

accessRouter.delete('/admin/users/:id/sessions', (req, res) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  if (!canManageUsers(actor)) return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can sign out devices.');
  const target = db.users.find(u => u.id === req.params.id);
  if (!target) return deny(res, 404, 'NOT_FOUND', 'User not found.');
  const mine = getContext().session?.id;
  const count = db.sessions.filter(s => s.userId === target.id && s.id !== mine).length;
  db.sessions = db.sessions.filter(s => s.userId !== target.id || s.id === mine);
  dbManager.persist();
  dbManager.recordAudit(actor, 'DELETE', 'DEVICE_SESSION', target.id, `Released ${count} device(s) assigned to ${target.fullName}`);
  res.json({ success: true, released: count });
});

// --- Access requests ---------------------------------------------------------
export function visibleAccessRequests(user: User | null): AccessRequest[] {
  const all = dbManager.getRaw().accessRequests;
  if (!user) return [];
  return canApproveRequests(user) ? all : all.filter(r => r.requesterId === user.id);
}

accessRouter.get('/access-requests', (req, res) => {
  res.json({ success: true, requests: visibleAccessRequests(getContext().user) });
});

accessRouter.post('/access-requests', (req, res) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const reason = String(req.body.reason || '').trim();
  const wanted = validGrantable(req.body.permissions).filter(k => !hasPermission(actor, k));
  if (wanted.length === 0) return deny(res, 400, 'INVALID', 'Choose at least one permission you do not already have.');
  if (reason.length < 5) return deny(res, 400, 'INVALID', 'Explain why you need this access.');
  const alreadyPending = wanted.filter(k => db.accessRequests.some(r => r.requesterId === actor.id && r.status === 'PENDING' && r.permissions.includes(k)));
  if (alreadyPending.length) return deny(res, 400, 'INVALID', `You already have a pending request for: ${alreadyPending.map(permissionLabel).join(', ')}.`);

  const request: AccessRequest = {
    id: `acr-${Date.now()}`,
    requestNumber: nextRequestNumber(db.accessRequests.map(r => r.requestNumber)),
    requesterId: actor.id,
    requesterName: actor.fullName,
    requesterRole: actor.role,
    permissions: wanted,
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  db.accessRequests.unshift(request);
  dbManager.persist();
  dbManager.recordAudit(actor, 'CREATE', 'ACCESS_REQUEST', request.id, `${actor.fullName} requested access (${request.requestNumber}): ${wanted.map(permissionLabel).join(', ')}`);
  res.status(201).json({ success: true, request });
});

function loadPendingForDecision(req: Request, res: Response): { request: AccessRequest; actor: User } | null {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  if (!canApproveRequests(actor)) { deny(res, 403, 'FORBIDDEN', 'You are not an access-request approver.'); return null; }
  const request = db.accessRequests.find(r => r.id === req.params.id);
  if (!request) { deny(res, 404, 'NOT_FOUND', 'Access request not found.'); return null; }
  if (request.status !== 'PENDING') { deny(res, 400, 'INVALID', `This request is already ${request.status.toLowerCase()}.`); return null; }
  if (request.requesterId === actor.id || request.requesterId === getContext().realUser?.id) {
    deny(res, 403, 'FORBIDDEN', 'You cannot decide your own access request.');
    return null;
  }
  return { request, actor };
}

accessRouter.put('/access-requests/:id/approve', (req, res) => {
  const loaded = loadPendingForDecision(req, res);
  if (!loaded) return;
  const { request, actor } = loaded;
  const db = dbManager.getRaw();
  const requester = db.users.find(u => u.id === request.requesterId);
  if (!requester || !requester.isActive) return deny(res, 400, 'INVALID', 'The requester no longer has an active account.');

  // An approver may grant all or some of what was asked; only a Super Admin may create new approvers.
  const chosen = req.body.permissions ? validGrantable(req.body.permissions).filter(k => request.permissions.includes(k)) : request.permissions;
  if (chosen.length === 0) return deny(res, 400, 'INVALID', 'Select at least one requested permission to grant, or reject the request.');
  if (chosen.includes('access.approve') && !isSuperAdmin(actor)) {
    return deny(res, 403, 'FORBIDDEN', 'Only the Super Admin can make someone an access-request approver.');
  }

  requester.permissions = Array.from(new Set([...(requester.permissions || []), ...chosen]));
  request.status = 'APPROVED';
  request.decidedById = actor.id;
  request.decidedByName = actor.fullName;
  request.decidedAt = new Date().toISOString();
  request.decisionNote = String(req.body.note || '').trim() +
    (chosen.length < request.permissions.length ? ` (granted ${chosen.length} of ${request.permissions.length})` : '');
  dbManager.persist();
  dbManager.recordAudit(actor, 'APPROVE', 'ACCESS_REQUEST', request.id,
    `Approved ${request.requestNumber} for ${requester.fullName}: granted ${chosen.map(permissionLabel).join(', ')}`);
  res.json({ success: true, request, granted: chosen });
});

accessRouter.put('/access-requests/:id/reject', (req, res) => {
  const loaded = loadPendingForDecision(req, res);
  if (!loaded) return;
  const { request, actor } = loaded;
  const note = String(req.body.note || '').trim();
  if (note.length < 3) return deny(res, 400, 'INVALID', 'Give the requester a reason for the rejection.');
  request.status = 'REJECTED';
  request.decidedById = actor.id;
  request.decidedByName = actor.fullName;
  request.decidedAt = new Date().toISOString();
  request.decisionNote = note;
  dbManager.persist();
  dbManager.recordAudit(actor, 'REVERSE', 'ACCESS_REQUEST', request.id, `Rejected ${request.requestNumber} from ${request.requesterName}: ${note}`);
  res.json({ success: true, request });
});

accessRouter.put('/access-requests/:id/cancel', (req, res) => {
  const db = dbManager.getRaw();
  const actor = getCurrentUser();
  const request = db.accessRequests.find(r => r.id === req.params.id);
  if (!request) return deny(res, 404, 'NOT_FOUND', 'Access request not found.');
  if (request.requesterId !== actor.id) return deny(res, 403, 'FORBIDDEN', 'You can only cancel your own requests.');
  if (request.status !== 'PENDING') return deny(res, 400, 'INVALID', `This request is already ${request.status.toLowerCase()}.`);
  request.status = 'CANCELLED';
  request.decidedAt = new Date().toISOString();
  dbManager.persist();
  dbManager.recordAudit(actor, 'UPDATE', 'ACCESS_REQUEST', request.id, `${actor.fullName} cancelled ${request.requestNumber}`);
  res.json({ success: true, request });
});
