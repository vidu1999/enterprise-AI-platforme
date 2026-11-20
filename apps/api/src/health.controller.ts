import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from './database/database.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Platform liveness & database readiness check' })
  async check() {
    const ping = await this.db.one<{ ok: number }>('SELECT 1 AS ok');
    return {
      status: 'ok',
      service: 'opspilot-api',
      database: ping?.ok === 1 ? 'connected' : 'degraded',
      driver: this.db.getDriver(),
      timestamp: new Date().toISOString(),
    };
  }
}
