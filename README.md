# Web Analytics Tracker

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)

A lightweight, self-hosted PHP web analytics solution that allows you to monitor visitor activity across multiple websites. This application provides a tracking script to embed in your HTML pages and a secure admin dashboard to visualize the collected data.

## 📊 Features

### Data Collection
- **Browser Information**: Name, version, language settings
- **Device Details**: Platform, screen size, pixel ratio, viewport dimensions
- **Visit Context**: Referrer, timestamp, IP address
- **Custom Site Tracking**: Generate unique tracking codes for different websites

### Admin Dashboard
- **Secure Access**: Password-protected admin interface
- **Multi-site Management**: Track and compare multiple websites
- **Detailed Analytics**: View comprehensive visit data
- **Search & Filter**: Find specific visit information
- **Data Export**: View raw data for further analysis

## 🚀 Getting Started

### Prerequisites
- PHP 8.0 or higher
- Web server with PHP support (Apache, Nginx, etc.)
- Write permissions for the application's data directory

### Installation

1. Clone or download this repository
2. Upload the contents of the `php-version` directory to your web server
3. Set proper permissions:
   - `755` for directories
   - `644` for files
   - `755` for the `data` directory
4. Access the application through your web browser

## 📝 Usage

### Admin Dashboard

1. Access the application URL in your browser (e.g., https://yourdomain.com/tracker/)
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
3. **IMPORTANT**: Change your password immediately after first login
4. Create a new tracking site by clicking "Add New Site" in the sidebar
5. Enter a name and URL for your site
6. Once created, click on the site card to view details and get the tracking code

### Adding Tracking to Your Website

1. From the site details page, copy the tracking code snippet
2. Paste the tracking code into the HTML of your website, ideally just before the closing `</body>` tag:

```html
<script src="https://yourdomain.com/tracker/js/tracker.js?siteId=YOUR_SITE_ID"></script>
```

3. Replace `yourdomain.com/tracker` with your actual server domain and path

### Viewing Tracking Data

- The admin dashboard shows all sites and their visit statistics
- Click on a site to view detailed information and visit data
- Use the "All Visits" page to see visits across all sites
- Filter visits by site or search for specific information
- Click the info button on any visit to see complete details

## 🔧 Project Structure

```
/
├── api/                # Backend API endpoints
│   ├── auth.php        # Authentication endpoints
│   ├── sites.php       # Site management endpoints
│   ├── track.php       # Tracking data collection
│   └── visits.php      # Visit data retrieval
├── css/                # CSS styles
├── data/               # Data storage directory
│   ├── admins.json     # Admin user accounts
│   ├── sites/          # Site configuration files
│   └── visits/         # Visit data records
├── js/                 # JavaScript files
│   ├── app.js          # Admin dashboard functionality
│   └── tracker.js      # Tracking script for embedding
├── admin.php           # Admin dashboard
├── index.php           # Login page
└── README.md           # Documentation
```

## 🌐 Deployment

For production use, consider the following:

1. **Hosting**: Upload to any web server with PHP support (shared hosting works fine)
2. **Permissions**: Ensure proper file permissions as mentioned in the installation section
3. **Security**: 
   - Use HTTPS for all traffic
   - Set a strong admin password
   - The application includes built-in rate limiting and CSRF protection
   - Protect the data directory with the included .htaccess file
4. **Scaling**: For high-traffic sites, consider migrating from JSON files to a database like MySQL

## 🔒 Privacy Considerations

- This tracker collects user data, so ensure you comply with privacy regulations (GDPR, CCPA, etc.)
- Add appropriate privacy disclosures to your website
- Consider implementing cookie consent if required in your jurisdiction
- The tracker does not use cookies by default, but collects IP addresses and user agent data

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

© 2025 All Rights Reserved.

This software and associated documentation files are proprietary and confidential. No part of this software may be reproduced, modified, distributed, or sublicensed without prior written permission from the copyright holder.

See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for simple, privacy-respecting web analytics
