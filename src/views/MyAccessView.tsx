import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, Send, XCircle, CheckCircle2, Clock, Ban } from 'lucide-react';
import { AccessRequest, User } from '../types/erp';
import { PERMISSIONS, ROLE_LABELS, SUPER_ADMIN_ONLY, hasPermission, permissionLabel } from '../shared/permissions';
import { formatDateTimeNG } from '../utils/formatters';

interface MyAccessViewProps {
  currentUser: User;
  requests: AccessRequest[];
  presetPermissions: string[]; // pre-ticked when arriving from a page the user cannot open
  onSubmitRequest: (permissions: string[], reason: string) => Promise<boolean>;
  onCancelRequest: (id: string) => Promise<void>;
}

export const StatusBadge: React.FC<{ status: AccessRequest['status'] }> = ({ status }) => {
  const styles: Record<AccessRequest['status'], string> = {
    PENDING: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    APPROVED: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    REJECTED: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    CANCELLED: 'bg-slate-800 text-slate-400 border-slate-700',
  };
  const Icon = { PENDING: Clock, APPROVED: CheckCircle2, REJECTED: XCircle, CANCELLED: Ban }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${styles[status]}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
};

export const MyAccessView: React.FC<MyAccessViewProps> = ({ currentUser, requests, presetPermissions, onSubmitRequest, onCancelRequest }) => {
  const [selected, setSelected] = useState<string[]>(presetPermissions);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setSelected(presetPermissions), [presetPermissions]);

  const myRequests = requests.filter(r => r.requesterId === currentUser.id);
  const pendingKeys = new Set(myRequests.filter(r => r.status === 'PENDING').flatMap(r => r.permissions));

  const groups = useMemo(() => {
    const grouped = new Map<string, typeof PERMISSIONS>();
    for (const p of PERMISSIONS) {
      if (SUPER_ADMIN_ONLY.has(p.key)) continue;
      grouped.set(p.group, [...(grouped.get(p.group) || []), p]);
    }
    return Array.from(grouped.entries());
  }, []);

  const toggle = (key: string) =>
    setSelected(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await onSubmitRequest(selected, reason);
    setBusy(false);
    if (ok) {
      setSelected([]);
      setReason('');
    }
  };

  const isSuper = currentUser.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-400" /> My Access
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {currentUser.fullName} · {ROLE_LABELS[currentUser.role]}. What you can open and do, and requests for more access.
        </p>
      </div>

      {isSuper ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
          As Super Admin you have every permission. Manage other users in the Admin Panel.
        </div>
      ) : (
        <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="text-sm font-semibold text-white">Request more access</div>
          <p className="text-xs text-slate-400">
            Tick what you need and say why. The Super Admin or an assigned approver will grant or reject it; you will see the
            decision below. Ticked boxes you already have are shown as granted.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map(([group, perms]) => (
              <div key={group} className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{group}</div>
                {perms.map(p => {
                  const have = hasPermission(currentUser, p.key);
                  const pending = pendingKeys.has(p.key);
                  return (
                    <label
                      key={p.key}
                      title={p.description}
                      className={`flex items-center gap-2 text-xs ${have || pending ? 'text-slate-500' : 'text-slate-200 cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        disabled={have || pending}
                        checked={have || selected.includes(p.key)}
                        onChange={() => toggle(p.key)}
                        className="accent-blue-500"
                      />
                      <span>{p.kind === 'PAGE' ? `Open: ${p.label}` : p.label}</span>
                      {have && <span className="text-[10px] text-emerald-400">granted</span>}
                      {pending && <span className="text-[10px] text-amber-400">requested</span>}
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
          <label className="block text-xs font-semibold text-slate-300">
            Reason
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. I cover the evening cashier shift on Fridays"
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </label>
          <button
            type="submit"
            disabled={busy || selected.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5" /> Submit request ({selected.length})
          </button>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-3 text-sm font-semibold text-white border-b border-slate-800">My requests</div>
        {myRequests.length === 0 ? (
          <p className="p-4 text-xs text-slate-400">You have not requested any access.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-950/60 text-slate-400 text-left">
              <tr>
                <th className="p-3">Request</th>
                <th className="p-3">Access asked for</th>
                <th className="p-3">Status</th>
                <th className="p-3">Decision</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {myRequests.map(r => (
                <tr key={r.id} className="align-top">
                  <td className="p-3">
                    <div className="font-mono text-slate-200">{r.requestNumber}</div>
                    <div className="text-[10px] text-slate-400">{formatDateTimeNG(r.createdAt)}</div>
                  </td>
                  <td className="p-3 text-slate-300">
                    {r.permissions.map(permissionLabel).join(', ')}
                    <div className="text-[10px] text-slate-500 mt-1">“{r.reason}”</div>
                  </td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3 text-slate-300">
                    {r.decidedByName && <div>{r.decidedByName}</div>}
                    {r.decisionNote && <div className="text-[10px] text-slate-400">{r.decisionNote}</div>}
                  </td>
                  <td className="p-3 text-right">
                    {r.status === 'PENDING' && (
                      <button onClick={() => onCancelRequest(r.id)} className="text-[11px] text-rose-300 hover:text-white">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
