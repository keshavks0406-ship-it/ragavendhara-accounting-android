/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import {
  PaymentEntryView,
  PurchaseEntryView,
  ReceiptEntryView,
  SalesEntryView,
} from './components/EntriesViews';
import {
  CashOrBankBookView,
  CustomerLedgerView,
  CustomerOutstandingView,
  SupplierLedgerView,
  SupplierOutstandingView,
} from './components/LedgersAndBooksViews';
import {
  GrossProfitStatementView,
  PurchaseSalesStatementView,
} from './components/StatementsViews';
import {
  CustomerMasterView,
  GoodsMasterView,
  SupplierMasterView,
} from './components/MastersViews';
import { SalesBillView } from './components/SalesBillView';
import { BackupSettingsView, InvoiceSettingsView } from './components/SettingsAndBackupView';

const ActiveWorkspace: React.FC = () => {
  const { activeView, setActiveView } = useAccounting();
  const [targetCustomerId, setTargetCustomerId] = useState<string | undefined>(undefined);
  const [targetSupplierId, setTargetSupplierId] = useState<string | undefined>(undefined);

  switch (activeView) {
    case 'dashboard':
      return <DashboardView />;
    case 'purchase-entry':
      return <PurchaseEntryView />;
    case 'sales-entry':
      return <SalesEntryView />;
    case 'receipt-entry':
      return <ReceiptEntryView />;
    case 'payment-entry':
      return <PaymentEntryView />;
    case 'customer-ledger':
      return <CustomerLedgerView key={targetCustomerId || 'default-cust'} initialPartyId={targetCustomerId} />;
    case 'supplier-ledger':
      return <SupplierLedgerView key={targetSupplierId || 'default-supp'} initialPartyId={targetSupplierId} />;
    case 'customer-outstanding':
      return (
        <CustomerOutstandingView
          onOpenLedger={(id) => {
            setTargetCustomerId(id);
            setActiveView('customer-ledger');
          }}
        />
      );
    case 'supplier-outstanding':
      return (
        <SupplierOutstandingView
          onOpenLedger={(id) => {
            setTargetSupplierId(id);
            setActiveView('supplier-ledger');
          }}
        />
      );
    case 'cash-book':
      return <CashOrBankBookView key="cash" mode="Cash" />;
    case 'bank-book':
      return <CashOrBankBookView key="bank" mode="Bank" />;
    case 'purchase-sales-statement':
      return <PurchaseSalesStatementView />;
    case 'gross-profit-statement':
      return <GrossProfitStatementView />;
    case 'customer-master':
      return <CustomerMasterView />;
    case 'supplier-master':
      return <SupplierMasterView />;
    case 'goods-master':
      return <GoodsMasterView />;
    case 'sales-bill':
      return <SalesBillView />;
    case 'invoice-settings':
      return <InvoiceSettingsView />;
    case 'backup-settings':
      return <BackupSettingsView />;
    default:
      return <DashboardView />;
  }
};

const ReadyApplication: React.FC = () => {
  const { isStorageReady } = useAccounting();
  if (!isStorageReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center space-y-3">
          <div className="mx-auto h-9 w-9 rounded-full border-4 border-teal-700 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold">Opening your accounting books…</p>
          <p className="text-xs text-slate-500">Your data stays on this device.</p>
        </div>
      </div>
    );
  }
  return (
    <Layout>
      <ActiveWorkspace />
    </Layout>
  );
};

export default function App() {
  return (
    <AccountingProvider>
      <ReadyApplication />
    </AccountingProvider>
  );
}
