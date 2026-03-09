import { TestPushService } from './test-push.service';
import { InMemoryStore } from '../common/in-memory-store';
import { ConnectionsService } from '../connections/connections.service';
import { ConnectorFactory } from '../integrations/factory/connector.factory';
import { ReviewStatus } from '../common/enums';
import { PrismaService } from '../common/prisma.service';

describe('TestPushService', () => {
  it('creates push execution with per-item results', async () => {
    const store = new InMemoryStore();
    const prisma = {
      clientConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn_demo_1',
          organizationId: 'org_demo',
          toolType: 'DEMO',
          baseUrl: 'https://example.com',
          secondaryBaseUrl: null,
          username: null,
          metadataJson: null,
          encryptedSecret: Buffer.from('demo').toString('base64')
        })
      }
    } as unknown as PrismaService;

    const connections = new ConnectionsService(store, new ConnectorFactory(), prisma);
    const svc = new TestPushService(store, connections, new ConnectorFactory());
    const batch = store.createBatch({ organizationId: 'org_demo', connectionId: 'conn_demo_1', projectExternalId: 'PAY', createdById: 'usr', generationMode: 'MOCK' });
    store.upsertTestCase({ batchId: batch.id, sourceRequirementExternalId: 'PAY-101', sourceRequirementKey: 'PAY-101', title: 'Case', preconditions: 'x', stepsJson: ['1'], expectedResult: 'ok', priority: 'High', status: ReviewStatus.APPROVED });
    const result = await svc.execute('org_demo', 'usr_demo_owner', { connectionId: 'conn_demo_1', batchId: batch.id });
    expect(result.execution.id).toContain('push_');
    expect(result.items.length).toBe(1);
  });
});
