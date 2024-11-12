import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
    },
  },
});
