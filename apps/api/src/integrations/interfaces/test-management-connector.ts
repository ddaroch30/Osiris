import { ToolType } from '../../common/enums';

export type ConnectorContext = {
  toolType: ToolType;
  baseUrl: string;
  secondaryBaseUrl?: string | null;
  username?: string | null;
  secret: string;
  metadataJson?: Record<string, unknown>;
};

export type ValidateConnectionInput = ConnectorContext;

export type ConnectionValidationResult = { success: boolean; message: string };

export type ProjectDto = { id: string; externalId: string; key: string; name: string; description?: string; sourceType: ToolType };
export type ReleaseContextDto = {
  id: string;
  externalId: string;
  name: string;
  type: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};
export type RequirementDto = {
  id: string;
  externalId: string;
  key: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: string;
  status?: string;
  releaseContextId?: string;
  sourceType: ToolType;
  rawMetadata?: Record<string, unknown>;
};

export type ListRequirementsInput = {
  projectExternalId: string;
  releaseContextExternalId?: string;
  query?: string;
};

export type CreateExternalTestCaseInput = {
  sourceRequirementExternalId: string;
  sourceRequirementKey: string;
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: string;
};
export type CreateExternalTestCaseResult = {
  sourceRequirementExternalId: string;
  externalTestCaseId?: string;
  externalTestCaseKey?: string;
  success: boolean;
  errorMessage?: string;
};

export type RequirementTestCaseLinkInput = {
  requirementExternalId: string;
  testCaseExternalId: string;
};

export type LinkResult = { requirementExternalId: string; testCaseExternalId: string; success: boolean; errorMessage?: string };

export interface TestManagementConnector {
  validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult>;
  listProjects(connection: ConnectorContext): Promise<ProjectDto[]>;
  listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]>;
  listRequirements(connection: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]>;
  createTestCases(connection: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]>;
  linkTestCasesToRequirements(connection: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]>;
}
