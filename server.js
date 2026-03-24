import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression for all responses (critical for performance)
app.use(compression({
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
}));

// Serve static files from dist/ with optimized caching
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: process.env.NODE_ENV === 'production' ? '365d' : '0',
  etag: false,
  // Set Cache-Control header for hashed assets (cache forever)
  setHeaders: (res, filePath) => {
    if (filePath.includes('assets/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// Serve index.html with no-cache for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.set('Content-Type', 'text/html');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found. Did you run `npm run build`?');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Optimizations: gzip compression, aggressive asset caching, SPA routing');
});
