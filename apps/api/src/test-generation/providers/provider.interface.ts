import { ScenarioType } from '../../common/enums';

export type RequirementForGeneration = {
  externalId: string;
  key: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: string;
};

export type GeneratedDraftTestCase = {
  sourceRequirementExternalId: string;
  sourceRequirementKey: string;
  sourceRequirementTitle: string;
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  scenarioType: ScenarioType;
  priority: string;
};

export interface TestCaseGenerationProvider {
  generate(requirements: RequirementForGeneration[]): Promise<GeneratedDraftTestCase[]>;
}
