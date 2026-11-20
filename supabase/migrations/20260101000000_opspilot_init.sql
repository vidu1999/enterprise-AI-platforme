-- =============================================================================
-- OpsPilot — Enterprise Operations Intelligence Platform
-- PostgreSQL 16 Schema Migration (Idempotent)
-- Multi-tenancy: Every tenant-owned entity enforces company_id foreign key
-- and composite indexes for strict tenant isolation and fast lookups.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RECEIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'TASK_ASSIGNED',
    'APPROVAL_REQUESTED',
    'APPROVED',
    'REJECTED',
    'LOW_STOCK',
    'WORK_ORDER_UPDATE',
    'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "companies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(160) NOT NULL UNIQUE,
  "email" VARCHAR(255),
  "phone" VARCHAR(80),
  "address" TEXT,
  "industry" VARCHAR(120) DEFAULT 'Manufacturing & Engineering',
  "currency" VARCHAR(12) NOT NULL DEFAULT 'LKR',
  "timezone" VARCHAR(80) NOT NULL DEFAULT 'Asia/Colombo',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "departments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("company_id", "name")
);
CREATE INDEX IF NOT EXISTS "idx_departments_company" ON "departments"("company_id");

CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "first_name" VARCHAR(120) NOT NULL,
  "last_name" VARCHAR(120) NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "department_id" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
  "job_title" VARCHAR(160),
  "phone" VARCHAR(80),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("company_id", "email")
);
CREATE INDEX IF NOT EXISTS "idx_users_company" ON "users"("company_id");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" VARCHAR(128) NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user" ON "refresh_tokens"("user_id");

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "name" VARCHAR(200) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(80),
  "address" TEXT,
  "lead_time_days" INTEGER NOT NULL DEFAULT 5,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("company_id", "name")
);
CREATE INDEX IF NOT EXISTS "idx_suppliers_company" ON "suppliers"("company_id");

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "sku" VARCHAR(80) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(120),
  "unit" VARCHAR(32) NOT NULL DEFAULT 'pcs',
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "reorder_level" INTEGER NOT NULL DEFAULT 10,
  "unit_cost" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "supplier_id" UUID REFERENCES "suppliers"("id") ON DELETE SET NULL,
  "location" VARCHAR(120),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("company_id", "sku")
);
CREATE INDEX IF NOT EXISTS "idx_inventory_items_company" ON "inventory_items"("company_id");

CREATE TABLE IF NOT EXISTS "inventory_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "item_id" UUID NOT NULL REFERENCES "inventory_items"("id") ON DELETE CASCADE,
  "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "type" "TransactionType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_inv_tx_company_item" ON "inventory_transactions"("company_id", "item_id");

CREATE TABLE IF NOT EXISTS "assets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(120),
  "location" VARCHAR(160),
  "status" VARCHAR(40) NOT NULL DEFAULT 'OPERATIONAL',
  "maintenance_interval_days" INTEGER NOT NULL DEFAULT 90,
  "last_maintained_at" TIMESTAMPTZ,
  "next_maintenance_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("company_id", "code")
);
CREATE INDEX IF NOT EXISTS "idx_assets_company" ON "assets"("company_id");

CREATE TABLE IF NOT EXISTS "work_orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "type" VARCHAR(40) NOT NULL DEFAULT 'CORRECTIVE',
  "asset_id" UUID REFERENCES "assets"("id") ON DELETE SET NULL,
  "assignee_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "creator_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "estimated_cost" NUMERIC(12, 2) DEFAULT 0,
  "actual_cost" NUMERIC(12, 2) DEFAULT 0,
  "due_date" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_work_orders_company_status" ON "work_orders"("company_id", "status");

CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "number" VARCHAR(80) NOT NULL,
  "supplier_id" UUID NOT NULL REFERENCES "suppliers"("id") ON DELETE RESTRICT,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "auto_generated" BOOLEAN NOT NULL DEFAULT FALSE,
  "notes" TEXT,
  "total" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("company_id", "number")
);
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_company" ON "purchase_orders"("company_id");

CREATE TABLE IF NOT EXISTS "purchase_order_lines" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
  "item_id" UUID NOT NULL REFERENCES "inventory_items"("id") ON DELETE RESTRICT,
  "quantity" INTEGER NOT NULL,
  "unit_cost" NUMERIC(12, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_po_lines_order" ON "purchase_order_lines"("order_id");

CREATE TABLE IF NOT EXISTS "approvals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "type" VARCHAR(60) NOT NULL,
  "ref_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "requested_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "amount" NUMERIC(12, 2) DEFAULT 0,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "approver_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "decided_at" TIMESTAMPTZ,
  "comment" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_approvals_company_status" ON "approvals"("company_id", "status");

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "channel" VARCHAR(20) NOT NULL DEFAULT 'BOTH',
  "email_status" VARCHAR(32) NOT NULL DEFAULT 'SENT',
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "notifications"("company_id", "user_id", "read");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "action" VARCHAR(80) NOT NULL,
  "entity" VARCHAR(160) NOT NULL,
  "entity_id" VARCHAR(120),
  "ip_address" VARCHAR(80),
  "details" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_company_created" ON "audit_logs"("company_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "category" VARCHAR(80) NOT NULL DEFAULT 'SOP',
  "min_role" "Role" NOT NULL DEFAULT 'VIEWER',
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_documents_company" ON "documents"("company_id");
