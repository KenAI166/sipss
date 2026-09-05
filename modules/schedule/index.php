<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();

$db = getDB();

// Get current week dates
$monday = date('Y-m-d', strtotime('monday this week'));
$sunday = date('Y-m-d', strtotime('sunday this week'));

// Get schedules for current week
$stmt = $db->prepare("SELECT s.*, u.full_name FROM schedules s JOIN users u ON s.user_id = u.id WHERE s.date BETWEEN ? AND ? ORDER BY s.date, s.shift_start");
$stmt->execute([$monday, $sunday]);
$schedules = $stmt->fetchAll();

// Get all users for scheduling
$stmt = $db->prepare("SELECT id, full_name FROM users WHERE is_active = TRUE ORDER BY full_name");
$stmt->execute();
$users = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedule - Sip Station</title>
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
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-calendar-alt"></i>
                            <span class="font-medium">Schedule</span>
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
                        <h1 class="text-3xl font-bold text-black">Schedule Management</h1>
                        <p class="text-gray-600">Manage employee schedules</p>
                    </div>
                    <?php if (hasRole(['owner', 'manager'])): ?>
                    <button onclick="openModal()" class="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-plus mr-2"></i>Add Schedule
                    </button>
                    <?php endif; ?>
                </div>
                
                <!-- Week Navigation -->
                <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div class="flex items-center justify-between">
                        <button onclick="changeWeek(-1)" class="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-chevron-left mr-2"></i>Previous Week
                        </button>
                        <div class="text-center">
                            <h2 class="text-xl font-bold text-black" id="weekRange">
                                <?php echo date('F d', strtotime($monday)) . ' - ' . date('F d, Y', strtotime($sunday)); ?>
                            </h2>
                        </div>
                        <button onclick="changeWeek(1)" class="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded-lg transition">
                            Next Week<i class="fas fa-chevron-right ml-2"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Weekly Schedule Grid -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Employee</th>
                                    <?php for ($i = 0; $i < 7; $i++): 
                                        $dayDate = date('Y-m-d', strtotime($monday . " +$i days"));
                                        $dayName = date('D', strtotime($dayDate));
                                    ?>
                                    <th class="px-4 py-3 text-center font-medium">
                                        <?php echo $dayName; ?><br>
                                        <span class="text-xs"><?php echo date('M d', strtotime($dayDate)); ?></span>
                                    </th>
                                    <?php endfor; ?>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($users as $user): ?>
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="px-4 py-3 font-medium text-black"><?php echo htmlspecialchars($user['full_name']); ?></td>
                                    <?php for ($i = 0; $i < 7; $i++): 
                                        $dayDate = date('Y-m-d', strtotime($monday . " +$i days"));
                                        $userSchedule = null;
                                        foreach ($schedules as $schedule) {
                                            if ($schedule['user_id'] == $user['id'] && $schedule['date'] == $dayDate) {
                                                $userSchedule = $schedule;
                                                break;
                                            }
                                        }
                                    ?>
                                    <td class="px-4 py-3 text-center">
                                        <?php if ($userSchedule): ?>
                                        <div class="bg-green-100 rounded-lg p-2">
                                            <p class="text-sm font-medium text-green-700"><?php echo date('H:i', strtotime($userSchedule['shift_start'])); ?> - <?php echo date('H:i', strtotime($userSchedule['shift_end'])); ?></p>
                                            <?php if (hasRole(['owner', 'manager'])): ?>
                                            <button onclick="editSchedule(<?php echo $userSchedule['id']; ?>)" class="text-blue-500 hover:text-blue-700 text-xs mt-1">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteSchedule(<?php echo $userSchedule['id']; ?>)" class="text-red-500 hover:text-red-700 text-xs ml-1">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <?php endif; ?>
                                        </div>
                                        <?php else: ?>
                                        <?php if (hasRole(['owner', 'manager'])): ?>
                                        <button onclick="addSchedule(<?php echo $user['id']; ?>, '<?php echo $dayDate; ?>')" class="text-gray-400 hover:text-green-500">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <?php else: ?>
                                        <span class="text-gray-400">-</span>
                                        <?php endif; ?>
                                        <?php endif; ?>
                                    </td>
                                    <?php endfor; ?>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <!-- Schedule Modal -->
    <div id="scheduleModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black" id="modalTitle">Add Schedule</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="scheduleForm">
                <input type="hidden" id="scheduleId">
                
                <div class="space-y-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Employee *</label>
                        <select id="scheduleUser" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <?php foreach ($users as $user): ?>
                            <option value="<?php echo $user['id']; ?>"><?php echo htmlspecialchars($user['full_name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Date *</label>
                        <input type="date" id="scheduleDate" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Shift Start *</label>
                        <input type="time" id="shiftStart" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Shift End *</label>
                        <input type="time" id="shiftEnd" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Notes</label>
                        <textarea id="scheduleNotes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-save mr-2"></i>Save Schedule
                    </button>
                    <button type="button" onclick="closeModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let currentMonday = '<?php echo $monday; ?>';
        
        function changeWeek(direction) {
            const newMonday = new Date(currentMonday);
            newMonday.setDate(newMonday.getDate() + (direction * 7));
            currentMonday = newMonday.toISOString().split('T')[0];
            
            window.location.href = `index.php?week=${currentMonday}`;
        }
        
        function openModal(scheduleId = null) {
            document.getElementById('scheduleModal').classList.remove('hidden');
            document.getElementById('scheduleModal').classList.add('flex');
            
            if (scheduleId) {
                document.getElementById('modalTitle').textContent = 'Edit Schedule';
                loadSchedule(scheduleId);
            } else {
                document.getElementById('modalTitle').textContent = 'Add Schedule';
                document.getElementById('scheduleForm').reset();
                document.getElementById('scheduleId').value = '';
                document.getElementById('scheduleDate').value = currentMonday;
            }
        }
        
        function closeModal() {
            document.getElementById('scheduleModal').classList.add('hidden');
            document.getElementById('scheduleModal').classList.remove('flex');
            document.getElementById('scheduleForm').reset();
        }
        
        function addSchedule(userId, date) {
            document.getElementById('scheduleUser').value = userId;
            document.getElementById('scheduleDate').value = date;
            openModal();
        }
        
        async function loadSchedule(scheduleId) {
            try {
                const response = await fetch(`../../api/schedule.php?action=get_schedule&id=${scheduleId}`);
                const result = await response.json();
                
                if (result.success) {
                    const schedule = result.schedule;
                    document.getElementById('scheduleId').value = schedule.id;
                    document.getElementById('scheduleUser').value = schedule.user_id;
                    document.getElementById('scheduleDate').value = schedule.date;
                    document.getElementById('shiftStart').value = schedule.shift_start;
                    document.getElementById('shiftEnd').value = schedule.shift_end;
                    document.getElementById('scheduleNotes').value = schedule.notes || '';
                } else {
                    alert('Error loading schedule: ' + result.message);
                }
            } catch (error) {
                alert('Error loading schedule: ' + error.message);
            }
        }
        
        function editSchedule(scheduleId) {
            openModal(scheduleId);
        }
        
        document.getElementById('scheduleForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const scheduleId = document.getElementById('scheduleId').value;
            const data = {
                user_id: document.getElementById('scheduleUser').value,
                date: document.getElementById('scheduleDate').value,
                shift_start: document.getElementById('shiftStart').value,
                shift_end: document.getElementById('shiftEnd').value,
                notes: document.getElementById('scheduleNotes').value
            };
            
            const action = scheduleId ? 'update_schedule' : 'create_schedule';
            const url = `../../api/schedule.php?action=${action}${scheduleId ? '&id=' + scheduleId : ''}`;
            
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
                    alert('Schedule saved successfully!');
                    closeModal();
                    location.reload();
                } else {
                    alert('Error saving schedule: ' + result.message);
                }
            } catch (error) {
                alert('Error saving schedule: ' + error.message);
            }
        });
        
        async function deleteSchedule(scheduleId) {
            if (!confirm('Are you sure you want to delete this schedule?')) {
                return;
            }
            
            try {
                const response = await fetch(`../../api/schedule.php?action=delete_schedule&id=${scheduleId}`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Schedule deleted successfully!');
                    location.reload();
                } else {
                    alert('Error deleting schedule: ' + result.message);
                }
            } catch (error) {
                alert('Error deleting schedule: ' + error.message);
            }
        }
    </script>
</body>
</html>
