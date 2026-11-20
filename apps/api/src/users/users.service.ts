import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  private mapUser(row: any) {
    return {
      id: row.id,
      companyId: row.companyId,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      status: row.status,
      jobTitle: row.jobTitle,
      phone: row.phone,
      departmentId: row.departmentId,
      department: row.departmentId ? { id: row.departmentId, name: row.departmentName } : null,
      createdAt: row.createdAt,
    };
  }

  async listUsers(companyId: string, q: any = {}) {
    const limit = Math.min(Math.max(Number(q.limit ?? 100), 1), 200);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    const search = q.search ? `%${String(q.search).trim().toLowerCase()}%` : null;
    const role = q.role ? String(q.role) : null;
    const deptId = q.departmentId ? String(q.departmentId) : null;

    const rows = await this.db.many(
      `SELECT u.id, u.company_id AS "companyId", u.email,
              u.first_name AS "firstName", u.last_name AS "lastName",
              u.role, u.status, u.job_title AS "jobTitle", u.phone,
              u.department_id AS "departmentId", d.name AS "departmentName",
              u.created_at AS "createdAt"
       FROM "users" u
       LEFT JOIN "departments" d ON d.id = u.department_id
       WHERE u.company_id = $1
         AND ($2::text IS NULL OR LOWER(u.first_name || ' ' || u.last_name || ' ' || u.email) LIKE $2)
         AND ($3::text IS NULL OR u.role::text = $3)
         AND ($4::uuid IS NULL OR u.department_id = $4::uuid)
       ORDER BY u.created_at ASC
       LIMIT $5 OFFSET $6`,
      [companyId, search, role, deptId, limit, offset],
    );
    return rows.map((r) => this.mapUser(r));
  }

  async createUser(companyId: string, dto: any) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.db.one(`SELECT id FROM "users" WHERE email = $1`, [email]);
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.db.one(
      `INSERT INTO "users" (company_id, email, password_hash, first_name, last_name, role, status, department_id, job_title, phone)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'EMPLOYEE')::"Role", 'ACTIVE', $7, $8, $9)
       RETURNING id, company_id AS "companyId", email, first_name AS "firstName",
                 last_name AS "lastName", role, status, job_title AS "jobTitle",
                 phone, department_id AS "departmentId", created_at AS "createdAt"`,
      [
        companyId,
        email,
        passwordHash,
        dto.firstName.trim(),
        dto.lastName.trim(),
        dto.role ?? 'EMPLOYEE',
        dto.departmentId || null,
        dto.jobTitle ?? null,
        dto.phone ?? null,
      ],
    );
    return this.mapUser(created);
  }

  async updateUser(companyId: string, id: string, dto: any) {
    const existing = await this.db.one(
      `SELECT id FROM "users" WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!existing) throw new NotFoundException('Employee not found');

    const updated = await this.db.one(
      `UPDATE "users"
       SET first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           role = COALESCE($5::"Role", role),
           status = COALESCE($6::"UserStatus", status),
           department_id = COALESCE($7, department_id),
           job_title = COALESCE($8, job_title),
           phone = COALESCE($9, phone),
           updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING id, company_id AS "companyId", email, first_name AS "firstName",
                 last_name AS "lastName", role, status, job_title AS "jobTitle",
                 phone, department_id AS "departmentId", created_at AS "createdAt"`,
      [
        id,
        companyId,
        dto.firstName ?? null,
        dto.lastName ?? null,
        dto.role ?? null,
        dto.status ?? null,
        dto.departmentId ?? null,
        dto.jobTitle ?? null,
        dto.phone ?? null,
      ],
    );
    return this.mapUser(updated);
  }

  async deleteUser(companyId: string, id: string) {
    const res = await this.db.query(
      `DELETE FROM "users" WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!res.rowCount) throw new NotFoundException('Employee not found');
    return { ok: true };
  }

  async listDepartments(companyId: string) {
    return this.db.many(
      `SELECT d.id, d.company_id AS "companyId", d.name, d.description,
              d.created_at AS "createdAt",
              COUNT(u.id)::int AS "memberCount"
       FROM "departments" d
       LEFT JOIN "users" u ON u.department_id = d.id
       WHERE d.company_id = $1
       GROUP BY d.id
       ORDER BY d.name ASC`,
      [companyId],
    );
  }

  async createDepartment(companyId: string, name: string, description?: string) {
    const exists = await this.db.one(
      `SELECT id FROM "departments" WHERE company_id = $1 AND LOWER(name) = LOWER($2)`,
      [companyId, name.trim()],
    );
    if (exists) throw new ConflictException('Department already exists');
    return this.db.one(
      `INSERT INTO "departments" (company_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, company_id AS "companyId", name, description, created_at AS "createdAt"`,
      [companyId, name.trim(), description ?? null],
    );
  }
}
