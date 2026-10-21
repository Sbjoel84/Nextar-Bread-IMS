import React, { useState } from 'react';
import { ProductionOrder, Recipe, BreadProduct, RawMaterial } from '../types/erp';
import { formatDateNG, formatDateTimeNG } from '../utils/formatters';
import {
  Flame,
  Plus,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  Layers,
  Thermometer,
  Percent,
} from 'lucide-react';

interface ProductionViewProps {
  orders: ProductionOrder[];
  recipes: Recipe[];
  products: BreadProduct[];
  rawMaterials: RawMaterial[];
  onLaunchBatch: (data: any) => Promise<void>;
  onCompleteBatch: (orderId: string, data: any) => Promise<void>;
  initialTab?: 'batches' | 'recipes';
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  orders,
  recipes,
  products,
  rawMaterials,
  onLaunchBatch,
  onCompleteBatch,
  initialTab = 'batches',
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'recipes'>(initialTab);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [completingBatch, setCompletingBatch] = useState<ProductionOrder | null>(null);

  // New batch form state
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipes[0]?.id || '');
  const [targetLoaves, setTargetLoaves] = useState(0);
  const [shift, setShift] = useState<'MORNING_BAKE' | 'AFTERNOON_BAKE' | 'NIGHT_BAKE'>('MORNING_BAKE');
  const [leadBaker, setLeadBaker] = useState('');

  // Complete batch form state
  const [actualGood, setActualGood] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [scrapKg, setScrapKg] = useState(0);
  const [downtimeMins, setDowntimeMins] = useState(0);
  const [downtimeReason, setDowntimeReason] = useState('');

  const currentRecipe = recipes.find(r => r.id === selectedRecipeId) || recipes[0];

  const handleLaunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecipe) return;

    // Calculate required ingredient scaling based on base 50kg flour
    const multiplier = targetLoaves / currentRecipe.expectedTheoreticalYieldLoaves;
    const ingredientsIssued = currentRecipe.ingredients.map(ing => ({
      rawMaterialId: ing.rawMaterialId,
      rawMaterialName: ing.rawMaterialName,
      plannedQty: Math.round(ing.quantityPerBatch * multiplier * 10) / 10,
      actualQty: Math.round(ing.quantityPerBatch * multiplier * 10) / 10,
      unit: ing.unit,
    }));

    await onLaunchBatch({
      recipeId: currentRecipe.id,
      productId: currentRecipe.productId,
      targetLoaves,
      shift,
      leadBaker,
      ingredientsIssued,
      scheduledDate: new Date().toISOString().slice(0, 10),
    });
    setShowLaunchModal(false);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingBatch) return;

    await onCompleteBatch(completingBatch.id, {
      actualGoodLoaves: actualGood,
      rejectedLoaves: rejected,
      doughScrapKg: scrapKg,
      downtimeMinutes: downtimeMins,
      downtimeReason,
    });
    setCompletingBatch(null);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Bakery Production & Recipe Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage mixing cycles, proofing chamber times, rotary deck oven baking, batch genealogy and yield efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'batches' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Production Batches
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'recipes' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Formulas & Recipes
            </button>
          </div>

          <button
            onClick={() => setShowLaunchModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Batch</span>
          </button>
        </div>
      </div>

      {activeTab === 'batches' ? (
        /* Batches Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Active & Completed Production Runs ({orders.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Track batch yield, burnt loaves & downtime
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Bread Product</th>
                  <th className="p-3">Shift & Date</th>
                  <th className="p-3">Lead Baker</th>
                  <th className="p-3">Planned</th>
                  <th className="p-3">Actual Output</th>
                  <th className="p-3">Rejects</th>
                  <th className="p-3">Yield %</th>
                  <th className="p-3">QC Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-400">
                      {o.batchNumber}
                    </td>
                    <td className="p-3 font-medium text-white">
                      {o.productName}
                    </td>
                    <td className="p-3 text-slate-300">
                      <div>{o.shift.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-slate-400">{formatDateNG(o.scheduledDate)}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {o.leadBaker}
                    </td>
                    <td className="p-3 font-semibold text-slate-200">
                      {o.targetLoaves}
                    </td>
                    <td className="p-3 font-bold text-white">
                      {o.actualGoodLoaves > 0 ? o.actualGoodLoaves : <span className="text-amber-400 font-normal">Baking in progress</span>}
                    </td>
                    <td className="p-3 text-rose-400 font-semibold">
                      {o.rejectedLoaves > 0 ? `${o.rejectedLoaves} loaves` : '-'}
                    </td>
                    <td className="p-3">
                      {o.actualGoodLoaves > 0 ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          o.yieldEfficiencyPercent >= 98
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                        }`}>
                          {o.yieldEfficiencyPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        o.qcStatus === 'RELEASED'
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : o.qcStatus === 'PENDING'
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {o.qcStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => {
                            setCompletingBatch(o);
                            setActualGood(o.targetLoaves - 10);
                            setRejected(10);
                            setScrapKg(2.5);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                        >
                          Record Output
                        </button>
                      )}
                      {o.status === 'AWAITING_QC' && (
                        <span className="text-[11px] text-amber-400 font-medium">
                          Awaiting QC Inspection
                        </span>
                      )}
                      {o.status === 'COMPLETED' && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Released
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Recipes Catalog & BOM */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map(recipe => (
            <div key={recipe.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-[10px] font-mono text-blue-400 font-bold uppercase">
                    {recipe.recipeCode} • Version {recipe.version}.0
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {recipe.productName}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 rounded px-2 py-0.5 text-emerald-400 text-[10px] font-bold">
                  <Check className="w-3 h-3" /> Approved BOM
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <div className="text-slate-400 text-[10px]">Base Flour</div>
                  <div className="font-bold text-white">{recipe.batchBaseFlourKg} kg</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Theoretical Yield</div>
                  <div className="font-bold text-emerald-400">{recipe.expectedTheoreticalYieldLoaves} Loaves</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Oven & Temp</div>
                  <div className="font-bold text-amber-300">{recipe.standardOvenTempCelsius}°C / {recipe.standardBakingTimeMins}m</div>
                </div>
              </div>

              {/* Bill of Materials */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Standard Bill of Materials (BOM) per 50kg Flour Bag:
                </div>
                <div className="space-y-1 text-xs">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-slate-800/40 border border-slate-800">
                      <span className="text-slate-300">{ing.rawMaterialName}</span>
                      <span className="font-mono font-bold text-white">
                        {ing.quantityPerBatch} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions summary */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-1">Bakery Standard Operating Procedure (SOP):</div>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  {recipe.preparationInstructions.slice(0, 3).map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Launch Batch Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                Launch New Baking Batch
              </h2>
              <button onClick={() => setShowLaunchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Bread Formula</label>
                <select
                  value={selectedRecipeId}
                  onChange={e => setSelectedRecipeId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.productName} ({r.recipeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Output (Loaves)</label>
                  <input
                    type="number"
                    value={targetLoaves}
                    onChange={e => setTargetLoaves(Number(e.target.value))}
                    min={50}
                    step={10}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift</label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="MORNING_BAKE">Morning Bake (05:00 - 14:00)</option>
                    <option value="AFTERNOON_BAKE">Afternoon Bake (13:00 - 21:00)</option>
                    <option value="NIGHT_BAKE">Night Bake (21:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lead Baker In Charge</label>
                <input
                  type="text"
                  value={leadBaker}
                  onChange={e => setLeadBaker(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 text-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Automatic Raw Material Stock Ledger Posting
                </div>
                <p className="text-[11px] text-slate-300">
                  Launching will calculate proportional flour, yeast, sugar, margarine and branded nylons, and deduct them from the raw store ledger.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold"
                >
                  Confirm & Launch Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Batch Modal */}
      {completingBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Record Production Output</h2>
                <div className="text-xs text-blue-400 font-mono">{completingBatch.batchNumber}</div>
              </div>
              <button onClick={() => setCompletingBatch(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Good Accepted Loaves</label>
                  <input
                    type="number"
                    value={actualGood}
                    onChange={e => setActualGood(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold font-mono text-base text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rejects / Burnt Loaves</label>
                  <input
                    type="number"
                    value={rejected}
                    onChange={e => setRejected(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold font-mono text-base text-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dough Scrap (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={scrapKg}
                    onChange={e => setScrapKg(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Downtime (Minutes)</label>
                  <input
                    type="number"
                    value={downtimeMins}
                    onChange={e => setDowntimeMins(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Downtime Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. PHCN outage / generator switchover"
                  value={downtimeReason}
                  onChange={e => setDowntimeReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingBatch(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Send to Quality Control
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
