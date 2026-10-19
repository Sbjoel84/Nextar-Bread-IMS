import React, { useState } from 'react';
import { CashierSession } from '../types/erp';
import { formatNaira, formatDateTimeNG } from '../utils/formatters';
import {
  Coins,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileCheck,
  X,
} from 'lucide-react';

interface CashierViewProps {
  sessions: CashierSession[];
  onOpenSession: (data: any) => Promise<void>;
  onCloseSession: (id: string, data: any) => Promise<void>;
}

export const CashierView: React.FC<CashierViewProps> = ({
  sessions,
  onOpenSession,
  onCloseSession,
}) => {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [closingSession, setClosingSession] = useState<CashierSession | null>(null);

  // Open Form
  const [openingFloat, setOpeningFloat] = useState(50000);
  const [shift, setShift] = useState<'MORNING' | 'EVENING'>('MORNING');

  // Close Form
  const [physicalCashCounted, setPhysicalCashCounted] = useState(0);
  const [supervisorNotes, setSupervisorNotes] = useState('');

  const activeSession = sessions.find(s => s.status === 'OPEN');

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onOpenSession({ openingFloat, shift });
    setShowOpenModal(false);
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingSession) return;
    await onCloseSession(closingSession.id, {
      actualPhysicalCashCounted: physicalCashCounted,
      supervisorNotes,
    });
    setClosingSession(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Cashier Sessions & Daily Cash Count Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bakery retail cashier shift management, opening change float, POS terminal settlement slips, and physical drawer cash count audit.
          </p>
        </div>

        <div>
          {!activeSession ? (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Open Cashier Session</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setClosingSession(activeSession);
                setPhysicalCashCounted(activeSession.expectedPhysicalCash);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Close Active Session ({activeSession.sessionCode})</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Session Spotlight */}
      {activeSession && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="font-bold text-white text-sm">
                Active Session: {activeSession.sessionCode} • {activeSession.shift} Shift
              </h3>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              Cashier: <strong className="text-white">{activeSession.cashierName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Opening Float:</span>
              <div className="text-base font-bold text-white font-mono mt-1">
                {formatNaira(activeSession.openingFloat)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Cash Sales & Receipts:</span>
              <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                {formatNaira(activeSession.totalCashSales + activeSession.totalCreditCollections)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">POS / Moniepoint Transfers:</span>
              <div className="text-base font-bold text-blue-400 font-mono mt-1">
                {formatNaira(activeSession.totalBankTransfers)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Expected Cash in Drawer:</span>
              <div className="text-base font-bold text-amber-300 font-mono mt-1">
                {formatNaira(activeSession.expectedPhysicalCash)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          Reconciled Shift Sessions & Audit Records
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Session Code</th>
                <th className="p-3">Cashier Name</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Opened At</th>
                <th className="p-3">Opening Float</th>
                <th className="p-3">Cash Collected</th>
                <th className="p-3">Expected Cash</th>
                <th className="p-3">Actual Count</th>
                <th className="p-3">Variance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sessions.map(s => {
                const variance = s.cashVariance || 0;
                const isShortage = variance < 0;

                return (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-400">{s.sessionCode}</td>
                    <td className="p-3 font-semibold text-white">{s.cashierName}</td>
                    <td className="p-3 text-slate-300">{s.shift}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{formatDateTimeNG(s.openedAt)}</td>
                    <td className="p-3 font-mono text-slate-300">{formatNaira(s.openingFloat)}</td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">
                      {formatNaira(s.totalCashSales + s.totalCreditCollections)}
                    </td>
                    <td className="p-3 font-mono text-white">{formatNaira(s.expectedPhysicalCash)}</td>
                    <td className="p-3 font-mono font-bold text-white">
                      {s.actualPhysicalCashCounted !== undefined ? formatNaira(s.actualPhysicalCashCounted) : '-'}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {s.actualPhysicalCashCounted !== undefined ? (
                        <span className={isShortage ? 'text-rose-400' : variance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                          {formatNaira(variance)} {variance === 0 ? '✓ Balanced' : isShortage ? '⚠️ Short' : '⚠️ Excess'}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === 'SUPERVISOR_VERIFIED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Session Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Unlock className="w-5 h-5 text-emerald-400" />
                Open Cashier Register Session
              </h2>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Shift</label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="MORNING">Morning Shift (06:00 - 14:00)</option>
                  <option value="EVENING">Evening Shift (14:00 - 22:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Opening Cash Float (Change)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={e => setOpeningFloat(Number(e.target.value))}
                  step={5000}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-emerald-400"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-300 text-[11px]">
                Drawer float must be physically counted and signed for before starting retail or depot receipts.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Confirm & Open Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {closingSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-400" />
                  Close & Reconcile Register Session
                </h2>
                <div className="text-xs text-blue-400 font-mono">{closingSession.sessionCode}</div>
              </div>
              <button onClick={() => setClosingSession(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Opening Float:</span>
                  <span className="font-mono text-white">{formatNaira(closingSession.openingFloat)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cash Inflows:</span>
                  <span className="font-mono text-emerald-400">
                    {formatNaira(closingSession.totalCashSales + closingSession.totalCreditCollections)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                  <span>Expected Physical Cash in Drawer:</span>
                  <span className="font-mono text-amber-300">{formatNaira(closingSession.expectedPhysicalCash)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Actual Physical Cash Counted in Drawer (₦)
                </label>
                <input
                  type="number"
                  value={physicalCashCounted}
                  onChange={e => setPhysicalCashCounted(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-base text-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supervisor Verification Notes</label>
                <input
                  type="text"
                  placeholder="e.g. POS slips tallied, cash handed over to Finance vault"
                  value={supervisorNotes}
                  onChange={e => setSupervisorNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClosingSession(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                >
                  Close & Lock Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
