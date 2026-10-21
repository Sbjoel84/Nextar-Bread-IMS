import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SalesInvoice } from '../types/erp';
import { formatNaira, formatDateNG } from '../utils/formatters';
import { TrendingUp, Coins, Activity, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface SalesRevenueTrendChartProps {
  invoices: SalesInvoice[];
}

type RangeDays = 30 | 14 | 7;

interface DayPoint {
  key: string; // YYYY-MM-DD (local)
  date: Date;
  revenue: number;
  cash: number;
  credit: number;
  invoiceCount: number;
  loaves: number;
}

const CHART_HEIGHT = 280;
const PAD = { top: 16, right: 16, bottom: 32, left: 56 };

const COLORS = {
  revenue: '#3b82f6',
  cash: '#10b981',
  credit: '#f59e0b',
};

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function compactNaira(v: number): string {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `₦${Math.round(v / 1_000)}k`;
  return `₦${Math.round(v)}`;
}

// Round the axis maximum up to a "nice" value split into 4 even steps
function niceMax(v: number): number {
  if (v <= 0) return 100_000;
  const rawStep = v / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= rawStep) || 10 * mag;
  return step * 4;
}

// Monotone cubic (Fritsch–Carlson) path: smooth like the design, but never overshoots below zero
function smoothPath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    slope.push((pts[i + 1].y - pts[i].y) / dx[i]);
  }
  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    m.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  }
  m.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * slope[i];
      m[i + 1] = t * b * slope[i];
    }
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i].x + h},${pts[i].y + m[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - m[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

export const SalesRevenueTrendChart: React.FC<SalesRevenueTrendChartProps> = ({ invoices }) => {
  const [range, setRange] = useState<RangeDays>(30);
  const [showCash, setShowCash] = useState(true);
  const [showCredit, setShowCredit] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [width, setWidth] = useState(900);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bucket billed invoices (drafts and cancellations excluded) into one point per calendar day
  const days = useMemo<DayPoint[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets: DayPoint[] = [];
    const byKey = new Map<string, DayPoint>();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const point: DayPoint = { key: toKey(d), date: d, revenue: 0, cash: 0, credit: 0, invoiceCount: 0, loaves: 0 };
      buckets.push(point);
      byKey.set(point.key, point);
    }
    invoices
      .filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
      .forEach(inv => {
        const point = byKey.get(inv.invoiceDate.slice(0, 10));
        if (!point) return;
        point.revenue += inv.netPayableAmount;
        point.cash += inv.amountPaid;
        point.credit += inv.amountDue;
        point.invoiceCount += 1;
        point.loaves += inv.items.reduce((sum, item) => sum + item.quantity, 0);
      });
    return buckets;
  }, [invoices, range]);

  const stats = useMemo(() => {
    const total = days.reduce((s, d) => s + d.revenue, 0);
    const collected = days.reduce((s, d) => s + d.cash, 0);
    const invoiceCount = days.reduce((s, d) => s + d.invoiceCount, 0);
    const peak = days.reduce<DayPoint | null>((best, d) => (d.revenue > (best?.revenue ?? 0) ? d : best), null);
    return {
      total,
      collected,
      invoiceCount,
      average: total / range,
      peak,
      ratio: total > 0 ? Math.round((collected / total) * 100) : 0,
    };
  }, [days, range]);

  const plotW = Math.max(width - PAD.left - PAD.right, 50);
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const yMax = niceMax(Math.max(...days.map(d => Math.max(d.revenue, showCash ? d.cash : 0, showCredit ? d.credit : 0))));
  const xAt = (i: number) => PAD.left + (days.length === 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
  const yAt = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

  const seriesPts = (pick: (d: DayPoint) => number) => days.map((d, i) => ({ x: xAt(i), y: yAt(pick(d)) }));
  const revenuePts = seriesPts(d => d.revenue);
  const cashPts = seriesPts(d => d.cash);
  const creditPts = seriesPts(d => d.credit);
  const revenueLine = smoothPath(revenuePts);
  const baseY = yAt(0);
  const revenueArea = `${revenueLine} L${revenuePts[revenuePts.length - 1].x},${baseY} L${revenuePts[0].x},${baseY} Z`;

  const yTicks = [0, 1, 2, 3, 4].map(i => (yMax / 4) * i);
  const xLabelEvery = range === 30 ? 3 : range === 14 ? 2 : 1;
  const hovered = hoverIdx !== null ? days[hoverIdx] : null;

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const x = e.clientX - rect.left - PAD.left;
    const idx = Math.round((x / plotW) * (days.length - 1));
    setHoverIdx(Math.min(Math.max(idx, 0), days.length - 1));
  };

  const kpis = [
    {
      label: `${range}D Total Revenue`,
      value: formatNaira(stats.total),
      sub: `Across ${stats.invoiceCount} invoices`,
      icon: Coins,
      tone: 'text-blue-400',
    },
    {
      label: 'Daily Average',
      value: formatNaira(stats.average),
      sub: 'Mean daily sales velocity',
      icon: Activity,
      tone: 'text-cyan-400',
    },
    {
      label: 'Peak Day Sales',
      value: formatNaira(stats.peak?.revenue ?? 0),
      sub: stats.peak ? `Record on ${shortDate(stats.peak.date)}` : 'No sales in range',
      icon: ArrowUpRight,
      tone: 'text-emerald-400',
    },
    {
      label: 'Cash Collection Ratio',
      value: `${stats.ratio}%`,
      sub: `${formatNaira(stats.collected)} collected`,
      icon: ShieldCheck,
      tone: 'text-amber-400',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Title row */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </span>
            <h2 className="text-base font-bold text-white">Daily Sales Revenue Trends ({range} Days)</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Invoicing Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Visualizing authoritative daily turnover generated across all retail outlets, supermarket chains, and distribution routes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex bg-slate-950/60 border border-slate-800 rounded-lg p-0.5">
            {([30, 14, 7] as RangeDays[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  range === r ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r} Days
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input type="checkbox" checked={showCash} onChange={e => setShowCash(e.target.checked)} className="accent-blue-600" />
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Cash
          </label>
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input type="checkbox" checked={showCredit} onChange={e => setShowCredit(e.target.checked)} className="accent-blue-600" />
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Credit
          </label>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 py-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{k.label}</span>
                <Icon className={`w-3.5 h-3.5 ${k.tone}`} />
              </div>
              <div className={`mt-1.5 text-lg font-mono font-bold ${k.tone}`}>{k.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Series legend */}
      <div className="flex flex-wrap justify-end gap-4 text-[11px] pb-1">
        {showCash && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cash / POS Collected
          </span>
        )}
        {showCredit && (
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Credit Invoiced (Due)
          </span>
        )}
        <span className="flex items-center gap-1.5 text-blue-400">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Daily Sales Revenue
        </span>
      </div>

      {/* Chart */}
      <div ref={wrapRef} className="relative w-full">
        <svg width={width} height={CHART_HEIGHT} className="block" role="img" aria-label="Daily sales revenue line chart">
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {yTicks.map(t => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={yAt(t)} y2={yAt(t)} stroke="#1e293b" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={PAD.left - 8} y={yAt(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                {compactNaira(t)}
              </text>
            </g>
          ))}

          {days.map((d, i) =>
            i % xLabelEvery === 0 || i === days.length - 1 ? (
              <text key={d.key} x={xAt(i)} y={CHART_HEIGHT - 10} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {shortDate(d.date)}
              </text>
            ) : null
          )}

          <path d={revenueArea} fill="url(#revenueFill)" />
          <path d={revenueLine} fill="none" stroke={COLORS.revenue} strokeWidth={2.25} strokeLinejoin="round" />
          {showCash && <path d={smoothPath(cashPts)} fill="none" stroke={COLORS.cash} strokeWidth={1.75} strokeDasharray="3 4" />}
          {showCredit && <path d={smoothPath(creditPts)} fill="none" stroke={COLORS.credit} strokeWidth={1.75} strokeDasharray="3 4" />}

          {/* Point markers on days with activity */}
          {days.map((d, i) =>
            d.invoiceCount > 0 ? (
              <g key={d.key}>
                <circle cx={revenuePts[i].x} cy={revenuePts[i].y} r={3} fill={COLORS.revenue} />
                {showCash && <circle cx={cashPts[i].x} cy={cashPts[i].y} r={2.5} fill={COLORS.cash} />}
                {showCredit && <circle cx={creditPts[i].x} cy={creditPts[i].y} r={2.5} fill={COLORS.credit} />}
              </g>
            ) : null
          )}

          {hovered && hoverIdx !== null && (
            <g pointerEvents="none">
              <line x1={xAt(hoverIdx)} x2={xAt(hoverIdx)} y1={PAD.top} y2={baseY} stroke="#475569" strokeDasharray="2 3" />
              <circle cx={revenuePts[hoverIdx].x} cy={revenuePts[hoverIdx].y} r={5} fill={COLORS.revenue} stroke="#0f172a" strokeWidth={2} />
              {showCash && <circle cx={cashPts[hoverIdx].x} cy={cashPts[hoverIdx].y} r={4} fill={COLORS.cash} stroke="#0f172a" strokeWidth={2} />}
              {showCredit && <circle cx={creditPts[hoverIdx].x} cy={creditPts[hoverIdx].y} r={4} fill={COLORS.credit} stroke="#0f172a" strokeWidth={2} />}
            </g>
          )}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIdx(null)}
          />
        </svg>

        {hovered && hoverIdx !== null && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-950/95 border border-slate-700 rounded-lg px-3 py-2 text-[11px] shadow-xl min-w-[180px]"
            style={{
              top: PAD.top,
              left: xAt(hoverIdx),
              transform: xAt(hoverIdx) > width * 0.6 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
            }}
          >
            <div className="font-semibold text-white mb-1">{formatDateNG(hovered.key)}</div>
            <div className="flex justify-between gap-4 text-blue-400">
              <span>Revenue</span>
              <span className="font-mono font-bold">{formatNaira(hovered.revenue)}</span>
            </div>
            {showCash && (
              <div className="flex justify-between gap-4 text-emerald-400">
                <span>Cash / POS</span>
                <span className="font-mono">{formatNaira(hovered.cash)}</span>
              </div>
            )}
            {showCredit && (
              <div className="flex justify-between gap-4 text-amber-400">
                <span>Credit due</span>
                <span className="font-mono">{formatNaira(hovered.credit)}</span>
              </div>
            )}
            <div className="border-t border-slate-800 mt-1.5 pt-1.5 flex justify-between gap-4 text-slate-400">
              <span>{hovered.invoiceCount} invoice{hovered.invoiceCount === 1 ? '' : 's'}</span>
              <span>{hovered.loaves.toLocaleString('en-NG')} loaves</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-2 border-t border-slate-800 text-[11px]">
        <div className="flex flex-wrap gap-4 text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500" /> Net Billed Turnover
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500" /> Remitted Cash/POS
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500" /> Credit Term Balance
          </span>
        </div>
        <span className="text-slate-500">Hover over points to inspect invoice count and bread volume breakdown.</span>
      </div>
    </div>
  );
};
