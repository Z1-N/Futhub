import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/football': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/espn': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/espn2': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/standings': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/upcoming': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/team': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
