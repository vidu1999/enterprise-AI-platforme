# OpsPilot — Database Schema & Entity-Relationship Diagram

Source DDL: [`apps/api/sql/001_init.sql`](../apps/api/sql/001_init.sql) (mirrored in [`supabase/migrations/20260101000000_opspilot_init.sql`](../supabase/migrations/20260101000000_opspilot_init.sql)).

## Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    COMPANIES ||--o{ DEPARTMENTS : owns
    COMPANIES ||--o{ USERS : employs
    COMPANIES ||--o{ SUPPLIERS : contracts
    COMPANIES ||--o{ INVENTORY_ITEMS : stocks
    COMPANIES ||--o{ INVENTORY_TRANSACTIONS : logs
    COMPANIES ||--o{ ASSETS : operates
    COMPANIES ||--o{ WORK_ORDERS : schedules
    COMPANIES ||--o{ PURCHASE_ORDERS : issues
    COMPANIES ||--o{ APPROVALS : governs
    COMPANIES ||--o{ NOTIFICATIONS : dispatches
    COMPANIES ||--o{ AUDIT_LOGS : records
    COMPANIES ||--o{ DOCUMENTS : indexes

    DEPARTMENTS ||--o{ USERS : groups
    USERS ||--o{ REFRESH_TOKENS : rotates
    USERS ||--o{ WORK_ORDERS : assigned_or_created
    USERS ||--o{ APPROVALS : requests_or_decides
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : acts

    SUPPLIERS ||--o{ INVENTORY_ITEMS : supplies
    SUPPLIERS ||--o{ PURCHASE_ORDERS : fulfills
    INVENTORY_ITEMS ||--o{ INVENTORY_TRANSACTIONS : tracks
    INVENTORY_ITEMS ||--o{ PURCHASE_ORDER_LINES : ordered_in
    PURCHASE_ORDERS ||--|{ PURCHASE_ORDER_LINES : contains
    ASSETS ||--o{ WORK_ORDERS : maintained_by
```

## Multi-Tenancy & Indexing Strategy

- Every tenant-owned table includes `company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE`.
- Composite uniqueness constraints enforce tenant-scoped natural keys:
  - `users (company_id, email)`
  - `departments (company_id, name)`
  - `suppliers (company_id, name)`
  - `inventory_items (company_id, sku)`
  - `assets (company_id, code)`
  - `purchase_orders (company_id, number)`
- Targeted B-tree indexes accelerate hot operational queries:
  - `idx_work_orders_company_status (company_id, status)`
  - `idx_approvals_company_status (company_id, status)`
  - `idx_notifications_user_read (company_id, user_id, read)`
  - `idx_audit_logs_company_created (company_id, created_at DESC)`
