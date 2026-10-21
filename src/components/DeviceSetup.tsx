import React, { useEffect, useState } from 'react';
import { MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { NextarLogo } from './NextarLogo';
import { UserRole } from '../types/erp';
import { ROLE_LABELS } from '../shared/permissions';

interface DeviceUser {
  id: string;
  fullName: string;
  role: UserRole;
  username: string;
}

interface DeviceSetupProps {
  onAssigned: () => void;
}

// Shown when this browser is not yet assigned to anyone. Once an account is chosen the device is
// locked to it; only the Super Admin can switch or release it afterwards.
export const DeviceSetup: React.FC<DeviceSetupProps> = ({ onAssigned }) => {
  const [users, setUsers] = useState<DeviceUser[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/v1/auth/device-users')
      .then(r => r.json())
      .then(res => (res.success ? setUsers(res.users) : setError(res.message)))
      .catch(() => setError('Could not reach the Nextar ERP server.'));
  }, []);

  const claim = async () => {
    if (!selected) return;
    const user = users.find(u => u.id === selected);
    if (!confirm(`Assign this device to ${user?.fullName}? Only the Super Admin can change it afterwards.`)) return;
    setBusy(true);
    const res = await fetch('/api/v1/auth/claim-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected }),
    }).then(r => r.json());
    setBusy(false);
    if (res.success) onAssigned();
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
        <NextarLogo size="md" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-blue-400" /> Set up this device
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose your own account. This device will stay signed in as you, and you will only see the pages and
            actions the Super Admin has given you. To change it later, ask the Super Admin.
          </p>
        </div>

        <label className="block text-xs font-semibold text-slate-300">
          Your account
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="mt-1.5 w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
          >
            <option value="">Select your name…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.fullName} — {ROLE_LABELS[u.role]}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-xs text-amber-400">{error}</p>}

        <button
          onClick={claim}
          disabled={!selected || busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold"
        >
          <ShieldCheck className="w-4 h-4" /> {busy ? 'Assigning…' : 'Use this device as me'}
        </button>
      </div>
    </div>
  );
};
