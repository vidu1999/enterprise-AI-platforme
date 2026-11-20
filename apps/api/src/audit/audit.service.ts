import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async list(companyId: string, q: any = {}) {
    const limit = Math.min(Math.max(Number(q.limit ?? 100), 1), 250);
    const action = q.action ? String(q.action).toUpperCase() : null;
    const rows = await this.db.many(
      `SELECT l.id, l.company_id AS "companyId", l.actor_id AS "actorId",
              l.action, l.entity, l.entity_id AS "entityId",
              l.ip_address AS "ipAddress", l.details, l.created_at AS "createdAt",
              u.email AS "actorEmail", u.first_name AS "actorFirstName",
              u.last_name AS "actorLastName", u.role AS "actorRole"
       FROM "audit_logs" l
       LEFT JOIN "users" u ON u.id = l.actor_id
       WHERE l.company_id = $1
         AND ($2::text IS NULL OR UPPER(l.action) = $2)
       ORDER BY l.created_at DESC
       LIMIT $3`,
      [companyId, action, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      ipAddress: r.ipAddress,
      details: r.details,
      createdAt: r.createdAt,
      actor: r.actorId
        ? {
            id: r.actorId,
            email: r.actorEmail,
            name: `${r.actorFirstName ?? ''} ${r.actorLastName ?? ''}`.trim(),
            role: r.actorRole,
          }
        : null,
    }));
  }
}
