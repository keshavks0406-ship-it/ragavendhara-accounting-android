import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { Customer, GoodsItem, Supplier } from '../types/accounting';
import { formatCurrency } from '../utils/formatters';

// ============================================================================
// 1. CUSTOMER MASTER (Name, Address, Mobile Number, GST Number, Opening Balance)
// ============================================================================
export const CustomerMasterView: React.FC = () => {
  const { customers, saveCustomer, deleteCustomer } = useAccounting();

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
    setAddress('');
    setMobile('');
    setGstNumber('');
    setOpeningBalanceStr('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveCustomer({
      id: editingId,
      name: name.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      gstNumber: gstNumber.trim().toUpperCase(),
      openingBalance: parseFloat(openingBalanceStr) || 0,
    });
    resetForm();
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name);
    setAddress(c.address);
    setMobile(c.mobile);
    setGstNumber(c.gstNumber);
    setOpeningBalanceStr(String(c.openingBalance));
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Customer Master</h1>
      </div>

      {/* Customer Master Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 max-w-4xl space-y-5"
      >
        <h2 className="text-base font-bold text-slate-900">
          {editingId ? 'Edit Customer Record' : 'Add Customer'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
            <input
              type="text"
              required
              placeholder="Enter customer / party name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
            <input
              type="text"
              required
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              required
              placeholder="Enter full address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
            <input
              type="text"
              placeholder="Enter GSTIN"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Opening Balance (₹)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={openingBalanceStr}
              onChange={(e) => setOpeningBalanceStr(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            {editingId ? 'Update Customer' : 'Save'}
          </button>
        </div>
      </form>

      {/* Saved Records in Customer Master */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Saved Records ({customers.length})
          </h2>
        </div>

        {customers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No saved customer records yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4 w-16">Sl. No.</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">GST Number</th>
                  <th className="py-3 px-4 text-right">Opening Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-num text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-4 text-slate-700">{c.address || '—'}</td>
                    <td className="py-2.5 px-4 font-mono-num text-slate-700">{c.mobile || '—'}</td>
                    <td className="py-2.5 px-4 font-mono-num text-slate-700">
                      {c.gstNumber || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-slate-900">
                      {formatCurrency(c.openingBalance)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {confirmDeleteId === c.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              deleteCustomer(c.id);
                              setConfirmDeleteId(null);
                            }}
                            className="text-[11px] font-semibold text-red-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(c.id)}
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
    </div>
  );
};

// ============================================================================
// 2. SUPPLIER MASTER (Name, Address, Mobile Number, Opening Balance)
// ============================================================================
export const SupplierMasterView: React.FC = () => {
  const { suppliers, saveSupplier, deleteSupplier } = useAccounting();

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
    setAddress('');
    setMobile('');
    setOpeningBalanceStr('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveSupplier({
      id: editingId,
      name: name.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      openingBalance: parseFloat(openingBalanceStr) || 0,
    });
    resetForm();
  };

  const handleEdit = (s: Supplier) => {
    setEditingId(s.id);
    setName(s.name);
    setAddress(s.address);
    setMobile(s.mobile);
    setOpeningBalanceStr(String(s.openingBalance));
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Supplier Master</h1>
      </div>

      {/* Supplier Master Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 max-w-4xl space-y-5"
      >
        <h2 className="text-base font-bold text-slate-900">
          {editingId ? 'Edit Supplier Record' : 'Add Supplier'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
            <input
              type="text"
              required
              placeholder="Enter supplier name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
            <input
              type="text"
              required
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              required
              placeholder="Enter address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Opening Balance (₹)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={openingBalanceStr}
              onChange={(e) => setOpeningBalanceStr(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            {editingId ? 'Update Supplier' : 'Save'}
          </button>
        </div>
      </form>

      {/* Saved Records in Supplier Master */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Saved Records ({suppliers.length})
          </h2>
        </div>

        {suppliers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No saved supplier records yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4 w-16">Sl. No.</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4 text-right">Opening Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-num text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-4 text-slate-700">{s.address || '—'}</td>
                    <td className="py-2.5 px-4 font-mono-num text-slate-700">{s.mobile || '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono-num font-semibold text-slate-900">
                      {formatCurrency(s.openingBalance)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(s)}
                          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {confirmDeleteId === s.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              deleteSupplier(s.id);
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
    </div>
  );
};

// ============================================================================
// 3. GOODS MASTER (Only Item Name + Saved Records)
// ============================================================================
export const GoodsMasterView: React.FC = () => {
  const { goods, saveGoodsItem, deleteGoodsItem } = useAccounting();

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(undefined);
    setName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveGoodsItem({
      id: editingId,
      name: name.trim(),
    });
    resetForm();
  };

  const handleEdit = (g: GoodsItem) => {
    setEditingId(g.id);
    setName(g.name);
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Goods Master</h1>
      </div>

      {/* Goods Master Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-5"
      >
        <h2 className="text-base font-bold text-slate-900">
          {editingId ? 'Edit Goods Item' : 'Add Goods Item'}
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
          <input
            type="text"
            required
            placeholder="Enter item name (e.g. Yellow Maize)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            {editingId ? 'Update Item' : 'Save'}
          </button>
        </div>
      </form>

      {/* Saved Records in Goods Master */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-4xl">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Saved Records ({goods.length})
          </h2>
        </div>

        {goods.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No saved goods items yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4 w-20">Sl. No.</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goods.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-num text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{g.name}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(g)}
                          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {confirmDeleteId === g.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              deleteGoodsItem(g.id);
                              setConfirmDeleteId(null);
                            }}
                            className="text-[11px] font-semibold text-red-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(g.id)}
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
    </div>
  );
};
