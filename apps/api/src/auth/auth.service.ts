import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.db.one<{ id: string }>(
      `SELECT id FROM "users" WHERE email = $1`,
      [normalizedEmail],
    );
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const baseSlug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'company';
    const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const created = await this.db.withTransaction(async (tx) => {
      const company = (await tx.one<{ id: string; name: string }>(
        `INSERT INTO "companies" (name, slug, email)
         VALUES ($1, $2, $3)
         RETURNING id, name`,
        [dto.companyName.trim(), slug, normalizedEmail],
      ))!;

      const dept = await tx.one<{ id: string }>(
        `INSERT INTO "departments" (company_id, name, description)
         VALUES ($1, 'Operations & Maintenance', 'Default engineering & operations department')
         RETURNING id`,
        [company.id],
      );

      const user = (await tx.one<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        companyId: string;
      }>(
        `INSERT INTO "users" (company_id, email, password_hash, first_name, last_name, role, status, department_id, job_title)
         VALUES ($1, $2, $3, $4, $5, 'COMPANY_ADMIN', 'ACTIVE', $6, 'Company Administrator')
         RETURNING id, email, first_name AS "firstName", last_name AS "lastName", role, company_id AS "companyId"`,
        [company.id, normalizedEmail, passwordHash, dto.firstName.trim(), dto.lastName.trim(), dept?.id ?? null],
      ))!;

      return { ...user, companyName: company.name };
    });

    return this.issueTokens(created);
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.db.one<{
      id: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      role: string;
      status: string;
      companyId: string;
      companyName: string;
    }>(
      `SELECT u.id, u.email, u.password_hash AS "passwordHash",
              u.first_name AS "firstName", u.last_name AS "lastName",
              u.role, u.status, u.company_id AS "companyId",
              c.name AS "companyName"
       FROM "users" u
       JOIN "companies" c ON c.id = u.company_id
       WHERE u.email = $1`,
      [normalizedEmail],
    );

    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const row = await this.db.one<{
      rtId: string;
      expiresAt: Date;
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      status: string;
      companyId: string;
      companyName: string;
    }>(
      `SELECT rt.id AS "rtId", rt.expires_at AS "expiresAt",
              u.id, u.email, u.first_name AS "firstName", u.last_name AS "lastName",
              u.role, u.status, u.company_id AS "companyId", c.name AS "companyName"
       FROM "refresh_tokens" rt
       JOIN "users" u ON u.id = rt.user_id
       JOIN "companies" c ON c.id = u.company_id
       WHERE rt.token_hash = $1`,
      [hash],
    );

    if (!row || new Date(row.expiresAt) < new Date() || row.status === 'SUSPENDED') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Single-use refresh token rotation
    await this.db.query(`DELETE FROM "refresh_tokens" WHERE id = $1`, [row.rtId]);
    return this.issueTokens(row);
  }

  async logout(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.db.query(`DELETE FROM "refresh_tokens" WHERE token_hash = $1`, [hash]);
    return { ok: true };
  }

  async me(userId: string, companyId: string) {
    const user = await this.db.one(
      `SELECT u.id, u.email, u.first_name AS "firstName", u.last_name AS "lastName",
              u.role, u.status, u.job_title AS "jobTitle", u.company_id AS "companyId",
              c.name AS "companyName", c.slug AS "companySlug", c.currency
       FROM "users" u
       JOIN "companies" c ON c.id = u.company_id
       WHERE u.id = $1 AND u.company_id = $2`,
      [userId, companyId],
    );
    if (!user) throw new UnauthorizedException('User session not found');
    return user;
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
    companyName?: string;
  }) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
    const accessToken = this.jwt.sign(payload);
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await this.db.query(
      `INSERT INTO "refresh_tokens" (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt],
    );

    return {
      accessToken,
      refreshToken: raw,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName ?? '',
      },
    };
  }
}
