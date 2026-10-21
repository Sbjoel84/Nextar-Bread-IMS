import React, { useState } from 'react';
import { SalesInvoice, Customer, BreadProduct, Marketer } from '../types/erp';
import { formatNaira, formatDateNG, formatDateTimeNG } from '../utils/formatters';
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Store,
  Printer,
  X,
} from 'lucide-react';

interface SalesInvoicesViewProps {
  invoices: SalesInvoice[];
  customers: Customer[];
  products: BreadProduct[];
  marketers: Marketer[];
  onCreateInvoice: (data: any) => Promise<void>;
}

export const SalesInvoicesView: React.FC<SalesInvoicesViewProps> = ({
  invoices,
  customers,
  products,
  marketers,
  onCreateInvoice,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(0);
  const [paymentType, setPaymentType] = useState<'CASH' | 'BANK_TRANSFER' | 'CREDIT'>('CREDIT');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const currentProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Calculate unit price based on customer price tier
  const unitPrice =
    currentCustomer?.priceTier === 'DISTRIBUTOR'
      ? currentProduct?.distributorPrice || 0
      : currentCustomer?.priceTier === 'WHOLESALE'
      ? currentProduct?.wholesalePrice || 0
      : currentProduct?.standardRetailPrice || 0;

  const subtotal = unitPrice * quantity;
  const netTotal = Math.max(0, subtotal - discountAmount);

  // Credit limit calculation
  const wouldExceedCredit =
    paymentType === 'CREDIT' &&
    currentCustomer &&
    currentCustomer.creditLimit > 0 &&
    currentCustomer.currentOutstandingBalance + netTotal > currentCustomer.creditLimit;

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (wouldExceedCredit) {
      setErrorMessage(
        `Credit limit breached! Customer limit is ₦${currentCustomer.creditLimit.toLocaleString()}. Current balance ₦${currentCustomer.currentOutstandingBalance.toLocaleString()} + this order ₦${netTotal.toLocaleString()} exceeds limit.`
      );
      return;
    }

    try {
      await onCreateInvoice({
        customerId: currentCustomer.id,
        marketerId: currentCustomer.assignedMarketerId,
        paymentType,
        discountAmount,
        items: [
          {
            productId: currentProduct.id,
            productName: currentProduct.name,
            quantity,
            unitPrice,
            subtotal,
          },
        ],
      });
      setShowModal(false);
      setDiscountAmount(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create invoice');
    }
  };

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.netPayableAmount, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Bakery Sales Orders & Commercial Invoicing
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Wholesale orders, credit control limit checks, discounts, VAT and customer invoicing for Abuja regional distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-400 block">Total Sales Invoiced:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatNaira(totalInvoiced)}
            </span>
          </div>

          <button
            onClick={() => {
              setErrorMessage('');
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Customer / Outlet</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items Ordered</th>
                <th className="p-3">Net Amount</th>
                <th className="p-3">Amount Paid</th>
                <th className="p-3">Amount Due</th>
                <th className="p-3">Terms</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{inv.customerName}</div>
                    <div className="text-[10px] text-slate-400">{inv.marketerName || 'Direct'}</div>
                  </td>
                  <td className="p-3 text-slate-300 font-mono text-[11px]">{formatDateNG(inv.invoiceDate)}</td>
                  <td className="p-3 text-slate-200">
                    {inv.items.map((it, i) => (
                      <div key={i} className="text-[11px]">
                        <strong>{it.quantity}x</strong> {it.productName} ({formatNaira(it.unitPrice)})
                      </div>
                    ))}
                  </td>
                  <td className="p-3 font-mono font-bold text-white text-sm">
                    {formatNaira(inv.netPayableAmount)}
                  </td>
                  <td className="p-3 font-mono text-emerald-400">
                    {formatNaira(inv.amountPaid)}
                  </td>
                  <td className="p-3 font-mono font-bold text-amber-300">
                    {formatNaira(inv.amountDue)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                      {inv.paymentType}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : inv.status === 'PARTIALLY_PAID'
                        ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                    }`}>
                      {inv.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Generate Sales Invoice
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleInvoiceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Customer Outlet</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.priceTier} Tier • Balance: {formatNaira(c.currentOutstandingBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Bread Product</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sizeGrams}g)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity (Loaves)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Commercial Terms</label>
                  <select
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="CREDIT">Credit Invoice (7-14 Days)</option>
                    <option value="CASH">Cash on Delivery</option>
                    <option value="BANK_TRANSFER">Bank Transfer / POS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Commercial Discount (₦)</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                  min={0}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              {/* Invoice Price Breakdown */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Unit Price ({currentCustomer?.priceTier} Tier):</span>
                  <span className="font-mono text-white">{formatNaira(unitPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono text-white">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-800">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-emerald-400">{formatNaira(netTotal)}</span>
                </div>
              </div>

              {wouldExceedCredit && (
                <div className="p-2.5 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Warning: This order breaches the customer's approved credit limit.</span>
                </div>
              )}

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
                  disabled={wouldExceedCredit}
                  className={`px-4 py-2 text-white rounded-lg font-bold transition-all ${
                    wouldExceedCredit ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  Post Official Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
