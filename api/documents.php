<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'upload_document':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        if (empty($_POST['title']) || empty($_POST['category']) || empty($_FILES['file'])) {
            jsonResponse(['success' => false, 'message' => 'Missing required fields'], 400);
        }
        
        try {
            // Handle file upload
            $uploadResult = uploadFile($_FILES['file'], UPLOAD_PATH . 'documents/');
            
            if (!$uploadResult['success']) {
                jsonResponse(['success' => false, 'message' => $uploadResult['message']]);
            }
            
            $filePath = 'uploads/documents/' . $uploadResult['filename'];
            
            $stmt = $db->prepare("INSERT INTO documents (title, category, file_path, uploaded_by) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $_POST['title'],
                $_POST['category'],
                $filePath,
                $_SESSION['user_id']
            ]);
            
            jsonResponse(['success' => true, 'document_id' => $db->lastInsertId()]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Document upload failed: ' . $e->getMessage()]);
        }
        
    case 'get_documents':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if (isset($_GET['category'])) {
            $where .= " AND category = ?";
            $params[] = $_GET['category'];
        }
        
        // If not owner/manager, only show own documents
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND uploaded_by = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM documents $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get documents
        $stmt = $db->prepare("SELECT d.*, u.full_name FROM documents d JOIN users u ON d.uploaded_by = u.id $where ORDER BY d.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $documents = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'documents' => $documents,
            'pagination' => $pagination
        ]);
        
    case 'download_document':
        $documentId = intval($_GET['id'] ?? 0);
        
        if ($documentId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid document ID'], 400);
        }
        
        $where = "WHERE id = ?";
        $params = [$documentId];
        
        // If not owner/manager, only can download own documents
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND uploaded_by = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        $stmt = $db->prepare("SELECT * FROM documents $where");
        $stmt->execute($params);
        $document = $stmt->fetch();
        
        if (!$document) {
            jsonResponse(['success' => false, 'message' => 'Document not found'], 404);
        }
        
        $filePath = UPLOAD_PATH . 'documents/' . basename($document['file_path']);
        
        if (!file_exists($filePath)) {
            jsonResponse(['success' => false, 'message' => 'File not found'], 404);
        }
        
        // Serve file for download
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $document['title'] . '"');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
        
    case 'delete_document':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $documentId = intval($_GET['id'] ?? 0);
        
        if ($documentId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid document ID'], 400);
        }
        
        $where = "WHERE id = ?";
        $params = [$documentId];
        
        // If not owner/manager, only can delete own documents
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND uploaded_by = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        try {
            // Get document info
            $stmt = $db->prepare("SELECT * FROM documents $where");
            $stmt->execute($params);
            $document = $stmt->fetch();
            
            if (!$document) {
                jsonResponse(['success' => false, 'message' => 'Document not found or unauthorized']);
            }
            
            // Delete file
            $filePath = UPLOAD_PATH . 'documents/' . basename($document['file_path']);
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            
            // Delete database record
            $stmt = $db->prepare("DELETE FROM documents WHERE id = ?");
            $stmt->execute([$documentId]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Document deletion failed: ' . $e->getMessage()]);
        }
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
