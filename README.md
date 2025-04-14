# Web Analytics Tracker

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A lightweight, self-hosted web analytics solution that allows you to monitor visitor activity across multiple websites. This application provides a tracking script to embed in your HTML pages and a secure admin dashboard to visualize the collected data.

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
- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

The server will run on http://localhost:3000 by default.

## 📝 Usage

### Admin Dashboard

1. Access http://localhost:3000 in your browser
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
<script src="http://localhost:3000/tracker.js?siteId=YOUR_SITE_ID"></script>
```

3. Replace `localhost:3000` with your actual server domain when deploying to production

### Viewing Tracking Data

- The admin dashboard shows all sites and their visit statistics
- Click on a site to view detailed information and visit data
- Use the "All Visits" page to see visits across all sites
- Filter visits by site or search for specific information
- Click the info button on any visit to see complete details

## 🔧 Project Structure

```
/
├── public/              # Frontend assets
│   ├── app.js          # Admin dashboard JavaScript
│   ├── index.html      # Admin dashboard HTML
│   ├── login.html      # Login page
│   ├── styles.css      # CSS styles
│   ├── tracker.js      # Tracking script for embedding
│   └── sample.html     # Example implementation
├── server.js           # Express server and API endpoints
├── package.json        # Dependencies and scripts
├── db.json             # Database file (created on first run)
└── README.md           # Documentation
```

## 🌐 Deployment

For production use, consider the following:

1. **Hosting**: Set up the application on a server with a proper domain
2. **Configuration**: Update the `trackerEndpoint` in `tracker.js` to point to your production domain
3. **Security**: 
   - Use HTTPS for all traffic
   - Set a strong admin password
   - Consider implementing rate limiting
4. **Scaling**: For high-traffic sites, replace LowDB with a more robust database solution

## 🔒 Privacy Considerations

- This tracker collects user data, so ensure you comply with privacy regulations (GDPR, CCPA, etc.)
- Add appropriate privacy disclosures to your website
- Consider implementing cookie consent if required in your jurisdiction
- The tracker does not use cookies by default, but collects IP addresses and user agent data

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is [MIT](LICENSE) licensed.

---

Built with ❤️ for simple, privacy-respecting web analytics
