<?php
// Enhance session security - must be set before session_start()
ini_set('session.cookie_httponly', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

// Start session
session_start();

// Regenerate session ID on each request
session_regenerate_id(true);

// Generate CSRF token if it doesn't exist
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Add Content Security Policy
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://cdnjs.cloudflare.com data:;");

// Check if user is logged in
if (!isset($_SESSION['isAuthenticated']) || $_SESSION['isAuthenticated'] !== true) {
    // Redirect to login page
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
  <title>Tracker Admin Dashboard</title>
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
</head>
<body>
  <div class="container">
    <header>
      <div class="header-content">
        <h1><i class="fas fa-chart-line"></i> Tracker Admin Dashboard</h1>
        <div class="user-controls">
          <span class="username">Welcome, <span id="username-display"><?php echo htmlspecialchars($_SESSION['username']); ?></span></span>
          <button id="logout-btn" class="btn btn-sm"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </div>
    </header>
    
    <div class="dashboard">
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Navigation</h2>
        </div>
        <nav>
          <ul>
            <li class="active" data-page="sites"><i class="fas fa-globe"></i> Sites</li>
            <li data-page="visits"><i class="fas fa-eye"></i> All Visits</li>
            <li data-page="add-site"><i class="fas fa-plus-circle"></i> Add New Site</li>
            <li data-page="settings"><i class="fas fa-cog"></i> Settings</li>
          </ul>
        </nav>
      </div>
      
      <div class="content">
        <!-- Sites Page -->
        <div class="page active" id="sites-page">
          <h2>Your Tracking Sites</h2>
          <div class="sites-list">
            <div class="loading">Loading sites...</div>
          </div>
        </div>
        
        <!-- Visits Page -->
        <div class="page" id="visits-page">
          <h2>All Tracked Visits</h2>
          <div class="filter-controls">
            <select id="site-filter">
              <option value="all">All Sites</option>
            </select>
            <input type="text" id="search-visits" placeholder="Search visits...">
          </div>
          <div class="visits-list">
            <div class="loading">Loading visits...</div>
          </div>
        </div>
        
        <!-- Add Site Page -->
        <div class="page" id="add-site-page">
          <h2>Add New Tracking Site</h2>
          <form id="add-site-form">
            <div class="form-group">
              <label for="site-name">Site Name:</label>
              <input type="text" id="site-name" required>
            </div>
            <div class="form-group">
              <label for="site-url">Site URL:</label>
              <input type="url" id="site-url" required>
            </div>
            <button type="submit" class="btn">Create Site</button>
          </form>
        </div>
        
        <!-- Settings Page -->
        <div class="page" id="settings-page">
          <h2>Account Settings</h2>
          <div class="settings-section">
            <h3>Change Password</h3>
            <form id="change-password-form">
              <div class="form-group">
                <label for="current-password">Current Password:</label>
                <input type="password" id="current-password" required>
              </div>
              <div class="form-group">
                <label for="new-password">New Password:</label>
                <input type="password" id="new-password" required>
              </div>
              <div class="form-group">
                <label for="confirm-password">Confirm New Password:</label>
                <input type="password" id="confirm-password" required>
              </div>
              <div class="password-error" id="password-error"></div>
              <div class="password-success" id="password-success">Password changed successfully!</div>
              <button type="submit" class="btn">Change Password</button>
            </form>
          </div>
        </div>
        
        <!-- Site Details Page -->
        <div class="page" id="site-details-page">
          <div class="site-header">
            <button class="back-btn"><i class="fas fa-arrow-left"></i> Back to Sites</button>
            <h2 id="site-details-title">Site Details</h2>
          </div>
          <div class="site-info">
            <div class="loading">Loading site details...</div>
          </div>
          <div class="site-stats">
            <h3>Visit Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <h4>Total Visits</h4>
                <div class="stat-value" id="total-visits">0</div>
              </div>
              <div class="stat-card">
                <h4>Unique Visitors</h4>
                <div class="stat-value" id="unique-visitors">0</div>
              </div>
              <div class="stat-card">
                <h4>Today's Visits</h4>
                <div class="stat-value" id="today-visits">0</div>
              </div>
            </div>
          </div>
          <div class="site-visits">
            <h3>Recent Visits</h3>
            <div class="visits-list site-specific-visits">
              <div class="loading">Loading visits...</div>
            </div>
          </div>
          <div class="tracking-code">
            <h3>Tracking Code</h3>
            <p>Add this code to your website to start tracking:</p>
            <pre id="tracking-snippet"></pre>
            <button id="copy-code" class="btn"><i class="fas fa-copy"></i> Copy Code</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script src="js/app.js"></script>
</body>
</html>
