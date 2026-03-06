import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { resolveOrgId } from '../common/org-context';
import { RequirementsService } from './requirements.service';

@Controller('connections/:id/requirements')
export class RequirementsController {
  constructor(private readonly service: RequirementsService) {}
  @Get()
  async list(
    @Headers() headers: Record<string, unknown>,
    @Param('id') id: string,
    @Query('projectExternalId') projectExternalId: string,
    @Query('releaseContextExternalId') releaseContextExternalId?: string,
    @Query('search') search?: string
  ) {
    return ok(await this.service.list(resolveOrgId(headers), id, { projectExternalId, releaseContextExternalId, search }));
  }
}
