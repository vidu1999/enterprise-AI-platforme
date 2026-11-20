import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

export class PoLineDto {
  @IsNotEmpty() @IsString() itemId: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitCost: number;
}

export class CreatePoDto {
  @IsNotEmpty() @IsString() supplierId: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PoLineDto) lines: PoLineDto[];
}

export class DecideDto {
  @IsNotEmpty() @IsString() decision: string; // APPROVED | REJECTED
  @IsOptional() @IsString() comment?: string;
}

@ApiTags('Workflow & Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class WorkflowController {
  constructor(private readonly svc: WorkflowService) {}

  @Get('purchase-orders')
  pos(@CurrentUser() u: AuthUser) {
    return this.svc.listPos(u.companyId);
  }

  @Post('purchase-orders')
  @Roles('COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Create a purchase order and automatically trigger an approval request' })
  createPo(@CurrentUser() u: AuthUser, @Body() dto: CreatePoDto) {
    return this.svc.createPo(u.companyId, u.id, dto);
  }

  @Post('purchase-orders/:id/receive')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Receive an APPROVED purchase order and increment inventory stock' })
  receivePo(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.receivePo(u.companyId, u.id, id);
  }

  @Get('approvals')
  approvals(@CurrentUser() u: AuthUser, @Query('status') status?: string) {
    return this.svc.listApprovals(u.companyId, status);
  }

  @Patch('approvals/:id/decide')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Approve or reject a pending workflow item' })
  decide(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: DecideDto) {
    return this.svc.decide(u.companyId, u.id, id, dto);
  }
}
