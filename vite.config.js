import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/wialon-proxy': {
        target: 'https://hst-api.wialon.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wialon-proxy/, '/wialon/ajax.html'),
      },
    },
  },
})
