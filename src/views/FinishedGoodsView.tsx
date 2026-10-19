import React from 'react';
import { FinishedGoodsItem } from '../types/erp';
import { formatNaira, formatDateNG } from '../utils/formatters';
import {
  PackageCheck,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FinishedGoodsViewProps {
  items: FinishedGoodsItem[];
}

export const FinishedGoodsView: React.FC<FinishedGoodsViewProps> = ({ items }) => {
  const totalLoaves = items.reduce((acc, it) => acc + it.quantityAvailableForDispatch, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-400" />
            Finished Goods Inventory & FEFO Dispatch Bay
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quality-released bread loaves queued for sales dispatch. First-Expiry-First-Out (FEFO) protocol strictly enforced.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Ready for Distribution
            </div>
            <div className="text-lg font-extrabold text-emerald-400 font-mono">
              {totalLoaves.toLocaleString()} Loaves
            </div>
          </div>
        </div>
      </div>

      {/* FEFO Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Current Finished Goods Lots & Racks
          </span>
          <span className="text-[11px] text-blue-400 font-medium">
            Strict FEFO Priority Sorting
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Bread Product</th>
                <th className="p-3">Baked Date</th>
                <th className="p-3">Best Before (FEFO)</th>
                <th className="p-3">Produced</th>
                <th className="p-3">Available for Loading</th>
                <th className="p-3">Reserved</th>
                <th className="p-3">Warehouse Location</th>
                <th className="p-3 text-right">FEFO Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map(it => (
                <tr key={it.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-400">{it.batchNumber}</td>
                  <td className="p-3 font-semibold text-white">{it.productName}</td>
                  <td className="p-3 text-slate-300">{formatDateNG(it.productionDate)}</td>
                  <td className="p-3 font-mono font-bold text-amber-300">
                    {formatDateNG(it.expiryDate)}
                  </td>
                  <td className="p-3 text-slate-300 font-mono">{it.quantityProduced}</td>
                  <td className="p-3 font-mono font-bold text-base text-emerald-400">
                    {it.quantityAvailableForDispatch}
                  </td>
                  <td className="p-3 font-mono text-slate-400">{it.quantityReserved}</td>
                  <td className="p-3 text-slate-300 text-[11px]">{it.warehouseLocation}</td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800/60">
                      Pick First (FEFO)
                    </span>
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
