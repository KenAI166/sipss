import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useSidebarOpen } from '../hooks/useSidebarOpen';
import { getSales, getDeletedSales, deleteSale, restoreSale, onSynced } from '../utils/db';
import Sidebar from './Sidebar';
import Header from './Header';

interface Sale {
  id: number;
  receipt_number: string;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  customer_name: string;
  notes: string;
  cashier_name: string;
  deleted_at?: string | null;
  created_at: string;
}

interface SalesProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Sales: React.FC<SalesProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [sales, setSales] = useState<Sale[]>([]);
  const [deletedSales, setDeletedSales] = useState<Sale[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const reload = () => { loadSales(); loadDeletedSales(); };
    reload();
    return onSynced(reload);
  }, []);

  useEffect(() => {
    const source = showDeleted ? deletedSales : sales;
    if (searchTerm) {
      const filtered = source.filter(sale =>
        (sale.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.cashier_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(source);
    }
  }, [searchTerm, sales, deletedSales, showDeleted]);

  const loadSales = async () => {
    try {
      const loadedSales = await getSales();
      setSales(loadedSales.filter(s => !s.deleted_at && s.receipt_number));
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const loadDeletedSales = async () => {
    try {
      const loadedDeletedSales = await getDeletedSales();
      setDeletedSales(loadedDeletedSales.filter(s => s.deleted_at && s.receipt_number));
    } catch (error) {
      console.error('Error loading deleted sales:', error);
    }
  };

  const handleDeleteSale = async (id: number) => {
    try {
      await deleteSale(id);
      await loadSales();
      await loadDeletedSales();

      setModalType('success');
      setModalTitle('Success');
      setModalMessage('Sale report deleted successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error deleting sale:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to delete sale report');
      setModalVisible(true);
    }
  };

  const handleRestoreSale = async (id: number) => {
    try {
      await restoreSale(id);
      await loadSales();
      await loadDeletedSales();

      setModalType('success');
      setModalTitle('Success');
      setModalMessage('Sale report restored successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error restoring sale:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to restore sale report');
      setModalVisible(true);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSales.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSales.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const action = showDeleted ? restoreSale : deleteSale;
    const label = showDeleted ? 'restored' : 'deleted';
    try {
      for (const id of ids) {
        await action(id);
      }
      await loadSales();
      await loadDeletedSales();
      setSelectedIds(new Set());
      setSelectMode(false);

      setModalType('success');
      setModalTitle('Success');
      setModalMessage(`${ids.length} sale report${ids.length > 1 ? 's' : ''} ${label} successfully`);
      setModalVisible(true);
    } catch (error) {
      console.error(`Error during bulk ${label}:`, error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(`Failed to ${showDeleted ? 'restore' : 'delete'} selected sale reports`);
      setModalVisible(true);
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  }).reduce((sum, sale) => sum + sale.total, 0);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatItemsForExport = (items: any[] | string | undefined) => {
    let parsed: any[] = [];
    if (Array.isArray(items)) {
      parsed = items;
    } else if (typeof items === 'string') {
      try { parsed = JSON.parse(items); } catch { parsed = []; }
    }
    return parsed.map((item: any) => `${item.name || 'Item'} x${item.quantity || 1}`).join('; ');
  };

  const getExportRows = (): Record<string, any>[] => {
    return filteredSales.map(sale => ({
      'Receipt Number': sale.receipt_number,
      'Date': formatDate(sale.created_at),
      'Customer': sale.customer_name || 'N/A',
      'Cashier': sale.cashier_name,
      'Payment Method': sale.payment_method,
      'Subtotal': sale.subtotal,
      'Tax': sale.tax,
      'Discount': sale.discount,
      'Total': sale.total,
      'Notes': sale.notes || '',
      'Items': formatItemsForExport(sale.items),
    }));
  };

  const handleExportCSV = () => {
    const rows = getExportRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escapeCSV = (value: any) => {
      const str = String(value ?? '');
      if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    const csv = [headers.join(','), ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${showDeleted ? 'deleted_sales' : 'sales'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const rows = getExportRows();
    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `${showDeleted ? 'deleted_sales' : 'sales'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSalePress = (sale: Sale) => {
    setModalType('info');
    setModalTitle(`Sale Details - ${sale.receipt_number}`);
    setModalMessage(
      `Items: ${sale.items.length}\n` +
      `Subtotal: ${formatCurrency(sale.subtotal)}\n` +
      `Tax: ${formatCurrency(sale.tax)}\n` +
      `Discount: ${formatCurrency(sale.discount)}\n` +
      `Total: ${formatCurrency(sale.total)}\n` +
      `Payment: ${sale.payment_method}\n` +
      `Customer: ${sale.customer_name || 'N/A'}\n` +
      `Cashier: ${sale.cashier_name}\n` +
      `Date: ${formatDate(sale.created_at)}`
    );
    setModalVisible(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="sales" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Header title="Sales & Reports" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-6 text-center">
              <i className="fas fa-cash text-4xl text-blue-500 dark:text-blue-400 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Sales</p>
              <p className="text-xl font-bold text-black dark:text-white">{formatCurrency(totalSales)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-6 text-center">
              <i className="fas fa-calendar text-4xl text-blue-500 dark:text-blue-400 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Today's Sales</p>
              <p className="text-xl font-bold text-black dark:text-white">{formatCurrency(todaySales)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-6 text-center">
              <i className="fas fa-receipt text-4xl text-yellow-500 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Orders</p>
              <p className="text-xl font-bold text-black dark:text-white">{sales.length}</p>
            </div>
          </div>

          {/* Search + view toggle */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
              <input
                type="text"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={toggleSelectMode}
              className={`px-4 py-2 rounded-lg transition ${selectMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-black dark:text-white'}`}
            >
              <i className={`fas ${selectMode ? 'fa-times' : 'fa-check-square'} mr-2`}></i>
              {selectMode ? 'Cancel' : 'Select'}
            </button>
            {selectMode && (
              <button
                onClick={handleBulkAction}
                disabled={selectedIds.size === 0}
                className={`px-4 py-2 rounded-lg transition text-white disabled:opacity-50 disabled:cursor-not-allowed ${showDeleted ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                <i className={`fas ${showDeleted ? 'fa-undo' : 'fa-trash'} mr-2`}></i>
                {showDeleted ? 'Restore Selected' : 'Delete Selected'}{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
            )}
            <button
              onClick={() => { setShowDeleted(!showDeleted); setSelectedIds(new Set()); }}
              className={`px-4 py-2 rounded-lg transition ${showDeleted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-black dark:text-white'}`}
            >
              <i className={`fas ${showDeleted ? 'fa-list' : 'fa-trash'} mr-2`}></i>
              {showDeleted ? 'Show Active' : `Show Deleted${deletedSales.length > 0 ? ` (${deletedSales.length})` : ''}`}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredSales.length === 0}
              className="px-4 py-2 rounded-lg transition text-white disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            >
              <i className="fas fa-file-csv mr-2"></i>CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredSales.length === 0}
              className="px-4 py-2 rounded-lg transition text-white disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700"
            >
              <i className="fas fa-file-excel mr-2"></i>Excel
            </button>
          </div>

          {/* Sales List */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-receipt text-gray-300 text-6xl mb-4"></i>
                <p className="text-gray-500 dark:text-gray-400">No sales found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {selectMode && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={filteredSales.length > 0 && selectedIds.size === filteredSales.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 accent-blue-500 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cashier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => selectMode ? toggleSelectOne(sale.id) : handleSalePress(sale)}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedIds.has(sale.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      {selectMode && (
                        <td className="px-4 py-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sale.id)}
                            onChange={() => toggleSelectOne(sale.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-white">{sale.receipt_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(sale.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(sale.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{sale.payment_method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sale.cashier_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sale.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!showDeleted ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSale(sale.id); }}
                            className="text-red-600 dark:text-red-400 hover:text-red-900"
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestoreSale(sale.id); }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                            title="Restore"
                          >
                            <i className="fas fa-undo"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              {modalType === 'success' && (
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-blue-500 dark:text-blue-400"></i>
                </div>
              )}
              {modalType === 'error' && (
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-times text-red-500"></i>
                </div>
              )}
              {modalType === 'info' && (
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-info text-blue-500 dark:text-blue-400"></i>
                </div>
              )}
              <h3 className="text-lg font-semibold text-black dark:text-white">{modalTitle}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line mb-6">{modalMessage}</p>
            <button
              onClick={() => setModalVisible(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
