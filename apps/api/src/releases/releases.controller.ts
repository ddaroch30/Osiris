import { Controller, Get, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ReleasesService } from './releases.service';

@Controller('releases')
export class ReleasesController {
  constructor(private readonly service: ReleasesService) {}
  @Get() async list(@Query('connectionId') connectionId: string, @Query('projectKey') projectKey: string) {
    return ok(await this.service.list(connectionId, projectKey));
  }
}
