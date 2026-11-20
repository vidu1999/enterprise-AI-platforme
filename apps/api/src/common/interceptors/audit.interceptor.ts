import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DatabaseService } from '../../database/database.service';

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'refreshToken', 'accessToken', 'token']);

function sanitizeBody(body: any): Record<string, any> | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[REDACTED]' : v;
  }
  return out;
}

/** Records an immutable audit trail entry for every mutating authenticated request. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly db: DatabaseService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    if (ctx.getType() !== 'http') return next.handle();
    const req = ctx.switchToHttp().getRequest();
    const mutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);

    return next.handle().pipe(
      tap((responseBody) => {
        const companyId = req.user?.companyId ?? responseBody?.user?.companyId;
        const actorId = req.user?.id ?? responseBody?.user?.id ?? null;
        if (!mutating || !companyId) return;

        const entityId = req.params?.id ?? responseBody?.id ?? null;
        const ip =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.ip ||
          null;
        const details = {
          url: req.originalUrl,
          payload: sanitizeBody(req.body),
        };

        this.db
          .query(
            `INSERT INTO "audit_logs" (company_id, actor_id, action, entity, entity_id, ip_address, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
            [
              companyId,
              actorId,
              req.method,
              req.route?.path ?? req.path ?? req.originalUrl,
              entityId ? String(entityId) : null,
              ip,
              JSON.stringify(details),
            ],
          )
          .catch(() => undefined);
      }),
    );
  }
}
