import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List real-time & email notifications for current user' })
  list(@CurrentUser() u: AuthUser) {
    return this.svc.list(u.companyId, u.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() u: AuthUser) {
    return this.svc.unreadCount(u.companyId, u.id);
  }

  @Get('email-outbox')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Inspect recent outbound email delivery log' })
  emailOutbox() {
    return this.svc.emailOutbox();
  }

  @Patch('read-all')
  markAll(@CurrentUser() u: AuthUser) {
    return this.svc.markAllRead(u.companyId, u.id);
  }

  @Patch(':id/read')
  markOne(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.markRead(u.companyId, u.id, id);
  }
}
