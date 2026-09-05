<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();

$db = getDB();

// Get expense history
$where = "WHERE 1=1";
$params = [];

if (!hasRole(['owner', 'manager'])) {
    $where .= " AND user_id = ?";
    $params[] = $_SESSION['user_id'];
}

$stmt = $db->prepare("SELECT e.*, u.full_name FROM expenses e JOIN users u ON e.user_id = u.id $where ORDER BY e.date DESC LIMIT 20");
$stmt->execute($params);
$expenses = $stmt->fetchAll();

// Get expense categories
$stmt = $db->prepare("SELECT DISTINCT category FROM expenses ORDER BY category");
$stmt->execute();
$categories = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Get monthly expense summary
$monthStart = date('Y-m-01');
$monthlyWhere = "WHERE date >= ?";
$monthlyParams = [$monthStart];

if (!hasRole(['owner', 'manager'])) {
    $monthlyWhere .= " AND user_id = ?";
    $monthlyParams[] = $_SESSION['user_id'];
}

$stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses $monthlyWhere");
$stmt->execute($monthlyParams);
$monthlyTotal = $stmt->fetch()['total'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expenses - Sip Station</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-100">
    <div class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <aside class="w-64 bg-white shadow-lg flex flex-col">
            <div class="bg-green-500 p-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
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
                        <a href="../../dashboard.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="../pos/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-cash-register"></i>
                            <span>POS</span>
                        </a>
                    </li>
                    <li>
                        <a href="../products/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-box"></i>
                            <span>Products</span>
                        </a>
                    </li>
                    <li>
                        <a href="../inventory/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-warehouse"></i>
                            <span>Inventory</span>
                        </a>
                    </li>
                    <li>
                        <a href="../sales/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-chart-line"></i>
                            <span>Sales & Reports</span>
                        </a>
                    </li>
                    <li>
                        <a href="../attendance/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-clock"></i>
                            <span>Attendance</span>
                        </a>
                    </li>
                    <li>
                        <a href="../schedule/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Schedule</span>
                        </a>
                    </li>
                    <li>
                        <a href="../payroll/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Payroll</span>
                        </a>
                    </li>
                    <li>
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg">
                            <i class="fas fa-receipt"></i>
                            <span class="font-medium">Expenses</span>
                        </a>
                    </li>
                    <li>
                        <a href="../documents/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-folder"></i>
                            <span>Documents</span>
                        </a>
                    </li>
                    <li>
                        <a href="../messages/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-envelope"></i>
                            <span>Messages</span>
                        </a>
                    </li>
                    <?php if (hasRole(['owner', 'manager'])): ?>
                    <li>
                        <a href="../users/index.php" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
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
                        <p class="font-medium text-gray-800"><?php echo htmlspecialchars($_SESSION['full_name']); ?></p>
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
                        <h1 class="text-3xl font-bold text-gray-800">Expense Tracking</h1>
                        <p class="text-gray-600">Track and manage business expenses</p>
                    </div>
                    <button onclick="openModal()" class="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-plus mr-2"></i>Add Expense
                    </button>
                </div>
                
                <!-- Summary Card -->
                <div class="bg-green-100 rounded-xl p-6 mb-8">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">This Month's Expenses</h3>
                            <p class="text-gray-600"><?php echo date('F Y'); ?></p>
                        </div>
                        <div class="text-right">
                            <p class="text-3xl font-bold text-green-600"><?php echo formatCurrency($monthlyTotal); ?></p>
                        </div>
                    </div>
                </div>
                
                <!-- Expenses Table -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 border-b">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-gray-800">Expense History</h2>
                            <div class="flex items-center space-x-4">
                                <select id="categoryFilter" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="">All Categories</option>
                                    <?php foreach ($categories as $category): ?>
                                    <option value="<?php echo htmlspecialchars($category); ?>"><?php echo htmlspecialchars($category); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <input type="month" id="monthFilter" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">Date</th>
                                    <th class="px-6 py-4 text-left font-medium">Category</th>
                                    <th class="px-6 py-4 text-left font-medium">Description</th>
                                    <th class="px-6 py-4 text-left font-medium">Amount</th>
                                    <th class="px-6 py-4 text-left font-medium">Payment Method</th>
                                    <th class="px-6 py-4 text-left font-medium">Added By</th>
                                    <th class="px-6 py-4 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($expenses as $expense): ?>
                                <tr class="border-b hover:bg-gray-50 expense-row" data-category="<?php echo htmlspecialchars($expense['category']); ?>" data-date="<?php echo date('Y-m', strtotime($expense['date'])); ?>">
                                    <td class="px-6 py-4 text-gray-600"><?php echo date('M d, Y', strtotime($expense['date'])); ?></td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                            <?php echo htmlspecialchars($expense['category']); ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($expense['description'] ?? '-'); ?></td>
                                    <td class="px-6 py-4 font-bold text-red-600"><?php echo formatCurrency($expense['amount']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($expense['payment_method'] ?? '-'); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo htmlspecialchars($expense['full_name']); ?></td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="editExpense(<?php echo $expense['id']; ?>)" class="text-blue-500 hover:text-blue-700" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteExpense(<?php echo $expense['id']; ?>)" class="text-red-500 hover:text-red-700" title="Delete">
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
    
    <!-- Expense Modal -->
    <div id="expenseModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800" id="modalTitle">Add Expense</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="expenseForm">
                <input type="hidden" id="expenseId">
                
                <div class="space-y-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <input type="text" id="expenseCategory" required list="categoryList" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                        <datalist id="categoryList">
                            <?php foreach ($categories as $category): ?>
                            <option value="<?php echo htmlspecialchars($category); ?>">
                            <?php endforeach; ?>
                            <option value="Rent">
                            <option value="Utilities">
                            <option value="Supplies">
                            <option value="Equipment">
                            <option value="Maintenance">
                            <option value="Marketing">
                            <option value="Other">
                        </datalist>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="expenseDescription" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                        <input type="number" id="expenseAmount" required step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select id="expensePaymentMethod" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input type="date" id="expenseDate" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea id="expenseNotes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-save mr-2"></i>Save Expense
                    </button>
                    <button type="button" onclick="closeModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        const categoryFilter = document.getElementById('categoryFilter');
        const monthFilter = document.getElementById('monthFilter');
        
        categoryFilter.addEventListener('change', filterExpenses);
        monthFilter.addEventListener('change', filterExpenses);
        
        function filterExpenses() {
            const category = categoryFilter.value;
            const month = monthFilter.value;
            
            const rows = document.querySelectorAll('.expense-row');
            
            rows.forEach(row => {
                const rowCategory = row.dataset.category;
                const rowDate = row.dataset.date;
                
                const matchesCategory = !category || rowCategory === category;
                const matchesMonth = !month || rowDate === month;
                
                row.style.display = matchesCategory && matchesMonth ? '' : 'none';
            });
        }
        
        function openModal(expenseId = null) {
            document.getElementById('expenseModal').classList.remove('hidden');
            document.getElementById('expenseModal').classList.add('flex');
            
            if (expenseId) {
                document.getElementById('modalTitle').textContent = 'Edit Expense';
                loadExpense(expenseId);
            } else {
                document.getElementById('modalTitle').textContent = 'Add Expense';
                document.getElementById('expenseForm').reset();
                document.getElementById('expenseId').value = '';
                document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            }
        }
        
        function closeModal() {
            document.getElementById('expenseModal').classList.add('hidden');
            document.getElementById('expenseModal').classList.remove('flex');
            document.getElementById('expenseForm').reset();
        }
        
        async function loadExpense(expenseId) {
            try {
                const response = await fetch(`../../api/expenses.php?action=get_expense&id=${expenseId}`);
                const result = await response.json();
                
                if (result.success) {
                    const expense = result.expense;
                    document.getElementById('expenseId').value = expense.id;
                    document.getElementById('expenseCategory').value = expense.category;
                    document.getElementById('expenseDescription').value = expense.description || '';
                    document.getElementById('expenseAmount').value = expense.amount;
                    document.getElementById('expensePaymentMethod').value = expense.payment_method || 'cash';
                    document.getElementById('expenseDate').value = expense.date;
                    document.getElementById('expenseNotes').value = expense.notes || '';
                } else {
                    alert('Error loading expense: ' + result.message);
                }
            } catch (error) {
                alert('Error loading expense: ' + error.message);
            }
        }
        
        document.getElementById('expenseForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const expenseId = document.getElementById('expenseId').value;
            const data = {
                category: document.getElementById('expenseCategory').value,
                description: document.getElementById('expenseDescription').value,
                amount: document.getElementById('expenseAmount').value,
                payment_method: document.getElementById('expensePaymentMethod').value,
                date: document.getElementById('expenseDate').value,
                notes: document.getElementById('expenseNotes').value
            };
            
            const action = expenseId ? 'update_expense' : 'create_expense';
            const url = `../../api/expenses.php?action=${action}${expenseId ? '&id=' + expenseId : ''}`;
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Expense saved successfully!');
                    closeModal();
                    location.reload();
                } else {
                    alert('Error saving expense: ' + result.message);
                }
            } catch (error) {
                alert('Error saving expense: ' + error.message);
            }
        });
        
        function editExpense(expenseId) {
            openModal(expenseId);
        }
        
        async function deleteExpense(expenseId) {
            if (!confirm('Are you sure you want to delete this expense?')) {
                return;
            }
            
            try {
                const response = await fetch(`../../api/expenses.php?action=delete_expense&id=${expenseId}`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Expense deleted successfully!');
                    location.reload();
                } else {
                    alert('Error deleting expense: ' + result.message);
                }
            } catch (error) {
                alert('Error deleting expense: ' + error.message);
            }
        }
    </script>
</body>
</html>
