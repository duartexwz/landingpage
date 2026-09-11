import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Dev:  npm run dev  -> front em :5173, /api proxia para o FastAPI em :8000.
// Prod: VITE_API_URL='' (mesma origem; Vercel/Nginx reescrevem /api -> backend).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 4173 },
  build: { outDir: 'dist', sourcemap: false },
})
