import React, { useState } from 'react';
import { DispatchSheet, BreadProduct, Marketer } from '../types/erp';
import { formatNaira, formatDateNG, formatDateTimeNG } from '../utils/formatters';
import {
  Send,
  Plus,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Coins,
  Check,
  X,
} from 'lucide-react';

interface DispatchesViewProps {
  dispatches: DispatchSheet[];
  products: BreadProduct[];
  marketers: Marketer[];
  onCreateDispatch: (data: any) => Promise<void>;
  onReconcileDispatch: (id: string, data: any) => Promise<void>;
}

export const DispatchesView: React.FC<DispatchesViewProps> = ({
  dispatches,
  products,
  marketers,
  onCreateDispatch,
  onReconcileDispatch,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [reconcilingDispatch, setReconcilingDispatch] = useState<DispatchSheet | null>(null);

  // Form State
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [selectedMarketerId, setSelectedMarketerId] = useState(marketers[0]?.id || '');
  const [route, setRoute] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantityLoaded, setQuantityLoaded] = useState(0);

  // Reconcile Form State
  const [deliveredLoaves, setDeliveredLoaves] = useState(0);
  const [returnedLoaves, setReturnedLoaves] = useState(0);
  const [cashCollected, setCashCollected] = useState(0);
  const [transferCollected, setTransferCollected] = useState(0);
  const [reconcileNotes, setReconcileNotes] = useState('');

  const currentMarketer = marketers.find(m => m.id === selectedMarketerId) || marketers[0];
  const currentProduct = products.find(p => p.id === selectedProductId) || products[0];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateDispatch({
      driverName,
      vehicleNumberPlate: vehiclePlate,
      marketerId: currentMarketer?.id,
      marketerName: currentMarketer?.fullName,
      destinationRoute: route,
      items: [
        {
          productId: currentProduct.id,
          productName: currentProduct.name,
          batchNumber: `NXT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-S1`,
          quantityLoaded,
          quantityDelivered: 0,
          quantityReturned: 0,
          unitPrice: currentProduct.wholesalePrice,
        },
      ],
    });
    setShowModal(false);
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingDispatch) return;

    await onReconcileDispatch(reconcilingDispatch.id, {
      totalLoavesDelivered: deliveredLoaves,
      totalLoavesReturned: returnedLoaves,
      cashCollectedOnRoute: cashCollected,
      bankTransferOnRoute: transferCollected,
      reconciliationNotes: reconcileNotes,
    });
    setReconcilingDispatch(null);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            Dispatch Loading Sheets & Route Delivery Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Van loading authorization, driver gate pass, customer route delivery verification, cash/transfer collections and returns check.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Loading Sheet</span>
        </button>
      </div>

      {/* Dispatches Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Dispatch Number</th>
                <th className="p-3">Vehicle & Driver</th>
                <th className="p-3">Marketer & Route</th>
                <th className="p-3">Loaded</th>
                <th className="p-3">Delivered</th>
                <th className="p-3">Returns</th>
                <th className="p-3">Collections (Cash + Transfer)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dispatches.map(dsp => (
                <tr key={dsp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-400">{dsp.dispatchNumber}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{dsp.driverName}</div>
                    <div className="text-[10px] text-slate-400">{dsp.vehicleNumberPlate}</div>
                  </td>
                  <td className="p-3 text-slate-300">
                    <div className="font-medium text-slate-200">{dsp.marketerName || 'Direct Delivery'}</div>
                    <div className="text-[10px] text-cyan-400">{dsp.destinationRoute}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-white text-sm">{dsp.totalLoavesLoaded}</td>
                  <td className="p-3 font-mono font-semibold text-emerald-400">
                    {dsp.status === 'RECONCILED' ? dsp.totalLoavesDelivered : '-'}
                  </td>
                  <td className="p-3 font-mono font-semibold text-rose-400">
                    {dsp.status === 'RECONCILED' ? `${dsp.totalLoavesReturned} loaves` : '-'}
                  </td>
                  <td className="p-3 font-mono text-slate-200">
                    {dsp.status === 'RECONCILED' ? (
                      <div>
                        <strong className="text-emerald-400">{formatNaira(dsp.totalValueDelivered)}</strong>
                        <div className="text-[10px] text-slate-400">
                          Cash: {formatNaira(dsp.cashCollectedOnRoute)} • POS: {formatNaira(dsp.bankTransferOnRoute)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-amber-400 text-[11px]">En route</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      dsp.status === 'RECONCILED'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                    }`}>
                      {dsp.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {dsp.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => {
                          setReconcilingDispatch(dsp);
                          setDeliveredLoaves(dsp.totalLoavesLoaded);
                          setReturnedLoaves(0);
                          setCashCollected(0);
                          setTransferCollected(0);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                      >
                        Reconcile Route
                      </button>
                    )}
                    {dsp.status === 'RECONCILED' && (
                      <span className="text-[11px] text-slate-400">
                        {dsp.reconciledBy || 'Reconciled'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Loading Sheet Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                Create Dispatch Loading Sheet
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vehicle Plate #</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Marketer</label>
                  <select
                    value={selectedMarketerId}
                    onChange={e => setSelectedMarketerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    {marketers.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination Route</label>
                  <input
                    type="text"
                    value={route}
                    onChange={e => setRoute(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bread Product</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity Loaded (Loaves)</label>
                  <input
                    type="number"
                    value={quantityLoaded}
                    onChange={e => setQuantityLoaded(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-xl text-blue-200 text-[11px]">
                Authorized loaves will be deducted from the Finished Goods dispatch bay. Driver gate pass generated automatically.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Authorize Loading Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Route Modal */}
      {reconcilingDispatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Reconcile Route Delivery</h2>
                <div className="text-xs text-blue-400 font-mono">
                  {reconcilingDispatch.dispatchNumber} ({reconcilingDispatch.totalLoavesLoaded} loaves loaded)
                </div>
              </div>
              <button onClick={() => setReconcilingDispatch(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Loaves Delivered</label>
                  <input
                    type="number"
                    value={deliveredLoaves}
                    onChange={e => setDeliveredLoaves(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Loaves Returned (Stale/Crushed)</label>
                  <input
                    type="number"
                    value={returnedLoaves}
                    onChange={e => setReturnedLoaves(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-rose-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Physical Cash Collected (₦)</label>
                  <input
                    type="number"
                    value={cashCollected}
                    onChange={e => setCashCollected(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bank Transfer / POS (₦)</label>
                  <input
                    type="number"
                    value={transferCollected}
                    onChange={e => setTransferCollected(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reconciliation Notes</label>
                <input
                  type="text"
                  placeholder="Notes on return condition or cash breakdown..."
                  value={reconcileNotes}
                  onChange={e => setReconcileNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReconcilingDispatch(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Confirm & Balance Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
