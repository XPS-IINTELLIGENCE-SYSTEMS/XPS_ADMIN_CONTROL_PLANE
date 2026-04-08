# XPS Admin Control Plane

Admin control panel for XPS Intelligence – React + Vite frontend, Vercel serverless API, Supabase auth/data, and OpenAI/Groq/Ollama-powered chat & scraping.

---

## 🗂 Project structure

```
.
├── src/                    # React frontend
│   ├── App.jsx             # Main app (auth, pages)
│   ├── lib/
│   │   └── supabaseClient.js  # Supabase client + auth helpers
│   └── components/
│       └── DeploymentStatus.jsx
├── api/                    # Vercel serverless functions
│   ├── health.js           # GET  /api/health
│   ├── chat.js             # POST /api/chat
│   └── scrape.js           # POST /api/scrape
├── .github/workflows/
│   ├── deploy-frontend.yml # GitHub Pages CI/CD
│   ├── deploy-vercel.yml   # Vercel CI/CD (frontend + API)
│   └── validate.yml        # Post-deploy validation
├── vercel.json             # Vercel routing config
├── vite.config.js          # Vite config (base path, proxy)
└── .env.sample             # Environment variable template
```

---

## 🚀 Quick start (local dev)

```bash
# 1. Copy env template
cp .env.sample .env.local
# Edit .env.local and fill in your Supabase + LLM keys

# 2. Install dependencies
npm install

# 3. Start dev server (frontend on :5173, API via Vercel CLI on :3000)
npm run dev

# Or run both with Vercel CLI (required for /api/* routes):
# npx vercel dev
```

---

## 🔐 Environment variables

| Variable | Where used | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `VITE_API_URL` | Frontend | Backend base URL (empty = relative) |
| `VITE_BASE_PATH` | Build | Base path (`/` for Vercel, `/XPS_ADMIN_CONTROL_PLANE/` for GitHub Pages) |
| `SUPABASE_URL` | API serverless | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | API serverless | Server-side Supabase key |
| `OPENAI_API_KEY` | API serverless | OpenAI key (chat + scrape) |
| `GROQ_API_KEY` | API serverless | Groq key (alternative to OpenAI) |
| `OLLAMA_BASE_URL` | API serverless | Ollama local URL (alternative) |

Set **at least one** LLM provider key (`OPENAI_API_KEY`, `GROQ_API_KEY`, or `OLLAMA_BASE_URL`) to enable chat and scraping.

---

## 🌐 Deployment

### Vercel (recommended – hosts both frontend + API)

1. Import the repository in [vercel.com](https://vercel.com).
2. Set all environment variables in **Settings → Environment Variables**.
3. Push to `main` – CI deploys automatically.

#### Required GitHub secrets for the Vercel workflow

| Secret | How to get |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel projects ls` or `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Same as above |
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `VITE_API_URL` | Your Vercel deployment URL |

### GitHub Pages (frontend only)

1. In the repo **Settings → Pages**, set source to **GitHub Actions**.
2. Add the same `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` secrets.
3. Push to `main` – the `deploy-frontend.yml` workflow builds and deploys automatically.

The site will be available at: `https://<org>.github.io/XPS_ADMIN_CONTROL_PLANE/`

---

## 🔌 API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Service health + env checks |
| `POST` | `/api/chat` | Chat with LLM. Body: `{ messages: [{role, content}] }` |
| `POST` | `/api/scrape` | Scrape + summarise a URL. Body: `{ url, prompt? }` |

---

## 🗄 Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Enable **Email auth** in Authentication → Providers.
3. (Optional) Create a `profiles` table:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can manage own profile"
  on profiles for all using (auth.uid() = id);
```

4. Copy your **Project URL** and **anon key** into `.env.local` / GitHub secrets.

---

## 🤖 LLM providers

The API supports three providers, checked in priority order:

1. **OpenAI** – set `OPENAI_API_KEY` (uses `gpt-4o-mini` by default)
2. **Groq** – set `GROQ_API_KEY` (uses `llama3-8b-8192`; free tier available)
3. **Ollama** – set `OLLAMA_BASE_URL` (e.g. `http://localhost:11434`; fully local)

---

## ✅ Validation

The `validate.yml` workflow runs automatically after every deployment and checks:

- UI loads (HTTP 200)
- `/api/health` returns `{"status":"ok"}`
- `/api/chat` endpoint is reachable
- `/api/scrape` endpoint is reachable

Trigger it manually: **Actions → Post-Deploy Validation → Run workflow**.

---

## 🏗 CI/CD at a glance

| Trigger | Workflow | Result |
|---|---|---|
| Push to `main` | `deploy-frontend.yml` | GitHub Pages deploy |
| Push to `main` | `deploy-vercel.yml` | Vercel production deploy |
| PR to `main` | `deploy-vercel.yml` | Vercel preview deploy |
| Deployment success | `validate.yml` | Automated smoke tests |

