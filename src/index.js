const express = require('express');
const path = require('path');
const helmet = require('helmet');

const webApp = express();
const PORT = process.env.PORT || 8080;
const ROOT = path.join(__dirname, '..');

webApp.use(
     helmet({
          contentSecurityPolicy: {
               directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "blob:"],
                    connectSrc: ["'self'"],
                    workerSrc: ["'self'", "blob:"]
               }
          }
     })
);

// Serve the root landing page and all its assets (index.html, styles.css, web-resources/, etc.)
webApp.use(express.static(ROOT, {
     extensions: ['html'],
     index: 'index.html'
}));

// Also serve the SEALIS mockup app at /app (convenient short URL)
webApp.use('/app', express.static(path.join(ROOT, 'app/src'), {
     extensions: ['html'],
     index: 'index.html'
}));

// Fallback to landing page for unmatched routes
webApp.use((_, res) => {
     res.status(404).sendFile(path.join(ROOT, 'index.html'));
});

webApp.listen(PORT, () => {
     console.log(`Alluviums site running on http://localhost:${PORT}`);
});