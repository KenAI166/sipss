import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getIngredients, saveIngredient, deleteIngredient, getSuppliers } from '../utils/db';

interface Ingredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  reorder_quantity: number;
  cost_per_unit: number;
  supplier_id: number | null;
  expiry_date: string | null;
  notes: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface IngredientsProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Ingredients: React.FC<IngredientsProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    unit: 'pcs',
    current_quantity: '',
    minimum_quantity: '10',
    reorder_quantity: '',
    cost_per_unit: '',
    supplier_id: '',
    expiry_date: '',
    notes: '',
  });

  useEffect(() => {
    loadIngredients();
    loadSuppliers();
  }, []);

  const loadIngredients = async () => {
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleAdd = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      category: 'general',
      unit: 'pcs',
      current_quantity: '',
      minimum_quantity: '10',
      reorder_quantity: '',
      cost_per_unit: '',
      supplier_id: '',
      expiry_date: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category || 'general',
      unit: ingredient.unit || 'pcs',
      current_quantity: ingredient.current_quantity.toString(),
      minimum_quantity: ingredient.minimum_quantity.toString(),
      reorder_quantity: ingredient.reorder_quantity?.toString() || '',
      cost_per_unit: ingredient.cost_per_unit?.toString() || '',
      supplier_id: ingredient.supplier_id?.toString() || '',
      expiry_date: ingredient.expiry_date || '',
      notes: ingredient.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await deleteIngredient(id);
        await loadIngredients();
      } catch (error) {
        console.error('Error deleting ingredient:', error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ingredient = {
        id: editingIngredient?.id || 0,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        current_quantity: parseFloat(formData.current_quantity) || 0,
        minimum_quantity: parseFloat(formData.minimum_quantity) || 0,
        reorder_quantity: parseFloat(formData.reorder_quantity) || 0,
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes,
      };

      await saveIngredient(ingredient);
      await loadIngredients();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${(amount || 0).toFixed(2)}`;
  };

  const isLowStock = (ingredient: Ingredient) => {
    return ingredient.current_quantity <= ingredient.minimum_quantity;
  };

  const isNearExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days >= 0;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="ingredients" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <Header title="Ingredients" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button onClick={handleAdd} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition">
                <i className="fas fa-plus mr-2"></i>Add Ingredient
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Name</th>
                    <th className="px-6 py-4 text-left font-medium">Category</th>
                    <th className="px-6 py-4 text-left font-medium">Stock</th>
                    <th className="px-6 py-4 text-left font-medium">Min</th>
                    <th className="px-6 py-4 text-left font-medium">Cost/Unit</th>
                    <th className="px-6 py-4 text-left font-medium">Expiry</th>
                    <th className="px-6 py-4 text-left font-medium">Supplier</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No ingredients found. Click "Add Ingredient" to create one.
                      </td>
                    </tr>
                  ) : (
                    ingredients.map(ingredient => (
                      <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-black dark:text-white">{ingredient.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{ingredient.notes}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{ingredient.category}</td>
                        <td className="px-6 py-4">
                          <span className={isLowStock(ingredient) ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                            {ingredient.current_quantity.toFixed(2)} {ingredient.unit}
                          </span>
                          {isLowStock(ingredient) && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 rounded-full">Low</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{ingredient.minimum_quantity} {ingredient.unit}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatCurrency(ingredient.cost_per_unit || 0)}</td>
                        <td className="px-6 py-4">
                          {ingredient.expiry_date ? (
                            <span className={isNearExpiry(ingredient.expiry_date) ? 'text-orange-600 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                              {new Date(ingredient.expiry_date).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {suppliers.find(s => s.id === ingredient.supplier_id)?.name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleEdit(ingredient)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button onClick={() => handleDelete(ingredient.id)} className="text-red-500 hover:text-red-700">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="beverage">Beverage Base</option>
                    <option value="dairy">Dairy</option>
                    <option value="syrup">Syrup</option>
                    <option value="packaging">Packaging</option>
                    <option value="pastry">Pastry</option>
                    <option value="supply">Supply</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pcs">Pieces</option>
                    <option value="g">Grams</option>
                    <option value="kg">Kilograms</option>
                    <option value="ml">Milliliters</option>
                    <option value="L">Liters</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                    <option value="bottle">Bottle</option>
                    <option value="cup">Cup</option>
                    <option value="shot">Shot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Current Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Minimum Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Reorder Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Cost per Unit (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  {editingIngredient ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;