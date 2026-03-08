import { MockTestCaseGenerationProvider } from './mock-generation.provider';

describe('MockTestCaseGenerationProvider', () => {
  it('generates structured draft test cases', async () => {
    const provider = new MockTestCaseGenerationProvider();
    const rows = await provider.generate([{ externalId: '1', key: 'REQ-1', title: 'Story' }]);
    expect(rows[0].steps.length).toBeGreaterThan(0);
    expect(rows.length).toBe(2);
  });
});
