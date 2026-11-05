import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Building2,
  CreditCard,
  FileSpreadsheet,
  FileText,
  HardDriveDownload,
  Landmark,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Scale,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { NavViewId } from '../types/accounting';
import { OfflineIndicator, PWAInstallButton } from './PWAInstallButton';

interface MenuItem {
  id: NavViewId;
  label: string;
  hasRegister?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Overview & Vouchers',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'purchase-entry', label: 'Purchase Entry', hasRegister: true, icon: ShoppingBag },
      { id: 'sales-entry', label: 'Sales Entry', hasRegister: true, icon: Receipt },
      { id: 'receipt-entry', label: 'Receipt Entry', hasRegister: true, icon: ArrowDownLeft },
      { id: 'payment-entry', label: 'Payment Entry', hasRegister: true, icon: ArrowUpRight },
    ],
  },
  {
    title: 'Ledgers, Books & Statements',
    items: [
      { id: 'customer-ledger', label: 'Customer Ledger', icon: BookOpen },
      { id: 'supplier-ledger', label: 'Supplier Ledger', icon: FileText },
      { id: 'customer-outstanding', label: 'Customer Outstanding', icon: Scale },
      { id: 'supplier-outstanding', label: 'Supplier Outstanding', icon: CreditCard },
      { id: 'cash-book', label: 'Cash Book', icon: Wallet },
      { id: 'bank-book', label: 'Bank Book', icon: Landmark },
      { id: 'purchase-sales-statement', label: 'Purchase and Sales Statement', icon: FileSpreadsheet },
      { id: 'gross-profit-statement', label: 'Gross Profit Statement', icon: TrendingUp },
    ],
  },
  {
    title: 'Masters',
    items: [
      { id: 'customer-master', label: 'Customer Master', icon: Users },
      { id: 'supplier-master', label: 'Supplier Master', icon: Building2 },
      { id: 'goods-master', label: 'Goods Master', icon: Package },
    ],
  },
  {
    title: 'Billing & Print',
    items: [
      { id: 'sales-bill', label: 'Sales Bill', icon: FileText },
      { id: 'invoice-settings', label: 'Invoice Settings', icon: Settings },
      { id: 'backup-settings', label: 'Backup & Restore', icon: HardDriveDownload },
    ],
  },
];

const VIEW_LABELS: Record<NavViewId, string> = {
  dashboard: 'Dashboard',
  'purchase-entry': 'Purchase Entry & Register',
  'sales-entry': 'Sales Entry & Register',
  'receipt-entry': 'Receipt Entry & Register',
  'payment-entry': 'Payment Entry & Register',
  'customer-ledger': 'Customer Ledger',
  'supplier-ledger': 'Supplier Ledger',
  'customer-outstanding': 'Customer Outstanding',
  'supplier-outstanding': 'Supplier Outstanding',
  'cash-book': 'Cash Book',
  'bank-book': 'Bank Book',
  'purchase-sales-statement': 'Purchase and Sales Statement',
  'gross-profit-statement': 'Gross Profit Statement',
  'customer-master': 'Customer Master',
  'supplier-master': 'Supplier Master',
  'goods-master': 'Goods Master',
  'sales-bill': 'Sales Bill',
  'invoice-settings': 'Invoice Settings',
  'backup-settings': 'Backup & Restore',
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeView, setActiveView, sales, selectedSalesBillId, openSalesBill, company } = useAccounting();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const handleSelectNav = (id: NavViewId) => {
    setActiveView(id);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Left-side corner Hamburger Menu + Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open accounting navigation menu"
            aria-expanded={menuOpen}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleSelectNav('dashboard')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer hover:text-teal-800 transition-colors"
          >
            {company.companyName}
          </button>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleSelectNav('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'dashboard' ? 'text-teal-800 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => handleSelectNav('purchase-entry')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'purchase-entry' ? 'text-teal-800 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Purchases
          </button>
          <button
            type="button"
            onClick={() => handleSelectNav('sales-entry')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'sales-entry' ? 'text-teal-800 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Sales
          </button>
          <button
            type="button"
            onClick={() => handleSelectNav('cash-book')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'cash-book' ? 'text-teal-800 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Cash Book
          </button>
          <button
            type="button"
            onClick={() => handleSelectNav('gross-profit-statement')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'gross-profit-statement' ? 'text-teal-800 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Gross Profit
          </button>
        </nav>

        {/* Zone 3: Contextual action */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />
          {activeView !== 'dashboard' && (
            <button
              type="button"
              onClick={() => handleSelectNav('dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Left-Side Hamburger Navigation Drawer */}
      {menuOpen && (
        <div className="no-print fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label="Raghavendra & Co. Navigation Menu"
            className="relative z-10 w-80 max-w-[86vw] bg-white border-r border-slate-200 h-full flex flex-col shadow-xl"
          >
            <div className="px-5 h-16 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-teal-700 text-white flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold text-slate-900 truncate">{company.companyName}</div>
                  <div className="text-xs text-slate-500 truncate">FY 2026–27 Books</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {MENU_SECTIONS.map((section) => (
                <div key={section.title}>
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 tracking-wide">
                    {section.title}
                  </div>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectNav(item.id)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-teal-50 text-teal-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive ? 'text-teal-700' : 'text-slate-400'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </span>
                            {item.hasRegister && (
                              <span className="text-[11px] font-normal text-slate-400 shrink-0">
                                + Register
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50/70">
              <button
                type="button"
                onClick={() => {
                  openSalesBill(selectedSalesBillId || sales[0]?.id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-teal-800 bg-white border border-slate-200 hover:border-teal-600 rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Open Sales Bill
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Contextual Breadcrumb Strip when not on Dashboard */}
      {activeView !== 'dashboard' && (
        <div className="no-print bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2 truncate">
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                {company.companyName}
              </button>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 font-medium truncate">{VIEW_LABELS[activeView]}</span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="text-teal-700 hover:text-teal-900 font-medium whitespace-nowrap cursor-pointer"
            >
              Switch Heading
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Quiet Footer */}
      <footer className="no-print border-t border-slate-200 bg-white px-4 sm:px-6 py-4 text-xs text-slate-500">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {company.companyName} · GSTIN: <span className="font-mono-num">{company.gstin}</span>
          </div>
          <div>Accounting &amp; Bookkeeping Suite · FY 2026–27</div>
        </div>
      </footer>
      <OfflineIndicator />
    </div>
  );
};
