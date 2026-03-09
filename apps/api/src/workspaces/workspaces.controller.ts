import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ok } from '../common/api-response';
import { resolveOrgId } from '../common/org-context';
import { WorkspacesService } from './workspaces.service';

class CreateWorkspaceDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) jiraConnectionId!: string;
  @IsString() @MinLength(1) targetConnectionId!: string;
  @IsString() @MinLength(1) projectKey!: string;
  @IsOptional() @IsIn(['SPRINT', 'RELEASE', 'BACKLOG']) planningContextType?: 'SPRINT' | 'RELEASE' | 'BACKLOG';
  @IsOptional() @IsString() planningContextExternalId?: string;
  @IsOptional() @IsString() planningContextName?: string;
}

class SelectContextDto {
  @IsString() @MinLength(1) projectKey!: string;
  @IsIn(['SPRINT', 'RELEASE', 'BACKLOG']) planningContextType!: 'SPRINT' | 'RELEASE' | 'BACKLOG';
  @IsString() @MinLength(1) planningContextExternalId!: string;
  @IsString() @MinLength(1) planningContextName!: string;
}

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Get()
  async list(@Headers() headers: Record<string, unknown>) {
    const organizationId = resolveOrgId(headers);
    console.log('[WorkspacesController.list] request received', { organizationId });

    try {
      const data = await this.service.list(organizationId);
      console.log('[WorkspacesController.list] request completed', { organizationId, count: data.length });
      return ok(data);
    } catch (error) {
      console.error('[WorkspacesController.list] request failed', {
        organizationId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  @Post()
  async create(@Headers() headers: Record<string, unknown>, @Body() body: CreateWorkspaceDto) {
    const organizationId = resolveOrgId(headers);
    console.log('[WorkspacesController.create] request received', {
      organizationId,
      name: body.name,
      jiraConnectionId: body.jiraConnectionId,
      targetConnectionId: body.targetConnectionId,
      projectKey: body.projectKey
    });

    try {
      const data = await this.service.create(organizationId, body);
      console.log('[WorkspacesController.create] request completed', { organizationId, workspaceId: data.id });
      return ok(data);
    } catch (error) {
      console.error('[WorkspacesController.create] request failed', {
        organizationId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  @Get(':id')
  async get(@Headers() headers: Record<string, unknown>, @Param('id') id: string) {
    return ok(await this.service.get(resolveOrgId(headers), id));
  }

  @Post(':id/context')
  async selectContext(@Headers() headers: Record<string, unknown>, @Param('id') id: string, @Body() body: SelectContextDto) {
    return ok(await this.service.selectPlanningContext(resolveOrgId(headers), id, body));
  }

  @Post(':id/sync-requirements')
  async syncRequirements(@Headers() headers: Record<string, unknown>, @Param('id') id: string) {
    return ok(await this.service.syncRequirements(resolveOrgId(headers), id));
  }

  @Get(':id/requirements')
  async requirements(@Headers() headers: Record<string, unknown>, @Param('id') id: string) {
    return ok(await this.service.listRequirements(resolveOrgId(headers), id));
  }
}
