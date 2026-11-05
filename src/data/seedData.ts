import {
  CompanySettings,
  Customer,
  GoodsItem,
  PaymentEntry,
  PurchaseEntry,
  ReceiptEntry,
  SalesEntry,
  Supplier,
} from '../types/accounting';

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'RAGAVENDHARA & CO',
  tagline: 'Merchants & Commission Agents',
  addressLine1: '2,KNS GARDEN 1st STREET,PARAPALAYAM',
  addressLine2: 'MANGALAM ROAD, TIRUPUR-641604',
  phone: '9842218444',
  email: '',
  gstin: '33AQOPS0743E1ZV',
  stateName: 'Tamil Nadu',
  stateCode: '33',
  bankName: 'State Bank of India',
  bankAccountNo: '30948271654',
  bankIfsc: 'SBIN0004128',
  bankBranch: 'Tirupur',
  openingCashBalance: 0,
  openingBankBalance: 0,
  financialYearStart: '2026-04-01',
};

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_GOODS: GoodsItem[] = [];

export const INITIAL_PURCHASES: PurchaseEntry[] = [];

export const INITIAL_SALES: SalesEntry[] = [];

export const INITIAL_RECEIPTS: ReceiptEntry[] = [];

export const INITIAL_PAYMENTS: PaymentEntry[] = [];
