import { BadRequestException, Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { resolveOrgId } from '../common/org-context';
import { ProjectsService } from './projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get('connections/:id/projects')
  async list(@Headers() headers: Record<string, unknown>, @Param('id') id: string) {
    return ok(await this.service.list(resolveOrgId(headers), id));
  }

  @Get('projects/:projectKey/planning-context')
  async planningContext(
    @Headers() headers: Record<string, unknown>,
    @Param('projectKey') projectKey: string,
    @Query('connectionId') connectionId?: string
  ) {
    if (!connectionId) {
      throw new BadRequestException('connectionId is required');
    }

    return ok(await this.service.discoverPlanningContext(resolveOrgId(headers), connectionId, projectKey));
  }

  @Get('projects/:projectKey/stories')
  async stories(
    @Headers() headers: Record<string, unknown>,
    @Param('projectKey') projectKey: string,
    @Query('connectionId') connectionId?: string,
    @Query('contextType') contextType?: 'SPRINT' | 'RELEASE' | 'BACKLOG',
    @Query('contextId') contextId?: string
  ) {
    if (!connectionId) {
      throw new BadRequestException('connectionId is required');
    }

    if (!contextType) {
      throw new BadRequestException('contextType is required');
    }

    return ok(await this.service.listStories(resolveOrgId(headers), connectionId, projectKey, contextType, contextId));
  }
}
