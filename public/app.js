/**
 * Tracker Admin Dashboard
 * Frontend JavaScript for managing tracking sites and viewing visit data
 */

// API endpoints
const API = {
  sites: '/api/sites',
  visits: '/api/visits',
  siteVisits: (siteId) => `/api/sites/${siteId}/visits`,
  track: '/api/track'
};

// DOM Elements
const elements = {
  navItems: document.querySelectorAll('.sidebar nav ul li'),
  pages: document.querySelectorAll('.page'),
  sitesList: document.querySelector('.sites-list'),
  visitsList: document.querySelector('.visits-list'),
  siteFilter: document.getElementById('site-filter'),
  searchVisits: document.getElementById('search-visits'),
  addSiteForm: document.getElementById('add-site-form'),
  siteName: document.getElementById('site-name'),
  siteUrl: document.getElementById('site-url'),
  backBtn: document.querySelector('.back-btn'),
  siteDetailsTitle: document.getElementById('site-details-title'),
  siteInfo: document.querySelector('.site-info'),
  totalVisits: document.getElementById('total-visits'),
  uniqueVisitors: document.getElementById('unique-visitors'),
  todayVisits: document.getElementById('today-visits'),
  siteSpecificVisits: document.querySelector('.site-specific-visits'),
  trackingSnippet: document.getElementById('tracking-snippet'),
  copyCodeBtn: document.getElementById('copy-code'),
  logoutBtn: document.getElementById('logout-btn'),
  changePasswordForm: document.getElementById('change-password-form'),
  currentPassword: document.getElementById('current-password'),
  newPassword: document.getElementById('new-password'),
  confirmPassword: document.getElementById('confirm-password'),
  passwordError: document.getElementById('password-error'),
  passwordSuccess: document.getElementById('password-success'),
  usernameDisplay: document.getElementById('username-display')
};

// State
let currentSiteId = null;
let allSites = [];
let allVisits = [];

// Helper Functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function showPage(pageId) {
  elements.pages.forEach(page => {
    page.classList.remove('active');
  });
  
  document.getElementById(`${pageId}-page`).classList.add('active');
  
  elements.navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  const activeNavItem = Array.from(elements.navItems).find(item => item.dataset.page === pageId);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

async function postData(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Post error:', error);
    return null;
  }
}

// Load Sites
async function loadSites() {
  elements.sitesList.innerHTML = '<div class="loading">Loading sites...</div>';
  
  const sites = await fetchData(API.sites);
  allSites = sites || [];
  
  if (!sites || sites.length === 0) {
    elements.sitesList.innerHTML = '<p>No sites found. Create your first tracking site!</p>';
    return;
  }
  
  renderSites(sites);
  updateSiteFilter(sites);
}

function renderSites(sites) {
  elements.sitesList.innerHTML = '';
  
  sites.forEach(site => {
    const siteCard = document.createElement('div');
    siteCard.className = 'site-card';
    siteCard.dataset.siteId = site.id;
    
    siteCard.innerHTML = `
      <h3>${site.name}</h3>
      <p>${site.url}</p>
      <div class="site-stats">
        <div class="stat">
          <div class="stat-value" id="site-${site.id}-visits">-</div>
          <div class="stat-label">Visits</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="site-${site.id}-today">-</div>
          <div class="stat-label">Today</div>
        </div>
      </div>
    `;
    
    siteCard.addEventListener('click', () => {
      loadSiteDetails(site.id);
    });
    
    elements.sitesList.appendChild(siteCard);
    
    // Load visit counts for this site
    loadSiteVisitCounts(site.id);
  });
}

async function loadSiteVisitCounts(siteId) {
  const visits = await fetchData(API.siteVisits(siteId));
  
  if (!visits) return;
  
  const totalVisits = visits.length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(visit => 
    visit.timestamp.startsWith(today)
  ).length;
  
  document.getElementById(`site-${siteId}-visits`).textContent = totalVisits;
  document.getElementById(`site-${siteId}-today`).textContent = todayVisits;
}

// Load Visits
async function loadVisits() {
  elements.visitsList.innerHTML = '<div class="loading">Loading visits...</div>';
  
  const visits = await fetchData(API.visits);
  allVisits = visits || [];
  
  if (!visits || visits.length === 0) {
    elements.visitsList.innerHTML = '<p>No visits recorded yet.</p>';
    return;
  }
  
  renderVisits(visits, elements.visitsList);
}

