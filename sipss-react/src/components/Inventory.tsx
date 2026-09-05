import React, { useState, useEffect } from 'react';
import { getInventory, saveInventory, deleteInventory, getProducts } from '../utils/db';
import Sidebar from './Sidebar';

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
  last_updated: string;
  stock_type: string;
  category: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
  sku: string;
  is_active: number;
  description: string;
  barcode: string;
  color: string;
}

interface InventoryProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'low' | 'kitchen' | 'general'>('all');
  
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    current_quantity: '',
    minimum_quantity: '',
    unit: 'pcs',
    stock_type: 'kitchen',
    category: 'general',
  });

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, []);

  const loadInventory = async () => {
    try {
      const loadedInventory = await getInventory();
      setInventory(loadedInventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const loadedProducts = await getProducts();
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddInventory = () => {
    setEditMode(false);
    setEditingInventory(null);
    setFormData({
      product_id: '',
      product_name: '',
      current_quantity: '',
      minimum_quantity: '',
      unit: 'pcs',
      stock_type: 'kitchen',
      category: 'general',
    });
    setModalTitle('');
    setModalMessage('');
    setModalVisible(true);
  };

  const handleEditInventory = (inventoryItem: InventoryItem) => {
    setEditMode(true);
    setEditingInventory(inventoryItem);
    setFormData({
      product_id: inventoryItem.product_id.toString(),
      product_name: inventoryItem.product_name,
      current_quantity: inventoryItem.current_quantity.toString(),
      minimum_quantity: inventoryItem.minimum_quantity.toString(),
      unit: inventoryItem.unit,
      stock_type: inventoryItem.stock_type,
      category: inventoryItem.category,
    });
    setModalTitle('');
    setModalMessage('');
    setModalVisible(true);
  };

  const handleDeleteInventory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventory(id);
        await loadInventory();
        
        setModalType('success');
        setModalTitle('Success');
        setModalMessage('Inventory item deleted successfully');
        setModalVisible(true);
      } catch (error) {
        console.error('Error deleting inventory:', error);
        setModalType('error');
        setModalTitle('Error');
        setModalMessage('Failed to delete inventory item');
        setModalVisible(true);
      }
    }
  };

  const handleSaveInventory = async () => {
    if (!formData.product_name || !formData.current_quantity) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Please fill in all required fields');
      setModalVisible(true);
      return;
    }

    try {
      const inventoryData = {
        product_id: parseInt(formData.product_id) || 0,
        product_name: formData.product_name,
        current_quantity: parseInt(formData.current_quantity) || 0,
        minimum_quantity: parseInt(formData.minimum_quantity) || 10,
        unit: formData.unit,
        stock_type: formData.stock_type,
        category: formData.category,
        last_updated: new Date().toISOString(),
      };

      if (editMode && editingInventory) {
        await saveInventory({ ...inventoryData, id: editingInventory.id });
      } else {
        await saveInventory(inventoryData);
      }

      await loadInventory();
      setModalVisible(false);
      
      setModalType('success');
      setModalTitle('Success');
      setModalMessage(editMode ? 'Inventory item updated successfully' : 'Inventory item added successfully');
      setModalVisible(true);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      console.error('Error saving inventory:', error);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(`Failed to save inventory item: ${errorMessage}`);
      setModalVisible(true);
    }
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = parseInt(e.target.value);
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData({
        ...formData,
        product_id: productId.toString(),
        product_name: selectedProduct.name,
        category: selectedProduct.category,
      });
    }
  };

  const getFilteredInventory = () => {
    switch (filterType) {
      case 'low':
        return inventory.filter(item => item.current_quantity <= item.minimum_quantity);
      case 'kitchen':
        return inventory.filter(item => item.stock_type === 'kitchen');
      case 'general':
        return inventory.filter(item => item.stock_type === 'general');
      default:
        return inventory;
    }
  };

  const filteredInventory = getFilteredInventory();
  const lowStockCount = inventory.filter(item => item.current_quantity <= item.minimum_quantity).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="inventory" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <i className="fas fa-bars text-gray-700 text-xl"></i>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-black">Inventory</h1>
                <p className="text-gray-600 text-sm">Stock management</p>
              </div>
            </div>
            <button
              onClick={handleAddInventory}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Item
            </button>
          </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-black">{inventory.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-boxes text-blue-500 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Kitchen Stock</p>
                <p className="text-2xl font-bold text-black">{inventory.filter(i => i.stock_type === 'kitchen').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-utensils text-green-500 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">General Stock</p>
                <p className="text-2xl font-bold text-black">{inventory.filter(i => i.stock_type === 'general').length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-warehouse text-purple-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition ${filterType === 'all' ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-4 py-2 rounded-lg transition ${filterType === 'low' ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterType('kitchen')}
            className={`px-4 py-2 rounded-lg transition ${filterType === 'kitchen' ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Kitchen
          </button>
          <button
            onClick={() => setFilterType('general')}
            className={`px-4 py-2 rounded-lg transition ${filterType === 'general' ? 'bg-purple-500 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            General
          </button>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.length > 0 ? filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">{item.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black capitalize">{item.stock_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.current_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.minimum_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.current_quantity <= item.minimum_quantity ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditInventory(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </main>

      {/* Add/Edit Inventory Modal */}
      {modalVisible && !modalTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">
                {editMode ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h3>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setModalTitle('');
                  setModalMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Link to Product (Optional)</label>
                <select
                  value={formData.product_id}
                  onChange={handleProductSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Product Name *</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Current Quantity *</label>
                  <input
                    type="number"
                    name="current_quantity"
                    value={formData.current_quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Minimum Quantity</label>
                  <input
                    type="number"
                    name="minimum_quantity"
                    value={formData.minimum_quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="L">Liters</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Stock Type</label>
                  <select
                    name="stock_type"
                    value={formData.stock_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter category"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setModalVisible(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInventory}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              {modalType === 'success' && (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-500"></i>
                </div>
              )}
              {modalType === 'error' && (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-times text-red-500"></i>
                </div>
              )}
              {modalType === 'info' && (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-info text-blue-500"></i>
                </div>
              )}
              <h3 className="text-lg font-semibold text-black">{modalTitle}</h3>
            </div>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <button
              onClick={() => {
                setModalVisible(false);
                setModalTitle('');
                setModalMessage('');
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
