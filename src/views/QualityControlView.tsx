import React, { useState } from 'react';
import { QualityControlRecord, ProductionOrder } from '../types/erp';
import { formatDateTimeNG } from '../utils/formatters';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Sparkles,
  Link,
  Search,
  Check,
  X,
} from 'lucide-react';

interface QualityControlViewProps {
  records: QualityControlRecord[];
  pendingBatches: ProductionOrder[];
  onSubmitInspection: (data: any) => Promise<void>;
}

export const QualityControlView: React.FC<QualityControlViewProps> = ({
  records,
  pendingBatches,
  onSubmitInspection,
}) => {
  const [inspectingBatch, setInspectingBatch] = useState<ProductionOrder | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<QualityControlRecord | null>(null);

  // Form state
  const [samplesTested, setSamplesTested] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [actualWeight, setActualWeight] = useState(0);
  const [crumbRating, setCrumbRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [crustRating, setCrustRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [aromaRating, setAromaRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [moisturePassed, setMoisturePassed] = useState(true);
  const [packagingPassed, setPackagingPassed] = useState(true);
  const [decision, setDecision] = useState<'RELEASED' | 'ON_HOLD' | 'REJECTED'>('RELEASED');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingBatch) return;

    await onSubmitInspection({
      batchId: inspectingBatch.id,
      sampleLoavesTested: samplesTested,
      targetWeightGrams: targetWeight,
      actualAverageWeightGrams: actualWeight,
      crumbTextureRating: crumbRating,
      crustColorRating: crustRating,
      aromaTasteRating: aromaRating,
      moisturePassed,
      packagingSealingPassed: packagingPassed,
      overallDecision: decision,
      rejectionReason: decision !== 'RELEASED' ? rejectionReason : undefined,
    });

    setInspectingBatch(null);
  };

  const batchesAwaitingQC = pendingBatches.filter(
    b => b.qcStatus === 'PENDING' && b.actualGoodLoaves > 0
  );

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            Quality Control & Batch Traceability
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict weight tolerance checks (±3%), crumb elasticity, crust goldenness, hygiene release and flour-to-customer genealogy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
            Pending QC: <strong className="text-amber-400">{batchesAwaitingQC.length}</strong> batches
          </span>
        </div>
      </div>

      {/* Batches Awaiting QC Inspection Alert Box */}
      {batchesAwaitingQC.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Batches Ready on Cooling Racks Awaiting Quality Release
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {batchesAwaitingQC.map(b => (
              <div key={b.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{b.productName}</div>
                  <div className="text-[10px] font-mono text-blue-400">{b.batchNumber}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{b.actualGoodLoaves} loaves baked</div>
                </div>
                <button
                  onClick={() => {
                    setInspectingBatch(b);
                    setTargetWeight(b.productName.includes('1kg') ? 1000 : 800);
                    setActualWeight(b.productName.includes('1kg') ? 1005 : 805);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                >
                  Conduct QC
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspected Batches & Release Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Batch Inspection History ({records.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Click any row to view complete traceability genealogy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Weight (Target vs Actual)</th>
                <th className="p-3">Weight Var %</th>
                <th className="p-3">Crumb / Crust / Aroma</th>
                <th className="p-3">Moisture & Seal</th>
                <th className="p-3">QC Decision</th>
                <th className="p-3">Inspector</th>
                <th className="p-3 text-right">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-400">
                    {rec.batchNumber}
                  </td>
                  <td className="p-3 font-medium text-white">
                    {rec.productName}
                  </td>
                  <td className="p-3 text-slate-300 font-mono">
                    {rec.targetWeightGrams}g → <strong className="text-white">{rec.actualAverageWeightGrams}g</strong>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      rec.isWeightCompliant ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {rec.weightVariancePercentage}% {rec.isWeightCompliant ? '✓' : '⚠️'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <span>Crumb: {rec.crumbTextureRating}/5</span> •
                      <span>Crust: {rec.crustColorRating}/5</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] text-emerald-400 font-medium">
                      {rec.moisturePassed && rec.packagingSealingPassed ? 'Passed ✓' : 'Defect'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rec.overallDecision === 'RELEASED'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : rec.overallDecision === 'ON_HOLD'
                        ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {rec.overallDecision}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {rec.inspectorName}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedRecord(rec)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-xs font-semibold flex items-center gap-1 ml-auto"
                    >
                      <Link className="w-3 h-3" />
                      Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Inspection Modal */}
      {inspectingBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-cyan-400" />
                  Quality Control Examination
                </h2>
                <div className="text-xs text-blue-400 font-mono">
                  {inspectingBatch.batchNumber} • {inspectingBatch.productName}
                </div>
              </div>
              <button onClick={() => setInspectingBatch(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Samples Tested</label>
                  <input
                    type="number"
                    value={samplesTested}
                    onChange={e => setSamplesTested(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Weight (g)</label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={e => setTargetWeight(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Actual Avg (g)</label>
                  <input
                    type="number"
                    value={actualWeight}
                    onChange={e => setActualWeight(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              {/* Sensory Evaluation */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Crumb Texture (1-5)</label>
                  <select
                    value={crumbRating}
                    onChange={e => setCrumbRating(Number(e.target.value) as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value={5}>5 - Excellent Elasticity</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Acceptable</option>
                    <option value={2}>2 - Dense/Gummy</option>
                    <option value={1}>1 - Collapsed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Crust Color (1-5)</label>
                  <select
                    value={crustRating}
                    onChange={e => setCrustRating(Number(e.target.value) as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value={5}>5 - Golden Mahogany</option>
                    <option value={4}>4 - Pale Golden</option>
                    <option value={3}>3 - Acceptable</option>
                    <option value={2}>2 - Dark/Over-baked</option>
                    <option value={1}>1 - Burnt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Aroma & Taste (1-5)</label>
                  <select
                    value={aromaRating}
                    onChange={e => setAromaRating(Number(e.target.value) as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value={5}>5 - Fresh Buttery Aroma</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Flat</option>
                    <option value={2}>2 - Sour/Yeasty</option>
                    <option value={1}>1 - Off-flavor</option>
                  </select>
                </div>
              </div>

              {/* Moisture & Seal Checkboxes */}
              <div className="flex items-center gap-4 py-2 border-y border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moisturePassed}
                    onChange={e => setMoisturePassed(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 w-4 h-4"
                  />
                  <span className="text-slate-300">Moisture Content Safe (≤ 38%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packagingPassed}
                    onChange={e => setPackagingPassed(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 w-4 h-4"
                  />
                  <span className="text-slate-300">Nylon Wrapper Seal Intact</span>
                </label>
              </div>

              {/* Overall Decision */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">QC Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('RELEASED')}
                    className={`py-2 rounded-lg font-bold border transition-colors ${
                      decision === 'RELEASED'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ✓ RELEASE
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('ON_HOLD')}
                    className={`py-2 rounded-lg font-bold border transition-colors ${
                      decision === 'ON_HOLD'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ⏸ ON HOLD
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2 rounded-lg font-bold border transition-colors ${
                      decision === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ✕ REJECT
                  </button>
                </div>
              </div>

              {decision !== 'RELEASED' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reason for Hold/Rejection</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Specify defect or reason..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectingBatch(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Sign & Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Traceability Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Link className="w-5 h-5 text-blue-400" />
                  Full Batch Traceability Chain
                </h2>
                <div className="text-xs text-blue-400 font-mono">
                  {selectedRecord.batchNumber}
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Flour Lot Reference:</span>
                  <span className="font-mono font-bold text-white">{selectedRecord.traceabilityChain.flourLot}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Yeast Lot:</span>
                  <span className="font-mono font-bold text-white">{selectedRecord.traceabilityChain.yeastLot}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Baking Shift:</span>
                  <span className="text-white font-medium">{selectedRecord.traceabilityChain.bakingShift}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Oven Number:</span>
                  <span className="text-amber-400 font-medium">{selectedRecord.traceabilityChain.ovenNumber}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Release Timestamp:</span>
                  <span className="text-slate-200">{formatDateTimeNG(selectedRecord.releasedAt)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-300 text-[11px]">
                Batch verified compliant with NAFDAC bakery standards & FCT Public Health food safety requirements.
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
