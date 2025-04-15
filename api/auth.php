<?php
/**
 * Authentication API Endpoint
 * Handles login, logout, and password changes
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Enhance session security - must be set before session_start()
ini_set('session.cookie_httponly', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

// Start session
session_start();

// Set content type to JSON
header('Content-Type: application/json');

// Database file paths
$adminsFile = '../data/admins.json';
$dataDir = '../data';

// Ensure data directory exists
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Ensure data directory exists
if (!file_exists($dataDir)) {
    if (!mkdir($dataDir, 0777, true)) {
        error_log('Failed to create data directory');
    }
}

// Initialize admins file if it doesn't exist
if (!file_exists($adminsFile)) {
    // Create default admin account
    $defaultPassword = 'admin123';
    $hashedPassword = password_hash($defaultPassword, PASSWORD_BCRYPT);
    
    $admin = [
        'id' => uniqid(),
        'username' => 'admin',
        'password' => $hashedPassword,
        'createdAt' => date('c')
    ];
    
    if (!file_put_contents($adminsFile, json_encode([$admin], JSON_PRETTY_PRINT))) {
        error_log('Failed to write admin file');
    } else {
        error_log('Created default admin account');
    }
}

// CSRF check function
function verifyCsrfToken() {
    // Skip CSRF check for login
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
        return true;
    }
    
    // Get the CSRF token from headers or POST data
    $headers = getallheaders();
    $token = isset($headers['X-CSRF-Token']) ? $headers['X-CSRF-Token'] : null;
    
    if (!$token && isset($_POST['csrf_token'])) {
        $token = $_POST['csrf_token'];
    }
    
    if (!$token && isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'];
    }
    
    // Verify the token
    if (!$token || !isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
        return false;
    }
    
    return true;
}

// Handle login request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
    // Debug information
    error_log('Login attempt received');
    
    // Skip CSRF check for login - user isn't authenticated yet
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['username']) || !isset($data['password'])) {
        error_log('Missing username or password');
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    error_log('Checking credentials for user: ' . $username);
    
    // Check if admins file exists
    if (!file_exists($adminsFile)) {
        error_log('Admins file does not exist: ' . $adminsFile);
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['error' => 'Admin configuration not found']);
        exit;
    }
    
    // Read admins file
    $adminsContent = file_get_contents($adminsFile);
    if ($adminsContent === false) {
        error_log('Failed to read admins file');
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['error' => 'Failed to read admin configuration']);
        exit;
    }
    
    $admins = json_decode($adminsContent, true);
    if ($admins === null) {
        error_log('Failed to parse admins JSON: ' . json_last_error_msg());
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['error' => 'Invalid admin configuration']);
        exit;
    }
    
    error_log('Found ' . count($admins) . ' admin accounts');
    
    $admin = null;
    
    foreach ($admins as $a) {
        if ($a['username'] === $username) {
            $admin = $a;
            error_log('Found matching admin account');
            break;
        }
    }
    
    if (!$admin) {
        error_log('Admin account not found for username: ' . $username);
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    
    if (!password_verify($password, $admin['password'])) {
        error_log('Password verification failed');
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    
    error_log('Login successful for user: ' . $username);
    
    // Set session
    $_SESSION['isAuthenticated'] = true;
    $_SESSION['username'] = $username;
    $_SESSION['userId'] = $admin['id'];
    
    // Regenerate session ID to prevent session fixation
    session_regenerate_id(true);
    
    // Ensure proper response
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Login successful']);
    exit;
}

// Handle logout request
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Destroy session
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Handle change password request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'change-password') {
    // Check authentication
    if (!isset($_SESSION['isAuthenticated']) || $_SESSION['isAuthenticated'] !== true) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['currentPassword']) || !isset($data['newPassword'])) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(['error' => 'Current password and new password are required']);
        exit;
    }
    
    $currentPassword = $data['currentPassword'];
    $newPassword = $data['newPassword'];
    
    $admins = json_decode(file_get_contents($adminsFile), true);
    $adminIndex = null;
    
    for ($i = 0; $i < count($admins); $i++) {
        if ($admins[$i]['id'] === $_SESSION['userId']) {
            $adminIndex = $i;
            break;
        }
    }
    
    if ($adminIndex === null || !password_verify($currentPassword, $admins[$adminIndex]['password'])) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }
    
    // Update password
    $admins[$adminIndex]['password'] = password_hash($newPassword, PASSWORD_BCRYPT);
    file_put_contents($adminsFile, json_encode($admins, JSON_PRETTY_PRINT));
    
    echo json_encode(['success' => true]);
    exit;
}

// Get current user info
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'user') {
    if (!isset($_SESSION['isAuthenticated']) || $_SESSION['isAuthenticated'] !== true) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
    
    echo json_encode([
        'id' => $_SESSION['userId'],
        'username' => $_SESSION['username']
    ]);
    exit;
}

// Default response
header('HTTP/1.1 400 Bad Request');
echo json_encode(['error' => 'Invalid request']);
?>
