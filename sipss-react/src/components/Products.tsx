import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { getProducts, saveProduct, deleteProduct } from '../utils/db';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
  sku: string;
  is_active: boolean;
  description?: string;
  barcode?: string;
  color?: string;
  shape?: string;
}

interface ProductsProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Products: React.FC<ProductsProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost_price: '',
    sku: '',
    barcode: '',
    color: '#22c55e',
    shape: 'rectangle',
    description: '',
    is_active: true,
  });

  // Load products from database
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const loadedProducts = await getProducts();
        
        // If no products exist, add sample data
        if (loadedProducts.length === 0) {
          const sampleProducts: Product[] = [
            {
              id: 0,
              name: 'Espresso',
              category: 'Coffee',
              price: 85.00,
              cost_price: 45.00,
              stock: 50,
              sku: 'COF-001',
              is_active: true,
              description: 'Rich and bold espresso shot',
              barcode: '1234567890123',
              color: '#8B4513',
            },
            {
              id: 0,
              name: 'Cappuccino',
              category: 'Coffee',
              price: 120.00,
              cost_price: 65.00,
              stock: 35,
              sku: 'COF-002',
              is_active: true,
              description: 'Classic cappuccino with foam',
              barcode: '1234567890124',
              color: '#D2691E',
            },
            {
              id: 0,
              name: 'Latte',
              category: 'Coffee',
              price: 130.00,
              cost_price: 70.00,
              stock: 40,
              sku: 'COF-003',
              is_active: true,
              description: 'Smooth latte with steamed milk',
              barcode: '1234567890125',
              color: '#F5DEB3',
            },
            {
              id: 0,
              name: 'Americano',
              category: 'Coffee',
              price: 95.00,
              cost_price: 50.00,
              stock: 45,
              sku: 'COF-004',
              is_active: true,
              description: 'Hot water with espresso',
              barcode: '1234567890126',
              color: '#6F4E37',
            },
            {
              id: 0,
              name: 'Mocha',
              category: 'Coffee',
              price: 140.00,
              cost_price: 75.00,
              stock: 30,
              sku: 'COF-005',
              is_active: true,
              description: 'Chocolate-flavored coffee',
              barcode: '1234567890127',
              color: '#3D2B1F',
            },
            {
              id: 0,
              name: 'Green Tea',
              category: 'Tea',
              price: 90.00,
              cost_price: 40.00,
              stock: 25,
              sku: 'TEA-001',
              is_active: true,
              description: 'Fresh green tea',
              barcode: '1234567890128',
              color: '#90EE90',
            },
            {
              id: 0,
              name: 'Croissant',
              category: 'Pastry',
              price: 75.00,
              cost_price: 35.00,
              stock: 20,
              sku: 'PAS-001',
              is_active: true,
              description: 'Buttery croissant',
              barcode: '1234567890129',
              color: '#FFD700',
            },
            {
              id: 0,
              name: 'Blueberry Muffin',
              category: 'Pastry',
              price: 80.00,
              cost_price: 38.00,
              stock: 15,
              sku: 'PAS-002',
              is_active: true,
              description: 'Fresh blueberry muffin',
              barcode: '1234567890130',
              color: '#4169E1',
            },
          ];
          
          // Save each sample product to database
          for (const product of sampleProducts) {
            await saveProduct(product);
          }
          
          // Reload products after inserting sample data
          const updatedProducts = await getProducts();
          setProducts(updatedProducts);
        } else {
          setProducts(loadedProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    
    loadProducts();
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && product.is_active) ||
                         (statusFilter === 'inactive' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      cost_price: '',
      sku: '',
      barcode: '',
      color: '#22c55e',
      shape: 'rectangle',
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      sku: product.sku || '',
      barcode: product.barcode || '',
      color: product.color || '#22c55e',
      shape: product.shape || 'rectangle',
      description: product.description || '',
      is_active: product.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        const updatedProducts = products.filter(p => p.id !== id);
        setProducts(updatedProducts);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : 0,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price) || 0,
      stock: editingProduct ? editingProduct.stock : 0,
      sku: formData.sku,
      is_active: formData.is_active,
      description: formData.description,
      barcode: formData.barcode,
      color: formData.color,
      shape: formData.shape,
    };

    try {
      await saveProduct(newProduct);
      
      // Reload products from database
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
      setShowModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="products" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <i className="fas fa-bars text-gray-700 text-xl"></i>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-black">Products</h1>
                <p className="text-gray-600">Manage your product catalog</p>
              </div>
            </div>
            <button
              onClick={handleAddProduct}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              <i className="fas fa-plus mr-2"></i>Add Product
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Product</th>
                    <th className="px-6 py-4 text-left font-medium">Category</th>
                    <th className="px-6 py-4 text-left font-medium">Price</th>
                    <th className="px-6 py-4 text-left font-medium">Cost</th>
                    <th className="px-6 py-4 text-left font-medium">Stock</th>
                    <th className="px-6 py-4 text-left font-medium">SKU</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: product.color || '#22c55e' }}
                          >
                            <i className="fas fa-coffee text-white"></i>
                          </div>
                          <div>
                            <p className="font-medium text-black">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.description || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatCurrency(product.cost_price)}</td>
                      <td className="px-6 py-4">
                        <span className={product.stock <= 10 ? 'text-red-500 font-bold' : 'text-gray-600'}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.sku || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-black"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    list="categoryList"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <datalist id="categoryList">
                    {categories.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Selling Price *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Cost Price</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Shape</label>
                  <select
                    value={formData.shape}
                    onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="rounded">Rounded</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-black">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition"
                >
                  <i className="fas fa-save mr-2"></i>Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition"
                >
                  <i className="fas fa-times mr-2"></i>Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
