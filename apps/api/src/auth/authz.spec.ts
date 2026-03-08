import { PermissionMatrix, Role } from '../common/rbac';

describe('RBAC authorization', () => {
  it('viewer cannot push test cases', () => {
    expect(PermissionMatrix[Role.VIEWER]).not.toContain('push:execute');
  });
});
