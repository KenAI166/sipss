import React, { useState, useEffect } from 'react';
import { getSales } from '../utils/db';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = sales.filter(sale =>
        sale.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.cashier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [searchTerm, sales]);

  const loadSales = async () => {
    try {
      const loadedSales = await getSales();
      setSales(loadedSales);
      setFilteredSales(loadedSales);
    } catch (error) {
      console.error('Error loading sales:', error);
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
        <div className="p-8">
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

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
              <input
                type="text"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sales List */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-receipt text-gray-300 text-6xl mb-4"></i>
                <p className="text-gray-500 dark:text-gray-400">No sales found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cashier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => handleSalePress(sale)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-white">{sale.receipt_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(sale.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(sale.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{sale.payment_method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sale.cashier_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sale.customer_name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
