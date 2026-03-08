import { ToolType } from '../../../common/enums';
import { ConnectionValidationResult, ConnectorContext, CreateExternalTestCaseInput, CreateExternalTestCaseResult, LinkResult, ListRequirementsInput, ProjectDto, ReleaseContextDto, RequirementDto, RequirementTestCaseLinkInput, TestManagementConnector, ValidateConnectionInput } from '../../interfaces/test-management-connector';

const authHeader = (ctx: ConnectorContext) => ({ Authorization: `Bearer ${ctx.secret}`, 'Content-Type': 'application/json' });

export class QTestConnector implements TestManagementConnector {
  async validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    const res = await fetch(`${input.baseUrl}/api/v3/projects`, { headers: { ...authHeader(input) } });
    return { success: res.ok, message: res.ok ? 'qTest connection validated.' : `qTest validation failed (${res.status})` };
  }
  async listProjects(connection: ConnectorContext): Promise<ProjectDto[]> {
    const res = await fetch(`${connection.baseUrl}/api/v3/projects`, { headers: { ...authHeader(connection) } });
    if (!res.ok) return [];
    const arr = await res.json() as any[];
    return arr.map((p) => ({ id: String(p.id), externalId: String(p.id), key: p.pid ?? String(p.id), name: p.name, description: p.description, sourceType: ToolType.QTEST }));
  }
  async listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]> {
    const res = await fetch(`${connection.baseUrl}/api/v3/projects/${projectId}/releases`, { headers: { ...authHeader(connection) } });
    if (!res.ok) return [];
    const arr = await res.json() as any[];
    return arr.map((r) => ({ id: String(r.id), externalId: String(r.id), name: r.name, type: 'RELEASE', status: r.status?.name, startDate: r.start_date, endDate: r.end_date }));
  }
  async listRequirements(connection: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]> {
    const url = `${connection.baseUrl}/api/v3/projects/${params.projectExternalId}/requirements`;
    const res = await fetch(url, { headers: { ...authHeader(connection) } });
    if (!res.ok) return [];
    const arr = await res.json() as any[];
    return arr.map((r) => ({ id: String(r.id), externalId: String(r.id), key: r.pid ?? String(r.id), title: r.name, description: r.description, acceptanceCriteria: r.note, priority: r.priority?.name, status: r.status?.name, releaseContextId: params.releaseContextExternalId, sourceType: ToolType.QTEST, rawMetadata: r }));
  }
  async createTestCases(connection: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/api/v3/projects/${connection.metadataJson?.projectId}/test-cases`, { method: 'POST', headers: { ...authHeader(connection) }, body: JSON.stringify({ name: p.title, precondition: p.preconditions, description: p.expectedResult }) });
      if (!res.ok) return { sourceRequirementExternalId: p.sourceRequirementExternalId, success: false, errorMessage: `Create failed ${res.status}` };
      const j = await res.json() as any;
      return { sourceRequirementExternalId: p.sourceRequirementExternalId, externalTestCaseId: String(j.id), externalTestCaseKey: j.pid, success: true };
    }));
  }
  async linkTestCasesToRequirements(connection: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/api/v3/projects/${connection.metadataJson?.projectId}/requirements/${p.requirementExternalId}/link`, { method: 'POST', headers: { ...authHeader(connection) }, body: JSON.stringify({ test_case_id: p.testCaseExternalId }) });
      return { requirementExternalId: p.requirementExternalId, testCaseExternalId: p.testCaseExternalId, success: res.ok, errorMessage: res.ok ? undefined : `Link failed ${res.status}` };
    }));
  }
}
