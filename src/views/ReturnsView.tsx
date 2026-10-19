import React, { useState } from 'react';
import { BreadReturnRecord, Customer, BreadProduct } from '../types/erp';
import { formatNaira, formatDateNG } from '../utils/formatters';
import {
  RotateCcw,
  Plus,
  AlertTriangle,
  FileText,
  DollarSign,
  Recycle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface ReturnsViewProps {
  returns: BreadReturnRecord[];
  customers: Customer[];
  products: BreadProduct[];
  onAddReturn: (data: any) => Promise<void>;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  returns,
  customers,
  products,
  onAddReturn,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [returnQty, setReturnQty] = useState(10);
  const [reason, setReason] = useState<any>('STALE_UNSOLD');
  const [disposition, setDisposition] = useState<any>('SELL_AS_ANIMAL_FEED');
  const [salvageAmount, setSalvageAmount] = useState(2000);
  const [issueCreditNote, setIssueCreditNote] = useState(true);
  const [creditAmount, setCreditAmount] = useState(10200);

  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const currentProduct = products.find(p => p.id === selectedProductId) || products[0];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddReturn({
      customerId: currentCustomer.id,
      customerName: currentCustomer.businessName,
      items: [
        {
          productId: currentProduct.id,
          productName: currentProduct.name,
          batchNumber: 'NXT-RETURN',
          quantity: returnQty,
          reason,
        },
      ],
      dispositionAction: disposition,
      salvageRecoveryAmount: salvageAmount,
      creditNoteIssuedToCustomer: issueCreditNote,
      creditNoteAmount: issueCreditNote ? creditAmount : 0,
    });
    setShowModal(false);
  };

  const totalReturnedLoaves = returns.reduce((acc, r) => acc + r.totalLoavesReturned, 0);
  const totalSalvage = returns.reduce((acc, r) => acc + r.salvageRecoveryAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            Stale Bread Returns & Animal Feed Salvage Disposition
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Supermarket unsold bread returns, transit damage write-offs, poultry feed salvage sales and customer credit note issuance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-400 block">Salvage Revenue Recovered:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatNaira(totalSalvage)}
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Log Returns</span>
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Return Reference</th>
                <th className="p-3">Customer Outlet</th>
                <th className="p-3">Date</th>
                <th className="p-3">Loaves Returned</th>
                <th className="p-3">Primary Reason</th>
                <th className="p-3">Disposition Action</th>
                <th className="p-3">Salvage Recovery</th>
                <th className="p-3">Credit Note Issued</th>
                <th className="p-3">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {returns.map(ret => (
                <tr key={ret.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-rose-400">{ret.returnNumber}</td>
                  <td className="p-3 font-semibold text-white">{ret.customerName || 'Route Return'}</td>
                  <td className="p-3 text-slate-300 font-mono text-[11px]">{formatDateNG(ret.date)}</td>
                  <td className="p-3 font-mono font-bold text-rose-300 text-sm">
                    {ret.totalLoavesReturned} Loaves
                  </td>
                  <td className="p-3 text-slate-300">
                    {ret.items[0]?.reason.replace(/_/g, ' ') || 'Unsold Bread'}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60 uppercase">
                      {ret.dispositionAction.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    {formatNaira(ret.salvageRecoveryAmount)}
                  </td>
                  <td className="p-3">
                    {ret.creditNoteIssuedToCustomer ? (
                      <span className="text-blue-400 font-mono font-semibold">
                        {formatNaira(ret.creditNoteAmount)}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">{ret.approvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                Record Bread Returns & Disposition
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer / Supermarket</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName}</option>
                  ))}
                </select>
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
                  <label className="block text-slate-300 font-semibold mb-1">Loaves Returned</label>
                  <input
                    type="number"
                    value={returnQty}
                    onChange={e => {
                      const qty = Number(e.target.value);
                      setReturnQty(qty);
                      setCreditAmount(qty * (currentProduct?.wholesalePrice || 1020));
                      setSalvageAmount(qty * 200);
                    }}
                    min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reason for Return</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="STALE_UNSOLD">Stale / 5-Day Shelf Life Expiry</option>
                    <option value="TRANSIT_CRUSHED">Damaged in Van Transit</option>
                    <option value="PACKAGING_DEFECT">Nylon Sealing Tear</option>
                    <option value="OVER_BAKED">Crust Defect / Over-baked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Disposition Action</label>
                  <select
                    value={disposition}
                    onChange={e => setDisposition(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="SELL_AS_ANIMAL_FEED">Sell as Poultry/Fish Feed (₦200/loaf)</option>
                    <option value="TOAST_AS_BREADCRUMBS">Toast for Bakery Breadcrumbs</option>
                    <option value="TOTAL_DESTROY_WRITEOFF">Destroy & Complete Write-off</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Salvage Recovery (₦)</label>
                  <input
                    type="number"
                    value={salvageAmount}
                    onChange={e => setSalvageAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credit Note to Customer (₦)</label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={e => setCreditAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono text-blue-400 font-bold"
                  />
                </div>
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
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-bold"
                >
                  Confirm & Post Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
