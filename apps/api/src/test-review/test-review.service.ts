import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewStatus } from '../common/enums';
import { InMemoryStore } from '../common/in-memory-store';

@Injectable()
export class TestReviewService {
  constructor(private readonly store: InMemoryStore) {}

  update(id: string, body: any) {
    const row = this.store.testCases.find((x) => x.id === id);
    if (!row) throw new NotFoundException('Test case not found');
    Object.assign(row, body, { isManuallyEdited: true, updatedAt: new Date().toISOString() });
    return row;
  }

  remove(id: string) {
    const before = this.store.testCases.length;
    this.store.testCases = this.store.testCases.filter((x) => x.id !== id);
    return { deleted: before - this.store.testCases.length };
  }

  approve(id: string, approvedById: string, approved: boolean) {
    return this.update(id, { status: approved ? ReviewStatus.APPROVED : ReviewStatus.DRAFT, approvedById: approved ? approvedById : null });
  }

  addManual(body: any) {
    return this.store.upsertTestCase({ ...body, isManuallyEdited: true, status: ReviewStatus.DRAFT });
  }
}
