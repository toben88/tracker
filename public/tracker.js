/**
 * Simple Tracker
 * A lightweight script to track user visits on websites
 */
(function() {
  // Configuration
  const trackerEndpoint = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api/track' 
    : 'https://your-tracker-domain.com/api/track';
  
  // Get the site ID from the script tag
  function getSiteId() {
    const scriptTags = document.getElementsByTagName('script');
    for (let i = 0; i < scriptTags.length; i++) {
      const src = scriptTags[i].src || '';
      if (src.includes('tracker.js')) {
        const urlParams = new URLSearchParams(src.split('?')[1] || '');
        return urlParams.get('siteId');
      }
    }
    return null;
  }
  
  // Get detailed browser information including vendor and version
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'unknown';
    let version = 'unknown';
    
    if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+(\.\d+)?)/);
      if (match) version = match[1];
    } else if (ua.includes('SamsungBrowser')) {
      browser = 'Samsung Browser';
      const match = ua.match(/SamsungBrowser\/(\d+(\.\d+)?)/);
      if (match) version = match[1];
    } else if (ua.includes('OPR') || ua.includes('Opera')) {
      browser = 'Opera';
      const match = ua.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/);
      if (match) version = match[1];
    } else if (ua.includes('Trident')) {
      browser = 'Internet Explorer';
      const match = ua.match(/rv:(\d+(\.\d+)?)/);
      if (match) version = match[1];
    } else if (ua.includes('Edg')) {
      browser = 'Edge';
      const match = ua.match(/Edg\/(\d+(\.\d+)?)/);
      if (match) version = match[1];
    } else if (ua.includes('Chrome')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+(\.\d+)?)/);
      if (match) version = match[1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+(\.\d+)?)/);
      if (match) version = match[1];
    }
    
    return {
      name: browser,
      version: version
    };
  }
  
  // Get platform information
  function getPlatformInfo() {
    const ua = navigator.userAgent;
    let platform = 'unknown';
    
    if (/Android/i.test(ua)) {
      platform = 'Android';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      platform = 'iOS';
    } else if (/Windows/i.test(ua)) {
      platform = 'Windows';
    } else if (/Mac/i.test(ua)) {
      platform = 'Mac';
    } else if (/Linux/i.test(ua)) {
      platform = 'Linux';
    }
    
    return platform;
  }
  
  // Get screen size and pixel ratio
  function getScreenInfo() {
    return {
      screenSize: `${window.screen.width}x${window.screen.height}`,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  
  // Get viewport dimensions
  function getViewportInfo() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    };
  }
  
  // Track the visit
  function trackVisit() {
    const siteId = getSiteId();
    
    if (!siteId) {
      console.error('Tracker: Site ID not found');
      return;
    }
    
    const browserInfo = getBrowserInfo();
    const screenInfo = getScreenInfo();
    const viewportInfo = getViewportInfo();
    
    const data = {
      siteId: siteId,
      referrer: document.referrer,
      screenSize: screenInfo.screenSize,
      pixelRatio: screenInfo.pixelRatio,
      viewport: `${viewportInfo.width}x${viewportInfo.height}`,
      platform: getPlatformInfo(),
      browserName: browserInfo.name,
      browserVersion: browserInfo.version
    };
    
    // Send tracking data
    fetch(trackerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      mode: 'cors',
      credentials: 'omit'
    }).catch(error => {
      console.error('Tracker error:', error);
    });
  }
  
  // Track when the page is loaded
  if (document.readyState === 'complete') {
    trackVisit();
  } else {
    window.addEventListener('load', trackVisit);
  }
})();
