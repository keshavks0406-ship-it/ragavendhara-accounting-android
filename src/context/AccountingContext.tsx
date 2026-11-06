import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BalanceType,
  CompanySettings,
  Customer,
  GoodsItem,
  LedgerRow,
  NavViewId,
  PaymentEntry,
  PurchaseEntry,
  ReceiptEntry,
  SalesEntry,
  StatementCombinedRow,
  Supplier,
} from '../types/accounting';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_GOODS,
  INITIAL_PAYMENTS,
  INITIAL_PURCHASES,
  INITIAL_RECEIPTS,
  INITIAL_SALES,
  INITIAL_SUPPLIERS,
} from '../data/seedData';
import { generateId } from '../utils/formatters';
import { loadAccountingData, saveAccountingData } from '../utils/accountingStorage';

const STORAGE_KEY = 'raghavendra_co_books_v2';

export interface StoredData {
  company: CompanySettings;
  customers: Customer[];
  suppliers: Supplier[];
  goods: GoodsItem[];
  purchases: PurchaseEntry[];
  sales: SalesEntry[];
  receipts: ReceiptEntry[];
  payments: PaymentEntry[];
}

export interface PartyOutstandingRow {
  id: string;
  name: string;
  address: string;
  mobile: string;
  gstNumber?: string;
  openingBalance: number;
  totalBilled: number;
  totalSettled: number;
  netBalance: number;
  balanceType: BalanceType;
}

interface AccountingContextValue {
  isStorageReady: boolean;
  activeView: NavViewId;
  setActiveView: (view: NavViewId) => void;
  selectedSalesBillId: string;
  setSelectedSalesBillId: (id: string) => void;
  openSalesBill: (billId?: string) => void;

  company: CompanySettings;
  updateCompany: (settings: CompanySettings) => void;
  importBackupData: (backup: StoredData) => Promise<void>;

  customers: Customer[];
  saveCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => Customer;
  deleteCustomer: (id: string) => void;

  suppliers: Supplier[];
  saveSupplier: (supplier: Omit<Supplier, 'id'> & { id?: string }) => Supplier;
  deleteSupplier: (id: string) => void;

  goods: GoodsItem[];
  saveGoodsItem: (item: Omit<GoodsItem, 'id'> & { id?: string }) => GoodsItem;
  deleteGoodsItem: (id: string) => void;

  purchases: PurchaseEntry[];
  savePurchase: (entry: Omit<PurchaseEntry, 'id'> & { id?: string }) => PurchaseEntry;
  deletePurchase: (id: string) => void;

  sales: SalesEntry[];
  saveSale: (entry: Omit<SalesEntry, 'id'> & { id?: string }) => SalesEntry;
  deleteSale: (id: string) => void;

  receipts: ReceiptEntry[];
  saveReceipt: (entry: Omit<ReceiptEntry, 'id'> & { id?: string }) => ReceiptEntry;
  deleteReceipt: (id: string) => void;

  payments: PaymentEntry[];
  savePayment: (entry: Omit<PaymentEntry, 'id'> & { id?: string }) => PaymentEntry;
  deletePayment: (id: string) => void;

  nextSalesInvoiceNo: () => string;
  nextVoucherNumber: (type: 'RCP' | 'PMT') => string;

  getCustomerLedger: (customerId: string, fromDate?: string, toDate?: string) => {
    openingBalance: number;
    openingType: BalanceType;
    rows: LedgerRow[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingType: BalanceType;
  };

  getSupplierLedger: (supplierId: string, fromDate?: string, toDate?: string) => {
    openingBalance: number;
    openingType: BalanceType;
    rows: LedgerRow[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingType: BalanceType;
  };

  customerOutstandings: PartyOutstandingRow[];
  supplierOutstandings: PartyOutstandingRow[];

  getCashBook: (fromDate?: string, toDate?: string) => {
    openingBalance: number;
    openingType: BalanceType;
    rows: LedgerRow[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingType: BalanceType;
  };

  getBankBook: (fromDate?: string, toDate?: string) => {
    openingBalance: number;
    openingType: BalanceType;
    rows: LedgerRow[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingType: BalanceType;
  };

  getStatementRows: (fromDate?: string, toDate?: string) => StatementCombinedRow[];
}

const AccountingContext = createContext<AccountingContextValue | null>(null);

function loadInitialState(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredData>;
      if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.purchases)) {
        const company =
          !parsed.company || parsed.company.addressLine1?.includes('APMC')
            ? INITIAL_COMPANY_SETTINGS
            : parsed.company;
        return {
          company,
          customers: parsed.customers ?? INITIAL_CUSTOMERS,
          suppliers: parsed.suppliers ?? INITIAL_SUPPLIERS,
          goods: parsed.goods ?? INITIAL_GOODS,
          purchases: parsed.purchases ?? INITIAL_PURCHASES,
          sales: parsed.sales ?? INITIAL_SALES,
          receipts: parsed.receipts ?? INITIAL_RECEIPTS,
          payments: parsed.payments ?? INITIAL_PAYMENTS,
        };
      }
    }
  } catch {
    // Fallback to initial seed data
  }

