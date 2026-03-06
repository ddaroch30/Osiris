import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { resolveOrgId, resolveUserId } from '../common/org-context';
import { TestPushService } from './test-push.service';

@Controller('push-executions')
export class TestPushController {
  constructor(private readonly service: TestPushService) {}

  @Post()
  async execute(@Headers() headers: Record<string, unknown>, @Body() body: { connectionId: string; batchId: string }) {
    return ok(await this.service.execute(resolveOrgId(headers), resolveUserId(headers), body));
  }

  @Get(':id')
  get(@Param('id') id: string) { return ok(this.service.get(id)); }
}
