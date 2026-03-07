import { Injectable } from '@nestjs/common';
import { ConnectionStatus, GenerationStatus, ReviewStatus, ToolType } from './enums';

@Injectable()
export class InMemoryStore {
  connections: any[] = [
    {
      id: 'conn_demo_1',
      organizationId: 'org_demo',
      name: 'Demo Jira + Zephyr',
      toolType: ToolType.DEMO,
      baseUrl: 'https://demo.local',
      secondaryBaseUrl: null,
      authType: 'API_TOKEN',
      username: 'owner@demo.com',
      encryptedSecret: 'ZGVtbw==',
      maskedSecretPreview: '****demo',
      status: ConnectionStatus.ACTIVE,
      lastValidatedAt: new Date().toISOString(),
      metadataJson: { demoMode: true },
      createdById: 'usr_demo_owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  batches: any[] = [];
  testCases: any[] = [];
  pushes: any[] = [];
  pushItems: any[] = [];
  links: any[] = [];
  audits: any[] = [];
  workflowConfigs: any[] = [];

  createBatch(payload: any) {
    const row = { id: `batch_${Date.now()}`, status: GenerationStatus.GENERATED, ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.batches.push(row);
    return row;
  }

  upsertTestCase(payload: any) {
    const id = payload.id ?? `tc_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    const row = { id, status: ReviewStatus.DRAFT, isManuallyEdited: false, ...payload, updatedAt: new Date().toISOString() };
    const idx = this.testCases.findIndex((x) => x.id === id);
    if (idx >= 0) this.testCases[idx] = { ...this.testCases[idx], ...row };
    else this.testCases.push({ ...row, createdAt: new Date().toISOString() });
    return this.testCases.find((x) => x.id === id);
  }
}
