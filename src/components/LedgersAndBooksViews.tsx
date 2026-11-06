import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { exportToExcel, formatCurrency, formatDate } from '../utils/formatters';
import { printCurrentPage } from '../utils/nativeActions';

interface LedgerViewProps {
  initialPartyId?: string;
}

// ============================================================================
// 1. CUSTOMER LEDGER
// ============================================================================
export const CustomerLedgerView: React.FC<LedgerViewProps> = ({ initialPartyId }) => {
  const { company, customers, getCustomerLedger, setActiveView } = useAccounting();
  const [selectedId, setSelectedId] = useState<string>(initialPartyId || customers[0]?.id || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const activeCustomer = customers.find((c) => c.id === selectedId) || customers[0];
  const ledger = useMemo(
    () =>
      activeCustomer
        ? getCustomerLedger(activeCustomer.id, fromDate || undefined, toDate || undefined)
        : null,
    [activeCustomer, fromDate, toDate, getCustomerLedger]
  );

  const handleExport = () => {
    if (!activeCustomer || !ledger) return;
    exportToExcel(
      `Customer_Ledger_${activeCustomer.name.replace(/\s+/g, '_')}.xlsx`,
      ['Date', 'Voucher No', 'Particulars', 'Type', 'Debit (Dr)', 'Credit (Cr)', 'Balance'],
      [
        [
          fromDate || 'Opening',
          '—',
          'Opening Balance B/F',
          'Opening',
          ledger.openingType === 'Dr' ? ledger.openingBalance : 0,
          ledger.openingType === 'Cr' ? ledger.openingBalance : 0,
          `${ledger.openingBalance} ${ledger.openingType}`,
        ],
        ...ledger.rows.map((r) => [
          formatDate(r.date),
          r.voucherNo,
          r.particulars,
          r.voucherType,
          r.debit,
          r.credit,
          `${r.runningBalance} ${r.runningBalanceType}`,
        ]),
      ],
      'Customer Ledger'
    );
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Account statement showing opening balance, sales invoices, receipts, and running Dr/Cr balance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!ledger}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void printCurrentPage('Ragavendhara & Co. Accounting')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statement
          </button>
        </div>
      </div>

      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer</label>
          <select
            value={activeCustomer?.id || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {!activeCustomer || !ledger ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-700">No customers available in Customer Master.</p>
          <button
            type="button"
            onClick={() => setActiveView('customer-master')}
            className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
          >
            Open Customer Master
          </button>
        </div>
      ) : (
        <div className="print-sheet bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">{company.companyName} · Customer Ledger</div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{activeCustomer.name}</h2>
              <div className="text-xs text-slate-600 mt-0.5">
                Mobile: <span className="font-mono-num">{activeCustomer.mobile || '—'}</span> · GST:{' '}
                <span className="font-mono-num">{activeCustomer.gstNumber || '—'}</span>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-slate-500">Closing Balance</div>
              <div className="text-xl font-bold font-mono-num text-slate-900 mt-0.5">
                {formatCurrency(ledger.closingBalance)} {ledger.closingType}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/60 font-medium text-slate-800">
                  <td className="py-2.5 px-4 font-mono-num">{fromDate ? formatDate(fromDate) : 'Opening'}</td>
                  <td className="py-2.5 px-4">—</td>
                  <td className="py-2.5 px-4">Opening Balance Brought Forward</td>
                  <td className="py-2.5 px-4">Opening</td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {ledger.openingType === 'Dr' && ledger.openingBalance > 0
                      ? formatCurrency(ledger.openingBalance)
                      : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {ledger.openingType === 'Cr' && ledger.openingBalance > 0
                      ? formatCurrency(ledger.openingBalance)
                      : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num font-semibold">
                    {formatCurrency(ledger.openingBalance)} {ledger.openingType}
                  </td>
                </tr>

                {ledger.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-num text-slate-600 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-2.5 px-4 font-mono-num font-medium text-slate-900 whitespace-nowrap">
                      {r.voucherNo}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">{r.particulars}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{r.voucherType}</td>
                    <td className="py-2.5 px-4 text-right font-mono-num">
                      {r.debit > 0 ? formatCurrency(r.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-num">
                      {r.credit > 0 ? formatCurrency(r.credit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.runningBalance)} {r.runningBalanceType}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right">
                    Totals &amp; Closing Balance
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num">
                    {formatCurrency(ledger.totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num">
                    {formatCurrency(ledger.totalCredit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num">
                    {formatCurrency(ledger.closingBalance)} {ledger.closingType}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. SUPPLIER LEDGER
// ============================================================================
export const SupplierLedgerView: React.FC<LedgerViewProps> = ({ initialPartyId }) => {
  const { company, suppliers, getSupplierLedger, setActiveView } = useAccounting();
  const [selectedId, setSelectedId] = useState<string>(initialPartyId || suppliers[0]?.id || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const activeSupplier = suppliers.find((s) => s.id === selectedId) || suppliers[0];
  const ledger = useMemo(
    () =>
      activeSupplier
        ? getSupplierLedger(activeSupplier.id, fromDate || undefined, toDate || undefined)
        : null,
    [activeSupplier, fromDate, toDate, getSupplierLedger]
  );

  const handleExport = () => {
    if (!activeSupplier || !ledger) return;
    exportToExcel(
      `Supplier_Ledger_${activeSupplier.name.replace(/\s+/g, '_')}.xlsx`,
      ['Date', 'Voucher No', 'Particulars', 'Type', 'Debit (Dr)', 'Credit (Cr)', 'Balance'],
      [
        [
          fromDate || 'Opening',
          '—',
          'Opening Balance B/F',
          'Opening',
          ledger.openingType === 'Dr' ? ledger.openingBalance : 0,
          ledger.openingType === 'Cr' ? ledger.openingBalance : 0,
          `${ledger.openingBalance} ${ledger.openingType}`,
        ],
        ...ledger.rows.map((r) => [
          formatDate(r.date),
          r.voucherNo,
          r.particulars,
          r.voucherType,
          r.debit,
          r.credit,
          `${r.runningBalance} ${r.runningBalanceType}`,
        ]),
      ],
      'Supplier Ledger'
    );
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Creditor statement showing opening balance, purchase bills, payments, and running Cr/Dr balance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!ledger}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void printCurrentPage('Ragavendhara & Co. Accounting')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statement
          </button>
        </div>
      </div>

      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier</label>
          <select
            value={activeSupplier?.id || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {!activeSupplier || !ledger ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-700">No suppliers available in Supplier Master.</p>
          <button
            type="button"
            onClick={() => setActiveView('supplier-master')}
            className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
          >
            Open Supplier Master
          </button>
        </div>
      ) : (
        <div className="print-sheet bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">{company.companyName} · Supplier Ledger</div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{activeSupplier.name}</h2>
              <div className="text-xs text-slate-600 mt-0.5">
                Mobile: <span className="font-mono-num">{activeSupplier.mobile || '—'}</span> · Address:{' '}
                {activeSupplier.address || '—'}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-slate-500">Closing Balance</div>
              <div className="text-xl font-bold font-mono-num text-slate-900 mt-0.5">
                {formatCurrency(ledger.closingBalance)} {ledger.closingType}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/60 font-medium text-slate-800">
                  <td className="py-2.5 px-4 font-mono-num">{fromDate ? formatDate(fromDate) : 'Opening'}</td>
                  <td className="py-2.5 px-4">—</td>
                  <td className="py-2.5 px-4">Opening Balance Brought Forward</td>
                  <td className="py-2.5 px-4">Opening</td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {ledger.openingType === 'Dr' && ledger.openingBalance > 0
                      ? formatCurrency(ledger.openingBalance)
                      : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {ledger.openingType === 'Cr' && ledger.openingBalance > 0
                      ? formatCurrency(ledger.openingBalance)
                      : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num font-semibold">
                    {formatCurrency(ledger.openingBalance)} {ledger.openingType}
                  </td>
                </tr>

                {ledger.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-num text-slate-600 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-2.5 px-4 font-mono-num font-medium text-slate-900 whitespace-nowrap">
                      {r.voucherNo}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">{r.particulars}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{r.voucherType}</td>
                    <td className="py-2.5 px-4 text-right font-mono-num">
                      {r.debit > 0 ? formatCurrency(r.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-num">
                      {r.credit > 0 ? formatCurrency(r.credit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.runningBalance)} {r.runningBalanceType}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right">
                    Totals &amp; Closing Balance
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num">
                    {formatCurrency(ledger.totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num">
                    {formatCurrency(ledger.totalCredit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num">
                    {formatCurrency(ledger.closingBalance)} {ledger.closingType}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. CUSTOMER OUTSTANDING
// ============================================================================
export const CustomerOutstandingView: React.FC<{ onOpenLedger: (id: string) => void }> = ({
  onOpenLedger,
}) => {
  const { customerOutstandings, setActiveView } = useAccounting();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const filtered = useMemo(() => {
    return customerOutstandings.filter((c) => {
      if (onlyPending && (c.netBalance <= 0 || c.balanceType !== 'Dr')) return false;
      if (selectedCustomerId && c.id !== selectedCustomerId) return false;
      return true;
    });
  }, [customerOutstandings, onlyPending, selectedCustomerId]);

  const netTotalDr = filtered.reduce(
    (s, c) => s + (c.balanceType === 'Dr' ? c.netBalance : -c.netBalance),
    0
  );

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Outstanding</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer-wise receivable statement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportToExcel(
                'Customer_Outstanding.xlsx',
                ['Sl. No.', 'Customer Name', 'Mobile', 'Opening Bal', 'Total Sales', 'Total Receipts', 'Net Outstanding'],
                filtered.map((c, idx) => [
                  idx + 1,
                  c.name,
                  c.mobile,
                  c.openingBalance,
                  c.totalBilled,
                  c.totalSettled,
                  `${c.netBalance} ${c.balanceType}`,
                ]),
                'Customer Outstanding'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void printCurrentPage('Ragavendhara & Co. Accounting')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      <div className="print-sheet bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="no-print p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white min-w-[220px]"
            >
              <option value="">All Customers</option>
              {customerOutstandings.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setOnlyPending(false)}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                !onlyPending ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Customers
            </button>
            <button
              type="button"
              onClick={() => setOnlyPending(true)}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                onlyPending ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Receivable Only (&gt; ₹0)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4 w-16">Sl. No.</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4 text-right">Opening Bal</th>
                <th className="py-3 px-4 text-right">Total Sales (Dr)</th>
                <th className="py-3 px-4 text-right">Total Receipts (Cr)</th>
                <th className="py-3 px-4 text-right">Net Outstanding</th>
                <th className="no-print py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-mono-num text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-2.5 px-4 font-mono-num text-slate-600">{c.mobile || '—'}</td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {formatCurrency(c.openingBalance)} Dr
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {formatCurrency(c.totalBilled)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {formatCurrency(c.totalSettled)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num font-bold text-slate-900">
                    {formatCurrency(c.netBalance)} {c.balanceType}
                  </td>
                  <td className="no-print py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenLedger(c.id)}
                        className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                      >
                        Ledger
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView('receipt-entry')}
                        className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                      >
                        Receipt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
              <tr>
                <td colSpan={6} className="py-3 px-4 text-right">
                  Total Customer Outstanding
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-emerald-800">
                  {formatCurrency(Math.abs(netTotalDr))} {netTotalDr >= 0 ? 'Dr' : 'Cr'}
                </td>
                <td className="no-print" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. SUPPLIER OUTSTANDING
// ============================================================================
export const SupplierOutstandingView: React.FC<{ onOpenLedger: (id: string) => void }> = ({
  onOpenLedger,
}) => {
  const { supplierOutstandings, setActiveView } = useAccounting();
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const filtered = useMemo(() => {
    return supplierOutstandings.filter((s) => {
      if (onlyPending && (s.netBalance <= 0 || s.balanceType !== 'Cr')) return false;
      if (selectedSupplierId && s.id !== selectedSupplierId) return false;
      return true;
    });
  }, [supplierOutstandings, onlyPending, selectedSupplierId]);

  const netTotalCr = filtered.reduce(
    (acc, s) => acc + (s.balanceType === 'Cr' ? s.netBalance : -s.netBalance),
    0
  );

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Outstanding</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supplier-wise payable statement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportToExcel(
                'Supplier_Outstanding.xlsx',
                ['Sl. No.', 'Supplier Name', 'Mobile', 'Opening Bal', 'Total Purchases', 'Total Payments', 'Net Payable'],
                filtered.map((s, idx) => [
                  idx + 1,
                  s.name,
                  s.mobile,
                  s.openingBalance,
                  s.totalBilled,
                  s.totalSettled,
                  `${s.netBalance} ${s.balanceType}`,
                ]),
                'Supplier Outstanding'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void printCurrentPage('Ragavendhara & Co. Accounting')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      <div className="print-sheet bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="no-print p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white min-w-[220px]"
            >
              <option value="">All Suppliers</option>
              {supplierOutstandings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setOnlyPending(false)}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                !onlyPending ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Suppliers
            </button>
            <button
              type="button"
              onClick={() => setOnlyPending(true)}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                onlyPending ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Payable Only (&gt; ₹0)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4 w-16">Sl. No.</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4 text-right">Opening Bal</th>
                <th className="py-3 px-4 text-right">Total Purchases (Cr)</th>
                <th className="py-3 px-4 text-right">Total Payments (Dr)</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="no-print py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-mono-num text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-2.5 px-4 font-mono-num text-slate-600">{s.mobile || '—'}</td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {formatCurrency(s.openingBalance)} Cr
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {formatCurrency(s.totalBilled)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num">
                    {formatCurrency(s.totalSettled)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num font-bold text-slate-900">
                    {formatCurrency(s.netBalance)} {s.balanceType}
                  </td>
                  <td className="no-print py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenLedger(s.id)}
                        className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                      >
                        Ledger
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView('payment-entry')}
                        className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                      >
                        Pay
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
              <tr>
                <td colSpan={6} className="py-3 px-4 text-right">
                  Total Supplier Outstanding
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-amber-800">
                  {formatCurrency(Math.abs(netTotalCr))} {netTotalCr >= 0 ? 'Cr' : 'Dr'}
                </td>
                <td className="no-print" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. CASH BOOK & 6. BANK BOOK
// ============================================================================
export const CashOrBankBookView: React.FC<{ mode: 'Cash' | 'Bank' }> = ({ mode }) => {
  const { company, updateCompany, getCashBook, getBankBook } = useAccounting();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingOpening, setEditingOpening] = useState(false);
  const [openingInput, setOpeningInput] = useState<number>(
    mode === 'Cash' ? company.openingCashBalance : company.openingBankBalance
  );

  const book = useMemo(
    () =>
      mode === 'Cash'
        ? getCashBook(fromDate || undefined, toDate || undefined)
        : getBankBook(fromDate || undefined, toDate || undefined),
    [mode, fromDate, toDate, getCashBook, getBankBook]
  );

  const handleSaveOpening = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'Cash') {
      updateCompany({ ...company, openingCashBalance: openingInput });
    } else {
      updateCompany({ ...company, openingBankBalance: openingInput });
    }
    setEditingOpening(false);
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'Cash' ? 'Cash Book' : 'Bank Book'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'Cash'
              ? 'Chronological Cash receipts (Dr) and Cash payments (Cr)'
              : 'Chronological Bank receipts (Dr) and Bank payments (Cr)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOpeningInput(
                mode === 'Cash' ? company.openingCashBalance : company.openingBankBalance
              );
              setEditingOpening((v) => !v);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Opening Balance
          </button>
          <button
            type="button"
            onClick={() =>
              exportToExcel(
                `${mode}_Book.xlsx`,
                ['Date', 'Voucher No', 'Particulars', 'Type', 'Receipts (Dr)', 'Payments (Cr)', 'Balance'],
                book.rows.map((r) => [
                  formatDate(r.date),
                  r.voucherNo,
                  r.particulars,
                  r.voucherType,
                  r.debit,
                  r.credit,
                  `${r.runningBalance} ${r.runningBalanceType}`,
                ]),
                `${mode} Book`
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void printCurrentPage('Ragavendhara & Co. Accounting')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {editingOpening && (
        <form
          onSubmit={handleSaveOpening}
          className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Opening {mode} Balance (₹)
            </label>
            <input
              type="number"
              step="any"
              value={openingInput}
              onChange={(e) => setOpeningInput(parseFloat(e.target.value) || 0)}
              className="px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg w-52"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
          >
            Save Opening
          </button>
          <button
            type="button"
            onClick={() => setEditingOpening(false)}
            className="px-3 py-2 text-xs text-slate-600 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-2 lg:col-span-2">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Receipts (Dr)</div>
          <div className="text-lg font-bold font-mono-num text-emerald-700 mt-1">
            {formatCurrency(book.totalDebit)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Closing {mode} Balance</div>
          <div className="text-lg font-bold font-mono-num text-slate-900 mt-1">
            {formatCurrency(book.closingBalance)} {book.closingType}
          </div>
        </div>
      </div>

      <div className="print-sheet bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Receipts / Dr (₹)</th>
                <th className="py-3 px-4 text-right">Payments / Cr (₹)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/60 font-medium text-slate-800">
                <td className="py-2.5 px-4 font-mono-num">{fromDate ? formatDate(fromDate) : 'Opening'}</td>
                <td className="py-2.5 px-4">—</td>
                <td className="py-2.5 px-4">Opening {mode} Balance B/F</td>
                <td className="py-2.5 px-4">Opening</td>
                <td className="py-2.5 px-4 text-right font-mono-num">
                  {book.openingType === 'Dr' ? formatCurrency(book.openingBalance) : '—'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono-num">
                  {book.openingType === 'Cr' ? formatCurrency(book.openingBalance) : '—'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono-num font-semibold">
                  {formatCurrency(book.openingBalance)} {book.openingType}
                </td>
              </tr>

              {book.rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-mono-num text-slate-600 whitespace-nowrap">
                    {formatDate(r.date)}
                  </td>
                  <td className="py-2.5 px-4 font-mono-num font-medium text-slate-900 whitespace-nowrap">
                    {r.voucherNo}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800">{r.particulars}</td>
                  <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{r.voucherType}</td>
                  <td className="py-2.5 px-4 text-right font-mono-num text-emerald-700">
                    {r.debit > 0 ? formatCurrency(r.debit) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num text-slate-900">
                    {r.credit > 0 ? formatCurrency(r.credit) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(r.runningBalance)} {r.runningBalanceType}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right">
                  Totals &amp; Closing {mode} Balance
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-emerald-800">
                  {formatCurrency(book.totalDebit)}
                </td>
                <td className="py-3 px-4 text-right font-mono-num">
                  {formatCurrency(book.totalCredit)}
                </td>
                <td className="py-3 px-4 text-right font-mono-num">
                  {formatCurrency(book.closingBalance)} {book.closingType}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
