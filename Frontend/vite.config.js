import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/static/', // Align with Django's STATIC_URL
  build: {
    outDir: 'dist',  // Output to the dist directory within the frontend directory
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Ensure assets are correctly placed within the static directory
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
      plugins: [
        {
          name: 'generate-sitemap-robots',
          closeBundle() {
            try {
              const outDir = path.resolve(__dirname, 'dist');
              const baseUrl = process.env.VITE_SITE_URL || 'https://example.com';
              const routes = ['/', '/shop', '/collection', '/about', '/contact'];
              const content = `<?xml version="1.0" encoding="UTF-8"?>\n` +
                `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
                routes.map((r) => `\n  <url><loc>${baseUrl}${r}</loc></url>`).join('') +
                `\n</urlset>\n`;
              fs.writeFileSync(path.join(outDir, 'sitemap.xml'), content);
              fs.writeFileSync(path.join(outDir, 'robots.txt'), `Sitemap: ${baseUrl}/sitemap.xml\nUser-agent: *\nAllow: /\n`);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn('sitemap/robots generation failed:', e?.message || e);
            }
          }
        }
      ]
    },
  },
});
