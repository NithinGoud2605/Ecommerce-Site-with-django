import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    outDir: '../backend/staticfiles',  // Or a suitable path Django can serve
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',  // Replace with your backend server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
