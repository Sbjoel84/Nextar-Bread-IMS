import React, { useState } from 'react';
import { OperatingExpense, JournalEntry, BreadProduct } from '../types/erp';
import { formatNaira, formatDateNG, formatDateTimeNG } from '../utils/formatters';
import {
  PiggyBank,
  Plus,
  Flame,
  FileSpreadsheet,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface FinanceViewProps {
  expenses: OperatingExpense[];
  journalEntries: JournalEntry[];
  products: BreadProduct[];
  onAddExpense: (data: any) => Promise<void>;
  onPostJournal: (data: any) => Promise<void>;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  expenses,
  journalEntries,
  products,
  onAddExpense,
  onPostJournal,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'costing' | 'journal'>('expenses');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  // Expense Form
  const [category, setCategory] = useState<OperatingExpense['category']>('GAS_OVEN_FUEL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(150000);
  const [beneficiary, setBeneficiary] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH_FLOAT' | 'COMPANY_BANK_TRANSFER'>('COMPANY_BANK_TRANSFER');

  // Journal Form
  const [narration, setNarration] = useState('');
  const [debitAccount, setDebitAccount] = useState('6100 - Factory Fuel & Energy');
  const [creditAccount, setCreditAccount] = useState('1100 - GTBank Corporate Account');
  const [journalAmount, setJournalAmount] = useState(250000);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddExpense({
      category,
      description,
      amount,
      beneficiaryName: beneficiary,
      paymentMethod,
    });
    setShowExpenseModal(false);
    setDescription('');
    setBeneficiary('');
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPostJournal({
      narration,
      lines: [
        {
          accountCode: debitAccount.slice(0, 4),
          accountName: debitAccount.slice(7),
          debitAmount: journalAmount,
          creditAmount: 0,
        },
        {
          accountCode: creditAccount.slice(0, 4),
          accountName: creditAccount.slice(7),
          debitAmount: 0,
          creditAmount: journalAmount,
        },
      ],
    });
    setShowJournalModal(false);
    setNarration('');
  };

  const totalExpenses = expenses.filter(e => e.status !== 'REJECTED').reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-amber-400" />
            Financial Control, Operating Expenses & Unit Costing
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Rotary oven gas consumption, generator diesel, daily wages, double-entry general ledger, and loaf margin economics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'expenses' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Operating Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('costing')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'costing' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Unit Loaf Costing
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'journal' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              General Journal ({journalEntries.length})
            </button>
          </div>

          {activeTab === 'expenses' ? (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Expense Voucher</span>
            </button>
          ) : activeTab === 'journal' ? (
            <button
              onClick={() => setShowJournalModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Post Journal Entry</span>
            </button>
          ) : null}
        </div>
      </div>

      {activeTab === 'expenses' ? (
        /* Expenses Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Total Approved Expenses: <strong className="text-amber-400 font-mono">{formatNaira(totalExpenses)}</strong>
            </span>
            <span className="text-[11px] text-slate-400">
              Fuel, generator diesel, bakery maintenance and shift stipends
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Voucher #</th>
                  <th className="p-3">Expense Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description & Purpose</th>
                  <th className="p-3">Beneficiary</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Channel</th>
                  <th className="p-3">Approved By</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">{exp.voucherNumber}</td>
                    <td className="p-3 text-slate-300 font-mono text-[11px]">{formatDateNG(exp.expenseDate)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                        {exp.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-white max-w-xs">{exp.description}</td>
                    <td className="p-3 text-slate-300">{exp.beneficiaryName}</td>
                    <td className="p-3 font-mono font-bold text-amber-300 text-sm">
                      {formatNaira(exp.amount)}
                    </td>
                    <td className="p-3 text-slate-400">{exp.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-slate-300 text-[11px]">{exp.approvedBy}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 uppercase">
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'costing' ? (
        /* Unit Costing Cards */
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
            Unit loaf economics based on actual flour consumption, margarine, yeast, branded nylons, and bakery energy overheads (LPG rotary oven gas + Mikano generator diesel).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(p => {
              const rawCost = Math.round(p.estimatedCostPrice * 0.75);
              const energyCost = Math.round(p.estimatedCostPrice * 0.15);
              const packagingCost = 26; // ₦26 per nylon
              const laborCost = Math.round(p.estimatedCostPrice * 0.10);
              const totalCost = rawCost + energyCost + packagingCost + laborCost;
              const margin = p.wholesalePrice - totalCost;
              const marginPercent = Math.round((margin / p.wholesalePrice) * 100);

              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{p.name}</h3>
                      <div className="text-[10px] text-slate-400">{p.sizeGrams}g Loaf</div>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
                      {marginPercent}% Margin
                    </span>
                  </div>

                  <div className="space-y-1 text-xs pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Flour & Ingredients:</span>
                      <span className="font-mono text-slate-200">{formatNaira(rawCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Gas & Diesel Energy:</span>
                      <span className="font-mono text-slate-200">{formatNaira(energyCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Branded Nylon Wrapper:</span>
                      <span className="font-mono text-slate-200">{formatNaira(packagingCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Baking Shift Labor:</span>
                      <span className="font-mono text-slate-200">{formatNaira(laborCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                      <span>Total Unit Cost:</span>
                      <span className="font-mono text-rose-300">{formatNaira(totalCost)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Wholesale Price:</span>
                      <span className="font-mono font-bold text-white">{formatNaira(p.wholesalePrice)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Gross Profit / Loaf:</span>
                      <span className="font-mono font-bold text-emerald-400">+{formatNaira(margin)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Journal Entries Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Entry Number</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Narration</th>
                  <th className="p-3">Account Lines (Debits & Credits)</th>
                  <th className="p-3">Total Balance</th>
                  <th className="p-3">Posted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {journalEntries.map(jrn => (
                  <tr key={jrn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-400">{jrn.entryNumber}</td>
                    <td className="p-3 text-slate-300 font-mono text-[11px]">{formatDateNG(jrn.date)}</td>
                    <td className="p-3 font-medium text-white max-w-sm">{jrn.narration}</td>
                    <td className="p-3 text-slate-300">
                      <div className="space-y-1">
                        {jrn.lines.map((l, i) => (
                          <div key={i} className="flex justify-between font-mono text-[11px]">
                            <span>
                              {l.debitAmount > 0 ? 'Dr' : 'Cr'} {l.accountCode} - {l.accountName}
                            </span>
                            <span className={l.debitAmount > 0 ? 'text-emerald-400' : 'text-slate-300'}>
                              {formatNaira(l.debitAmount || l.creditAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-white text-sm">
                      {formatNaira(jrn.totalDebit)}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{jrn.postedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-500" />
                Create Expense Payment Voucher
              </h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="GAS_OVEN_FUEL">Rotary Deck Oven Gas Fuel (LPG)</option>
                  <option value="DIESEL_GENERATOR">Diesel Fuel for 100kVA Mikano Generator</option>
                  <option value="VEHICLE_FUEL_AND_MAINTENANCE">Delivery Van Fuel & Servicing</option>
                  <option value="ELECTRICITY_AEDC">AEDC Public Power Bill</option>
                  <option value="DAILY_BAKERY_LABOUR">Daily Bakery Auxiliary Shift Wages</option>
                  <option value="WATER_TREATMENT_AND_SALT">Water Treatment & Salt Maintenance</option>
                  <option value="FACTORY_SANITATION_AND_SAFETY">Bakery Sanitation & Disinfection</option>
                  <option value="OFFICE_AND_ADMIN">Office & Administrative Supplies</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Narration</label>
                <input
                  type="text"
                  placeholder="e.g. 150 Litres AGO Diesel purchased for night baking"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-amber-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="COMPANY_BANK_TRANSFER">Corporate Bank Transfer</option>
                    <option value="CASH_FLOAT">Petty Cash Float</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Beneficiary / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. TotalEnergies Gas Kubwa"
                  value={beneficiary}
                  onChange={e => setBeneficiary(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold"
                >
                  Authorize Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Journal Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                Post General Journal Entry
              </h2>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJournalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Narration</label>
                <input
                  type="text"
                  placeholder="e.g. Allocation of weekly diesel costs"
                  value={narration}
                  onChange={e => setNarration(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Debit Account (Dr)</label>
                <select
                  value={debitAccount}
                  onChange={e => setDebitAccount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="6100 - Factory Fuel & Energy">6100 - Factory Fuel & Energy</option>
                  <option value="5100 - Cost of Goods Sold (Raw Materials)">5100 - Cost of Goods Sold</option>
                  <option value="6200 - Vehicle Logistics & Maintenance">6200 - Vehicle Logistics</option>
                  <option value="1300 - Raw Materials Inventory">1300 - Raw Materials Inventory</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Credit Account (Cr)</label>
                <select
                  value={creditAccount}
                  onChange={e => setCreditAccount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="1100 - GTBank Corporate Account">1100 - GTBank Corporate Account</option>
                  <option value="1110 - Zenith Bank Operating Account">1110 - Zenith Bank Operating Account</option>
                  <option value="1010 - Petty Cash Float Vault">1010 - Petty Cash Float Vault</option>
                  <option value="2100 - Accounts Payable (Suppliers)">2100 - Accounts Payable (Suppliers)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Entry Amount (₦)</label>
                <input
                  type="number"
                  value={journalAmount}
                  onChange={e => setJournalAmount(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-xl text-indigo-300 text-[11px]">
                Double-entry balancing validation: Total Debits ({formatNaira(journalAmount)}) equal Total Credits ({formatNaira(journalAmount)}).
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                >
                  Post to General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
