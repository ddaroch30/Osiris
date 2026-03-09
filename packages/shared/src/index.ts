export type ScenarioType = 'HAPPY_PATH' | 'NEGATIVE' | 'EDGE' | 'VALIDATION' | 'ALTERNATE_FLOW';

export interface GeneratedTestCase {
  requirementKey: string;
  title: string;
  scenarioType: ScenarioType;
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
  priority: string;
}
