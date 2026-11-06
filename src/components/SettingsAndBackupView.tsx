import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Save,
  Upload,
} from 'lucide-react';
import { StoredData, useAccounting } from '../context/AccountingContext';
import { CompanySettings } from '../types/accounting';
import { formatDate } from '../utils/formatters';
import { shareBackupFile } from '../utils/nativeBackup';
import { exportWorkbookFile } from '../utils/nativeActions';

// ============================================================================
// 1. INVOICE SETTINGS VIEW
// ============================================================================
export const InvoiceSettingsView: React.FC = () => {
  const { company, updateCompany, nextSalesInvoiceNo } = useAccounting();

  const [form, setForm] = useState<CompanySettings>({
    ...company,
    invoicePrefix: company.invoicePrefix ?? 'RC/26-27/',
    nextInvoiceNumber: company.nextInvoiceNumber ?? 1,
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setForm({
      ...company,
      invoicePrefix: company.invoicePrefix ?? 'RC/26-27/',
      nextInvoiceNumber: company.nextInvoiceNumber ?? 1,
    });
  }, [company]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany({
      ...form,
      openingCashBalance: Number(form.openingCashBalance) || 0,
      openingBankBalance: Number(form.openingBankBalance) || 0,
      invoicePrefix: form.invoicePrefix ?? 'RC/26-27/',
      nextInvoiceNumber: Math.max(1, Number(form.nextInvoiceNumber) || 1),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Invoice Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure invoice numbering, company &amp; sales bill header details, and bank information
        </p>
      </div>

      <form
        onSubmit={handleSaveSettings}
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Invoice Numbering</h2>
            <p className="text-xs text-slate-500">
              Adjust the prefix and starting/next number for automatic Sales Invoice generation.
            </p>
          </div>
          {savedNotice && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Invoice settings saved
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invoice Prefix
            </label>
            <input
              type="text"
              value={form.invoicePrefix ?? 'RC/26-27/'}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              placeholder="e.g. RC/26-27/"
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Next Invoice Number
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.nextInvoiceNumber ?? 1}
              onChange={(e) =>
                setForm({ ...form, nextInvoiceNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })
              }
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] font-medium text-slate-500">
                Current Next Invoice No.
              </div>
              <div className="text-sm font-bold font-mono-num text-teal-800">
                {nextSalesInvoiceNo()}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Company &amp; Bill Header Details</h2>
          <p className="text-xs text-slate-500 mb-4">
            These details appear on printed Sales Bills, Excel exports, and ledger statements.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Bill Header Name
              </label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone / Cell Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address Line 2 (City, State &amp; PIN)
              </label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State Name</label>
              <input
                type="text"
                value={form.stateName}
                onChange={(e) => setForm({ ...form, stateName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
              <input
                type="text"
                value={form.stateCode}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Bank Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={form.bankAccountNo}
                onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={form.bankIfsc}
                onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
              <input
                type="text"
                value={form.bankBranch}
                onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Invoice Settings
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// 2. BACKUP & RESTORE VIEW
// ============================================================================
export const BackupSettingsView: React.FC = () => {
  const {
    company,
    importBackupData,
    customers,
    suppliers,
    goods,
    purchases,
    sales,
    receipts,
    payments,
  } = useAccounting();

  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportAllExcel = async () => {
    const wb = XLSX.utils.book_new();

    const salesSheet = XLSX.utils.aoa_to_sheet([
      [
        'Invoice No',
        'Date',
        'Purchase Bill No',
        'Customer',
        'Goods',
        'Vehicle No',
        'Load Wt (Kg)',
        'Empty Wt (Kg)',
        'Net Wt (Kg)',
        'Rate / Ton',
        'Amount (₹)',
      ],
      ...sales.map((s) => [
        s.invoiceNo,
        formatDate(s.date),
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
    ]);
    XLSX.utils.book_append_sheet(wb, salesSheet, 'Sales');

    const purchasesSheet = XLSX.utils.aoa_to_sheet([
      [
        'Bill No',
        'Date',
        'Supplier',
        'Goods',
        'Vehicle No',
        'Load Wt (Kg)',
        'Empty Wt (Kg)',
        'Net Wt (Kg)',
        'Rate / Ton',
        'Amount (₹)',
      ],
      ...purchases.map((p) => [
        p.billNo,
        formatDate(p.date),
        p.supplierName,
        p.goodsName,
        p.vehicleNo,
        p.loadWeightKg,
        p.emptyWeightKg,
        p.netWeightKg,
        p.ratePerTon,
        p.amount,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, purchasesSheet, 'Purchases');

    const receiptsSheet = XLSX.utils.aoa_to_sheet([
      ['Voucher No', 'Date', 'Customer', 'Mode', 'Reference No', 'Amount (₹)', 'Narration'],
      ...receipts.map((r) => [
        r.voucherNo,
        formatDate(r.date),
        r.customerName,
        r.mode,
        r.referenceNo,
        r.amount,
        r.narration,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, receiptsSheet, 'Receipts');

    const paymentsSheet = XLSX.utils.aoa_to_sheet([
      ['Voucher No', 'Date', 'Supplier', 'Mode', 'Reference No', 'Amount (₹)', 'Narration'],
      ...payments.map((p) => [
        p.voucherNo,
        formatDate(p.date),
        p.supplierName,
        p.mode,
        p.referenceNo,
        p.amount,
        p.narration,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Payments');

    const customersSheet = XLSX.utils.aoa_to_sheet([
      ['Customer Name', 'Mobile', 'GSTIN', 'Address', 'Opening Balance (Dr)'],
      ...customers.map((c) => [c.name, c.mobile, c.gstNumber, c.address, c.openingBalance]),
    ]);
    XLSX.utils.book_append_sheet(wb, customersSheet, 'Customers');

    const suppliersSheet = XLSX.utils.aoa_to_sheet([
      ['Supplier Name', 'Mobile', 'Address', 'Opening Balance (Cr)'],
      ...suppliers.map((s) => [s.name, s.mobile, s.address, s.openingBalance]),
    ]);
    XLSX.utils.book_append_sheet(wb, suppliersSheet, 'Suppliers');

    const goodsSheet = XLSX.utils.aoa_to_sheet([
      ['Goods / Item Name'],
      ...goods.map((g) => [g.name]),
    ]);
    XLSX.utils.book_append_sheet(wb, goodsSheet, 'Goods');

    const dateStr = new Date().toISOString().slice(0, 10);
    await exportWorkbookFile(wb, `Raghavendra_Co_All_Data_${dateStr}.xlsx`);
    setBackupNotice({
      type: 'success',
      text: 'Exported all registers and masters to Excel (.xlsx).',
    });
  };

  const handleDownloadBackup = async () => {
    const payload: StoredData & { exportedAt: string; formatVersion: number; appName: string } = {
      appName: 'Raghavendra & Co. Accounting',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      company,
      customers,
      suppliers,
      goods,
      purchases,
      sales,
      receipts,
      payments,
    };
    const backupText = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Raghavendra_Co_Backup_${dateStr}.json`;
    try {
      const sharedNatively = await shareBackupFile(filename, backupText);
      if (!sharedNatively) {
        const blob = new Blob([backupText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setBackupNotice({ type: 'success', text: 'Full accounting backup is ready. Save it somewhere safe or transfer it to another phone.' });
    } catch (error) {
      setBackupNotice({ type: 'error', text: 'Could not create or share the backup. Please try again.' });
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setBackupNotice(null);
    try {
      const backupText = await file.text();
      const parsed = JSON.parse(backupText);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.company ||
        typeof parsed.company !== 'object' ||
        !Array.isArray(parsed.customers) ||
        !Array.isArray(parsed.suppliers) ||
        !Array.isArray(parsed.goods) ||
        !Array.isArray(parsed.purchases) ||
        !Array.isArray(parsed.sales) ||
        !Array.isArray(parsed.receipts) ||
        !Array.isArray(parsed.payments)
      ) {
        throw new Error('Invalid backup file format. Select a valid Ragavendhara & Co. JSON backup.');
      }

      const confirmed = window.confirm(
        'Restoring this backup will REPLACE all accounting data currently on this phone. Create a backup of this phone first if you need to keep its current data. Continue?'
      );
      if (!confirmed) return;

      await importBackupData({
        company: parsed.company,
        customers: parsed.customers,
        suppliers: parsed.suppliers,
        goods: parsed.goods,
        purchases: parsed.purchases,
        sales: parsed.sales,
        receipts: parsed.receipts,
        payments: parsed.payments,
      });

      setBackupNotice({
        type: 'success',
        text: `Restore completed and saved on this phone (${parsed.sales.length} sales, ${parsed.purchases.length} purchases, ${parsed.customers.length} customers).`,
      });
    } catch (error) {
      setBackupNotice({
        type: 'error',
        text: error instanceof Error
          ? `Restore failed: ${error.message}`
          : 'Restore failed. Please select a valid JSON backup and try again.',
      });
    } finally {
      // Clear the selection so the same backup can be selected again if needed.
      input.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Backup &amp; Restore</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Export all accounting data to Excel, create a full backup, or restore it on this or another device
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        {backupNotice && (
          <div
            className={`px-4 py-2.5 rounded-lg text-xs font-medium border ${
              backupNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {backupNotice.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export All in Excel */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Export All in Excel</h3>
              <p className="text-xs text-slate-500 mt-1">
                Creates a multi-sheet Excel workbook (.xlsx) with Sales, Purchases, Receipts,
                Payments, Customers, Suppliers, and Goods.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportAllExcel}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export All (.xlsx)
            </button>
          </div>

          {/* Download JSON Backup */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Full JSON Backup</h3>
              <p className="text-xs text-slate-500 mt-1">
                Includes {purchases.length} purchases, {sales.length} sales, {receipts.length}{' '}
                receipts, {payments.length} payments, masters, and company settings. Transfer this file to another phone to restore the same data.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Backup (.json)
            </button>
          </div>

          {/* Restore Backup */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Restore from Backup</h3>
              <p className="text-xs text-slate-500 mt-1">
                Restore a backup from another phone. This replaces the accounting data currently stored on this phone.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Choose a JSON backup file
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                className="block w-full text-xs text-slate-700 file:mr-3 file:px-3.5 file:py-2 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold"
                aria-label="Select JSON accounting backup file"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
