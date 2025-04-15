<?php
/**
 * Visits API Endpoint
 * Retrieves visit data
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

// Set content type to JSON
header('Content-Type: application/json');

// Database directories
$visitsDir = '../data/visits';
$sitesFile = '../data/sites.json';

// Ensure directories exist
if (!file_exists($visitsDir)) {
    mkdir($visitsDir, 0755, true);
}

// Get all visits
function getAllVisits() {
    global $visitsDir;
    $visits = [];
    
    if (is_dir($visitsDir)) {
        $files = scandir($visitsDir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && strpos($file, 'visit-') === 0) {
                $visitData = json_decode(file_get_contents("$visitsDir/$file"), true);
                if ($visitData) {
                    $visits[] = $visitData;
                }
            }
        }
    }
    
    // Sort by timestamp (newest first)
    usort($visits, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    return $visits;
}

// Get visits for a specific site
function getSiteVisits($siteId) {
    $allVisits = getAllVisits();
    return array_filter($allVisits, function($visit) use ($siteId) {
        return $visit['siteId'] === $siteId;
    });
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Check if a specific site ID is requested
        if (isset($_GET['siteId'])) {
            $siteId = $_GET['siteId'];
            $visits = getSiteVisits($siteId);
            echo json_encode(array_values($visits));
        } else {
            // Return all visits
            $visits = getAllVisits();
            echo json_encode($visits);
        }
        break;
        
    default:
        header('HTTP/1.1 405 Method Not Allowed');
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
