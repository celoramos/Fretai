import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Em desenvolvimento a API Spring roda em :8080. O proxy evita configurar CORS no backend:
// o navegador fala só com o Vite, e o Vite repassa /api para a API.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.FRETAI_API ?? 'http://localhost:8080',
    },
  },
})
