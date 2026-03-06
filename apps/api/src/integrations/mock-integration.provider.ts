import { Injectable } from '@nestjs/common';
import { IntegrationProvider, ProjectProvider, ReleaseProvider, RequirementProvider, TestCasePushProvider } from './contracts';

@Injectable()
export class MockIntegrationProvider
  implements IntegrationProvider, ProjectProvider, ReleaseProvider, RequirementProvider, TestCasePushProvider
{
  async validateConnection() {
    return { success: true, message: 'Mock integration reachable.' };
  }
  async fetchProjects() {
    return [
      { id: '1000', key: 'PAY', name: 'Payments Modernization', type: 'software' },
      { id: '1001', key: 'IAM', name: 'Identity Hardening', type: 'software' }
    ];
  }
  async fetchReleases(_: string, projectKey: string) {
    return [{ id: `rel-${projectKey}-q3`, name: 'Q3 2026', status: 'ACTIVE', startDate: '2026-07-01' }];
  }
  async fetchRequirements(_: string, projectKey: string, releaseId: string) {
    return [
      {
        externalId: `${projectKey}-101`,
        externalKey: `${projectKey}-101`,
        summary: 'As a user I can reset password with OTP',
        status: 'In Progress',
        priority: 'High',
        releaseId,
        acceptanceCriteria: 'OTP expires in 5 mins; lock after 5 attempts.'
      },
      {
        externalId: `${projectKey}-102`,
        externalKey: `${projectKey}-102`,
        summary: 'As admin I can revoke active sessions',
        status: 'To Do',
        priority: 'Medium',
        releaseId,
        acceptanceCriteria: 'Revocation should be immediate across devices.'
      }
    ];
  }
  async pushTestCases(payload: { connectionId: string; cases: any[] }) {
    const { connectionId, cases } = payload;
    return cases.map((c, i) => ({
      testCaseId: `ZEPHYR-TC-${1000 + i}`,
      storyKey: c.requirementKey,
      status: 'SUCCESS',
      connectionId
    }));
  }
}
