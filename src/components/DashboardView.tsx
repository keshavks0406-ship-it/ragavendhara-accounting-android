import React, { useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { formatCurrency } from '../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    company,
    sales,
    purchases,
    receipts,
    payments,
    customerOutstandings,
    supplierOutstandings,
    getCashBook,
    getBankBook,
  } = useAccounting();

  const totalSalesTurnover = useMemo(
    () => sales.reduce((sum, s) => sum + s.amount, 0),
    [sales]
  );

  const totalPurchase = useMemo(
    () => purchases.reduce((sum, p) => sum + p.amount, 0),
    [purchases]
  );

  const customerOutstandingTotal = useMemo(
    () =>
      customerOutstandings.reduce(
        (sum, c) => sum + (c.balanceType === 'Dr' ? c.netBalance : -c.netBalance),
        0
      ),
    [customerOutstandings]
  );

  const supplierOutstandingTotal = useMemo(
    () =>
      supplierOutstandings.reduce(
        (sum, s) => sum + (s.balanceType === 'Cr' ? s.netBalance : -s.netBalance),
        0
      ),
    [supplierOutstandings]
  );

  const cashBook = useMemo(
    () => getCashBook(),
    [receipts, payments, company.openingCashBalance]
  );

  const bankBook = useMemo(
    () => getBankBook(),
    [receipts, payments, company.openingBankBalance]
  );

  const estimatedGrossProfit = useMemo(
    () => totalSalesTurnover - totalPurchase,
    [totalSalesTurnover, totalPurchase]
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="text-xs font-medium text-slate-500 mb-1">
          {company.companyName}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
      </div>

      {/* Strictly the 7 Requested Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500">Total Sales Turnover</div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(totalSalesTurnover)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500">Total Purchase</div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(totalPurchase)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500">Customer Outstanding</div>
          <div className="mt-3 text-2xl font-bold text-emerald-700 font-mono-num">
            {formatCurrency(Math.abs(customerOutstandingTotal))}{' '}
            <span className="text-xs font-semibold">
              {customerOutstandingTotal >= 0 ? 'Dr' : 'Cr'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500">Supplier Outstanding</div>
          <div className="mt-3 text-2xl font-bold text-amber-700 font-mono-num">
            {formatCurrency(Math.abs(supplierOutstandingTotal))}{' '}
            <span className="text-xs font-semibold">
              {supplierOutstandingTotal >= 0 ? 'Cr' : 'Dr'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500">Cash Book Balance</div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(cashBook.closingBalance)}{' '}
            <span className="text-xs font-semibold">{cashBook.closingType}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500">Bank Book Balance</div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono-num">
            {formatCurrency(bankBook.closingBalance)}{' '}
            <span className="text-xs font-semibold">{bankBook.closingType}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500">Estimated Gross Profit</div>
          <div
            className={`mt-3 text-2xl font-bold font-mono-num ${
              estimatedGrossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {formatCurrency(estimatedGrossProfit)}
          </div>
        </div>
      </div>
    </div>
  );
};
