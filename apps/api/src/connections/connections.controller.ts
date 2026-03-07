import { Body, Controller, Delete, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { IsEnum, IsObject, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { ok } from '../common/api-response';
import { resolveOrgId, resolveUserId } from '../common/org-context';
import { ToolType } from '../common/enums';
import { ConnectionsService } from './connections.service';

class CreateConnectionDto {
  @IsString() @MinLength(1) name!: string;
  @IsEnum(ToolType) toolType!: ToolType;
  @IsUrl() baseUrl!: string;
  @IsOptional() @IsUrl() secondaryBaseUrl?: string;
  @IsString() @MinLength(1) authType!: string;
  @IsOptional() @IsString() username?: string;
  @IsString() @MinLength(1) secret!: string;
  @IsOptional() @IsObject() metadataJson?: Record<string, unknown>;
}

class CreateWorkflowConfigDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) requirementsSourceConnectionId!: string;
  @IsString() @MinLength(1) testManagementTargetConnectionId!: string;
}

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly service: ConnectionsService) {}

  @Get()
  async list(@Headers() headers: Record<string, unknown>, @Query('toolType') toolType?: ToolType) {
    const orgId = resolveOrgId(headers);
    return ok(toolType ? await this.service.listByTool(orgId, toolType) : await this.service.list(orgId));
  }

  @Post()
  async create(@Headers() headers: Record<string, unknown>, @Body() body: CreateConnectionDto) {
    return ok(await this.service.create(resolveOrgId(headers), resolveUserId(headers), body));
  }

  @Get(':id')
  async get(@Headers() headers: Record<string, unknown>, @Param('id') id: string) { return ok(await this.service.get(resolveOrgId(headers), id)); }

  @Post('validate')
  async validateInput(@Body() body: CreateConnectionDto) {
    return ok(await this.service.validateInput(body));
  }

  @Post(':id/validate')
  async validate(@Headers() headers: Record<string, unknown>, @Param('id') id: string) { return ok(await this.service.validate(resolveOrgId(headers), id)); }

  @Post('workflow-configs')
  saveWorkflowConfig(@Headers() headers: Record<string, unknown>, @Body() body: CreateWorkflowConfigDto) {
    return ok(this.service.saveWorkflowConfig(resolveOrgId(headers), resolveUserId(headers), body));
  }

  @Get('workflow-configs/list')
  listWorkflowConfigs(@Headers() headers: Record<string, unknown>) {
    return ok(this.service.listWorkflowConfigs(resolveOrgId(headers)));
  }

  @Delete(':id')
  async remove(@Headers() headers: Record<string, unknown>, @Param('id') id: string) { return ok(await this.service.remove(resolveOrgId(headers), id)); }
}
