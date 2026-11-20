import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OpsPilot Enterprise API (e2e)', () => {
  let app: INestApplication;
  let tenantAToken: string;
  let tenantARefresh: string;
  let tenantBToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns database connected status', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
  });

  it('rejects invalid login DTO with 400 and unauthenticated route with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);

    await request(app.getHttpServer()).get('/api/analytics/dashboard').expect(401);
  });

  it('registers Tenant A & Tenant B and enforces single-use refresh token rotation', async () => {
    const regA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        companyName: 'Ceylon Precision Engineering',
        email: 'admin@ceylonprecision.lk',
        password: 'StrongPassword123!',
        firstName: 'Kasun',
        lastName: 'Perera',
      })
      .expect(201);

    tenantAToken = regA.body.accessToken;
    tenantARefresh = regA.body.refreshToken;
    expect(regA.body.user.role).toBe('COMPANY_ADMIN');

    // Rotate refresh token once -> succeeds
    const rotated = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: tenantARefresh })
      .expect(200);
    tenantAToken = rotated.body.accessToken;

    // Reusing old refresh token -> rejected (401)
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: tenantARefresh })
      .expect(401);

    // Register isolated Tenant B
    const regB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        companyName: 'Galle Marine Systems',
        email: 'admin@gallemarine.lk',
        password: 'StrongPassword123!',
        firstName: 'Sahan',
        lastName: 'Silva',
      })
      .expect(201);
    tenantBToken = regB.body.accessToken;
  });

  it('enforces RBAC: VIEWER cannot view employee roster, audit logs, or mutate inventory', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        email: 'auditor@ceylonprecision.lk',
        firstName: 'Tharushi',
        lastName: 'Fernando',
        password: 'StrongPassword123!',
        role: 'VIEWER',
      })
      .expect(201);

    const loginViewer = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'auditor@ceylonprecision.lk', password: 'StrongPassword123!' })
      .expect(200);
    viewerToken = loginViewer.body.accessToken;

    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Unauthorized Supplier' })
      .expect(403);
  });

  it('executes low-stock workflow automation -> approval -> PO receipt AND enforces multi-tenant isolation', async () => {
    const sup = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({ name: 'Colombo Bearings Co', email: 'orders@colombobearings.lk', leadTimeDays: 3 })
      .expect(201);

    const item = await request(app.getHttpServer())
      .post('/api/inventory')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        sku: 'SKF-6208',
        name: 'SKF Bearing 6208',
        category: 'Bearings',
        quantity: 12,
        reorderLevel: 10,
        unitCost: 6000,
        supplierId: sup.body.id,
      })
      .expect(201);

    // Tenant B MUST NOT see Tenant A's inventory or modify it
    const tenantBItems = await request(app.getHttpServer())
      .get('/api/inventory')
      .set('Authorization', `Bearer ${tenantBToken}`)
      .expect(200);
    expect(tenantBItems.body).toHaveLength(0);

    await request(app.getHttpServer())
      .patch(`/api/inventory/${item.body.id}`)
      .set('Authorization', `Bearer ${tenantBToken}`)
      .send({ name: 'Cross-Tenant Tamper' })
      .expect(404);

    // Outbound stock adjustment drops SKU from 12 -> 7 (below reorderLevel 10)
    const adj = await request(app.getHttpServer())
      .post(`/api/inventory/${item.body.id}/adjust`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({ type: 'OUT', quantity: 5, note: 'Issued for CNC spindle repair' })
      .expect(201);

    expect(adj.body.quantity).toBe(7);
    expect(adj.body.autoPurchaseOrder).toBeTruthy();

    const poId = adj.body.autoPurchaseOrder.id;
    const approvalId = adj.body.autoPurchaseOrder.approvalId;

    // Approve the automated Purchase Request
    await request(app.getHttpServer())
      .patch(`/api/approvals/${approvalId}/decide`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({ decision: 'APPROVED', comment: 'Approved urgent bearing replenishment' })
      .expect(200);

    // Receive the approved Purchase Order -> stock automatically replenished
    await request(app.getHttpServer())
      .post(`/api/purchase-orders/${poId}/receive`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .expect(201);

    const updatedItems = await request(app.getHttpServer())
      .get('/api/inventory')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .expect(200);
    expect(updatedItems.body[0].quantity).toBeGreaterThan(10);
  });

  it('tracks asset work-order costs, audit trail, and permission-aware AI answers with SOP citations', async () => {
    const asset = await request(app.getHttpServer())
      .post('/api/assets')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({ code: 'CNC-200', name: 'DMG Mori 5-Axis Mill', category: 'CNC', location: 'Bay 1' })
      .expect(201);

    const wo = await request(app.getHttpServer())
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        title: 'Spindle chiller pump overhaul',
        priority: 'HIGH',
        assetId: asset.body.id,
        estimatedCost: 180000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/work-orders/${wo.body.id}`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({ status: 'COMPLETED', actualCost: 195000 })
      .expect(200);

    // Index an SOP knowledge document
    await request(app.getHttpServer())
      .post('/api/ai/documents')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        title: 'SOP-200: DMG Mori Spindle Chiller Policy',
        category: 'SOP',
        content: 'Spindle chillers on CNC-200 must maintain 20C coolant temperature within 0.5C tolerance.',
      })
      .expect(201);

    // Query AI Assistant about maintenance costs
    const aiRes = await request(app.getHttpServer())
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({ question: 'Which machines have the highest maintenance costs?' })
      .expect(201);

    expect(aiRes.body.answer).toContain('CNC-200');
    expect(aiRes.body.evidence.length).toBeGreaterThan(0);
    expect(Array.isArray(aiRes.body.uiBlocks)).toBe(true);
    expect(aiRes.body.uiBlocks.some((b: any) => b.type === 'ranked_list')).toBe(true);
    expect(aiRes.body.uiBlocks.some((b: any) => b.type === 'chart')).toBe(true);

    // Query AI Assistant about a website feature -> triggers automatic route navigation + navigation_card UI
    const navAi = await request(app.getHttpServer())
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({
        question: 'Where can I add a new product to inventory?',
        currentPage: '/ai-assistant',
      })
      .expect(201);
    expect(navAi.body.intent.category).toBe('WEB_NAVIGATION');
    expect(navAi.body.intent.autoNavigate.shouldMove).toBe(true);
    expect(navAi.body.intent.autoNavigate.route).toBe('/inventory');
    expect(navAi.body.uiBlocks[0].type).toBe('navigation_card');

    // Verify VIEWER AI query restricts employee data
    const viewerAi = await request(app.getHttpServer())
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ question: 'How many employees and staff headcount do we have?' })
      .expect(201);
    expect(viewerAi.body.answer.toLowerCase()).toContain('restricted');

    // Verify Analytics & Audit Trail
    const dash = await request(app.getHttpServer())
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .expect(200);
    expect(dash.body.kpis.completedWorkOrders).toBe(1);
    expect(dash.body.maintenanceCosts.actual).toBe(195000);

    const audits = await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .expect(200);
    expect(audits.body.length).toBeGreaterThan(3);
  });
});
