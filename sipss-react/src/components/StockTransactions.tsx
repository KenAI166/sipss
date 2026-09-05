import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { getStockTransactions, getIngredients, adjustIngredientStock } from '../utils/db';

interface Transaction {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  transaction_type: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_id: string;
  reference_type: string;
  reason: string;
  cost_per_unit: number;
  total_cost: number;
  notes: string;
  created_by: string;
  created_at: string;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  current_quantity: number;
  cost_per_unit: number;
}

interface StockTransactionsProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const StockTransactions: React.FC<StockTransactionsProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    ingredient_id: '',
    transaction_type: 'delivery',
    quantity: '',
    cost_per_unit: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadTransactions();
    loadIngredients();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await getStockTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading stock transactions:', error);
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const handleIngredientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ingredientId = e.target.value;
    const ingredient = ingredients.find(i => i.id.toString() === ingredientId);
    setFormData({
      ...formData,
      ingredient_id: ingredientId,
      cost_per_unit: ingredient ? (ingredient.cost_per_unit || 0).toString() : '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ingredient = ingredients.find(i => i.id.toString() === formData.ingredient_id);
      if (!ingredient) {
        alert('Please select an ingredient');
        return;
      }

      const quantity = parseFloat(formData.quantity);
      const transactionType = formData.transaction_type;

      // Convert to signed quantity
      let quantityChange = quantity;
      if (transactionType === 'sale' || transactionType === 'wastage' || transactionType === 'adjustment_down') {
        quantityChange = -quantity;
      }

      await adjustIngredientStock(
        ingredient.id,
        quantityChange,
        transactionType,
        null,
        'manual',
        formData.reason,
        user.full_name
      );

      await loadTransactions();
      await loadIngredients();
      setShowModal(false);
      setFormData({
        ingredient_id: '',
        transaction_type: 'delivery',
        quantity: '',
        cost_per_unit: '',
        reason: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      sale: 'Sale',
      delivery: 'Delivery',
      wastage: 'Wastage',
      adjustment_up: 'Stock Adjustment (+)',
      adjustment_down: 'Stock Adjustment (-)',
      return: 'Return',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    if (type === 'sale' || type === 'wastage' || type === 'adjustment_down') {
      return 'text-red-600';
    }
    if (type === 'delivery' || type === 'adjustment_up') {
      return 'text-green-600';
    }
    return 'text-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return `₱${(amount || 0).toFixed(2)}`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="stock-transactions" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <i className="fas fa-bars text-gray-700 text-xl"></i>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-black">Stock Transactions</h1>
                <p className="text-gray-600">Track all ingredient stock movements</p>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">
              <i className="fas fa-plus mr-2"></i>Record Transaction
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Date</th>
                    <th className="px-6 py-4 text-left font-medium">Ingredient</th>
                    <th className="px-6 py-4 text-left font-medium">Type</th>
                    <th className="px-6 py-4 text-left font-medium">Qty</th>
                    <th className="px-6 py-4 text-left font-medium">Before</th>
                    <th className="px-6 py-4 text-left font-medium">After</th>
                    <th className="px-6 py-4 text-left font-medium">Total Cost</th>
                    <th className="px-6 py-4 text-left font-medium">Reason</th>
                    <th className="px-6 py-4 text-left font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        No stock transactions yet. Click "Record Transaction" to add one.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(transaction => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-black">{transaction.ingredient_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{transaction.quantity_before}</td>
                        <td className="px-6 py-4 text-gray-600">{transaction.quantity_after}</td>
                        <td className="px-6 py-4 text-gray-600">{formatCurrency(transaction.total_cost || 0)}</td>
                        <td className="px-6 py-4 text-gray-600">{transaction.reason || '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{transaction.created_by || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Record Stock Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Ingredient *</label>
                  <select
                    value={formData.ingredient_id}
                    onChange={handleIngredientChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map(ingredient => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.current_quantity.toFixed(2)} {ingredient.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Transaction Type *</label>
                  <select
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="delivery">Delivery / Purchase</option>
                    <option value="wastage">Wastage / Spoilage</option>
                    <option value="adjustment_up">Stock Adjustment (+)</option>
                    <option value="adjustment_down">Stock Adjustment (-)</option>
                    <option value="return">Return to Supplier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Cost per Unit (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for deliveries to update ingredient cost</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Reason</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. Weekly delivery, expired milk"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransactions;