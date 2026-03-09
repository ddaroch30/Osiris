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

    const organizationId = resolveOrgId(headers);
    console.log('[ProjectsController.planningContext] request received', { organizationId, connectionId, projectKey });
    const data = await this.service.discoverPlanningContext(organizationId, connectionId, projectKey);
    console.log('[ProjectsController.planningContext] request completed', { organizationId, projectKey, type: data.type, id: data.id });
    return ok(data);
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

    const organizationId = resolveOrgId(headers);
    console.log('[ProjectsController.stories] request received', { organizationId, connectionId, projectKey, contextType, contextId });
    const data = await this.service.listStories(organizationId, connectionId, projectKey, contextType, contextId);
    console.log('[ProjectsController.stories] request completed', { organizationId, projectKey, contextType, count: data.length });
    return ok(data);
  }
}
