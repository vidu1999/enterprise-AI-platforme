# OpsPilot — 5-Minute Engineering Walkthrough Script

Use this structured script during technical interviews or when recording a 3–5 minute portfolio walkthrough video.

## Step 1: Multi-Tenant Login & Executive Telemetry (0:00 – 1:00)
1. Open `/login` and show the **1-Click Role & Multi-Tenant Demo** switcher.
2. Sign in as **Company Admin** (`admin@demo.local` / `Demo1234!`) into **Lanka Precision Engineering PLC**.
3. On `/dashboard`, highlight the single-pass PostgreSQL KPIs: **8 Industrial Assets**, **Active Work Orders**, **Low-Stock Alerts**, **Inventory Valuation (LKR)**, and the **Top Machines by Maintenance Spend** chart (`CNC-104`, `HYD-008`, `GEN-001`).

## Step 2: Automated Low-Stock → Procurement Approval → Goods Receipt (1:00 – 2:15)
1. Navigate to **MRO Inventory** (`/inventory`). Pick an item near its reorder threshold (e.g. `FLT-AIR-GA37` or `HYD-SEAL-200`) and click **`−1 Out`** until `On Hand ≤ Reorder`.
2. Show the instant banner + real-time Socket.IO toast: OpsPilot automatically generated `PO-AUTO-*` and routed an approval request.
3. Open **Approvals Queue** (`/approvals`) → click **Approve**.
4. Open **Purchase Orders** (`/purchase-orders`) → click **Receive Goods** → show stock automatically replenished in the ledger!

## Step 3: Preventive Maintenance & Work Order Lifecycle (2:15 – 3:00)
1. Open **Machines & Assets** (`/assets`) → click **`+ Schedule PM`** on `BLR-003` or `GEN-001`.
2. Open **Work Orders** (`/maintenance`) → click **Start** then **Complete** → asset's `Next PM` schedule automatically advances!

## Step 4: Permission-Aware AI Assistant & SOP RAG Citations (3:00 – 4:00)
1. Open **AI Operations Assistant** (`/ai-assistant`).
2. Ask: *"Which machines have the highest maintenance costs this month?"* → show live LKR figures + **Verified Data Evidence**.
3. Ask: *"What is the CNC spindle vibration SOP threshold?"* → show `5.5 mm/s RMS` extracted with **Cited Company SOP Sources** (`SOP-CNC-004`).

## Step 5: RBAC Enforcement, Tenant Isolation & Audit Governance (4:00 – 5:00)
1. Open **Security Audit Trail** (`/audit`) → show every `POST`/`PATCH` action logged with actor, role, IP, and redacted payloads.
2. Sign out → click **Compliance Auditor (`VIEWER`)** on `/login` → try opening `/employees` or `/audit` → show `403 Insufficient permissions`, and ask AI about employee headcount → show RBAC restriction!
3. Sign out → click **Tenant #2 (`Colombo Port Logistics`)** → show completely isolated assets (`STS-CRANE-01`) with zero leakage from Tenant #1.
