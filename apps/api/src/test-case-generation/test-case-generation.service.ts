import { Injectable } from '@nestjs/common';

@Injectable()
export class TestCaseGenerationService {
  generate(requirements: Array<{ externalKey: string; summary: string; acceptanceCriteria?: string; priority?: string }>) {
    return requirements.flatMap((story) => [
      {
        requirementKey: story.externalKey,
        title: `${story.externalKey} - Happy path validation`,
        scenarioType: 'HAPPY_PATH',
        objective: `Verify ${story.summary}`,
        preconditions: ['User account exists', 'System available'],
        steps: ['Open relevant screen', 'Provide valid data', 'Submit action'],
        expectedResults: ['Action succeeds', 'State is persisted', 'Audit trail created'],
        priority: story.priority ?? 'Medium',
        status: 'DRAFT'
      },
      {
        requirementKey: story.externalKey,
        title: `${story.externalKey} - Validation and negative handling`,
        scenarioType: 'NEGATIVE',
        objective: 'Ensure invalid inputs and abuse patterns are blocked',
        preconditions: ['Feature enabled'],
        steps: ['Submit empty and malformed inputs', 'Exceed retry threshold'],
        expectedResults: ['Validation errors are clear', 'Security/rate limit controls apply'],
        priority: 'High',
        status: 'DRAFT'
      }
    ]);
  }
}
