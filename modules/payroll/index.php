<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();

$db = getDB();

// Get payroll history
$where = "WHERE 1=1";
$params = [];

if (!hasRole(['owner', 'manager'])) {
    $where .= " AND user_id = ?";
    $params[] = $_SESSION['user_id'];
}

$stmt = $db->prepare("SELECT p.*, u.full_name FROM payroll p JOIN users u ON p.user_id = u.id $where ORDER BY p.period_start DESC LIMIT 20");
$stmt->execute($params);
$payrollHistory = $stmt->fetchAll();

// Get all users for payroll generation
$users = [];
if (hasRole(['owner', 'manager'])) {
    $stmt = $db->prepare("SELECT id, full_name, hourly_rate FROM users WHERE is_active = TRUE ORDER BY full_name");
    $stmt->execute();
    $users = $stmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payroll - Sip Station</title>
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
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-money-bill-wave"></i>
                            <span class="font-medium">Payroll</span>
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
                        <h1 class="text-3xl font-bold text-black">Payroll Management</h1>
                        <p class="text-gray-600">Generate and manage employee payroll</p>
                    </div>
                    <?php if (hasRole(['owner', 'manager'])): ?>
                    <button onclick="openGenerateModal()" class="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-calculator mr-2"></i>Generate Payroll
                    </button>
                    <?php endif; ?>
                </div>
                
                <!-- Payroll History -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 border-b">
                        <h2 class="text-xl font-bold text-black">Payroll History</h2>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">Employee</th>
                                    <th class="px-6 py-4 text-left font-medium">Period</th>
                                    <th class="px-6 py-4 text-left font-medium">Total Hours</th>
                                    <th class="px-6 py-4 text-left font-medium">Regular</th>
                                    <th class="px-6 py-4 text-left font-medium">Overtime</th>
                                    <th class="px-6 py-4 text-left font-medium">Gross Pay</th>
                                    <th class="px-6 py-4 text-left font-medium">Deductions</th>
                                    <th class="px-6 py-4 text-left font-medium">Net Pay</th>
                                    <th class="px-6 py-4 text-left font-medium">Status</th>
                                    <th class="px-6 py-4 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($payrollHistory as $payroll): ?>
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-6 py-4 font-medium text-black"><?php echo htmlspecialchars($payroll['full_name']); ?></td>
                                    <td class="px-6 py-4 text-gray-600">
                                        <?php echo date('M d', strtotime($payroll['period_start'])); ?> - 
                                        <?php echo date('M d, Y', strtotime($payroll['period_end'])); ?>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $payroll['total_hours']; ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $payroll['regular_hours']; ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $payroll['overtime_hours']; ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo formatCurrency($payroll['gross_pay']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo formatCurrency($payroll['deductions']); ?></td>
                                    <td class="px-6 py-4 font-bold text-green-600"><?php echo formatCurrency($payroll['net_pay']); ?></td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 rounded-full text-sm font-medium 
                                            <?php echo $payroll['status'] === 'paid' ? 'bg-green-100 text-green-700' : ($payroll['status'] === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'); ?>">
                                            <?php echo ucfirst($payroll['status']); ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="viewPayroll(<?php echo $payroll['id']; ?>)" class="text-blue-500 hover:text-blue-700" title="View Details">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <?php if (hasRole(['owner', 'manager'])): ?>
                                            <?php if ($payroll['status'] === 'pending'): ?>
                                            <button onclick="approvePayroll(<?php echo $payroll['id']; ?>)" class="text-green-500 hover:text-green-700" title="Approve">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <?php endif; ?>
                                            <?php if ($payroll['status'] === 'approved'): ?>
                                            <button onclick="markAsPaid(<?php echo $payroll['id']; ?>)" class="text-blue-500 hover:text-blue-700" title="Mark as Paid">
                                                <i class="fas fa-dollar-sign"></i>
                                            </button>
                                            <?php endif; ?>
                                            <button onclick="printPayslip(<?php echo $payroll['id']; ?>)" class="text-green-500 hover:text-green-700" title="Print Payslip">
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
    
    <!-- Generate Payroll Modal -->
    <div id="generateModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Generate Payroll</h2>
                <button onclick="closeGenerateModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="generateForm">
                <div class="space-y-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Employee</label>
                        <select id="generateUser" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <?php foreach ($users as $user): ?>
                            <option value="<?php echo $user['id']; ?>"><?php echo htmlspecialchars($user['full_name']); ?> (<?php echo formatCurrency($user['hourly_rate']); ?>/hr)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Period Start</label>
                        <input type="date" id="periodStart" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Period End</label>
                        <input type="date" id="periodEnd" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Deductions</label>
                        <input type="number" id="deductions" step="0.01" min="0" value="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-calculator mr-2"></i>Generate
                    </button>
                    <button type="button" onclick="closeGenerateModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Payroll Details Modal -->
    <div id="payrollDetailsModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Payroll Details</h2>
                <button onclick="closePayrollDetailsModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div id="payrollDetailsContent">
                <!-- Content loaded dynamically -->
            </div>
            
            <div class="flex space-x-3 mt-6">
                <button onclick="printPayslipFromModal()" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                    <i class="fas fa-print mr-2"></i>Print Payslip
                </button>
                <button onclick="closePayrollDetailsModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                    <i class="fas fa-times mr-2"></i>Close
                </button>
            </div>
        </div>
    </div>
    
    <script>
        let currentPayrollId = null;
        
        function openGenerateModal() {
            document.getElementById('generateModal').classList.remove('hidden');
            document.getElementById('generateModal').classList.add('flex');
            
            // Set default dates (current month)
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            document.getElementById('periodStart').value = firstDay.toISOString().split('T')[0];
            document.getElementById('periodEnd').value = lastDay.toISOString().split('T')[0];
        }
        
        function closeGenerateModal() {
            document.getElementById('generateModal').classList.add('hidden');
            document.getElementById('generateModal').classList.remove('flex');
            document.getElementById('generateForm').reset();
        }
        
        document.getElementById('generateForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                user_id: document.getElementById('generateUser').value,
                period_start: document.getElementById('periodStart').value,
                period_end: document.getElementById('periodEnd').value,
                deductions: document.getElementById('deductions').value
            };
            
            try {
                const response = await fetch('../../api/payroll.php?action=generate_payroll', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Payroll generated successfully!');
                    closeGenerateModal();
                    location.reload();
                } else {
                    alert('Error generating payroll: ' + result.message);
                }
            } catch (error) {
                alert('Error generating payroll: ' + error.message);
            }
        });
        
        async function viewPayroll(payrollId) {
            try {
                const response = await fetch(`../../api/payroll.php?action=get_payroll&id=${payrollId}`);
                const result = await response.json();
                
                if (result.success) {
                    currentPayrollId = payrollId;
                    displayPayrollDetails(result.payroll);
                    document.getElementById('payrollDetailsModal').classList.remove('hidden');
                    document.getElementById('payrollDetailsModal').classList.add('flex');
                } else {
                    alert('Error loading payroll: ' + result.message);
                }
            } catch (error) {
                alert('Error loading payroll: ' + error.message);
            }
        }
        
        function displayPayrollDetails(payroll) {
            const content = document.getElementById('payrollDetailsContent');
            
            content.innerHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500">Employee</p>
                            <p class="font-medium text-black">${payroll.full_name}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Period</p>
                            <p class="font-medium text-black">${new Date(payroll.period_start).toLocaleDateString()} - ${new Date(payroll.period_end).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Total Hours</p>
                            <p class="font-medium text-black">${payroll.total_hours}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Status</p>
                            <span class="px-3 py-1 rounded-full text-sm font-medium 
                                ${payroll.status === 'paid' ? 'bg-green-100 text-green-700' : (payroll.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700')}">
                                ${payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="border-t pt-4 space-y-2">
                        <div class="flex justify-between text-gray-600">
                            <span>Regular Hours:</span>
                            <span>${payroll.regular_hours}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                            <span>Overtime Hours:</span>
                            <span>${payroll.overtime_hours}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                            <span>Gross Pay:</span>
                            <span>₱${parseFloat(payroll.gross_pay).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                            <span>Deductions:</span>
                            <span>₱${parseFloat(payroll.deductions).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-xl font-bold text-black border-t pt-2">
                            <span>Net Pay:</span>
                            <span class="text-green-600">₱${parseFloat(payroll.net_pay).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        function closePayrollDetailsModal() {
            document.getElementById('payrollDetailsModal').classList.add('hidden');
            document.getElementById('payrollDetailsModal').classList.remove('flex');
            currentPayrollId = null;
        }
        
        async function approvePayroll(payrollId) {
            try {
                const response = await fetch('../../api/payroll.php?action=update_status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        payroll_id: payrollId,
                        status: 'approved'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Payroll approved!');
                    location.reload();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function markAsPaid(payrollId) {
            try {
                const response = await fetch('../../api/payroll.php?action=update_status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        payroll_id: payrollId,
                        status: 'paid'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Payroll marked as paid!');
                    location.reload();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        function printPayslip(payrollId) {
            viewPayroll(payrollId).then(() => {
                printPayslipFromModal();
            });
        }
        
        function printPayslipFromModal() {
            if (!currentPayrollId) return;
            
            const content = document.getElementById('payrollDetailsContent').innerHTML;
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Payslip</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 10px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Sip Station</h1>
                        <p>Payslip</p>
                    </div>
                    ${content}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    </script>
</body>
</html>
