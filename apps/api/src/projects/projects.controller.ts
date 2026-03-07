import { Controller, Get, Headers, Param } from '@nestjs/common';
import { ok } from '../common/api-response';
import { resolveOrgId } from '../common/org-context';
import { ProjectsService } from './projects.service';

@Controller('connections/:id/projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}
  @Get()
  async list(@Headers() headers: Record<string, unknown>, @Param('id') id: string) { return ok(await this.service.list(resolveOrgId(headers), id)); }
}
