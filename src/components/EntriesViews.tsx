import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Download, Edit2, FileText, Filter, Plus, Printer, Trash2 } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import {
  CashBankMode,
  PaymentEntry,
  PurchaseEntry,
  ReceiptEntry,
  SalesEntry,
} from '../types/accounting';
import {
  exportToExcel,
  formatCurrency,
  formatDate,
  formatNumber,
  parseTypedDateToISO,
  todayISO,
} from '../utils/formatters';
import { printCurrentPage } from '../utils/nativeActions';

interface TypeableDateFieldProps {
  valueISO: string;
  onChangeISO: (iso: string) => void;
  id?: string;
  required?: boolean;
}

const TypeableDateField: React.FC<TypeableDateFieldProps> = ({
  valueISO,
  onChangeISO,
  id,
  required = true,
}) => {
  const [textVal, setTextVal] = useState<string>(() => formatDate(valueISO));
  const [hasError, setHasError] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTextVal(formatDate(valueISO));
    setHasError(false);
  }, [valueISO]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextVal(raw);
    const parsed = parseTypedDateToISO(raw);
    if (parsed) {
      setHasError(false);
      onChangeISO(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseTypedDateToISO(textVal);
    if (parsed) {
      setHasError(false);
      onChangeISO(parsed);
      setTextVal(formatDate(parsed));
    } else if (textVal.trim()) {
      setHasError(true);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        required={required}
        placeholder="DD-MM-YYYY"
        value={textVal}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className={`w-full pr-9 pl-3 py-2 text-sm font-mono-num border rounded-lg focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-red-400 focus:ring-red-200'
            : 'border-slate-300 focus:ring-teal-600/20 focus:border-teal-700'
        }`}
      />
      <button
        type="button"
        onClick={() => pickerRef.current?.showPicker?.()}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
        title="Pick date from calendar"
      >
        <Calendar className="w-4 h-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={valueISO}
        onChange={(e) => {
          if (e.target.value) {
            onChangeISO(e.target.value);
            setTextVal(formatDate(e.target.value));
            setHasError(false);
          }
        }}
        className="sr-only"
      />
      {hasError && (
        <p className="text-[11px] text-red-600 mt-1">Enter valid date as DD-MM-YYYY</p>
      )}
    </div>
  );
};

// ============================================================================
// 1. PURCHASE ENTRY & PURCHASE REGISTER
// ============================================================================
export const PurchaseEntryView: React.FC = () => {
  const {
    suppliers,
    goods,
    purchases,
    savePurchase,
    deletePurchase,
    setActiveView,
  } = useAccounting();

  const [tab, setTab] = useState<'entry' | 'register'>('entry');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const [date, setDate] = useState<string>(todayISO());
  const [billNo, setBillNo] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [goodsId, setGoodsId] = useState<string>(goods[0]?.id || '');
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [loadWeightStr, setLoadWeightStr] = useState<string>('');
  const [emptyWeightStr, setEmptyWeightStr] = useState<string>('');
  const [ratePerTonStr, setRatePerTonStr] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Confirmation modal state
  const [pendingPurchase, setPendingPurchase] = useState<
    (Omit<PurchaseEntry, 'id'> & { id?: string }) | null
  >(null);

  // Register filters
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!supplierId && suppliers.length > 0) setSupplierId(suppliers[0].id);
  }, [suppliers, supplierId]);

  useEffect(() => {
    if (!goodsId && goods.length > 0) setGoodsId(goods[0].id);
  }, [goods, goodsId]);

  const loadWeightKg = parseFloat(loadWeightStr) || 0;
  const emptyWeightKg = parseFloat(emptyWeightStr) || 0;
  const netWeightKg = Math.round((loadWeightKg - emptyWeightKg) * 100) / 100;
  const ratePerTon = parseFloat(ratePerTonStr) || 0;
  const purchaseAmount =
    Math.round(((netWeightKg / 1000) * ratePerTon + Number.EPSILON) * 100) / 100;

  const resetForm = () => {
    setEditingId(undefined);
    setDate(todayISO());
    setBillNo('');
    setSupplierId(suppliers[0]?.id || '');
    setGoodsId(goods[0]?.id || '');
    setVehicleNo('');
    setLoadWeightStr('');
    setEmptyWeightStr('');
    setRatePerTonStr('');
    setFormError('');
  };

  const handleOpenConfirmPopup = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const supplier = suppliers.find((s) => s.id === supplierId);
    const goodsItem = goods.find((g) => g.id === goodsId);

    if (!date) {
      setFormError('Please enter a valid Purchase Date.');
      return;
    }
    if (!billNo.trim()) {
      setFormError('Please enter the Purchase Bill Number.');
      return;
    }
    if (!supplier) {
      setFormError('Please select a Supplier from Supplier Master.');
      return;
    }
    if (!goodsItem) {
      setFormError('Please select Type of Goods from Goods Master.');
      return;
    }
    if (!vehicleNo.trim()) {
      setFormError('Please enter the Vehicle Number.');
      return;
    }
    if (loadWeightKg <= 0) {
      setFormError('Load weight must be greater than 0 KG.');
      return;
    }
    if (emptyWeightKg < 0 || loadWeightKg <= emptyWeightKg) {
      setFormError('Load weight must be greater than Empty weight.');
      return;
    }
    if (ratePerTon <= 0) {
      setFormError('Purchase rate per tonnage must be greater than ₹0.');
      return;
    }

    setPendingPurchase({
      id: editingId,
      date,
      billNo: billNo.trim(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      goodsId: goodsItem.id,
      goodsName: goodsItem.name,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      loadWeightKg,
      emptyWeightKg,
      netWeightKg,
      ratePerTon,
      amount: purchaseAmount,
    });
  };

  const handleConfirmSave = () => {
    if (!pendingPurchase) return;
    savePurchase(pendingPurchase);
    setPendingPurchase(null);
    resetForm();
    setTab('register');
  };

  const handleEditFromRegister = (p: PurchaseEntry) => {
    setEditingId(p.id);
    setDate(p.date);
    setBillNo(p.billNo);
    setSupplierId(p.supplierId);
    setGoodsId(p.goodsId);
    setVehicleNo(p.vehicleNo);
    setLoadWeightStr(String(p.loadWeightKg));
    setEmptyWeightStr(String(p.emptyWeightKg));
    setRatePerTonStr(String(p.ratePerTon));
    setFormError('');
    setTab('entry');
  };

  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((p) => {
        if (fromDate && p.date < fromDate) return false;
        if (toDate && p.date > toDate) return false;
        if (selectedSupplierFilter) {
          return (
            p.supplierId === selectedSupplierFilter ||
            p.supplierName.toLowerCase() === selectedSupplierFilter.toLowerCase()
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.billNo.localeCompare(a.billNo));
  }, [purchases, fromDate, toDate, selectedSupplierFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Entry &amp; Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="no-print">Enter weighbridge lorry weights and tonnage rates; confirm before posting to Purchase Register</span>
          </p>
        </div>

        <div className="no-print flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('entry')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'entry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {editingId ? 'Edit Purchase Entry' : 'Purchase Entry'}
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Register ({purchases.length})
          </button>
        </div>
      </div>

      {tab === 'entry' ? (
        suppliers.length === 0 || goods.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              Please add at least one Supplier and one Goods Item in Masters before entering purchases.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('supplier-master')}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
              >
                Open Supplier Master
              </button>
              <button
                type="button"
                onClick={() => setActiveView('goods-master')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              >
                Open Goods Master
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleOpenConfirmPopup}
            className="bg-white border border-slate-200 rounded-xl p-6 max-w-4xl space-y-6"
          >
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Purchase Date (DD-MM-YYYY)
                </label>
                <TypeableDateField valueISO={date} onChangeISO={setDate} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bill Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PB-104"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supplier Name
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-teal-700"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Types of Goods
                </label>
                <select
                  value={goodsId}
                  onChange={(e) => setGoodsId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-teal-700"
                >
                  {goods.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-AG-4590"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Load Weight (in KGs)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 34850"
                  value={loadWeightStr}
                  onChange={(e) => setLoadWeightStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Empty Weight (in KGs)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 10850"
                  value={emptyWeightStr}
                  onChange={(e) => setEmptyWeightStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Net Weight (in KGs) — Automatic
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${formatNumber(netWeightKg, 2)} KG`}
                  className="w-full px-3 py-2 text-sm font-semibold font-mono-num bg-slate-100 text-slate-900 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Purchase Rate per Tonnage (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 24500"
                  value={ratePerTonStr}
                  onChange={(e) => setRatePerTonStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-600">
                      Purchase Amount (₹) — Automatic
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono-num">
                      Formula: ({formatNumber(netWeightKg, 2)} / 1000) × ₹{formatNumber(ratePerTon, 2)}
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono-num text-slate-900">
                    {formatCurrency(purchaseAmount > 0 ? purchaseAmount : 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        )
      ) : (
        /* EDITABLE PURCHASE REGISTER */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="no-print p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:inline" />
                <select
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer w-52 sm:w-60 truncate focus:outline-none focus:ring-2 focus:ring-teal-700"
                  aria-label="Select supplier"
                >
                  <option value="">All Suppliers (Show All)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {selectedSupplierFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedSupplierFilter('')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-1 shrink-0 cursor-pointer"
                    title="Clear selection"
                  >
                    Reset
                  </button>
                )}
              </div>
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

            <button
              type="button"
              onClick={() =>
                exportToExcel(
                  'Purchase_Register.xlsx',
                  [
                    'Date',
                    'Bill Number',
                    'Supplier Name',
                    'Type of Goods',
                    'Vehicle No',
                    'Load Weight (KG)',
                    'Empty Weight (KG)',
                    'Net Weight (KG)',
                    'Purchase Rate / Ton',
                    'Purchase Amount',
                  ],
                  filteredPurchases.map((p) => [
                    formatDate(p.date),
                    p.billNo,
                    p.supplierName,
                    p.goodsName,
                    p.vehicleNo,
                    p.loadWeightKg,
                    p.emptyWeightKg,
                    p.netWeightKg,
                    p.ratePerTon,
                    p.amount,
                  ]),
                  'Purchase Register'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => void printCurrentPage('Register', 'landscape')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-700">No purchase entries in register.</p>
              <button
                type="button"
                onClick={() => setTab('entry')}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
              >
                Create Purchase Entry
              </button>
            </div>
          ) : (
            <div className="print-table-wrap overflow-x-auto">
              <table className="register-print-table print-fit-table w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Bill No</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3">Type of Goods</th>
                    <th className="py-3 px-3">Vehicle No</th>
                    <th className="py-3 px-3 text-right">Load Wt (KG)</th>
                    <th className="py-3 px-3 text-right">Empty Wt (KG)</th>
                    <th className="py-3 px-3 text-right">Net Wt (KG)</th>
                    <th className="py-3 px-3 text-right">Rate / Ton</th>
                    <th className="py-3 px-3 text-right">Purchase Amount</th>
                    <th className="no-print py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono-num text-slate-600 whitespace-nowrap">
                        {formatDate(p.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                        {p.billNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{p.supplierName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{p.goodsName}</td>
                      <td className="py-2.5 px-3 font-mono-num text-slate-700 whitespace-nowrap">
                        {p.vehicleNo}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {formatNumber(p.loadWeightKg, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {formatNumber(p.emptyWeightKg, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-medium">
                        {formatNumber(p.netWeightKg, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {formatCurrency(p.ratePerTon)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="no-print py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleEditFromRegister(p)}
                            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                            title="Edit purchase entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {confirmDeleteId === p.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                deletePurchase(p.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[11px] font-semibold text-red-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Delete purchase entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                  <tr>
                    <td colSpan={7} className="py-3 px-3 text-right">
                      Total ({filteredPurchases.length} entries)
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      {formatNumber(
                        filteredPurchases.reduce((s, p) => s + p.netWeightKg, 0),
                        0
                      )}{' '}
                      KG
                    </td>
                    <td />
                    <td className="py-3 px-3 text-right font-mono-num">
                      {formatCurrency(filteredPurchases.reduce((s, p) => s + p.amount, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PURCHASE CONFIRMATION POP-UP MODAL */}
      {pendingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Confirm Purchase Entry</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review the purchase details below before saving to the Purchase Register.
              </p>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Purchase Date</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {formatDate(pendingPurchase.date)}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Bill Number</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {pendingPurchase.billNo}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Supplier Name</dt>
                <dd className="font-semibold text-slate-900 text-right">
                  {pendingPurchase.supplierName}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Type of Goods</dt>
                <dd className="font-semibold text-slate-900">{pendingPurchase.goodsName}</dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Vehicle Number</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {pendingPurchase.vehicleNo}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Load Weight</dt>
                <dd className="font-mono-num text-slate-900">
                  {formatNumber(pendingPurchase.loadWeightKg, 2)} KGs
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Empty Weight</dt>
                <dd className="font-mono-num text-slate-900">
                  {formatNumber(pendingPurchase.emptyWeightKg, 2)} KGs
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Net Weight</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {formatNumber(pendingPurchase.netWeightKg, 2)} KGs
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Purchase Rate per Tonnage</dt>
                <dd className="font-mono-num text-slate-900">
                  {formatCurrency(pendingPurchase.ratePerTon)}
                </dd>
              </div>
              <div className="pt-3 flex justify-between gap-4 text-base">
                <dt className="font-bold text-slate-900">Purchase Amount</dt>
                <dd className="font-mono-num font-bold text-teal-800">
                  {formatCurrency(pendingPurchase.amount)}
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPendingPurchase(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. SALES ENTRY & SALES REGISTER (DIRECTLY LINKED TO PURCHASE BILL)
// ============================================================================
export const SalesEntryView: React.FC = () => {
  const {
    customers,
    purchases,
    sales,
    saveSale,
    deleteSale,
    nextSalesInvoiceNo,
    openSalesBill,
    setActiveView,
  } = useAccounting();

  const [tab, setTab] = useState<'entry' | 'register'>('entry');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [editingInvoiceNo, setEditingInvoiceNo] = useState<string>('');

  // Purchases are appended when entered, so reverse insertion order to show newest first.
  const recentFirstPurchases = useMemo(() => [...purchases].reverse(), [purchases]);

  // Default to the newest unbilled purchase bill if available, else the newest purchase bill.
  const getDefaultPurchaseId = () => {
    const soldSet = new Set(sales.map((s) => s.purchaseId));
    const unbilled = recentFirstPurchases.find((p) => !soldSet.has(p.id));
    return unbilled?.id || recentFirstPurchases[0]?.id || '';
  };

  const [purchaseId, setPurchaseId] = useState<string>(() => getDefaultPurchaseId());
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || '');
  const [ratePerTonStr, setRatePerTonStr] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Confirmation modal state
  const [pendingSale, setPendingSale] = useState<
    (Omit<SalesEntry, 'id'> & { id?: string }) | null
  >(null);

  // Register filters
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId && customers.length > 0) setCustomerId(customers[0].id);
  }, [customers, customerId]);

  useEffect(() => {
    if (!purchaseId && purchases.length > 0) setPurchaseId(getDefaultPurchaseId());
  }, [purchases, purchaseId]);

  const linkedPurchase = purchases.find((p) => p.id === purchaseId);
  const autoInvoiceNo = editingId ? editingInvoiceNo : nextSalesInvoiceNo();
  const netWeightKg = linkedPurchase?.netWeightKg ?? 0;
  const salesRatePerTon = parseFloat(ratePerTonStr) || 0;
  const salesAmount =
    Math.round(((netWeightKg / 1000) * salesRatePerTon + Number.EPSILON) * 100) / 100;

  const soldPurchaseIds = useMemo(
    () => new Set(sales.filter((s) => s.id !== editingId).map((s) => s.purchaseId)),
    [sales, editingId]
  );

  const resetForm = () => {
    setEditingId(undefined);
    setEditingInvoiceNo('');
    setPurchaseId(getDefaultPurchaseId());
    setCustomerId(customers[0]?.id || '');
    setRatePerTonStr('');
    setFormError('');
  };

  const handleOpenConfirmPopup = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!linkedPurchase) {
      setFormError('Please select a Purchase Bill Number.');
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      setFormError('Please select a Customer / Party from Customer Master.');
      return;
    }
    if (salesRatePerTon <= 0) {
      setFormError('Sales rate per tonnage must be greater than ₹0.');
      return;
    }

    setPendingSale({
      id: editingId,
      invoiceNo: autoInvoiceNo,
      purchaseId: linkedPurchase.id,
      purchaseBillNo: linkedPurchase.billNo,
      date: linkedPurchase.date, // Same as purchase date
      customerId: customer.id,
      customerName: customer.name,
      goodsId: linkedPurchase.goodsId,
      goodsName: linkedPurchase.goodsName,
      vehicleNo: linkedPurchase.vehicleNo,
      loadWeightKg: linkedPurchase.loadWeightKg,
      emptyWeightKg: linkedPurchase.emptyWeightKg,
      netWeightKg: linkedPurchase.netWeightKg,
      ratePerTon: salesRatePerTon,
      amount: salesAmount,
    });
  };

  const handleConfirmSave = () => {
    if (!pendingSale) return;
    saveSale(pendingSale);
    setPendingSale(null);
    resetForm();
    setTab('register');
  };

  const handleEditFromRegister = (s: SalesEntry) => {
    setEditingId(s.id);
    setEditingInvoiceNo(s.invoiceNo);
    setPurchaseId(s.purchaseId);
    setCustomerId(s.customerId);
    setRatePerTonStr(String(s.ratePerTon));
    setFormError('');
    setTab('entry');
  };

  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        if (fromDate && s.date < fromDate) return false;
        if (toDate && s.date > toDate) return false;
        if (selectedCustomerFilter) {
          return (
            s.customerId === selectedCustomerFilter ||
            s.customerName.toLowerCase() === selectedCustomerFilter.toLowerCase()
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.invoiceNo.localeCompare(a.invoiceNo));
  }, [sales, fromDate, toDate, selectedCustomerFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Entry &amp; Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="no-print">Select a Purchase Bill to auto-populate load details, enter Sales Rate per Tonnage, and confirm to Sales Register</span>
          </p>
        </div>

        <div className="no-print flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('entry')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'entry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {editingId ? 'Edit Sales Entry' : 'Sales Entry'}
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Register ({sales.length})
          </button>
        </div>
      </div>

      {tab === 'entry' ? (
        purchases.length === 0 || customers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              Sales Entry is directly linked to Purchase Entry and Customer Master. Please ensure at least one Purchase Bill and one Customer exist.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('purchase-entry')}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
              >
                Open Purchase Entry
              </button>
              <button
                type="button"
                onClick={() => setActiveView('customer-master')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              >
                Open Customer Master
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleOpenConfirmPopup}
            className="bg-white border border-slate-200 rounded-xl p-6 max-w-4xl space-y-6"
          >
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Purchase Bill Number
                </label>
                <select
                  value={purchaseId}
                  onChange={(e) => setPurchaseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-teal-700"
                >
                  {recentFirstPurchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.billNo} — {p.vehicleNo} ({p.goodsName})
                      {soldPurchaseIds.has(p.id) ? ' [Sold]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer / Party Name
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-teal-700"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Sales Invoice Number — Automatic
                </label>
                <input
                  type="text"
                  readOnly
                  value={autoInvoiceNo}
                  className="w-full px-3 py-2 text-sm font-semibold font-mono-num bg-slate-100 text-slate-900 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Sales Date — Same as Purchase Date
                </label>
                <input
                  type="text"
                  readOnly
                  value={linkedPurchase ? formatDate(linkedPurchase.date) : '—'}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-100 text-slate-800 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Vehicle Number — From Purchase Bill
                </label>
                <input
                  type="text"
                  readOnly
                  value={linkedPurchase?.vehicleNo || '—'}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-100 text-slate-800 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Type of Goods — From Purchase Bill
                </label>
                <input
                  type="text"
                  readOnly
                  value={linkedPurchase?.goodsName || '—'}
                  className="w-full px-3 py-2 text-sm bg-slate-100 text-slate-800 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Load Weight (in KGs) — From Purchase Bill
                </label>
                <input
                  type="text"
                  readOnly
                  value={linkedPurchase ? `${formatNumber(linkedPurchase.loadWeightKg, 2)} KG` : '—'}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-100 text-slate-800 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Empty Weight (in KGs) — From Purchase Bill
                </label>
                <input
                  type="text"
                  readOnly
                  value={linkedPurchase ? `${formatNumber(linkedPurchase.emptyWeightKg, 2)} KG` : '—'}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-100 text-slate-800 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Net Weight (in KGs) — From Purchase Bill
                </label>
                <input
                  type="text"
                  readOnly
                  value={linkedPurchase ? `${formatNumber(linkedPurchase.netWeightKg, 2)} KG` : '—'}
                  className="w-full px-3 py-2 text-sm font-semibold font-mono-num bg-slate-100 text-slate-900 border border-slate-200 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sales Rate per Tonnage (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 25800"
                  value={ratePerTonStr}
                  onChange={(e) => setRatePerTonStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-600">
                      Sales Amount (₹) — Automatic
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono-num">
                      Formula: ({formatNumber(netWeightKg, 2)} / 1000) × ₹{formatNumber(salesRatePerTon, 2)}
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono-num text-slate-900">
                    {formatCurrency(salesAmount > 0 ? salesAmount : 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        )
      ) : (
        /* EDITABLE SALES REGISTER */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="no-print p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:inline" />
                <select
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer w-52 sm:w-60 truncate focus:outline-none focus:ring-2 focus:ring-teal-700"
                  aria-label="Select customer"
                >
                  <option value="">All Customers (Show All)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {selectedCustomerFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerFilter('')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-1 shrink-0 cursor-pointer"
                    title="Clear selection"
                  >
                    Reset
                  </button>
                )}
              </div>
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

            <button
              type="button"
              onClick={() =>
                exportToExcel(
                  'Sales_Register.xlsx',
                  [
                    'Sales Date',
                    'Sales Invoice No',
                    'Purchase Bill No',
                    'Customer / Party',
                    'Type of Goods',
                    'Vehicle No',
                    'Load Wt (KG)',
                    'Empty Wt (KG)',
                    'Net Wt (KG)',
                    'Sales Rate / Ton',
                    'Sales Amount',
                  ],
                  filteredSales.map((s) => [
                    formatDate(s.date),
                    s.invoiceNo,
                    s.purchaseBillNo,
                    s.customerName,
                    s.goodsName,
                    s.vehicleNo,
                    s.loadWeightKg,
                    s.emptyWeightKg,
                    s.netWeightKg,
                    s.ratePerTon,
                    s.amount,
                  ]),
                  'Sales Register'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => void printCurrentPage('Register', 'landscape')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-700">No sales entries in register.</p>
              <button
                type="button"
                onClick={() => setTab('entry')}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
              >
                Create Sales Entry
              </button>
            </div>
          ) : (
            <div className="print-table-wrap overflow-x-auto">
              <table className="register-print-table print-fit-table w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3">Customer / Party</th>
                    <th className="py-3 px-3">Goods</th>
                    <th className="py-3 px-3">Vehicle No</th>
                    <th className="py-3 px-3 text-right">Load Wt (KG)</th>
                    <th className="py-3 px-3 text-right">Empty Wt (KG)</th>
                    <th className="py-3 px-3 text-right">Net Wt (KG)</th>
                    <th className="py-3 px-3 text-right">Rate / Ton</th>
                    <th className="py-3 px-3 text-right">Sales Amount</th>
                    <th className="no-print py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono-num text-slate-600 whitespace-nowrap">
                        {formatDate(s.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                        {s.invoiceNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{s.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{s.goodsName}</td>
                      <td className="py-2.5 px-3 font-mono-num text-slate-700 whitespace-nowrap">
                        {s.vehicleNo}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {formatNumber(s.loadWeightKg, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {formatNumber(s.emptyWeightKg, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {formatNumber(s.netWeightKg, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        {formatCurrency(s.ratePerTon)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-900">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="no-print py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => openSalesBill(s.id)}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-teal-800 font-semibold cursor-pointer"
                            title="Open Sales Bill"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Bill
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditFromRegister(s)}
                            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                            title="Edit sales entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {confirmDeleteId === s.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                deleteSale(s.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[11px] font-semibold text-red-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(s.id)}
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Delete sales entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                  <tr>
                    <td colSpan={7} className="py-3 px-3 text-right">
                      Total ({filteredSales.length} invoices)
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      {formatNumber(
                        filteredSales.reduce((acc, s) => acc + s.netWeightKg, 0),
                        0
                      )}{' '}
                      KG
                    </td>
                    <td />
                    <td className="py-3 px-3 text-right font-mono-num">
                      {formatCurrency(filteredSales.reduce((acc, s) => acc + s.amount, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SALES CONFIRMATION POP-UP MODAL */}
      {pendingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Confirm Sales Entry</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review the linked sales invoice details below before saving to the Sales Register.
              </p>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Sales Invoice Number</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {pendingSale.invoiceNo}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Linked Purchase Bill No</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {pendingSale.purchaseBillNo}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Sales Date</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {formatDate(pendingSale.date)}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Customer / Party Name</dt>
                <dd className="font-semibold text-slate-900 text-right">
                  {pendingSale.customerName}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Vehicle Number</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {pendingSale.vehicleNo}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Type of Goods</dt>
                <dd className="font-semibold text-slate-900">{pendingSale.goodsName}</dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Load Weight</dt>
                <dd className="font-mono-num text-slate-900">
                  {formatNumber(pendingSale.loadWeightKg, 2)} KGs
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Empty Weight</dt>
                <dd className="font-mono-num text-slate-900">
                  {formatNumber(pendingSale.emptyWeightKg, 2)} KGs
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Net Weight</dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {formatNumber(pendingSale.netWeightKg, 2)} KGs
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <dt className="text-slate-500">Sales Rate per Tonnage</dt>
                <dd className="font-mono-num text-slate-900">
                  {formatCurrency(pendingSale.ratePerTon)}
                </dd>
              </div>
              <div className="pt-3 flex justify-between gap-4 text-base">
                <dt className="font-bold text-slate-900">Sales Amount</dt>
                <dd className="font-mono-num font-bold text-teal-800">
                  {formatCurrency(pendingSale.amount)}
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPendingSale(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. RECEIPT ENTRY & EDITABLE RECEIPT REGISTER
// ============================================================================
export const ReceiptEntryView: React.FC = () => {
  const {
    customers,
    receipts,
    customerOutstandings,
    saveReceipt,
    deleteReceipt,
    nextVoucherNumber,
    setActiveView,
  } = useAccounting();

  const [tab, setTab] = useState<'entry' | 'register'>('entry');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [voucherNo, setVoucherNo] = useState(() => nextVoucherNumber('RCP'));
  const [date, setDate] = useState(todayISO());
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [mode, setMode] = useState<CashBankMode>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [narration, setNarration] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (!customerId && customers.length > 0) setCustomerId(customers[0].id);
  }, [customers, customerId]);

  // When switching to the entry tab for a new entry (or when receipts list updates),
  // automatically update voucher number to the next sequence
  useEffect(() => {
    if (tab === 'entry' && !editingId) {
      setVoucherNo(nextVoucherNumber('RCP'));
    }
  }, [tab, editingId, receipts.length, nextVoucherNumber]);

  const selectedPartyDue = customerOutstandings.find((c) => c.id === customerId);

  const resetForm = () => {
    setEditingId(undefined);
    setVoucherNo(nextVoucherNumber('RCP'));
    setDate(todayISO());
    setCustomerId(customers[0]?.id || '');
    setMode('Cash');
    setReferenceNo('');
    setAmount(0);
    setNarration('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || amount <= 0) return;

    saveReceipt({
      id: editingId,
      voucherNo,
      date,
      customerId: customer.id,
      customerName: customer.name,
      mode,
      referenceNo,
      amount,
      narration,
    });

    setEditingId(undefined);
    setDate(todayISO());
    setCustomerId(customers[0]?.id || '');
    setMode('Cash');
    setReferenceNo('');
    setAmount(0);
    setNarration('');
    setTab('register');
  };

  const handleEdit = (r: ReceiptEntry) => {
    setEditingId(r.id);
    setVoucherNo(r.voucherNo);
    setDate(r.date);
    setCustomerId(r.customerId);
    setMode(r.mode);
    setReferenceNo(r.referenceNo);
    setAmount(r.amount);
    setNarration(r.narration);
    setTab('entry');
  };

  const filteredReceipts = useMemo(() => {
    return receipts
      .filter((r) => {
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        if (selectedCustomerFilter) {
          return (
            r.customerId === selectedCustomerFilter ||
            r.customerName.toLowerCase() === selectedCustomerFilter.toLowerCase()
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.voucherNo.localeCompare(a.voucherNo));
  }, [receipts, fromDate, toDate, selectedCustomerFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Receipt Entry &amp; Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="no-print">Record customer collections in Cash or Bank; updates Customer Ledger and Cash/Bank Book</span>
          </p>
        </div>

        <div className="no-print flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (!editingId) {
                setVoucherNo(nextVoucherNumber('RCP'));
              }
              setTab('entry');
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'entry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {editingId ? 'Edit Receipt Entry' : 'Receipt Entry'}
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Receipt Register ({receipts.length})
          </button>
        </div>
      </div>

      {tab === 'entry' ? (
        customers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-700">Add a customer in Customer Master first.</p>
            <button
              type="button"
              onClick={() => setActiveView('customer-master')}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
            >
              Open Customer Master
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Voucher No</label>
                <input
                  type="text"
                  required
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt Date (DD-MM-YYYY)
                </label>
                <TypeableDateField valueISO={date} onChangeISO={setDate} />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Received From (Customer)</label>
                  {selectedPartyDue && (
                    <span className="text-xs text-slate-600 font-mono-num">
                      Outstanding: {formatCurrency(selectedPartyDue.netBalance)} {selectedPartyDue.balanceType}
                    </span>
                  )}
                </div>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as CashBankMode)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Cheque / UTR No
                </label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration</label>
                <input
                  type="text"
                  placeholder="Remarks"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                {editingId ? 'Update Receipt' : 'Save Receipt Entry'}
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="no-print p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:inline" />
                <select
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer w-52 sm:w-60 truncate focus:outline-none focus:ring-2 focus:ring-teal-700"
                  aria-label="Select customer"
                >
                  <option value="">All Customers (Show All)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {selectedCustomerFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerFilter('')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-1 shrink-0 cursor-pointer"
                    title="Clear selection"
                  >
                    Reset
                  </button>
                )}
              </div>
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setTab('entry');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Receipt Entry
              </button>
              <button
                type="button"
                onClick={() =>
                  exportToExcel(
                    'Receipt_Register.xlsx',
                    ['Date', 'Voucher No', 'Customer', 'Mode', 'Reference', 'Amount', 'Narration'],
                    filteredReceipts.map((r) => [
                      formatDate(r.date),
                      r.voucherNo,
                      r.customerName,
                      r.mode,
                      r.referenceNo,
                      r.amount,
                      r.narration,
                    ]),
                    'Receipt Register'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => void printCurrentPage('Register', 'landscape')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-600">
              <p>No receipts recorded.</p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setTab('entry');
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Receipt Entry
              </button>
            </div>
          ) : (
            <div className="print-table-wrap overflow-x-auto">
              <table className="register-print-table print-fit-table w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Mode · Reference</th>
                    <th className="py-3 px-4">Narration</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="no-print py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono-num text-slate-600 whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-2.5 px-4 font-mono-num font-semibold text-slate-900">
                        {r.voucherNo}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{r.customerName}</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {r.mode}
                        {r.referenceNo ? ` · ${r.referenceNo}` : ''}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{r.narration || '—'}</td>
                      <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-emerald-700">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="no-print py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(r)}
                            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {confirmDeleteId === r.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                deleteReceipt(r.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[11px] font-semibold text-red-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(r.id)}
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. PAYMENT ENTRY & EDITABLE PAYMENT REGISTER
// ============================================================================
export const PaymentEntryView: React.FC = () => {
  const {
    suppliers,
    payments,
    supplierOutstandings,
    savePayment,
    deletePayment,
    nextVoucherNumber,
    setActiveView,
  } = useAccounting();

  const [tab, setTab] = useState<'entry' | 'register'>('entry');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [voucherNo, setVoucherNo] = useState(() => nextVoucherNumber('PMT'));
  const [date, setDate] = useState(todayISO());
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [mode, setMode] = useState<CashBankMode>('Bank');
  const [referenceNo, setReferenceNo] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [narration, setNarration] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (!supplierId && suppliers.length > 0) setSupplierId(suppliers[0].id);
  }, [suppliers, supplierId]);

  // When switching to the entry tab for a new entry (or when payments list updates),
  // automatically update voucher number to the next sequence
  useEffect(() => {
    if (tab === 'entry' && !editingId) {
      setVoucherNo(nextVoucherNumber('PMT'));
    }
  }, [tab, editingId, payments.length, nextVoucherNumber]);

  const selectedSupplierDue = supplierOutstandings.find((s) => s.id === supplierId);

  const resetForm = () => {
    setEditingId(undefined);
    setVoucherNo(nextVoucherNumber('PMT'));
    setDate(todayISO());
    setSupplierId(suppliers[0]?.id || '');
    setMode('Bank');
    setReferenceNo('');
    setAmount(0);
    setNarration('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier || amount <= 0) return;

    savePayment({
      id: editingId,
      voucherNo,
      date,
      supplierId: supplier.id,
      supplierName: supplier.name,
      mode,
      referenceNo,
      amount,
      narration,
    });

    setEditingId(undefined);
    setDate(todayISO());
    setSupplierId(suppliers[0]?.id || '');
    setMode('Bank');
    setReferenceNo('');
    setAmount(0);
    setNarration('');
    setTab('register');
  };

  const handleEdit = (p: PaymentEntry) => {
    setEditingId(p.id);
    setVoucherNo(p.voucherNo);
    setDate(p.date);
    setSupplierId(p.supplierId);
    setMode(p.mode);
    setReferenceNo(p.referenceNo);
    setAmount(p.amount);
    setNarration(p.narration);
    setTab('entry');
  };

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        if (fromDate && p.date < fromDate) return false;
        if (toDate && p.date > toDate) return false;
        if (selectedSupplierFilter) {
          return (
            p.supplierId === selectedSupplierFilter ||
            p.supplierName.toLowerCase() === selectedSupplierFilter.toLowerCase()
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.voucherNo.localeCompare(a.voucherNo));
  }, [payments, fromDate, toDate, selectedSupplierFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Entry &amp; Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="no-print">Record supplier payments in Cash or Bank; updates Supplier Ledger and Cash/Bank Book</span>
          </p>
        </div>

        <div className="no-print flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (!editingId) {
                setVoucherNo(nextVoucherNumber('PMT'));
              }
              setTab('entry');
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'entry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {editingId ? 'Edit Payment Entry' : 'Payment Entry'}
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payment Register ({payments.length})
          </button>
        </div>
      </div>

      {tab === 'entry' ? (
        suppliers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-700">Add a supplier in Supplier Master first.</p>
            <button
              type="button"
              onClick={() => setActiveView('supplier-master')}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg cursor-pointer"
            >
              Open Supplier Master
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Voucher No</label>
                <input
                  type="text"
                  required
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Date (DD-MM-YYYY)
                </label>
                <TypeableDateField valueISO={date} onChangeISO={setDate} />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Paid To (Supplier)</label>
                  {selectedSupplierDue && (
                    <span className="text-xs text-slate-600 font-mono-num">
                      Payable: {formatCurrency(selectedSupplierDue.netBalance)} {selectedSupplierDue.balanceType}
                    </span>
                  )}
                </div>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as CashBankMode)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Cheque / UTR No
                </label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration</label>
                <input
                  type="text"
                  placeholder="Remarks"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                {editingId ? 'Update Payment' : 'Save Payment Entry'}
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="no-print p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:inline" />
                <select
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded-lg bg-white text-slate-900 cursor-pointer w-52 sm:w-60 truncate focus:outline-none focus:ring-2 focus:ring-teal-700"
                  aria-label="Select supplier"
                >
                  <option value="">All Suppliers (Show All)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {selectedSupplierFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedSupplierFilter('')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-1 shrink-0 cursor-pointer"
                    title="Clear selection"
                  >
                    Reset
                  </button>
                )}
              </div>
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setTab('entry');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Payment Entry
              </button>
              <button
                type="button"
                onClick={() =>
                  exportToExcel(
                    'Payment_Register.xlsx',
                    ['Date', 'Voucher No', 'Supplier', 'Mode', 'Reference', 'Amount', 'Narration'],
                    filteredPayments.map((p) => [
                      formatDate(p.date),
                      p.voucherNo,
                      p.supplierName,
                      p.mode,
                      p.referenceNo,
                      p.amount,
                      p.narration,
                    ]),
                    'Payment Register'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => void printCurrentPage('Register', 'landscape')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-600">
              <p>No payments recorded.</p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setTab('entry');
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Payment Entry
              </button>
            </div>
          ) : (
            <div className="print-table-wrap overflow-x-auto">
              <table className="register-print-table print-fit-table w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4">Mode · Reference</th>
                    <th className="py-3 px-4">Narration</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="no-print py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono-num text-slate-600 whitespace-nowrap">
                        {formatDate(p.date)}
                      </td>
                      <td className="py-2.5 px-4 font-mono-num font-semibold text-slate-900">
                        {p.voucherNo}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{p.supplierName}</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {p.mode}
                        {p.referenceNo ? ` · ${p.referenceNo}` : ''}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{p.narration || '—'}</td>
                      <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="no-print py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {confirmDeleteId === p.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                deletePayment(p.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[11px] font-semibold text-red-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
