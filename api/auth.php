<?php
require_once '../includes/config.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

$auth = new Auth();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $username = sanitizeInput($data['username'] ?? '');
        $password = $data['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            jsonResponse(['success' => false, 'message' => 'Username and password are required']);
        }
        
        $result = $auth->login($username, $password);
        jsonResponse($result);
        
    case 'logout':
        if (!isLoggedIn()) {
            jsonResponse(['success' => false, 'message' => 'Not logged in'], 401);
        }
        
        $result = $auth->logout();
        jsonResponse($result);
        
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireRole(['owner', 'manager']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $required = ['username', 'password', 'full_name', 'email'];
        if (!validateRequired($data, $required)) {
            jsonResponse(['success' => false, 'message' => 'Missing required fields']);
        }
        
        if (!validateEmail($data['email'])) {
            jsonResponse(['success' => false, 'message' => 'Invalid email format']);
        }
        
        $result = $auth->register($data);
        jsonResponse($result);
        
    case 'update_profile':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        requireLogin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $_SESSION['user_id'];
        
        // Only owners and managers can update other users
        if (isset($data['user_id']) && hasRole(['owner', 'manager'])) {
            $userId = $data['user_id'];
        }
        
        $result = $auth->updateProfile($userId, $data);
        jsonResponse($result);
        
    case 'get_users':
        requireRole(['owner', 'manager']);
        
        $role = $_GET['role'] ?? null;
        $users = $auth->getAllUsers($role);
        jsonResponse(['success' => true, 'users' => $users]);
        
    case 'get_user':
        requireLogin();
        
        $userId = $_GET['id'] ?? $_SESSION['user_id'];
        
        // Only owners and managers can view other users
        if ($userId != $_SESSION['user_id'] && !hasRole(['owner', 'manager'])) {
            jsonResponse(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $user = $auth->getUserById($userId);
        if ($user) {
            unset($user['password']);
            jsonResponse(['success' => true, 'user' => $user]);
        } else {
            jsonResponse(['success' => false, 'message' => 'User not found'], 404);
        }
        
    case 'delete_user':
        requireRole(['owner']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;
        
        if (!$userId) {
            jsonResponse(['success' => false, 'message' => 'User ID is required']);
        }
        
        $result = $auth->deleteUser($userId);
        jsonResponse($result);
        
    case 'toggle_user_status':
        requireRole(['owner', 'manager']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;
        
        if (!$userId) {
            jsonResponse(['success' => false, 'message' => 'User ID is required']);
        }
        
        $result = $auth->toggleUserStatus($userId);
        jsonResponse($result);
        
    case 'check_auth':
        jsonResponse([
            'success' => true,
            'authenticated' => isLoggedIn(),
            'user' => isLoggedIn() ? [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'full_name' => $_SESSION['full_name'],
                'email' => $_SESSION['email'],
                'role' => $_SESSION['role'],
                'photo_path' => $_SESSION['photo_path']
            ] : null
        ]);
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}
