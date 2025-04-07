import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Try these common backend ports (pick one that matches your backend)
      '/api': {
        target: 'http://localhost:3000', // Most common Express.js port
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if backend doesn't use /api prefix
      }
    }
  }
});