import { Router } from 'express';

const router = Router();

// Dynamic sitemap generation
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const currentDate = new Date().toISOString().split('T')[0];

    // Generate sitemap with current data
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Landing Page - Highest Priority -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Authentication Page -->
  <url>
    <loc>${baseUrl}/auth</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Note: User-specific and private pages are excluded from sitemap -->
  <!-- Public share links are indexed when accessed -->
  
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt endpoint
router.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const robotsTxt = `User-agent: *
Allow: /
Allow: /auth
Allow: /share/*

# Block admin console and system paths
Disallow: /system/
Disallow: /admin/
Disallow: /api/
Disallow: /infrastructure

# Block user-specific content
Disallow: /dashboard
Disallow: /settings
Disallow: /profile
Disallow: /file/*
Disallow: /recent
Disallow: /starred
Disallow: /shared
Disallow: /trash
Disallow: /category/*

# Allow important static files
Allow: /logo.png
Allow: /logo-blurred-bg.png
Allow: /new-background.png

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay for respectful crawling
Crawl-delay: 1`;

  res.set('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

export default router;