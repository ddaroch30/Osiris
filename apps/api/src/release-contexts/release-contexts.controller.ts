import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { resolveOrgId } from '../common/org-context';
import { ReleaseContextsService } from './release-contexts.service';

@Controller('connections/:id/release-contexts')
export class ReleaseContextsController {
  constructor(private readonly service: ReleaseContextsService) {}
  @Get()
  async list(@Headers() headers: Record<string, unknown>, @Param('id') id: string, @Query('projectExternalId') projectExternalId: string) {
    return ok(await this.service.list(resolveOrgId(headers), id, projectExternalId));
  }
}
