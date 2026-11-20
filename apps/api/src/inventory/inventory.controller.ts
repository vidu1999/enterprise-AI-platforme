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
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

export class CreateItemDto {
  @IsNotEmpty() @IsString() sku: string;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsInt() @Min(0) quantity?: number;
  @IsOptional() @IsInt() @Min(0) reorderLevel?: number;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @IsString() location?: string;
}

export class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsInt() @Min(0) quantity?: number;
  @IsOptional() @IsInt() @Min(0) reorderLevel?: number;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @IsString() location?: string;
}

export class AdjustDto {
  @IsNotEmpty() @IsString() type: string; // IN | OUT | ADJUSTMENT
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() note?: string;
}

export class CreateSupplierDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsInt() @Min(1) leadTimeDays?: number;
}

@ApiTags('Inventory & Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  @Get('inventory')
  @ApiOperation({ summary: 'List inventory items with search, category, and low-stock filters' })
  items(@CurrentUser() u: AuthUser, @Query() q: any) {
    return this.svc.listItems(u.companyId, q);
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'List items at or below reorder threshold' })
  lowStock(@CurrentUser() u: AuthUser) {
    return this.svc.lowStock(u.companyId);
  }

  @Get('inventory/transactions')
  @ApiOperation({ summary: 'List recent stock ledger transactions' })
  transactions(@CurrentUser() u: AuthUser, @Query('limit') limit?: string) {
    return this.svc.listTransactions(u.companyId, limit ? Number(limit) : 50);
  }

  @Post('inventory')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  createItem(@CurrentUser() u: AuthUser, @Body() dto: CreateItemDto) {
    return this.svc.createItem(u.companyId, dto);
  }

  @Patch('inventory/:id')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  updateItem(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.svc.updateItem(u.companyId, id, dto);
  }

  @Delete('inventory/:id')
  @Roles('COMPANY_ADMIN')
  deleteItem(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.deleteItem(u.companyId, id);
  }

  @Post('inventory/:id/adjust')
  @Roles('COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({
    summary: 'Record stock IN/OUT/ADJUSTMENT; auto-creates Purchase Request + Approval when low-stock',
  })
  adjust(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: AdjustDto) {
    return this.svc.adjust(u.companyId, u.id, id, dto);
  }

  @Get('suppliers')
  suppliers(@CurrentUser() u: AuthUser) {
    return this.svc.listSuppliers(u.companyId);
  }

  @Post('suppliers')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  createSupplier(@CurrentUser() u: AuthUser, @Body() dto: CreateSupplierDto) {
    return this.svc.createSupplier(u.companyId, dto);
  }
}
