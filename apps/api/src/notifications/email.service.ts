import { Injectable, Logger } from '@nestjs/common';

export interface EmailMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'SENT' | 'SIMULATED_DEV' | 'FAILED';
  sentAt: string;
}

/**
 * Enterprise email dispatcher.
 * When SMTP_WEBHOOK_URL is configured, relays transactional emails externally;
 * otherwise records structured email deliveries in-memory + logs so local dev,
 * demos, and automated integration tests can inspect outbound emails without an SMTP server.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly outbox: EmailMessage[] = [];

  async send(to: string, subject: string, body: string): Promise<'SENT' | 'SIMULATED_DEV' | 'FAILED'> {
    const webhookUrl = process.env.SMTP_WEBHOOK_URL;
    let status: 'SENT' | 'SIMULATED_DEV' | 'FAILED' = 'SIMULATED_DEV';

    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body }),
        });
        status = res.ok ? 'SENT' : 'FAILED';
      } catch (err) {
        this.logger.warn(`Email webhook delivery failed for ${to}: ${(err as Error).message}`);
        status = 'FAILED';
      }
    }

    const record: EmailMessage = {
      id: `eml_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      to,
      subject,
      body,
      status,
      sentAt: new Date().toISOString(),
    };
    this.outbox.unshift(record);
    if (this.outbox.length > 200) this.outbox.length = 200;
    return status;
  }

  recentOutbox(limit = 50): EmailMessage[] {
    return this.outbox.slice(0, limit);
  }
}
