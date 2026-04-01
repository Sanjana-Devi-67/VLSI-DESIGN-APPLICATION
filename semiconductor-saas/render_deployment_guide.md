# Deploying Effii-Energy on Render — Complete Guide

## Your Project Architecture

Your app has **5 services** in Docker Compose. On Render, you'll deploy them as **separate services**:

| Component | Render Service Type | Notes |
|---|---|---|
| **Backend** (FastAPI + ML) | **Web Service** | Core API + ML inference |
| **Frontend** (React + Nginx) | **Static Site** | Vite-built SPA |
| **Database** (PostgreSQL) | **Render PostgreSQL** | Managed DB (free tier available) |
| **Monitoring** | **Web Service** | Optional — skip for now |
| **Quantum Service** | **Web Service** | Placeholder — skip for now |

---

## Do You Need Cloud Storage?

**Short answer: No, not for your current setup.**

Your app stores data in **PostgreSQL** (sensor uploads + predictions as JSONB). The ML model file ([lightgbm_model.pkl](file:///e:/Internship/Effii-Energy-main/ml_service/lightgbm_model.pkl), ~430KB) is baked into the Docker image at build time. There are no user-uploaded files stored on disk.

You'd only need cloud storage (like AWS S3 or Cloudinary) if you later wanted to:
- Store raw uploaded CSV files permanently (right now they're only parsed, not saved)
- Serve large model files that exceed Render's ephemeral disk limits

> [!TIP]
> **For now, skip cloud storage entirely.** Your current design works perfectly on Render as-is.

---

## Step-by-Step Deployment

### Step 1 — Push Code to GitHub

Make sure your repo is up to date on GitHub:
```bash
git add -A
git commit -m "Prepare for Render deployment"
git push origin main
```

---

### Step 2 — Create a PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **PostgreSQL**
2. Settings:
   - **Name**: `effii-energy-db`
   - **Database**: `semiconductor_db`
   - **User**: `semiconductor_user`
   - **Region**: Pick the closest to your users
   - **Plan**: Free (90-day limit) or Starter ($7/mo)
3. After creation, copy the **Internal Database URL** — it looks like:
   ```
   postgresql://semiconductor_user:xxxx@dpg-xxxx-a.oregon-postgres.render.com/semiconductor_db
   ```

> [!IMPORTANT]
> The **Internal URL** (starts with `dpg-`) is for service-to-service communication within Render. Use this for the backend's `DATABASE_URL`.

---

### Step 3 — Deploy the Backend (FastAPI Web Service)

1. Go to **New** → **Web Service** → connect your GitHub repo
2. Settings:
   - **Name**: `effii-energy-backend`
   - **Region**: Same as your database
   - **Runtime**: **Docker**
   - **Dockerfile Path**: [backend/Dockerfile](file:///e:/Internship/Effii-Energy-main/backend/Dockerfile)
   - **Docker Context**: `.` (root of repo)
3. **Environment Variables** — add these:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | The Internal Database URL from Step 2 |
   | `MODEL_PATH` | `/app/ml_service/lightgbm_model.pkl` |
   | `PYTHONPATH` | `/app` |

4. **Plan**: Free (spins down after 15 min inactivity) or Starter ($7/mo for always-on)
5. Click **Create Web Service**

> [!WARNING]
> The **free tier** will spin down your backend after 15 minutes of no requests. First request after sleep takes ~30-60 seconds. For a demo or internship project this is fine.

---

### Step 4 — Deploy the Frontend (Static Site)

Since your frontend is a React/Vite SPA, deploy it as a **Static Site** (free!):

1. Go to **New** → **Static Site** → connect your GitHub repo
2. Settings:
   - **Name**: `effii-energy-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. **Environment Variables**:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://effii-energy-backend.onrender.com` |

   (Replace with your actual backend URL from Step 3)

4. Click **Create Static Site**

---

### Step 5 — Code Changes Required

You need to make **3 small changes** before deploying:

---

#### Change 1: Update [frontend/src/services/api.js](file:///e:/Internship/Effii-Energy-main/frontend/src/services/api.js)

The frontend currently proxies API calls through `/api` which gets rewritten by Nginx/Vite. On Render, the frontend is a static site that calls the backend directly. The code already supports this via `VITE_API_URL` env var — **no change needed if you set the env var in Step 4**.

However, you should verify the env var is set at **build time** (Vite bakes env vars into the bundle).

---

#### Change 2: Backend Dockerfile — Remove `--reload` flag

The `--reload` flag is for development only. Change the last line of [backend/Dockerfile](file:///e:/Internship/Effii-Energy-main/backend/Dockerfile):

```diff
- CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
+ CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

#### Change 3: Backend [database.py](file:///e:/Internship/Effii-Energy-main/backend/database.py) — Handle Render's `postgres://` URL

Render provides URLs starting with `postgres://` but SQLAlchemy requires `postgresql://`. Add this fix:

```diff
  DATABASE_URL = os.getenv(
      "DATABASE_URL",
      "postgresql://semiconductor_user:semiconductor_pass_2024@localhost:5432/semiconductor_db"
  )
+ # Render uses 'postgres://' but SQLAlchemy needs 'postgresql://'
+ if DATABASE_URL.startswith("postgres://"):
+     DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
```

---

### Step 6 — Verify Deployment

After all services are deployed:

1. **Backend health check**: Visit `https://effii-energy-backend.onrender.com/health`
   - Should return `{"status": "healthy", "model_loaded": true, ...}`
2. **Frontend**: Visit `https://effii-energy-frontend.onrender.com`
   - Dashboard should load and fetch data from backend
3. **API docs**: Visit `https://effii-energy-backend.onrender.com/docs`
   - FastAPI auto-generated docs should work

---

## Summary of Changes Needed

| File | Change | Why |
|---|---|---|
| [backend/Dockerfile](file:///e:/Internship/Effii-Energy-main/backend/Dockerfile) | Remove `--reload` | Not for production |
| [backend/database.py](file:///e:/Internship/Effii-Energy-main/backend/database.py) | Fix `postgres://` → `postgresql://` | Render URL compatibility |
| (env var) `VITE_API_URL` | Set to backend URL | Frontend needs to know where the API is |

> [!NOTE]
> The **monitoring** and **quantum_service** are optional. You can deploy them later as additional Web Services if needed. They don't affect the core functionality.

---

## Cost Estimate (Render)

| Service | Free Tier | Paid |
|---|---|---|
| PostgreSQL | Free for 90 days | $7/mo (Starter) |
| Backend Web Service | Free (sleeps after 15 min) | $7/mo (always-on) |
| Frontend Static Site | **Always free** | — |
| **Total** | **$0** (with limitations) | **$14/mo** |
