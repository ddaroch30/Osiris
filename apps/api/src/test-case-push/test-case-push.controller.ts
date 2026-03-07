import { Body, Controller, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { TestCasePushService } from './test-case-push.service';

@Controller('push-executions')
export class TestCasePushController {
  constructor(private readonly service: TestCasePushService) {}

  @Post()
  async create(@Body() body: { connectionId: string; testCases: any[] }) {
    return ok(await this.service.push(body.connectionId, body.testCases));
  }
}
