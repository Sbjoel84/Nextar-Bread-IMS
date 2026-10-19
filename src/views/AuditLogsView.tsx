import React, { useState } from 'react';
import { AuditLogEntry } from '../types/erp';
import { formatDateTimeNG } from '../utils/formatters';
import {
  History,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const filtered = logs.filter(l => {
    const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;
    const matchesSearch =
      searchTerm === '' ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Immutable Audit Trail & Security Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Every operational, inventory, financial and quality authorization is permanently recorded with actor identity and timestamp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
            Total Audited Events: <strong className="text-blue-400 font-mono">{logs.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit descriptions, users, batch IDs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400"
          />
        </div>

        <select
          value={selectedAction}
          onChange={e => setSelectedAction(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-medium"
        >
          <option value="ALL">All Event Types</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="APPROVE">APPROVE</option>
          <option value="RECONCILE">RECONCILE</option>
          <option value="QC_RELEASE">QC_RELEASE</option>
          <option value="QC_REJECT">QC_REJECT</option>
          <option value="REVERSE">REVERSE</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp (WAT)</th>
                <th className="p-3">Actor / User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Event Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {formatDateTimeNG(l.timestamp)}
                  </td>
                  <td className="p-3 font-semibold text-white">
                    @{l.actorUsername}
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                      {l.actorRole}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      l.action === 'CREATE'
                        ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                        : l.action === 'APPROVE' || l.action === 'QC_RELEASE'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : l.action === 'QC_REJECT' || l.action === 'REVERSE'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300 text-[11px]">{l.entityType}</td>
                  <td className="p-3 text-slate-200 leading-relaxed font-medium">
                    {l.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