  return {
    company: INITIAL_COMPANY_SETTINGS,
    customers: INITIAL_CUSTOMERS,
    suppliers: INITIAL_SUPPLIERS,
    goods: INITIAL_GOODS,
    purchases: INITIAL_PURCHASES,
    sales: INITIAL_SALES,
    receipts: INITIAL_RECEIPTS,
    payments: INITIAL_PAYMENTS,
  };
}

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<StoredData>(() => loadInitialState());
  const [storageReady, setStorageReady] = useState(false);
  const [activeView, setActiveView] = useState<NavViewId>('dashboard');
  const [selectedSalesBillId, setSelectedSalesBillId] = useState<string>(() => {
    const init = loadInitialState();
    return init.sales[0]?.id ?? '';
  });

  useEffect(() => {
    let active = true;
    loadAccountingData()
      .then((saved) => {
        if (active && saved) setData(saved);
      })
      .catch((error) => {
        console.error('Could not initialize accounting storage:', error);
      })
      .finally(() => {
        if (active) setStorageReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveAccountingData(data).catch((error) => {
      console.error('Could not save accounting data:', error);
    });
  }, [data, storageReady]);

  const openSalesBill = (billId?: string) => {
    if (billId) {
      setSelectedSalesBillId(billId);
    } else if (!selectedSalesBillId && data.sales.length > 0) {
      setSelectedSalesBillId(data.sales[data.sales.length - 1].id);
    }
    setActiveView('sales-bill');
  };

  const updateCompany = (company: CompanySettings) => {
    setData((prev) => ({ ...prev, company }));
  };

  const importBackupData = async (backup: StoredData): Promise<void> => {
    // Persist the complete restored dataset first. Only update the UI after
    // SQLite/localStorage confirms the write, so success is never reported early.
    await saveAccountingData(backup);
    setData(backup);
  };

  const saveCustomer = (customerInput: Omit<Customer, 'id'> & { id?: string }): Customer => {
    const saved: Customer = {
      ...customerInput,
      id: customerInput.id || generateId('cust'),
    };
    setData((prev) => {
      const exists = prev.customers.some((c) => c.id === saved.id);
      const customers = exists
        ? prev.customers.map((c) => (c.id === saved.id ? saved : c))
        : [...prev.customers, saved];
      const sales = prev.sales.map((s) =>
        s.customerId === saved.id ? { ...s, customerName: saved.name } : s
      );
      const receipts = prev.receipts.map((r) =>
        r.customerId === saved.id ? { ...r, customerName: saved.name } : r
      );
      return { ...prev, customers, sales, receipts };
    });
    return saved;
  };

  const deleteCustomer = (id: string) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  const saveSupplier = (supplierInput: Omit<Supplier, 'id'> & { id?: string }): Supplier => {
    const saved: Supplier = {
      ...supplierInput,
      id: supplierInput.id || generateId('supp'),
    };
    setData((prev) => {
      const exists = prev.suppliers.some((s) => s.id === saved.id);
      const suppliers = exists
        ? prev.suppliers.map((s) => (s.id === saved.id ? saved : s))
        : [...prev.suppliers, saved];
      const purchases = prev.purchases.map((p) =>
        p.supplierId === saved.id ? { ...p, supplierName: saved.name } : p
      );
      const payments = prev.payments.map((p) =>
        p.supplierId === saved.id ? { ...p, supplierName: saved.name } : p
      );
      return { ...prev, suppliers, purchases, payments };
    });
    return saved;
  };

  const deleteSupplier = (id: string) => {
    setData((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => s.id !== id),
    }));
  };

  const saveGoodsItem = (itemInput: Omit<GoodsItem, 'id'> & { id?: string }): GoodsItem => {
    const saved: GoodsItem = {
      ...itemInput,
      id: itemInput.id || generateId('item'),
    };
    setData((prev) => {
      const exists = prev.goods.some((g) => g.id === saved.id);
      const goods = exists
        ? prev.goods.map((g) => (g.id === saved.id ? saved : g))
        : [...prev.goods, saved];
      const purchases = prev.purchases.map((p) =>
        p.goodsId === saved.id ? { ...p, goodsName: saved.name } : p
      );
      const sales = prev.sales.map((s) =>
        s.goodsId === saved.id ? { ...s, goodsName: saved.name } : s
      );
      return { ...prev, goods, purchases, sales };
    });
    return saved;
  };

  const deleteGoodsItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      goods: prev.goods.filter((g) => g.id !== id),
    }));
  };

  const savePurchase = (entryInput: Omit<PurchaseEntry, 'id'> & { id?: string }): PurchaseEntry => {
    const saved: PurchaseEntry = {
      ...entryInput,
      id: entryInput.id || generateId('pur'),
    };
    setData((prev) => {
      const exists = prev.purchases.some((p) => p.id === saved.id);
      const purchases = exists
        ? prev.purchases.map((p) => (p.id === saved.id ? saved : p))
        : [...prev.purchases, saved];

      // Sync any linked sales entry if this purchase bill was edited
      const sales = prev.sales.map((s) => {
        if (s.purchaseId !== saved.id) return s;
        const recomputedSalesAmt =
          Math.round(((saved.netWeightKg / 1000) * s.ratePerTon + Number.EPSILON) * 100) / 100;
        return {
          ...s,
          purchaseBillNo: saved.billNo,
          date: saved.date,
          goodsId: saved.goodsId,
          goodsName: saved.goodsName,
          vehicleNo: saved.vehicleNo,
          loadWeightKg: saved.loadWeightKg,
          emptyWeightKg: saved.emptyWeightKg,
          netWeightKg: saved.netWeightKg,
          amount: recomputedSalesAmt,
        };
      });

      return { ...prev, purchases, sales };
    });
    return saved;
  };

  const deletePurchase = (id: string) => {
    setData((prev) => ({
      ...prev,
      purchases: prev.purchases.filter((p) => p.id !== id),
    }));
  };

  const saveSale = (entryInput: Omit<SalesEntry, 'id'> & { id?: string }): SalesEntry => {
    const saved: SalesEntry = {
      ...entryInput,
      id: entryInput.id || generateId('sal'),
    };
    setData((prev) => {
      const exists = prev.sales.some((s) => s.id === saved.id);
      const sales = exists
        ? prev.sales.map((s) => (s.id === saved.id ? saved : s))
        : [...prev.sales, saved];
      return { ...prev, sales };
    });
    setSelectedSalesBillId(saved.id);
    return saved;
  };

  const deleteSale = (id: string) => {
    setData((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== id),
    }));
  };

  const saveReceipt = (entryInput: Omit<ReceiptEntry, 'id'> & { id?: string }): ReceiptEntry => {
    const saved: ReceiptEntry = {
      ...entryInput,
      id: entryInput.id || generateId('rcp'),
    };
    setData((prev) => {
      const exists = prev.receipts.some((r) => r.id === saved.id);
      const receipts = exists
        ? prev.receipts.map((r) => (r.id === saved.id ? saved : r))
        : [...prev.receipts, saved];
      return { ...prev, receipts };
    });
    return saved;
  };

  const deleteReceipt = (id: string) => {
    setData((prev) => ({
      ...prev,
      receipts: prev.receipts.filter((r) => r.id !== id),
    }));
  };

  const savePayment = (entryInput: Omit<PaymentEntry, 'id'> & { id?: string }): PaymentEntry => {
    const saved: PaymentEntry = {
      ...entryInput,
      id: entryInput.id || generateId('pmt'),
    };
    setData((prev) => {
      const exists = prev.payments.some((p) => p.id === saved.id);
      const payments = exists
        ? prev.payments.map((p) => (p.id === saved.id ? saved : p))
        : [...prev.payments, saved];
      return { ...prev, payments };
    });
    return saved;
  };

  const deletePayment = (id: string) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
  };

  const nextSalesInvoiceNo = (): string => {
    const prefix = data.company.invoicePrefix ?? 'RC/26-27/';
    let maxNum = 0;
    data.sales.forEach((s) => {
      const m = /(\d+)$/.exec(s.invoiceNo);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    const configuredNext = Number(data.company.nextInvoiceNumber) || 1;
    const nextNum = Math.max(maxNum + 1, configuredNext);
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  };

  const nextVoucherNumber = (type: 'RCP' | 'PMT'): string => {
    const list = type === 'RCP' ? data.receipts : data.payments;
    let maxNum = 0;
    list.forEach((item) => {
      const m = /(\d+)$/.exec(item.voucherNo);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    return `${type}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Customer Ledger (Dr positive receivable, Cr negative advance)
  const getCustomerLedger = (customerId: string, fromDate?: string, toDate?: string) => {
    const customer = data.customers.find((c) => c.id === customerId);
    let baseSignedDr = customer ? customer.openingBalance : 0;

    interface RawEvent {
      id: string;
      date: string;
      voucherNo: string;
      particulars: string;
      voucherType: string;
      debit: number;
      credit: number;
    }

    const events: RawEvent[] = [];

    data.sales
      .filter((s) => s.customerId === customerId)
      .forEach((s) => {
        events.push({
          id: `sal_${s.id}`,
          date: s.date,
          voucherNo: s.invoiceNo,
          particulars: `To Sales A/c — ${s.goodsName} · Veh: ${s.vehicleNo} · Net: ${s.netWeightKg} KG`,
          voucherType: 'Sales',
          debit: s.amount,
          credit: 0,
        });
      });

    data.receipts
      .filter((r) => r.customerId === customerId)
      .forEach((r) => {
        events.push({
          id: `rcp_${r.id}`,
          date: r.date,
          voucherNo: r.voucherNo,
          particulars: `By ${r.mode} A/c${r.referenceNo ? ` · Ref: ${r.referenceNo}` : ''}${
            r.narration ? ` (${r.narration})` : ''
          }`,
          voucherType: 'Receipt',
          debit: 0,
          credit: r.amount,
        });
      });

    events.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    const filteredEvents: RawEvent[] = [];
    for (const ev of events) {
      if (fromDate && ev.date < fromDate) {
        baseSignedDr += ev.debit - ev.credit;
      } else if (toDate && ev.date > toDate) {
        // Skip events after toDate
      } else {
        filteredEvents.push(ev);
      }
    }

    const openingBalance = Math.abs(baseSignedDr);
    const openingType: BalanceType = baseSignedDr >= 0 ? 'Dr' : 'Cr';

    let runningDr = baseSignedDr;
    let totalDebit = 0;
    let totalCredit = 0;

    const rows: LedgerRow[] = filteredEvents.map((ev) => {
      runningDr += ev.debit - ev.credit;
      totalDebit += ev.debit;
      totalCredit += ev.credit;
      return {
        ...ev,
        runningBalance: Math.abs(runningDr),
        runningBalanceType: runningDr >= 0 ? 'Dr' : 'Cr',
      };
    });

    return {
      openingBalance,
      openingType,
      rows,
      totalDebit,
      totalCredit,
      closingBalance: Math.abs(runningDr),
      closingType: (runningDr >= 0 ? 'Dr' : 'Cr') as BalanceType,
    };
  };

  // Supplier Ledger (Cr positive payable, Dr negative advance)
  const getSupplierLedger = (supplierId: string, fromDate?: string, toDate?: string) => {
    const supplier = data.suppliers.find((s) => s.id === supplierId);
    let baseSignedCr = supplier ? supplier.openingBalance : 0;

    interface RawEvent {
      id: string;
      date: string;
      voucherNo: string;
      particulars: string;
      voucherType: string;
      debit: number;
      credit: number;
    }

    const events: RawEvent[] = [];

    data.purchases
      .filter((p) => p.supplierId === supplierId)
      .forEach((p) => {
        events.push({
          id: `pur_${p.id}`,
          date: p.date,
          voucherNo: p.billNo,
          particulars: `By Purchase A/c — ${p.goodsName} · Veh: ${p.vehicleNo} · Net: ${p.netWeightKg} KG`,
          voucherType: 'Purchase',
          debit: 0,
          credit: p.amount,
        });
      });

    data.payments
      .filter((p) => p.supplierId === supplierId)
      .forEach((p) => {
        events.push({
          id: `pmt_${p.id}`,
          date: p.date,
          voucherNo: p.voucherNo,
          particulars: `To ${p.mode} A/c${p.referenceNo ? ` · Ref: ${p.referenceNo}` : ''}${
            p.narration ? ` (${p.narration})` : ''
          }`,
          voucherType: 'Payment',
          debit: p.amount,
          credit: 0,
        });
      });

    events.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    const filteredEvents: RawEvent[] = [];
    for (const ev of events) {
      if (fromDate && ev.date < fromDate) {
        baseSignedCr += ev.credit - ev.debit;
      } else if (toDate && ev.date > toDate) {
        // Skip events after toDate
      } else {
        filteredEvents.push(ev);
      }
    }

    const openingBalance = Math.abs(baseSignedCr);
    const openingType: BalanceType = baseSignedCr >= 0 ? 'Cr' : 'Dr';

    let runningCr = baseSignedCr;
    let totalDebit = 0;
    let totalCredit = 0;

    const rows: LedgerRow[] = filteredEvents.map((ev) => {
      runningCr += ev.credit - ev.debit;
      totalDebit += ev.debit;
      totalCredit += ev.credit;
      return {
        ...ev,
        runningBalance: Math.abs(runningCr),
        runningBalanceType: runningCr >= 0 ? 'Cr' : 'Dr',
      };
    });

    return {
      openingBalance,
      openingType,
      rows,
      totalDebit,
      totalCredit,
      closingBalance: Math.abs(runningCr),
      closingType: (runningCr >= 0 ? 'Cr' : 'Dr') as BalanceType,
    };
  };

  const customerOutstandings = useMemo<PartyOutstandingRow[]>(() => {
    return data.customers.map((c) => {
      const ledger = getCustomerLedger(c.id);
      return {
        id: c.id,
        name: c.name,
        address: c.address,
        mobile: c.mobile,
        gstNumber: c.gstNumber,
        openingBalance: c.openingBalance,
        totalBilled: ledger.totalDebit,
        totalSettled: ledger.totalCredit,
        netBalance: ledger.closingBalance,
        balanceType: ledger.closingType,
      };
    });
  }, [data.customers, data.sales, data.receipts]);

  const supplierOutstandings = useMemo<PartyOutstandingRow[]>(() => {
    return data.suppliers.map((s) => {
      const ledger = getSupplierLedger(s.id);
      return {
        id: s.id,
        name: s.name,
        address: s.address,
        mobile: s.mobile,
        openingBalance: s.openingBalance,
        totalBilled: ledger.totalCredit,
        totalSettled: ledger.totalDebit,
        netBalance: ledger.closingBalance,
        balanceType: ledger.closingType,
      };
    });
  }, [data.suppliers, data.purchases, data.payments]);

  const buildBook = (bookMode: 'Cash' | 'Bank', openingAmt: number, fromDate?: string, toDate?: string) => {
    let baseSignedDr = openingAmt;

    interface RawEvent {
      id: string;
      date: string;
      voucherNo: string;
      particulars: string;
      voucherType: string;
      debit: number;
      credit: number;
    }

    const events: RawEvent[] = [];

    data.receipts
      .filter((r) => r.mode === bookMode)
      .forEach((r) => {
        events.push({
          id: `rcp_${r.id}`,
          date: r.date,
          voucherNo: r.voucherNo,
          particulars: `To ${r.customerName}${r.referenceNo ? ` (${r.referenceNo})` : ''}`,
          voucherType: 'Receipt',
          debit: r.amount,
          credit: 0,
        });
      });

    data.payments
      .filter((p) => p.mode === bookMode)
      .forEach((p) => {
        events.push({
          id: `pmt_${p.id}`,
          date: p.date,
          voucherNo: p.voucherNo,
          particulars: `By ${p.supplierName}${p.referenceNo ? ` (${p.referenceNo})` : ''}`,
          voucherType: 'Payment',
          debit: 0,
          credit: p.amount,
        });
      });

    events.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    const filtered: RawEvent[] = [];
    for (const ev of events) {
      if (fromDate && ev.date < fromDate) {
        baseSignedDr += ev.debit - ev.credit;
      } else if (toDate && ev.date > toDate) {
        // Skip after toDate
      } else {
        filtered.push(ev);
      }
    }

    let runningDr = baseSignedDr;
    let totalDebit = 0;
    let totalCredit = 0;

    const rows: LedgerRow[] = filtered.map((ev) => {
      runningDr += ev.debit - ev.credit;
      totalDebit += ev.debit;
      totalCredit += ev.credit;
      return {
        ...ev,
        runningBalance: Math.abs(runningDr),
        runningBalanceType: runningDr >= 0 ? 'Dr' : 'Cr',
      };
    });

    return {
      openingBalance: Math.abs(baseSignedDr),
      openingType: (baseSignedDr >= 0 ? 'Dr' : 'Cr') as BalanceType,
      rows,
      totalDebit,
      totalCredit,
      closingBalance: Math.abs(runningDr),
      closingType: (runningDr >= 0 ? 'Dr' : 'Cr') as BalanceType,
    };
  };

  const getCashBook = (fromDate?: string, toDate?: string) =>
    buildBook('Cash', data.company.openingCashBalance, fromDate, toDate);

  const getBankBook = (fromDate?: string, toDate?: string) =>
    buildBook('Bank', data.company.openingBankBalance, fromDate, toDate);

  const getStatementRows = (fromDate?: string, toDate?: string): StatementCombinedRow[] => {
    const filteredPurchases = data.purchases
      .filter((p) => (!fromDate || p.date >= fromDate) && (!toDate || p.date <= toDate))
      .sort((a, b) => a.date.localeCompare(b.date) || a.billNo.localeCompare(b.billNo));

    const rows: StatementCombinedRow[] = [];

    filteredPurchases.forEach((p) => {
      const linkedSales = data.sales.filter((s) => s.purchaseId === p.id);
      if (linkedSales.length === 0) {
        rows.push({
          purchaseId: p.id,
          date: p.date,
          purchaseBillNo: p.billNo,
          supplierName: p.supplierName,
          vehicleNo: p.vehicleNo,
          loadWeightKg: p.loadWeightKg,
          emptyWeightKg: p.emptyWeightKg,
          netWeightKg: p.netWeightKg,
          purchaseRatePerTon: p.ratePerTon,
          purchaseAmount: p.amount,
          customerName: '—',
          salesInvoiceNo: '—',
          salesRatePerTon: null,
          salesAmount: 0,
          goodsName: p.goodsName,
          grossProfit: 0 - p.amount,
          hasSale: false,
        });
      } else {
        linkedSales.forEach((sal) => {
          rows.push({
            purchaseId: p.id,
            date: p.date,
            purchaseBillNo: p.billNo,
            supplierName: p.supplierName,
            vehicleNo: p.vehicleNo,
            loadWeightKg: p.loadWeightKg,
            emptyWeightKg: p.emptyWeightKg,
            netWeightKg: p.netWeightKg,
            purchaseRatePerTon: p.ratePerTon,
            purchaseAmount: p.amount,
            customerName: sal.customerName,
            salesInvoiceNo: sal.invoiceNo,
            salesRatePerTon: sal.ratePerTon,
            salesAmount: sal.amount,
            goodsName: p.goodsName,
            grossProfit: sal.amount - p.amount,
            hasSale: true,
          });
        });
      }
    });

    return rows;
  };

  return (
    <AccountingContext.Provider
      value={{
        isStorageReady: storageReady,
        activeView,
        setActiveView,
        selectedSalesBillId,
        setSelectedSalesBillId,
        openSalesBill,
        company: data.company,
        updateCompany,
        importBackupData,
        customers: data.customers,
        saveCustomer,
        deleteCustomer,
        suppliers: data.suppliers,
        saveSupplier,
        deleteSupplier,
        goods: data.goods,
        saveGoodsItem,
        deleteGoodsItem,
        purchases: data.purchases,
        savePurchase,
        deletePurchase,
        sales: data.sales,
        saveSale,
        deleteSale,
        receipts: data.receipts,
        saveReceipt,
        deleteReceipt,
        payments: data.payments,
        savePayment,
        deletePayment,
        nextSalesInvoiceNo,
        nextVoucherNumber,
        getCustomerLedger,
        getSupplierLedger,
        customerOutstandings,
        supplierOutstandings,
        getCashBook,
        getBankBook,
        getStatementRows,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export function useAccounting() {
  const ctx = useContext(AccountingContext);
  if (!ctx) {
    throw new Error('useAccounting must be used inside AccountingProvider');
  }
  return ctx;
}
