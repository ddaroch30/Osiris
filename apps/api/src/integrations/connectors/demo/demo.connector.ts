import { ToolType } from '../../../common/enums';
import {
  ConnectionValidationResult,
  ConnectorContext,
  CreateExternalTestCaseInput,
  CreateExternalTestCaseResult,
  LinkResult,
  ListRequirementsInput,
  ProjectDto,
  ReleaseContextDto,
  RequirementDto,
  RequirementTestCaseLinkInput,
  TestManagementConnector,
  ValidateConnectionInput
} from '../../interfaces/test-management-connector';

export class DemoConnector implements TestManagementConnector {
  async validateConnection(_: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    return { success: true, message: 'Demo connector is active.' };
  }
  async listProjects(_: ConnectorContext): Promise<ProjectDto[]> {
    return [{ id: 'p1', externalId: 'PAY', key: 'PAY', name: 'Payments Modernization', sourceType: ToolType.DEMO }];
  }
  async listReleaseContexts(_: ConnectorContext): Promise<ReleaseContextDto[]> {
    return [{ id: 'r1', externalId: 'Q3-2026', name: 'Q3 2026', type: 'RELEASE', status: 'ACTIVE' }];
  }
  async listRequirements(_: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]> {
    return [
      {
        id: 'req1',
        externalId: 'PAY-101',
        key: 'PAY-101',
        title: 'Reset password via OTP',
        acceptanceCriteria: 'OTP expires in 5 min; lock after 5 retries',
        priority: 'High',
        status: 'In Progress',
        releaseContextId: params.releaseContextExternalId,
        sourceType: ToolType.DEMO
      }
    ];
  }
  async createTestCases(_: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    return payload.map((p, i) => ({ sourceRequirementExternalId: p.sourceRequirementExternalId, externalTestCaseId: `DEMO-TC-${100 + i}`, externalTestCaseKey: `DEMO-TC-${100 + i}`, success: true }));
  }
  async linkTestCasesToRequirements(_: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return payload.map((p) => ({ requirementExternalId: p.requirementExternalId, testCaseExternalId: p.testCaseExternalId, success: true }));
  }
}
