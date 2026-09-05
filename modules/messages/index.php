<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();

$db = getDB();

// Get messages
$where = "WHERE 1=1";
$params = [];

// Show sent and received messages
$where .= " AND (sender_id = ? OR receiver_id = ?)";
$params[] = $_SESSION['user_id'];
$params[] = $_SESSION['user_id'];

$stmt = $db->prepare("SELECT m.*, 
    s.full_name as sender_name,
    r.full_name as receiver_name,
    CASE WHEN m.sender_id = ? THEN 'sent' ELSE 'received' END as direction
    FROM messages m 
    JOIN users s ON m.sender_id = s.id 
    JOIN users r ON m.receiver_id = r.id 
    $where 
    ORDER BY m.created_at DESC LIMIT 20");
$params[] = $_SESSION['user_id'];
$stmt->execute($params);
$messages = $stmt->fetchAll();

// Get unread count
$stmt = $db->prepare("SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE");
$stmt->execute([$_SESSION['user_id']]);
$unreadCount = $stmt->fetch()['count'];

// Get all users for composing
$stmt = $db->prepare("SELECT id, full_name FROM users WHERE is_active = TRUE AND id != ? ORDER BY full_name");
$stmt->execute([$_SESSION['user_id']]);
$users = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Messages - Sip Station</title>
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
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-envelope"></i>
                            <span class="font-medium">Messages</span>
                            <?php if ($unreadCount > 0): ?>
                            <span class="ml-auto bg-red-500 text-black text-xs px-2 py-1 rounded-full"><?php echo $unreadCount; ?></span>
                            <?php endif; ?>
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
                        <h1 class="text-3xl font-bold text-black">Messages</h1>
                        <p class="text-gray-600">Internal communication system</p>
                    </div>
                    <button onclick="openComposeModal()" class="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-plus mr-2"></i>Compose Message
                    </button>
                </div>
                
                <!-- Messages List -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-green-500 text-black">
                                <tr>
                                    <th class="px-6 py-4 text-left font-medium">From/To</th>
                                    <th class="px-6 py-4 text-left font-medium">Subject</th>
                                    <th class="px-6 py-4 text-left font-medium">Date</th>
                                    <th class="px-6 py-4 text-left font-medium">Status</th>
                                    <th class="px-6 py-4 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($messages as $message): ?>
                                <tr class="border-b hover:bg-gray-50 <?php echo $message['direction'] === 'received' && !$message['is_read'] ? 'bg-blue-50' : ''; ?>">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <i class="fas fa-user text-green-500"></i>
                                            </div>
                                            <div>
                                                <p class="font-medium text-black">
                                                    <?php echo $message['direction'] === 'sent' ? 'To: ' . htmlspecialchars($message['receiver_name']) : 'From: ' . htmlspecialchars($message['sender_name']); ?>
                                                </p>
                                                <p class="text-sm text-gray-500"><?php echo $message['direction'] === 'sent' ? 'Sent' : 'Received'; ?></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="font-medium text-black <?php echo $message['direction'] === 'received' && !$message['is_read'] ? 'font-bold' : ''; ?>">
                                            <?php echo htmlspecialchars($message['subject'] ?: '(No subject)'); ?>
                                        </p>
                                        <p class="text-sm text-gray-500 truncate max-w-xs"><?php echo htmlspecialchars(substr($message['content'], 0, 50)); ?>...</p>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600"><?php echo date('M d, Y H:i', strtotime($message['created_at'])); ?></td>
                                    <td class="px-6 py-4">
                                        <?php if ($message['direction'] === 'received'): ?>
                                        <span class="px-3 py-1 rounded-full text-sm font-medium <?php echo $message['is_read'] ? 'bg-white text-black' : 'bg-blue-100 text-blue-700'; ?>">
                                            <?php echo $message['is_read'] ? 'Read' : 'Unread'; ?>
                                        </span>
                                        <?php else: ?>
                                        <span class="px-3 py-1 rounded-full text-sm font-medium bg-white text-black">Sent</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="viewMessage(<?php echo $message['id']; ?>)" class="text-blue-500 hover:text-blue-700" title="View">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <?php if ($message['direction'] === 'received' && !$message['is_read']): ?>
                                            <button onclick="markAsRead(<?php echo $message['id']; ?>)" class="text-green-500 hover:text-green-700" title="Mark as Read">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <?php endif; ?>
                                            <button onclick="deleteMessage(<?php echo $message['id']; ?>)" class="text-red-500 hover:text-red-700" title="Delete">
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
    
    <!-- Compose Modal -->
    <div id="composeModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Compose Message</h2>
                <button onclick="closeComposeModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="composeForm">
                <div class="space-y-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">To *</label>
                        <select id="messageReceiver" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <?php foreach ($users as $user): ?>
                            <option value="<?php echo $user['id']; ?>"><?php echo htmlspecialchars($user['full_name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Subject</label>
                        <input type="text" id="messageSubject" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Message *</label>
                        <textarea id="messageContent" rows="5" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-paper-plane mr-2"></i>Send
                    </button>
                    <button type="button" onclick="closeComposeModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- View Message Modal -->
    <div id="viewMessageModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Message</h2>
                <button onclick="closeViewMessageModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div id="messageContent">
                <!-- Content loaded dynamically -->
            </div>
            
            <div class="flex space-x-3 mt-6">
                <button onclick="closeViewMessageModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                    <i class="fas fa-times mr-2"></i>Close
                </button>
            </div>
        </div>
    </div>
    
    <script>
        function openComposeModal() {
            document.getElementById('composeModal').classList.remove('hidden');
            document.getElementById('composeModal').classList.add('flex');
            document.getElementById('composeForm').reset();
        }
        
        function closeComposeModal() {
            document.getElementById('composeModal').classList.add('hidden');
            document.getElementById('composeModal').classList.remove('flex');
            document.getElementById('composeForm').reset();
        }
        
        document.getElementById('composeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                receiver_id: document.getElementById('messageReceiver').value,
                subject: document.getElementById('messageSubject').value,
                content: document.getElementById('messageContent').value
            };
            
            try {
                const response = await fetch('../../api/messages.php?action=send_message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Message sent successfully!');
                    closeComposeModal();
                    location.reload();
                } else {
                    alert('Error sending message: ' + result.message);
                }
            } catch (error) {
                alert('Error sending message: ' + error.message);
            }
        });
        
        async function viewMessage(messageId) {
            try {
                const response = await fetch(`../../api/messages.php?action=get_message&id=${messageId}`);
                const result = await response.json();
                
                if (result.success) {
                    displayMessage(result.message);
                    document.getElementById('viewMessageModal').classList.remove('hidden');
                    document.getElementById('viewMessageModal').classList.add('flex');
                    
                    // Mark as read if received
                    if (result.message.direction === 'received' && !result.message.is_read) {
                        markAsRead(messageId);
                    }
                } else {
                    alert('Error loading message: ' + result.message);
                }
            } catch (error) {
                alert('Error loading message: ' + error.message);
            }
        }
        
        function displayMessage(message) {
            const content = document.getElementById('messageContent');
            
            content.innerHTML = `
                <div class="space-y-4">
                    <div class="flex items-center justify-between border-b pb-4">
                        <div>
                            <p class="text-sm text-gray-500">${message.direction === 'sent' ? 'To' : 'From'}</p>
                            <p class="font-medium text-black">${message.direction === 'sent' ? message.receiver_name : message.sender_name}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Date</p>
                            <p class="font-medium text-black">${new Date(message.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Subject</p>
                        <p class="font-bold text-black">${message.subject || '(No subject)'}</p>
                    </div>
                    
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Message</p>
                        <p class="text-black whitespace-pre-wrap">${message.content}</p>
                    </div>
                </div>
            `;
        }
        
        function closeViewMessageModal() {
            document.getElementById('viewMessageModal').classList.add('hidden');
            document.getElementById('viewMessageModal').classList.remove('flex');
        }
        
        async function markAsRead(messageId) {
            try {
                const response = await fetch('../../api/messages.php?action=mark_as_read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message_id: messageId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    location.reload();
                }
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
        
        async function deleteMessage(messageId) {
            if (!confirm('Are you sure you want to delete this message?')) {
                return;
            }
            
            try {
                const response = await fetch(`../../api/messages.php?action=delete_message&id=${messageId}`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Message deleted successfully!');
                    location.reload();
                } else {
                    alert('Error deleting message: ' + result.message);
                }
            } catch (error) {
                alert('Error deleting message: ' + error.message);
            }
        }
    </script>
</body>
</html>
