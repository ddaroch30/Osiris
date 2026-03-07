import { Body, Controller, Patch } from '@nestjs/common';
import { ok } from '../common/api-response';

@Controller('review')
export class TestCaseReviewController {
  @Patch('status')
  updateStatus(@Body() body: { testCaseId: string; status: 'DRAFT' | 'APPROVED' | 'REJECTED' }) {
    return ok({ ...body, updatedAt: new Date().toISOString() });
  }
}