function renderVisits(visits, container) {
  container.innerHTML = '';
  
  if (visits.length === 0) {
    container.innerHTML = '<p>No visits found.</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.className = 'visits-table';
  
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date & Time</th>
        <th>Site</th>
        <th>Browser</th>
        <th>Version</th>
        <th>Platform</th>
        <th>Screen Size</th>
        <th>Pixel Ratio</th>
        <th>Viewport</th>
        <th>Referrer</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  
  const tbody = table.querySelector('tbody');
  
  visits.forEach(visit => {
    const site = allSites.find(s => s.id === visit.siteId) || { name: 'Unknown' };
    
    // Handle both old and new data formats
    const browserName = visit.browserName || visit.browser || 'Unknown';
    const browserVersion = visit.browserVersion || 'Unknown';
    const pixelRatio = visit.pixelRatio || 'Unknown';
    const viewport = visit.viewport || 'Unknown';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(visit.timestamp)}</td>
      <td>${site.name}</td>
      <td>${browserName}</td>
      <td>${browserVersion}</td>
      <td>${visit.platform}</td>
      <td>${visit.screenSize}</td>
      <td>${pixelRatio}</td>
      <td>${viewport}</td>
      <td>${visit.referrer}</td>
      <td><button class="btn-details" data-visit-id="${visit.id}"><i class="fas fa-info-circle"></i></button></td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add event listeners to detail buttons
  table.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const visitId = btn.dataset.visitId;
      const visit = visits.find(v => v.id === visitId);
      if (visit) {
        showVisitDetails(visit);
      }
    });
  });
  
  container.appendChild(table);
}

// Filter visits
function filterVisits() {
  const siteId = elements.siteFilter.value;
  const searchTerm = elements.searchVisits.value.toLowerCase();
  
  let filteredVisits = [...allVisits];
  
  if (siteId !== 'all') {
    filteredVisits = filteredVisits.filter(visit => visit.siteId === siteId);
  }
  
  if (searchTerm) {
    filteredVisits = filteredVisits.filter(visit => {
      const site = allSites.find(s => s.id === visit.siteId) || { name: '' };
      const browserName = visit.browserName || visit.browser || '';
      return (
        browserName.toLowerCase().includes(searchTerm) ||
        (visit.browserVersion || '').toLowerCase().includes(searchTerm) ||
        visit.platform.toLowerCase().includes(searchTerm) ||
        visit.referrer.toLowerCase().includes(searchTerm) ||
        site.name.toLowerCase().includes(searchTerm)
      );
    });
  }
  
  renderVisits(filteredVisits, elements.visitsList);
}

// Update site filter dropdown
function updateSiteFilter(sites) {
  elements.siteFilter.innerHTML = '<option value="all">All Sites</option>';
  
  sites.forEach(site => {
    const option = document.createElement('option');
    option.value = site.id;
    option.textContent = site.name;
    elements.siteFilter.appendChild(option);
  });
}

// Load Site Details
async function loadSiteDetails(siteId) {
  currentSiteId = siteId;
  showPage('site-details');
  
  elements.siteInfo.innerHTML = '<div class="loading">Loading site details...</div>';
  elements.siteSpecificVisits.innerHTML = '<div class="loading">Loading visits...</div>';
  
  const site = await fetchData(`${API.sites}/${siteId}`);
  
  if (!site) {
    elements.siteInfo.innerHTML = '<p>Site not found.</p>';
    return;
  }
  
  elements.siteDetailsTitle.textContent = site.name;
  
  elements.siteInfo.innerHTML = `
    <h3>${site.name}</h3>
    <p><span class="info-label">URL:</span> ${site.url}</p>
    <p><span class="info-label">Site ID:</span> ${site.id}</p>
    <p><span class="info-label">Created:</span> ${formatDate(site.createdAt)}</p>
  `;
  
  // Generate tracking code snippet
  const baseUrl = window.location.origin;
  const trackingCode = `<script src="${baseUrl}/tracker.js?siteId=${site.id}"></script>`;
  elements.trackingSnippet.textContent = trackingCode;
  
  // Load visits for this site
  const visits = await fetchData(API.siteVisits(siteId));
  
  if (!visits) {
    elements.siteSpecificVisits.innerHTML = '<p>No visits recorded for this site.</p>';
    return;
  }
  
  // Update stats
  const totalVisits = visits.length;
  
  const uniqueIPs = new Set();
  visits.forEach(visit => uniqueIPs.add(visit.ip));
  const uniqueVisitorsCount = uniqueIPs.size;
  
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(visit => 
    visit.timestamp.startsWith(today)
  ).length;
  
  elements.totalVisits.textContent = totalVisits;
  elements.uniqueVisitors.textContent = uniqueVisitorsCount;
  elements.todayVisits.textContent = todayVisits;
  
  // Render visits table
  renderVisits(visits, elements.siteSpecificVisits);
}

// Add new site
async function addNewSite(event) {
  event.preventDefault();
  
  const name = elements.siteName.value.trim();
  const url = elements.siteUrl.value.trim();
  
  if (!name || !url) {
    alert('Please fill in all fields');
    return;
  }
  
  const newSite = await postData(API.sites, { name, url });
  
  if (newSite) {
    elements.siteName.value = '';
    elements.siteUrl.value = '';
    
    alert('Site created successfully!');
    loadSites();
    showPage('sites');
  } else {
    alert('Failed to create site. Please try again.');
  }
}

