import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  async dashboard(companyId: string, userId: string) {
    const [
      userCounts,
      invStats,
      assetCount,
      woSummary,
      statusRows,
      priorityRows,
      costByAssetRows,
      pendingApprovals,
      unreadNotifs,
      upcomingMaint,
    ] = await Promise.all([
      this.db.one<{ employees: number; departments: number }>(
        `SELECT
           (SELECT COUNT(*)::int FROM "users" WHERE company_id = $1) AS employees,
           (SELECT COUNT(*)::int FROM "departments" WHERE company_id = $1) AS departments`,
        [companyId],
      ),
      this.db.one<{
        items: number;
        lowStock: number;
        totalUnits: number;
        totalValue: number;
      }>(
        `SELECT
           COUNT(*)::int AS items,
           COUNT(*) FILTER (WHERE quantity <= reorder_level)::int AS "lowStock",
           COALESCE(SUM(quantity), 0)::int AS "totalUnits",
           COALESCE(SUM(quantity * unit_cost), 0) AS "totalValue"
         FROM "inventory_items"
         WHERE company_id = $1`,
        [companyId],
      ),
      this.db.one<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM "assets" WHERE company_id = $1`,
        [companyId],
      ),
      this.db.one<{ openOrders: number; completedOrders: number; estCost: number; actCost: number }>(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'))::int AS "openOrders",
           COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS "completedOrders",
           COALESCE(SUM(estimated_cost), 0) AS "estCost",
           COALESCE(SUM(actual_cost), 0) AS "actCost"
         FROM "work_orders"
         WHERE company_id = $1`,
        [companyId],
      ),
      this.db.many<{ status: string; count: number }>(
        `SELECT status::text AS status, COUNT(*)::int AS count
         FROM "work_orders" WHERE company_id = $1 GROUP BY status`,
        [companyId],
      ),
      this.db.many<{ priority: string; count: number }>(
        `SELECT priority::text AS priority, COUNT(*)::int AS count
         FROM "work_orders" WHERE company_id = $1 GROUP BY priority`,
        [companyId],
      ),
      this.db.many<{ code: string; name: string; cost: number; orders: number }>(
        `SELECT a.code, a.name,
                COALESCE(SUM(CASE WHEN w.actual_cost > 0 THEN w.actual_cost ELSE w.estimated_cost END), 0) AS cost,
                COUNT(w.id)::int AS orders
         FROM "assets" a
         LEFT JOIN "work_orders" w ON w.asset_id = a.id
         WHERE a.company_id = $1
         GROUP BY a.id
         ORDER BY cost DESC
         LIMIT 6`,
        [companyId],
      ),
      this.db.one<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM "approvals" WHERE company_id = $1 AND status = 'PENDING'`,
        [companyId],
      ),
      this.db.one<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM "notifications"
         WHERE company_id = $1 AND user_id = $2 AND read = FALSE`,
        [companyId, userId],
      ),
      this.db.many(
        `SELECT id, code, name, location, status, next_maintenance_at AS "nextMaintenanceAt"
         FROM "assets"
         WHERE company_id = $1 AND next_maintenance_at IS NOT NULL
         ORDER BY next_maintenance_at ASC
         LIMIT 5`,
        [companyId],
      ),
    ]);

    const workOrdersByStatus: Record<string, number> = {};
    for (const r of statusRows) workOrdersByStatus[r.status] = r.count;

    const workOrdersByPriority: Record<string, number> = {};
    for (const r of priorityRows) workOrdersByPriority[r.priority] = r.count;

    return {
      kpis: {
        employees: userCounts?.employees ?? 0,
        departments: userCounts?.departments ?? 0,
        inventoryItems: invStats?.items ?? 0,
        lowStockItems: invStats?.lowStock ?? 0,
        totalUnits: invStats?.totalUnits ?? 0,
        totalInventoryValue: Number(invStats?.totalValue ?? 0),
        assets: assetCount?.count ?? 0,
        openWorkOrders: woSummary?.openOrders ?? 0,
        completedWorkOrders: woSummary?.completedOrders ?? 0,
        pendingApprovals: pendingApprovals?.count ?? 0,
        unreadNotifications: unreadNotifs?.count ?? 0,
      },
      workOrdersByStatus,
      workOrdersByPriority,
      costsByAsset: costByAssetRows.map((r) => ({
        code: r.code,
        name: r.name,
        cost: Number(r.cost ?? 0),
        orders: r.orders,
      })),
      maintenanceCosts: {
        estimated: Number(woSummary?.estCost ?? 0),
        actual: Number(woSummary?.actCost ?? 0),
      },
      upcomingMaintenance: upcomingMaint,
    };
  }
}
