import React, { useState } from 'react';
import { RawMaterial, StockMovement } from '../types/erp';
import { formatNaira, formatDateTimeNG } from '../utils/formatters';
import {
  Boxes,
  Plus,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface InventoryViewProps {
  rawMaterials: RawMaterial[];
  stockLedger: StockMovement[];
  onAddMaterial: (data: any) => Promise<void>;
  onAdjustStock: (data: any) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  rawMaterials,
  stockLedger,
  onAddMaterial,
  onAdjustStock,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'ledger'>('stock');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(rawMaterials[0]?.id || '');
  const [quantityDelta, setQuantityDelta] = useState(0);
  const [adjustReason, setAdjustReason] = useState('PHYSICAL_COUNT_ADJUSTMENT');
  const [adjustNotes, setAdjustNotes] = useState('');

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || quantityDelta === 0) return;

    await onAdjustStock({
      rawMaterialId: selectedMaterialId,
      quantityDelta,
      reason: adjustReason,
      notes: adjustNotes,
    });
    setShowAdjustModal(false);
    setQuantityDelta(0);
    setAdjustNotes('');
  };

  const totalValuation = rawMaterials.reduce(
    (acc, m) => acc + m.currentStock * m.standardCostPerUnit,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            Raw Materials & Stock Movement Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time flour silo balances, sugar, yeast, packaging nylons, minimum reorder thresholds and immutable movement history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'stock' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Current Balances
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'ledger' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Stock Ledger ({stockLedger.length})
            </button>
          </div>

          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Stock Count Adj</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Raw Material Inventory Valuation</div>
          <div className="text-2xl font-bold text-white mt-1">{formatNaira(totalValuation)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Based on current standard purchase costs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Prime Flour Inventory</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {rawMaterials.find(m => m.category === 'FLOUR')?.currentStock || 0} Bags
          </div>
          <div className="text-[11px] text-slate-400 mt-1">50kg Golden Penny Prime Baker Bags</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Branded Packaging Nylons</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {((rawMaterials.find(m => m.category === 'PACKAGING')?.currentStock || 0) * 1000).toLocaleString()} Wrappers
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Holographic anti-counterfeit sleeves</div>
        </div>
      </div>

      {activeTab === 'stock' ? (
        /* Materials Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Material Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Cost / Unit</th>
                  <th className="p-3">Total Value</th>
                  <th className="p-3">Location & Supplier</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rawMaterials.map(m => {
                  const isLow = m.currentStock <= m.minimumStockAlert;
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">{m.code}</td>
                      <td className="p-3 font-medium text-white">{m.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-base text-white">
                        {m.currentStock.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-400">{m.unitOfMeasure.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-slate-300 font-mono">{formatNaira(m.standardCostPerUnit)}</td>
                      <td className="p-3 font-bold text-emerald-400 font-mono">
                        {formatNaira(m.currentStock * m.standardCostPerUnit)}
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        <div>{m.storageLocation}</div>
                        <div className="text-[10px] text-slate-400">{m.supplierName}</div>
                      </td>
                      <td className="p-3">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Reorder Alert
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                            Adequate Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Ledger Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
            Immutable Stock Movement Ledger. Every purchase receipt, production issuance, or count adjustment is recorded with source reference.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Material</th>
                  <th className="p-3">Movement Type</th>
                  <th className="p-3">Quantity Delta</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Reference Doc</th>
                  <th className="p-3">Authorized By</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stockLedger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {formatDateTimeNG(entry.timestamp)}
                    </td>
                    <td className="p-3 font-medium text-white">{entry.rawMaterialName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        entry.quantityDelta > 0
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}>
                        {entry.movementType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-sm">
                      <span className={entry.quantityDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {entry.quantityDelta > 0 ? `+${entry.quantityDelta}` : entry.quantityDelta} {entry.unit}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-200">
                      {entry.newBalance} {entry.unit}
                    </td>
                    <td className="p-3 font-mono text-blue-400">{entry.referenceDocNumber}</td>
                    <td className="p-3 text-slate-300">{entry.performedBy}</td>
                    <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">{entry.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                Physical Stock Count Adjustment
              </h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Raw Material</label>
                <select
                  value={selectedMaterialId}
                  onChange={e => setSelectedMaterialId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Current: {m.currentStock} {m.unitOfMeasure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Quantity Delta (Positive to add, Negative to deduct)
                </label>
                <input
                  type="number"
                  value={quantityDelta}
                  onChange={e => setQuantityDelta(Number(e.target.value))}
                  placeholder="e.g. +5 or -2"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="PHYSICAL_COUNT_ADJUSTMENT">Monthly Physical Stock Count Variance</option>
                  <option value="DAMAGED_WRITE_OFF">Moisture Damaged / Bag Tear in Silo</option>
                  <option value="EXPIRED_DISPOSAL">Expired / Quality Discard</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audit Explanatory Notes</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="Audit reason required..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
