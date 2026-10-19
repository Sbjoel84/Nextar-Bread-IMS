import React, { useState } from 'react';
import { Customer, Marketer } from '../types/erp';
import { formatNaira, formatDateNG } from '../utils/formatters';
import {
  Store,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MapPin,
  Coins,
  ShieldCheck,
  X,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  marketers: Marketer[];
  onAddCustomer: (data: any) => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  marketers,
  onAddCustomer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [customerType, setCustomerType] = useState<Customer['customerType']>('SUPERMARKET');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Kubwa, Abuja');
  const [territory, setTerritory] = useState('Kubwa Central');
  const [assignedMarketerId, setAssignedMarketerId] = useState(marketers[0]?.id || '');
  const [priceTier, setPriceTier] = useState<'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'>('WHOLESALE');
  const [creditLimit, setCreditLimit] = useState(500000);
  const [creditDays, setCreditDays] = useState(7);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedMarketer = marketers.find(m => m.id === assignedMarketerId);
    await onAddCustomer({
      name,
      businessName: businessName || name,
      customerType,
      phone,
      address,
      territory,
      assignedMarketerId,
      assignedMarketerName: assignedMarketer?.fullName,
      priceTier,
      creditLimit,
      creditDays,
    });
    setShowAddModal(false);
  };

  const totalOutstanding = customers.reduce((acc, c) => acc + c.currentOutstandingBalance, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-400" />
            Customer & Wholesale Distributor Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Supermarket outlets, regional bread depots, schools, credit limit controls and overdue aging balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-400 block">Total Receivables (Debtors):</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatNaira(totalOutstanding)}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Customer Code</th>
                <th className="p-3">Business Name & Contact</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Assigned Marketer</th>
                <th className="p-3">Price Tier</th>
                <th className="p-3">Credit Limit</th>
                <th className="p-3">Outstanding Balance</th>
                <th className="p-3">Credit Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {customers.map(c => {
                const percentUsed = c.creditLimit > 0
                  ? Math.round((c.currentOutstandingBalance / c.creditLimit) * 100)
                  : 0;
                const isOverdueRisk = percentUsed > 75;

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-400">{c.customerCode}</td>
                    <td className="p-3">
                      <div className="font-bold text-white text-sm">{c.businessName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{c.name} • {c.phone}</div>
                      <div className="text-[10px] text-slate-400">{c.address}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {c.customerType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      <div className="font-medium text-slate-200">{c.assignedMarketerName || 'Direct Bakery'}</div>
                      <div className="text-[10px] text-slate-400">{c.territory}</div>
                    </td>
                    <td className="p-3 font-semibold text-amber-300">{c.priceTier}</td>
                    <td className="p-3 font-mono text-slate-300">
                      <div>{formatNaira(c.creditLimit)}</div>
                      <div className="text-[10px] text-slate-400">{c.creditDays} days terms</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-sm text-white">
                      {formatNaira(c.currentOutstandingBalance)}
                    </td>
                    <td className="p-3">
                      {c.creditLimit === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          Cash Only
                        </span>
                      ) : isOverdueRisk ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {percentUsed}% Limit Used
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Good ({percentUsed}%)
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-400" />
                Register New Customer / Depot
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Business / Outlet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Supermarket Kubwa"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Classification</label>
                  <select
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="SUPERMARKET">Supermarket / Mart</option>
                    <option value="BREAD_DEPOT">Bread Depot / Wholesaler</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="RETAIL_KIOSK">Retail Kiosk</option>
                    <option value="INSTITUTION">School / Hospital Canteen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price Tier</label>
                  <select
                    value={priceTier}
                    onChange={e => setPriceTier(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="RETAIL">Standard Retail Price</option>
                    <option value="WHOLESALE">Approved Wholesale Price</option>
                    <option value="DISTRIBUTOR">Distributor Bulk Price</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assign Marketer</label>
                  <select
                    value={assignedMarketerId}
                    onChange={e => setAssignedMarketerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    {marketers.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.assignedTerritory})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Territory / Area</label>
                  <input
                    type="text"
                    value={territory}
                    onChange={e => setTerritory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credit Limit (₦)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={e => setCreditLimit(Number(e.target.value))}
                    step={50000}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Term (Days)</label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={e => setCreditDays(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
