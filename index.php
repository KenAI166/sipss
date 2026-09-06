<?php
require_once 'includes/config.php';
require_once 'includes/auth.php';

// Redirect to dashboard if already logged in
if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$success = '';
$mode = $_GET['mode'] ?? 'login';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'login';
    
    if ($action === 'login') {
        $username = ($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            $error = 'Please enter both username and password';
        } else {
            $auth = new Auth();
            $result = $auth->login($username, $password);
            
            if ($result['success']) {
                header('Location: dashboard.php');
                exit;
            } else {
                $error = $result['message'];
            }
        }
    } elseif ($action === 'register') {
        $username = sanitizeInput($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        $full_name = sanitizeInput($_POST['full_name'] ?? '');
        $email = sanitizeInput($_POST['email'] ?? '');
        $phone = sanitizeInput($_POST['phone'] ?? '');
        
        if (empty($username) || empty($password) || empty($full_name) || empty($email)) {
            $error = 'Please fill in all required fields';
        } elseif ($password !== $confirm_password) {
            $error = 'Passwords do not match';
        } elseif (strlen($password) < 6) {
            $error = 'Password must be at least 6 characters';
        } else {
            $auth = new Auth();
            $result = $auth->register([
                'username' => $username,
                'password' => $password,
                'full_name' => $full_name,
                'email' => $email,
                'phone' => $phone,
                'role' => 'employee',
                'hourly_rate' => 0.00
            ]);
            
            if ($result['success']) {
                $success = 'Registration successful! You can now login with your credentials.';
                $mode = 'login';
            } else {
                $error = $result['message'];
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Sip Station POS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="min-h-screen bg-white flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-coffee text-black text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-black">Sip Station</h1>
            <p class="text-gray-600 mt-1 text-sm">POS & IBMS</p>
        </div>
        
        <?php if ($error): ?>
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                <?php echo htmlspecialchars($success); ?>
            </div>
        <?php endif; ?>
        
        <?php if ($mode === 'login'): ?>
        <form method="POST" action="">
            <input type="hidden" name="action" value="login">
            <div class="mb-4">
                <label class="block text-black text-sm font-medium mb-2" for="username">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                    autofocus
                >
            </div>
            
            <div class="mb-6">
                <label class="block text-black text-sm font-medium mb-2" for="password">Password</label>
                <div class="relative">
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your password"
                        required
                    >
                    <button 
                        type="button" 
                        onclick="togglePassword('password', this)" 
                        class="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label="Toggle password visibility"
                    >
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            
            <button 
                type="submit" 
                class="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition"
            >
                Login
            </button>
        </form>
        
        <div class="mt-6 text-center">
            <p class="text-gray-600 text-sm">Don't have an account?</p>
            <a href="?mode=register" class="text-green-600 hover:text-green-700 font-medium text-sm">Sign up here</a>
        </div>
        
        <div class="mt-4 text-center text-gray-500 text-xs">
            <p>Default: admin / admin123</p>
        </div>
        <?php else: ?>
        <form method="POST" action="">
            <input type="hidden" name="action" value="register">
            <div class="mb-3">
                <label class="block text-black text-sm font-medium mb-1" for="full_name">Full Name</label>
                <input 
                    type="text" 
                    id="full_name" 
                    name="full_name" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Enter your full name"
                    required
                    autofocus
                >
            </div>
            
            <div class="mb-3">
                <label class="block text-black text-sm font-medium mb-1" for="username">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Choose a username"
                    required
                >
            </div>
            
            <div class="mb-3">
                <label class="block text-black text-sm font-medium mb-1" for="email">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Enter your email"
                    required
                >
            </div>
            
            <div class="mb-3">
                <label class="block text-black text-sm font-medium mb-1" for="phone">Phone (Optional)</label>
                <input 
                    type="text" 
                    id="phone" 
                    name="phone" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Enter your phone number"
                >
            </div>
            
            <div class="mb-3">
                <label class="block text-black text-sm font-medium mb-1" for="password">Password</label>
                <div class="relative">
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        placeholder="Create a password (min 6 characters)"
                        required
                    >
                    <button 
                        type="button" 
                        onclick="togglePassword('password', this)" 
                        class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label="Toggle password visibility"
                    >
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="block text-black text-sm font-medium mb-1" for="confirm_password">Confirm Password</label>
                <div class="relative">
                    <input 
                        type="password" 
                        id="confirm_password" 
                        name="confirm_password" 
                        class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        placeholder="Confirm your password"
                        required
                    >
                    <button 
                        type="button" 
                        onclick="togglePassword('confirm_password', this)" 
                        class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label="Toggle password visibility"
                    >
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            
            <button 
                type="submit" 
                class="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition"
            >
                Sign Up
            </button>
        </form>
        
        <div class="mt-6 text-center">
            <p class="text-gray-600 text-sm">Already have an account?</p>
            <a href="?mode=login" class="text-green-600 hover:text-green-700 font-medium text-sm">Login here</a>
        </div>
        <?php endif; ?>
    </div>
    <script>
        function togglePassword(inputId, btn) {
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('i');
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            icon.classList.toggle('fa-eye', !show);
            icon.classList.toggle('fa-eye-slash', show);
        }
    </script>
</body>
</html>
