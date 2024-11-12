import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/static/',  // Align with Django's STATIC_URL
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
