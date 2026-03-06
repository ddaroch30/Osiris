import { Injectable } from '@nestjs/common';
import { MockIntegrationProvider } from '../integrations/mock-integration.provider';

@Injectable()
export class TestCasePushService {
  constructor(private readonly provider: MockIntegrationProvider) {}
  async push(connectionId: string, testCases: any[]) {
    const results = await this.provider.pushTestCases({ connectionId, cases: testCases });
    return {
      executionId: `push_${Date.now()}`,
      status: 'COMPLETED',
      items: results,
      summary: { total: results.length, success: results.filter((r) => r.status === 'SUCCESS').length }
    };
  }
}
