import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, Inbox, GitPullRequest, UserPlus, Save, RotateCcw, Power, LogOut, Check, X } from 'lucide-react';
import { AccessRequest, User, UserRole } from '../types/erp';
import {
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_TEMPLATES,
  SUPER_ADMIN_ONLY,
  hasPermission,
  permissionLabel,
} from '../shared/permissions';
import { formatDateTimeNG } from '../utils/formatters';
import { StatusBadge } from './MyAccessView';

type AdminUser = User & { activeDevices: number };

interface AdminPanelViewProps {
  currentUser: User;
  realUser: User | null;
  requests: AccessRequest[];
  // Sends a request; shows the server's message on failure. Resolves to the JSON body, or null on failure.
  api: (method: string, url: string, body?: unknown) => Promise<any | null>;
  onChanged: () => void; // reload app data after a change
}

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];
const GRANTABLE = PERMISSIONS.filter(p => !SUPER_ADMIN_ONLY.has(p.key));
const GROUPS = Array.from(new Set(GRANTABLE.map(p => p.group)));

// Approval rights shown on the "Who approves what" tab
const APPROVAL_RIGHTS = [
  { key: 'access.approve', what: 'Access requests', requestedBy: 'Any user, from My Access' },
  { key: 'po.approve', what: 'Purchase orders above the approval threshold', requestedBy: 'Holders of "Raise purchase orders"' },
  { key: 'qc.decide', what: 'Release of baked batches for sale', requestedBy: 'Holders of "Record batch output"' },
  { key: 'cashier.close', what: 'Cashier drawer counts and variances', requestedBy: 'Holders of "Open cashier sessions"' },
  { key: 'dispatch.reconcile', what: 'Route delivery reconciliation', requestedBy: 'Holders of "Create loading sheets"' },
  { key: 'stock.adjust', what: 'Raw-material stock count corrections', requestedBy: 'Storekeeper count sheets' },
];

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ currentUser, realUser, requests, api, onChanged }) => {
  const canManage = hasPermission(currentUser, 'admin.users');
  const canApprove = hasPermission(currentUser, 'access.approve');
  const [tab, setTab] = useState<'users' | 'requests' | 'approvers'>(canManage ? 'users' : 'requests');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [roleDraft, setRoleDraft] = useState<UserRole>('PRODUCTION_OFFICER');
  const [applyTemplate, setApplyTemplate] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', username: '', role: 'PRODUCTION_OFFICER' as UserRole, phone: '', email: '' });
  const [decision, setDecision] = useState<Record<string, { note: string; grant: string[] }>>({});

  const loadUsers = async () => {
    const res = await api('GET', '/api/v1/admin/users');
    if (res) setUsers(res.users);
  };

  useEffect(() => {
    loadUsers();
  }, [requests]);

  const selected = users.find(u => u.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      setDraft(selected.permissions || []);
      setRoleDraft(selected.role);
    }
  }, [selectedId, users]);

  const refresh = async () => {
    await loadUsers();
    onChanged();
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const history = requests.filter(r => r.status !== 'PENDING');

  const filteredUsers = users.filter(u =>
    `${u.fullName} ${u.username} ${ROLE_LABELS[u.role]}`.toLowerCase().includes(search.toLowerCase()),
  );

  const added = selected ? draft.filter(k => !(selected.permissions || []).includes(k)) : [];
  const removed = selected ? (selected.permissions || []).filter(k => !draft.includes(k)) : [];
  const selectedIsSuper = selected?.role === 'SUPER_ADMIN';

  const toggle = (key: string) => setDraft(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  const toggleGroup = (group: string, on: boolean) => {
    const keys = GRANTABLE.filter(p => p.group === group).map(p => p.key);
    setDraft(prev => (on ? Array.from(new Set([...prev, ...keys])) : prev.filter(k => !keys.includes(k))));
  };

  const savePermissions = async () => {
    if (!selected) return;
    const res = await api('PUT', `/api/v1/admin/users/${selected.id}/permissions`, { permissions: draft });
    if (res) await refresh();
  };

  const saveRole = async () => {
    if (!selected) return;
    const res = await api('PUT', `/api/v1/admin/users/${selected.id}/role`, { role: roleDraft, applyTemplate });
    if (res) await refresh();
  };

  const setActive = async (isActive: boolean) => {
    if (!selected) return;
    if (!isActive && !confirm(`Deactivate ${selected.fullName}? They will be signed out of every device and lose all access.`)) return;
    const res = await api('PUT', `/api/v1/admin/users/${selected.id}/status`, { isActive });
    if (res) await refresh();
  };

  const releaseDevices = async () => {
    if (!selected || !confirm(`Release every device assigned to ${selected.fullName}? Those devices will ask for an account again.`)) return;
    const res = await api('DELETE', `/api/v1/admin/users/${selected.id}/sessions`);
    if (res) await refresh();
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api('POST', '/api/v1/admin/users', newUser);
    if (res) {
      setShowCreate(false);
      setNewUser({ fullName: '', username: '', role: 'PRODUCTION_OFFICER', phone: '', email: '' });
      await refresh();
      setSelectedId(res.user.id);
    }
  };

  const decide = async (r: AccessRequest, approve: boolean) => {
    const d = decision[r.id] || { note: '', grant: r.permissions };
    const res = approve
      ? await api('PUT', `/api/v1/access-requests/${r.id}/approve`, { note: d.note, permissions: d.grant })
      : await api('PUT', `/api/v1/access-requests/${r.id}/reject`, { note: d.note });
    if (res) await refresh();
  };

  const decisionFor = (r: AccessRequest) => decision[r.id] || { note: '', grant: r.permissions };
  const setDecisionFor = (r: AccessRequest, patch: Partial<{ note: string; grant: string[] }>) =>
    setDecision(prev => ({ ...prev, [r.id]: { ...decisionFor(r), ...patch } }));

  const holders = useMemo(
    () => (key: string) => users.filter(u => u.isActive && hasPermission(u, key)),
    [users],
  );

  const tabs = [
    canManage && { id: 'users' as const, label: 'Users & Permissions', icon: Users },
    canApprove && { id: 'requests' as const, label: `Access Requests${pending.length ? ` (${pending.length})` : ''}`, icon: Inbox },
    { id: 'approvers' as const, label: 'Who Approves What', icon: GitPullRequest },
  ].filter(Boolean) as { id: 'users' | 'requests' | 'approvers'; label: string; icon: React.ElementType }[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" /> Admin Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grant and remove access, decide access requests, and see who approves what. Every change is written to the audit log.
          </p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs ${tab === t.id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'users' && canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* User list */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[75vh]">
            <div className="p-2 border-b border-slate-800 flex gap-2">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => setShowCreate(true)}
                title="Create user"
                className="px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-800">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`w-full text-left px-3 py-2 text-xs ${selectedId === u.id ? 'bg-blue-600/20' : 'hover:bg-slate-800/60'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold truncate ${u.isActive ? 'text-slate-100' : 'text-slate-500 line-through'}`}>{u.fullName}</span>
                    {u.activeDevices > 0 && <span className="text-[10px] text-emerald-400 shrink-0">{u.activeDevices} device{u.activeDevices > 1 ? 's' : ''}</span>}
                  </div>
                  <div className="text-[10px] text-blue-400">
                    {ROLE_LABELS[u.role]} · {u.role === 'SUPER_ADMIN' ? 'all access' : `${(u.permissions || []).length} permissions`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            {showCreate ? (
              <form onSubmit={createUser} className="space-y-3">
                <div className="text-sm font-semibold text-white">Create user</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {(['fullName', 'username', 'phone', 'email'] as const).map(field => (
                    <label key={field} className="text-slate-300 font-semibold">
                      {{ fullName: 'Full name', username: 'Username', phone: 'Phone', email: 'Email' }[field]}
                      <input
                        value={newUser[field]}
                        onChange={e => setNewUser({ ...newUser, [field]: e.target.value })}
                        className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-normal"
                      />
                    </label>
                  ))}
                  <label className="text-slate-300 font-semibold">
                    Role (sets the starting permissions)
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-normal"
                    >
                      {ROLES.filter(r => r !== 'SUPER_ADMIN').map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold">Create user</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-slate-300 text-xs">Cancel</button>
                </div>
              </form>
            ) : !selected ? (
              <p className="text-xs text-slate-400">Select a user to see and change their access.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-white">{selected.fullName}</div>
                    <div className="text-[11px] text-slate-400">
                      @{selected.username} · {selected.isActive ? 'Active' : 'Deactivated'} · {selected.activeDevices} device(s)
                      {selected.lastLoginAt ? ` · last device setup ${formatDateTimeNG(selected.lastLoginAt)}` : ''}
                    </div>
                  </div>
                  {selected.id !== realUser?.id && (
                    <div className="flex gap-2">
                      {selected.activeDevices > 0 && (
                        <button onClick={releaseDevices} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 hover:bg-slate-800">
                          <LogOut className="w-3.5 h-3.5" /> Release devices
                        </button>
                      )}
                      <button
                        onClick={() => setActive(!selected.isActive)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${selected.isActive ? 'bg-rose-900/50 text-rose-200 hover:bg-rose-800/60' : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-700/60'}`}
                      >
                        <Power className="w-3.5 h-3.5" /> {selected.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Role */}
                <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs">
                  <label className="text-slate-300 font-semibold">
                    Role
                    <select
                      value={roleDraft}
                      disabled={selected.id === realUser?.id}
                      onChange={e => setRoleDraft(e.target.value as UserRole)}
                      className="mt-1 block bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-normal"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 pb-2">
                    <input type="checkbox" checked={applyTemplate} onChange={e => setApplyTemplate(e.target.checked)} className="accent-blue-500" />
                    Replace permissions with the role's defaults
                  </label>
                  <button
                    onClick={saveRole}
                    disabled={roleDraft === selected.role && !applyTemplate || selected.id === realUser?.id}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-lg font-semibold"
                  >
                    Save role
                  </button>
                </div>

                {selectedIsSuper ? (
                  <p className="text-xs text-slate-300 bg-slate-950/50 border border-slate-800 rounded-lg p-3">
                    Super Admins always have every permission, including managing users and resetting the database.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">Permissions</div>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => setDraft([...ROLE_TEMPLATES[selected.role]].filter(k => !SUPER_ADMIN_ONLY.has(k)))}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Role defaults
                        </button>
                        <button
                          onClick={savePermissions}
                          disabled={added.length + removed.length === 0}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg font-bold"
                        >
                          <Save className="w-3.5 h-3.5" /> Save ({added.length} granted, {removed.length} removed)
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {GROUPS.map(group => {
                        const perms = GRANTABLE.filter(p => p.group === group);
                        const allOn = perms.every(p => draft.includes(p.key));
                        return (
                          <div key={group} className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <input type="checkbox" checked={allOn} onChange={() => toggleGroup(group, !allOn)} className="accent-blue-500" />
                              {group}
                            </label>
                            {perms.map(p => {
                              const on = draft.includes(p.key);
                              const changed = on !== (selected.permissions || []).includes(p.key);
                              return (
                                <label key={p.key} title={p.description} className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                                  <input type="checkbox" checked={on} onChange={() => toggle(p.key)} className="accent-blue-500" />
                                  <span className={changed ? (on ? 'text-emerald-300' : 'text-rose-300 line-through') : ''}>
                                    {p.kind === 'PAGE' ? `Open: ${p.label}` : p.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'requests' && canApprove && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">No pending access requests.</div>
          ) : (
            pending.map(r => {
              const d = decisionFor(r);
              const own = r.requesterId === currentUser.id || r.requesterId === realUser?.id;
              return (
                <div key={r.id} className="bg-slate-900 border border-amber-800/40 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-white">
                      <span className="font-mono text-amber-300">{r.requestNumber}</span> · <span className="font-semibold">{r.requesterName}</span>{' '}
                      <span className="text-slate-400 text-xs">({ROLE_LABELS[r.requesterRole]}) · {formatDateTimeNG(r.createdAt)}</span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-xs text-slate-300">Reason: “{r.reason}”</div>
                  <div className="flex flex-wrap gap-3">
                    {r.permissions.map(k => (
                      <label key={k} className="flex items-center gap-1.5 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          disabled={own}
                          checked={d.grant.includes(k)}
                          onChange={() =>
                            setDecisionFor(r, { grant: d.grant.includes(k) ? d.grant.filter(x => x !== k) : [...d.grant, k] })
                          }
                          className="accent-emerald-500"
                        />
                        {permissionLabel(k)}
                      </label>
                    ))}
                  </div>
                  {own ? (
                    <p className="text-xs text-amber-300">This is your own request — another approver or the Super Admin must decide it.</p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={d.note}
                        onChange={e => setDecisionFor(r, { note: e.target.value })}
                        placeholder="Note to the requester (required to reject)"
                        className="flex-1 min-w-[220px] bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                      <button
                        onClick={() => decide(r, true)}
                        disabled={d.grant.length === 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve {d.grant.length < r.permissions.length ? `${d.grant.length} of ${r.permissions.length}` : ''}
                      </button>
                      <button
                        onClick={() => decide(r, false)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 text-sm font-semibold text-white border-b border-slate-800">Decided requests</div>
            {history.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No decisions yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-950/60 text-slate-400 text-left">
                  <tr>
                    <th className="p-3">Request</th>
                    <th className="p-3">Requested by</th>
                    <th className="p-3">Access</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Decided by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map(r => (
                    <tr key={r.id} className="align-top">
                      <td className="p-3 font-mono text-slate-200">{r.requestNumber}</td>
                      <td className="p-3 text-slate-300">{r.requesterName}<div className="text-[10px] text-slate-500">{ROLE_LABELS[r.requesterRole]}</div></td>
                      <td className="p-3 text-slate-300">{r.permissions.map(permissionLabel).join(', ')}</td>
                      <td className="p-3"><StatusBadge status={r.status} /></td>
                      <td className="p-3 text-slate-300">
                        {r.decidedByName || (r.status === 'CANCELLED' ? 'Cancelled by requester' : '')}
                        {r.decidedAt && <div className="text-[10px] text-slate-500">{formatDateTimeNG(r.decidedAt)}</div>}
                        {r.decisionNote && <div className="text-[10px] text-slate-400">{r.decisionNote}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'approvers' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Each approval right is a permission. To change who approves something, grant or remove that permission in Users &amp; Permissions.
            Nobody can approve their own access request, and only the Super Admin can make someone an access-request approver.
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-950/60 text-slate-400 text-left">
                <tr>
                  <th className="p-3">What is approved</th>
                  <th className="p-3">Who makes the request</th>
                  <th className="p-3">Who approves (permission)</th>
                  <th className="p-3">Current approvers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {APPROVAL_RIGHTS.map(a => (
                  <tr key={a.key} className="align-top">
                    <td className="p-3 text-slate-200 font-semibold">{a.what}</td>
                    <td className="p-3 text-slate-300">{a.requestedBy}</td>
                    <td className="p-3 text-blue-300">{permissionLabel(a.key)}</td>
                    <td className="p-3 text-slate-300">
                      {holders(a.key).map(u => `${u.fullName} (${ROLE_LABELS[u.role]})`).join(', ') || <span className="text-rose-300">Nobody</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
