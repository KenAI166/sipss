<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create_sale':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager', 'staff']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['items']) || !is_array($data['items'])) {
            jsonResponse(['success' => false, 'message' => 'No items in cart']);
        }
        
        try {
            $db->beginTransaction();
            
            // Generate receipt number
            $receiptNumber = generateReceiptNumber();
            
            // Insert sale
            $stmt = $db->prepare("INSERT INTO sales (receipt_number, user_id, total_amount, payment_method, discount, tax, customer_name, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')");
            $stmt->execute([
                $receiptNumber,
                $_SESSION['user_id'],
                $data['total_amount'],
                $data['payment_method'],
                $data['discount'],
                $data['tax'],
                $data['customer_name'],
                $data['notes']
            ]);
            
            $saleId = $db->lastInsertId();
            
            // Insert sale items and update inventory
            foreach ($data['items'] as $item) {
                // Insert sale item
                $stmt = $db->prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
                $stmt->execute([$saleId, $item['id'], $item['quantity'], $item['price']]);
                
                // Update inventory
                $stmt = $db->prepare("UPDATE inventory SET current_quantity = current_quantity - ?, updated_at = NOW() WHERE product_id = ?");
                $stmt->execute([$item['quantity'], $item['id']]);
            }
            
            $db->commit();
            
            jsonResponse([
                'success' => true,
                'sale_id' => $saleId,
                'receipt_number' => $receiptNumber
            ]);
            
        } catch (PDOException $e) {
            $db->rollBack();
            jsonResponse(['success' => false, 'message' => 'Sale failed: ' . $e->getMessage()]);
        }
        
    case 'get_sales':
        requireRole(['owner', 'manager', 'staff']);
        
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if (isset($_GET['status'])) {
            $where .= " AND status = ?";
            $params[] = $_GET['status'];
        }
        
        if (isset($_GET['date_from'])) {
            $where .= " AND DATE(created_at) >= ?";
            $params[] = $_GET['date_from'];
        }
        
        if (isset($_GET['date_to'])) {
            $where .= " AND DATE(created_at) <= ?";
            $params[] = $_GET['date_to'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM sales $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get sales
        $stmt = $db->prepare("SELECT s.*, u.full_name as cashier_name FROM sales s JOIN users u ON s.user_id = u.id $where ORDER BY s.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $sales = $stmt->fetchAll();
        
        // Get sale items for each sale
        foreach ($sales as &$sale) {
            $stmt = $db->prepare("SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?");
            $stmt->execute([$sale['id']]);
            $sale['items'] = $stmt->fetchAll();
        }
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'sales' => $sales,
            'pagination' => $pagination
        ]);
        
    case 'get_sale':
        requireRole(['owner', 'manager', 'staff']);
        
        $saleId = $_GET['id'] ?? null;
        
        if (!$saleId) {
            jsonResponse(['success' => false, 'message' => 'Sale ID is required'], 400);
        }
        
        $stmt = $db->prepare("SELECT s.*, u.full_name as cashier_name FROM sales s JOIN users u ON s.user_id = u.id WHERE s.id = ?");
        $stmt->execute([$saleId]);
        $sale = $stmt->fetch();
        
        if (!$sale) {
            jsonResponse(['success' => false, 'message' => 'Sale not found'], 404);
        }
        
        $stmt = $db->prepare("SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?");
        $stmt->execute([$saleId]);
        $sale['items'] = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'sale' => $sale]);
        
    case 'update_sale_status':
        requireRole(['owner', 'manager']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $saleId = $data['sale_id'] ?? null;
        $status = $data['status'] ?? null;
        
        if (!$saleId || !$status) {
            jsonResponse(['success' => false, 'message' => 'Sale ID and status are required'], 400);
        }
        
        if (!in_array($status, ['completed', 'pending', 'cancelled'])) {
            jsonResponse(['success' => false, 'message' => 'Invalid status'], 400);
        }
        
        try {
            $stmt = $db->prepare("UPDATE sales SET status = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $saleId]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Update failed: ' . $e->getMessage()]);
        }
        
    case 'get_daily_sales':
        requireRole(['owner', 'manager', 'staff']);
        
        $date = $_GET['date'] ?? date('Y-m-d');
        
        $stmt = $db->prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) = ? AND status = 'completed'");
        $stmt->execute([$date]);
        $result = $stmt->fetch();
        
        jsonResponse([
            'success' => true,
            'count' => $result['count'],
            'total' => $result['total']
        ]);
        
    case 'get_sales_summary':
        requireRole(['owner', 'manager']);
        
        $period = $_GET['period'] ?? 'today';
        
        switch ($period) {
            case 'today':
                $dateCondition = "DATE(created_at) = CURDATE()";
                break;
            case 'week':
                $dateCondition = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $dateCondition = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
            case 'year':
                $dateCondition = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";
                break;
            default:
                $dateCondition = "1=1";
        }
        
        $stmt = $db->prepare("SELECT 
            COUNT(*) as total_sales,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(AVG(total_amount), 0) as average_sale
            FROM sales WHERE $dateCondition AND status = 'completed'");
        $stmt->execute();
        $summary = $stmt->fetch();
        
        // Get best-selling products
        $stmt = $db->prepare("SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.quantity * si.unit_price) as revenue 
            FROM sale_items si 
            JOIN products p ON si.product_id = p.id 
            JOIN sales s ON si.sale_id = s.id 
            WHERE $dateCondition AND s.status = 'completed'
            GROUP BY p.id 
            ORDER BY total_sold DESC 
            LIMIT 10");
        $stmt->execute();
        $bestSellers = $stmt->fetchAll();
        
        // Get sales by payment method
        $stmt = $db->prepare("SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total 
            FROM sales WHERE $dateCondition AND status = 'completed' 
            GROUP BY payment_method");
        $stmt->execute();
        $byPaymentMethod = $stmt->fetchAll();
        
        jsonResponse([
            'success' => true,
            'summary' => $summary,
            'best_sellers' => $bestSellers,
            'by_payment_method' => $byPaymentMethod
        ]);
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
