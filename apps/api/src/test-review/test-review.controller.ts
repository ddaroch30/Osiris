import { Body, Controller, Delete, Headers, Param, Patch, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { resolveUserId } from '../common/org-context';
import { TestReviewService } from './test-review.service';

@Controller('test-cases')
export class TestReviewController {
  constructor(private readonly service: TestReviewService) {}

  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return ok(this.service.update(id, body)); }
  @Delete(':id') remove(@Param('id') id: string) { return ok(this.service.remove(id)); }
  @Post(':id/approve') approve(@Headers() headers: Record<string, unknown>, @Param('id') id: string, @Body('approved') approved = true) {
    return ok(this.service.approve(id, resolveUserId(headers), Boolean(approved)));
  }
  @Post() add(@Body() body: any) { return ok(this.service.addManual(body)); }
}
