/**
 * Tracker Admin Dashboard
 * Frontend JavaScript for managing tracking sites and viewing visit data
 */

// API endpoints
const API = {
  sites: 'api/sites.php',
  visits: 'api/visits.php',
  siteVisits: (siteId) => `api/visits.php?siteId=${siteId}`,
  auth: 'api/auth.php'
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
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
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
      </div>
    `;
    
    siteCard.addEventListener('click', () => {
      currentSiteId = site.id;
      loadSiteDetails(site.id);
      showPage('site-details');
    });
    
    elements.sitesList.appendChild(siteCard);
    loadSiteVisitCounts(site.id);
  });
}

async function loadSiteVisitCounts(siteId) {
  const visits = await fetchData(API.siteVisits(siteId));
  
  if (!visits) return;
  
  const visitCountElement = document.getElementById(`site-${siteId}-visits`);
  if (visitCountElement) {
    visitCountElement.textContent = visits.length;
  }
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
  
  if (!visits || visits.length === 0) {
    container.innerHTML = '<p>No visits found.</p>';
    return;
  }
  
  visits.forEach(visit => {
    const site = allSites.find(s => s.id === visit.siteId) || { name: 'Unknown Site' };
    
    const visitItem = document.createElement('div');
    visitItem.className = 'visit-item';
    
    visitItem.innerHTML = `
      <div class="visit-info">
        <div class="visit-site">${site.name}</div>
        <div class="visit-details">
          <span><i class="fas fa-clock"></i> ${formatDate(visit.timestamp)}</span>
          <span><i class="fas fa-globe"></i> ${visit.browserName} ${visit.browserVersion || ''}</span>
          <span><i class="fas fa-desktop"></i> ${visit.platform}</span>
        </div>
      </div>
      <div class="visit-actions">
        <button class="btn btn-sm view-details-btn"><i class="fas fa-search"></i> Details</button>
      </div>
    `;
    
    const detailsBtn = visitItem.querySelector('.view-details-btn');
    detailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showVisitDetails(visit);
    });
    
    container.appendChild(visitItem);
  });
}

// Filter visits
function filterVisits() {
  const siteId = elements.siteFilter.value;
  const searchText = elements.searchVisits.value.toLowerCase();
  
  let filteredVisits = [...allVisits];
  
  // Filter by site
  if (siteId !== 'all') {
    filteredVisits = filteredVisits.filter(visit => visit.siteId === siteId);
  }
  
  // Filter by search text
  if (searchText) {
    filteredVisits = filteredVisits.filter(visit => {
      const site = allSites.find(s => s.id === visit.siteId) || { name: 'Unknown Site' };
      
      return (
        site.name.toLowerCase().includes(searchText) ||
        visit.browserName.toLowerCase().includes(searchText) ||
        visit.platform.toLowerCase().includes(searchText) ||
        visit.referrer.toLowerCase().includes(searchText)
      );
    });
  }
  
  renderVisits(filteredVisits, elements.visitsList);
}

// Update site filter dropdown
function updateSiteFilter(sites) {
  if (!elements.siteFilter) return;
  
  // Clear existing options except "All Sites"
  while (elements.siteFilter.options.length > 1) {
    elements.siteFilter.remove(1);
  }
  
  // Add site options
  sites.forEach(site => {
    const option = document.createElement('option');
    option.value = site.id;
    option.textContent = site.name;
    elements.siteFilter.appendChild(option);
  });
}

// Load Site Details
async function loadSiteDetails(siteId) {
  // Reset UI
  elements.siteInfo.innerHTML = '<div class="loading">Loading site details...</div>';
  elements.totalVisits.textContent = '0';
  elements.uniqueVisitors.textContent = '0';
  elements.todayVisits.textContent = '0';
  elements.siteSpecificVisits.innerHTML = '<div class="loading">Loading visits...</div>';
  
  // Get site data
  const site = allSites.find(s => s.id === siteId);
  if (!site) return;
  
  // Update title
  elements.siteDetailsTitle.textContent = site.name;
  
  // Update site info
  elements.siteInfo.innerHTML = `
    <h3>${site.name}</h3>
    <p><strong>URL:</strong> ${site.url}</p>
    <p><strong>Created:</strong> ${formatDate(site.createdAt)}</p>
    <p><strong>Site ID:</strong> ${site.id}</p>
  `;
  
  // Get visits for this site
  const visits = await fetchData(API.siteVisits(siteId));
  
  if (!visits) {
    elements.siteSpecificVisits.innerHTML = '<p>No visits recorded for this site.</p>';
    return;
  }
  
  // Update stats
  elements.totalVisits.textContent = visits.length;
  
  // Count unique visitors (by IP)
  const uniqueIPs = new Set();
  visits.forEach(visit => uniqueIPs.add(visit.ip));
  elements.uniqueVisitors.textContent = uniqueIPs.size;
  
  // Count today's visits
  const today = new Date().toDateString();
  const todaysVisits = visits.filter(visit => new Date(visit.timestamp).toDateString() === today);
  elements.todayVisits.textContent = todaysVisits.length;
  
  // Render visits
  renderVisits(visits, elements.siteSpecificVisits);
  
  // Update tracking code snippet
  const trackingCode = `<script src="${window.location.origin}/tracker/js/tracker.js?siteId=${site.id}"></script>`;
  elements.trackingSnippet.textContent = trackingCode;
}

// Add new site
async function addNewSite(event) {
  event.preventDefault();
  
  const name = elements.siteName.value.trim();
  const url = elements.siteUrl.value.trim();
  
  if (!name || !url) {
    alert('Please enter both site name and URL');
    return;
  }
  
  const newSite = await postData(API.sites, { name, url });
  
  if (newSite) {
    // Clear form
    elements.siteName.value = '';
    elements.siteUrl.value = '';
    
    // Reload sites and show sites page
    await loadSites();
    showPage('sites');
  } else {
    alert('Failed to create site. Please try again.');
  }
}

// Copy tracking code
function copyTrackingCode() {
  const trackingCode = elements.trackingSnippet.textContent;
  
  if (!trackingCode) return;
  
  navigator.clipboard.writeText(trackingCode)
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
    const response = await fetch(`${API.auth}?action=user`);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = 'index.php';
        return null;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Auth error:', error);
    // Redirect to login on error
    window.location.href = 'index.php';
    return null;
  }
}

function logout() {
  fetch(`${API.auth}?action=logout`)
    .then(() => {
      window.location.href = 'index.php';
    })
    .catch(error => {
      console.error('Logout error:', error);
      window.location.href = 'index.php';
    });
}

async function changePassword(event) {
  event.preventDefault();
  
  // Reset UI
  elements.passwordError.style.display = 'none';
  elements.passwordSuccess.style.display = 'none';
  
  const currentPassword = elements.currentPassword.value;
  const newPassword = elements.newPassword.value;
  const confirmPassword = elements.confirmPassword.value;
  
  // Validate passwords
  if (!currentPassword || !newPassword || !confirmPassword) {
    elements.passwordError.textContent = 'All fields are required';
    elements.passwordError.style.display = 'block';
    return;
  }
  
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
    const response = await fetch(`${API.auth}?action=change-password`, {
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
