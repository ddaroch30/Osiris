import { MockIntegrationProvider } from './mock-integration.provider';

describe('MockIntegrationProvider', () => {
  it('returns requirements for selected release', async () => {
    const provider = new MockIntegrationProvider();
    const items = await provider.fetchRequirements('conn_1', 'PAY', 'rel-1');
    expect(items[0].externalKey).toContain('PAY-');
  });
});
