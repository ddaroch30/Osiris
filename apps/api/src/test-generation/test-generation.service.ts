import { Injectable } from '@nestjs/common';
import { GenerationStatus } from '../common/enums';
import { InMemoryStore } from '../common/in-memory-store';
import { MockTestCaseGenerationProvider } from './providers/mock-generation.provider';

@Injectable()
export class TestGenerationService {
  private readonly provider = new MockTestCaseGenerationProvider();
  constructor(private readonly store: InMemoryStore) {}

  async generate(orgId: string, userId: string, body: any) {
    const batch = this.store.createBatch({ organizationId: orgId, connectionId: body.connectionId, projectExternalId: body.projectExternalId, releaseContextExternalId: body.releaseContextExternalId ?? null, createdById: userId, status: GenerationStatus.GENERATED, generationMode: 'MOCK_PROVIDER' });
    const generated = await this.provider.generate(body.requirements);
    const cases = generated.map((c) => this.store.upsertTestCase({ batchId: batch.id, ...c, expectedResult: c.expectedResult, stepsJson: c.steps }));
    return { batch, testCases: cases };
  }

  list(batchId: string) { return this.store.testCases.filter((x) => x.batchId === batchId); }
}
