# Run OpsPilot Globally 100% Free ($0/month — Beginner No-Code Guide)

You do **not** need a credit card, a paid server, or coding experience to put **OpsPilot** online with a public `https://...` link that anyone in the world can open on desktop or mobile.

---

## Architecture Overview (3 Free Cloud Accounts)

| Part of OpsPilot | Free Service | Cost | Credit Card Needed? |
| --- | --- | --- | --- |
| **1. Database (PostgreSQL)** | **Neon.tech** *or* **Supabase.com** | **$0 / Forever Free** | **No** |
| **2. Backend API (`apps/api`)** | **Render.com** (Free Web Service) | **$0 / Free Tier** | **No** |
| **3. Frontend Website (`apps/web`)** | **Vercel.com** (Hobby Plan) | **$0 / Forever Free** | **No** |

*(Note: Even if you skip Step 1 at first, `apps/api` automatically boots an embedded PostgreSQL 16 database and loads all demo data (`admin@demo.local` / `Demo1234!`) automatically! Adding Step 1 simply makes new changes permanent across server restarts.)*

---

## Step 1 — Free Cloud Database on Neon.tech (2 minutes)

1. Go to **[https://neon.tech](https://neon.tech)** and click **Sign Up -> Continue with GitHub** (100% free, no card).
2. Click **Create Project** -> name it `opspilot` -> click **Create**.
3. Copy the **Connection String** shown on screen (it starts with `postgresql://...sslmode=require`). Keep this copied for Step 2.
   *(Alternative: If you prefer **Supabase**, open any project -> click **Connect** at the top -> **Transaction Pooler / Session Pooler URI** -> copy the `postgresql://...` string.)*

---

## Step 2 — Free Backend API on Render.com (3 minutes)

1. Go to **[https://render.com](https://render.com)** and click **Get Started -> Continue with GitHub**.
2. Click **New +** (top right) -> **Web Service**.
3. Select your GitHub repository: **`vidu1999/enterprise-AI-platforme`**.
4. Fill in these exact settings:
   - **Name**: `opspilot-api`
   - **Branch**: `main` *(or `arena/4c9cefa3-enterprise-ai-platforme` before merging)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     npm install && npm run build --workspace=apps/api
     ```
   - **Start Command**:
     ```
     npm run start:prod --workspace=apps/api
     ```
   - **Instance Type**: Select **Free ($0/month)**.
5. Scroll down to **Environment Variables** and add:
   - `DATABASE_URL` = *(paste the `postgresql://...` string from Step 1 — optional, auto-seeds tables & demo data automatically!)*
   - `JWT_SECRET` = `opspilot-super-secret-jwt-key-2026`
   - `JWT_REFRESH_SECRET` = `opspilot-super-secret-refresh-key-2026`
6. Click **Deploy Web Service**.
7. Once it says **Live**, copy your Render URL at the top left (for example: `https://opspilot-api.onrender.com`).

---

## Step 3 — Free Global Website on Vercel.com (2 minutes)

1. Go to **[https://vercel.com](https://vercel.com)** and click **Sign Up -> Hobby (Free) -> Continue with GitHub**.
2. Click **Add New... -> Project** -> click **Import** next to **`vidu1999/enterprise-AI-platforme`**.
3. Set these **2 important fields**:
   - **Branch** (under Git settings if not merged yet): `main` *(after merging the Pull Request on GitHub)*
   - **Root Directory**: Click **Edit** -> select **`apps/web`** -> click **Continue**.
4. Expand **Environment Variables** and add **1 variable**:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: *(paste your Render URL from Step 2, e.g. `https://opspilot-api.onrender.com` — no `/` at the end)*
5. Click **Deploy**!

In ~60 seconds, Vercel gives you your permanent global link (e.g. **`https://opspilot.vercel.app`**):
- Works worldwide on **desktop + mobile** with automatic HTTPS (`🔒`)
- Pre-seeded with **`admin@demo.local`** / **`Demo1234!`** (`Vidura Kavinda · Administrator`)

---

## Pro Tip: Keep Free Render Backend Awake 24/7 (Optional, 1 minute, Free)
Render's $0 plan sleeps after 15 minutes of zero visitors (and takes ~30 seconds to wake up on the first click). To keep it instant 24/7 for free:
1. Go to **[https://cron-job.org](https://cron-job.org)** or **[https://uptimerobot.com](https://uptimerobot.com)** (both 100% free).
2. Add a monitor pointing to `https://opspilot-api.onrender.com/api/health` every **10 minutes**.
3. Your backend stays warm and instant 24/7 globally for **$0.00/month**!
