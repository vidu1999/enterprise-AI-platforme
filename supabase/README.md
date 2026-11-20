# Supabase deployment

OpsPilot runs on any PostgreSQL 16 — including Supabase.

1. Create a Supabase project (free tier).
2. Copy the pooler connection string into `apps/api/.env`:
   `DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?schema=public`
   `DIRECT_URL=postgresql://postgres.<ref>:<password>@db.<ref>.supabase.co:5432/postgres`
3. `cd apps/api && npx prisma migrate deploy && npx prisma db seed`
4. Start API + web as usual.

> Note: if your Supabase free-tier active-project limit is reached, pause an
> unused project first (Dashboard → project → Pause), then create OpsPilot.
