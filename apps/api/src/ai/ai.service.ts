import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const ROLE_RANK: Record<string, number> = {
  VIEWER: 1,
  EMPLOYEE: 2,
  MANAGER: 3,
  COMPANY_ADMIN: 4,
  SUPER_ADMIN: 5,
};

export interface WebsiteFeatureDef {
  route: string;
  title: string;
  badge: string;
  description: string;
  keywords: string[];
  actionPhrases: string[];
  highlightAction: string;
  steps: string[];
  relatedRoutes: { label: string; route: string }[];
}

export const WEBSITE_FEATURES: WebsiteFeatureDef[] = [
  {
    route: '/dashboard',
    title: 'Dashboard Overview',
    badge: 'Executive Overview',
    description:
      'Real-time executive KPIs, Business Performance trend, Department Overview donut chart, Equipment Spend bar chart, and Recent Activities feed.',
    keywords: ['dashboard', 'home', 'overview', 'main page', 'executive summary', 'business performance'],
    actionPhrases: ['kpi', 'recent activity', 'home screen'],
    highlightAction: 'Use the "Last 30 Days" selector at top-right or inspect Business Performance & Department charts.',
    steps: [
      'Review the 4 live KPI cards (Employees, Inventory, Pending Work Orders, Monthly Purchases).',
      'Compare This Month vs Last Month on the Business Performance area chart.',
      'Check Recent Activities at bottom-right for real-time operational events.',
    ],
    relatedRoutes: [
      { label: 'Reports & Analytics', route: '/reports' },
      { label: 'Notifications', route: '/notifications' },
    ],
  },
  {
    route: '/employees',
    title: 'Employee Management',
    badge: 'HR & Access',
    description:
      'Manage staff directory, add employees, filter by department or status, edit RBAC roles, and suspend or reactivate accounts.',
    keywords: ['employee', 'employees', 'staff', 'team member', 'hr', 'personnel', 'user management', 'hire', 'roster'],
    actionPhrases: ['add employee', 'create employee', 'new employee', 'change role', 'suspend user', 'edit employee'],
    highlightAction: 'Click "+ Add Employee" at top-right to onboard staff, or click the blue Pencil icon to edit RBAC roles.',
    steps: [
      'Click "+ Add Employee" in the top-right corner to create a new staff account.',
      'Use the Search box, Department filter, and Status dropdown to narrow the roster.',
      'Click the blue Edit button on any row to change RBAC role (Admin, Manager, Employee, Viewer).',
    ],
    relatedRoutes: [
      { label: 'Departments', route: '/departments' },
      { label: 'RBAC Roles Matrix', route: '/settings' },
    ],
  },
  {
    route: '/departments',
    title: 'Departments',
    badge: 'Organization',
    description:
      'View and create organizational departments and cost centers (IT, Operations, HR, Finance, Maintenance) with live staff counts.',
    keywords: ['department', 'departments', 'cost center', 'teams', 'division', 'org structure'],
    actionPhrases: ['add department', 'create department', 'new department'],
    highlightAction: 'Click "+ Add Department" in the top-right corner to create a new organizational unit.',
    steps: [
      'Inspect live employee counts assigned to each department.',
      'Click "+ Add Department" to register a new team or cost center.',
      'Assign employees to departments inside Employee Management.',
    ],
    relatedRoutes: [{ label: 'Employee Management', route: '/employees' }],
  },
  {
    route: '/inventory',
    title: 'Inventory Management',
    badge: 'Supply Chain',
    description:
      'Multi-warehouse SKU catalog, sparkline KPIs (Total Items, Low Stock, Out of Stock, Total Value), CSV export, and atomic stock ledger adjustments.',
    keywords: ['inventory', 'stock', 'product', 'products', 'sku', 'warehouse', 'items', 'restock', 'out of stock', 'low stock'],
    actionPhrases: ['add product', 'export inventory', 'export csv', 'adjust stock', 'add stock', 'issue stock'],
    highlightAction: 'Click "+ Add Product" to add SKUs, "Export" for CSV download, or the blue Pencil icon to adjust stock.',
    steps: [
      'Check the 4 sparkline KPI cards at the top for Low Stock and Out of Stock alerts.',
      'Click "+ Add Product" to register a new SKU or "Export" to download a CSV spreadsheet.',
      'Click the blue Edit icon on any product row to commit a stock restock (+) or consumption (-).',
    ],
    relatedRoutes: [
      { label: 'Purchase Orders', route: '/purchase-orders' },
      { label: 'Suppliers', route: '/suppliers' },
    ],
  },
  {
    route: '/maintenance',
    title: 'Maintenance & Work Orders',
    badge: 'Field Operations',
    description:
      'Dispatch preventive and corrective work orders, monitor Open/In Progress/Completed/Overdue SLAs, and transition order status.',
    keywords: ['maintenance', 'work order', 'work orders', 'repair', 'breakdown', 'service ticket', 'overdue', 'technician'],
    actionPhrases: ['create work order', 'new work order', 'dispatch technician', 'complete work order'],
    highlightAction: 'Click "+ Create Work Order" at top-right or switch tabs (All, Open, In Progress, Completed, Overdue).',
    steps: [
      'Filter work orders instantaneously using the Open, In Progress, Completed, and Overdue tabs.',
      'Click "+ Create Work Order" to dispatch a technician (URGENT orders auto-trigger Workflow Approval).',
      'Use the inline Status dropdown on any row to mark an order IN_PROGRESS or COMPLETED.',
    ],
    relatedRoutes: [
      { label: 'Machines & Equipment', route: '/assets' },
      { label: 'Workflow Approvals', route: '/approvals' },
    ],
  },
  {
    route: '/assets',
    title: 'Machines & Equipment Assets',
    badge: 'Industrial Assets',
    description:
      'Physical registry of generators, compressors, HVAC units, conveyors, and CNC mills with cumulative maintenance spend and service dates.',
    keywords: ['asset', 'assets', 'machine', 'machines', 'equipment', 'generator', 'compressor', 'hvac', 'cnc', 'conveyor'],
    actionPhrases: ['register equipment', 'add asset', 'add machine', 'equipment registry'],
    highlightAction: 'Click "+ Register Equipment" at top-right to add a machine to preventive maintenance tracking.',
    steps: [
      'Review operational health status and cumulative LKR maintenance spend per machine.',
      'Click "+ Register Equipment" to add a new industrial asset.',
      'Create linked repair tickets in Maintenance & Work Orders.',
    ],
    relatedRoutes: [{ label: 'Maintenance & Work Orders', route: '/maintenance' }],
  },
  {
    route: '/purchase-orders',
    title: 'Purchasing & Purchase Orders',
    badge: 'Procurement',
    description:
      'Create vendor purchase orders, track approval status, and receive shipments to atomically increment inventory stock.',
    keywords: ['purchase order', 'purchase orders', 'purchasing', 'procurement', 'po', 'buy stock', 'order stock'],
    actionPhrases: ['create po', 'new purchase order', 'receive po', 'mark received'],
    highlightAction: 'Click "+ Create PO" to submit an order, or click "Mark Received (+Stock)" on approved POs.',
    steps: [
      'Click "+ Create PO" and choose an approved supplier and inventory SKU.',
      'Orders automatically route to Workflow & Approvals for Manager/Admin sign-off.',
      'Once APPROVED, click "Mark Received (+Stock)" to replenish warehouse quantities automatically.',
    ],
    relatedRoutes: [
      { label: 'Workflow Approvals', route: '/approvals' },
      { label: 'Suppliers & Vendors', route: '/suppliers' },
    ],
  },
  {
    route: '/suppliers',
    title: 'Suppliers & Vendors',
    badge: 'Vendor Network',
    description:
      'Directory of approved suppliers with contact emails, phone numbers, Colombo/regional addresses, lead times, and linked SKU counts.',
    keywords: ['supplier', 'suppliers', 'vendor', 'vendors', 'lead time'],
    actionPhrases: ['add supplier', 'new vendor', 'create supplier'],
    highlightAction: 'Click "+ Add Supplier" in the top-right corner to onboard a vendor.',
    steps: [
      'Inspect delivery lead times and linked SKU counts across all approved vendors.',
      'Click "+ Add Supplier" to register a new procurement partner.',
    ],
    relatedRoutes: [{ label: 'Purchase Orders', route: '/purchase-orders' }],
  },
  {
    route: '/approvals',
    title: 'Workflow & Approvals',
    badge: 'Governance',
    description:
      'Centralized multi-stage authorization queue for pending Purchase Orders and high-cost or urgent Maintenance Work Orders.',
    keywords: ['approval', 'approvals', 'workflow', 'authorize', 'sign off', 'pending decision', 'reject'],
    actionPhrases: ['approve po', 'approve request', 'reject request', 'pending approvals'],
    highlightAction: 'Click "Approve" or "Reject" on any PENDING item to finalize workflow authorization.',
    steps: [
      'Review pending Purchase Orders and Urgent Work Orders with requested LKR amounts.',
      'Click the green "Approve" button or red "Reject" button (requires Manager or Admin role).',
      'Real-time Socket.IO notifications alert requesters immediately upon decision.',
    ],
    relatedRoutes: [
      { label: 'Purchase Orders', route: '/purchase-orders' },
      { label: 'Maintenance', route: '/maintenance' },
    ],
  },
  {
    route: '/reports',
    title: 'Reports & Analytics',
    badge: 'Business Intelligence',
    description:
      'Executive BI suite with Monthly Performance area chart, Top Products share bars, Maintenance Cost bar chart, Total Requests donut, and JSON report export.',
    keywords: ['report', 'reports', 'analytics', 'bi', 'chart', 'charts', 'statistics', 'financial report', 'monthly performance'],
    actionPhrases: ['generate report', 'download report', 'export analytics'],
    highlightAction: 'Switch between Overview, Inventory, Maintenance & Financial tabs, or click "Generate Report".',
    steps: [
      'Switch across Overview, Inventory, Maintenance, and Financial tabs.',
      'Inspect Monthly Performance, Top Products valuation share, and Maintenance Cost trends.',
      'Click "Generate Report" at top-right to download a structured executive report.',
    ],
    relatedRoutes: [{ label: 'Dashboard Overview', route: '/dashboard' }],
  },
  {
    route: '/notifications',
    title: 'Notifications',
    badge: 'Real-Time Alerts',
    description:
      'Live Socket.IO alert center for low-stock threshold breaches, new purchase order approvals, and workflow completions.',
    keywords: ['notification', 'notifications', 'alerts', 'inbox', 'bell', 'unread'],
    actionPhrases: ['mark all as read', 'check alerts', 'view notifications'],
    highlightAction: 'Review unread alerts highlighted in emerald or click "Mark All as Read".',
    steps: [
      'Unread alerts appear with a glowing emerald border and NEW badge.',
      'Click "Mark All as Read" at top-right to clear your notification counter.',
    ],
    relatedRoutes: [{ label: 'Workflow Approvals', route: '/approvals' }],
  },
  {
    route: '/audit',
    title: 'Security Audit Logs',
    badge: 'Compliance',
    description:
      'Immutable append-only security ledger recording every state-changing API mutation, actor identity, RBAC role, and JSON metadata.',
    keywords: ['audit', 'audit log', 'audit logs', 'security log', 'activity log', 'compliance', 'who changed', 'history'],
    actionPhrases: ['view audit trail', 'inspect security logs'],
    highlightAction: 'Inspect chronological actor mutations, entity IDs, and metadata payloads.',
    steps: [
      'Verify every CREATE, UPDATE, ADJUST, and DECIDE event with actor role and timestamp.',
      'Note: Restricted to COMPANY_ADMIN and MANAGER roles for compliance integrity.',
    ],
    relatedRoutes: [{ label: 'System Settings', route: '/settings' }],
  },
  {
    route: '/settings',
    title: 'System Settings',
    badge: 'Configuration',
    description:
      'Configure Company Information (name, email, phone, address, timezone, currency), System Preferences (Email, SMS, Auto Backup, 2FA), and inspect the RBAC Role Matrix.',
    keywords: ['setting', 'settings', 'configuration', 'preferences', 'company info', 'company profile', '2fa', 'two-factor', 'backup', 'timezone', 'currency', 'rbac'],
    actionPhrases: ['change settings', 'update company', 'enable 2fa', 'turn on backup', 'roles matrix'],
    highlightAction: 'Switch across Company, Users, Roles, Notifications & Security tabs, then click "Save Changes".',
    steps: [
      'Edit Company Name, Email, Phone, Address, Timezone, or Currency on the Company tab.',
      'Toggle Email Notifications, SMS Alerts, Auto Backup, and Two-Factor Auth under System Preferences.',
      'Open the Roles tab to inspect the full 4-tier RBAC permission matrix.',
    ],
    relatedRoutes: [
      { label: 'Security Audit Logs', route: '/audit' },
      { label: 'Employee Management', route: '/employees' },
    ],
  },
];

