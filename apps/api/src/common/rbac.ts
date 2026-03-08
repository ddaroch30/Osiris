export enum Role {
  ORG_OWNER = 'ORG_OWNER',
  ADMIN = 'ADMIN',
  QA_MANAGER = 'QA_MANAGER',
  QA_ANALYST = 'QA_ANALYST',
  VIEWER = 'VIEWER'
}

export const PermissionMatrix: Record<Role, string[]> = {
  ORG_OWNER: ['*'],
  ADMIN: ['connections:manage', 'projects:view', 'generation:run', 'review:edit', 'push:execute', 'audit:view'],
  QA_MANAGER: ['projects:view', 'generation:run', 'review:edit', 'push:execute', 'audit:view'],
  QA_ANALYST: ['projects:view', 'generation:run', 'review:edit'],
  VIEWER: ['projects:view']
};
