import React, { useMemo, useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { exportToExcel, formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { printCurrentPage } from '../utils/nativeActions';

// ============================================================================
// 1. PURCHASE AND SALES STATEMENT
// Columns: Serial Number, Date, Purchase Bill Number, Supplier Name,
// Vehicle Number, Load Weight, Empty Weight, Net Weight,
// Purchase Rate per Tonnage, Purchase Amount, Party/Customer,
// Sales Rate per Tonnage, Sales Amount, Type of Goods
// ============================================================================
export const PurchaseSalesStatementView: React.FC = () => {
  const { company, getStatementRows } = useAccounting();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const rows = useMemo(() => {
    const base = getStatementRows(fromDate || undefined, toDate || undefined);
    const q = searchTerm.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        r.purchaseBillNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        r.vehicleNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.goodsName.toLowerCase().includes(q)
    );
  }, [getStatementRows, fromDate, toDate, searchTerm]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        loadWt: acc.loadWt + r.loadWeightKg,
        emptyWt: acc.emptyWt + r.emptyWeightKg,
        netWt: acc.netWt + r.netWeightKg,
        purchaseAmt: acc.purchaseAmt + r.purchaseAmount,
        salesAmt: acc.salesAmt + r.salesAmount,
      }),
      { loadWt: 0, emptyWt: 0, netWt: 0, purchaseAmt: 0, salesAmt: 0 }
    );
  }, [rows]);

  const handleExportExcel = () => {
    exportToExcel(
      'Purchase_And_Sales_Statement.xlsx',
      [
        'Sl. No.',
        'Date',
        'Purchase Bill Number',
        'Supplier Name',
        'Vehicle Number',
        'Load Weight (KGs)',
        'Empty Weight (KGs)',
        'Net Weight (KGs)',
        'Purchase Rate per Tonnage (Rs)',
        'Purchase Amount (Rs)',
        'Party / Customer',
        'Sales Rate per Tonnage (Rs)',
        'Sales Amount (Rs)',
        'Type of Goods',
      ],
      rows.map((r, idx) => [
        idx + 1,
        formatDate(r.date),
        r.purchaseBillNo,
        r.supplierName,
        r.vehicleNo,
        r.loadWeightKg,
        r.emptyWeightKg,
        r.netWeightKg,
        r.purchaseRatePerTon,
        r.purchaseAmount,
        r.customerName,
        r.salesRatePerTon ?? '—',
        r.hasSale ? r.salesAmount : 0,
        r.goodsName,
      ]),
      'Purchase & Sales'
    );
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase and Sales Statement</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Combined lorry-wise purchase and linked party sales register
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void printCurrentPage('Accounting Statement', 'landscape')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bill no, supplier, customer, vehicle, goods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-72"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-600">Date:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* Statement Table */}
      <div className="print-sheet bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {company.companyName} — Purchase and Sales Statement
          </h2>
          <span className="text-xs text-slate-500 font-mono-num">{rows.length} records</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No purchase or sales entries found for the selected criteria.
          </div>
        ) : (
          <div className="print-table-wrap overflow-x-auto">
            <table className="print-fit-table w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-2.5 whitespace-nowrap">Sl. No.</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Date</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Purchase Bill No</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Supplier Name</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Vehicle No</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Load Wt (KG)</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Empty Wt (KG)</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Net Wt (KG)</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Pur. Rate / Ton</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Purchase Amount</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Party / Customer</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Sales Rate / Ton</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Sales Amount</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Type of Goods</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, index) => (
                  <tr key={`${r.purchaseId}_${index}`} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-500">{index + 1}</td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-700 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {r.purchaseBillNo}
                    </td>
                    <td className="py-2.5 px-2.5 font-medium text-slate-900 whitespace-nowrap">
                      {r.supplierName}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-700 whitespace-nowrap">
                      {r.vehicleNo}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num">
                      {formatNumber(r.loadWeightKg, 0)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num">
                      {formatNumber(r.emptyWeightKg, 0)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num font-medium">
                      {formatNumber(r.netWeightKg, 0)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num whitespace-nowrap">
                      {formatCurrency(r.purchaseRatePerTon)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.purchaseAmount)}
                    </td>
                    <td className="py-2.5 px-2.5 font-medium text-slate-900 whitespace-nowrap">
                      {r.customerName}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num whitespace-nowrap">
                      {r.salesRatePerTon !== null ? formatCurrency(r.salesRatePerTon) : '—'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {r.hasSale ? formatCurrency(r.salesAmount) : '—'}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-800 whitespace-nowrap">
                      {r.goodsName}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3 px-2.5 text-right">
                    Totals
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono-num">
                    {formatNumber(totals.loadWt, 0)}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono-num">
                    {formatNumber(totals.emptyWt, 0)}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono-num">
                    {formatNumber(totals.netWt, 0)}
                  </td>
                  <td />
                  <td className="py-3 px-2.5 text-right font-mono-num whitespace-nowrap">
                    {formatCurrency(totals.purchaseAmt)}
                  </td>
                  <td colSpan={2} />
                  <td className="py-3 px-2.5 text-right font-mono-num whitespace-nowrap">
                    {formatCurrency(totals.salesAmt)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 2. GROSS PROFIT STATEMENT
// Same as Purchase and Sales Statement + Gross Profit (Sales Amount - Purchase Amount)
// ============================================================================
export const GrossProfitStatementView: React.FC = () => {
  const { company, getStatementRows } = useAccounting();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const rows = useMemo(() => {
    const base = getStatementRows(fromDate || undefined, toDate || undefined);
    const q = searchTerm.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        r.purchaseBillNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        r.vehicleNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.goodsName.toLowerCase().includes(q)
    );
  }, [getStatementRows, fromDate, toDate, searchTerm]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        loadWt: acc.loadWt + r.loadWeightKg,
        emptyWt: acc.emptyWt + r.emptyWeightKg,
        netWt: acc.netWt + r.netWeightKg,
        purchaseAmt: acc.purchaseAmt + r.purchaseAmount,
        salesAmt: acc.salesAmt + r.salesAmount,
        grossProfit: acc.grossProfit + r.grossProfit,
      }),
      { loadWt: 0, emptyWt: 0, netWt: 0, purchaseAmt: 0, salesAmt: 0, grossProfit: 0 }
    );
  }, [rows]);

  const handleExportExcel = () => {
    exportToExcel(
      'Gross_Profit_Statement.xlsx',
      [
        'Sl. No.',
        'Date',
        'Purchase Bill Number',
        'Supplier Name',
        'Vehicle Number',
        'Load Weight (KGs)',
        'Empty Weight (KGs)',
        'Net Weight (KGs)',
        'Purchase Rate per Tonnage (Rs)',
        'Purchase Amount (Rs)',
        'Party / Customer',
        'Sales Rate per Tonnage (Rs)',
        'Sales Amount (Rs)',
        'Type of Goods',
        'Gross Profit (Rs)',
      ],
      rows.map((r, idx) => [
        idx + 1,
        formatDate(r.date),
        r.purchaseBillNo,
        r.supplierName,
        r.vehicleNo,
        r.loadWeightKg,
        r.emptyWeightKg,
        r.netWeightKg,
        r.purchaseRatePerTon,
        r.purchaseAmount,
        r.customerName,
        r.salesRatePerTon ?? '—',
        r.salesAmount,
        r.goodsName,
        r.grossProfit,
      ]),
      'Gross Profit'
    );
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gross Profit Statement</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lorry-wise purchase and sales comparison with Gross Profit (Sales Amount − Purchase Amount)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void printCurrentPage('Accounting Statement', 'landscape')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bill no, supplier, customer, vehicle, goods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-72"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-600">Date:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* Gross Profit Table */}
      <div className="print-sheet bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {company.companyName} — Gross Profit Statement
          </h2>
          <span
            className={`text-sm font-bold font-mono-num ${
              totals.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            Total Gross Profit: {formatCurrency(totals.grossProfit)}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No purchase or sales entries found for the selected criteria.
          </div>
        ) : (
          <div className="print-table-wrap overflow-x-auto">
            <table className="print-fit-table w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-2.5 whitespace-nowrap">Sl. No.</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Date</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Purchase Bill No</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Supplier Name</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Vehicle No</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Load Wt (KG)</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Empty Wt (KG)</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Net Wt (KG)</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Pur. Rate / Ton</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Purchase Amount</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Party / Customer</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Sales Rate / Ton</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Sales Amount</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Type of Goods</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, index) => (
                  <tr key={`${r.purchaseId}_${index}`} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-500">{index + 1}</td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-700 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {r.purchaseBillNo}
                    </td>
                    <td className="py-2.5 px-2.5 font-medium text-slate-900 whitespace-nowrap">
                      {r.supplierName}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num text-slate-700 whitespace-nowrap">
                      {r.vehicleNo}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num">
                      {formatNumber(r.loadWeightKg, 0)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num">
                      {formatNumber(r.emptyWeightKg, 0)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num font-medium">
                      {formatNumber(r.netWeightKg, 0)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num whitespace-nowrap">
                      {formatCurrency(r.purchaseRatePerTon)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.purchaseAmount)}
                    </td>
                    <td className="py-2.5 px-2.5 font-medium text-slate-900 whitespace-nowrap">
                      {r.customerName}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num whitespace-nowrap">
                      {r.salesRatePerTon !== null ? formatCurrency(r.salesRatePerTon) : '—'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(r.salesAmount)}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-800 whitespace-nowrap">
                      {r.goodsName}
                    </td>
                    <td
                      className={`py-2.5 px-2.5 text-right font-mono-num font-bold whitespace-nowrap ${
                        r.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {formatCurrency(r.grossProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3 px-2.5 text-right">
                    Totals
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono-num">
                    {formatNumber(totals.loadWt, 0)}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono-num">
                    {formatNumber(totals.emptyWt, 0)}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono-num">
                    {formatNumber(totals.netWt, 0)}
                  </td>
                  <td />
                  <td className="py-3 px-2.5 text-right font-mono-num whitespace-nowrap">
                    {formatCurrency(totals.purchaseAmt)}
                  </td>
                  <td colSpan={2} />
                  <td className="py-3 px-2.5 text-right font-mono-num whitespace-nowrap">
                    {formatCurrency(totals.salesAmt)}
                  </td>
                  <td />
                  <td
                    className={`py-3 px-2.5 text-right font-mono-num font-bold whitespace-nowrap ${
                      totals.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {formatCurrency(totals.grossProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
