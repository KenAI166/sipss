<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create_expense':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['category']) || empty($data['amount']) || empty($data['date'])) {
            jsonResponse(['success' => false, 'message' => 'Missing required fields'], 400);
        }
        
        try {
            $stmt = $db->prepare("INSERT INTO expenses (category, description, amount, payment_method, user_id, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['category'],
                $data['description'] ?? null,
                $data['amount'],
                $data['payment_method'] ?? null,
                $_SESSION['user_id'],
                $data['date'],
                $data['notes'] ?? null
            ]);
            
            jsonResponse(['success' => true, 'expense_id' => $db->lastInsertId()]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Expense creation failed: ' . $e->getMessage()]);
        }
        
    case 'update_expense':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $expenseId = intval($_GET['id'] ?? 0);
        
        if ($expenseId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid expense ID'], 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $stmt = $db->prepare("UPDATE expenses SET category = ?, description = ?, amount = ?, payment_method = ?, date = ?, notes = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([
                $data['category'],
                $data['description'] ?? null,
                $data['amount'],
                $data['payment_method'] ?? null,
                $data['date'],
                $data['notes'] ?? null,
                $expenseId
            ]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Expense update failed: ' . $e->getMessage()]);
        }
        
    case 'get_expense':
        $expenseId = intval($_GET['id'] ?? 0);
        
        if ($expenseId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid expense ID'], 400);
        }
        
        $where = "WHERE e.id = ?";
        $params = [$expenseId];
        
        // If not owner/manager, only show own expenses
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND e.user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        $stmt = $db->prepare("SELECT e.*, u.full_name FROM expenses e JOIN users u ON e.user_id = u.id $where");
        $stmt->execute($params);
        $expense = $stmt->fetch();
        
        if ($expense) {
            jsonResponse(['success' => true, 'expense' => $expense]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Expense not found'], 404);
        }
        
    case 'get_expenses':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if (isset($_GET['category'])) {
            $where .= " AND category = ?";
            $params[] = $_GET['category'];
        }
        
        if (isset($_GET['date_from'])) {
            $where .= " AND date >= ?";
            $params[] = $_GET['date_from'];
        }
        
        if (isset($_GET['date_to'])) {
            $where .= " AND date <= ?";
            $params[] = $_GET['date_to'];
        }
        
        // If not owner/manager, only show own expenses
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM expenses $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get expenses
        $stmt = $db->prepare("SELECT e.*, u.full_name FROM expenses e JOIN users u ON e.user_id = u.id $where ORDER BY e.date DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $expenses = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'expenses' => $expenses,
            'pagination' => $pagination
        ]);
        
    case 'delete_expense':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $expenseId = intval($_GET['id'] ?? 0);
        
        if ($expenseId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid expense ID'], 400);
        }
        
        $where = "WHERE id = ?";
        $params = [$expenseId];
        
        // If not owner/manager, only can delete own expenses
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM expenses $where");
            $stmt->execute($params);
            
            if ($stmt->rowCount() > 0) {
                jsonResponse(['success' => true]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Expense not found or unauthorized']);
            }
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Expense deletion failed: ' . $e->getMessage()]);
        }
        
    case 'get_expense_summary':
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
        
        $where = "WHERE $dateCondition";
        $params = [];
        
        // If not owner/manager, only show own summary
        if (!hasRole(['owner', 'manager'])) {
            $where .= " AND user_id = ?";
            $params[] = $_SESSION['user_id'];
        }
        
        $stmt = $db->prepare("SELECT 
            category,
            COUNT(*) as count,
            COALESCE(SUM(amount), 0) as total
            FROM expenses $where GROUP BY category ORDER BY total DESC");
        $stmt->execute($params);
        $summary = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'summary' => $summary]);
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
