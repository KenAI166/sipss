<?php
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

requireLogin();

$db = getDB();

// Get documents
$where = "WHERE 1=1";
$params = [];

if (!hasRole(['owner', 'manager'])) {
    $where .= " AND uploaded_by = ?";
    $params[] = $_SESSION['user_id'];
}

$stmt = $db->prepare("SELECT d.*, u.full_name FROM documents d JOIN users u ON d.uploaded_by = u.id $where ORDER BY d.created_at DESC LIMIT 20");
$stmt->execute($params);
$documents = $stmt->fetchAll();

// Get document categories
$stmt = $db->prepare("SELECT DISTINCT category FROM documents ORDER BY category");
$stmt->execute();
$categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documents - Sip Station</title>
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
                        <a href="index.php" class="flex items-center space-x-3 px-4 py-3 bg-green-500 text-black rounded-lg">
                            <i class="fas fa-folder"></i>
                            <span class="font-medium">Documents</span>
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
                        <h1 class="text-3xl font-bold text-black">Document Management</h1>
                        <p class="text-gray-600">Store and manage business documents</p>
                    </div>
                    <button onclick="openModal()" class="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-upload mr-2"></i>Upload Document
                    </button>
                </div>
                
                <!-- Documents Grid -->
                <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div class="flex items-center space-x-4 mb-4">
                        <select id="categoryFilter" class="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">All Categories</option>
                            <?php foreach ($categories as $category): ?>
                            <option value="<?php echo htmlspecialchars($category); ?>"><?php echo htmlspecialchars($category); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <input type="text" id="searchInput" placeholder="Search documents..." class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="documentsGrid">
                        <?php foreach ($documents as $document): ?>
                        <div class="document-card bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition cursor-pointer"
                             data-category="<?php echo htmlspecialchars($document['category']); ?>"
                             data-title="<?php echo htmlspecialchars($document['title']); ?>">
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-file text-green-500 text-xl"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-black truncate"><?php echo htmlspecialchars($document['title']); ?></p>
                                    <p class="text-sm text-gray-500 truncate"><?php echo htmlspecialchars($document['category']); ?></p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between text-sm text-gray-500">
                                <span><?php echo date('M d, Y', strtotime($document['created_at'])); ?></span>
                                <span><?php echo htmlspecialchars($document['full_name']); ?></span>
                            </div>
                            <div class="flex items-center space-x-2 mt-3">
                                <button onclick="downloadDocument(<?php echo $document['id']; ?>)" class="flex-1 bg-green-500 hover:bg-green-600 text-black text-sm py-2 px-3 rounded transition">
                                    <i class="fas fa-download mr-1"></i>Download
                                </button>
                                <button onclick="deleteDocument(<?php echo $document['id']; ?>)" class="bg-red-500 hover:bg-red-600 text-black text-sm py-2 px-3 rounded transition">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <!-- Upload Modal -->
    <div id="uploadModal" class="fixed inset-0 bg-white bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-black">Upload Document</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-black">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="uploadForm">
                <div class="space-y-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Title *</label>
                        <input type="text" id="documentTitle" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">Category *</label>
                        <input type="text" id="documentCategory" required list="categoryList" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                        <datalist id="categoryList">
                            <?php foreach ($categories as $category): ?>
                            <option value="<?php echo htmlspecialchars($category); ?>">
                            <?php endforeach; ?>
                            <option value="Policies">
                            <option value="Reports">
                            <option value="Invoices">
                            <option value="Contracts">
                            <option value="Other">
                        </datalist>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-black mb-1">File *</label>
                        <input type="file" id="documentFile" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-upload mr-2"></i>Upload
                    </button>
                    <button type="button" onclick="closeModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-4 rounded-lg transition">
                        <i class="fas fa-times mr-2"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        const categoryFilter = document.getElementById('categoryFilter');
        const searchInput = document.getElementById('searchInput');
        
        categoryFilter.addEventListener('change', filterDocuments);
        searchInput.addEventListener('input', filterDocuments);
        
        function filterDocuments() {
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            
            const cards = document.querySelectorAll('.document-card');
            
            cards.forEach(card => {
                const cardCategory = card.dataset.category;
                const cardTitle = card.dataset.title.toLowerCase();
                
                const matchesCategory = !category || cardCategory === category;
                const matchesSearch = !searchTerm || cardTitle.includes(searchTerm);
                
                card.style.display = matchesCategory && matchesSearch ? 'block' : 'none';
            });
        }
        
        function openModal() {
            document.getElementById('uploadModal').classList.remove('hidden');
            document.getElementById('uploadModal').classList.add('flex');
            document.getElementById('uploadForm').reset();
        }
        
        function closeModal() {
            document.getElementById('uploadModal').classList.add('hidden');
            document.getElementById('uploadModal').classList.remove('flex');
            document.getElementById('uploadForm').reset();
        }
        
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('documentTitle').value);
            formData.append('category', document.getElementById('documentCategory').value);
            formData.append('file', document.getElementById('documentFile').files[0]);
            
            try {
                const response = await fetch('../../api/documents.php?action=upload_document', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Document uploaded successfully!');
                    closeModal();
                    location.reload();
                } else {
                    alert('Error uploading document: ' + result.message);
                }
            } catch (error) {
                alert('Error uploading document: ' + error.message);
            }
        });
        
        function downloadDocument(documentId) {
            window.open(`../../api/documents.php?action=download_document&id=${documentId}`, '_blank');
        }
        
        async function deleteDocument(documentId) {
            if (!confirm('Are you sure you want to delete this document?')) {
                return;
            }
            
            try {
                const response = await fetch(`../../api/documents.php?action=delete_document&id=${documentId}`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Document deleted successfully!');
                    location.reload();
                } else {
                    alert('Error deleting document: ' + result.message);
                }
            } catch (error) {
                alert('Error deleting document: ' + error.message);
            }
        }
    </script>
</body>
</html>
