<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'send_message':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['receiver_id']) || empty($data['content'])) {
            jsonResponse(['success' => false, 'message' => 'Missing required fields'], 400);
        }
        
        try {
            $stmt = $db->prepare("INSERT INTO messages (sender_id, receiver_id, subject, content) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $_SESSION['user_id'],
                $data['receiver_id'],
                $data['subject'] ?? null,
                $data['content']
            ]);
            
            jsonResponse(['success' => true, 'message_id' => $db->lastInsertId()]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Message sending failed: ' . $e->getMessage()]);
        }
        
    case 'get_message':
        $messageId = intval($_GET['id'] ?? 0);
        
        if ($messageId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid message ID'], 400);
        }
        
        $stmt = $db->prepare("SELECT m.*, 
            s.full_name as sender_name,
            r.full_name as receiver_name,
            CASE WHEN m.sender_id = ? THEN 'sent' ELSE 'received' END as direction
            FROM messages m 
            JOIN users s ON m.sender_id = s.id 
            JOIN users r ON m.receiver_id = r.id 
            WHERE m.id = ? AND (m.sender_id = ? OR m.receiver_id = ?)");
        $stmt->execute([$_SESSION['user_id'], $messageId, $_SESSION['user_id'], $_SESSION['user_id']]);
        $message = $stmt->fetch();
        
        if ($message) {
            jsonResponse(['success' => true, 'message' => $message]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Message not found'], 404);
        }
        
    case 'get_messages':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE (sender_id = ? OR receiver_id = ?)";
        $params = [$_SESSION['user_id'], $_SESSION['user_id']];
        
        if (isset($_GET['is_read'])) {
            $where .= " AND is_read = ?";
            $params[] = $_GET['is_read'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM messages $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get messages
        $stmt = $db->prepare("SELECT m.*, 
            s.full_name as sender_name,
            r.full_name as receiver_name,
            CASE WHEN m.sender_id = ? THEN 'sent' ELSE 'received' END as direction
            FROM messages m 
            JOIN users s ON m.sender_id = s.id 
            JOIN users r ON m.receiver_id = r.id 
            $where 
            ORDER BY m.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute(array_merge([$_SESSION['user_id']], $params));
        $messages = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'messages' => $messages,
            'pagination' => $pagination
        ]);
        
    case 'mark_as_read':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $messageId = intval($data['message_id'] ?? 0);
        
        if ($messageId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid message ID'], 400);
        }
        
        try {
            $stmt = $db->prepare("UPDATE messages SET is_read = TRUE, updated_at = NOW() WHERE id = ? AND receiver_id = ?");
            $stmt->execute([$messageId, $_SESSION['user_id']]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Update failed: ' . $e->getMessage()]);
        }
        
    case 'delete_message':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $messageId = intval($_GET['id'] ?? 0);
        
        if ($messageId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid message ID'], 400);
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)");
            $stmt->execute([$messageId, $_SESSION['user_id'], $_SESSION['user_id']]);
            
            if ($stmt->rowCount() > 0) {
                jsonResponse(['success' => true]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Message not found or unauthorized']);
            }
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Message deletion failed: ' . $e->getMessage()]);
        }
        
    case 'get_unread_count':
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE");
        $stmt->execute([$_SESSION['user_id']]);
        $count = $stmt->fetch()['count'];
        
        jsonResponse(['success' => true, 'count' => $count]);
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
