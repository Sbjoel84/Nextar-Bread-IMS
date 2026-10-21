import React, { useState } from 'react';
import { DashboardMetrics, User, Recipe, RawMaterial } from '../types/erp';
import { formatNaira } from '../utils/formatters';
import { InventoryUsageReport } from '../utils/inventoryUsage';
import {
  Flame,
  Boxes,
  PackageCheck,
  TrendingUp,
  Coins,
  Store,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Sparkles,
  Send,
  ShoppingCart,
  Activity,
  Calculator,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wheat,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  currentUser: User | null;
  usageReport?: InventoryUsageReport | null;
  onNavigate: (tab: NavTab) => void;
  onRecalculateUsage?: () => void;
  recipes?: Recipe[];
  rawMaterials?: RawMaterial[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  currentUser,
  usageReport,
  onNavigate,
  onRecalculateUsage,
  recipes = [],
  rawMaterials = [],
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Interactive Material Calculator State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [simulatedBatchLoaves, setSimulatedBatchLoaves] = useState<number>(500);
  const [calculationResult, setCalculationResult] = useState<{
    calculated: boolean;
    requiredIngredients: {
      rawMaterialId: string;
      name: string;
      requiredQty: number;
      currentStock: number;
      remainingAfterBatch: number;
      threshold: number;
      unit: string;
      willBeBelowThreshold: boolean;
      willStockout: boolean;
    }[];
    anyBelowThreshold: boolean;
  } | null>(null);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Clock className="w-5 h-5 animate-spin mr-2" />
        Loading Nextar Bakery operational telemetry...
      </div>
    );
  }

  const criticalItems = usageReport?.criticalMaterials || [];
  const warningItems = usageReport?.warningMaterials || [];
  const allMaterialStats = usageReport?.materialStats || [];

  const displayedStats = filterCategory === 'ALL'
    ? allMaterialStats
    : filterCategory === 'ALERTS'
    ? allMaterialStats.filter(m => m.isBelowThreshold)
    : allMaterialStats.filter(m => m.category === filterCategory);

  // Function to calculate simulated raw material usage for a target batch
  const handleCalculateBatchUsage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const recipe = recipes.find(r => r.id === selectedRecipeId) || recipes[0];
    if (!recipe || simulatedBatchLoaves <= 0) return;

    const baseLoaves = recipe.expectedTheoreticalYieldLoaves || 100;
    const scaleFactor = simulatedBatchLoaves / baseLoaves;

    const requiredIngredients = recipe.ingredients.map(ing => {
      const mat = rawMaterials.find(m => m.id === ing.rawMaterialId);
      const requiredQty = Math.round(ing.quantityPerBatch * scaleFactor * 10) / 10;
      const currentStock = mat ? mat.currentStock : 0;
      const remainingAfterBatch = Math.round((currentStock - requiredQty) * 10) / 10;
      const threshold = mat ? mat.minimumStockAlert : 20;
      const willStockout = remainingAfterBatch < 0;
      const willBeBelowThreshold = remainingAfterBatch <= threshold;

      return {
        rawMaterialId: ing.rawMaterialId,
        name: ing.rawMaterialName,
        requiredQty,
        currentStock,
        remainingAfterBatch,
        threshold,
        unit: ing.unit,
        willBeBelowThreshold,
        willStockout,
      };
    });

    const anyBelow = requiredIngredients.some(i => i.willBeBelowThreshold);

    setCalculationResult({
      calculated: true,
      requiredIngredients,
      anyBelowThreshold: anyBelow,
    });
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Banner & Quick Controls */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Nextar Bread Bakery ERP • Kubwa Plant Operations
            {usageReport && usageReport.totalBelowThreshold > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] animate-pulse">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                {usageReport.totalBelowThreshold} Low Stock Warning
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {currentUser?.fullName || 'Bakery Manager'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            Live operational dashboard showing today's baking shifts, flour silo stock, finished-goods FEFO loading bay, cash reconciliation, and distribution telemetry.
          </p>
        </div>

        {/* Quick Launch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onRecalculateUsage && (
            <button
              onClick={onRecalculateUsage}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all shadow-md"
              title="Recalculate raw material burn rate and reorder thresholds"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Thresholds</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('production')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-900/30"
          >
            <Flame className="w-4 h-4" />
            <span>Launch Batch</span>
          </button>
          <button
            onClick={() => onNavigate('dispatches')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/30"
          >
            <Send className="w-4 h-4" />
            <span>New Dispatch</span>
          </button>
          <button
            onClick={() => onNavigate('cashier')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/30"
          >
            <Coins className="w-4 h-4" />
            <span>Cashier Session</span>
          </button>
        </div>
      </div>

      {/* RAW MATERIAL REORDER THRESHOLD WARNING BANNER */}
      {usageReport && (usageReport.totalBelowThreshold > 0 || usageReport.hasCriticalAlerts) && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Ingredient Reorder Threshold Alert
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
                    {usageReport.totalBelowThreshold} Item(s) Below Threshold
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {usageReport.summaryText}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                  {criticalItems.map(m => (
                    <span
                      key={m.materialId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80 font-mono font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {m.name}: <strong>{m.currentStock} {m.unit} left</strong>
                      {m.avgDailyBurnRate > 0 ? ` (Burn: ~${m.avgDailyBurnRate}/day)` : ' (no usage yet)'}
                    </span>
                  ))}
                  {warningItems.map(m => (
                    <span
                      key={m.materialId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-mono font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {m.name}: <strong>{m.currentStock} {m.unit}</strong> (Threshold: {m.effectiveReorderThreshold})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={() => onNavigate('procurement')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-950/50"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Issue Purchase Order</span>
              </button>
              <button
                onClick={() => onNavigate('raw-materials')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700"
              >
                Review Silo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Production Output */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Today's Baking Output</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {(metrics.todayProductionLoaves ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">/ {(metrics.plannedProductionLoaves ?? 0).toLocaleString()} planned</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics.productionYieldEfficiency}% Yield</span>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-blue-400 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              Batches <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Finished Goods Ready for Sale */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Finished Goods Stock</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {(metrics.finishedGoodsStockLoaves ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Ready (FEFO)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Dispatched today: <strong className="text-white">{metrics.todayDispatchedLoaves}</strong>
            </span>
            <button
              onClick={() => onNavigate('finished-goods')}
              className="text-blue-400 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              Racks <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Invoiced Sales & Collections */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Today's Invoiced Sales</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">
              {formatNaira(metrics.todaySalesInvoicedNaira)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Cash collected: <strong className="text-slate-200">{formatNaira(metrics.todaySalesCashCollectedNaira)}</strong>
            </span>
            <button
              onClick={() => onNavigate('sales-invoices')}
              className="text-blue-400 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              Invoices <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Raw Material Stock Valuation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Raw Store Valuation</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {formatNaira(metrics.rawMaterialsTotalValuation)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={metrics.lowStockItemsCount > 0 ? 'text-amber-400 font-semibold flex items-center gap-1' : 'text-slate-400'}>
              {metrics.lowStockItemsCount > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  {metrics.lowStockItemsCount} items reorder alert
                </>
              ) : (
                'All items well stocked'
              )}
            </span>
            <button
              onClick={() => onNavigate('raw-materials')}
              className="text-blue-400 hover:underline flex items-center gap-0.5 text-[11px]"
            >
              Inventory <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* RAW MATERIAL USAGE CALCULATOR & INGREDIENT THRESHOLD SIMULATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              Raw Material Usage Calculator & Batch Simulation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate required flour, yeast, sugar, and preservatives for upcoming baking batches and check if ingredients fall below reorder thresholds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRecalculateUsage && (
              <button
                onClick={onRecalculateUsage}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Run Threshold Audit</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Calculator Form */}
        <form onSubmit={handleCalculateBatchUsage} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-5 space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Select Bread Recipe / Product</label>
            <select
              value={selectedRecipeId}
              onChange={e => setSelectedRecipeId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {recipes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.productName} ({r.recipeCode}) - Standard {r.expectedTheoreticalYieldLoaves} Loaves
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Target Baking Quantity (Loaves)</label>
            <input
              type="number"
              min={50}
              max={10000}
              step={50}
              value={simulatedBatchLoaves}
              onChange={e => setSimulatedBatchLoaves(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Usage</span>
            </button>
          </div>
        </form>

        {/* Calculation Results Output */}
        {calculationResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wheat className="w-4 h-4 text-amber-400" />
                Raw Material Requirements for {simulatedBatchLoaves} Loaves
              </span>
              {calculationResult.anyBelowThreshold ? (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800/80 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Warning: Ingredients will drop below reorder threshold!
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Silo inventory is sufficient for this batch.
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Raw Material</th>
                    <th className="p-2.5">Batch Requirement</th>
                    <th className="p-2.5">Current Stock</th>
                    <th className="p-2.5">Remaining After Batch</th>
                    <th className="p-2.5">Threshold</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {calculationResult.requiredIngredients.map(item => (
                    <tr key={item.rawMaterialId} className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-sans font-medium text-slate-200">{item.name}</td>
                      <td className="p-2.5 font-bold text-cyan-300">
                        {item.requiredQty} {item.unit}
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className={`p-2.5 font-bold ${item.willStockout ? 'text-rose-400' : item.willBeBelowThreshold ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {item.remainingAfterBatch} {item.unit}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {item.threshold} {item.unit}
                      </td>
                      <td className="p-2.5 font-sans">
                        {item.willStockout ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/60 text-rose-300 border border-rose-700">
                            STOCKOUT DEFICIT
                          </span>
                        ) : item.willBeBelowThreshold ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700">
                            BELOW THRESHOLD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-800">
                            HEALTHY
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RAW MATERIAL USAGE & INGREDIENT BURN RATE MONITOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Ingredient Usage & Reorder Threshold Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live consumption tracking based on actual production batches, burn rates, days of runway, and reorder alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterCategory === 'ALL' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                All Ingredients ({allMaterialStats.length})
              </button>
              <button
                onClick={() => setFilterCategory('ALERTS')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterCategory === 'ALERTS' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Threshold Alerts ({criticalItems.length + warningItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Ingredient Cards Grid: Responsive Full-Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
          {displayedStats.map(item => {
            const stockPct = Math.min(100, Math.round((item.currentStock / Math.max(1, item.effectiveReorderThreshold * 2)) * 100));
            const isAlert = item.isBelowThreshold;

            return (
              <div
                key={item.materialId}
                className={`rounded-xl p-3.5 border transition-all text-xs flex flex-col justify-between ${
                  item.urgency === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-800/60 shadow-sm shadow-rose-950/30'
                    : item.urgency === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-800/60 shadow-sm shadow-amber-950/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{item.code}</span>
                      <h4 className="font-bold text-white text-sm leading-tight mt-0.5">{item.name}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        item.urgency === 'CRITICAL'
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                          : item.urgency === 'WARNING'
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {item.urgency}
                    </span>
                  </div>

                  {/* Stock Gauge Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Current Stock:</span>
                      <span className="font-mono font-bold text-white">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.urgency === 'CRITICAL'
                            ? 'bg-rose-500'
                            : item.urgency === 'WARNING'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(8, stockPct)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Threshold: {item.effectiveReorderThreshold}</span>
                      <span>Safe: ~{item.effectiveReorderThreshold * 2}</span>
                    </div>
                  </div>

                  {/* Usage & Burn Rate */}
                  <div className="mt-3 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Est. Daily Burn:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {item.avgDailyBurnRate > 0 ? `${item.avgDailyBurnRate} ${item.unit}/day` : 'No usage yet'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Days of Supply:</span>
                      {item.daysOfSupplyRemaining === null ? (
                        <span className="font-mono font-semibold text-slate-400">—</span>
                      ) : (
                        <span className={`font-mono font-bold ${item.daysOfSupplyRemaining <= 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ~{item.daysOfSupplyRemaining} days left
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Consumed Today:</span>
                      <span className="font-mono text-slate-300">
                        {item.todayQuantityConsumed} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {item.supplierName}
                  </span>
                  <button
                    onClick={() => onNavigate('procurement')}
                    className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isAlert
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Order</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Financial & Risk Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receivables / Debtors */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              Customer Receivables (Debtors)
            </span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {formatNaira(metrics.totalReceivablesDebtorsNaira)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Outstanding customer balances across Kubwa, Gwarinpa & Bwari supermarket depots.
          </p>
          <button
            onClick={() => onNavigate('customers')}
            className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            Review customer credit aging <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Operating Expenses */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Today's Operating Expenses
            </span>
          </div>
          <div className="text-xl font-bold text-amber-300 mt-1">
            {formatNaira(metrics.todayOperatingExpensesNaira)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Generator diesel, rotary oven gas refills, and daily bakery shift stipends.
          </p>
          <button
            onClick={() => onNavigate('finance')}
            className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            Expense breakdown <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Payables / Creditors */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-purple-400" />
              Supplier Payables (Creditors)
            </span>
          </div>
          <div className="text-xl font-bold text-purple-300 mt-1">
            {formatNaira(metrics.totalPayablesCreditorsNaira)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Outstanding procurement balances to Flour Mills Nigeria, Dangote Sugar & BUA.
          </p>
          <button
            onClick={() => onNavigate('procurement')}
            className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            Supplier ledger <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
