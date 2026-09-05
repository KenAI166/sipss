<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();
requireRole(['owner', 'manager', 'staff']);

$db = getDB();

// Get all active products
$stmt = $db->prepare("SELECT p.*, i.current_quantity FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.is_active = TRUE ORDER BY p.category, p.name");
$stmt->execute();
$products = $stmt->fetchAll();

// Get unique categories
$categories = array_unique(array_column($products, 'category'));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS - Sip Station</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-white">
    <div class="flex h-screen overflow-hidden">
        <!-- Product Section -->
        <div class="flex-1 flex flex-col">
            <!-- Header -->
            <div class="bg-white shadow-sm p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="../dashboard.php" class="text-black hover:text-green-600">
                            <i class="fas fa-arrow-left text-xl"></i>
                        </a>
                        <h1 class="text-xl font-bold text-black">Point of Sale</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="relative">
                            <input type="text" id="searchInput" placeholder="Search products..." class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64">
                            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-gray-600 text-sm">Cashier:</span>
                            <span class="font-medium text-black text-sm"><?php echo htmlspecialchars($_SESSION['full_name']); ?></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Category Filters -->
            <div class="bg-white border-b p-4">
                <div class="flex items-center space-x-2 overflow-x-auto" id="categoryFilters">
                    <button class="category-chip px-4 py-2 bg-green-500 text-black rounded-lg font-medium whitespace-nowrap" data-category="all">All</button>
                    <?php foreach ($categories as $category): ?>
                    <button class="category-chip px-4 py-2 bg-gray-200 text-black rounded-lg font-medium whitespace-nowrap hover:bg-green-500 hover:text-black transition" data-category="<?php echo htmlspecialchars($category); ?>">
                        <?php echo htmlspecialchars($category); ?>
                    </button>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <!-- Products Grid -->
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" id="productsGrid">
                    <?php foreach ($products as $product): ?>
                    <div class="product-card bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transform hover:scale-105 transition" 
                         data-category="<?php echo htmlspecialchars($product['category']); ?>"
                         data-id="<?php echo $product['id']; ?>"
                         data-name="<?php echo htmlspecialchars($product['name']); ?>"
                         data-price="<?php echo $product['price']; ?>"
                         data-stock="<?php echo $product['current_quantity'] ?? 0; ?>"
                         data-shape="<?php echo htmlspecialchars($product['shape']); ?>"
                         data-color="<?php echo htmlspecialchars($product['color'] ?? '#22c55e'); ?>">
                        <div class="p-4">
                            <div class="w-full h-32 <?php echo $product['shape'] === 'circle' ? 'rounded-full' : ($product['shape'] === 'rounded' ? 'rounded-2xl' : ($product['shape'] === 'square' ? 'rounded-none' : 'rounded-lg')); ?> flex items-center justify-center mb-3" 
                                 style="background-color: <?php echo htmlspecialchars($product['color'] ?? '#dcfce7'); ?>;">
                                <i class="fas fa-coffee text-4xl text-gray-600"></i>
                            </div>
                            <h3 class="font-bold text-black mb-1 text-sm"><?php echo htmlspecialchars($product['name']); ?></h3>
                            <p class="text-xs text-gray-500 mb-2"><?php echo htmlspecialchars($product['category']); ?></p>
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-green-600 text-sm"><?php echo formatCurrency($product['price']); ?></span>
                                <span class="text-xs <?php echo ($product['current_quantity'] ?? 0) <= 10 ? 'text-red-500' : 'text-gray-500'; ?>">
                                    <?php echo $product['current_quantity'] ?? 0; ?> left
                                </span>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        
        <!-- Cart Section -->
        <div class="w-96 bg-white shadow-lg flex flex-col">
            <div class="p-4 border-b bg-green-500">
                <h2 class="text-lg font-bold text-black flex items-center">
                    <i class="fas fa-shopping-cart mr-2"></i>
                    Shopping Cart
                </h2>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4" id="cartItems">
                <div class="text-center text-gray-500 py-8" id="emptyCart">
                    <i class="fas fa-shopping-cart text-4xl mb-4"></i>
                    <p class="text-sm">Your cart is empty</p>
                </div>
            </div>
            
            <div class="p-4 border-t bg-gray-50">
                <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-gray-600 text-sm">
                        <span>Subtotal:</span>
                        <span id="subtotal"><?php echo formatCurrency(0); ?></span>
                    </div>
                    <div class="flex justify-between text-gray-600 text-sm">
                        <span>Tax (12%):</span>
                        <span id="tax"><?php echo formatCurrency(0); ?></span>
                    </div>
                    <div class="flex justify-between text-gray-600 text-sm">
                        <span>Discount:</span>
                        <input type="number" id="discountInput" value="0" min="0" max="100" class="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm">
                        <span>%</span>
                    </div>
                    <div class="flex justify-between text-lg font-bold text-black border-t pt-2">
                        <span>Total:</span>
                        <span id="total"><?php echo formatCurrency(0); ?></span>
                    </div>
                </div>
                
                <div class="space-y-2">
                    <div>
                        <label class="block text-xs font-medium text-black mb-1">Payment Method</label>
                        <select id="paymentMethod" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="gcash">GCash</option>
                            <option value="maya">Maya</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-medium text-black mb-1">Customer Name (Optional)</label>
                        <input type="text" id="customerName" placeholder="Enter customer name" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-medium text-black mb-1">Notes (Optional)</label>
                        <textarea id="notes" rows="2" placeholder="Add notes..." class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"></textarea>
                    </div>
                    
                    <button id="checkoutBtn" class="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed" disabled>
                        <i class="fas fa-check mr-2"></i>Checkout
                    </button>
                    
                    <button id="clearCartBtn" class="w-full bg-red-500 hover:bg-red-600 text-black font-medium py-3 px-4 rounded-lg transition">
                        <i class="fas fa-trash mr-2"></i>Clear Cart
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Checkout Modal -->
    <div id="checkoutModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h2 class="text-xl font-bold text-black mb-4">Confirm Payment</h2>
            <div class="space-y-4 mb-6">
                <div class="flex justify-between text-gray-600 text-sm">
                    <span>Total Amount:</span>
                    <span class="font-bold text-green-600" id="modalTotal"><?php echo formatCurrency(0); ?></span>
                </div>
                <div class="flex justify-between text-gray-600 text-sm">
                    <span>Payment Method:</span>
                    <span id="modalPaymentMethod">Cash</span>
                </div>
                <div>
                    <label class="block text-xs font-medium text-black mb-1">Amount Received</label>
                    <input type="number" id="amountReceived" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="Enter amount">
                </div>
                <div class="flex justify-between text-lg font-bold text-black border-t pt-2">
                    <span>Change:</span>
                    <span id="changeAmount"><?php echo formatCurrency(0); ?></span>
                </div>
            </div>
            <div class="flex space-x-3">
                <button id="confirmPaymentBtn" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition">
                    <i class="fas fa-check mr-2"></i>Confirm
                </button>
                <button id="cancelPaymentBtn" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-medium py-3 px-4 rounded-lg transition">
                    <i class="fas fa-times mr-2"></i>Cancel
                </button>
            </div>
        </div>
    </div>
    
    <script src="../../assets/js/pos.js"></script>
</body>
</html>
