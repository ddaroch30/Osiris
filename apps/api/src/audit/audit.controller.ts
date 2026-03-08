import { Controller, Get, Headers } from '@nestjs/common';
import { ok } from '../common/api-response';
import { resolveOrgId } from '../common/org-context';
import { InMemoryStore } from '../common/in-memory-store';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly store: InMemoryStore) {}

  @Get()
  list(@Headers() headers: Record<string, unknown>) {
    const orgId = resolveOrgId(headers);
    return ok(this.store.audits.filter((a) => a.organizationId === orgId));
  }
}
