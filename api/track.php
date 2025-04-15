<?php
/**
 * Tracking API Endpoint
 * Collects visitor data and stores it in JSON files
 */

// Rate limiting function
function isRateLimited($ip) {
    $rateLimitDir = '../data/rate_limits';
    if (!file_exists($rateLimitDir)) {
        mkdir($rateLimitDir, 0755, true);
    }
    
    $ipFile = $rateLimitDir . '/' . md5($ip) . '.json';
    $now = time();
    $limit = 60; // Max requests per minute
    
    if (file_exists($ipFile)) {
        $data = json_decode(file_get_contents($ipFile), true);
        $data['requests'][] = $now;
        
        // Keep only requests from the last minute
        $data['requests'] = array_filter($data['requests'], function($time) use ($now) {
            return $time > ($now - 60);
        });
        
        file_put_contents($ipFile, json_encode($data));
        
        return count($data['requests']) > $limit;
    } else {
        file_put_contents($ipFile, json_encode(['requests' => [$now]]));
        return false;
    }
}

// Check rate limiting
$ip = $_SERVER['REMOTE_ADDR'];
if (isRateLimited($ip)) {
    header('HTTP/1.1 429 Too Many Requests');
    exit;
}

// Allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the raw POST data
$postData = file_get_contents('php://input');
$data = json_decode($postData, true);

// Validate site ID
$siteId = isset($data['siteId']) ? $data['siteId'] : null;
if (!$siteId) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'Site ID not found']);
    exit;
}

// Check if site exists
$sitesFile = '../data/sites.json';
if (!file_exists($sitesFile)) {
    if (!file_exists('../data')) {
        mkdir('../data', 0755, true);
    }
    file_put_contents($sitesFile, json_encode([]));
}

$sites = json_decode(file_get_contents($sitesFile), true);
$siteExists = false;
foreach ($sites as $site) {
    if ($site['id'] === $siteId) {
        $siteExists = true;
        break;
    }
}

if (!$siteExists) {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'Site not found']);
    exit;
}

// Collect user data
$visitData = [
    'id' => uniqid(),
    'siteId' => $siteId,
    'timestamp' => date('c'), // ISO 8601 format
    'userAgent' => $_SERVER['HTTP_USER_AGENT'],
    'ip' => $_SERVER['REMOTE_ADDR'],
    'referrer' => isset($data['referrer']) ? $data['referrer'] : 'direct',
    'language' => isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? $_SERVER['HTTP_ACCEPT_LANGUAGE'] : 'unknown',
    'screenSize' => isset($data['screenSize']) ? $data['screenSize'] : 'unknown',
    'pixelRatio' => isset($data['pixelRatio']) ? $data['pixelRatio'] : 'unknown',
    'viewport' => isset($data['viewport']) ? $data['viewport'] : 'unknown',
    'platform' => isset($data['platform']) ? $data['platform'] : 'unknown',
    'browserName' => isset($data['browserName']) ? $data['browserName'] : 'unknown',
    'browserVersion' => isset($data['browserVersion']) ? $data['browserVersion'] : 'unknown'
];

// Ensure data directory exists
$dataDir = '../data/visits';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Save to database (JSON file)
$filename = $dataDir . '/visit-' . date('Y-m-d-H-i-s') . '-' . $visitData['id'] . '.json';
file_put_contents($filename, json_encode($visitData, JSON_PRETTY_PRINT));

// Return a transparent 1x1 pixel GIF
header('Content-Type: image/gif');
header('Content-Length: 42');
header('Cache-Control: no-cache, no-store, must-revalidate');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
?>
