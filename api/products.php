<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

requireLogin();
requireRole(['owner', 'manager', 'staff']);

$db = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create_product':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $name = sanitizeInput($_POST['name'] ?? '');
        $category = sanitizeInput($_POST['category'] ?? '');
        $price = floatval($_POST['price'] ?? 0);
        
        if (empty($name) || empty($category) || $price <= 0) {
            jsonResponse(['success' => false, 'message' => 'Name, category, and price are required']);
        }
        
        try {
            $db->beginTransaction();
            
            // Handle image upload
            $imagePath = null;
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $uploadResult = uploadFile($_FILES['image'], UPLOAD_PATH . 'products/');
                if ($uploadResult['success']) {
                    $imagePath = 'uploads/products/' . $uploadResult['filename'];
                }
            }
            
            // Insert product
            $stmt = $db->prepare("INSERT INTO products (name, category, description, price, cost_price, sku, barcode, image_path, color, shape, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $name,
                $category,
                $_POST['description'] ?? null,
                $price,
                $_POST['cost_price'] ?? null,
                $_POST['sku'] ?? null,
                $_POST['barcode'] ?? null,
                $imagePath,
                $_POST['color'] ?? null,
                $_POST['shape'] ?? 'rectangle',
                isset($_POST['is_active']) ? 1 : 0
            ]);
            
            $productId = $db->lastInsertId();
            
            // Create inventory record
            $stmt = $db->prepare("INSERT INTO inventory (product_id, current_quantity, minimum_quantity) VALUES (?, 0, 10)");
            $stmt->execute([$productId]);
            
            $db->commit();
            
            jsonResponse(['success' => true, 'product_id' => $productId]);
            
        } catch (PDOException $e) {
            $db->rollBack();
            jsonResponse(['success' => false, 'message' => 'Product creation failed: ' . $e->getMessage()]);
        }
        
    case 'update_product':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $productId = intval($_GET['id'] ?? 0);
        
        if ($productId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid product ID'], 400);
        }
        
        $name = sanitizeInput($_POST['name'] ?? '');
        $category = sanitizeInput($_POST['category'] ?? '');
        $price = floatval($_POST['price'] ?? 0);
        
        if (empty($name) || empty($category) || $price <= 0) {
            jsonResponse(['success' => false, 'message' => 'Name, category, and price are required']);
        }
        
        try {
            $db->beginTransaction();
            
            // Handle image upload
            $imagePath = null;
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $uploadResult = uploadFile($_FILES['image'], UPLOAD_PATH . 'products/');
                if ($uploadResult['success']) {
                    $imagePath = 'uploads/products/' . $uploadResult['filename'];
                    
                    // Delete old image
                    $stmt = $db->prepare("SELECT image_path FROM products WHERE id = ?");
                    $stmt->execute([$productId]);
                    $oldProduct = $stmt->fetch();
                    if ($oldProduct && $oldProduct['image_path']) {
                        deleteFile(UPLOAD_PATH . 'products/' . basename($oldProduct['image_path']));
                    }
                }
            }
            
            // Update product
            $sql = "UPDATE products SET name = ?, category = ?, description = ?, price = ?, cost_price = ?, sku = ?, barcode = ?, color = ?, shape = ?, is_active = ?, updated_at = NOW()";
            $params = [$name, $category, $_POST['description'] ?? null, $price, $_POST['cost_price'] ?? null, $_POST['sku'] ?? null, $_POST['barcode'] ?? null, $_POST['color'] ?? null, $_POST['shape'] ?? 'rectangle', isset($_POST['is_active']) ? 1 : 0];
            
            if ($imagePath) {
                $sql .= ", image_path = ?";
                $params[] = $imagePath;
            }
            
            $sql .= " WHERE id = ?";
            $params[] = $productId;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            $db->commit();
            
            jsonResponse(['success' => true]);
            
        } catch (PDOException $e) {
            $db->rollBack();
            jsonResponse(['success' => false, 'message' => 'Product update failed: ' . $e->getMessage()]);
        }
        
    case 'get_product':
        $productId = intval($_GET['id'] ?? 0);
        
        if ($productId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid product ID'], 400);
        }
        
        $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        
        if ($product) {
            jsonResponse(['success' => true, 'product' => $product]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Product not found'], 404);
        }
        
    case 'get_products':
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if (isset($_GET['category'])) {
            $where .= " AND category = ?";
            $params[] = $_GET['category'];
        }
        
        if (isset($_GET['is_active'])) {
            $where .= " AND is_active = ?";
            $params[] = $_GET['is_active'];
        }
        
        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM products $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get products
        $stmt = $db->prepare("SELECT p.*, i.current_quantity FROM products p LEFT JOIN inventory i ON p.id = i.product_id $where ORDER BY p.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        
        $pagination = getPagination($total, $page, $limit);
        
        jsonResponse([
            'success' => true,
            'products' => $products,
            'pagination' => $pagination
        ]);
        
    case 'delete_product':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $productId = intval($_GET['id'] ?? 0);
        
        if ($productId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Invalid product ID'], 400);
        }
        
        try {
            $db->beginTransaction();
            
            // Get product image
            $stmt = $db->prepare("SELECT image_path FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
            
            // Delete product (cascade will handle inventory and sale_items)
            $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            
            // Delete image file
            if ($product && $product['image_path']) {
                deleteFile(UPLOAD_PATH . 'products/' . basename($product['image_path']));
            }
            
            $db->commit();
            
            jsonResponse(['success' => true]);
            
        } catch (PDOException $e) {
            $db->rollBack();
            jsonResponse(['success' => false, 'message' => 'Product deletion failed: ' . $e->getMessage()]);
        }
        
    case 'toggle_product_status':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        $productId = $data['product_id'] ?? null;
        
        if (!$productId) {
            jsonResponse(['success' => false, 'message' => 'Product ID is required'], 400);
        }
        
        try {
            $stmt = $db->prepare("UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$productId]);
            
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Status update failed: ' . $e->getMessage()]);
        }
        
    case 'get_categories':
        $stmt = $db->prepare("SELECT DISTINCT category FROM products WHERE is_active = TRUE ORDER BY category");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        jsonResponse(['success' => true, 'categories' => $categories]);
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
