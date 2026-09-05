<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();
requireRole(['owner', 'manager', 'staff']);

$db = getDB();

// Get sales summary
$stmt = $db->prepare("SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue FROM sales WHERE status = 'completed'");
$stmt->execute();
$summary = $stmt->fetch();

// Get today's sales
$today = date('Y-m-d');
$stmt = $db->prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) = ? AND status = 'completed'");
$stmt->execute([$today]);
$todaySales = $stmt->fetch();

// Get this week's sales
$weekStart = date('Y-m-d', strtotime('monday this week'));
$stmt = $db->prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) >= ? AND status = 'completed'");
$stmt->execute([$weekStart]);
$weekSales = $stmt->fetch();

// Get this month's sales
$monthStart = date('Y-m-01');
$stmt = $db->prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) >= ? AND status = 'completed'");
$stmt->execute([$monthStart]);
$monthSales = $stmt->fetch();

// Get recent sales
$stmt = $db->prepare("SELECT s.*, u.full_name as cashier_name FROM sales s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 10");
$stmt->execute();
$recentSales = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales & Reports - Sip Station</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                        <a href="../inventory/index.php" class="flex items-center space-x-3 px-4 py-3 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-warehouse"></i>
                            <span>Inventory</span>
                        </a>
                    </li>
                    <li>
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-chart-line"></i>
                            <span class="font-medium">Sales & Reports</span>
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
                        <h1 class="text-3xl font-bold text-black">Sales & Reports</h1>
                        <p class="text-gray-600">View sales history and generate reports</p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="exportReport('daily')" class="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-download mr-2"></i>Daily Report
                        </button>
                        <button onclick="exportReport('weekly')" class="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-download mr-2"></i>Weekly Report
                        </button>
                        <button onclick="exportReport('monthly')" class="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-download mr-2"></i>Monthly Report
                        </button>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-green-100 rounded-xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-dollar-sign text-black text-xl"></i>
                            </div>
                            <span class="text-green-600 text-sm font-medium">All Time</span>
                        </div>
                        <h3 class="text-2xl font-bold text-black"><?php echo formatCurrency($summary['total_revenue']); ?></h3>
                        <p class="text-gray-600">Total Revenue</p>
                    </div>
                    
                    <div class="bg-green-100 rounded-xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-calendar-day text-black text-xl"></i>
                            </div>
                            <span class="text-green-600 text-sm font-medium">Today</span>
                        </div>
                        <h3 class="text-2xl font-bold text-black"><?php echo formatCurrency($todaySales['total']); ?></h3>
                        <p class="text-gray-600"><?php echo $todaySales['count']; ?> sales</p>
                    </div>
                    
                    <div class="bg-green-100 rounded-xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-calendar-week text-black text-xl"></i>
                            </div>
                            <span class="text-green-600 text-sm font-medium">This Week</span>
                        </div>
                        <h3 class="text-2xl font-bold text-black"><?php echo formatCurrency($weekSales['total']); ?></h3>
                        <p class="text-gray-600"><?php echo $weekSales['count']; ?> sales</p>
                    </div>
                    
                    <div class="bg-green-100 rounded-xl p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-calendar-alt text-black text-xl"></i>
                            </div>
                            <span class="text-green-600 text-sm font-medium">This Month</span>
                        </div>
                        <h3 class="text-2xl font-bold text-black"><?php echo formatCurrency($monthSales['total']); ?></h3>
                        <p class="text-gray-600"><?php echo $monthSales['count']; ?> sales</p>
                    </div>
                </div>
                
                <!-- Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <h2 class="text-xl font-bold text-black mb-4">Sales Trend (Last 7 Days)</h2>
                        <canvas id="salesTrendChart" height="200"></canvas>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <h2 class="text-xl font-bold text-black mb-4">Sales by Payment Method</h2>
                        <canvas id="paymentMethodChart" height="200"></canvas>
                    </div>
                </div>
                
                <!-- Recent Sales -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 border-b">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-black">Recent Sales</h2>
                            <div class="flex items-center space-x-4">
                                <input type="date" id="dateFrom" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                                <input type="date" id="dateTo" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                                <select id="statusFilter" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button onclick="filterSales()" class="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition">
                                    <i class="fas fa-filter mr-2"></i>Filter
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">Receipt #</th>
                                    <th class="px-6 py-4 text-left font-medium">Date</th>
                                    <th class="px-6 py-4 text-left font-medium">Cashier</th>
                                    <th class="px-6 py-4 text-left font-medium">Customer</th>
                                    <th class="px-6 py-4 text-left font-medium">Amount</th>
                                    <th class="px-6 py-4 text-left font-medium">Payment</th>
                                    <th class="px-6 py-4 text-left font-medium">Status</th>
                                    <th class="px-6 py-4 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="salesTable">
                                <?php foreach ($recentSales as $sale): ?>
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-6 py-4 font-medium text-black"><?php echo htmlspecialchars($sale['receipt_number']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo date('M d, Y H:i', strtotime($sale['created_at'])); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($sale['cashier_name']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($sale['customer_name'] ?? '-'); ?></td>
                                    <td class="px-6 py-4 font-bold text-green-600"><?php echo formatCurrency($sale['total_amount']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($sale['payment_method']); ?></td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 rounded-full text-sm font-medium 
                                            <?php echo $sale['status'] === 'completed' ? 'bg-green-100 text-green-700' : ($sale['status'] === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'); ?>">
                                            <?php echo ucfirst($sale['status']); ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="viewSale(<?php echo $sale['id']; ?>)" class="text-blue-500 hover:text-blue-700" title="View Details">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <?php if (hasRole(['owner', 'manager'])): ?>
                                            <button onclick="printReceipt(<?php echo $sale['id']; ?>)" class="text-green-500 hover:text-green-700" title="Print Receipt">
                                                <i class="fas fa-print"></i>
                                            </button>
                                            <?php endif; ?>
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
    
    <!-- Sale Details Modal -->
    <div id="saleDetailsModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Sale Details</h2>
                <button onclick="closeSaleDetailsModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div id="saleDetailsContent">
                <!-- Content loaded dynamically -->
            </div>
            
            <div class="flex space-x-3 mt-6">
                <button onclick="printReceiptFromModal()" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                    <i class="fas fa-print mr-2"></i>Print Receipt
                </button>
                <button onclick="closeSaleDetailsModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                    <i class="fas fa-times mr-2"></i>Close
                </button>
            </div>
        </div>
    </div>
    
    <script src="../../assets/js/sales.js"></script>
</body>
</html>
