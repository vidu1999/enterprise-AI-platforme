# OpsPilot — REST & WebSocket API Reference

- **Base URL**: `/api` (`http://localhost:3001/api` direct, or `http://localhost:3000/api` via Next.js proxy)
- **Interactive OpenAPI / Swagger UI**: `/docs`
- **Authentication**: `Authorization: Bearer <accessToken>` (15-minute lifetime) + single-use SHA-256 refresh token rotation (`/api/auth/refresh`, 7-day lifetime).
- **Rate-Limit Headers**: Every HTTP response returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

## Endpoint Matrix

| Method | Path | Minimum Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Liveness & PostgreSQL readiness check |
| `POST` | `/api/auth/register` | Public | Onboard tenant company + `COMPANY_ADMIN` |
| `POST` | `/api/auth/login` | Public | Authenticate & issue access + refresh tokens |
| `POST` | `/api/auth/refresh` | Public | Rotate single-use refresh token |
| `POST` | `/api/auth/logout` | Public | Revoke refresh token |
| `GET` | `/api/auth/me` | Authenticated | Current user + tenant metadata |
| `GET` | `/api/companies/me` | Authenticated | Tenant organization profile |
| `PATCH` | `/api/companies/me` | `COMPANY_ADMIN` | Update tenant settings |
| `GET` | `/api/users` | `EMPLOYEE`+ | List tenant employees (`VIEWER` blocked) |
| `POST` | `/api/users` | `MANAGER`+ | Create employee account |
| `PATCH` | `/api/users/:id` | `MANAGER`+ | Update employee role, status, or department |
| `DELETE` | `/api/users/:id` | `COMPANY_ADMIN` | Remove employee |
| `GET` / `POST` | `/api/departments` | Auth / `MANAGER`+ | List headcount / create department |
| `GET` / `POST` | `/api/inventory` | Auth / `MANAGER`+ | List SKUs / register SKU |
| `GET` | `/api/inventory/low-stock` | Authenticated | List SKUs at or below reorder threshold |
| `GET` | `/api/inventory/transactions` | Authenticated | Immutable stock movement ledger |
| `PATCH` / `DELETE` | `/api/inventory/:id` | `MANAGER`+ / `ADMIN` | Update / delete SKU |
| `POST` | `/api/inventory/:id/adjust` | `EMPLOYEE`+ | `IN` / `OUT` / `ADJUSTMENT` + auto-PO workflow |
| `GET` / `POST` | `/api/suppliers` | Auth / `MANAGER`+ | List / add MRO vendors |
| `GET` / `POST` | `/api/purchase-orders` | Auth / `EMPLOYEE`+ | List / create PO + auto-approval |
| `POST` | `/api/purchase-orders/:id/receive` | `MANAGER`+ | Receive `APPROVED` PO & increment stock |
| `GET` | `/api/approvals` | Authenticated | List pending & decided approvals |
| `PATCH` | `/api/approvals/:id/decide` | `MANAGER`+ | `APPROVED` or `REJECTED` decision |
| `GET` / `POST` | `/api/work-orders` | Auth / `EMPLOYEE`+ | List / dispatch maintenance work orders |
| `PATCH` / `DELETE` | `/api/work-orders/:id` | `EMPLOYEE`+ / `MANAGER`+ | Update status/cost or delete work order |
| `GET` / `POST` | `/api/assets` | Auth / `MANAGER`+ | List / register industrial equipment |
| `POST` | `/api/assets/:id/schedule-maintenance` | `MANAGER`+ | Generate scheduled preventive work order |
| `GET` | `/api/notifications` | Authenticated | User notification inbox |
| `GET` | `/api/notifications/unread-count` | Authenticated | Unread badge count |
| `GET` | `/api/notifications/email-outbox` | `MANAGER`+ | Inspect transactional email dispatch log |
| `PATCH` | `/api/notifications/:id/read` & `/read-all` | Authenticated | Mark notification(s) read |
| `GET` | `/api/audit` (`/api/audit-logs`) | `MANAGER`+ | Immutable security audit trail |
| `GET` | `/api/analytics/dashboard` | Authenticated | Executive KPIs, spend by asset, PM schedule |
| `GET` | `/api/ai/health` | Authenticated | Check FastAPI AI service connectivity |
| `POST` | `/api/ai/ask` | Authenticated | Natural-language operational & SOP RAG query |
| `GET` / `POST` | `/api/ai/documents` | Auth / `MANAGER`+ | List authorized SOPs / index new SOP |

## Real-Time Socket.IO Events

Connect to `/socket.io` and emit `join` with `{ userId, companyId }`. Server pushes live `notification` events whenever tasks are assigned, stock drops below threshold, or approvals are requested/decided.
