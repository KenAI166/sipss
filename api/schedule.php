<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create_schedule':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['user_id']) || empty($data['date']) || empty($data['shift_start']) || empty($data['shift_end'])) {
            jsonResponse(['success' => false, 'message' => 'Missing required fields'], 400);
        }
        
        try {
            $stmt = $db->prepare("INSERT INTO schedules (user_id, date, shift_start, shift_end, notes) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['user_id'],
                $data['date'],
                $data['shift_start'],
                $data['shift_end'],
                $data['notes'] ?? null
            ]);
            
            jsonResponse(['success' => true, 'schedule_id' => $db->lastInsertId()]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Schedule creation failed: ' . $e->getMessage()]);
        }
        
    case 'update_schedule':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $scheduleId = intval($_GET['id'] ?? 0);
        
        if ($scheduleId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid schedule ID'], 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $stmt = $db->prepare("UPDATE schedules SET user_id = ?, date = ?, shift_start = ?, shift_end = ?, notes = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([
                $data['user_id'],
                $data['date'],
                $data['shift_start'],
                $data['shift_end'],
                $data['notes'] ?? null,
                $scheduleId
            ]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Schedule update failed: ' . $e->getMessage()]);
        }
        
    case 'get_schedule':
        $scheduleId = intval($_GET['id'] ?? 0);
        
        if ($scheduleId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid schedule ID'], 400);
        }
        
        $stmt = $db->prepare("SELECT * FROM schedules WHERE id = ?");
        $stmt->execute([$scheduleId]);
        $schedule = $stmt->fetch();
        
        if ($schedule) {
            jsonResponse(['success' => true, 'schedule' => $schedule]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Schedule not found'], 404);
        }
        
    case 'get_schedules':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if (isset($_GET['user_id'])) {
            $where .= " AND user_id = ?";
            $params[] = $_GET['user_id'];
        }
        
        if (isset($_GET['date_from'])) {
            $where .= " AND date >= ?";
            $params[] = $_GET['date_from'];
        }
        
        if (isset($_GET['date_to'])) {
            $where .= " AND date <= ?";
            $params[] = $_GET['date_to'];
        }
        
        // If not owner/manager, only show own schedules
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM schedules $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get schedules
        $stmt = $db->prepare("SELECT s.*, u.full_name FROM schedules s JOIN users u ON s.user_id = u.id $where ORDER BY s.date DESC, s.shift_start ASC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $schedules = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'schedules' => $schedules,
            'pagination' => $pagination
        ]);
        
    case 'delete_schedule':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $scheduleId = intval($_GET['id'] ?? 0);
        
        if ($scheduleId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid schedule ID'], 400);
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM schedules WHERE id = ?");
            $stmt->execute([$scheduleId]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Schedule deletion failed: ' . $e->getMessage()]);
        }
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
