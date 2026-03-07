export const resolveOrgId = (headers: Record<string, unknown>) => {
  const v = headers['x-org-id'];
  return typeof v === 'string' && v.trim().length > 0 ? v : 'org_demo';
};

export const resolveUserId = (headers: Record<string, unknown>) => {
  const v = headers['x-user-id'];
  return typeof v === 'string' && v.trim().length > 0 ? v : 'usr_demo_owner';
};
