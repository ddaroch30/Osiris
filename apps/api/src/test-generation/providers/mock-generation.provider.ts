import { ScenarioType } from '../../common/enums';
import { GeneratedDraftTestCase, RequirementForGeneration, TestCaseGenerationProvider } from './provider.interface';

export class MockTestCaseGenerationProvider implements TestCaseGenerationProvider {
  async generate(requirements: RequirementForGeneration[]): Promise<GeneratedDraftTestCase[]> {
    return requirements.flatMap((r) => [
      { sourceRequirementExternalId: r.externalId, sourceRequirementKey: r.key, sourceRequirementTitle: r.title, title: `${r.key} positive flow`, preconditions: 'User is authorized and prerequisite data exists', steps: ['Open feature', 'Enter valid data', 'Submit'], expectedResult: 'Operation succeeds and data persists', scenarioType: ScenarioType.POSITIVE, priority: r.priority ?? 'Medium' },
      { sourceRequirementExternalId: r.externalId, sourceRequirementKey: r.key, sourceRequirementTitle: r.title, title: `${r.key} validation and edge checks`, preconditions: 'Feature enabled', steps: ['Submit invalid payload', 'Submit boundary values', 'Try unauthorized action'], expectedResult: 'Validation errors shown, unauthorized blocked, no data corruption', scenarioType: ScenarioType.VALIDATION, priority: 'High' }
    ]);
  }
}
