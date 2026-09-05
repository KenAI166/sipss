import React, { useState, useEffect } from 'react';
import { getExpenses, saveExpense, deleteExpense } from '../utils/db';
import Sidebar from './Sidebar';
import Header from './Header';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
}

interface ExpensesProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'utilities',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const categories = [
    'utilities',
    'supplies',
    'maintenance',
    'rent',
    'salaries',
    'marketing',
    'other',
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const loadedExpenses = await getExpenses();
      setExpenses(loadedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddExpense = () => {
    setEditMode(false);
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: 'utilities',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setModalVisible(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditMode(true);
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      notes: expense.notes,
    });
    setModalVisible(true);
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        await loadExpenses();
        
        setModalType('success');
        setModalTitle('Success');
        setModalMessage('Expense deleted successfully');
        setModalVisible(true);
      } catch (error) {
        console.error('Error deleting expense:', error);
        setModalType('error');
        setModalTitle('Error');
        setModalMessage('Failed to delete expense');
        setModalVisible(true);
      }
    }
  };

  const handleSaveExpense = async () => {
    if (!formData.description || !formData.amount || !formData.date) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Please fill in all required fields');
      setModalVisible(true);
      return;
    }

    try {
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
        category: formData.category,
        date: formData.date,
        notes: formData.notes,
      };

      if (editMode && editingExpense) {
        await saveExpense({ ...expenseData, id: editingExpense.id });
      } else {
        await saveExpense(expenseData);
      }

      await loadExpenses();
      setModalVisible(false);
      
      setModalType('success');
      setModalTitle('Success');
      setModalMessage(editMode ? 'Expense updated successfully' : 'Expense added successfully');
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving expense:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to save expense');
      setModalVisible(true);
    }
  };

  const formatCurrency = (value: number) => {
    return '₱' + value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFilteredExpenses = () => {
    let filtered = [...expenses];
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }
    
    if (filterMonth !== 'all') {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        const [year, month] = filterMonth.split('-');
        return expenseDate.getFullYear() === parseInt(year) && 
               expenseDate.getMonth() === parseInt(month) - 1;
      });
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getMonthOptions = () => {
    const months = new Set(expenses.map(expense => {
      const date = new Date(expense.date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }));
    return Array.from(months).sort().reverse();
  };

  const getCategoryTotals = () => {
    const totals: { [key: string]: number } = {};
    filteredExpenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });
    return totals;
  };

  const categoryTotals = getCategoryTotals();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="expenses" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <Header title="Expenses" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddExpense}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Expense
              </button>
            </div>
          </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-black dark:text-white">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-receipt text-red-500 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {formatCurrency(
                    expenses
                      .filter(e => {
                        const date = new Date(e.date);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      })
                      .reduce((sum, e) => sum + e.amount, 0)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar text-blue-500 dark:text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Number of Expenses</p>
                <p className="text-2xl font-bold text-black dark:text-white">{filteredExpenses.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-list text-blue-500 dark:text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                {getMonthOptions().map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{expense.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white capitalize">{expense.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">{formatDate(expense.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black dark:text-white">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No expenses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(categoryTotals).map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-black dark:text-white capitalize">{category}</span>
                    </div>
                    <span className="text-sm font-medium text-black dark:text-white">{formatCurrency(total)}</span>
                  </div>
                ))}
                {Object.keys(categoryTotals).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>

      {/* Add/Edit Expense Modal */}
      {modalVisible && !modalTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {editMode ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Description *</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setModalVisible(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-black dark:text-white py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExpense}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                >
                  {editMode ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalVisible && modalTitle && (
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
            <p className="text-gray-600 dark:text-gray-400 mb-6">{modalMessage}</p>
            <button
              onClick={() => setModalVisible(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
