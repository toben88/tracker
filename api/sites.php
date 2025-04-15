<?php
/**
 * Sites API Endpoint
 * Manages tracking sites
 */

// Enhance session security - must be set before session_start()
ini_set('session.cookie_httponly', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

// Start session for authentication
session_start();

// Check authentication
if (!isset($_SESSION['isAuthenticated']) || $_SESSION['isAuthenticated'] !== true) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// CSRF check function
function verifyCsrfToken() {
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

// Set content type to JSON
header('Content-Type: application/json');

// Database file paths
$sitesFile = '../data/sites.json';
$dataDir = '../data';

// Ensure data directory exists
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Initialize sites file if it doesn't exist
if (!file_exists($sitesFile)) {
    file_put_contents($sitesFile, json_encode([]));
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all sites or a specific site
        $sites = json_decode(file_get_contents($sitesFile), true);
        
        // Check if a specific site ID is requested
        if (isset($_GET['id'])) {
            $siteId = $_GET['id'];
            $site = null;
            
            foreach ($sites as $s) {
                if ($s['id'] === $siteId) {
                    $site = $s;
                    break;
                }
            }
            
            if ($site) {
                echo json_encode($site);
            } else {
                header('HTTP/1.1 404 Not Found');
                echo json_encode(['error' => 'Site not found']);
            }
        } else {
            // Return all sites
            echo json_encode($sites);
        }
        break;
        
    case 'POST':
        // Verify CSRF token
        if (!verifyCsrfToken()) {
            header('HTTP/1.1 403 Forbidden');
            echo json_encode(['error' => 'CSRF token validation failed']);
            exit;
        }
        
        // Create a new site
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || !isset($data['url'])) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['error' => 'Name and URL are required']);
            exit;
        }
        
        $sites = json_decode(file_get_contents($sitesFile), true);
        
        $newSite = [
            'id' => uniqid(),
            'name' => $data['name'],
            'url' => $data['url'],
            'createdAt' => date('c')
        ];
        
        $sites[] = $newSite;
        file_put_contents($sitesFile, json_encode($sites, JSON_PRETTY_PRINT));
        
        echo json_encode($newSite);
        break;
        
    default:
        header('HTTP/1.1 405 Method Not Allowed');
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
