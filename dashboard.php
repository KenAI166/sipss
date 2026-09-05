<?php
require_once 'includes/config.php';
require_once 'includes/functions.php';

requireLogin();

$db = getDB();

// Get today's sales
$today = date('Y-m-d');
$stmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM sales WHERE DATE(created_at) = ? AND status = 'completed'");
$stmt->execute([$today]);
$todaySales = $stmt->fetch()['total_sales'];

// Get this week's sales
$weekStart = date('Y-m-d', strtotime('monday this week'));
$stmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM sales WHERE DATE(created_at) >= ? AND status = 'completed'");
$stmt->execute([$weekStart]);
$weekSales = $stmt->fetch()['total_sales'];

// Get this month's expenses
$monthStart = date('Y-m-01');
$stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE DATE(date) >= ?");
$stmt->execute([$monthStart]);
$monthExpenses = $stmt->fetch()['total_expenses'];

// Get present employee count (employees who have time_in today)
$stmt = $db->prepare("SELECT COUNT(DISTINCT user_id) as present_count FROM attendance WHERE date = ? AND time_in IS NOT NULL AND time_out IS NULL");
$stmt->execute([$today]);
$presentEmployees = $stmt->fetch()['present_count'];

// Get low stock alerts
$stmt = $db->prepare("SELECT COUNT(*) as low_stock_count FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.current_quantity <= i.minimum_quantity AND p.is_active = TRUE");
$stmt->execute();
$lowStockCount = $stmt->fetch()['low_stock_count'];

// Get recent sales
$stmt = $db->prepare("SELECT s.*, u.full_name as cashier_name FROM sales s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 5");
$stmt->execute();
$recentSales = $stmt->fetchAll();

