<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();
requireRole(['owner', 'manager', 'staff']);

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_inventory':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if (isset($_GET['low_stock'])) {
            $where .= " AND i.current_quantity <= i.minimum_quantity";
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM inventory i JOIN products p ON i.product_id = p.id $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get inventory
        $stmt = $db->prepare("SELECT i.*, p.name, p.category, p.sku, p.is_active FROM inventory i JOIN products p ON i.product_id = p.id $where ORDER BY i.current_quantity ASC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $inventory = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'inventory' => $inventory,
            'pagination' => $pagination
        ]);
        
    case 'get_product_inventory':
        $productId = intval($_GET['product_id'] ?? 0);
        
        if ($productId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid product ID'], 400);
        }
        
        $stmt = $db->prepare("SELECT * FROM inventory WHERE product_id = ?");
        $stmt->execute([$productId]);
        $inventory = $stmt->fetch();
        
        if ($inventory) {
            jsonResponse(['success' => true, 'inventory' => $inventory]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Inventory not found'], 404);
        }
        
    case 'restock':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $productId = intval($data['product_id'] ?? 0);
        $quantity = intval($data['quantity'] ?? 0);
        
        if ($productId <= 0 || $quantity <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid product ID or quantity'], 400);
        }
        
        try {
            $stmt = $db->prepare("UPDATE inventory SET current_quantity = current_quantity + ?, last_restocked = NOW(), updated_at = NOW() WHERE product_id = ?");
            $stmt->execute([$quantity, $productId]);
            
            if ($stmt->rowCount() > 0) {
                jsonResponse(['success' => true]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Product not found']);
            }
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Restock failed: ' . $e->getMessage()]);
        }
        
    case 'update_stock':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $productId = intval($data['product_id'] ?? 0);
        $currentQuantity = intval($data['current_quantity'] ?? 0);
        $minimumQuantity = intval($data['minimum_quantity'] ?? 0);
        
        if ($productId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid product ID'], 400);
        }
        
        if ($currentQuantity < 0 || $minimumQuantity < 0) {
            jsonResponse(['success' => false, 'message' => 'Stock values cannot be negative'], 400);
        }
        
        try {
            $stmt = $db->prepare("UPDATE inventory SET current_quantity = ?, minimum_quantity = ?, updated_at = NOW() WHERE product_id = ?");
            $stmt->execute([$currentQuantity, $minimumQuantity, $productId]);
            
            if ($stmt->rowCount() > 0) {
                jsonResponse(['success' => true]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Product not found']);
            }
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Update failed: ' . $e->getMessage()]);
        }
        
    case 'get_low_stock':
        requireRole(['owner', 'manager']);
        
        $stmt = $db->prepare("SELECT i.*, p.name, p.category FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.current_quantity <= i.minimum_quantity AND p.is_active = TRUE ORDER BY i.current_quantity ASC");
        $stmt->execute();
        $lowStock = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'low_stock' => $lowStock]);
        
    case 'get_stock_history':
        $productId = intval($_GET['product_id'] ?? 0);
        
        if ($productId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid product ID'], 400);
        }
        
        // Note: This would require a stock_history table for full implementation
        // For now, return current inventory info
        $stmt = $db->prepare("SELECT i.*, p.name FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.product_id = ?");
        $stmt->execute([$productId]);
        $inventory = $stmt->fetch();
        
        jsonResponse(['success' => true, 'inventory' => $inventory]);
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
