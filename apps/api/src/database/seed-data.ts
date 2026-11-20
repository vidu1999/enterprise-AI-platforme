import * as bcrypt from 'bcryptjs';
import { SqlExecutor } from './database.service';

export async function seedEnterpriseData(db: SqlExecutor): Promise<void> {
  const passwordHash = await bcrypt.hash('Demo1234!', 12);

  // ---------------------------------------------------------------------------
  // Tenant 1: OpsPilot (Pvt) Ltd — Colombo, Sri Lanka
  // ---------------------------------------------------------------------------
  const existing = await db.one<{ id: string }>(
    `SELECT id FROM "companies" WHERE slug = $1`,
    ['demo-company'],
  );
  if (existing) return;

  const company = (await db.one<{ id: string }>(
    `INSERT INTO "companies" (name, slug, email, phone, address, industry, currency, timezone)
     VALUES ($1, $2, $3, $4, $5, $6, 'LKR', 'Asia/Colombo')
     RETURNING id`,
    [
      'OpsPilot (Pvt) Ltd',
      'demo-company',
      'ops@opspilot.lk',
      '+94 11 264 8800',
      'No. 123, Main Street, Colombo, Sri Lanka',
      'Enterprise Operations & Industrial Engineering',
    ],
  ))!;

  const cid = company.id;

  // Departments matching reference Department Overview + Industrial Operations
  const deptSpecs = [
    ['IT', 'Enterprise infrastructure, cloud systems, and internal tooling'],
    ['Operations', 'Plant floor operations, logistics, and preventive reliability'],
    ['HR', 'Talent management, employee onboarding, and compliance'],
    ['Finance', 'Procurement budgeting, vendor payables, and cost auditing'],
    ['Maintenance', 'Electro-mechanical equipment servicing and emergency repairs'],
  ];
  const deptIds: Record<string, string> = {};
  for (const [name, description] of deptSpecs) {
    const d = (await db.one<{ id: string }>(
      `INSERT INTO "departments" (company_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
      [cid, name, description],
    ))!;
    deptIds[name] = d.id;
  }

  // Core Role Accounts + Sri Lankan Team Roster matching Reference UI
  const staffSpecs = [
    ['admin@demo.local', 'Vidura', 'Kavinda', 'COMPANY_ADMIN', 'IT', 'Administrator', '+94 77 210 4401'],
    ['nimesh@company.lk', 'Nimesh', 'Perera', 'EMPLOYEE', 'IT', 'Developer', '+94 77 312 1102'],
    ['tharushi@company.lk', 'Tharushi', 'Silva', 'MANAGER', 'HR', 'HR Manager', '+94 77 415 8890'],
    ['manager@demo.local', 'Kavindu', 'Fernando', 'MANAGER', 'Operations', 'Operations Manager', '+94 77 501 9923'],
    ['sashika@company.lk', 'Sashika', 'Wijesinghe', 'EMPLOYEE', 'Finance', 'Accountant', '+94 71 620 7731'],
    ['dilini@company.lk', 'Dilini', 'Rathnayaka', 'EMPLOYEE', 'HR', 'Executive', '+94 76 883 1204'],
    ['tech@demo.local', 'Dilshan', 'Silva', 'EMPLOYEE', 'Maintenance', 'Senior Technician', '+94 71 445 2210'],
    ['viewer@demo.local', 'Tharushi', 'Fernando', 'VIEWER', 'Finance', 'Compliance Auditor', '+94 76 890 1142'],
    ['ashan@company.lk', 'Ashan', 'Gunasekara', 'EMPLOYEE', 'Operations', 'Generator & Power Specialist', '+94 71 912 4500'],
    ['ruwan@company.lk', 'Ruwan', 'Bandara', 'MANAGER', 'Operations', 'Procurement Lead', '+94 77 411 6720'],
    ['kavindi@company.lk', 'Kavindi', 'Rajapaksha', 'EMPLOYEE', 'IT', 'Systems Engineer', '+94 76 332 9081'],
    ['malith@company.lk', 'Malith', 'Jayasuriya', 'EMPLOYEE', 'IT', 'DevOps Engineer', '+94 77 778 3310'],
  ];
  const userIds: Record<string, string> = {};
  for (const [email, first, last, role, dept, title, phone] of staffSpecs) {
    const u = (await db.one<{ id: string }>(
      `INSERT INTO "users" (company_id, email, password_hash, first_name, last_name, role, status, department_id, job_title, phone)
       VALUES ($1, $2, $3, $4, $5, $6::"Role", 'ACTIVE', $7, $8, $9)
       RETURNING id`,
      [cid, email, passwordHash, first, last, role, deptIds[dept], title, phone],
    ))!;
    userIds[email] = u.id;
  }

  // Suppliers
  const supplierSpecs = [
    ['Colombo Tech & Industrial Supplies', 'sales@colombotech.lk', '+94 11 243 7711', '128 Union Place, Colombo 02', 3],
    ['Ceylon Power & Hydraulics Ltd', 'orders@ceylonpower.lk', '+94 11 258 9900', '42 Peliyagoda Industrial Park', 2],
    ['Kelani Electrical & Automation', 'industrial@kelanielec.lk', '+94 11 291 4400', 'Biyagama Export Processing Zone', 5],
    ['Lanka Workspace & Office Solutions', 'b2b@lankaworkspace.lk', '+94 11 250 3310', '64 Duplication Rd, Colombo 04', 4],
  ];
  const supplierIds: Record<string, string> = {};
  for (const [name, email, phone, address, lead] of supplierSpecs) {
    const s = (await db.one<{ id: string }>(
      `INSERT INTO "suppliers" (company_id, name, email, phone, address, lead_time_days)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [cid, name, email, phone, address, lead],
    ))!;
    supplierIds[name] = s.id;
  }

  // Assets / Machines matching AI Assistant & Maintenance tables
  const assetSpecs = [
    ['GEN-001', 'Generator #1', 'Power Generation', 'Utility Yard North', 'OPERATIONAL', 90, 14],
    ['CMP-002', 'Compressor #2', 'Compressed Air', 'Plant A — Utility Bay', 'OPERATIONAL', 60, 7],
    ['HVAC-001', 'HVAC Unit #1', 'Climate & Cooling', 'Main HQ — Roof Deck', 'OPERATIONAL', 60, 21],
    ['AC-003', 'AC Unit #3', 'Climate & Cooling', 'Server Room B', 'MAINTENANCE', 45, 3],
    ['CNV-A', 'Conveyor A', 'Material Handling', 'Assembly Line 1', 'OPERATIONAL', 30, 5],
    ['CNC-104', 'Mazak 5-Axis CNC', 'CNC Machining', 'Plant A — Bay 2', 'OPERATIONAL', 60, 18],
  ];
  const assetIds: Record<string, string> = {};
  for (const [code, name, category, location, status, intervalDays, daysUntilNext] of assetSpecs) {
    const nextMaint = new Date(Date.now() + Number(daysUntilNext) * 86400_000);
    const lastMaint = new Date(Date.now() - (Number(intervalDays) - Number(daysUntilNext)) * 86400_000);
    const a = (await db.one<{ id: string }>(
      `INSERT INTO "assets" (company_id, code, name, category, location, status, maintenance_interval_days, last_maintained_at, next_maintenance_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [cid, code, name, category, location, status, intervalDays, lastMaint, nextMaint],
    ))!;
    assetIds[code as string] = a.id;
  }

  // Inventory Items (In Stock, Low Stock, and Out of Stock!)
  const itemSpecs: Array<[string, string, string, string, number, number, number, string, string]> = [
    ['LAP-5520', 'Laptop Dell Inspiron', 'Electronics', 'pcs', 25, 8, 92000, 'Colombo Tech & Industrial Supplies', 'IT Vault A1'],
    ['MSE-WL01', 'Wireless Mouse', 'Electronics', 'pcs', 8, 12, 4500, 'Colombo Tech & Industrial Supplies', 'IT Store B2'],
    ['CHR-ERG1', 'Office Chair', 'Furniture', 'pcs', 0, 5, 48000, 'Lanka Workspace & Office Solutions', 'Warehouse C1'],
    ['CBL-USBC', 'USB-C Cable', 'Accessories', 'pcs', 150, 25, 1850, 'Colombo Tech & Industrial Supplies', 'IT Store B1'],
    ['KEY-MECH', 'Mechanical Keyboard', 'Electronics', 'pcs', 42, 10, 14500, 'Colombo Tech & Industrial Supplies', 'IT Store B3'],
    ['BRG-6205', 'SKF Ball Bearing 6205', 'Spare Parts', 'pcs', 4, 10, 4850, 'Ceylon Power & Hydraulics Ltd', 'MRO Aisle A1'],
    ['IGBT-75A', 'Infineon 75A Servo Module', 'Electronics', 'pcs', 2, 5, 86000, 'Kelani Electrical & Automation', 'ESD Vault 2'],
    ['OIL-15W40', 'Diesel Generator Oil 15W-40', 'Lubricants', 'drum', 18, 6, 29500, 'Ceylon Power & Hydraulics Ltd', 'Lube Bay'],
  ];
  const itemIds: Record<string, string> = {};
  for (const [sku, name, cat, unit, qty, reorder, cost, sup, loc] of itemSpecs) {
    const it = (await db.one<{ id: string }>(
      `INSERT INTO "inventory_items" (company_id, sku, name, category, unit, quantity, reorder_level, unit_cost, supplier_id, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [cid, sku, name, cat, unit, qty, reorder, cost, supplierIds[sup], loc],
    ))!;
    itemIds[sku] = it.id;

    if (qty > 0) {
      await db.query(
        `INSERT INTO "inventory_transactions" (company_id, item_id, actor_id, type, quantity, note)
         VALUES ($1, $2, $3, 'IN', $4, 'Initial stock balance verified')`,
        [cid, it.id, userIds['manager@demo.local'], qty],
      );
    }
  }

  // Work Orders matching Reference Maintenance Screen & AI Top 3 Machines:
  // 1. Generator #1 – Rs. 125,000
  // 2. Compressor #2 – Rs. 98,000
  // 3. HVAC Unit #1 – Rs. 87,000
  const woSpecs: Array<[string, string, string, string, string, string, string, number, number, number]> = [
    [
      'Generator Service',
      '500-hour full diesel generator service, injector calibration, andAVR load test on Generator #1.',
      'IN_PROGRESS',
      'HIGH',
      'PREVENTIVE',
      'GEN-001',
      'tech@demo.local',
      125000,
      125000,
      2,
    ],
    [
      'AC Repair',
      'Replace evaporator fan capacitor and recharge R410A refrigerant on AC Unit #3.',
      'OPEN',
      'MEDIUM',
      'CORRECTIVE',
      'AC-003',
      'ashan@company.lk',
      42000,
      0,
      -2, // Overdue!
    ],
    [
      'Conveyor Fix',
      'Drive belt re-tensioning and proximity sensor alignment on Conveyor A.',
      'IN_PROGRESS',
      'HIGH',
      'CORRECTIVE',
      'CNV-A',
      'tech@demo.local',
      64000,
      58000,
      1,
    ],
    [
      'Compressor Valve & Separator Overhaul',
      'Replace air/oil separator kit and intake unloader valve on Compressor #2.',
      'COMPLETED',
      'HIGH',
      'PREVENTIVE',
      'CMP-002',
      'tech@demo.local',
      95000,
      98000,
      -5,
    ],
    [
      'Chiller Condenser Descaling & Calibration',
      'Quarterly chiller heat-exchanger cleaning and airflow balancing on HVAC Unit #1.',
      'COMPLETED',
      'MEDIUM',
      'PREVENTIVE',
      'HVAC-001',
      'ashan@company.lk',
      85000,
      87000,
      -9,
    ],
    [
      '5-Axis Spindle Vibration Inspection',
      'Piezo sensor verification and pull-stud clamping force test on Mazak 5-Axis CNC.',
      'OPEN',
      'CRITICAL',
      'INSPECTION',
      'CNC-104',
      'tech@demo.local',
      76000,
      0,
      -1, // Overdue!
    ],
  ];

  for (const [title, desc, status, priority, type, assetCode, assigneeEmail, est, act, dueOffsetDays] of woSpecs) {
    const dueDate = new Date(Date.now() + dueOffsetDays * 86400_000);
    const completedAt = status === 'COMPLETED' ? new Date(Date.now() + (dueOffsetDays - 1) * 86400_000) : null;
    await db.query(
      `INSERT INTO "work_orders"
       (company_id, title, description, status, priority, type, asset_id, assignee_id, creator_id, estimated_cost, actual_cost, due_date, completed_at)
       VALUES ($1, $2, $3, $4::"WorkOrderStatus", $5::"Priority", $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        cid,
        title,
        desc,
        status,
        priority,
        type,
        assetIds[assetCode],
        userIds[assigneeEmail],
        userIds['manager@demo.local'],
        est,
        act,
        dueDate,
        completedAt,
      ],
    );
  }

  // Purchase Orders & Approvals (~Rs. 2.4M monthly procurement volume)
  const po1Total = 15 * 48000 + 20 * 4500; // Rs. 810,000
  const po1 = (await db.one<{ id: string }>(
    `INSERT INTO "purchase_orders" (company_id, number, supplier_id, status, auto_generated, notes, total)
     VALUES ($1, 'PO-105', $2, 'PENDING', TRUE, 'Automated restock for out-of-stock Office Chairs & Wireless Mice', $3)
     RETURNING id`,
    [cid, supplierIds['Lanka Workspace & Office Solutions'], po1Total],
  ))!;
  await db.query(
    `INSERT INTO "purchase_order_lines" (order_id, item_id, quantity, unit_cost)
     VALUES ($1, $2, 15, 48000), ($1, $3, 20, 4500)`,
    [po1.id, itemIds['CHR-ERG1'], itemIds['MSE-WL01']],
  );
  await db.query(
    `INSERT INTO "approvals" (company_id, type, ref_id, title, requested_by_id, amount, status)
     VALUES ($1, 'PURCHASE_ORDER', $2, $3, $4, $5, 'PENDING')`,
    [
      cid,
      po1.id,
      `Purchase Order #PO-105 — Lanka Workspace & Office Solutions (Rs. ${po1Total.toLocaleString()})`,
      userIds['ruwan@company.lk'],
      po1Total,
    ],
  );

  const po2Total = 15 * 92000 + 44 * 4850; // Rs. 1,593,400 (Total Monthly POs = Rs. 2,403,400 ≈ Rs. 2.4M!)
  const po2 = (await db.one<{ id: string }>(
    `INSERT INTO "purchase_orders" (company_id, number, supplier_id, status, auto_generated, notes, total)
     VALUES ($1, 'PO-104', $2, 'APPROVED', FALSE, 'Q4 Engineering Laptops & SKF Bearings replenishment', $3)
     RETURNING id`,
    [cid, supplierIds['Colombo Tech & Industrial Supplies'], po2Total],
  ))!;
  await db.query(
    `INSERT INTO "purchase_order_lines" (order_id, item_id, quantity, unit_cost)
     VALUES ($1, $2, 15, 92000), ($1, $3, 44, 4850)`,
    [po2.id, itemIds['LAP-5520'], itemIds['BRG-6205']],
  );
  await db.query(
    `INSERT INTO "approvals" (company_id, type, ref_id, title, requested_by_id, amount, status, approver_id, decided_at, comment)
     VALUES ($1, 'PURCHASE_ORDER', $2, $3, $4, $5, 'APPROVED', $6, NOW() - INTERVAL '1 hour', 'Approved for IT & Plant Operations')`,
    [
      cid,
      po2.id,
      `Purchase Order #PO-104 — Colombo Tech & Industrial Supplies (Rs. ${po2Total.toLocaleString()})`,
      userIds['manager@demo.local'],
      po2Total,
      userIds['admin@demo.local'],
    ],
  );

  // Company SOP / Knowledge Documents for RAG Citations
  const docs: Array<[string, string, string, string]> = [
    [
      'SOP-MNT-001: Standby Diesel Generator #1 Preventive Maintenance Policy',
      'SOP',
      'VIEWER',
      'Generator #1 (GEN-001) must undergo full inspection every 500 running hours or 90 calendar days. Replace 15W-40 engine oil, inspect AVR voltage stability, and run an 80% rated kW load-bank test. Bearing vibration exceeding 4.5 mm/s RMS triggers immediate overhaul.',
    ],
    [
      'SOP-CNC-004: 5-Axis CNC Spindle Vibration & Servo Escalation Standard',
      'SOP',
      'VIEWER',
      'Mazak 5-axis machining centers (CNC-104) require continuous piezo vibration monitoring. Alert threshold is 3.5 mm/s RMS; mandatory spindle stop threshold is 5.5 mm/s RMS. Maintain at least 5 units of Infineon 75A IGBT modules (IGBT-75A) in ESD Vault 2.',
    ],
    [
      'POL-INV-002: Automated Inventory Reorder & Approval Matrix',
      'POLICY',
      'VIEWER',
      'Whenever stock drops to or below its reorder level, OpsPilot raises a LOW_STOCK alert, generates an automated replenishment Purchase Order (PO-AUTO-*), and routes an Approval request to Operations Managers and Administrators.',
    ],
    [
      'SOP-SAF-007: Lockout / Tagout (LOTO) & Electrical Safety Standard',
      'SAFETY',
      'VIEWER',
      'Before servicing Conveyor A, AC Unit #3, or HV switchgear, technicians must isolate the main breaker, apply personal padlocks, verify zero voltage, and record LOTO sign-off on the work order.',
    ],
  ];
  for (const [title, category, minRole, content] of docs) {
    await db.query(
      `INSERT INTO "documents" (company_id, title, category, min_role, content)
       VALUES ($1, $2, $3, $4::"Role", $5)`,
      [cid, title, category, minRole, content],
    );
  }

  // Notifications
  const notifSpecs: Array<[string, string, string, string]> = [
    [
      'admin@demo.local',
      'APPROVAL_REQUESTED',
      'Purchase order #PO-105 awaiting approval',
      'Auto-generated PO-105 (Rs. 810,000) for out-of-stock Office Chairs & Wireless Mice requires your approval.',
    ],
    [
      'admin@demo.local',
      'LOW_STOCK',
      '4 inventory items require restocking',
      'Office Chair (0 left — Out of Stock), Wireless Mouse (8/12), SKF Bearing (4/10), and IGBT Module (2/5).',
    ],
    [
      'admin@demo.local',
      'WORK_ORDER_UPDATE',
      'New work order #WO-1042 started',
      'Dilshan Silva started Generator Service on Generator #1 (Rs. 125,000).',
    ],
    [
      'manager@demo.local',
      'APPROVED',
      'Purchase order #PO-104 approved',
      'Vidura Kavinda approved Purchase Order #PO-104 (Rs. 1,593,400).',
    ],
  ];
  for (const [email, type, title, message] of notifSpecs) {
    await db.query(
      `INSERT INTO "notifications" (company_id, user_id, type, channel, email_status, title, message)
       VALUES ($1, $2, $3::"NotificationType", 'BOTH', 'SENT', $4, $5)`,
      [cid, userIds[email], type, title, message],
    );
  }

  // Audit Logs
  await db.query(
    `INSERT INTO "audit_logs" (company_id, actor_id, action, entity, entity_id, ip_address, details)
     VALUES
       ($1, $2, 'APPROVE', '/api/approvals/decide', $4, '10.20.1.14', '{"decision":"APPROVED","poNumber":"PO-104"}'::jsonb),
       ($1, $3, 'CREATE', '/api/work-orders', NULL, '10.20.1.28', '{"workOrder":"WO-1042","equipment":"Generator #1"}'::jsonb)`,
    [cid, userIds['admin@demo.local'], userIds['manager@demo.local'], po2.id],
  );

  // ---------------------------------------------------------------------------
  // Tenant 2: Colombo Port Logistics Group (Isolated Tenant for Multi-Tenancy Proof)
  // ---------------------------------------------------------------------------
  const tenant2 = (await db.one<{ id: string }>(
    `INSERT INTO "companies" (name, slug, email, phone, address, industry, currency, timezone)
     VALUES ('Colombo Port Logistics Group', 'colombo-logistics', 'admin@colombologistics.local', '+94 11 232 9000', 'Queen Elizabeth Quay, Colombo 01', 'Maritime & Container Logistics', 'LKR', 'Asia/Colombo')
     RETURNING id`,
  ))!;
  await db.query(
    `INSERT INTO "users" (company_id, email, password_hash, first_name, last_name, role, status, job_title)
     VALUES ($1, 'admin@colombologistics.local', $2, 'Suresh', 'De Mel', 'COMPANY_ADMIN', 'ACTIVE', 'Terminal Operations Director')`,
    [tenant2.id, passwordHash],
  );
  await db.query(
    `INSERT INTO "assets" (company_id, code, name, category, location, status)
     VALUES ($1, 'STS-CRANE-01', 'ZPMC Ship-to-Shore Gantry Crane #1', 'Port Cranes', 'Berth 4', 'OPERATIONAL')`,
    [tenant2.id],
  );
}
