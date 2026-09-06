import React, { useState, useEffect } from 'react';
import { useSidebarOpen } from '../hooks/useSidebarOpen';
import Sidebar from './Sidebar';
import Header from './Header';
import Receipt, { ReceiptData } from './Receipt';
import { getProducts, completeOrder, onSynced } from '../utils/db';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
  color: string;
  shape: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const POS: React.FC<POSProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState('none');
  const [customDiscount, setCustomDiscount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const categories = ['All', 'Coffee', 'Tea', 'Pastries', 'Snacks'];

  // Load products from database
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const loadedProducts = await getProducts();
        setProducts(loadedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
    return onSynced(loadProducts);
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const discountOptions = [
    { value: 'none', label: 'None', percent: 0 },
    { value: 'senior', label: 'Senior Citizen (20%)', percent: 20 },
    { value: 'pwd', label: 'PWD (20%)', percent: 20 },
    { value: 'student', label: 'Student (10%)', percent: 10 },
    { value: 'custom', label: 'Custom', percent: null },
  ];

  const selectedDiscount = discountOptions.find(option => option.value === discountType);
  const discountPercent = discountType === 'custom' ? Math.max(0, Math.min(100, customDiscount)) : (selectedDiscount?.percent ?? 0);
  const discountLabel = discountType === 'custom'
    ? `Custom (${discountPercent}%)`
    : (selectedDiscount?.label ?? 'None');
  const discountAmount = subtotal * (discountPercent / 100);
  const tax = taxEnabled ? subtotal * 0.12 : 0;
  const total = subtotal + tax - discountAmount;

  const handleCheckout = async () => {
    if (isProcessing) return;
    if (cart.length === 0) {
      showModal('info', 'Cart Empty', 'Your cart is empty!');
      return;
    }

    setIsProcessing(true);
    try {
      const receiptNumber = `REC-${Date.now()}`;
      const items = cart.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      const sale = {
        receipt_number: receiptNumber,
        items: JSON.stringify(items),
        subtotal: subtotal,
        tax: tax,
        tax_enabled: taxEnabled,
        discount: discountAmount,
        discount_type: discountLabel,
        total: total,
        payment_method: paymentMethod,
        customer_name: customerName,
        notes: notes,
        cashier_name: user.full_name,
        created_at: new Date().toISOString()
      };

      // Single round-trip: the process_sale Postgres function validates stock,
      // inserts the sale, deducts ingredients, and logs transactions
      // atomically. Falls back to the local multi-step path when offline.
      const result = await completeOrder(sale, cart, user.full_name);
      if (!result.success) {
        showModal('error', 'Stock Error', result.message);
        return;
      }

      // Reload products to reflect stock changes
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);

      setReceipt({ ...sale, items });
      setCart([]);
      setDiscountType('none');
      setCustomDiscount(0);
      setTaxEnabled(true);
      setCustomerName('');
      setNotes('');
    } catch (error) {
      console.error('Error saving sale:', error);
      showModal('error', 'Error', 'Error processing sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="pos" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <Header title="Point of Sale" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
          <div className="p-4 mb-6 flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 border-b">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Cashier:</span>
            <span className="font-medium text-black dark:text-white text-sm">Admin</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-white dark:bg-gray-900 border-b p-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category.toLowerCase())}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === category.toLowerCase()
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-blue-500 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="product-card bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden cursor-pointer transform hover:scale-105 transition"
              >
                <div className="p-4">
                  <div
                    className={`w-full h-32 ${
                      (product.shape || 'rounded') === 'circle'
                        ? 'rounded-full'
                        : (product.shape || 'rounded') === 'rounded'
                        ? 'rounded-2xl'
                        : (product.shape || 'rounded') === 'square'
                        ? 'rounded-none'
                        : 'rounded-lg'
                    } flex items-center justify-center mb-3`}
                    style={{ backgroundColor: product.color || '#22c55e' }}
                  >
                    <i className="fas fa-coffee text-4xl text-gray-600 dark:text-gray-400"></i>
                  </div>
                  <h3 className="font-bold text-black dark:text-white mb-1 text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">₱{product.price.toFixed(2)}</span>
                    <span className={`text-xs ${product.stock <= 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
        <div className="w-full md:w-96 bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-l flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-black dark:text-white">Current Order</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <i className="fas fa-shopping-cart text-4xl mb-4"></i>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-950 p-3 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-black dark:text-white text-sm">{item.product.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">₱{item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t space-y-3">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {discountOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {discountType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Custom Discount (%)</label>
              <input
                type="number"
                value={customDiscount}
                onChange={(e) => setCustomDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              id="apply-tax"
              type="checkbox"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="apply-tax" className="ml-2 text-sm text-black dark:text-white">Apply Tax (12%)</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="gcash">GCash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Additional notes"
            />
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-black dark:text-white">₱{subtotal.toFixed(2)}</span>
            </div>
            {taxEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax (12%)</span>
                <span className="text-black dark:text-white">₱{tax.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Discount - {discountLabel}</span>
                <span className="text-red-600 dark:text-red-400">-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span className="text-black dark:text-white">Total</span>
              <span className="text-blue-600 dark:text-blue-400">₱{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-check'} mr-2`}></i>
            {isProcessing ? 'Processing...' : 'Complete Order'}
          </button>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition"
            >
              <i className="fas fa-trash mr-2"></i>
              Clear Cart
            </button>
          )}
        </div>
      </div>
    </div>

      {receipt && <Receipt receipt={receipt} onClose={() => setReceipt(null)} />}

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

export default POS;
