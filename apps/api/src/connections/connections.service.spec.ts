import { ConnectionsService } from './connections.service';
import { InMemoryStore } from '../common/in-memory-store';
import { ConnectorFactory } from '../integrations/factory/connector.factory';

describe('ConnectionsService organization scoping', () => {
  it('returns only tenant connections', () => {
    const svc = new ConnectionsService(new InMemoryStore(), new ConnectorFactory());
    const rows = svc.list('org_demo');
    expect(rows.every((r: any) => r.organizationId === 'org_demo')).toBe(true);
  });
});
