import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SITE_URL = 'https://genie-app.com';
const SUPPORTED_LANGUAGES = ['en', 'fr'];

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/features', priority: 0.9, changefreq: 'weekly' },
  { path: '/privacy-policy', priority: 0.5, changefreq: 'monthly' },
  { path: '/terms', priority: 0.5, changefreq: 'monthly' },
  { path: '/blog', priority: 0.8, changefreq: 'daily' },
];

async function findDynamicRoutes() {
  const routes = [];
  
  // Example: Find all blog posts
  const blogFiles = await glob('src/content/blog/**/*.mdx');
  for (const file of blogFiles) {
    const slug = path
      .basename(file, '.mdx')
      .replace(/^\d{4}-\d{2}-\d{2}-/, ''); // Remove date prefix if exists
    routes.push({
      path: `/blog/${slug}`,
      priority: 0.7,
      changefreq: 'weekly',
    });
  }

  return routes;
}

function generateSitemapXML(routes) {
  const xml = [];
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  xml.push('  xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  xml.push('  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');

  // Generate entries for each route and language
  for (const route of routes) {
    for (const lang of SUPPORTED_LANGUAGES) {
      const langPath = lang === 'fr' ? route.path : `/${lang}${route.path}`;
      const fullUrl = `${SITE_URL}${langPath}`;
      
      xml.push('  <url>');
      xml.push(`    <loc>${fullUrl}</loc>`);
      xml.push(`    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>`);
      xml.push(`    <changefreq>${route.changefreq}</changefreq>`);
      xml.push(`    <priority>${route.priority}</priority>`);
      
      // Add language alternates
      for (const alternateLang of SUPPORTED_LANGUAGES) {
        const alternatePath = alternateLang === 'fr' 
          ? route.path 
          : `/${alternateLang}${route.path}`;
        xml.push('    <xhtml:link');
        xml.push(`      rel="alternate"`);
        xml.push(`      hreflang="${alternateLang}"`);
        xml.push(`      href="${SITE_URL}${alternatePath}"/>`);
      }
      
      xml.push('  </url>');
    }
  }

  xml.push('</urlset>');
  return xml.join('\n');
}

async function main() {
  try {
    // Combine static and dynamic routes
    const dynamicRoutes = await findDynamicRoutes();
    const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];

    // Generate sitemap XML
    const sitemapXML = generateSitemapXML(allRoutes);

    // Write to file
    fs.writeFileSync('public/sitemap.xml', sitemapXML);
    console.log('Sitemap generated successfully!');

  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

main();
