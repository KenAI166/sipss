import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getProducts, saveSale, saveProduct, deductStockForSale } from '../utils/db';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

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
  const tax = subtotal * 0.12;
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal + tax - discountAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      const receiptNumber = `REC-${Date.now()}`;
      const items = cart.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      // Deduct ingredient stock for each cart item
      let stockMessages: string[] = [];
      for (const cartItem of cart) {
        const result = await deductStockForSale(
          cartItem.product.id,
          cartItem.quantity,
          receiptNumber,
          user.full_name
        );
        if (!result.success) {
          alert(`Stock error: ${result.message}`);
          return;
        }
        if (result.message) {
          stockMessages.push(`${cartItem.product.name}: ${result.message}`);
        }

        // Update product stock
        const updatedProduct = { ...cartItem.product, stock: cartItem.product.stock - cartItem.quantity };
        await saveProduct(updatedProduct);
      }

      const sale = {
        receipt_number: receiptNumber,
        items: JSON.stringify(items),
        subtotal: subtotal,
        tax: tax,
        discount: discountAmount,
        total: total,
        payment_method: paymentMethod,
        customer_name: customerName,
        notes: notes,
        cashier_name: user.full_name,
        created_at: new Date().toISOString()
      };

      await saveSale(sale);
      
      // Reload products to reflect stock changes
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
      
      if (stockMessages.length > 0) {
        console.log('Stock deductions:', stockMessages);
      }
      
      alert(`Checkout successful! Total: ₱${total.toFixed(2)}`);
      setCart([]);
      setDiscount(0);
      setCustomerName('');
      setNotes('');
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error processing sale. Please try again.');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="pos" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <Header title="Point of Sale" onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} />
        <div className="p-4 mb-6 flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
      <div className="w-96 bg-white dark:bg-gray-900 border-l flex flex-col">
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
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Discount (%)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
              max="100"
            />
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
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax (12%)</span>
              <span className="text-black dark:text-white">₱{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Discount</span>
              <span className="text-red-600 dark:text-red-400">-₱{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-black dark:text-white">Total</span>
              <span className="text-blue-600 dark:text-blue-400">₱{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
          >
            <i className="fas fa-check mr-2"></i>
            Complete Order
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
  );
};

export default POS;
