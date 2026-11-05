export type NavViewId =
  | 'dashboard'
  | 'purchase-entry'
  | 'sales-entry'
  | 'receipt-entry'
  | 'payment-entry'
  | 'customer-ledger'
  | 'supplier-ledger'
  | 'customer-outstanding'
  | 'supplier-outstanding'
  | 'cash-book'
  | 'bank-book'
  | 'purchase-sales-statement'
  | 'gross-profit-statement'
  | 'customer-master'
  | 'supplier-master'
  | 'goods-master'
  | 'sales-bill'
  | 'invoice-settings'
  | 'backup-settings';

export type BalanceType = 'Dr' | 'Cr';
export type CashBankMode = 'Cash' | 'Bank';

export interface CompanySettings {
  companyName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  openingCashBalance: number;
  openingBankBalance: number;
  financialYearStart: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  mobile: string;
  gstNumber: string;
  openingBalance: number;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  mobile: string;
  openingBalance: number;
}

export interface GoodsItem {
  id: string;
  name: string;
}

export interface PurchaseEntry {
  id: string;
  date: string; // YYYY-MM-DD normalized
  billNo: string;
  supplierId: string;
  supplierName: string;
  goodsId: string;
  goodsName: string;
  vehicleNo: string;
  loadWeightKg: number;
  emptyWeightKg: number;
  netWeightKg: number; // loadWeightKg - emptyWeightKg
  ratePerTon: number;
  amount: number; // (netWeightKg / 1000) * ratePerTon
}

export interface SalesEntry {
  id: string;
  invoiceNo: string; // Automatic
  purchaseId: string;
  purchaseBillNo: string;
  date: string; // Same as purchase date
  customerId: string;
  customerName: string;
  goodsId: string;
  goodsName: string;
  vehicleNo: string;
  loadWeightKg: number;
  emptyWeightKg: number;
  netWeightKg: number;
  ratePerTon: number;
  amount: number; // (netWeightKg / 1000) * ratePerTon
}

export interface ReceiptEntry {
  id: string;
  voucherNo: string;
  date: string;
  customerId: string;
  customerName: string;
  mode: CashBankMode;
  referenceNo: string;
  amount: number;
  narration: string;
}

export interface PaymentEntry {
  id: string;
  voucherNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  mode: CashBankMode;
  referenceNo: string;
  amount: number;
  narration: string;
}

export interface LedgerRow {
  id: string;
  date: string;
  voucherNo: string;
  particulars: string;
  voucherType: string;
  debit: number;
  credit: number;
  runningBalance: number;
  runningBalanceType: BalanceType;
}

export interface StatementCombinedRow {
  purchaseId: string;
  date: string;
  purchaseBillNo: string;
  supplierName: string;
  vehicleNo: string;
  loadWeightKg: number;
  emptyWeightKg: number;
  netWeightKg: number;
  purchaseRatePerTon: number;
  purchaseAmount: number;
  customerName: string;
  salesInvoiceNo: string;
  salesRatePerTon: number | null;
  salesAmount: number;
  goodsName: string;
  grossProfit: number; // salesAmount - purchaseAmount
  hasSale: boolean;
}
