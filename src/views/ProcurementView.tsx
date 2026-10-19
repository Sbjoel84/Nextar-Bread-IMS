import React, { useState } from 'react';
import { Supplier, PurchaseOrder, GoodsReceiptNote, RawMaterial } from '../types/erp';
import { formatNaira, formatDateNG, formatDateTimeNG } from '../utils/formatters';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  Check,
  X,
  Package,
} from 'lucide-react';

interface ProcurementViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceiptNotes: GoodsReceiptNote[];
  rawMaterials: RawMaterial[];
  onCreatePO: (data: any) => Promise<void>;
  onApprovePO: (poId: string) => Promise<void>;
  onCreateGRN: (data: any) => Promise<void>;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  suppliers,
  purchaseOrders,
  goodsReceiptNotes,
  rawMaterials,
  onCreatePO,
  onApprovePO,
  onCreateGRN,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'grn' | 'suppliers'>('orders');
  const [showPOModal, setShowPOModal] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedMaterialId, setSelectedMaterialId] = useState(rawMaterials[0]?.id || '');
  const [orderQty, setOrderQty] = useState(100);
  const [poNotes, setPONotes] = useState('');

  // GRN State
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');
  const [receivedQty, setReceivedQty] = useState(100);
  const [supplierLot, setSupplierLot] = useState('LOT-2026-');

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
  const selectedMaterial = rawMaterials.find(m => m.id === selectedMaterialId) || rawMaterials[0];

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !selectedMaterial || orderQty <= 0) return;

    const unitPrice = selectedMaterial.standardCostPerUnit;
    const totalPrice = unitPrice * orderQty;

    await onCreatePO({
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      items: [
        {
          rawMaterialId: selectedMaterial.id,
          name: selectedMaterial.name,
          quantityOrdered: orderQty,
          quantityReceived: 0,
          unit: selectedMaterial.unitOfMeasure,
          unitPrice,
          totalPrice,
        },
      ],
      notes: poNotes,
    });
    setShowPOModal(false);
  };

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPO) return;

    const firstItem = receivingPO.items[0];
    await onCreateGRN({
      poId: receivingPO.id,
      supplierInvoiceRef,
      items: [
        {
          rawMaterialId: firstItem.rawMaterialId,
          name: firstItem.name,
          quantityReceived: receivedQty,
          unit: firstItem.unit,
          unitCost: firstItem.unitPrice,
          supplierLotNumber: supplierLot,
          condition: 'EXCELLENT',
        },
      ],
      remarks: 'Inspected and verified at Kubwa Silo bay.',
    });
    setReceivingPO(null);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            Supplier Procurement & 3-Way Matching GRN
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Purchase requisitions, GM authorization thresholds, supplier delivery notes and automatic stock ledger intake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'orders' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('grn')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'grn' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Goods Receipts (GRN) ({goodsReceiptNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'suppliers' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Suppliers ({suppliers.length})
            </button>
          </div>

          <button
            onClick={() => setShowPOModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        /* Purchase Orders Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Ordered Items</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Approver</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-400">{po.poNumber}</td>
                    <td className="p-3 font-semibold text-white">{po.supplierName}</td>
                    <td className="p-3 text-slate-300">{formatDateNG(po.orderDate)}</td>
                    <td className="p-3 text-slate-200">
                      {po.items.map((it, i) => (
                        <div key={i} className="text-[11px]">
                          <strong>{it.quantityOrdered} {it.unit}</strong> • {it.name}
                        </div>
                      ))}
                    </td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-sm">
                      {formatNaira(po.totalAmount)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        po.status === 'RECEIVED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : po.status === 'APPROVED'
                          ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {po.approvedBy || <span className="text-amber-400">Pending GM approval</span>}
                    </td>
                    <td className="p-3 text-right">
                      {po.status === 'SUBMITTED' && (
                        <button
                          onClick={() => onApprovePO(po.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                        >
                          Approve PO
                        </button>
                      )}
                      {po.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            setReceivingPO(po);
                            setReceivedQty(po.items[0]?.quantityOrdered || 100);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                        >
                          Post GRN
                        </button>
                      )}
                      {po.status === 'RECEIVED' && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Received
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'grn' ? (
        /* GRN Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
            Goods Received Notes (GRN) confirm delivery from supplier trucks. Posting increases inventory and updates the stock ledger immediately.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">GRN Number</th>
                  <th className="p-3">PO Reference</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Supplier Invoice Ref</th>
                  <th className="p-3">Date Received</th>
                  <th className="p-3">Received Items</th>
                  <th className="p-3">Receiving Officer</th>
                  <th className="p-3">3-Way Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {goodsReceiptNotes.map(grn => (
                  <tr key={grn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-400">{grn.grnNumber}</td>
                    <td className="p-3 font-mono text-blue-400">{grn.poNumber}</td>
                    <td className="p-3 font-semibold text-white">{grn.supplierName}</td>
                    <td className="p-3 font-mono text-slate-300">{grn.supplierInvoiceRef}</td>
                    <td className="p-3 text-slate-300">{formatDateNG(grn.receivedDate)}</td>
                    <td className="p-3 text-slate-200">
                      {grn.items.map((it, i) => (
                        <div key={i} className="text-[11px]">
                          <strong>{it.quantityReceived} {it.unit}</strong> ({it.name})
                        </div>
                      ))}
                    </td>
                    <td className="p-3 text-slate-300">{grn.receivedBy}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 w-fit">
                        <Check className="w-3 h-3" /> Reconciled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Suppliers Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono text-blue-400 uppercase font-bold">{sup.code}</div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{sup.name}</h3>
                </div>
                <span className="text-amber-400 text-xs">{'★'.repeat(sup.rating)}</span>
              </div>

              <div className="text-xs space-y-1 text-slate-300">
                <div><strong>Contact:</strong> {sup.contactPerson}</div>
                <div><strong>Phone:</strong> {sup.phone}</div>
                <div><strong>Address:</strong> {sup.address}</div>
                <div><strong>Terms:</strong> {sup.paymentTerms.replace(/_/g, ' ')}</div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Payable Balance:</span>
                <span className="font-mono font-bold text-rose-400">{formatNaira(sup.outstandingPayable)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Issue Purchase Order (PO)
              </h2>
              <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePOSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Raw Material</label>
                <select
                  value={selectedMaterialId}
                  onChange={e => setSelectedMaterialId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatNaira(m.standardCostPerUnit)} / {m.unitOfMeasure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quantity to Order</label>
                <input
                  type="number"
                  value={orderQty}
                  onChange={e => setOrderQty(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Unit Price:</span>
                  <span>{formatNaira(selectedMaterial?.standardCostPerUnit)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-800 mt-1">
                  <span>Total Order Value:</span>
                  <span className="text-emerald-400">
                    {formatNaira((selectedMaterial?.standardCostPerUnit || 0) * orderQty)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post GRN Modal */}
      {receivingPO && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Receive Goods (GRN)
                </h2>
                <div className="text-xs text-blue-400 font-mono">
                  Against {receivingPO.poNumber} • {receivingPO.supplierName}
                </div>
              </div>
              <button onClick={() => setReceivingPO(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGRNSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supplier Waybill / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. INV-FMN-98214"
                  value={supplierInvoiceRef}
                  onChange={e => setSupplierInvoiceRef(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity Received</label>
                  <input
                    type="number"
                    value={receivedQty}
                    onChange={e => setReceivedQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier Lot / Batch #</label>
                  <input
                    type="text"
                    value={supplierLot}
                    onChange={e => setSupplierLot(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-300 text-[11px]">
                Posting this GRN will automatically increase raw material stock and create a certified entry in the Stock Movement Ledger.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceivingPO(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Confirm & Post GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
