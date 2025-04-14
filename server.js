const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const bcrypt = require('bcryptjs');

// Initialize database
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default data structure
db.defaults({ sites: [], visits: [], admins: [] }).write();

// Initialize admin account if none exists
if (db.get('admins').size().value() === 0) {
  const defaultPassword = 'admin123'; // Default password, should be changed after first login
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  
  db.get('admins').push({
    id: uuidv4(),
    username: 'admin',
    password: hashedPassword,
    createdAt: new Date().toISOString()
  }).write();
  
  console.log('Default admin account created. Username: admin, Password: admin123');
  console.log('Please change this password after your first login!');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: uuidv4(), // Generate a random secret on server start
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware for admin routes
const requireAuth = (req, res, next) => {
  // Skip auth check for the tracking API and login page
  if (req.path === '/api/track' || req.path === '/login' || req.path.startsWith('/tracker.js')) {
    return next();
  }
  
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  // If API request, return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Redirect to login page
  res.redirect('/login');
};

// Authentication Routes
// Login route
app.get('/login', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  const admin = db.get('admins').find({ username }).value();
  
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Set session
  req.session.isAuthenticated = true;
  req.session.userId = admin.id;
  req.session.username = admin.username;
  
  res.json({ success: true });
});

// Logout route
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Change password route
app.post('/api/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  
  const admin = db.get('admins').find({ id: req.session.userId }).value();
  
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  // Update password
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.get('admins')
    .find({ id: req.session.userId })
    .assign({ password: hashedPassword })
    .write();
  
  res.json({ success: true });
});

// Apply auth middleware to all routes except tracking
app.use(requireAuth);

// Routes
// Track a visit
app.post('/api/track', (req, res) => {
  const { siteId, referrer } = req.body;
  
  // Validate site ID
  const site = db.get('sites').find({ id: siteId }).value();
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  
  // Collect user data
  const visitData = {
    id: uuidv4(),
    siteId,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    referrer: referrer || 'direct',
    language: req.headers['accept-language'],
    screenSize: req.body.screenSize || 'unknown',
    pixelRatio: req.body.pixelRatio || 'unknown',
    viewport: req.body.viewport || 'unknown',
    platform: req.body.platform || 'unknown',
    browserName: req.body.browserName || 'unknown',
    browserVersion: req.body.browserVersion || 'unknown'
  };
  
  // Save to database
  db.get('visits').push(visitData).write();
  
  // Return a transparent 1x1 pixel GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', pixel.length);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(pixel);
});

// Create a new site
app.post('/api/sites', (req, res) => {
  const { name, url } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }
  
  const newSite = {
    id: uuidv4(),
    name,
    url,
    createdAt: new Date().toISOString()
  };
  
  db.get('sites').push(newSite).write();
  res.status(201).json(newSite);
});

// Get all sites
app.get('/api/sites', (req, res) => {
  const sites = db.get('sites').value();
  res.json(sites);
});

// Get a specific site
app.get('/api/sites/:id', (req, res) => {
  const site = db.get('sites').find({ id: req.params.id }).value();
  
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  
  res.json(site);
});

// Get visits for a specific site
app.get('/api/sites/:id/visits', (req, res) => {
  const site = db.get('sites').find({ id: req.params.id }).value();
  
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  
  const visits = db.get('visits').filter({ siteId: req.params.id }).value();
  res.json(visits);
});

// Get all visits
app.get('/api/visits', (req, res) => {
  const visits = db.get('visits').value();
  res.json(visits);
});

// Serve the admin interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get current user info
app.get('/api/user', (req, res) => {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    id: req.session.userId,
    username: req.session.username
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
