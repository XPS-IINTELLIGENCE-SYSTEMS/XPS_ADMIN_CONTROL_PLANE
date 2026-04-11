import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path for GitHub Pages deployment (set BASE_PATH env var to '/XPS_ADMIN_CONTROL_PLANE/')
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  plugins: [react()],
  base,
  // Expose env vars that start with any of these service-name prefixes to the browser
  envPrefix: ['SUPABASE_', 'OPENAI_', 'GITHUB_', 'VERCEL_', 'GROQ_', 'GCP_', 'GEMINI_', 'OLLAMA_', 'HUBSPOT_', 'AIRTABLE_', 'BROWSER_', 'GPT_', 'API_', 'BASE_'],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
