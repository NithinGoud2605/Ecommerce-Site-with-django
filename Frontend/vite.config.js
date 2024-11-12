import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/static/',  // Matches Django's STATIC_URL
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',  // Backend URL for local dev
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',  // Ensures build output is in 'frontend/dist'
    assetsDir: 'assets'  // Subdirectory for static assets
  }
});