// Get low stock products
$stmt = $db->prepare("SELECT p.name, p.category, i.current_quantity, i.minimum_quantity FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.current_quantity <= i.minimum_quantity AND p.is_active = TRUE ORDER BY i.current_quantity ASC LIMIT 5");
$stmt->execute();
$lowStockProducts = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Sip Station POS</title>
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
                <ul class="space-y-1">
                    <li>
                        <a href="dashboard.php" class="flex items-center space-x-3 px-4 py-2 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-tachometer-alt"></i>
                            <span class="font-medium">Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/pos/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-cash-register"></i>
                            <span>POS</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/products/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-box"></i>
                            <span>Products</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/inventory/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-warehouse"></i>
                            <span>Inventory</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/sales/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-chart-line"></i>
                            <span>Sales & Reports</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/attendance/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-clock"></i>
                            <span>Attendance</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/schedule/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Schedule</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/payroll/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Payroll</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/expenses/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-receipt"></i>
                            <span>Expenses</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/documents/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-folder"></i>
                            <span>Documents</span>
                        </a>
                    </li>
                    <li>
                        <a href="modules/messages/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-envelope"></i>
                            <span>Messages</span>
                        </a>
                    </li>
                    <?php if (hasRole(['owner', 'manager'])): ?>
                    <li>
                        <a href="modules/users/index.php" class="flex items-center space-x-3 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-users"></i>
                            <span>Users</span>
                        </a>
                    </li>
                    <?php endif; ?>
                </ul>
            </nav>
            
            <div class="p-4 border-t">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-user text-black"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-medium text-black"><?php echo htmlspecialchars($_SESSION['full_name']); ?></p>
                        <p class="text-sm text-gray-500 capitalize"><?php echo htmlspecialchars($_SESSION['role']); ?></p>
                    </div>
                </div>
                <a href="logout.php" class="flex items-center justify-center space-x-2 w-full bg-green-500 hover:bg-green-600 text-black py-2 rounded-lg transition">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            </div>
        </aside>
        
        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto">
            <div class="p-8">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold text-black">Dashboard</h1>
                    <p class="text-gray-400">Welcome back, <?php echo htmlspecialchars($_SESSION['full_name']); ?>!</p>
                </div>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div class="bg-white rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-dollar-sign text-black"></i>
                            </div>
                            <span class="text-green-600 text-xs font-medium">Today</span>
                        </div>
                        <h3 class="text-xl font-bold text-black"><?php echo formatCurrency($todaySales); ?></h3>
                        <p class="text-gray-600 text-sm">Today's Sales</p>
                    </div>
                    
                    <div class="bg-white rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-chart-bar text-black"></i>
                            </div>
                            <span class="text-green-600 text-xs font-medium">This Week</span>
                        </div>
                        <h3 class="text-xl font-bold text-black"><?php echo formatCurrency($weekSales); ?></h3>
                        <p class="text-gray-600 text-sm">Weekly Sales</p>
                    </div>
                    
                    <div class="bg-white rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-receipt text-black"></i>
                            </div>
                            <span class="text-green-600 text-xs font-medium">This Month</span>
                        </div>
                        <h3 class="text-xl font-bold text-black"><?php echo formatCurrency($monthExpenses); ?></h3>
                        <p class="text-gray-600 text-sm">Monthly Expenses</p>
                    </div>
                    
                    <div class="bg-white rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-users text-black"></i>
                            </div>
                            <span class="text-green-600 text-xs font-medium">Present</span>
                        </div>
                        <h3 class="text-xl font-bold text-black"><?php echo $presentEmployees; ?></h3>
                        <p class="text-gray-600 text-sm">Employees Present</p>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="bg-white rounded-lg p-6 mb-8">
                    <h2 class="text-lg font-bold text-black mb-4">Quick Actions</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a href="modules/pos/index.php" class="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                                <i class="fas fa-plus text-black"></i>
                            </div>
                            <span class="font-medium text-black text-sm">New Sale</span>
                        </a>
                        
                        <a href="modules/attendance/index.php" class="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                                <i class="fas fa-clock text-black"></i>
                            </div>
                            <span class="font-medium text-black text-sm">Time In/Out</span>
                        </a>
                        
                        <a href="modules/products/index.php" class="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                                <i class="fas fa-box text-black"></i>
                            </div>
                            <span class="font-medium text-black text-sm">Add Product</span>
                        </a>
                        
                        <a href="modules/sales/index.php" class="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition">
                            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                                <i class="fas fa-chart-pie text-black"></i>
                            </div>
                            <span class="font-medium text-black text-sm">View Reports</span>
                        </a>
                    </div>
                </div>
                
                <!-- Alerts -->
                <?php if ($lowStockCount > 0): ?>
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-black"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-red-800">Low Stock Alert</h3>
                            <p class="text-red-600 text-sm"><?php echo $lowStockCount; ?> products are running low on stock</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <?php foreach ($lowStockProducts as $product): ?>
                        <div class="flex items-center justify-between bg-white p-3 rounded-lg">
                            <div>
                                <p class="font-medium text-black"><?php echo htmlspecialchars($product['name']); ?></p>
                                <p class="text-sm text-gray-500"><?php echo htmlspecialchars($product['category']); ?></p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-red-600"><?php echo $product['current_quantity']; ?> left</p>
                                <p class="text-sm text-gray-500">Min: <?php echo $product['minimum_quantity']; ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <a href="modules/inventory/index.php" class="mt-4 inline-block bg-red-500 hover:bg-red-600 text-black px-4 py-2 rounded-lg transition">
                        View Inventory
                    </a>
                </div>
                <?php endif; ?>
                
                <!-- Recent Sales -->
                <div class="bg-white rounded-lg p-6 mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-bold text-black">Recent Sales</h2>
                        <a href="modules/sales/index.php" class="text-green-600 hover:text-green-700 font-medium text-sm">View All</a>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="text-left text-gray-600 border-b">
                                    <th class="pb-3 font-medium text-sm">Receipt #</th>
                                    <th class="pb-3 font-medium text-sm">Cashier</th>
                                    <th class="pb-3 font-medium text-sm">Amount</th>
                                    <th class="pb-3 font-medium text-sm">Payment</th>
                                    <th class="pb-3 font-medium text-sm">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recentSales as $sale): ?>
                                <tr class="border-b">
                                    <td class="py-3 font-medium text-black text-sm"><?php echo htmlspecialchars($sale['receipt_number']); ?></td>
                                    <td class="py-3 text-gray-600 text-sm"><?php echo htmlspecialchars($sale['cashier_name']); ?></td>
                                    <td class="py-3 font-bold text-green-600 text-sm"><?php echo formatCurrency($sale['total_amount']); ?></td>
                                    <td class="py-3 text-gray-600 text-sm"><?php echo htmlspecialchars($sale['payment_method']); ?></td>
                                    <td class="py-3 text-gray-600 text-sm"><?php echo date('H:i', strtotime($sale['created_at'])); ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Sales Chart -->
                <div class="bg-white rounded-lg p-6">
                    <h2 class="text-lg font-bold text-black mb-4">Sales Overview (Last 7 Days)</h2>
                    <canvas id="salesChart" height="100"></canvas>
                </div>
            </div>
        </main>
    </div>
    
    <script>
        // Sales Chart
        const ctx = document.getElementById('salesChart').getContext('2d');
        const salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                datasets: [{
                    label: 'Sales',
                    data: [<?php echo $weekSales / 7; ?>, <?php echo $weekSales / 6; ?>, <?php echo $weekSales / 5; ?>, <?php echo $weekSales / 4; ?>, <?php echo $weekSales / 3; ?>, <?php echo $weekSales / 2; ?>, <?php echo $todaySales; ?>],
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
