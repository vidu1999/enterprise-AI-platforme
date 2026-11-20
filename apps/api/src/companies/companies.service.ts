import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly db: DatabaseService) {}

  async getById(companyId: string) {
    const company = await this.db.one(
      `SELECT id, name, slug, email, phone, address, industry, currency, timezone,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM "companies" WHERE id = $1`,
      [companyId],
    );
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(companyId: string, dto: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    industry?: string;
    currency?: string;
    timezone?: string;
  }) {
    const updated = await this.db.one(
      `UPDATE "companies"
       SET name = COALESCE($2, name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           industry = COALESCE($6, industry),
           currency = COALESCE($7, currency),
           timezone = COALESCE($8, timezone),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, slug, email, phone, address, industry, currency, timezone,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        companyId,
        dto.name ?? null,
        dto.email ?? null,
        dto.phone ?? null,
        dto.address ?? null,
        dto.industry ?? null,
        dto.currency ?? null,
        dto.timezone ?? null,
      ],
    );
    if (!updated) throw new NotFoundException('Company not found');
    return updated;
  }
}
