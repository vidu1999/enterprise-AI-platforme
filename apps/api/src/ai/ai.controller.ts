import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

export class AskDto {
  @IsNotEmpty()
  @IsString()
  question: string;
}

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(Role)
  minRole?: Role;
}

@ApiTags('AI Assistant & Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly svc: AiService) {}

  @Get('health')
  health() {
    return this.svc.health();
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask a permission-aware operational or SOP policy question with evidence & citations' })
  ask(@CurrentUser() u: AuthUser, @Body() dto: AskDto) {
    return this.svc.ask(u.companyId, u.role, dto.question);
  }

  @Post('documents')
  @Roles('COMPANY_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Index a company SOP or policy document for RAG retrieval' })
  addDocument(@CurrentUser() u: AuthUser, @Body() dto: CreateDocumentDto) {
    return this.svc.addDocument(u.companyId, dto);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List company knowledge documents visible to the caller role' })
  documents(@CurrentUser() u: AuthUser) {
    return this.svc.listDocuments(u.companyId, u.role);
  }
}
