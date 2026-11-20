import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['audit', 'audit-logs'])
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'List immutable tenant audit logs (Admin & Manager only)' })
  list(@CurrentUser() u: AuthUser, @Query() q: any) {
    return this.svc.list(u.companyId, q);
  }
}
