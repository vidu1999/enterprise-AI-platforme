# OpsPilot — Enterprise Security Controls

## Implemented Security Layers

1. **Credential & Token Security**:
   - Passwords hashed with `bcryptjs` (12 salt rounds); plaintext passwords never touch logs or responses.
   - Short-lived JWT access tokens (`15m` default) paired with opaque 256-bit refresh tokens stored **SHA-256 hashed** in `refresh_tokens`.
   - **Single-use refresh token rotation**: consuming `/api/auth/refresh` deletes the prior hash immediately; token replay returns `401 Unauthorized` (verified in `test/app.e2e-spec.ts`).

2. **Multi-Tenant Data Isolation**:
   - Every tenant query binds `company_id = $1` directly from the cryptographically verified JWT payload — never from client-supplied headers or URL parameters.
   - Cross-tenant read/write attempts return `0` rows or `404 Not Found` (verified in automated E2E tests between Tenant A and Tenant B).

3. **Role-Based Access Control (RBAC)**:
   - 5 hierarchical roles: `SUPER_ADMIN`, `COMPANY_ADMIN`, `MANAGER`, `EMPLOYEE`, `VIEWER`.
   - Enforced declaratively via `@Roles(...)` + `RolesGuard`.
   - `VIEWER` accounts are blocked (`403 Forbidden`) from employee directories, security audit logs, and all mutating endpoints.

4. **Distributed Rate Limiting (`RateLimitGuard`)**:
   - Uses Redis (`ioredis`) when `REDIS_URL` is connected, with automatic in-memory fallback.
   - Stricter limits on `/api/auth/login` and `/api/auth/register` (`30 req/min` default) vs general API endpoints (`300 req/min`), emitting `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

5. **Strict Input Validation & SQL Injection Prevention**:
   - Global NestJS `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` rejects unexpected fields with `400 Bad Request`.
   - 100% parameterized PostgreSQL queries (`$1, $2, ...`) — zero string concatenation of user input.

6. **Immutable Audit Logging with Secret Redaction**:
   - `AuditInterceptor` records actor ID, tenant ID, HTTP action, route, entity ID, client IP, and sanitized request payload (`password`, `refreshToken`, `accessToken` replaced with `[REDACTED]`).

7. **Permission-Aware AI Guardrails**:
   - `AiService` enforces RBAC document filtering (`min_role`) and redacts employee/HR counts for `VIEWER` callers before context ever reaches the Python FastAPI service or Ollama LLM.
