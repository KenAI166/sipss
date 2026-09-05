<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'generate_payroll':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['user_id']) || empty($data['period_start']) || empty($data['period_end'])) {
            jsonResponse(['success' => false, 'message' => 'Missing required fields'], 400);
        }
        
        try {
            $db->beginTransaction();
            
            // Get user's hourly rate
            $stmt = $db->prepare("SELECT hourly_rate FROM users WHERE id = ?");
            $stmt->execute([$data['user_id']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                jsonResponse(['success' => false, 'message' => 'User not found'], 404);
            }
            
            $hourlyRate = $user['hourly_rate'];
            
            // Get attendance for the period
            $stmt = $db->prepare("SELECT SUM(total_hours) as total_hours FROM attendance WHERE user_id = ? AND date BETWEEN ? AND ? AND status = 'approved'");
            $stmt->execute([$data['user_id'], $data['period_start'], $data['period_end']]);
            $attendanceResult = $stmt->fetch();
            
            $totalHours = $attendanceResult['total_hours'] ?? 0;
            
            // Calculate regular and overtime (assuming 8 hours/day is regular, anything over is overtime)
            $regularHours = min($totalHours, 40); // 40 hours per week regular
            $overtimeHours = max($totalHours - 40, 0);
            
            // Calculate pay (overtime is 1.5x regular rate)
            $regularPay = $regularHours * $hourlyRate;
            $overtimePay = $overtimeHours * ($hourlyRate * 1.5);
            $grossPay = $regularPay + $overtimePay;
            $deductions = floatval($data['deductions'] ?? 0);
            $netPay = $grossPay - $deductions;
            
            // Insert payroll record
            $stmt = $db->prepare("INSERT INTO payroll (user_id, period_start, period_end, total_hours, regular_hours, overtime_hours, gross_pay, deductions, net_pay, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
            $stmt->execute([
                $data['user_id'],
                $data['period_start'],
                $data['period_end'],
                $totalHours,
                $regularHours,
                $overtimeHours,
                $grossPay,
                $deductions,
                $netPay
            ]);
            
            $payrollId = $db->lastInsertId();
            
            $db->commit();
            
            jsonResponse(['success' => true, 'payroll_id' => $payrollId]);
        } catch (PDOException $e) {
            $db->rollBack();
            jsonResponse(['success' => false, 'message' => 'Payroll generation failed: ' . $e->getMessage()]);
        }
        
    case 'get_payroll':
        $payrollId = intval($_GET['id'] ?? 0);
        
        if ($payrollId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid payroll ID'], 400);
        }
        
        $where = "WHERE p.id = ?";
        $params = [$payrollId];
        
        // If not owner/manager, only show own payroll
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND p.user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        $stmt = $db->prepare("SELECT p.*, u.full_name FROM payroll p JOIN users u ON p.user_id = u.id $where");
        $stmt->execute($params);
        $payroll = $stmt->fetch();
        
        if ($payroll) {
            jsonResponse(['success' => true, 'payroll' => $payroll]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Payroll not found'], 404);
        }
        
    case 'get_payroll_history':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if (isset($_GET['user_id'])) {
            $where .= " AND user_id = ?";
            $params[] = $_GET['user_id'];
        }
        
        if (isset($_GET['status'])) {
            $where .= " AND status = ?";
            $params[] = $_GET['status'];
        }
        
        // If not owner/manager, only show own payroll
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM payroll $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get payroll history
        $stmt = $db->prepare("SELECT p.*, u.full_name FROM payroll p JOIN users u ON p.user_id = u.id $where ORDER BY p.period_start DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $payrollHistory = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'payroll_history' => $payrollHistory,
            'pagination' => $pagination
        ]);
        
    case 'update_status':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        $payrollId = intval($data['payroll_id'] ?? 0);
        $status = $data['status'] ?? 'pending';
        
        if ($payrollId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid payroll ID'], 400);
        }
        
        if (!in_array($status, ['pending', 'approved', 'paid'])) {
            jsonResponse(['success' => false, 'message' => 'Invalid status'], 400);
        }
        
        try {
            $stmt = $db->prepare("UPDATE payroll SET status = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $payrollId]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Update failed: ' . $e->getMessage()]);
        }
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
