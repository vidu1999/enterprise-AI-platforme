import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const ROLE_RANK: Record<string, number> = {
  VIEWER: 1,
  EMPLOYEE: 2,
  MANAGER: 3,
  COMPANY_ADMIN: 4,
  SUPER_ADMIN: 5,
};

/**
 * Permission-aware Enterprise AI Gateway.
 * Gathers ONLY tenant-scoped, RBAC-authorized operational records and knowledge
 * documents, then delegates reasoning + citation synthesis to the Python FastAPI
 * AI service (with Ollama LLM when available, deterministic fallback otherwise).
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly db: DatabaseService) {}

  async health() {
    const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8001';
    let reachable = false;
    try {
      const res = await fetch(`${aiServiceUrl}/health`, { signal: AbortSignal.timeout(1500) });
      reachable = res.ok;
    } catch {
      reachable = false;
    }
    return { ok: true, aiServiceUrl, aiServiceReachable: reachable };
  }

  async ask(companyId: string, role: string, question: string) {
    const context = await this.buildContext(companyId, role);
    const aiUrl = process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8001';

    try {
      const res = await fetch(`${aiUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, companyId, role, context }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`AI service HTTP ${res.status}`);
      const data = await res.json();
      return {
        answer: data.answer,
        mode: data.mode,
        evidence: data.evidence?.length ? data.evidence : context.evidence,
        citations: data.citations ?? this.matchDocuments(question, context.documents),
      };
    } catch (e) {
      this.logger.warn(`AI service unavailable, using in-process fallback: ${(e as Error).message}`);
      return this.fallbackAnswer(question, role, context);
    }
  }

  private async buildContext(companyId: string, role: string) {
    const userRank = ROLE_RANK[role] ?? 1;
    const isViewer = userRank <= ROLE_RANK.VIEWER;

    const [company, orders, items, assets, userCountRow, approvals, allDocs] = await Promise.all([
      this.db.one<{ name: string; currency: string }>(
        `SELECT name, currency FROM "companies" WHERE id = $1`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT w.title, w.status, w.priority, w.type,
                w.estimated_cost AS "estimatedCost", w.actual_cost AS "actualCost",
                a.code AS "assetCode", a.name AS "assetName"
         FROM "work_orders" w
         LEFT JOIN "assets" a ON a.id = w.asset_id
         WHERE w.company_id = $1
         ORDER BY w.created_at DESC
         LIMIT 60`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT sku, name, category, unit, quantity,
                reorder_level AS "reorderLevel", unit_cost AS "unitCost"
         FROM "inventory_items"
         WHERE company_id = $1
         LIMIT 150`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT code, name, category, location, status,
                next_maintenance_at AS "nextMaintenanceAt"
         FROM "assets"
         WHERE company_id = $1
         LIMIT 100`,
        [companyId],
      ),
      isViewer
        ? Promise.resolve({ c: null as number | null })
        : this.db.one<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "users" WHERE company_id = $1`, [companyId]),
      this.db.many<any>(
        `SELECT title, type, amount FROM "approvals"
         WHERE company_id = $1 AND status = 'PENDING'
         ORDER BY created_at DESC LIMIT 20`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT id, title, category, min_role AS "minRole", content
         FROM "documents" WHERE company_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [companyId],
      ),
    ]);

    const authorizedDocs = allDocs.filter((d) => (ROLE_RANK[d.minRole] ?? 1) <= userRank);
    const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.reorderLevel));

    const costsByAsset: Record<string, { asset: string; code: string; cost: number; orders: number }> = {};
    for (const o of orders) {
      const key = o.assetCode || 'UNASSIGNED';
      const label = o.assetCode ? `${o.assetCode} (${o.assetName})` : 'Unassigned';
      const cost = Number(o.actualCost) > 0 ? Number(o.actualCost) : Number(o.estimatedCost ?? 0);
      if (!costsByAsset[key]) costsByAsset[key] = { asset: label, code: key, cost: 0, orders: 0 };
      costsByAsset[key].cost += cost;
      costsByAsset[key].orders += 1;
    }

    const topCostAssets = Object.values(costsByAsset)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    const currency = company?.currency ?? 'LKR';
    const evidence = [
      `Tenant scope: ${company?.name ?? companyId} (${orders.length} work orders, ${items.length} inventory SKUs, ${assets.length} industrial assets).`,
      lowStock.length
        ? `${lowStock.length} SKU(s) at or below reorder threshold: ${lowStock.map((i) => `${i.sku} (${i.quantity}/${i.reorderLevel})`).join(', ')}.`
        : 'All inventory SKUs are above reorder levels.',
      topCostAssets.length
        ? `Top maintenance spend: ${topCostAssets[0].asset} at ${currency} ${topCostAssets[0].cost.toLocaleString()}.`
        : 'No maintenance spend recorded yet.',
      `RBAC enforcement: queried with role ${role} (${authorizedDocs.length}/${allDocs.length} knowledge documents authorized).`,
    ];

    return {
      currency,
      companyName: company?.name ?? 'Company',
      workOrders: orders.map((o) => ({
        title: o.title,
        status: o.status,
        priority: o.priority,
        asset: o.assetCode ? `${o.assetCode} (${o.assetName})` : 'Unassigned',
        cost: Number(o.actualCost) > 0 ? Number(o.actualCost) : Number(o.estimatedCost ?? 0),
      })),
      lowStock: lowStock.map((i) => ({
        name: i.name,
        sku: i.sku,
        unit: i.unit,
        quantity: Number(i.quantity),
        reorderLevel: Number(i.reorderLevel),
      })),
      topCostAssets,
      employeeCount: userCountRow?.c ?? 0,
      employeeDataRestricted: isViewer,
      assetCount: assets.length,
      pendingApprovals: approvals.map((a) => ({
        title: a.title,
        type: a.type,
        amount: Number(a.amount ?? 0),
      })),
      documents: authorizedDocs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        content: d.content,
      })),
      evidence,
    };
  }

  private matchDocuments(question: string, docs: Array<{ id: string; title: string; category: string; content: string }>) {
    const stop = new Set(['what', 'which', 'have', 'this', 'that', 'with', 'from', 'the', 'and', 'for', 'are', 'show', 'any', 'how']);
    const tokens = (question.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((w) => !stop.has(w));
    if (!tokens.length) return [];

    return docs
      .map((d) => {
        const hay = `${d.title} ${d.content}`.toLowerCase();
        const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
        return { doc: d, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ doc }) => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        excerpt: doc.content.slice(0, 200) + (doc.content.length > 200 ? '…' : ''),
      }));
  }

  private fallbackAnswer(question: string, role: string, ctx: any) {
    const q = question.toLowerCase();
    const cur = ctx.currency ?? 'LKR';
    const citations = this.matchDocuments(question, ctx.documents ?? []);
    let answer = '';

    if ((q.includes('employee') || q.includes('staff') || q.includes('salary') || q.includes('headcount')) && role === 'VIEWER') {
      answer = 'Access restricted: VIEWER role cannot query employee headcount or personal HR records under company RBAC governance.';
    } else if (q.includes('cost') || q.includes('expensive') || q.includes('spend') || q.includes('machine')) {
      answer = ctx.topCostAssets.length
        ? `Highest maintenance costs across authorized assets: ${ctx.topCostAssets
            .map((a: any) => `${a.asset} — ${cur} ${Number(a.cost).toLocaleString()} (${a.orders} order${a.orders === 1 ? '' : 's'})`)
            .join('; ')}.`
        : 'No maintenance cost records found yet.';
    } else if (q.includes('stock') || q.includes('inventory') || q.includes('low') || q.includes('reorder')) {
      answer = ctx.lowStock.length
        ? `${ctx.lowStock.length} item(s) are at or below reorder threshold: ${ctx.lowStock
            .map((i: any) => `${i.sku} ${i.name} (${i.quantity} ${i.unit} left, reorder at ${i.reorderLevel})`)
            .join('; ')}.`
        : 'All inventory items are currently above reorder thresholds.';
    } else if (q.includes('work order') || q.includes('open') || q.includes('critical') || q.includes('breakdown')) {
      const open = ctx.workOrders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
      answer = `There are ${open.length} active work order(s): ${
        open
          .slice(0, 5)
          .map((o: any) => `[${o.priority}/${o.status}] ${o.title}`)
          .join('; ') || 'none'
      }.`;
    } else if (q.includes('approval') || q.includes('purchase') || q.includes('pending')) {
      answer = ctx.pendingApprovals.length
        ? `${ctx.pendingApprovals.length} pending approval(s): ${ctx.pendingApprovals.map((a: any) => a.title).join('; ')}.`
        : 'No pending approvals in queue.';
    } else if (citations.length > 0) {
      answer = `According to ${citations[0].title}: ${citations[0].excerpt}`;
    } else {
      answer = `Operational summary for ${ctx.companyName}: ${ctx.assetCount} assets, ${ctx.workOrders.length} work orders, ${ctx.lowStock.length} low-stock SKUs, and ${ctx.pendingApprovals.length} pending approvals.`;
    }

    return { answer, mode: 'fallback-rule-based', evidence: ctx.evidence, citations };
  }

  async addDocument(companyId: string, dto: { title: string; content: string; category?: string; minRole?: string }) {
    return this.db.one(
      `INSERT INTO "documents" (company_id, title, category, min_role, content)
       VALUES ($1, $2, COALESCE($3, 'SOP'), COALESCE($4, 'VIEWER')::"Role", $5)
       RETURNING id, company_id AS "companyId", title, category, min_role AS "minRole",
                 content, created_at AS "createdAt"`,
      [companyId, dto.title.trim(), dto.category ?? 'SOP', dto.minRole ?? 'VIEWER', dto.content.trim()],
    );
  }

  async listDocuments(companyId: string, role: string) {
    const rank = ROLE_RANK[role] ?? 1;
    const docs = await this.db.many<any>(
      `SELECT id, company_id AS "companyId", title, category, min_role AS "minRole",
              content, created_at AS "createdAt"
       FROM "documents"
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId],
    );
    return docs.filter((d) => (ROLE_RANK[d.minRole] ?? 1) <= rank);
  }
}
