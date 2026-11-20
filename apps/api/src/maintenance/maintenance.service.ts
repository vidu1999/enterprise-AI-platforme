import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  private mapOrder(r: any) {
    return {
      id: r.id,
      companyId: r.companyId,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      type: r.type,
      assetId: r.assetId,
      asset: r.assetId ? { id: r.assetId, code: r.assetCode, name: r.assetName } : null,
      assigneeId: r.assigneeId,
      assignee: r.assigneeId
        ? {
            id: r.assigneeId,
            firstName: r.assigneeFirstName,
            lastName: r.assigneeLastName,
            email: r.assigneeEmail,
          }
        : null,
      creatorId: r.creatorId,
      estimatedCost: Number(r.estimatedCost ?? 0),
      actualCost: Number(r.actualCost ?? 0),
      dueDate: r.dueDate,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async listOrders(companyId: string, q: any = {}) {
    const limit = Math.min(Math.max(Number(q.limit ?? 100), 1), 200);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    const status = q.status ? String(q.status) : null;
    const priority = q.priority ? String(q.priority) : null;
    const search = q.search ? `%${String(q.search).trim().toLowerCase()}%` : null;

    const rows = await this.db.many(
      `SELECT w.id, w.company_id AS "companyId", w.title, w.description,
              w.status, w.priority, w.type,
              w.asset_id AS "assetId", a.code AS "assetCode", a.name AS "assetName",
              w.assignee_id AS "assigneeId",
              u.first_name AS "assigneeFirstName", u.last_name AS "assigneeLastName", u.email AS "assigneeEmail",
              w.creator_id AS "creatorId",
              w.estimated_cost AS "estimatedCost", w.actual_cost AS "actualCost",
              w.due_date AS "dueDate", w.completed_at AS "completedAt",
              w.created_at AS "createdAt", w.updated_at AS "updatedAt"
       FROM "work_orders" w
       LEFT JOIN "assets" a ON a.id = w.asset_id
       LEFT JOIN "users" u ON u.id = w.assignee_id
       WHERE w.company_id = $1
         AND ($2::text IS NULL OR w.status::text = $2)
         AND ($3::text IS NULL OR w.priority::text = $3)
         AND ($4::text IS NULL OR LOWER(w.title || ' ' || COALESCE(a.code, '') || ' ' || COALESCE(a.name, '')) LIKE $4)
       ORDER BY
         CASE w.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
         w.created_at DESC
       LIMIT $5 OFFSET $6`,
      [companyId, status, priority, search, limit, offset],
    );
    return rows.map((r) => this.mapOrder(r));
  }

  async getOrderById(companyId: string, id: string) {
    const row = await this.db.one(
      `SELECT w.id, w.company_id AS "companyId", w.title, w.description,
              w.status, w.priority, w.type,
              w.asset_id AS "assetId", a.code AS "assetCode", a.name AS "assetName",
              w.assignee_id AS "assigneeId",
              u.first_name AS "assigneeFirstName", u.last_name AS "assigneeLastName", u.email AS "assigneeEmail",
              w.creator_id AS "creatorId",
              w.estimated_cost AS "estimatedCost", w.actual_cost AS "actualCost",
              w.due_date AS "dueDate", w.completed_at AS "completedAt",
              w.created_at AS "createdAt", w.updated_at AS "updatedAt"
       FROM "work_orders" w
       LEFT JOIN "assets" a ON a.id = w.asset_id
       LEFT JOIN "users" u ON u.id = w.assignee_id
       WHERE w.id = $1 AND w.company_id = $2`,
      [id, companyId],
    );
    if (!row) throw new NotFoundException('Work order not found');
    return this.mapOrder(row);
  }

  async createOrder(companyId: string, creatorId: string, dto: any) {
    const status = dto.assigneeId ? 'ASSIGNED' : 'OPEN';
    const created = (await this.db.one<{ id: string }>(
      `INSERT INTO "work_orders"
         (company_id, creator_id, title, description, status, priority, type,
          asset_id, assignee_id, estimated_cost, due_date)
       VALUES ($1, $2, $3, $4, $5::"WorkOrderStatus", COALESCE($6, 'MEDIUM')::"Priority",
               COALESCE($7, 'CORRECTIVE'), $8, $9, COALESCE($10, 0), $11)
       RETURNING id`,
      [
        companyId,
        creatorId,
        dto.title.trim(),
        dto.description ?? null,
        status,
        dto.priority ?? 'MEDIUM',
        dto.type ?? 'CORRECTIVE',
        dto.assetId || null,
        dto.assigneeId || null,
        dto.estimatedCost ?? 0,
        dto.dueDate ? new Date(dto.dueDate) : null,
      ],
    ))!;

    if (dto.assigneeId) {
      await this.notifications.push(
        companyId,
        dto.assigneeId,
        NotificationType.TASK_ASSIGNED,
        'New work order assigned',
        `Work order "${dto.title}" (${dto.priority ?? 'MEDIUM'}) was assigned to you.`,
      );
    }

    return this.getOrderById(companyId, created.id);
  }

  async updateOrder(companyId: string, id: string, dto: any) {
    const existing = await this.db.one<any>(
      `SELECT id, title, status, asset_id AS "assetId", assignee_id AS "assigneeId", creator_id AS "creatorId"
       FROM "work_orders" WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!existing) throw new NotFoundException('Work order not found');

    const nextStatus = dto.status ?? (dto.assigneeId && existing.status === 'OPEN' ? 'ASSIGNED' : null);
    const isCompleted = nextStatus === 'COMPLETED';

    await this.db.withTransaction(async (tx) => {
      await tx.query(
        `UPDATE "work_orders"
         SET title = COALESCE($3, title),
             description = COALESCE($4, description),
             status = COALESCE($5::"WorkOrderStatus", status),
             priority = COALESCE($6::"Priority", priority),
             assignee_id = COALESCE($7, assignee_id),
             actual_cost = COALESCE($8, actual_cost),
             completed_at = CASE WHEN $9::boolean = TRUE THEN NOW() ELSE completed_at END,
             updated_at = NOW()
         WHERE id = $1 AND company_id = $2`,
        [
          id,
          companyId,
          dto.title ?? null,
          dto.description ?? null,
          nextStatus,
          dto.priority ?? null,
          dto.assigneeId ?? null,
          dto.actualCost ?? null,
          isCompleted,
        ],
      );

      if (isCompleted && existing.assetId) {
        await tx.query(
          `UPDATE "assets"
           SET status = 'OPERATIONAL',
               last_maintained_at = NOW(),
               next_maintenance_at = NOW() + (maintenance_interval_days || ' days')::interval,
               updated_at = NOW()
           WHERE id = $1 AND company_id = $2`,
          [existing.assetId, companyId],
        );
      }
    });

    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      await this.notifications.push(
        companyId,
        dto.assigneeId,
        NotificationType.TASK_ASSIGNED,
        'Work order assigned',
        `"${existing.title}" was assigned to you.`,
      );
    }
    if (existing.creatorId && nextStatus && nextStatus !== existing.status) {
      await this.notifications.push(
        companyId,
        existing.creatorId,
        NotificationType.WORK_ORDER_UPDATE,
        'Work order status updated',
        `"${existing.title}" moved to ${nextStatus}.`,
      );
    }

    return this.getOrderById(companyId, id);
  }

  async deleteOrder(companyId: string, id: string) {
    const res = await this.db.query(
      `DELETE FROM "work_orders" WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!res.rowCount) throw new NotFoundException('Work order not found');
    return { ok: true };
  }

  async listAssets(companyId: string) {
    const rows = await this.db.many(
      `SELECT a.id, a.company_id AS "companyId", a.code, a.name, a.category, a.location,
              a.status, a.maintenance_interval_days AS "maintenanceIntervalDays",
              a.last_maintained_at AS "lastMaintainedAt",
              a.next_maintenance_at AS "nextMaintenanceAt",
              a.created_at AS "createdAt",
              COUNT(w.id) FILTER (WHERE w.status NOT IN ('COMPLETED', 'CANCELLED'))::int AS "openWorkOrders",
              COALESCE(SUM(CASE WHEN w.actual_cost > 0 THEN w.actual_cost ELSE w.estimated_cost END), 0) AS "totalMaintenanceCost"
       FROM "assets" a
       LEFT JOIN "work_orders" w ON w.asset_id = a.id
       WHERE a.company_id = $1
       GROUP BY a.id
       ORDER BY a.code ASC`,
      [companyId],
    );
    return rows.map((r) => ({
      ...r,
      totalMaintenanceCost: Number(r.totalMaintenanceCost ?? 0),
    }));
  }

  async createAsset(companyId: string, dto: any) {
    const code = dto.code.trim().toUpperCase();
    const exists = await this.db.one(
      `SELECT id FROM "assets" WHERE company_id = $1 AND UPPER(code) = $2`,
      [companyId, code],
    );
    if (exists) throw new ConflictException('Asset code already exists');

    const interval = Number(dto.maintenanceIntervalDays ?? 90);
    const nextMaint = new Date(Date.now() + interval * 86400_000);
    return this.db.one(
      `INSERT INTO "assets" (company_id, code, name, category, location, status, maintenance_interval_days, next_maintenance_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'OPERATIONAL'), $7, $8)
       RETURNING id, company_id AS "companyId", code, name, category, location, status,
                 maintenance_interval_days AS "maintenanceIntervalDays",
                 next_maintenance_at AS "nextMaintenanceAt", created_at AS "createdAt"`,
      [
        companyId,
        code,
        dto.name.trim(),
        dto.category ?? null,
        dto.location ?? null,
        dto.status ?? 'OPERATIONAL',
        interval,
        nextMaint,
      ],
    );
  }

  async schedulePreventive(companyId: string, creatorId: string, assetId: string) {
    const asset = await this.db.one<{ id: string; code: string; name: string }>(
      `SELECT id, code, name FROM "assets" WHERE id = $1 AND company_id = $2`,
      [assetId, companyId],
    );
    if (!asset) throw new NotFoundException('Asset not found');

    return this.createOrder(companyId, creatorId, {
      title: `Scheduled preventive maintenance — ${asset.code} (${asset.name})`,
      description: `Routine preventive inspection, lubrication, and calibration for ${asset.name}.`,
      priority: 'MEDIUM',
      type: 'PREVENTIVE',
      assetId: asset.id,
      dueDate: new Date(Date.now() + 7 * 86400_000).toISOString(),
    });
  }
}
