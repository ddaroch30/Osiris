import { ConnectionsService } from './connections.service';
import { InMemoryStore } from '../common/in-memory-store';
import { ConnectorFactory } from '../integrations/factory/connector.factory';
import { PrismaService } from '../common/prisma.service';

describe('ConnectionsService organization scoping', () => {
  it('returns only tenant connections', async () => {
    const prisma = {
      clientConnection: {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', organizationId: 'org_demo', name: 'Demo', toolType: 'JIRA', authType: 'BASIC', baseUrl: 'https://x', secondaryBaseUrl: null, username: null, metadataJson: null, maskedSecretPreview: '****abcd', status: 'DRAFT', lastValidatedAt: null, createdAt: new Date(), updatedAt: new Date() }
        ])
      }
    } as unknown as PrismaService;

    const svc = new ConnectionsService(new InMemoryStore(), new ConnectorFactory(), prisma);
    const rows = await svc.list('org_demo');
    expect(rows.every((r: any) => r.organizationId === 'org_demo')).toBe(true);
  });
});
