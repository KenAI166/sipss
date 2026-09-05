<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();

$db = getDB();

// Get today's attendance for current user
$today = date('Y-m-d');
$stmt = $db->prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?");
$stmt->execute([$_SESSION['user_id'], $today]);
$todayAttendance = $stmt->fetch();

// Get attendance history
$stmt = $db->prepare("SELECT a.*, u.full_name FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = ? ORDER BY a.date DESC LIMIT 30");
$stmt->execute([$_SESSION['user_id']]);
$attendanceHistory = $stmt->fetchAll();

// Get all attendance for managers/owners
$allAttendance = [];
if (hasRole(['owner', 'manager'])) {
    $stmt = $db->prepare("SELECT a.*, u.full_name FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC, a.time_in DESC LIMIT 50");
    $stmt->execute();
    $allAttendance = $stmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance - Sip Station</title>
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
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-clock"></i>
                            <span class="font-medium">Attendance</span>
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
                        <h1 class="text-3xl font-bold text-black">Attendance Management</h1>
                        <p class="text-gray-600">Track employee time in/out</p>
                    </div>
                </div>
                
                <!-- Time In/Out Card -->
                <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h2 class="text-xl font-bold text-black">Today's Attendance</h2>
                            <p class="text-gray-600"><?php echo date('F d, Y'); ?></p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Current Time</p>
                            <p class="text-2xl font-bold text-black" id="currentTime"><?php echo date('H:i:s'); ?></p>
                        </div>
                    </div>
                    
                    <?php if ($todayAttendance): ?>
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-green-50 rounded-lg p-4">
                            <p class="text-sm text-gray-500">Time In</p>
                            <p class="text-xl font-bold text-green-600"><?php echo $todayAttendance['time_in'] ? date('H:i', strtotime($todayAttendance['time_in'])) : 'Not recorded'; ?></p>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-4">
                            <p class="text-sm text-gray-500">Time Out</p>
                            <p class="text-xl font-bold text-blue-600"><?php echo $todayAttendance['time_out'] ? date('H:i', strtotime($todayAttendance['time_out'])) : 'Not recorded'; ?></p>
                        </div>
                    </div>
                    
                    <?php if (!$todayAttendance['time_out']): ?>
                    <button onclick="timeOut()" class="w-full bg-red-500 hover:bg-red-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-sign-out-alt mr-2"></i>Time Out
                    </button>
                    <?php else: ?>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <p class="text-gray-600">You have already timed out for today</p>
                        <p class="font-bold text-black">Total Hours: <?php echo $todayAttendance['total_hours']; ?></p>
                    </div>
                    <?php endif; ?>
                    <?php else: ?>
                    <button onclick="timeIn()" class="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-sign-in-alt mr-2"></i>Time In
                    </button>
                    <?php endif; ?>
                </div>
                
                <!-- QR Code Section -->
                <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 class="text-xl font-bold text-black mb-4">Your QR Code</h2>
                    <div class="flex items-center space-x-6">
                        <div class="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                            <i class="fas fa-qrcode text-6xl text-gray-400"></i>
                        </div>
                        <div>
                            <p class="text-gray-600 mb-2">Scan this QR code to quickly check in</p>
                            <p class="text-sm text-gray-500">Employee ID: <?php echo $_SESSION['user_id']; ?></p>
                            <p class="text-sm text-gray-500">Username: <?php echo htmlspecialchars($_SESSION['username']); ?></p>
                        </div>
                    </div>
                </div>
                
                <!-- Attendance History -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 border-b">
                        <h2 class="text-xl font-bold text-black">Attendance History</h2>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">Date</th>
                                    <th class="px-6 py-4 text-left font-medium">Time In</th>
                                    <th class="px-6 py-4 text-left font-medium">Time Out</th>
                                    <th class="px-6 py-4 text-left font-medium">Total Hours</th>
                                    <th class="px-6 py-4 text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($attendanceHistory as $attendance): ?>
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-6 py-4 text-gray-600"><?php echo date('M d, Y', strtotime($attendance['date'])); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $attendance['time_in'] ? date('H:i', strtotime($attendance['time_in'])) : '-'; ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $attendance['time_out'] ? date('H:i', strtotime($attendance['time_out'])) : '-'; ?></td>
                                    <td class="px-6 py-4 font-medium text-black"><?php echo $attendance['total_hours'] ?: '-'; ?></td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 rounded-full text-sm font-medium 
                                            <?php echo $attendance['status'] === 'approved' ? 'bg-green-100 text-green-700' : ($attendance['status'] === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'); ?>">
                                            <?php echo ucfirst($attendance['status']); ?>
                                        </span>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <?php if (hasRole(['owner', 'manager'])): ?>
                <!-- All Employees Attendance -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden mt-8">
                    <div class="p-4 border-b">
                        <h2 class="text-xl font-bold text-black">All Employees Attendance</h2>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">Employee</th>
                                    <th class="px-6 py-4 text-left font-medium">Date</th>
                                    <th class="px-6 py-4 text-left font-medium">Time In</th>
                                    <th class="px-6 py-4 text-left font-medium">Time Out</th>
                                    <th class="px-6 py-4 text-left font-medium">Total Hours</th>
                                    <th class="px-6 py-4 text-left font-medium">Status</th>
                                    <th class="px-6 py-4 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($allAttendance as $attendance): ?>
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-6 py-4 font-medium text-black"><?php echo htmlspecialchars($attendance['full_name']); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo date('M d, Y', strtotime($attendance['date'])); ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $attendance['time_in'] ? date('H:i', strtotime($attendance['time_in'])) : '-'; ?></td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo $attendance['time_out'] ? date('H:i', strtotime($attendance['time_out'])) : '-'; ?></td>
                                    <td class="px-6 py-4 font-medium text-black"><?php echo $attendance['total_hours'] ?: '-'; ?></td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 rounded-full text-sm font-medium 
                                            <?php echo $attendance['status'] === 'approved' ? 'bg-green-100 text-green-700' : ($attendance['status'] === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'); ?>">
                                            <?php echo ucfirst($attendance['status']); ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <?php if ($attendance['status'] === 'pending'): ?>
                                        <button onclick="approveAttendance(<?php echo $attendance['id']; ?>)" class="text-green-500 hover:text-green-700 mr-2" title="Approve">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button onclick="rejectAttendance(<?php echo $attendance['id']; ?>)" class="text-red-500 hover:text-red-700" title="Reject">
                                            <i class="fas fa-times"></i>
                                        </button>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </main>
    </div>
    
    <script>
        // Update current time
        setInterval(function() {
            document.getElementById('currentTime').textContent = new Date().toLocaleTimeString();
        }, 1000);
        
        async function timeIn() {
            if (!confirm('Are you sure you want to time in?')) {
                return;
            }
            
            try {
                const response = await fetch('../../api/attendance.php?action=time_in', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Time in recorded successfully!');
                    location.reload();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function timeOut() {
            if (!confirm('Are you sure you want to time out?')) {
                return;
            }
            
            try {
                const response = await fetch('../../api/attendance.php?action=time_out', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Time out recorded successfully!');
                    location.reload();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function approveAttendance(attendanceId) {
            try {
                const response = await fetch('../../api/attendance.php?action=update_status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        attendance_id: attendanceId,
                        status: 'approved'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Attendance approved!');
                    location.reload();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function rejectAttendance(attendanceId) {
            if (!confirm('Are you sure you want to reject this attendance?')) {
                return;
            }
            
            try {
                const response = await fetch('../../api/attendance.php?action=update_status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        attendance_id: attendanceId,
                        status: 'rejected'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Attendance rejected!');
                    location.reload();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    </script>
</body>
</html>
