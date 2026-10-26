import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      host: 'localhost',
      port: 5173,
    },
    // In Docker the backend is another container, so localhost would point at this one
    proxy: {
      '/api': { target: process.env.BACKEND_PROXY_TARGET || 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: process.env.BACKEND_PROXY_TARGET || 'http://localhost:3001', changeOrigin: true },
    },
  },
})
