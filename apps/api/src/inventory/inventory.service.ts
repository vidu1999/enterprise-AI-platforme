import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums';

@Injectable()
export class InventoryService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  private mapItem(r: any) {
    return {
      id: r.id,
      companyId: r.companyId,
      sku: r.sku,
      name: r.name,
      category: r.category,
      unit: r.unit,
      quantity: Number(r.quantity),
      reorderLevel: Number(r.reorderLevel),
      unitCost: Number(r.unitCost ?? 0),
      location: r.location,
      supplierId: r.supplierId,
      supplier: r.supplierId ? { id: r.supplierId, name: r.supplierName } : null,
      isLowStock: Number(r.quantity) <= Number(r.reorderLevel),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async listItems(companyId: string, q: any = {}) {
    const limit = Math.min(Math.max(Number(q.limit ?? 100), 1), 250);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    const search = q.search ? `%${String(q.search).trim().toLowerCase()}%` : null;
    const category = q.category ? String(q.category) : null;
    const lowOnly = q.lowStock === 'true' || q.lowStock === true;

    const rows = await this.db.many(
      `SELECT i.id, i.company_id AS "companyId", i.sku, i.name, i.category, i.unit,
              i.quantity, i.reorder_level AS "reorderLevel", i.unit_cost AS "unitCost",
              i.location, i.supplier_id AS "supplierId", s.name AS "supplierName",
              i.created_at AS "createdAt", i.updated_at AS "updatedAt"
       FROM "inventory_items" i
       LEFT JOIN "suppliers" s ON s.id = i.supplier_id
       WHERE i.company_id = $1
         AND ($2::text IS NULL OR LOWER(i.name || ' ' || i.sku) LIKE $2)
         AND ($3::text IS NULL OR i.category = $3)
         AND ($4::boolean = FALSE OR i.quantity <= i.reorder_level)
       ORDER BY (i.quantity <= i.reorder_level) DESC, i.sku ASC
       LIMIT $5 OFFSET $6`,
      [companyId, search, category, lowOnly, limit, offset],
    );
    return rows.map((r) => this.mapItem(r));
  }

  async createItem(companyId: string, dto: any) {
    const sku = dto.sku.trim().toUpperCase();
    const exists = await this.db.one(
      `SELECT id FROM "inventory_items" WHERE company_id = $1 AND UPPER(sku) = $2`,
      [companyId, sku],
    );
    if (exists) throw new ConflictException('SKU already exists in this company');

    const created = await this.db.one(
      `INSERT INTO "inventory_items"
         (company_id, sku, name, category, unit, quantity, reorder_level, unit_cost, supplier_id, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, company_id AS "companyId", sku, name, category, unit,
                 quantity, reorder_level AS "reorderLevel", unit_cost AS "unitCost",
                 location, supplier_id AS "supplierId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        companyId,
        sku,
        dto.name.trim(),
        dto.category ?? null,
        dto.unit ?? 'pcs',
        dto.quantity ?? 0,
        dto.reorderLevel ?? 10,
        dto.unitCost ?? 0,
        dto.supplierId || null,
        dto.location ?? null,
      ],
    );
    return this.mapItem(created);
  }

  async updateItem(companyId: string, id: string, dto: any) {
    const existing = await this.db.one(
      `SELECT id FROM "inventory_items" WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!existing) throw new NotFoundException('Inventory item not found');

    const updated = await this.db.one(
      `UPDATE "inventory_items"
       SET name = COALESCE($3, name),
           category = COALESCE($4, category),
           unit = COALESCE($5, unit),
           quantity = COALESCE($6, quantity),
           reorder_level = COALESCE($7, reorder_level),
           unit_cost = COALESCE($8, unit_cost),
           supplier_id = COALESCE($9, supplier_id),
           location = COALESCE($10, location),
           updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING id, company_id AS "companyId", sku, name, category, unit,
                 quantity, reorder_level AS "reorderLevel", unit_cost AS "unitCost",
                 location, supplier_id AS "supplierId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        id,
        companyId,
        dto.name ?? null,
        dto.category ?? null,
        dto.unit ?? null,
        dto.quantity ?? null,
        dto.reorderLevel ?? null,
        dto.unitCost ?? null,
        dto.supplierId ?? null,
        dto.location ?? null,
      ],
    );
    return this.mapItem(updated);
  }

  async deleteItem(companyId: string, id: string) {
    const res = await this.db.query(
      `DELETE FROM "inventory_items" WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!res.rowCount) throw new NotFoundException('Inventory item not found');
    return { ok: true };
  }

  async adjust(companyId: string, actorId: string | null, id: string, dto: { type: string; quantity: number; note?: string }) {
    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(dto.type)) {
      throw new BadRequestException('Transaction type must be IN, OUT, or ADJUSTMENT');
    }

    const txResult = await this.db.withTransaction(async (tx) => {
      const item = await tx.one<any>(
        `SELECT id, sku, name, unit, quantity, reorder_level AS "reorderLevel",
                unit_cost AS "unitCost", supplier_id AS "supplierId"
         FROM "inventory_items"
         WHERE id = $1 AND company_id = $2`,
        [id, companyId],
      );
      if (!item) throw new NotFoundException('Inventory item not found');

      const delta = dto.type === 'OUT' ? -dto.quantity : dto.quantity;
      const newQty = Number(item.quantity) + delta;
      if (newQty < 0) throw new BadRequestException('Insufficient stock for outbound transaction');

      const updated = await tx.one<any>(
        `UPDATE "inventory_items"
         SET quantity = $3, updated_at = NOW()
         WHERE id = $1 AND company_id = $2
         RETURNING id, company_id AS "companyId", sku, name, category, unit,
                   quantity, reorder_level AS "reorderLevel", unit_cost AS "unitCost",
                   location, supplier_id AS "supplierId", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [id, companyId, newQty],
      );

      await tx.query(
        `INSERT INTO "inventory_transactions" (company_id, item_id, actor_id, type, quantity, note)
         VALUES ($1, $2, $3, $4::"TransactionType", $5, $6)`,
        [companyId, id, actorId, dto.type, dto.quantity, dto.note ?? null],
      );

      let autoPo: any = null;
      if (newQty <= Number(item.reorderLevel)) {
        // Check if an open pending PO already exists for this item
        const existingPending = await tx.one(
          `SELECT po.id, po.number
           FROM "purchase_orders" po
           JOIN "purchase_order_lines" pol ON pol.order_id = po.id
           WHERE po.company_id = $1 AND po.status = 'PENDING' AND pol.item_id = $2`,
          [companyId, id],
        );

        let supplierId = item.supplierId;
        if (!supplierId) {
          const fallbackSupplier = await tx.one<{ id: string }>(
            `SELECT id FROM "suppliers" WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1`,
            [companyId],
          );
          supplierId = fallbackSupplier?.id ?? null;
        }

        if (!existingPending && supplierId) {
          const reorderQty = Math.max(Number(item.reorderLevel) * 2 - newQty, Number(item.reorderLevel), 5);
          const unitCost = Number(item.unitCost ?? 0) || 1000;
          const total = reorderQty * unitCost;
          const poNumber = `PO-AUTO-${Date.now().toString(36).toUpperCase()}`;

          const po = (await tx.one<{ id: string; number: string }>(
            `INSERT INTO "purchase_orders" (company_id, number, supplier_id, status, auto_generated, notes, total)
             VALUES ($1, $2, $3, 'PENDING', TRUE, $4, $5)
             RETURNING id, number`,
            [
              companyId,
              poNumber,
              supplierId,
              `Auto-generated when ${item.sku} dropped to ${newQty} ${item.unit} (threshold: ${item.reorderLevel})`,
              total,
            ],
          ))!;

          await tx.query(
            `INSERT INTO "purchase_order_lines" (order_id, item_id, quantity, unit_cost)
             VALUES ($1, $2, $3, $4)`,
            [po.id, id, reorderQty, unitCost],
          );

          const approvalTitle = `Auto Purchase Request ${po.number} — ${reorderQty} ${item.unit} of ${item.name} (${item.sku})`;
          const approval = await tx.one<{ id: string }>(
            `INSERT INTO "approvals" (company_id, type, ref_id, title, requested_by_id, amount, status)
             VALUES ($1, 'PURCHASE_ORDER', $2, $3, $4, $5, 'PENDING')
             RETURNING id`,
            [companyId, po.id, approvalTitle, actorId, total],
          );

          autoPo = {
            id: po.id,
            number: po.number,
            quantity: reorderQty,
            total,
            approvalId: approval?.id,
            title: approvalTitle,
          };
        }
      }

      return { updated: this.mapItem(updated), item, newQty, autoPo };
    });

    // Dispatch real-time + email alerts outside transaction
    if (txResult.newQty <= Number(txResult.item.reorderLevel)) {
      await this.notifications.notifyRoles(
        companyId,
        ['COMPANY_ADMIN', 'MANAGER'],
        NotificationType.LOW_STOCK,
        `Low stock alert: ${txResult.item.sku}`,
        `${txResult.item.name} (${txResult.item.sku}) dropped to ${txResult.newQty} ${txResult.item.unit} (reorder level: ${txResult.item.reorderLevel}).`,
      );
      if (txResult.autoPo) {
        await this.notifications.notifyRoles(
          companyId,
          ['COMPANY_ADMIN', 'MANAGER'],
          NotificationType.APPROVAL_REQUESTED,
          'Automated purchase request awaiting approval',
          txResult.autoPo.title,
        );
      }
    }

    return {
      ...txResult.updated,
      autoPurchaseOrder: txResult.autoPo,
    };
  }

  async lowStock(companyId: string) {
    return this.listItems(companyId, { lowStock: true });
  }

  async listTransactions(companyId: string, limit = 50) {
    return this.db.many(
      `SELECT t.id, t.type, t.quantity, t.note, t.created_at AS "createdAt",
              i.sku, i.name AS "itemName", i.unit,
              u.first_name AS "actorFirstName", u.last_name AS "actorLastName"
       FROM "inventory_transactions" t
       JOIN "inventory_items" i ON i.id = t.item_id
       LEFT JOIN "users" u ON u.id = t.actor_id
       WHERE t.company_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [companyId, Math.min(Number(limit || 50), 200)],
    );
  }

  async listSuppliers(companyId: string) {
    return this.db.many(
      `SELECT s.id, s.company_id AS "companyId", s.name, s.email, s.phone, s.address,
              s.lead_time_days AS "leadTimeDays", s.created_at AS "createdAt",
              COUNT(i.id)::int AS "itemCount"
       FROM "suppliers" s
       LEFT JOIN "inventory_items" i ON i.supplier_id = s.id
       WHERE s.company_id = $1
       GROUP BY s.id
       ORDER BY s.name ASC`,
      [companyId],
    );
  }

  async createSupplier(companyId: string, dto: any) {
    const exists = await this.db.one(
      `SELECT id FROM "suppliers" WHERE company_id = $1 AND LOWER(name) = LOWER($2)`,
      [companyId, dto.name.trim()],
    );
    if (exists) throw new ConflictException('Supplier already exists');

    return this.db.one(
      `INSERT INTO "suppliers" (company_id, name, email, phone, address, lead_time_days)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, company_id AS "companyId", name, email, phone, address,
                 lead_time_days AS "leadTimeDays", created_at AS "createdAt"`,
      [
        companyId,
        dto.name.trim(),
        dto.email ?? null,
        dto.phone ?? null,
        dto.address ?? null,
        dto.leadTimeDays ?? 5,
      ],
    );
  }
}
