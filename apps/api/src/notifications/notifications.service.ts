import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './email.service';
import { NotificationType } from '../common/enums';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: NotificationsGateway,
    private readonly email: EmailService,
  ) {}

  async list(companyId: string, userId: string) {
    return this.db.many(
      `SELECT id, company_id AS "companyId", user_id AS "userId", type, channel,
              email_status AS "emailStatus", title, message, read, created_at AS "createdAt"
       FROM "notifications"
       WHERE company_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [companyId, userId],
    );
  }

  async unreadCount(companyId: string, userId: string) {
    const row = await this.db.one<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM "notifications"
       WHERE company_id = $1 AND user_id = $2 AND read = FALSE`,
      [companyId, userId],
    );
    return { unread: row?.count ?? 0 };
  }

  async markRead(companyId: string, userId: string, id: string) {
    await this.db.query(
      `UPDATE "notifications" SET read = TRUE
       WHERE id = $1 AND company_id = $2 AND user_id = $3`,
      [id, companyId, userId],
    );
    return { ok: true };
  }

  async markAllRead(companyId: string, userId: string) {
    await this.db.query(
      `UPDATE "notifications" SET read = TRUE
       WHERE company_id = $1 AND user_id = $2 AND read = FALSE`,
      [companyId, userId],
    );
    return { ok: true };
  }

  async push(
    companyId: string,
    userId: string,
    type: NotificationType | string,
    title: string,
    message: string,
    sendEmail = true,
  ) {
    let emailStatus = 'SKIPPED';
    if (sendEmail) {
      const recipient = await this.db.one<{ email: string }>(
        `SELECT email FROM "users" WHERE id = $1 AND company_id = $2`,
        [userId, companyId],
      );
      if (recipient?.email) {
        emailStatus = await this.email.send(recipient.email, `[OpsPilot] ${title}`, message);
      }
    }

    const row = await this.db.one(
      `INSERT INTO "notifications" (company_id, user_id, type, channel, email_status, title, message)
       VALUES ($1, $2, $3::"NotificationType", $4, $5, $6, $7)
       RETURNING id, company_id AS "companyId", user_id AS "userId", type, channel,
                 email_status AS "emailStatus", title, message, read, created_at AS "createdAt"`,
      [companyId, userId, type, sendEmail ? 'BOTH' : 'IN_APP', emailStatus, title, message],
    );

    this.gateway.emitToUser(userId, row);
    return row;
  }

  async notifyRoles(
    companyId: string,
    roles: string[],
    type: NotificationType | string,
    title: string,
    message: string,
  ) {
    const targets = await this.db.many<{ id: string }>(
      `SELECT id FROM "users"
       WHERE company_id = $1 AND role::text = ANY($2::text[]) AND status = 'ACTIVE'`,
      [companyId, roles],
    );
    const created = [];
    for (const u of targets) {
      created.push(await this.push(companyId, u.id, type, title, message, true));
    }
    return created;
  }

  emailOutbox() {
    return this.email.recentOutbox(50);
  }
}
