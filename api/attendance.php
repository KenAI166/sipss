<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'time_in':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');
        
        // Check if already timed in today
        $stmt = $db->prepare("SELECT id FROM attendance WHERE user_id = ? AND date = ?");
        $stmt->execute([$_SESSION['user_id'], $today]);
        
        if ($stmt->fetch()) {
            jsonResponse(['success' => false, 'message' => 'You have already timed in today']);
        }
        
        try {
            $stmt = $db->prepare("INSERT INTO attendance (user_id, date, time_in, status) VALUES (?, ?, ?, 'pending')");
            $stmt->execute([$_SESSION['user_id'], $today, $currentTime]);
            
            jsonResponse(['success' => true, 'message' => 'Time in recorded']);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Time in failed: ' . $e->getMessage()]);
        }
        
    case 'time_out':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');
        
        // Get today's attendance
        $stmt = $db->prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?");
        $stmt->execute([$_SESSION['user_id'], $today]);
        $attendance = $stmt->fetch();
        
        if (!$attendance) {
            jsonResponse(['success' => false, 'message' => 'You have not timed in today']);
        }
        
        if ($attendance['time_out']) {
            jsonResponse(['success' => false, 'message' => 'You have already timed out today']);
        }
        
        try {
            // Calculate total hours
            $timeIn = strtotime($attendance['time_in']);
            $timeOut = strtotime($currentTime);
            $totalHours = round(($timeOut - $timeIn) / 3600, 2);
            
            $stmt = $db->prepare("UPDATE attendance SET time_out = ?, total_hours = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$currentTime, $totalHours, $attendance['id']]);
            
            jsonResponse(['success' => true, 'message' => 'Time out recorded', 'total_hours' => $totalHours]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Time out failed: ' . $e->getMessage()]);
        }
        
    case 'get_attendance':
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
        
        // If not owner/manager, only show own attendance
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM attendance $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get attendance
        $stmt = $db->prepare("SELECT a.*, u.full_name FROM attendance a JOIN users u ON a.user_id = u.id $where ORDER BY a.date DESC, a.time_in DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $attendance = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'attendance' => $attendance,
            'pagination' => $pagination
        ]);
        
    case 'update_status':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        $attendanceId = intval($data['attendance_id'] ?? 0);
        $status = $data['status'] ?? 'pending';
        
        if ($attendanceId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid attendance ID'], 400);
        }
        
        if (!in_array($status, ['pending', 'approved', 'rejected'])) {
            jsonResponse(['success' => false, 'message' => 'Invalid status'], 400);
        }
        
        try {
            $stmt = $db->prepare("UPDATE attendance SET status = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $attendanceId]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Update failed: ' . $e->getMessage()]);
        }
        
    case 'get_attendance_summary':
        $userId = $_GET['user_id'] ?? $_SESSION['user_id'];
        $period = $_GET['period'] ?? 'month';
        
        switch ($period) {
            case 'week':
                $dateCondition = "date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $dateCondition = "date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
            case 'year':
                $dateCondition = "date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
                break;
            default:
                $dateCondition = "1=1";
        }
        
        // If not owner/manager, only show own summary
        if (!hasRole(['owner', 'manager'])) {
            $userId = $_SESSION['user_id'];
        }
        
        $stmt = $db->prepare("SELECT 
            COUNT(*) as total_days,
            COALESCE(SUM(total_hours), 0) as total_hours,
            COALESCE(AVG(total_hours), 0) as avg_hours
            FROM attendance WHERE user_id = ? AND $dateCondition");
        $stmt->execute([$userId]);
        $summary = $stmt->fetch();
        
        jsonResponse(['success' => true, 'summary' => $summary]);
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
