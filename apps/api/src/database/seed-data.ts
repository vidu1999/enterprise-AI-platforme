import * as bcrypt from 'bcryptjs';
import { SqlExecutor } from './database.service';

export async function seedEnterpriseData(db: SqlExecutor): Promise<void> {
  const passwordHash = await bcrypt.hash('Demo1234!', 12);

  // ---------------------------------------------------------------------------
  // Tenant 1: Lanka Precision Engineering PLC (Primary Demo Company)
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
      'Lanka Precision Engineering PLC',
      'demo-company',
      'ops@lankaprecision.lk',
      '+94 11 264 8800',
      'Lot 14, Industrial Estate, Moratuwa, Western Province, Sri Lanka',
      'Precision Manufacturing & Industrial Engineering',
    ],
  ))!;

  const cid = company.id;

  // 5 Departments
  const deptSpecs = [
    ['Maintenance & Reliability', 'Preventive, predictive, and breakdown maintenance across Plant A & B'],
    ['Production & CNC Machining', '5-axis CNC milling, turning, stamping, and robotic assembly lines'],
    ['Warehouse & Supply Chain', 'MRO spare parts stores, vendor procurement, and stock control'],
    ['Quality Assurance', 'ISO 9001 metrology, calibration, and process compliance'],
    ['Facilities & Power Systems', 'HV switchgear, standby diesel generation, boilers, and HVAC'],
  ];
  const deptIds: Record<string, string> = {};
  for (const [name, description] of deptSpecs) {
    const d = (await db.one<{ id: string }>(
      `INSERT INTO "departments" (company_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
      [cid, name, description],
    ))!;
    deptIds[name] = d.id;
  }

  // Core Role Accounts + Engineering Staff
  const staffSpecs = [
    ['admin@demo.local', 'Kasun', 'Jayawardena', 'COMPANY_ADMIN', 'Maintenance & Reliability', 'VP of Operations', '+94 77 210 4401'],
    ['manager@demo.local', 'Nimal', 'Perera', 'MANAGER', 'Maintenance & Reliability', 'Maintenance & Reliability Manager', '+94 77 312 8890'],
    ['tech@demo.local', 'Dilshan', 'Silva', 'EMPLOYEE', 'Maintenance & Reliability', 'Senior Mechatronics Technician', '+94 71 445 2210'],
    ['viewer@demo.local', 'Tharushi', 'Fernando', 'VIEWER', 'Quality Assurance', 'Internal Operations Auditor', '+94 76 890 1142'],
    ['ruwan.bandara@demo.local', 'Ruwan', 'Bandara', 'MANAGER', 'Warehouse & Supply Chain', 'Procurement & Stores Lead', '+94 77 501 9923'],
    ['chamari.wickramasinghe@demo.local', 'Chamari', 'Wickramasinghe', 'MANAGER', 'Production & CNC Machining', 'CNC Production Superintendent', '+94 77 620 7731'],
    ['ashan.gunasekara@demo.local', 'Ashan', 'Gunasekara', 'EMPLOYEE', 'Facilities & Power Systems', 'Electrical & Generator Specialist', '+94 71 883 1204'],
    ['kavindi.rajapaksha@demo.local', 'Kavindi', 'Rajapaksha', 'EMPLOYEE', 'Quality Assurance', 'Calibration Engineer', '+94 76 332 9081'],
    ['malith.wijesinghe@demo.local', 'Malith', 'Wijesinghe', 'EMPLOYEE', 'Maintenance & Reliability', 'Hydraulics & Millwright Technician', '+94 71 912 4500'],
    ['oshadi.senanayake@demo.local', 'Oshadi', 'Senanayake', 'EMPLOYEE', 'Warehouse & Supply Chain', 'Inventory Control Analyst', '+94 77 411 6720'],
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

  // 4 Suppliers
  const supplierSpecs = [
    ['Colombo Industrial Bearings Ltd', 'sales@colombobearings.lk', '+94 11 243 7711', '128 Panchikawatta Rd, Colombo 10', 3],
    ['Ceylon Lubricants & Hydraulics', 'orders@ceylonlube.lk', '+94 11 258 9900', '42 Peliyagoda Industrial Park', 2],
    ['Kelani Electrical & Automation', 'industrial@kelanielec.lk', '+94 11 291 4400', 'Biyagama Export Processing Zone', 5],
    ['Asia CNC Spindle & Tooling Pte', 'export@asiacnctooling.sg', '+65 6742 8810', 'Jurong East Industrial Sector, Singapore', 10],
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

  // 8 Industrial Machines / Assets
  const assetSpecs = [
    ['CNC-104', 'Mazak Integrex 5-Axis CNC Center', 'CNC Machining', 'Plant A — Bay 2', 'MAINTENANCE', 60, 14],
    ['HYD-008', 'Schuler 200T Hydraulic Stamping Press', 'Heavy Forming', 'Plant A — Bay 4', 'OPERATIONAL', 45, 7],
    ['GEN-001', 'Cummins C250D5 250kVA Standby Generator', 'Power Generation', 'Utility Yard North', 'OPERATIONAL', 90, 28],
    ['CMP-012', 'Atlas Copco GA37 VSD Rotary Compressor', 'Compressed Air', 'Utility Room B', 'OPERATIONAL', 60, 5],
    ['RBT-002', 'ABB IRB-2600 Robotic Welding Cell', 'Robotics', 'Plant B — Line 1', 'OPERATIONAL', 90, 42],
    ['BLR-003', 'Cochran Industrial Steam Boiler 4T/h', 'Thermal Systems', 'Boiler House', 'OPERATIONAL', 30, 3],
    ['CHL-005', 'Carrier 180TR Process Water Chiller', 'HVAC & Cooling', 'Plant B — Roof Deck', 'OPERATIONAL', 90, 55],
    ['FLT-019', 'Toyota 8FBN30 3T Electric Forklift', 'Material Handling', 'Central MRO Warehouse', 'OPERATIONAL', 45, 19],
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

  // 10 Inventory Items (3 intentionally below reorder_level for live alerting & AI demo)
  const itemSpecs: Array<[string, string, string, string, number, number, number, string, string]> = [
    ['BRG-6205', 'SKF Deep Groove Ball Bearing 6205-2RSH', 'Bearings', 'pcs', 4, 12, 4850, 'Colombo Industrial Bearings Ltd', 'Aisle A-01'],
    ['HYD-SEAL-200', 'Viton High-Pressure Cylinder Seal Kit 200T', 'Hydraulics', 'kit', 2, 6, 38500, 'Ceylon Lubricants & Hydraulics', 'Aisle B-04'],
    ['IGBT-MOD-75A', 'Infineon 1200V 75A Servo Drive IGBT Module', 'Electronics', 'pcs', 1, 4, 92000, 'Kelani Electrical & Automation', 'ESD Vault 2'],
    ['SPN-BT40-SET', 'BT40 Precision Pull-Stud & Collet Set', 'CNC Tooling', 'set', 18, 8, 26000, 'Asia CNC Spindle & Tooling Pte', 'Tool Crib 1'],
    ['OIL-ISO68-20L', 'Mobil DTE 26 Hydraulic Oil ISO VG 68 (20L)', 'Lubricants', 'drum', 24, 10, 34200, 'Ceylon Lubricants & Hydraulics', 'Lube Store'],
    ['OIL-15W40-20L', 'Heavy-Duty Diesel Engine Oil 15W-40 (20L)', 'Lubricants', 'drum', 16, 6, 29500, 'Ceylon Lubricants & Hydraulics', 'Lube Store'],
    ['FLT-AIR-GA37', 'Atlas Copco GA37 Intake & Oil Separator Kit', 'Filtration', 'kit', 7, 5, 46800, 'Colombo Industrial Bearings Ltd', 'Aisle C-02'],
    ['CNT-3P-80A', 'Schneider TeSys 3-Pole 80A Contactor', 'Electrical', 'pcs', 14, 6, 19400, 'Kelani Electrical & Automation', 'Aisle D-01'],
    ['SNS-VIB-420', 'Industrial 4-20mA Piezo Vibration Sensor', 'Instrumentation', 'pcs', 9, 4, 41000, 'Kelani Electrical & Automation', 'ESD Vault 1'],
    ['BLT-HTD-8M', 'Gates Poly Chain GT Carbon Timing Belt 8M', 'Power Transmission', 'pcs', 15, 8, 15800, 'Colombo Industrial Bearings Ltd', 'Aisle A-05'],
  ];
  const itemIds: Record<string, string> = {};
  for (const [sku, name, cat, unit, qty, reorder, cost, sup, loc] of itemSpecs) {
    const it = (await db.one<{ id: string }>(
      `INSERT INTO "inventory_items" (company_id, sku, name, category, unit, quantity, reorder_level, unit_cost, supplier_id, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [cid, sku, name, cat, unit, qty, reorder, cost, supplierIds[sup], loc],
    ))!;
    itemIds[sku] = it.id;

    await db.query(
      `INSERT INTO "inventory_transactions" (company_id, item_id, actor_id, type, quantity, note)
       VALUES ($1, $2, $3, 'IN', $4, 'Initial MRO stock verification')`,
      [cid, it.id, userIds['ruwan.bandara@demo.local'], qty],
    );
  }

  // 8 Work Orders with realistic costs across machines
  const woSpecs: Array<[string, string, string, string, string, string, string, number, number, number]> = [
    [
      'CNC-104 high-speed spindle bearing & servo drive overhaul',
      'Spindle vibration reached 6.1 mm/s RMS during titanium roughing. Replace ceramic hybrid bearings and inspect IGBT servo stage.',
      'IN_PROGRESS',
      'CRITICAL',
      'CORRECTIVE',
      'CNC-104',
      'tech@demo.local',
      385000,
      412000,
      2,
    ],
    [
      'HYD-008 main ram cylinder seal replacement & pressure test',
      'Minor weeping detected on 200T main cylinder rod seal; replace Viton seal kit and hydro-test to 280 bar.',
      'COMPLETED',
      'HIGH',
      'CORRECTIVE',
      'HYD-008',
      'malith.wijesinghe@demo.local',
      195000,
      218500,
      -4,
    ],
    [
      'GEN-001 500-hour preventive service & load-bank test',
      'Replace lube oil, fuel/water separators, inspect alternator AVR, and run 1-hour 80% kW step load test.',
      'COMPLETED',
      'HIGH',
      'PREVENTIVE',
      'GEN-001',
      'ashan.gunasekara@demo.local',
      142000,
      136000,
      -8,
    ],
    [
      'CMP-012 oil separator element change & VSD thermal cleaning',
      'Differential pressure across separator reached 0.75 bar; scheduled preventive element replacement.',
      'ASSIGNED',
      'MEDIUM',
      'PREVENTIVE',
      'CMP-012',
      'tech@demo.local',
      92000,
      0,
      4,
    ],
    [
      'BLR-003 safety relief valve statutory inspection & blowdown calibration',
      'Monthly statutory boiler safety check and TDS conductivity sensor verification.',
      'OPEN',
      'HIGH',
      'INSPECTION',
      'BLR-003',
      'ashan.gunasekara@demo.local',
      68000,
      0,
      3,
    ],
    [
      'RBT-002 Axis-4 harmonic reducer grease sample & TCP calibration',
      'Routine ferrography grease sampling and weld torch TCP laser verification.',
      'COMPLETED',
      'MEDIUM',
      'PREVENTIVE',
      'RBT-002',
      'tech@demo.local',
      84000,
      79500,
      -12,
    ],
    [
      'CHL-005 condenser tube descaling & refrigerant superheat check',
      'Approach temperature rose by 2.4°C; schedule chemical descaling during weekend window.',
      'ON_HOLD',
      'MEDIUM',
      'PREVENTIVE',
      'CHL-005',
      'malith.wijesinghe@demo.local',
      115000,
      0,
      9,
    ],
    [
      'FLT-019 mast chain tensioning & traction battery cell balance',
      'Quarterly forklift safety check for MRO warehouse fleet.',
      'OPEN',
      'LOW',
      'INSPECTION',
      'FLT-019',
      'malith.wijesinghe@demo.local',
      32000,
      0,
      10,
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

  // Purchase Orders + Pending Approvals
  const po1Total = 20 * 4850 + 4 * 92000; // 465,000 LKR
  const po1 = (await db.one<{ id: string }>(
    `INSERT INTO "purchase_orders" (company_id, number, supplier_id, status, auto_generated, notes, total)
     VALUES ($1, 'PO-2026-0101', $2, 'PENDING', TRUE, 'Automated low-stock replenishment for critical CNC & bearing spares', $3)
     RETURNING id`,
    [cid, supplierIds['Colombo Industrial Bearings Ltd'], po1Total],
  ))!;
  await db.query(
    `INSERT INTO "purchase_order_lines" (order_id, item_id, quantity, unit_cost) VALUES ($1, $2, 20, 4850), ($1, $3, 3, 92000)`,
    [po1.id, itemIds['BRG-6205'], itemIds['IGBT-MOD-75A']],
  );
  await db.query(
    `INSERT INTO "approvals" (company_id, type, ref_id, title, requested_by_id, amount, status)
     VALUES ($1, 'PURCHASE_ORDER', $2, $3, $4, $5, 'PENDING')`,
    [
      cid,
      po1.id,
      `Purchase Order PO-2026-0101 — Colombo Industrial Bearings Ltd (LKR ${po1Total.toLocaleString()})`,
      userIds['ruwan.bandara@demo.local'],
      po1Total,
    ],
  );

  const po2Total = 8 * 38500; // 308,000 LKR
  const po2 = (await db.one<{ id: string }>(
    `INSERT INTO "purchase_orders" (company_id, number, supplier_id, status, auto_generated, notes, total)
     VALUES ($1, 'PO-2026-0102', $2, 'APPROVED', FALSE, 'Hydraulic press seal kit emergency stock replenishment', $3)
     RETURNING id`,
    [cid, supplierIds['Ceylon Lubricants & Hydraulics'], po2Total],
  ))!;
  await db.query(
    `INSERT INTO "purchase_order_lines" (order_id, item_id, quantity, unit_cost) VALUES ($1, $2, 8, 38500)`,
    [po2.id, itemIds['HYD-SEAL-200']],
  );
  await db.query(
    `INSERT INTO "approvals" (company_id, type, ref_id, title, requested_by_id, amount, status, approver_id, decided_at, comment)
     VALUES ($1, 'PURCHASE_ORDER', $2, $3, $4, $5, 'APPROVED', $6, NOW() - INTERVAL '2 days', 'Approved for Plant A hydraulic press reliability')`,
    [
      cid,
      po2.id,
      `Purchase Order PO-2026-0102 — Ceylon Lubricants & Hydraulics (LKR ${po2Total.toLocaleString()})`,
      userIds['manager@demo.local'],
      po2Total,
      userIds['admin@demo.local'],
    ],
  );

  // 5 Company Knowledge / SOP Documents for RAG Citations
  const docs: Array<[string, string, string, string]> = [
    [
      'SOP-MNT-001: Standby Diesel Generator Preventive Maintenance Policy',
      'SOP',
      'VIEWER',
      'Cummins standby generators (including GEN-001) must undergo full inspection every 500 running hours or 90 calendar days. Replace 15W-40 engine oil and separators, verify battery float voltage (27.2V DC), and conduct an 80% rated kW load-bank test for 60 minutes. Bearing vibration exceeding 4.5 mm/s RMS triggers immediate corrective overhaul.',
    ],
    [
      'SOP-CNC-004: 5-Axis CNC Spindle Vibration & Servo Escalation Standard',
      'SOP',
      'VIEWER',
      'Mazak 5-axis machining centers (CNC-104) require continuous piezo vibration monitoring. Alert threshold is 3.5 mm/s RMS; mandatory spindle stop threshold is 5.5 mm/s RMS. Keep at least 4 units of Infineon 75A IGBT modules (IGBT-MOD-75A) in ESD Vault 2 to cap unplanned downtime under 8 hours.',
    ],
    [
      'POL-INV-002: Automated MRO Inventory Reorder & Approval Matrix',
      'POLICY',
      'VIEWER',
      'Whenever an MRO inventory item drops to or below its configured reorder level, OpsPilot automatically raises a LOW_STOCK notification to Warehouse and Operations Managers, generates a replenishment Purchase Order for 2x reorder quantity, and routes an Approval request. POs up to LKR 500,000 require Manager approval; POs above LKR 500,000 require Company Admin sign-off.',
    ],
    [
      'SOP-SAF-007: Lockout / Tagout (LOTO) & HydraulicStored-Energy Procedure',
      'SAFETY',
      'VIEWER',
      'Before performing seal or electrical maintenance on HYD-008 (200T Stamping Press) or HV switchgear, technicians must isolate the main breaker, apply personal padlocks, bleed accumulator pressure to 0 bar, and log LOTO verification on the work order.',
    ],
    [
      'POL-HR-011: Maintenance Shift Handover & RBAC Governance',
      'GOVERNANCE',
      'MANAGER',
      'Role-Based Access Control enforces five privilege tiers: SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE, and VIEWER. Viewers (external/internal compliance auditors) may inspect aggregate operational KPIs without exposing personal employee contact records or mutating production data.',
    ],
  ];
  for (const [title, category, minRole, content] of docs) {
    await db.query(
      `INSERT INTO "documents" (company_id, title, category, min_role, content)
       VALUES ($1, $2, $3, $4::"Role", $5)`,
      [cid, title, category, minRole, content],
    );
  }

  // Initial Notifications
  const notifSpecs: Array<[string, string, string, string]> = [
    [
      'admin@demo.local',
      'APPROVAL_REQUESTED',
      'Purchase order awaiting approval',
      'PO-2026-0101 (LKR 465,000) for low-stock SKF bearings & IGBT servo modules requires sign-off.',
    ],
    [
      'admin@demo.local',
      'LOW_STOCK',
      '3 critical MRO items below reorder threshold',
      'BRG-6205 (4/12), HYD-SEAL-200 (2/6), and IGBT-MOD-75A (1/4) are below minimum stock levels.',
    ],
    [
      'manager@demo.local',
      'WORK_ORDER_UPDATE',
      'Critical work order in progress on CNC-104',
      'Dilshan Silva started spindle bearing & servo drive overhaul on Mazak 5-Axis CNC-104.',
    ],
    [
      'tech@demo.local',
      'TASK_ASSIGNED',
      'Assigned: CMP-012 preventive separator service',
      'You have been assigned preventive maintenance on Atlas Copco GA37 Compressor (CMP-012).',
    ],
  ];
  for (const [email, type, title, message] of notifSpecs) {
    await db.query(
      `INSERT INTO "notifications" (company_id, user_id, type, channel, email_status, title, message)
       VALUES ($1, $2, $3::"NotificationType", 'BOTH', 'SENT', $4, $5)`,
      [cid, userIds[email], type, title, message],
    );
  }

  // Initial Audit Logs
  await db.query(
    `INSERT INTO "audit_logs" (company_id, actor_id, action, entity, entity_id, ip_address, details)
     VALUES
       ($1, $2, 'APPROVE', '/api/approvals/decide', $4, '10.20.1.14', '{"decision":"APPROVED","poNumber":"PO-2026-0102"}'::jsonb),
       ($1, $3, 'CREATE', '/api/work-orders', NULL, '10.20.1.28', '{"asset":"CNC-104","priority":"CRITICAL"}'::jsonb)`,
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
