import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: parseInt(process.env.VITE_PORT) || 3001,
    host: true,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser'
  }
})
