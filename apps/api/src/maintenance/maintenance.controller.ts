import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Priority, WorkOrderStatus } from '../common/enums';

export class CreateWorkOrderDto {
  @IsNotEmpty() @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() assetId?: string;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsNumber() @Min(0) estimatedCost?: number;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class UpdateWorkOrderDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(WorkOrderStatus) status?: WorkOrderStatus;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsNumber() @Min(0) actualCost?: number;
}

export class CreateAssetDto {
  @IsNotEmpty() @IsString() code: string;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsInt() @Min(1) maintenanceIntervalDays?: number;
}

@ApiTags('Maintenance & Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class MaintenanceController {
  constructor(private readonly svc: MaintenanceService) {}

  @Get('work-orders')
  @ApiOperation({ summary: 'List work orders with status, priority, and search filters' })
  orders(@CurrentUser() u: AuthUser, @Query() q: any) {
    return this.svc.listOrders(u.companyId, q);
  }

  @Post('work-orders')
  @Roles('COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE')
  createOrder(@CurrentUser() u: AuthUser, @Body() dto: CreateWorkOrderDto) {
    return this.svc.createOrder(u.companyId, u.id, dto);
  }

  @Patch('work-orders/:id')
  @Roles('COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE')
  updateOrder(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.svc.updateOrder(u.companyId, id, dto);
  }

  @Delete('work-orders/:id')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  deleteOrder(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.deleteOrder(u.companyId, id);
  }

  @Get('assets')
  assets(@CurrentUser() u: AuthUser) {
    return this.svc.listAssets(u.companyId);
  }

  @Post('assets')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  createAsset(@CurrentUser() u: AuthUser, @Body() dto: CreateAssetDto) {
    return this.svc.createAsset(u.companyId, dto);
  }

  @Post('assets/:id/schedule-maintenance')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Generate a preventive maintenance work order for an asset' })
  schedulePreventive(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.schedulePreventive(u.companyId, u.id, id);
  }
}
