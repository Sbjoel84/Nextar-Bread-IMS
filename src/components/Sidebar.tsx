import React, { useRef, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wheat,
  Boxes,
  Truck,
  ChefHat,
  Flame,
  ClipboardCheck,
  PackageCheck,
  Users,
  Store,
  FileText,
  Send,
  RotateCcw,
  Coins,
  Receipt,
  PiggyBank,
  UserCheck,
  BarChart3,
  History,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '../types/erp';

export type NavTab =
  | 'dashboard'
  | 'products'
  | 'raw-materials'
  | 'procurement'
  | 'recipes'
  | 'production'
  | 'quality-control'
  | 'finished-goods'
  | 'marketers'
  | 'customers'
  | 'sales-invoices'
  | 'dispatches'
  | 'returns'
  | 'cashier'
  | 'payments'
  | 'finance'
  | 'employees'
  | 'reports'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole?: UserRole;
  collapsed?: boolean;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  section: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Overview
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, section: 'Overview' },

  // Bakery Operations
  { id: 'recipes', label: 'Recipes & Formulas', icon: ChefHat, section: 'Bakery Operations' },
  { id: 'production', label: 'Production & Baking', icon: Flame, section: 'Bakery Operations' },
  { id: 'quality-control', label: 'Quality & Traceability', icon: ClipboardCheck, section: 'Bakery Operations' },
  { id: 'finished-goods', label: 'Finished Goods (FEFO)', icon: PackageCheck, section: 'Bakery Operations' },

  // Inventory & Procurement
  { id: 'products', label: 'Bread Product Catalogue', icon: Wheat, section: 'Inventory & Procurement' },
  { id: 'raw-materials', label: 'Raw Materials & Stock', icon: Boxes, section: 'Inventory & Procurement' },
  { id: 'procurement', label: 'Suppliers & POs/GRN', icon: Truck, section: 'Inventory & Procurement' },

  // Sales & Distribution
  { id: 'marketers', label: 'Marketers & Routes', icon: Users, section: 'Sales & Distribution' },
  { id: 'customers', label: 'Customers & Debtors', icon: Store, section: 'Sales & Distribution' },
  { id: 'sales-invoices', label: 'Sales & Invoicing', icon: FileText, section: 'Sales & Distribution' },
  { id: 'dispatches', label: 'Dispatches & Loading', icon: Send, section: 'Sales & Distribution' },
  { id: 'returns', label: 'Returns & Wastage', icon: RotateCcw, section: 'Sales & Distribution' },

  // Financial Control & HR
  { id: 'cashier', label: 'Cashier Sessions', icon: Coins, section: 'Finance & Governance' },
  { id: 'payments', label: 'Customer Receipts', icon: Receipt, section: 'Finance & Governance' },
  { id: 'finance', label: 'Expenses & Costing', icon: PiggyBank, section: 'Finance & Governance' },
  { id: 'employees', label: 'Employees & Rota', icon: UserCheck, section: 'Finance & Governance' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, section: 'Finance & Governance' },
  { id: 'audit-logs', label: 'Immutable Audit Log', icon: History, section: 'System & Governance' },
  { id: 'settings', label: 'Bakery Settings', icon: Sliders, section: 'System & Governance' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const sections = Array.from(new Set(NAV_ITEMS.map(i => i.section)));
  const navRef = useRef<HTMLElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(true);

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 12);
    }
  };

  useEffect(() => {
    checkScroll();
  }, []);

  const scrollToBottom = () => {
    if (navRef.current) {
      navRef.current.scrollTo({ top: navRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <aside className="w-64 shrink-0 h-full max-h-full sticky top-0 bg-slate-900 border-r border-slate-800 flex flex-col select-none relative z-20 overflow-hidden">
      {/* Top Header Label - Static */}
      <div className="shrink-0 p-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 backdrop-blur">
        <span>Bakery ERP Modules</span>
        <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-mono">
          Kubwa Plant
        </span>
      </div>

      {/* Nav list - Independent isolated internal scroll, static against outer page */}
      <nav
        ref={navRef}
        onScroll={checkScroll}
        className="p-2 space-y-4 flex-1 overflow-y-auto overscroll-contain pr-1.5 scrollbar-thin"
        style={{ scrollbarGutter: 'stable' }}
      >
        {sections.map(sectionName => {
          const items = NAV_ITEMS.filter(i => i.section === sectionName);
          return (
            <div key={sectionName}>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sectionName}
              </div>
              <div className="space-y-0.5 mt-1">
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Scroll to bottom cue if more modules are below */}
      {canScrollDown && (
        <button
          onClick={scrollToBottom}
          className="shrink-0 py-1 px-3 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent border-t border-slate-800/50 flex items-center justify-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
          title="Scroll down to view settings and system logs"
        >
          <span>Scroll to end for Settings & Logs</span>
          <ChevronDown className="w-3 h-3 animate-bounce" />
        </button>
      )}

      {/* Bottom Footer - Static */}
      <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300">Nextar Bread Bakery</div>
        <div className="text-[10px] text-slate-400">Kubwa Phase 2, Abuja</div>
      </div>
    </aside>
  );
};