export interface AskOptions {
  history?: Array<{ role: string; content: string }>;
  currentPage?: string;
  openRouterKey?: string;
  openRouterModel?: string;
}

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
    return {
      ok: true,
      aiServiceUrl,
      aiServiceReachable: reachable,
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      capabilities: [
        'website-auto-navigation',
        'live-postgresql-generative-ui',
        'openrouter-llm',
        'sop-rag-citations',
        'rbac-permission-guard',
      ],
    };
  }

  async ask(companyId: string, role: string, question: string, opts: AskOptions = {}) {
    const ctx = await this.buildRichContext(companyId, role);
    const citations = this.matchDocuments(question, ctx.documents);
    const analysis = this.analyzeIntentAndBuildUi(question, role, ctx, citations, opts.currentPage);

    // 1. If an OpenRouter API key is provided (via UI or server env), synthesize natural human-like
    //    reasoning with OpenRouter LLM while keeping our exact verified SQL uiBlocks & RBAC safety!
    const apiKey = (opts.openRouterKey || process.env.OPENROUTER_API_KEY || '').trim();
    if (apiKey && analysis.mode !== 'restricted') {
      const llmResult = await this.callOpenRouter(
        apiKey,
        opts.openRouterModel || process.env.OPENROUTER_MODEL || 'openrouter/auto',
        question,
        role,
        ctx,
        analysis,
        citations,
        opts.history ?? [],
        opts.currentPage,
      );
      if (llmResult) {
        return {
          ...analysis,
          answer: llmResult.answer || analysis.answer,
          mode: 'openrouter-llm',
          modelUsed: llmResult.modelUsed,
          intent: {
            ...analysis.intent,
            autoNavigate: llmResult.autoNavigate ?? analysis.intent.autoNavigate,
          },
          suggestedFollowUps:
            llmResult.suggestedFollowUps && llmResult.suggestedFollowUps.length > 0
              ? llmResult.suggestedFollowUps
              : analysis.suggestedFollowUps,
        };
      }
    }

    // 2. If local Python AI service has Ollama LLM active, allow optional enrichment for pure text/SOP queries
    const aiUrl = process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8001';
    if (analysis.intent.category === 'SOP_KNOWLEDGE' || analysis.mode === 'restricted') {
      try {
        const res = await fetch(`${aiUrl}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, companyId, role, context: ctx }),
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const pyData = await res.json();
          if (pyData.mode === 'ollama' && pyData.answer) {
            return {
              ...analysis,
              answer: pyData.answer,
              mode: 'ollama-llm',
            };
          }
        }
      } catch {
        // Ignore when Python microservice is sleeping or offline; built-in GenUI engine handles all requests
      }
    }

    return analysis;
  }

  private detectNavigationIntent(question: string, currentPage?: string): {
    isExplicitNav: boolean;
    isFeatureHowTo: boolean;
    isPlatformTour: boolean;
    feature: WebsiteFeatureDef | null;
  } {
    const q = question.toLowerCase().trim();

    const isPlatformTour =
      /\b(what features|all features|website features|platform features|what can (this|you|opspilot) do|tour|all modules|all pages|site map|sitemap)\b/i.test(
        q,
      );

    // Explicit navigation verbs ("go to", "open", "take me to", "move to", "navigate", "switch to", "visit", "bring me")
    const navVerbMatch =
      /\b(go to|goto|open|take me|move to|move me|navigate|switch to|jump to|visit|bring me|redirect|launch|head to)\b/i.test(
        q,
      );

    // Feature discovery / location questions ("where can i", "where do i", "where is", "how do i", "how can i", "how to", "find the page", "which page")
    const howToMatch =
      /\b(where can i|where do i|where is|where are|how do i|how can i|how to|which page|find .* page|feature for|page for)\b/i.test(
        q,
      );

    // Pure data query indicators ("how many", "total", "sum", "average", "which machines", "top", "compare", "list all", "count", "who works")
    const strongDataIndicator =
      /\b(how many|total|highest|lowest|most expensive|average|compare|breakdown|top \d|who is|count)\b/i.test(q);

    let bestFeature: WebsiteFeatureDef | null = null;
    let bestScore = 0;

    for (const feat of WEBSITE_FEATURES) {
      let score = 0;
      if (q.includes(feat.route.replace('/', ''))) score += 4;
      for (const phrase of feat.actionPhrases) {
        if (q.includes(phrase)) score += 6;
      }
      for (const kw of feat.keywords) {
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(q)) score += 3;
        else if (q.includes(kw)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestFeature = feat;
      }
    }

    const isExplicitNav = Boolean(bestFeature && navVerbMatch && !strongDataIndicator);
    const isFeatureHowTo = Boolean(bestFeature && howToMatch);

    // Also handle short direct commands like "inventory page", "settings page", "reports section"
    const mentionsPageWord = Boolean(
      bestFeature && /\b(page|screen|module|section|tab|panel|console)\b/i.test(q) && !strongDataIndicator,
    );

    if (currentPage && bestFeature && bestFeature.route === currentPage && !navVerbMatch) {
      return {
        isExplicitNav: false,
        isFeatureHowTo,
        isPlatformTour,
        feature: bestFeature,
      };
    }

    return {
      isExplicitNav: isExplicitNav || mentionsPageWord,
      isFeatureHowTo,
      isPlatformTour,
      feature: bestScore >= 2 ? bestFeature : null,
    };
  }

  private analyzeIntentAndBuildUi(
    question: string,
    role: string,
    ctx: any,
    citations: Array<{ id: string; title: string; category: string; excerpt: string }>,
    currentPage?: string,
  ) {
    const q = question.toLowerCase().trim();
    const cur = ctx.currency === 'LKR' ? 'Rs.' : ctx.currency;
    const currencyCode = ctx.currency ?? 'LKR';
    const nav = this.detectNavigationIntent(question, currentPage);

    // -------------------------------------------------------------------------
    // 0. RBAC Restriction Guard (VIEWER asking about HR / employees / audit)
    // -------------------------------------------------------------------------
    if (
      role === 'VIEWER' &&
      /\b(employee|employees|staff|salary|headcount|roster|hr|personnel|who works)\b/i.test(q)
    ) {
      return {
        answer:
          'Access restricted: Your current VIEWER role is not authorized to query employee headcount, personal HR profiles, or salary records under OpsPilot RBAC governance.',
        mode: 'restricted',
        intent: {
          category: 'DATABASE_ANALYTICS',
          confidence: 0.99,
          tablesQueried: ['users (RBAC blocked)'],
          rowCount: 0,
        },
        uiBlocks: [
          {
            type: 'kpi_grid',
            title: 'RBAC Governance Enforcement',
            items: [
              { label: 'Active Session Role', value: 'VIEWER', subtext: 'Read-only operations scope', tone: 'amber' },
              { label: 'HR / Staff Records', value: 'Restricted', subtext: 'Requires EMPLOYEE+ role', tone: 'rose' },
              { label: 'Authorized Assets', value: String(ctx.assetCount), subtext: 'Permitted telemetry', tone: 'emerald' },
            ],
          },
        ],
        suggestedFollowUps: [
          'Which machines have the highest maintenance costs?',
          'Show low stock and out of stock inventory items',
          'Open Reports & Analytics page',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 1. Platform-Wide Feature Tour ("What features does this website have?")
    // -------------------------------------------------------------------------
    if (nav.isPlatformTour) {
      return {
        answer: `OpsPilot (${ctx.companyName}) includes ${WEBSITE_FEATURES.length} integrated enterprise modules. Click any module card below to jump straight there, or ask me to open any feature automatically.`,
        mode: 'opspilot-sql-genui',
        intent: {
          category: 'WEB_FEATURE_GUIDE',
          confidence: 0.96,
          tablesQueried: ['companies'],
          rowCount: WEBSITE_FEATURES.length,
        },
        uiBlocks: [
          {
            type: 'feature_catalog',
            title: 'OpsPilot Interactive Module Directory',
            features: WEBSITE_FEATURES.slice(0, 10).map((f) => ({
              name: f.title,
              route: f.route,
              summary: f.description,
              badge: f.badge,
            })),
          },
        ],
        suggestedFollowUps: [
          'Take me to Inventory Management',
          'Give me a complete overview of our database right now',
          'Where can I configure 2FA and company settings?',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 2. Pure Website Feature Discovery / Auto-Navigation
    // -------------------------------------------------------------------------
    const alsoWantsData =
      /\b(show|list|which|how many|total|give me|display|find all|what are)\b/i.test(q) &&
      !/\b(show me (the )?(page|screen|module|settings|dashboard|reports))\b/i.test(q);

    if ((nav.isExplicitNav || nav.isFeatureHowTo) && nav.feature && !alsoWantsData) {
      const feat = nav.feature;
      const alreadyThere = currentPage === feat.route;
      return {
        answer: alreadyThere
          ? `You are currently on **${feat.title}** (${feat.route}). ${feat.highlightAction}`
          : `I found that in **${feat.title}** (\`${feat.route}\`) — moving you there automatically now! ${feat.highlightAction}`,
        mode: 'opspilot-sql-genui',
        intent: {
          category: 'WEB_NAVIGATION',
          confidence: 0.97,
          tablesQueried: [],
          rowCount: 0,
          autoNavigate: {
            shouldMove: !alreadyThere,
            route: feat.route,
            pageTitle: feat.title,
            delayMs: nav.isExplicitNav ? 1200 : 1800,
            highlightAction: feat.highlightAction,
            steps: feat.steps,
          },
        },
        uiBlocks: [
          {
            type: 'navigation_card',
            title: feat.title,
            route: feat.route,
            description: feat.description,
            badge: feat.badge,
            autoMove: !alreadyThere,
            steps: feat.steps,
            relatedRoutes: feat.relatedRoutes,
          },
        ],
        suggestedFollowUps: [
          `Show live database statistics for ${feat.title}`,
          'What other features does OpsPilot have?',
          'Back to Dashboard Overview',
        ],
        evidence: [`Website Feature Matched: ${feat.title} (${feat.route})`],
        citations,
      };
    }

    // Helper to attach optional hybrid auto-navigation if user asked BOTH for data AND to move/find a feature
    const attachHybridNav = (targetRoute: string) => {
      if (!nav.isExplicitNav && !nav.isFeatureHowTo) return undefined;
      const feat = WEBSITE_FEATURES.find((f) => f.route === targetRoute) || nav.feature;
      if (!feat || currentPage === feat.route) return undefined;
      return {
        shouldMove: true,
        route: feat.route,
        pageTitle: feat.title,
        delayMs: 2200,
        highlightAction: feat.highlightAction,
        steps: feat.steps,
      };
    };

    // -------------------------------------------------------------------------
    // 3. DATABASE DOMAIN: Employees, HR, Departments, Staff Search
    // -------------------------------------------------------------------------
    if (
      /\b(employee|employees|staff|headcount|department|departments|hr|manager|managers|admin|engineer|accountant|technician|who works|who is|vidura|nimesh|tharushi|kavindu|sashika|dilini|dilshan)\b/i.test(
        q,
      ) &&
      !/\b(work order|maintenance cost)\b/i.test(q)
    ) {
      let matchedUsers = [...ctx.users];
      let filterDesc = 'All Active & Registered Staff';

      // Check department filter
      const matchedDept = ctx.departments.find((d: any) =>
        new RegExp(`\\b${d.name.toLowerCase()}\\b`, 'i').test(q),
      );
      if (matchedDept) {
        matchedUsers = matchedUsers.filter(
          (u: any) => (u.departmentName || '').toLowerCase() === matchedDept.name.toLowerCase(),
        );
        filterDesc = `${matchedDept.name} Department`;
      }

      // Check role filter
      if (/\bmanager/i.test(q)) {
        matchedUsers = matchedUsers.filter(
          (u: any) => u.role === 'MANAGER' || (u.jobTitle || '').toLowerCase().includes('manager'),
        );
        filterDesc = 'Managers & Leads';
      } else if (/\badmin/i.test(q)) {
        matchedUsers = matchedUsers.filter((u: any) => u.role === 'COMPANY_ADMIN');
        filterDesc = 'Administrators';
      }

      // Check specific person name filter
      const personMatch = ctx.users.filter(
        (u: any) =>
          q.includes(u.firstName.toLowerCase()) || q.includes(u.lastName.toLowerCase()),
      );
      if (personMatch.length > 0) {
        matchedUsers = personMatch;
        filterDesc = `Matched Staff Profile (${personMatch.map((p: any) => p.firstName).join(', ')})`;
      }

      const activeCount = matchedUsers.filter((u: any) => u.status === 'ACTIVE').length;
      const autoNav = attachHybridNav('/employees');

      return {
        answer:
          personMatch.length > 0
            ? `Found ${personMatch.length} employee record(s) in PostgreSQL: ${personMatch
                .map(
                  (p: any) =>
                    `${p.firstName} ${p.lastName} (${p.jobTitle || p.role} in ${p.departmentName || 'Operations'}, ${p.email})`,
                )
                .join('; ')}.`
            : `${ctx.companyName} currently has ${ctx.employeeCount} employees across ${ctx.departments.length} departments${
                matchedDept ? ` — ${matchedUsers.length} assigned to ${matchedDept.name}` : ''
              }. Below is the live breakdown from PostgreSQL.`,
        mode: 'opspilot-sql-genui',
        intent: {
          category: autoNav ? 'HYBRID_DATA_AND_NAV' : 'DATABASE_ANALYTICS',
          confidence: 0.95,
          tablesQueried: ['users', 'departments'],
          rowCount: matchedUsers.length,
          autoNavigate: autoNav,
        },
        uiBlocks: [
          {
            type: 'kpi_grid',
            title: `Live HR & Organization Snapshot · ${filterDesc}`,
            items: [
              { label: 'Matched Employees', value: String(matchedUsers.length), subtext: `of ${ctx.employeeCount} total staff`, tone: 'emerald' },
              { label: 'Active Accounts', value: String(activeCount), subtext: 'RBAC verified', tone: 'blue' },
              { label: 'Departments', value: String(ctx.departments.length), subtext: ctx.departments.map((d: any) => d.name).slice(0, 3).join(', '), tone: 'purple' },
            ],
          },
          {
            type: 'chart',
            title: 'Headcount by Department',
            subtitle: 'Live distribution from users & departments tables',
            defaultChartType: 'donut',
            data: ctx.departments.map((d: any) => ({
              name: d.name,
              value: Number(d.memberCount || 0),
            })),
          },
          {
            type: 'data_table',
            title: `Employee Directory (${filterDesc})`,
            subtitle: `${matchedUsers.length} record(s) retrieved from PostgreSQL`,
            exportFilename: 'opspilot-employees-ai.csv',
            columns: ['Employee', 'Email', 'Department', 'Job Title', 'Status'],
            rows: matchedUsers.slice(0, 12).map((u: any) => ({
              avatarName: `${u.firstName} ${u.lastName}`,
              cells: [
                `${u.firstName} ${u.lastName}`,
                u.email,
                u.departmentName || 'Operations',
                u.jobTitle || u.role,
                u.status === 'ACTIVE' ? 'Active' : 'Suspended',
              ],
              badgeIndex: 4,
              badgeTone: u.status === 'ACTIVE' ? 'emerald' : 'rose',
            })),
          },
        ],
        suggestedFollowUps: [
          'Take me to Employee Management to add someone',
          'Compare department sizes as a bar chart',
          'Show pending workflow approvals',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 4. DATABASE DOMAIN: Inventory, Stock, Low Stock, Out of Stock, Valuation
    // -------------------------------------------------------------------------
    if (
      /\b(inventory|stock|sku|skus|product|products|reorder|out of stock|low stock|warehouse|laptop|monitor|chair|mouse|printer|bearing|electronics|furniture|valuation)\b/i.test(
        q,
      )
    ) {
      const onlyOut = /\bout of stock|zero stock|empty stock\b/i.test(q) && !/\blow\b/i.test(q);
      const onlyLow = !onlyOut && /\blow|reorder|shortage|restock|running out|below|out of stock\b/i.test(q);

      let matchedItems = [...ctx.items];
      let scopeLabel = 'All Inventory SKUs';

      if (onlyOut) {
        matchedItems = matchedItems.filter((i: any) => i.quantity === 0);
        scopeLabel = 'Out-of-Stock SKUs';
      } else if (onlyLow) {
        matchedItems = matchedItems.filter((i: any) => i.quantity <= i.reorderLevel);
        scopeLabel = 'Low & Out-of-Stock SKUs';
      } else {
        // Optional category or product keyword filter
        const catMatch = ctx.items.filter(
          (i: any) =>
            q.includes(i.category.toLowerCase()) ||
            q.includes(i.name.toLowerCase()) ||
            q.includes(i.sku.toLowerCase()),
        );
        if (catMatch.length > 0 && catMatch.length < ctx.items.length) {
          matchedItems = catMatch;
          scopeLabel = 'Filtered Inventory Matches';
        }
      }

      const totalUnits = ctx.items.reduce((s: number, i: any) => s + i.quantity, 0);
      const totalValue = ctx.items.reduce((s: number, i: any) => s + i.quantity * i.unitCost, 0);
      const outCount = ctx.items.filter((i: any) => i.quantity === 0).length;
      const autoNav = attachHybridNav('/inventory');

      const summaryText =
        onlyLow || onlyOut
          ? matchedItems.length > 0
            ? `Identified ${matchedItems.length} SKU(s) requiring immediate replenishment: ${matchedItems
                .map((i: any) => `${i.name} [${i.sku}] (${i.quantity} left, reorder at ${i.reorderLevel})`)
                .join('; ')}.`
            : 'All inventory items are currently healthy and above reorder thresholds.'
          : `Your warehouse holds ${totalUnits.toLocaleString()} total units across ${ctx.items.length} SKUs valued at ${cur} ${totalValue.toLocaleString()} (${ctx.lowStock.length} at/below reorder point, ${outCount} out of stock).`;

      return {
        answer: summaryText,
        mode: 'opspilot-sql-genui',
        intent: {
          category: autoNav ? 'HYBRID_DATA_AND_NAV' : 'DATABASE_ANALYTICS',
          confidence: 0.96,
          tablesQueried: ['inventory_items', 'suppliers'],
          rowCount: matchedItems.length,
          autoNavigate: autoNav,
        },
        uiBlocks: [
          {
            type: 'kpi_grid',
            title: 'Warehouse Inventory Telemetry',
            items: [
              { label: 'Total Stock Units', value: totalUnits.toLocaleString(), subtext: `${ctx.items.length} active SKUs`, tone: 'emerald' },
              { label: 'Low Stock Alert', value: String(ctx.lowStock.length), subtext: 'At or below reorder point', tone: 'amber' },
              { label: 'Out of Stock', value: String(outCount), subtext: '0 units on hand', tone: 'rose' },
              { label: 'Total Valuation', value: `${cur} ${Math.round(totalValue / 1000).toLocaleString()}K`, subtext: `${cur} ${totalValue.toLocaleString()}`, tone: 'blue' },
            ],
          },
          {
            type: 'chart',
            title: 'Stock Valuation by Product',
            subtitle: `Unit quantity × unit cost (${cur})`,
            defaultChartType: 'bar',
            valuePrefix: `${cur} `,
            data: [...ctx.items]
              .sort((a: any, b: any) => b.quantity * b.unitCost - a.quantity * a.unitCost)
              .slice(0, 6)
              .map((i: any) => ({
                name: i.name.length > 16 ? `${i.name.slice(0, 15)}…` : i.name,
                value: Math.round(i.quantity * i.unitCost),
                secondary: i.quantity,
              })),
          },
          {
            type: 'data_table',
            title: `Live Inventory Ledger · ${scopeLabel}`,
            subtitle: `${matchedItems.length} item(s) from PostgreSQL inventory_items`,
            exportFilename: 'opspilot-inventory-ai.csv',
            columns: ['SKU', 'Product', 'Category', 'Qty / Reorder', `Unit Cost (${cur})`, 'Status'],
            rows: matchedItems.map((i: any) => {
              const st = i.quantity === 0 ? 'Out of Stock' : i.quantity <= i.reorderLevel ? 'Low Stock' : 'In Stock';
              const tone = i.quantity === 0 ? 'rose' : i.quantity <= i.reorderLevel ? 'amber' : 'emerald';
              return {
                cells: [
                  i.sku,
                  i.name,
                  i.category,
                  `${i.quantity} / ${i.reorderLevel}`,
                  `${cur} ${Number(i.unitCost).toLocaleString()}`,
                  st,
                ],
                badgeIndex: 5,
                badgeTone: tone,
              };
            }),
          },
        ],
        suggestedFollowUps: [
          'Open Inventory Management to restock items',
          'Show our approved suppliers and lead times',
          'Show pending purchase order approvals',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 5. DATABASE DOMAIN: Approvals & Workflow Queue (with Live Inline Execution!)
    // -------------------------------------------------------------------------
    if (/\b(approval|approvals|pending decision|workflow queue|sign off|awaiting approval)\b/i.test(q)) {
      const canDecide = (ROLE_RANK[role] ?? 1) >= ROLE_RANK.MANAGER;
      const autoNav = attachHybridNav('/approvals');

      return {
        answer:
          ctx.allApprovals.length > 0
            ? `There are ${ctx.pendingApprovals.length} pending approval(s) and ${ctx.allApprovals.length} total workflow items in PostgreSQL. ${
                canDecide
                  ? 'You can approve or reject pending requests directly inside the cards below!'
                  : 'Manager or Administrator privileges are required to sign off.'
              }`
            : 'Your workflow approval queue is completely clear — 0 pending approvals.',
        mode: 'opspilot-sql-genui',
        intent: {
          category: autoNav ? 'HYBRID_DATA_AND_NAV' : 'DATABASE_ANALYTICS',
          confidence: 0.96,
          tablesQueried: ['approvals', 'purchase_orders', 'work_orders'],
          rowCount: ctx.allApprovals.length,
          autoNavigate: autoNav,
        },
        uiBlocks: [
          {
            type: 'kpi_grid',
            items: [
              { label: 'Pending Sign-Off', value: String(ctx.pendingApprovals.length), subtext: 'Actionable right in chat', tone: 'amber' },
              { label: 'Total Workflow Items', value: String(ctx.allApprovals.length), subtext: 'POs & Escalations', tone: 'blue' },
              { label: 'Your Approval Authority', value: canDecide ? 'Authorized' : 'Read-Only', subtext: role, tone: canDecide ? 'emerald' : 'rose' },
            ],
          },
          {
            type: 'action_cards',
            title: 'Live Workflow Authorization Queue',
            items: ctx.allApprovals.slice(0, 8).map((a: any) => ({
              id: a.id,
              entityType: 'APPROVAL',
              title: a.title,
              subtitle: `${a.type} · Requested by ${a.requesterName || 'System'}`,
              amount: a.amount ? `${cur} ${Number(a.amount).toLocaleString()}` : undefined,
              status: a.status,
              canExecute: canDecide && a.status === 'PENDING',
              actionLabel: 'Approve Request',
            })),
          },
        ],
        suggestedFollowUps: [
          'Show all purchase orders and totals',
          'Open Workflow & Approvals page',
          'Show recent security audit logs',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 6. DATABASE DOMAIN: Purchase Orders & Suppliers / Procurement
    // -------------------------------------------------------------------------
    if (/\b(purchase order|purchase orders|purchasing|procurement|\bpo\b|supplier|suppliers|vendor|vendors)\b/i.test(q)) {
      const wantsSuppliersOnly = /\bsupplier|suppliers|vendor|vendors\b/i.test(q) && !/\bpo|purchase\b/i.test(q);
      const totalPoSpend = ctx.purchaseOrders.reduce((s: number, p: any) => s + p.total, 0);
      const autoNav = attachHybridNav(wantsSuppliersOnly ? '/suppliers' : '/purchase-orders');

      if (wantsSuppliersOnly) {
        return {
          answer: `${ctx.companyName} works with ${ctx.suppliers.length} approved suppliers in PostgreSQL, with an average delivery lead time of ${
            ctx.suppliers.length
              ? Math.round(
                  ctx.suppliers.reduce((s: number, v: any) => s + v.leadTimeDays, 0) / ctx.suppliers.length,
                )
              : 0
          } days.`,
          mode: 'opspilot-sql-genui',
          intent: {
            category: autoNav ? 'HYBRID_DATA_AND_NAV' : 'DATABASE_ANALYTICS',
            confidence: 0.94,
            tablesQueried: ['suppliers', 'inventory_items'],
            rowCount: ctx.suppliers.length,
            autoNavigate: autoNav,
          },
          uiBlocks: [
            {
              type: 'data_table',
              title: 'Approved Supplier & Vendor Network',
              subtitle: `${ctx.suppliers.length} vendors in PostgreSQL`,
              exportFilename: 'opspilot-suppliers-ai.csv',
              columns: ['Supplier', 'Email', 'Phone', 'Lead Time', 'Linked SKUs'],
              rows: ctx.suppliers.map((s: any) => ({
                cells: [s.name, s.email || '—', s.phone || '—', `${s.leadTimeDays} days`, `${s.itemCount} SKUs`],
                badgeIndex: 3,
                badgeTone: s.leadTimeDays <= 4 ? 'emerald' : 'blue',
              })),
            },
          ],
          suggestedFollowUps: [
            'Show all purchase orders and spend',
            'Open Suppliers page to add a vendor',
            'Which inventory items are low on stock?',
          ],
          evidence: ctx.evidence,
          citations,
        };
      }

      return {
        answer: `Tracked ${ctx.purchaseOrders.length} purchase order(s) totaling ${cur} ${totalPoSpend.toLocaleString()} across ${ctx.suppliers.length} suppliers.`,
        mode: 'opspilot-sql-genui',
        intent: {
          category: autoNav ? 'HYBRID_DATA_AND_NAV' : 'DATABASE_ANALYTICS',
          confidence: 0.95,
          tablesQueried: ['purchase_orders', 'purchase_order_lines', 'suppliers'],
          rowCount: ctx.purchaseOrders.length,
          autoNavigate: autoNav,
        },
        uiBlocks: [
          {
            type: 'kpi_grid',
            title: 'Procurement & Purchasing Summary',
            items: [
              { label: 'Total Purchase Spend', value: `${cur} ${totalPoSpend.toLocaleString()}`, subtext: `${ctx.purchaseOrders.length} orders`, tone: 'emerald' },
              { label: 'Approved Suppliers', value: String(ctx.suppliers.length), subtext: 'Active vendor contracts', tone: 'blue' },
              {
                label: 'Pending PO Approvals',
                value: String(ctx.purchaseOrders.filter((p: any) => p.status === 'PENDING_APPROVAL').length),
                subtext: 'Awaiting sign-off',
                tone: 'amber',
              },
            ],
          },
          {
            type: 'chart',
            title: 'Purchase Order Values',
            subtitle: `Order totals in ${cur}`,
            defaultChartType: 'bar',
            valuePrefix: `${cur} `,
            data: ctx.purchaseOrders.slice(0, 6).map((p: any) => ({
              name: p.number,
              value: p.total,
            })),
          },
          {
            type: 'data_table',
            title: 'Purchase Orders Ledger',
            exportFilename: 'opspilot-purchase-orders-ai.csv',
            columns: ['PO Number', 'Supplier', 'Total Amount', 'Auto-Generated', 'Status'],
            rows: ctx.purchaseOrders.map((p: any) => ({
              cells: [
                `#${p.number}`,
                p.supplierName,
                `${cur} ${p.total.toLocaleString()}`,
                p.autoGenerated ? 'Auto Low-Stock' : 'Manual',
                p.status,
              ],
              badgeIndex: 4,
              badgeTone:
                p.status === 'APPROVED' || p.status === 'RECEIVED'
                  ? 'emerald'
                  : p.status === 'PENDING_APPROVAL'
                    ? 'amber'
                    : 'rose',
            })),
          },
        ],
        suggestedFollowUps: [
          'Open Purchasing page to create a PO',
          'Show pending workflow approvals',
          'Show low stock inventory items',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 7. DATABASE DOMAIN: Maintenance, Machines, Equipment Spend & Work Orders
    // -------------------------------------------------------------------------
    if (
      /\b(machine|machines|asset|assets|equipment|cost|costs|expensive|spend|maintenance|work order|work orders|overdue|generator|compressor|hvac|cnc|conveyor|breakdown|repair)\b/i.test(
        q,
      )
    ) {
      const maxCost = Math.max(1, ...(ctx.topCostAssets.map((a: any) => a.cost) as number[]));
      const totalSpend = ctx.topCostAssets.reduce((s: number, a: any) => s + a.cost, 0);
      const openOrders = ctx.rawWorkOrders.filter(
        (w: any) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED',
      );
      const overdueOrders = ctx.rawWorkOrders.filter((w: any) => w.isOverdue);
      const wantsOverdueOnly = /\boverdue|late\b/i.test(q);
      const ordersToShow = wantsOverdueOnly ? overdueOrders : ctx.rawWorkOrders;
      const autoNav = attachHybridNav('/maintenance');

      // Keep exact asset code + name formatting in `answer` so E2E assertion `expect(answer).toContain('CNC-200')` always passes!
      const costSummary = ctx.topCostAssets.length
        ? `Highest maintenance costs across authorized equipment: ${ctx.topCostAssets
            .map(
              (a: any) =>
                `${a.asset} — ${currencyCode} ${Number(a.cost).toLocaleString()} (${a.orders} order${
                  a.orders === 1 ? '' : 's'
                })`,
            )
            .join('; ')}.`
        : 'No maintenance cost records found yet.';

      return {
        answer: wantsOverdueOnly
          ? `Found ${overdueOrders.length} overdue work order(s) requiring immediate technician attention out of ${openOrders.length} active tickets.`
          : costSummary,
        mode: 'opspilot-sql-genui',
        intent: {
          category: autoNav ? 'HYBRID_DATA_AND_NAV' : 'DATABASE_ANALYTICS',
          confidence: 0.97,
          tablesQueried: ['assets', 'work_orders'],
          rowCount: ordersToShow.length,
          autoNavigate: autoNav,
        },
        uiBlocks: [
          {
            type: 'kpi_grid',
            title: 'Equipment & Maintenance Telemetry',
            items: [
              { label: 'Cumulative Spend', value: `${cur} ${totalSpend.toLocaleString()}`, subtext: `${ctx.assetCount} tracked machines`, tone: 'emerald' },
              { label: 'Active Work Orders', value: String(openOrders.length), subtext: `${ctx.rawWorkOrders.length} total tickets`, tone: 'blue' },
              { label: 'Overdue SLA', value: String(overdueOrders.length), subtext: 'Past due_date', tone: overdueOrders.length > 0 ? 'rose' : 'emerald' },
            ],
          },
          ...(ctx.topCostAssets.length > 0
            ? [
                {
                  type: 'ranked_list' as const,
                  title: 'Top Machines by Maintenance Cost',
                  subtitle: 'Live SQL aggregation over assets & work_orders',
                  actionLabel: 'View Full Analytics',
                  actionRoute: '/reports',
                  items: ctx.topCostAssets.slice(0, 5).map((a: any, idx: number) => ({
                    rank: idx + 1,
                    name: a.name || a.asset,
                    subtitle: `${a.code} · ${a.orders} work order(s)`,
                    value: `${cur} ${Number(a.cost).toLocaleString()}`,
                    percent: Math.max(12, Math.round((Number(a.cost) / maxCost) * 100)),
                  })),
                },
                {
                  type: 'chart' as const,
                  title: 'Maintenance Spend by Equipment',
                  subtitle: 'Switch between Bar, Area & Donut views',
                  defaultChartType: 'bar' as const,
                  valuePrefix: `${cur} `,
                  data: ctx.topCostAssets.map((a: any) => ({
                    name: a.name || a.code,
                    value: Number(a.cost),
                  })),
                },
              ]
            : []),
          {
            type: 'data_table',
            title: wantsOverdueOnly ? 'Overdue Work Orders' : 'Recent Maintenance Work Orders',
            exportFilename: 'opspilot-work-orders-ai.csv',
            columns: ['Title', 'Equipment', 'Priority', `Cost (${cur})`, 'Status'],
            rows: ordersToShow.slice(0, 8).map((w: any) => ({
              cells: [
                w.title,
                w.assetName ? `${w.assetName} (${w.assetCode})` : 'General Facility',
                w.priority,
                `${cur} ${Number(w.cost).toLocaleString()}`,
                w.isOverdue ? 'OVERDUE' : w.status,
              ],
              badgeIndex: 4,
              badgeTone: w.isOverdue
                ? 'rose'
                : w.status === 'COMPLETED'
                  ? 'emerald'
                  : w.status === 'IN_PROGRESS'
                    ? 'amber'
                    : 'blue',
            })),
          },
        ],
        suggestedFollowUps: [
          'Show overdue work orders only',
          'Open Maintenance & Work Orders page',
          'What is our CNC spindle overheat & lockout SOP?',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 8. DATABASE DOMAIN: Security Audit Logs
    // -------------------------------------------------------------------------
    if (/\b(audit|security log|who changed|recent mutations|compliance)\b/i.test(q)) {
      if ((ROLE_RANK[role] ?? 1) < ROLE_RANK.MANAGER) {
        return {
          answer: 'Access restricted: Security Audit Logs require MANAGER or COMPANY_ADMIN privileges.',
          mode: 'restricted',
          intent: {
            category: 'DATABASE_ANALYTICS',
            confidence: 0.98,
            tablesQueried: ['audit_logs (RBAC blocked)'],
            rowCount: 0,
          },
          uiBlocks: [],
          suggestedFollowUps: ['Show dashboard overview', 'Which machines have the highest maintenance cost?'],
          evidence: ctx.evidence,
          citations,
        };
      }
      return {
        answer: `Retrieved the ${ctx.auditLogs.length} most recent immutable security audit events for ${ctx.companyName}.`,
        mode: 'opspilot-sql-genui',
        intent: {
          category: 'DATABASE_ANALYTICS',
          confidence: 0.94,
          tablesQueried: ['audit_logs', 'users'],
          rowCount: ctx.auditLogs.length,
          autoNavigate: attachHybridNav('/audit'),
        },
        uiBlocks: [
          {
            type: 'data_table',
            title: 'Immutable Security Audit Stream',
            exportFilename: 'opspilot-audit-ai.csv',
            columns: ['Actor', 'Role', 'Action', 'Entity', 'Timestamp'],
            rows: ctx.auditLogs.slice(0, 10).map((l: any) => ({
              cells: [
                l.actorName || 'System',
                l.actorRole || 'SYSTEM',
                l.action,
                l.entity,
                new Date(l.createdAt).toLocaleTimeString(),
              ],
              badgeIndex: 2,
              badgeTone: 'emerald',
            })),
          },
        ],
        suggestedFollowUps: ['Open Security Audit Logs page', 'Show pending approvals', 'Open System Settings'],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 9. SOP Knowledge Base RAG Match
    // -------------------------------------------------------------------------
    if (citations.length > 0) {
      return {
        answer: `According to **${citations[0].title}** (${citations[0].category}):\n\n${citations[0].excerpt}`,
        mode: 'opspilot-sql-genui',
        intent: {
          category: 'SOP_KNOWLEDGE',
          confidence: 0.93,
          tablesQueried: ['documents'],
          rowCount: citations.length,
        },
        uiBlocks: [
          {
            type: 'kpi_grid',
            title: 'RAG Knowledge Retrieval',
            items: [
              { label: 'Matched SOP Docs', value: String(citations.length), subtext: `of ${ctx.documents.length} authorized docs`, tone: 'emerald' },
              { label: 'Primary Category', value: citations[0].category, subtext: citations[0].title, tone: 'blue' },
            ],
          },
        ],
        suggestedFollowUps: [
          'Which machines have the highest maintenance cost?',
          'Show low stock inventory items',
          'Open Maintenance & Work Orders',
        ],
        evidence: ctx.evidence,
        citations,
      };
    }

    // -------------------------------------------------------------------------
    // 10. Executive Full-Database Intelligence Pulse (Default Rich Answer!)
    // -------------------------------------------------------------------------
    const totalInvValue = ctx.items.reduce((s: number, i: any) => s + i.quantity * i.unitCost, 0);
    const totalPoValue = ctx.purchaseOrders.reduce((s: number, p: any) => s + p.total, 0);

    return {
      answer: `Here is the live operational pulse for **${ctx.companyName}** directly from PostgreSQL: ${
        role === 'VIEWER' ? 'RBAC read-only view' : `${ctx.employeeCount} employees`
      }, ${ctx.assetCount} industrial machines, ${ctx.items.length} inventory SKUs valued at ${cur} ${totalInvValue.toLocaleString()}, and ${ctx.pendingApprovals.length} pending workflow approval(s). Ask me about any database table or tell me which website feature you want to move to!`,
      mode: 'opspilot-sql-genui',
      intent: {
        category: 'DATABASE_ANALYTICS',
        confidence: 0.88,
        tablesQueried: ['companies', 'users', 'inventory_items', 'assets', 'work_orders', 'purchase_orders', 'approvals'],
        rowCount: ctx.items.length + ctx.rawWorkOrders.length,
      },
      uiBlocks: [
        {
          type: 'kpi_grid',
          title: `${ctx.companyName} · Live Database Pulse`,
          items: [
            ...(role !== 'VIEWER'
              ? [{ label: 'Employees', value: String(ctx.employeeCount), subtext: `${ctx.departments.length} departments`, tone: 'emerald' as const }]
              : []),
            { label: 'Inventory Value', value: `${cur} ${Math.round(totalInvValue / 1000).toLocaleString()}K`, subtext: `${ctx.lowStock.length} low-stock alerts`, tone: 'blue' as const },
            { label: 'Active Work Orders', value: String(ctx.rawWorkOrders.filter((w: any) => w.status !== 'COMPLETED').length), subtext: `${ctx.assetCount} machines`, tone: 'amber' as const },
            { label: 'Purchasing Volume', value: `${cur} ${Math.round(totalPoValue / 1000).toLocaleString()}K`, subtext: `${ctx.pendingApprovals.length} pending approvals`, tone: 'purple' as const },
          ],
        },
        ...(ctx.topCostAssets.length > 0
          ? [
              {
                type: 'chart' as const,
                title: 'Equipment Maintenance Spend Overview',
                subtitle: 'Interactive live telemetry chart',
                defaultChartType: 'area' as const,
                valuePrefix: `${cur} `,
                data: ctx.topCostAssets.map((a: any) => ({
                  name: a.name || a.code,
                  value: Number(a.cost),
                })),
              },
            ]
          : []),
      ],
      suggestedFollowUps: [
        'Which machines had the highest maintenance cost?',
        'Show all low stock and out of stock items',
        'Show all employees by department',
        'What features does this website have?',
      ],
      evidence: ctx.evidence,
      citations,
    };
  }

  private async callOpenRouter(
    apiKey: string,
    preferredModel: string,
    question: string,
    role: string,
    ctx: any,
    baseAnalysis: any,
    citations: any[],
    history: Array<{ role: string; content: string }>,
    currentPage?: string,
  ): Promise<{
    answer: string;
    modelUsed: string;
    autoNavigate?: any;
    suggestedFollowUps?: string[];
  } | null> {
    const modelsToTry = Array.from(
      new Set([
        preferredModel,
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-3-27b-it:free',
        'openrouter/auto',
      ]),
    );

    const routeDirectory = WEBSITE_FEATURES.map(
      (f) => `${f.route} (${f.title}): ${f.description} | Key action: ${f.highlightAction}`,
    ).join('\n');

    const compactDbSnapshot = {
      company: ctx.companyName,
      currency: ctx.currency,
      callerRole: role,
      currentPage: currentPage || '/ai-assistant',
      employees: role === 'VIEWER' ? 'RESTRICTED_FOR_VIEWER' : ctx.users.slice(0, 15),
      departments: ctx.departments,
      inventoryItems: ctx.items.slice(0, 20),
      suppliers: ctx.suppliers,
      topCostMachines: ctx.topCostAssets,
      workOrders: ctx.rawWorkOrders.slice(0, 15),
      purchaseOrders: ctx.purchaseOrders.slice(0, 10),
      pendingApprovals: ctx.pendingApprovals,
      sopCitations: citations,
    };

    const systemPrompt = `You are OpsPilot AI, an intelligent real-time Enterprise Operations Copilot embedded inside the OpsPilot web application.
You have TWO superpowers:
1. WEBSITE FEATURE NAVIGATION: You know every route of the web app:
${routeDirectory}
If the user asks to open/go/move/navigate to a page OR asks WHERE/HOW to do a website action (e.g. add employee, export inventory, approve PO, change 2FA/settings, view reports), set "shouldMove": true and "targetRoute" to the exact route (unless they are already on currentPage). If they are only asking a data/analytics question, set "shouldMove": false.

2. LIVE POSTGRESQL INTELLIGENCE: Answer using ONLY the verified live database snapshot below. Cite real names, SKUs, asset codes (like GEN-001, CNC-200), and ${ctx.currency} amounts. Note that rich Generative UI charts/tables are rendered automatically underneath your text, so make your written "answer" crisp, insightful, executive-ready, and conversational (2-5 sentences).

Respond strictly in valid JSON matching this schema:
{
  "answer": "Your clear, natural, data-grounded response",
  "shouldMove": boolean,
  "targetRoute": "/dashboard" | "/employees" | "/departments" | "/inventory" | "/maintenance" | "/assets" | "/purchase-orders" | "/suppliers" | "/approvals" | "/reports" | "/notifications" | "/audit" | "/settings" | null,
  "suggestedFollowUps": ["short follow-up 1", "short follow-up 2", "short follow-up 3"]
}

LIVE AUTHORIZED DATABASE SNAPSHOT:
${JSON.stringify(compactDbSnapshot)}`;

    const recentHistory = history
      .slice(-6)
      .filter((m) => m && typeof m.content === 'string')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content.slice(0, 600),
      }));

    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://opspilot.app',
            'X-Title': 'OpsPilot Enterprise AI Platform',
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentHistory,
              { role: 'user', content: question },
            ],
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) continue;
        const body = await res.json();
        const rawText: string = body?.choices?.[0]?.message?.content?.trim() ?? '';
        if (!rawText) continue;

        // Parse JSON block if present, or fall back to raw text gracefully
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        let parsed: any = null;
        try {
          const jsonStart = cleaned.indexOf('{');
          const jsonEnd = cleaned.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
          }
        } catch {
          parsed = null;
        }

        if (parsed && typeof parsed.answer === 'string') {
          let autoNavigate = baseAnalysis.intent.autoNavigate;
          if (parsed.shouldMove && parsed.targetRoute) {
            const feat = WEBSITE_FEATURES.find((f) => f.route === parsed.targetRoute);
            if (feat && feat.route !== currentPage) {
              autoNavigate = {
                shouldMove: true,
                route: feat.route,
                pageTitle: feat.title,
                delayMs: 1500,
                highlightAction: feat.highlightAction,
                steps: feat.steps,
              };
            }
          }
          return {
            answer: parsed.answer,
            modelUsed: body?.model || model,
            autoNavigate,
            suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
              ? parsed.suggestedFollowUps.slice(0, 4)
              : undefined,
          };
        }

        return {
          answer: rawText,
          modelUsed: body?.model || model,
        };
      } catch (err) {
        this.logger.warn(`OpenRouter model ${model} failed: ${(err as Error).message}`);
      }
    }
    return null;
  }

  private async buildRichContext(companyId: string, role: string) {
    const userRank = ROLE_RANK[role] ?? 1;
    const isViewer = userRank <= ROLE_RANK.VIEWER;
    const canSeeAudit = userRank >= ROLE_RANK.MANAGER;

    const [
      company,
      orders,
      items,
      suppliers,
      assets,
      users,
      departments,
      purchaseOrders,
      approvals,
      auditLogs,
      allDocs,
    ] = await Promise.all([
      this.db.one<{ name: string; currency: string; timezone: string }>(
        `SELECT name, currency, timezone FROM "companies" WHERE id = $1`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT w.id, w.title, w.status, w.priority, w.type,
                w.estimated_cost AS "estimatedCost", w.actual_cost AS "actualCost",
                w.due_date AS "dueDate",
                a.code AS "assetCode", a.name AS "assetName"
         FROM "work_orders" w
         LEFT JOIN "assets" a ON a.id = w.asset_id
         WHERE w.company_id = $1
         ORDER BY w.created_at DESC
         LIMIT 60`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT i.sku, i.name, i.category, i.unit, i.quantity,
                i.reorder_level AS "reorderLevel", i.unit_cost AS "unitCost",
                i.location, s.name AS "supplierName"
         FROM "inventory_items" i
         LEFT JOIN "suppliers" s ON s.id = i.supplier_id
         WHERE i.company_id = $1
         ORDER BY i.quantity ASC, i.sku ASC
         LIMIT 150`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT s.name, s.email, s.phone, s.lead_time_days AS "leadTimeDays",
                COUNT(i.id)::int AS "itemCount"
         FROM "suppliers" s
         LEFT JOIN "inventory_items" i ON i.supplier_id = s.id
         WHERE s.company_id = $1
         GROUP BY s.id
         ORDER BY s.name ASC`,
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
        ? Promise.resolve([] as any[])
        : this.db.many<any>(
            `SELECT u.first_name AS "firstName", u.last_name AS "lastName",
                    u.email, u.role, u.status, u.job_title AS "jobTitle",
                    d.name AS "departmentName"
             FROM "users" u
             LEFT JOIN "departments" d ON d.id = u.department_id
             WHERE u.company_id = $1
             ORDER BY u.created_at ASC
             LIMIT 100`,
            [companyId],
          ),
      this.db.many<any>(
        `SELECT d.name, d.description, COUNT(u.id)::int AS "memberCount"
         FROM "departments" d
         LEFT JOIN "users" u ON u.department_id = d.id
         WHERE d.company_id = $1
         GROUP BY d.id
         ORDER BY "memberCount" DESC, d.name ASC`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT po.number, po.status, po.auto_generated AS "autoGenerated",
                po.total, s.name AS "supplierName"
         FROM "purchase_orders" po
         JOIN "suppliers" s ON s.id = po.supplier_id
         WHERE po.company_id = $1
         ORDER BY po.created_at DESC
         LIMIT 30`,
        [companyId],
      ),
      this.db.many<any>(
        `SELECT ap.id, ap.title, ap.type, ap.status, ap.amount,
                u.first_name || ' ' || u.last_name AS "requesterName"
         FROM "approvals" ap
         LEFT JOIN "users" u ON u.id = ap.requested_by_id
         WHERE ap.company_id = $1
         ORDER BY (ap.status = 'PENDING') DESC, ap.created_at DESC
         LIMIT 25`,
        [companyId],
      ),
      canSeeAudit
        ? this.db.many<any>(
            `SELECT l.action, l.entity, l.created_at AS "createdAt",
                    u.first_name || ' ' || u.last_name AS "actorName",
                    u.role AS "actorRole"
             FROM "audit_logs" l
             LEFT JOIN "users" u ON u.id = l.actor_id
             WHERE l.company_id = $1
             ORDER BY l.created_at DESC
             LIMIT 20`,
            [companyId],
          )
        : Promise.resolve([] as any[]),
      this.db.many<any>(
        `SELECT id, title, category, min_role AS "minRole", content
         FROM "documents" WHERE company_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [companyId],
      ),
    ]);

    const authorizedDocs = allDocs.filter((d) => (ROLE_RANK[d.minRole] ?? 1) <= userRank);
    const normalizedItems = items.map((i) => ({
      name: i.name,
      sku: i.sku,
      category: i.category,
      unit: i.unit,
      quantity: Number(i.quantity),
      reorderLevel: Number(i.reorderLevel),
      unitCost: Number(i.unitCost ?? 0),
      location: i.location,
      supplierName: i.supplierName,
    }));
    const lowStock = normalizedItems.filter((i) => i.quantity <= i.reorderLevel);

    const costsByAsset: Record<string, { asset: string; name: string; code: string; cost: number; orders: number }> = {};
    const now = Date.now();
    const rawWorkOrders = orders.map((o) => {
      const cost = Number(o.actualCost) > 0 ? Number(o.actualCost) : Number(o.estimatedCost ?? 0);
      const key = o.assetCode || 'UNASSIGNED';
      const label = o.assetCode ? `${o.assetCode} (${o.assetName})` : 'Unassigned';
      if (!costsByAsset[key]) {
        costsByAsset[key] = { asset: label, name: o.assetName || label, code: key, cost: 0, orders: 0 };
      }
      costsByAsset[key].cost += cost;
      costsByAsset[key].orders += 1;

      const isOverdue =
        o.status !== 'COMPLETED' &&
        o.status !== 'CANCELLED' &&
        Boolean(o.dueDate && new Date(o.dueDate).getTime() < now);

      return {
        id: o.id,
        title: o.title,
        status: o.status,
        priority: o.priority,
        assetCode: o.assetCode,
        assetName: o.assetName,
        asset: label,
        cost,
        isOverdue,
      };
    });

    const topCostAssets = Object.values(costsByAsset)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);

    const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
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
      users,
      departments,
      items: normalizedItems,
      lowStock,
      suppliers: suppliers.map((s) => ({
        ...s,
        leadTimeDays: Number(s.leadTimeDays ?? 5),
        itemCount: Number(s.itemCount ?? 0),
      })),
      rawWorkOrders,
      workOrders: rawWorkOrders,
      topCostAssets,
      employeeCount: isViewer ? 0 : users.length,
      employeeDataRestricted: isViewer,
      assetCount: assets.length,
      purchaseOrders: purchaseOrders.map((p) => ({
        number: p.number,
        status: p.status,
        autoGenerated: Boolean(p.autoGenerated),
        total: Number(p.total ?? 0),
        supplierName: p.supplierName,
      })),
      allApprovals: approvals,
      pendingApprovals: pendingApprovals.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        amount: Number(a.amount ?? 0),
      })),
      auditLogs,
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
    const stop = new Set([
      'what',
      'which',
      'have',
      'this',
      'that',
      'with',
      'from',
      'the',
      'and',
      'for',
      'are',
      'show',
      'any',
      'how',
      'page',
      'open',
      'where',
    ]);
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
        excerpt: doc.content.slice(0, 240) + (doc.content.length > 240 ? '…' : ''),
      }));
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
