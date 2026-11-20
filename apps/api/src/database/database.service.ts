import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import { seedEnterpriseData } from './seed-data';

export interface SqlExecutor {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  one<T = any>(sql: string, params?: any[]): Promise<T | null>;
  many<T = any>(sql: string, params?: any[]): Promise<T[]>;
}

@Injectable()
export class DatabaseService implements SqlExecutor, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private pglite: PGlite | null = null;
  private driver: 'pg' | 'pglite' = 'pg';
  private initialized = false;

  getDriver(): 'pg' | 'pglite' {
    return this.driver;
  }

  async onModuleInit(): Promise<void> {
    if (this.initialized) return;
    await this.connect();
    await this.runMigrations();
    if (process.env.AUTO_SEED !== 'false' && process.env.NODE_ENV !== 'test') {
      await this.seedIfEmpty();
    }
    this.initialized = true;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end().catch(() => undefined);
      this.pool = null;
    }
    if (this.pglite) {
      await this.pglite.close().catch(() => undefined);
      this.pglite = null;
    }
    this.initialized = false;
  }

  private async canReachPostgres(connectionString: string): Promise<boolean> {
    try {
      const url = new URL(connectionString);
      const host = url.hostname || '127.0.0.1';
      const port = Number(url.port || 5432);
      return await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({ host, port });
        const timer = setTimeout(() => {
          socket.destroy();
          resolve(false);
        }, 800);
        socket.once('connect', () => {
          clearTimeout(timer);
          socket.end();
          resolve(true);
        });
        socket.once('error', () => {
          clearTimeout(timer);
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  async connect(): Promise<void> {
    if (this.pool || this.pglite) return;

    const forcedDriver = process.env.DATABASE_DRIVER;
    const dbUrl = process.env.DATABASE_URL;
    const isTest = process.env.NODE_ENV === 'test';

    if (forcedDriver === 'pglite' || (isTest && process.env.USE_EXTERNAL_PG !== 'true')) {
      this.driver = 'pglite';
      const dataDir = isTest
        ? undefined
        : process.env.PGLITE_DATA_DIR || path.resolve(process.cwd(), '.pglite-data');
      this.pglite = dataDir ? new PGlite(dataDir) : new PGlite();
      await this.pglite.waitReady;
      this.logger.log(
        `Connected to embedded PostgreSQL 16 (PGlite ${dataDir ? `persisted at ${dataDir}` : 'in-memory'})`,
      );
      return;
    }

    if (dbUrl && (forcedDriver === 'pg' || (await this.canReachPostgres(dbUrl)))) {
      this.driver = 'pg';
      this.pool = new Pool({
        connectionString: dbUrl,
        max: Number(process.env.PG_POOL_MAX ?? 20),
        idleTimeoutMillis: 30_000,
      });
      await this.pool.query('SELECT 1');
      this.logger.log('Connected to external PostgreSQL server via pg.Pool');
      return;
    }

    if (process.env.NODE_ENV === 'production' && forcedDriver === 'pg') {
      throw new Error('PostgreSQL server is unreachable and DATABASE_DRIVER=pg is enforced');
    }

    // Fallback to embedded PostgreSQL 16 (PGlite) for zero-Docker local development
    this.driver = 'pglite';
    const dataDir = process.env.PGLITE_DATA_DIR || path.resolve(process.cwd(), '.pglite-data');
    this.pglite = new PGlite(dataDir);
    await this.pglite.waitReady;
    this.logger.log(`External Postgres not detected; booted embedded PostgreSQL 16 at ${dataDir}`);
  }

  async runMigrations(): Promise<void> {
    const candidates = [
      path.resolve(__dirname, '../../sql/001_init.sql'),
      path.resolve(__dirname, '../../../sql/001_init.sql'),
      path.resolve(process.cwd(), 'sql/001_init.sql'),
      path.resolve(process.cwd(), 'apps/api/sql/001_init.sql'),
    ];
    const sqlPath = candidates.find((p) => fs.existsSync(p));
    if (!sqlPath) {
      throw new Error(`Migration file 001_init.sql not found in ${candidates.join(', ')}`);
    }
    const ddl = fs.readFileSync(sqlPath, 'utf8');
    await this.exec(ddl);
    this.logger.log('PostgreSQL schema migrations verified');
  }

  async seedIfEmpty(): Promise<void> {
    const row = await this.one<{ c: number }>('SELECT COUNT(*)::int AS c FROM "companies"');
    if ((row?.c ?? 0) === 0) {
      this.logger.log('Empty database detected — seeding enterprise demo dataset...');
      await seedEnterpriseData(this);
      this.logger.log('Enterprise demo dataset seeded successfully');
    }
  }

  async exec(sql: string): Promise<void> {
    if (this.pool) {
      await this.pool.query(sql);
      return;
    }
    if (this.pglite) {
      await this.pglite.exec(sql);
      return;
    }
    throw new Error('Database not connected');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    if (this.pool) {
      const res = await this.pool.query(sql, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
    }
    if (this.pglite) {
      const res = await this.pglite.query<T>(sql, params);
      return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length };
    }
    throw new Error('Database not connected');
  }

  async one<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const { rows } = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async many<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const { rows } = await this.query<T>(sql, params);
    return rows;
  }

  async withTransaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    if (this.pool) {
      const client: PoolClient = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const tx: SqlExecutor = {
          query: async <R = any>(sql: string, params: any[] = []) => {
            const r = await client.query(sql, params);
            return { rows: r.rows as R[], rowCount: r.rowCount ?? r.rows.length };
          },
          one: async <R = any>(sql: string, params: any[] = []) => {
            const r = await client.query(sql, params);
            return (r.rows[0] as R) ?? null;
          },
          many: async <R = any>(sql: string, params: any[] = []) => {
            const r = await client.query(sql, params);
            return r.rows as R[];
          },
        };
        const result = await fn(tx);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
    }

    if (this.pglite) {
      return this.pglite.transaction(async (pgTx) => {
        const tx: SqlExecutor = {
          query: async <R = any>(sql: string, params: any[] = []) => {
            const r = await pgTx.query<R>(sql, params);
            return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
          },
          one: async <R = any>(sql: string, params: any[] = []) => {
            const r = await pgTx.query<R>(sql, params);
            return r.rows[0] ?? null;
          },
          many: async <R = any>(sql: string, params: any[] = []) => {
            const r = await pgTx.query<R>(sql, params);
            return r.rows;
          },
        };
        return fn(tx);
      });
    }

    throw new Error('Database not connected');
  }
}
