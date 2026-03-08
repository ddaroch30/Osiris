import { TestCaseGenerationService } from './test-case-generation.service';

describe('TestCaseGenerationService', () => {
  it('creates positive and negative test cases per requirement', () => {
    const svc = new TestCaseGenerationService();
    const res = svc.generate([{ externalKey: 'PAY-101', summary: 'Reset password' }]);
    expect(res).toHaveLength(2);
    expect(res[0].requirementKey).toBe('PAY-101');
  });
});
