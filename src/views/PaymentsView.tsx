import React, { useState } from 'react';
import { PaymentReceipt, Customer, SalesInvoice } from '../types/erp';
import { formatNaira, formatDateNG, formatDateTimeNG } from '../utils/formatters';
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ShieldCheck,
  X,
} from 'lucide-react';

interface PaymentsViewProps {
  payments: PaymentReceipt[];
  customers: Customer[];
  invoices: SalesInvoice[];
  onRecordPayment: (data: any) => Promise<void>;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  customers,
  invoices,
  onRecordPayment,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState(50000);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'POS_MONIEPOINT' | 'POS_OPAY'>('POS_MONIEPOINT');
  const [bankRef, setBankRef] = useState('');

  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const customerInvoices = invoices.filter(
    i => i.customerId === currentCustomer?.id && i.status !== 'PAID'
  );

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    await onRecordPayment({
      customerId: currentCustomer.id,
      invoiceId: selectedInvoiceId || undefined,
      amountPaid: amount,
      paymentMethod,
      bankReferenceNumber: bankRef || undefined,
      idempotencyKey: `PAY-MANUAL-${Date.now()}`,
    });
    setShowModal(false);
    setBankRef('');
  };

  const totalCollected = payments.filter(p => !p.isReversed).reduce((acc, p) => acc + p.amountPaid, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Customer Payment Receipts & Idempotent Settlements
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record customer collections (Cash, GTBank / Zenith transfer, Moniepoint POS) with duplicate prevention keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-400 block">Total Receipts Processed:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatNaira(totalCollected)}
            </span>
          </div>

          <button
            onClick={() => {
              setAmount(50000);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Receipt Number</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Invoice Ref</th>
                <th className="p-3">Payment Date</th>
                <th className="p-3">Amount Paid</th>
                <th className="p-3">Channel / Method</th>
                <th className="p-3">Bank Reference / POS</th>
                <th className="p-3">Cashier / Officer</th>
                <th className="p-3">Idempotency Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-400">{p.receiptNumber}</td>
                  <td className="p-3 font-semibold text-white">{p.customerName}</td>
                  <td className="p-3 font-mono text-blue-400">{p.invoiceNumber || 'Account Credit'}</td>
                  <td className="p-3 text-slate-300 font-mono text-[11px]">{formatDateNG(p.paymentDate)}</td>
                  <td className="p-3 font-mono font-bold text-emerald-400 text-sm">
                    {formatNaira(p.amountPaid)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {p.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300 text-[11px]">{p.bankReferenceNumber || '-'}</td>
                  <td className="p-3 text-slate-400 text-[11px]">{p.recordedBy}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3" /> Unique Posted
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Record Customer Payment Receipt
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedInvoiceId('');
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} (Outstanding: {formatNaira(c.currentOutstandingBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {customerInvoices.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allocate to Specific Invoice</label>
                  <select
                    value={selectedInvoiceId}
                    onChange={e => setSelectedInvoiceId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">General Account Settlement</option>
                    {customerInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} (Due: {formatNaira(inv.amountDue)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount Paid (₦)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="POS_MONIEPOINT">Moniepoint POS Terminal</option>
                    <option value="POS_OPAY">OPay POS Terminal</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                    <option value="CASH">Physical Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bank Reference / POS Transaction RRN</label>
                <input
                  type="text"
                  placeholder="e.g. MP-POS-20261018-9941"
                  value={bankRef}
                  onChange={e => setBankRef(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-300 text-[11px]">
                Posting automatically credits the customer's ledger, adjusts outstanding balances, and records in the active cashier register.
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
