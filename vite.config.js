import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Base path for GitHub Pages deployment (set BASE_PATH env var to '/XPS_ADMIN_CONTROL_PLANE/')
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.join(rootDir, 'api')

function devApiRuntime({ proxyTarget } = {}) {
  return {
    name: 'xps-dev-api-runtime',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (proxyTarget) return next()

        try {
          const requestUrl = new URL(req.url || '/', 'http://localhost')
          if (!requestUrl.pathname.startsWith('/api/')) return next()

          const relativePath = requestUrl.pathname.replace(/^\/api\//, '')
          const apiPath = path.normalize(path.join(apiDir, `${relativePath}.js`))
          if (!apiPath.startsWith(apiDir)) {
            res.statusCode = 400
            res.end('Invalid API path')
            return
          }

          const stats = await fs.stat(apiPath)
          req.query = Object.fromEntries(requestUrl.searchParams.entries())
          req.body = await readJsonBody(req)
          decorateResponse(res)

          const mod = await import(`${pathToFileURL(apiPath).href}?v=${stats.mtimeMs}`)
          if (typeof mod.default !== 'function') {
            res.statusCode = 500
            res.end('API handler missing default export')
            return
          }

          await mod.default(req, res)
        } catch (err) {
          if (err?.name === 'MalformedJsonBodyError') {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
            return
          }
          if (err?.code === 'ENOENT') return next()
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Dev API runtime failed' }))
        }
      })
    },
  }
}

async function readJsonBody(req) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) return {}
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    const err = new Error('Malformed JSON request body')
    err.name = 'MalformedJsonBodyError'
    throw err
  }
}

function decorateResponse(res) {
  if (typeof res.status !== 'function') {
    res.status = (code) => {
      res.statusCode = code
      return res
    }
  }
  if (typeof res.json !== 'function') {
    res.json = (payload) => {
      if (!res.headersSent) res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(payload))
      return res
    }
  }
  if (typeof res.send !== 'function') {
    res.send = (payload) => {
      if (typeof payload === 'object' && payload !== null) return res.json(payload)
      res.end(payload)
      return res
    }
  }
}

export default defineConfig(({ mode }) => {
  const fullEnv = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, fullEnv)

  const base = process.env.BASE_PATH || '/'
  const apiProxyUrl = process.env.API_PROXY_URL || ''

  return {
    plugins: [react(), devApiRuntime({ proxyTarget: apiProxyUrl })],
    base,
    // Expose env vars that start with any of these service-name prefixes to the browser
    envPrefix: ['SUPABASE_', 'OPENAI_', 'GITHUB_', 'VERCEL_', 'GROQ_', 'GCP_', 'GEMINI_', 'OLLAMA_', 'HUBSPOT_', 'AIRTABLE_', 'BROWSER_', 'TWILIO_', 'SENDGRID_', 'GPT_', 'API_', 'BASE_'],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: apiProxyUrl
      ? {
          proxy: {
            '/api': {
              target: apiProxyUrl,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  }
})