// Copy tracking code
function copyTrackingCode() {
  const code = elements.trackingSnippet.textContent;
  navigator.clipboard.writeText(code)
    .then(() => {
      elements.copyCodeBtn.textContent = 'Copied!';
      setTimeout(() => {
        elements.copyCodeBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Code';
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy code. Please select and copy manually.');
    });
}

// Event Listeners
elements.navItems.forEach(item => {
  item.addEventListener('click', () => {
    const pageId = item.dataset.page;
    showPage(pageId);
  });
});

elements.backBtn.addEventListener('click', () => {
  showPage('sites');
});

elements.addSiteForm.addEventListener('submit', addNewSite);

elements.siteFilter.addEventListener('change', filterVisits);
elements.searchVisits.addEventListener('input', filterVisits);

elements.copyCodeBtn.addEventListener('click', copyTrackingCode);

// Authentication functions
async function getCurrentUser() {
  try {
    const response = await fetch('/api/user');
    
    if (!response.ok) {
      // If not authenticated, redirect to login
      if (response.status === 401) {
        window.location.href = '/login';
        return null;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

async function logout() {
  try {
    await fetch('/api/logout');
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function changePassword(event) {
  event.preventDefault();
  
  const currentPassword = elements.currentPassword.value;
  const newPassword = elements.newPassword.value;
  const confirmPassword = elements.confirmPassword.value;
  
  // Reset messages
  elements.passwordError.style.display = 'none';
  elements.passwordSuccess.style.display = 'none';
  
  // Validate passwords
  if (newPassword !== confirmPassword) {
    elements.passwordError.textContent = 'New passwords do not match';
    elements.passwordError.style.display = 'block';
    return;
  }
  
  if (newPassword.length < 6) {
    elements.passwordError.textContent = 'New password must be at least 6 characters';
    elements.passwordError.style.display = 'block';
    return;
  }
  
  try {
    const response = await fetch('/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      elements.passwordSuccess.style.display = 'block';
      elements.currentPassword.value = '';
      elements.newPassword.value = '';
      elements.confirmPassword.value = '';
    } else {
      elements.passwordError.textContent = data.error || 'Failed to change password';
      elements.passwordError.style.display = 'block';
    }
  } catch (error) {
    console.error('Password change error:', error);
    elements.passwordError.textContent = 'An error occurred';
    elements.passwordError.style.display = 'block';
  }
}

// Show detailed visit information in a modal
function showVisitDetails(visit) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('visit-details-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'visit-details-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Visit Details</h2>
        <div class="visit-details-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add close functionality
    modal.querySelector('.close').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Close when clicking outside the modal
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Get site name
  const site = allSites.find(s => s.id === visit.siteId) || { name: 'Unknown' };
  
  // Format all visit data for display
  const detailsHTML = `
    <div class="detail-group">
      <h3>Basic Information</h3>
      <p><strong>Visit ID:</strong> ${visit.id}</p>
      <p><strong>Site:</strong> ${site.name}</p>
      <p><strong>Date & Time:</strong> ${formatDate(visit.timestamp)}</p>
      <p><strong>Referrer:</strong> ${visit.referrer}</p>
    </div>
    
    <div class="detail-group">
      <h3>Browser & Device</h3>
      <p><strong>Browser:</strong> ${visit.browserName || visit.browser || 'Unknown'} ${visit.browserVersion || ''}</p>
      <p><strong>Platform:</strong> ${visit.platform}</p>
      <p><strong>Language:</strong> ${visit.language || 'Unknown'}</p>
      <p><strong>User Agent:</strong> ${visit.userAgent || 'Unknown'}</p>
    </div>
    
    <div class="detail-group">
      <h3>Display Information</h3>
      <p><strong>Screen Size:</strong> ${visit.screenSize}</p>
      <p><strong>Pixel Ratio:</strong> ${visit.pixelRatio || 'Unknown'}</p>
      <p><strong>Viewport:</strong> ${visit.viewport || 'Unknown'}</p>
    </div>
    
    <div class="detail-group">
      <h3>Network Information</h3>
      <p><strong>IP Address:</strong> ${visit.ip || 'Unknown'}</p>
    </div>
    
    <div class="detail-group">
      <h3>Raw Data</h3>
      <pre>${JSON.stringify(visit, null, 2)}</pre>
    </div>
  `;
  
  // Update modal content and display it
  modal.querySelector('.visit-details-content').innerHTML = detailsHTML;
  modal.style.display = 'block';
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const user = await getCurrentUser();
  
  if (user) {
    // Update username display if element exists
    if (elements.usernameDisplay) {
      elements.usernameDisplay.textContent = user.username;
    }
    
    // Add logout event listener
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', logout);
    }
    
    // Add change password event listener
    if (elements.changePasswordForm) {
      elements.changePasswordForm.addEventListener('submit', changePassword);
    }
    
    // Load dashboard data
    loadSites();
    loadVisits();
  }
});
