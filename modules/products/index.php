<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();
requireRole(['owner', 'manager', 'staff']);

$db = getDB();

// Get all products
$stmt = $db->prepare("SELECT p.*, i.current_quantity FROM products p LEFT JOIN inventory i ON p.id = i.product_id ORDER BY p.created_at DESC");
$stmt->execute();
$products = $stmt->fetchAll();

// Get unique categories
$categories = [];
$stmt = $db->prepare("SELECT DISTINCT category FROM products WHERE is_active = TRUE ORDER BY category");
$stmt->execute();
$categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Products - Sip Station</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-white">
    <div class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <aside class="w-64 bg-white shadow-lg flex flex-col">
            <div class="bg-green-500 p-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <i class="fas fa-coffee text-green-500 text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-black font-bold text-lg">Sip Station</h1>
                        <p class="text-green-100 text-sm">POS & IBMS</p>
                    </div>
                </div>
            </div>
            
            <nav class="flex-1 p-4 overflow-y-auto">
                <ul class="space-y-2">
                    <li>
                        <a href="../../dashboard.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="../pos/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-cash-register"></i>
                            <span>POS</span>
                        </a>
                    </li>
                    <li>
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-box"></i>
                            <span class="font-medium">Products</span>
                        </a>
                    </li>
                    <li>
                        <a href="../inventory/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-warehouse"></i>
                            <span>Inventory</span>
                        </a>
                    </li>
                    <li>
                        <a href="../sales/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-chart-line"></i>
                            <span>Sales & Reports</span>
                        </a>
                    </li>
                    <li>
                        <a href="../attendance/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-clock"></i>
                            <span>Attendance</span>
                        </a>
                    </li>
                    <li>
                        <a href="../schedule/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Schedule</span>
                        </a>
                    </li>
                    <li>
                        <a href="../payroll/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Payroll</span>
                        </a>
                    </li>
                    <li>
                        <a href="../expenses/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-receipt"></i>
                            <span>Expenses</span>
                        </a>
                    </li>
                    <li>
                        <a href="../documents/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-folder"></i>
                            <span>Documents</span>
                        </a>
                    </li>
                    <li>
                        <a href="../messages/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-envelope"></i>
                            <span>Messages</span>
                        </a>
                    </li>
                    <?php if (hasRole(['owner', 'manager'])): ?>
                    <li>
                        <a href="../users/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-users"></i>
                            <span>Users</span>
                        </a>
                    </li>
                    <?php endif; ?>
                </ul>
            </nav>
            
            <div class="p-4 border-t">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-black"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-medium text-black"><?php echo htmlspecialchars($_SESSION['full_name']); ?></p>
                        <p class="text-sm text-gray-500 capitalize"><?php echo htmlspecialchars($_SESSION['role']); ?></p>
                    </div>
                </div>
                <a href="../../logout.php" class="flex items-center justify-center space-x-2 w-full bg-red-500 hover:bg-red-600 text-black py-2 rounded-lg transition">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            </div>
        </aside>
        
        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto">
            <div class="p-8">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h1 class="text-3xl font-bold text-black">Products</h1>
                        <p class="text-gray-600">Manage your product catalog</p>
                    </div>
                    <button onclick="openModal()" class="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-plus mr-2"></i>Add Product
                    </button>
                </div>
                
                <!-- Search and Filter -->
                <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div class="flex items-center space-x-4">
                        <div class="flex-1 relative">
                            <input type="text" id="searchInput" placeholder="Search products..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <select id="categoryFilter" class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">All Categories</option>
                            <?php foreach ($categories as $category): ?>
                            <option value="<?php echo htmlspecialchars($category); ?>"><?php echo htmlspecialchars($category); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <select id="statusFilter" class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                
                <!-- Products Table -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">Product</th>
                                    <th class="px-6 py-4 text-left font-medium">Category</th>
                                    <th class="px-6 py-4 text-left font-medium">Price</th>
                                    <th class="px-6 py-4 text-left font-medium">Cost</th>
                                    <th class="px-6 py-4 text-left font-medium">Stock</th>
                                    <th class="px-6 py-4 text-left font-medium">SKU</th>
                                    <th class="px-6 py-4 text-left font-medium">Status</th>
                                    <th class="px-6 py-4 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="productsTable">
                                <?php foreach ($products as $product): ?>
                                <tr class="border-b hover:bg-gray-50 product-row" 
                                    data-name="<?php echo htmlspecialchars($product['name']); ?>"
                                    data-category="<?php echo htmlspecialchars($product['category']); ?>"
                                    data-status="<?php echo $product['is_active'] ? 'active' : 'inactive'; ?>">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-coffee text-green-500"></i>
                                            </div>
                                            <div>
                                                <p class="font-medium text-black"><?php echo htmlspecialchars($product['name']); ?></p>
                                                <p class="text-sm text-gray-500"><?php echo htmlspecialchars($product['description'] ?? ''); ?></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($product['category']); ?></td>
                                    <td class="px-6 py-4 font-bold text-green-600"><?php echo formatCurrency($product['price']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo formatCurrency($product['cost_price'] ?? 0); ?></td>
                                    <td class="px-6 py-4">
                                        <span class="<?php echo ($product['current_quantity'] ?? 0) <= 10 ? 'text-red-500 font-bold' : 'text-gray-600'; ?>">
                                            <?php echo $product['current_quantity'] ?? 0; ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($product['sku'] ?? '-'); ?></td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 rounded-full text-sm font-medium <?php echo $product['is_active'] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'; ?>">
                                            <?php echo $product['is_active'] ? 'Active' : 'Inactive'; ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="editProduct(<?php echo $product['id']; ?>)" class="text-blue-500 hover:text-blue-700">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteProduct(<?php echo $product['id']; ?>)" class="text-red-500 hover:text-red-700">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <!-- Product Modal -->
    <div id="productModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black" id="modalTitle">Add Product</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="productForm">
                <input type="hidden" id="productId">
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-black mb-1">Product Name *</label>
                        <input type="text" id="productName" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Category *</label>
                        <input type="text" id="productCategory" required list="categoryList" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                        <datalist id="categoryList">
                            <?php foreach ($categories as $category): ?>
                            <option value="<?php echo htmlspecialchars($category); ?>">
                            <?php endforeach; ?>
                        </datalist>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">SKU</label>
                        <input type="text" id="productSku" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Selling Price *</label>
                        <input type="number" id="productPrice" required step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Cost Price</label>
                        <input type="number" id="productCostPrice" step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Barcode</label>
                        <input type="text" id="productBarcode" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Color</label>
                        <input type="color" id="productColor" value="#22c55e" class="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Shape</label>
                        <select id="productShape" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="rectangle">Rectangle</option>
                            <option value="rounded">Rounded</option>
                            <option value="circle">Circle</option>
                            <option value="square">Square</option>
                        </select>
                    </div>
                    
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-black mb-1">Description</label>
                        <textarea id="productDescription" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                    
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-71 mb-1">Product Image</label>
                        <input type="file" id="productImage" accept="image/*" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div class="col-span-2">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="productActive" checked class="w-4 h-4 text-green-500 focus:ring-green-500">
                            <span class="text-sm font-medium text-black">Active</span>
                        </label>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-save mr-2"></i>Save Product
                    </button>
                    <button type="button" onclick="closeModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="../../assets/js/products.js"></script>
</body>
</html>
