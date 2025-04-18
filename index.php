<?php
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

// Generate CSRF token if it doesn't exist
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Add Content Security Policy
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://cdnjs.cloudflare.com data:;");

// Check if user is already logged in
if (isset($_SESSION['isAuthenticated']) && $_SESSION['isAuthenticated'] === true) {
    // Redirect to admin dashboard
    header('Location: admin.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
  <title>Login - Tracker Admin</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <link rel="stylesheet" href="css/styles.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f7fa;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #333;
    }
    
    .login-container {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 400px;
      padding: 40px;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .login-header h1 {
      color: #2c3e50;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .login-header h1 i {
      margin-right: 10px;
      color: #3498db;
    }
    
    .login-form .form-group {
      margin-bottom: 20px;
    }
    
    .login-form label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .login-form input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    
    .login-form button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 12px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      display: block;
      width: 100%;
      transition: background-color 0.3s;
    }
    
    .login-form button:hover {
      background-color: #2980b9;
    }
    
    .error-message {
      color: #e74c3c;
      margin-top: 20px;
      text-align: center;
      display: none;
    }
    
    .login-footer {
      margin-top: 30px;
      text-align: center;
      color: #7f8c8d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <h1><i class="fas fa-chart-line"></i> Tracker Admin</h1>
      <p>Please login to access the dashboard</p>
    </div>
    
    <form class="login-form" id="login-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" required>
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required>
      </div>
      
      <button type="submit">Login</button>
      
      <div class="error-message" id="error-message">
        Invalid username or password
      </div>
    </form>
    
    <div class="login-footer">
      <p>Please contact your administrator if you need access</p>
    </div>
  </div>
  
  <script>
    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const errorMessage = document.getElementById('error-message');
      
      try {
        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');
        
        errorMessage.textContent = 'Attempting to log in...';
        errorMessage.style.display = 'block';
        
        console.log('Sending login request for user:', username);
        const response = await fetch('api/auth.php?action=login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || ''
          },
          body: JSON.stringify({ username, password })
        });
        
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          errorMessage.textContent = 'Server returned invalid response. Check console for details.';
          return;
        }
        
        if (response.ok && data.success) {
          console.log('Login successful, redirecting to admin.php');
          errorMessage.textContent = 'Login successful! Redirecting...';
          window.location.href = 'admin.php';
        } else {
          console.error('Login failed:', data.error);
          errorMessage.textContent = data.error || 'Login failed. Please check your credentials.';
          errorMessage.style.display = 'block';
        }
      } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.style.display = 'block';
      }
    });
  </script>
</body>
</html>
