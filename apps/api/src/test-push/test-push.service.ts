import { Injectable } from '@nestjs/common';
import { PushStatus, ReviewStatus, ToolType } from '../common/enums';
import { InMemoryStore } from '../common/in-memory-store';
import { ConnectionsService } from '../connections/connections.service';
import { ConnectorFactory } from '../integrations/factory/connector.factory';

@Injectable()
export class TestPushService {
  constructor(private readonly store: InMemoryStore, private readonly connections: ConnectionsService, private readonly factory: ConnectorFactory) {}

  async execute(orgId: string, userId: string, body: { connectionId: string; batchId: string }) {
    const execution = { id: `push_${Date.now()}`, organizationId: orgId, connectionId: body.connectionId, batchId: body.batchId, initiatedById: userId, status: PushStatus.PENDING, startedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    this.store.pushes.push(execution);
    const approved = this.store.testCases.filter((x) => x.batchId === body.batchId && x.status === ReviewStatus.APPROVED);
    const conn = this.connections.getInternal(orgId, body.connectionId);
    const connector = this.factory.resolve(conn.toolType as ToolType);
    const created = await connector.createTestCases({ toolType: conn.toolType, baseUrl: conn.baseUrl, secondaryBaseUrl: conn.secondaryBaseUrl, username: conn.username, secret: conn.secret, metadataJson: conn.metadataJson }, approved.map((c) => ({ sourceRequirementExternalId: c.sourceRequirementExternalId, sourceRequirementKey: c.sourceRequirementKey, title: c.title, preconditions: c.preconditions, steps: c.stepsJson ?? c.steps ?? [], expectedResult: c.expectedResult, priority: c.priority })));
    const links = await connector.linkTestCasesToRequirements({ toolType: conn.toolType, baseUrl: conn.baseUrl, secondaryBaseUrl: conn.secondaryBaseUrl, username: conn.username, secret: conn.secret, metadataJson: conn.metadataJson }, created.filter((c) => c.success && c.externalTestCaseId).map((c) => ({ requirementExternalId: c.sourceRequirementExternalId, testCaseExternalId: c.externalTestCaseId! })));

    const items = created.map((c) => {
      const link = links.find((l) => l.requirementExternalId === c.sourceRequirementExternalId && l.testCaseExternalId === c.externalTestCaseId);
      const row = { id: `pei_${Math.random().toString(16).slice(2, 8)}`, pushExecutionId: execution.id, generatedTestCaseId: approved.find((a) => a.sourceRequirementExternalId === c.sourceRequirementExternalId)?.id, sourceRequirementExternalId: c.sourceRequirementExternalId, targetExternalTestCaseId: c.externalTestCaseId, targetExternalTestCaseKey: c.externalTestCaseKey, createStatus: c.success ? PushStatus.SUCCESS : PushStatus.FAILED, linkStatus: link?.success ? PushStatus.SUCCESS : PushStatus.FAILED, errorMessage: c.errorMessage ?? link?.errorMessage, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      this.store.pushItems.push(row);
      if (c.success && link?.success) this.store.links.push({ id: `link_${Math.random().toString(16).slice(2, 8)}`, organizationId: orgId, connectionId: body.connectionId, sourceRequirementExternalId: c.sourceRequirementExternalId, sourceRequirementKey: approved.find((a) => a.sourceRequirementExternalId === c.sourceRequirementExternalId)?.sourceRequirementKey, generatedTestCaseId: row.generatedTestCaseId, targetExternalTestCaseId: c.externalTestCaseId, targetExternalTestCaseKey: c.externalTestCaseKey, linkType: 'REQUIREMENT_TO_TEST', createdAt: new Date().toISOString() });
      return row;
    });

    const successCount = items.filter((i) => i.createStatus === PushStatus.SUCCESS && i.linkStatus === PushStatus.SUCCESS).length;
    execution.status = successCount === 0 ? PushStatus.FAILED : successCount === items.length ? PushStatus.SUCCESS : PushStatus.PARTIAL;
    Object.assign(execution, { completedAt: new Date().toISOString(), summaryJson: { total: items.length, success: successCount } });
    return { execution, items, traceabilityLinks: this.store.links.filter((l) => l.connectionId === body.connectionId) };
  }

  get(id: string) { return { execution: this.store.pushes.find((x) => x.id === id), items: this.store.pushItems.filter((x) => x.pushExecutionId === id) }; }
}
