import React, { useMemo, useState } from 'react';
import { SalesInvoice, OperatingExpense } from '../types/erp';
import { formatNaira } from '../utils/formatters';
import { Scale, Coins, Receipt, TrendingUp, TrendingDown, Percent } from 'lucide-react';

interface MonthlyProfitSummaryProps {
  invoices: SalesInvoice[];
  expenses: OperatingExpense[];
}

interface MonthTotals {
  key: string; // YYYY-MM
  revenue: number;
  expenses: number;
  profit: number;
  invoiceCount: number;
  expenseCount: number;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function previousMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export const MonthlyProfitSummary: React.FC<MonthlyProfitSummaryProps> = ({ invoices, expenses }) => {
  // Revenue counts billed invoices only; expenses follow FinanceView and exclude rejected vouchers
  const totalsFor = useMemo(() => {
    const byMonth = new Map<string, MonthTotals>();
    const bucket = (key: string) => {
      let t = byMonth.get(key);
      if (!t) {
        t = { key, revenue: 0, expenses: 0, profit: 0, invoiceCount: 0, expenseCount: 0 };
        byMonth.set(key, t);
      }
      return t;
    };
    invoices
      .filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
      .forEach(inv => {
        const t = bucket(inv.invoiceDate.slice(0, 7));
        t.revenue += inv.netPayableAmount;
        t.invoiceCount += 1;
      });
    expenses
      .filter(e => e.status !== 'REJECTED')
      .forEach(e => {
        const t = bucket(e.expenseDate.slice(0, 7));
        t.expenses += e.amount;
        t.expenseCount += 1;
      });
    byMonth.forEach(t => (t.profit = t.revenue - t.expenses));
    return byMonth;
  }, [invoices, expenses]);

  const monthOptions = useMemo(() => {
    const keys = new Set(totalsFor.keys());
    keys.add(currentMonthKey());
    return [...keys].sort().reverse();
  }, [totalsFor]);

  const [month, setMonth] = useState<string>(currentMonthKey());

  const empty = (key: string): MonthTotals => ({ key, revenue: 0, expenses: 0, profit: 0, invoiceCount: 0, expenseCount: 0 });
  const selected = totalsFor.get(month) || empty(month);
  const prevKey = previousMonthKey(month);
  const previous = totalsFor.get(prevKey) || empty(prevKey);
  const margin = selected.revenue > 0 ? (selected.profit / selected.revenue) * 100 : null;
  const profitDelta = selected.profit - previous.profit;
  const isLoss = selected.profit < 0;

  const cards = [
    {
      label: 'Sales Revenue',
      value: formatNaira(selected.revenue),
      sub: `${selected.invoiceCount} billed invoice${selected.invoiceCount === 1 ? '' : 's'}`,
      icon: Coins,
      tone: 'text-blue-400',
    },
    {
      label: 'Operating Expenses',
      value: formatNaira(selected.expenses),
      sub: `${selected.expenseCount} expense voucher${selected.expenseCount === 1 ? '' : 's'}`,
      icon: Receipt,
      tone: 'text-rose-400',
    },
    {
      label: isLoss ? 'Net Loss' : 'Net Profit',
      value: isLoss ? `-${formatNaira(Math.abs(selected.profit))}` : formatNaira(selected.profit),
      sub: `${profitDelta >= 0 ? '+' : '-'}${formatNaira(Math.abs(profitDelta))} vs ${monthLabel(prevKey)}`,
      icon: isLoss ? TrendingDown : TrendingUp,
      tone: isLoss ? 'text-rose-400' : 'text-emerald-400',
    },
    {
      label: 'Profit Margin',
      value: margin === null ? '—' : `${margin.toFixed(1)}%`,
      sub: 'Net profit ÷ sales revenue',
      icon: Percent,
      tone: margin !== null && margin < 0 ? 'text-rose-400' : 'text-amber-400',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Scale className="w-4 h-4 text-emerald-400" />
            </span>
            <h2 className="text-base font-bold text-white">Monthly Profit Summary</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Net profit = billed sales revenue − operating expenses (rejected vouchers, drafts and cancelled invoices excluded).
          </p>
        </div>

        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
        >
          {monthOptions.map(key => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{c.label}</span>
                <Icon className={`w-3.5 h-3.5 ${c.tone}`} />
              </div>
              <div className={`mt-1.5 text-lg font-mono font-bold ${c.tone}`}>{c.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
