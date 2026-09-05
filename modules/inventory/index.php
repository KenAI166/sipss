<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();
requireRole(['owner', 'manager', 'staff']);

$db = getDB();

// Get all inventory with product details
$stmt = $db->prepare("SELECT i.*, p.name, p.category, p.sku, p.is_active FROM inventory i JOIN products p ON i.product_id = p.id ORDER BY i.current_quantity ASC");
$stmt->execute();
$inventory = $stmt->fetchAll();

// Get low stock count
$stmt = $db->prepare("SELECT COUNT(*) as count FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.current_quantity <= i.minimum_quantity AND p.is_active = TRUE");
$stmt->execute();
$lowStockCount = $stmt->fetch()['count'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory - Sip Station</title>
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
                        <a href="../products/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-box"></i>
                            <span>Products</span>
                        </a>
                    </li>
                    <li>
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-warehouse"></i>
                            <span class="font-medium">Inventory</span>
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
                        <h1 class="text-3xl font-bold text-black">Inventory Management</h1>
                        <p class="text-gray-600">Track and manage stock levels</p>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-green-100 rounded-xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-boxes text-black text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-black"><?php echo count($inventory); ?></h3>
                        <p class="text-gray-600">Total Products</p>
                    </div>
                    
                    <div class="bg-red-100 rounded-xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-exclamation-triangle text-black text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-black"><?php echo $lowStockCount; ?></h3>
                        <p class="text-gray-600">Low Stock Items</p>
                    </div>
                    
                    <div class="bg-blue-100 rounded-xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-cubes text-black text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-black"><?php echo array_sum(array_column($inventory, 'current_quantity')); ?></h3>
                        <p class="text-gray-600">Total Units</p>
                    </div>
                </div>
                
                <!-- Low Stock Alert -->
                <?php if ($lowStockCount > 0): ?>
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-black"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-red-800">Low Stock Alert</h3>
                            <p class="text-red-600 text-sm"><?php echo $lowStockCount; ?> products need restocking</p>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
                
                <!-- Inventory Table -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 border-b">
                        <div class="flex items-center space-x-4">
                            <div class="flex-1 relative">
                                <input type="text" id="searchInput" placeholder="Search products..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                            <select id="stockFilter" class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">All Stock Levels</option>
                                <option value="low">Low Stock</option>
                                <option value="normal">Normal Stock</option>
                                <option value="high">High Stock</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">Product</th>
                                    <th class="px-6 py-4 text-left font-medium">Category</th>
                                    <th class="px-6 py-4 text-left font-medium">SKU</th>
                                    <th class="px-6 py-4 text-left font-medium">Current Stock</th>
                                    <th class="px-6 py-4 text-left font-medium">Minimum</th>
                                    <th class="px-6 py-4 text-left font-medium">Status</th>
                                    <th class="px-6 py-4 text-left font-medium">Last Restocked</th>
                                    <th class="px-6 py-4 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="inventoryTable">
                                <?php foreach ($inventory as $item): ?>
                                <tr class="border-b hover:bg-gray-50 inventory-row"
                                    data-name="<?php echo htmlspecialchars($item['name']); ?>"
                                    data-stock="<?php echo $item['current_quantity']; ?>"
                                    data-minimum="<?php echo $item['minimum_quantity']; ?>">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-box text-green-500"></i>
                                            </div>
                                            <div>
                                                <p class="font-medium text-black"><?php echo htmlspecialchars($item['name']); ?></p>
                                                <?php if (!$item['is_active']): ?>
                                                <span class="text-xs text-red-500">(Inactive)</span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($item['category']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($item['sku'] ?? '-'); ?></td>
                                    <td class="px-6 py-4 font-bold <?php echo $item['current_quantity'] <= $item['minimum_quantity'] ? 'text-red-500' : 'text-black'; ?>">
                                        <?php echo $item['current_quantity']; ?>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $item['minimum_quantity']; ?></td>
                                    <td class="px-6 py-4">
                                        <?php if ($item['current_quantity'] <= $item['minimum_quantity']): ?>
                                        <span class="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">Low Stock</span>
                                        <?php elseif ($item['current_quantity'] <= $item['minimum_quantity'] * 2): ?>
                                        <span class="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">Medium</span>
                                        <?php else: ?>
                                        <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">Good</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">
                                        <?php echo $item['last_restocked'] ? date('M d, Y', strtotime($item['last_restocked'])) : 'Never'; ?>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="restock(<?php echo $item['product_id']; ?>)" class="text-green-500 hover:text-green-700" title="Restock">
                                                <i class="fas fa-plus-circle"></i>
                                            </button>
                                            <button onclick="editStock(<?php echo $item['product_id']; ?>)" class="text-blue-500 hover:text-blue-700" title="Edit Stock">
                                                <i class="fas fa-edit"></i>
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
    
    <!-- Restock Modal -->
    <div id="restockModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Restock Product</h2>
                <button onclick="closeRestockModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="restockForm">
                <input type="hidden" id="restockProductId">
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-black mb-1">Product</label>
                    <input type="text" id="restockProductName" readonly class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-black mb-1">Current Stock</label>
                    <input type="text" id="restockCurrentStock" readonly class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-black mb-1">Add Quantity</label>
                    <input type="number" id="restockQuantity" min="1" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-black mb-1">New Total</label>
                    <input type="text" id="restockNewTotal" readonly class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-green-50 font-bold">
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-check mr-2"></i>Restock
                    </button>
                    <button type="button" onclick="closeRestockModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Edit Stock Modal -->
    <div id="editStockModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Edit Stock</h2>
                <button onclick="closeEditStockModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="editStockForm">
                <input type="hidden" id="editStockProductId">
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-black mb-1">Product</label>
                    <input type="text" id="editStockProductName" readonly class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-black mb-1">Current Stock</label>
                    <input type="number" id="editStockCurrent" min="0" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-black mb-1">Minimum Stock</label>
                    <input type="number" id="editStockMinimum" min="0" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-save mr-2"></i>Save
                    </button>
                    <button type="button" onclick="closeEditStockModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="../../assets/js/inventory.js"></script>
</body>
</html>
