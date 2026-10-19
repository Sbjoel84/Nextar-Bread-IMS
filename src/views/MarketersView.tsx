import React, { useState } from 'react';
import { Marketer } from '../types/erp';
import { formatNaira } from '../utils/formatters';
import {
  Users,
  Plus,
  MapPin,
  Truck,
  Award,
  AlertTriangle,
  Coins,
  X,
} from 'lucide-react';

interface MarketersViewProps {
  marketers: Marketer[];
  onAddMarketer: (data: any) => Promise<void>;
}

export const MarketersView: React.FC<MarketersViewProps> = ({
  marketers,
  onAddMarketer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [territory, setTerritory] = useState('Kubwa Central & Phase 4');
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED_PER_LOAF'>('PERCENTAGE');
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [monthlyTarget, setMonthlyTarget] = useState(18000);
  const [dailyAllocation, setDailyAllocation] = useState(800);
  const [vehiclePlate, setVehiclePlate] = useState('KJA-782-XR (Toyota HiAce)');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddMarketer({
      fullName,
      phone,
      assignedTerritory: territory,
      commissionType,
      commissionRate,
      monthlySalesTargetLoaves: monthlyTarget,
      dailyAllocationLimitLoaves: dailyAllocation,
      assignedVehiclePlate: vehiclePlate,
    });
    setShowAddModal(false);
  };

  const totalOwedByMarketers = marketers.reduce((acc, m) => acc + m.currentOwedBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Marketer Territory Management & Route Allocations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sales representative route assignments (Kubwa, Gwarinpa, Bwari, Wuse), daily loaf allocations, commission rules and collection liabilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-400 block">Pending Route Collections Owed:</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {formatNaira(totalOwedByMarketers)}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Marketer</span>
          </button>
        </div>
      </div>

      {/* Marketers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketers.map(m => (
          <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm hover:border-indigo-500/40 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{m.marketerCode}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{m.fullName}</h3>
                <div className="text-[11px] text-slate-400">{m.phone}</div>
              </div>
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <Truck className="w-4 h-4" />
              </span>
            </div>

            <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{m.assignedTerritory}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Daily Loaf Allocation:</span>
                <span className="font-bold text-white font-mono">{m.dailyAllocationLimitLoaves} loaves</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Commission Structure:</span>
                <span className="font-semibold text-emerald-400">
                  {m.commissionType === 'PERCENTAGE' ? `${m.commissionRate}% of Sales` : `₦${m.commissionRate} / loaf`}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Vehicle Assigned:</span>
                <span className="text-slate-300 truncate max-w-[140px]">{m.assignedVehiclePlate || 'None'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Pending Cash Owed:</span>
                <span className={`font-mono font-bold ${m.currentOwedBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatNaira(m.currentOwedBalance)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Total YTD:</span>
                <span className="font-mono text-slate-200">{formatNaira(m.ytdTotalSales)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Marketer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Register Sales Marketer / Rep
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Route / Territory</label>
                  <input
                    type="text"
                    value={territory}
                    onChange={e => setTerritory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Commission Type</label>
                  <select
                    value={commissionType}
                    onChange={e => setCommissionType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_PER_LOAF">Fixed ₦ Per Loaf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Commission Rate</label>
                  <input
                    type="number"
                    step="0.5"
                    value={commissionRate}
                    onChange={e => setCommissionRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Loaf Allocation Limit</label>
                  <input
                    type="number"
                    value={dailyAllocation}
                    onChange={e => setDailyAllocation(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Delivery Van / Tricycle Plate</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                >
                  Register Marketer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
