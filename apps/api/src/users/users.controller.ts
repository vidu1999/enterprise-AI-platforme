import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, UserStatus } from '../common/enums';

export class CreateUserDto {
  @IsEmail() email: string;
  @IsNotEmpty() @IsString() firstName: string;
  @IsNotEmpty() @IsString() lastName: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() phone?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() phone?: string;
}

export class CreateDepartmentDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}

@ApiTags('Users & Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('users')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'List company employees (hidden from VIEWER role)' })
  list(@CurrentUser() u: AuthUser, @Query() q: any) {
    return this.svc.listUsers(u.companyId, q);
  }

  @Post('users')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new employee account within the tenant' })
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateUserDto) {
    return this.svc.createUser(u.companyId, dto);
  }

  @Patch('users/:id')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.svc.updateUser(u.companyId, id, dto);
  }

  @Delete('users/:id')
  @Roles('COMPANY_ADMIN')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.deleteUser(u.companyId, id);
  }

  @Get('departments')
  depts(@CurrentUser() u: AuthUser) {
    return this.svc.listDepartments(u.companyId);
  }

  @Post('departments')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  createDept(@CurrentUser() u: AuthUser, @Body() dto: CreateDepartmentDto) {
    return this.svc.createDepartment(u.companyId, dto.name, dto.description);
  }
}
