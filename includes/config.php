<?php
// Sip Station POS & IBMS Configuration File

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'sip_station_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Site Configuration
define('SITE_NAME', 'Sip Station POS & IBMS');
define('SITE_URL', 'http://localhost/newwwwwwwwwwwwwwwww');
define('ADMIN_EMAIL', 'admin@sipstation.com');

// File Upload Configuration
define('UPLOAD_PATH', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 5242880); // 5MB in bytes
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Session Configuration
define('SESSION_NAME', 'sip_station_session');
define('SESSION_LIFETIME', 3600); // 1 hour in seconds

// Security Configuration
define('BCRYPT_COST', 10);
define('CSRF_TOKEN_NAME', 'csrf_token');

// Pagination
define('ITEMS_PER_PAGE', 20);

// Date/Time Configuration
define('TIMEZONE', 'Asia/Manila');
date_default_timezone_set(TIMEZONE);

// Error Reporting (Set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}
