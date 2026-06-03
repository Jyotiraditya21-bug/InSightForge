# Deployment Guide - Multi-Agent Research Assistant

Follow this guide to deploy your Multi-Agent Research Assistant to production.

---

## 1. Backend Deployment (Railway)

We deploy the FastAPI server to **Railway**.

### Step 1: Initialize Git Repository
In your project root (`/Users/jimmycodes/.gemini/antigravity-ide/scratch/multi_agent_research_assistant`), initialize a git repository and commit all code:
```bash
git init
git add .
git commit -m "Initial commit of Research OS"
```
*Note: Make sure to push this repository to GitHub.*

### Step 2: Create a Railway Project
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo** and select your repository.

### Step 3: Configure Service Path
If your repository contains both folders, configure Railway to build only from the `backend/` directory:
1. Select the service in the Railway canvas.
2. Go to **Settings** -> **General**.
3. Set the **Root Directory** to `/backend`.
4. Set the **Start Command** to `uvicorn main:app --host 0.0.0.0 --port 8000` (this is also specified in the `Procfile`).

### Step 4: Configure Environment Variables
Go to the **Variables** tab of the backend service and add:
- `GROQ_API_KEY`: *Your live Groq API Key*
- `TAVILY_API_KEY`: *Your live Tavily API Key*
- `PORT`: `8000`

---

## 2. Frontend Deployment (Vercel)

We deploy the React/TS (Vite) app to **Vercel**.

### Step 1: Set Up Project on Vercel
1. Log in to the [Vercel Dashboard](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.

### Step 2: Configure Build & Development Settings
Under the project configuration:
1. Set the **Root Directory** to `frontend`.
2. Vercel will automatically detect **Vite** as the framework preset and configure the build command (`npm run build`) and output directory (`dist`).

### Step 3: Configure Environment Variables
Under the **Environment Variables** section, add the following key:
- `VITE_API_URL`: *Your production Railway backend URL* (e.g. `https://your-service-production.up.railway.app` without a trailing slash).

### Step 4: Deploy
Click **Deploy**. Once finished, Vercel will provide your production frontend link.

---

## 3. Verify Production Integration
1. Open the Vercel app link in your browser.
2. Enter a research query and verify the status badges update correctly through the **Search**, **RAG**, and **Writer** stages.
3. Confirm that the markdown report streams successfully.
