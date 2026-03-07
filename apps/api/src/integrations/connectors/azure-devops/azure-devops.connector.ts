import { ToolType } from '../../../common/enums';
import { ConnectionValidationResult, ConnectorContext, CreateExternalTestCaseInput, CreateExternalTestCaseResult, LinkResult, ListRequirementsInput, ProjectDto, ReleaseContextDto, RequirementDto, RequirementTestCaseLinkInput, TestManagementConnector, ValidateConnectionInput } from '../../interfaces/test-management-connector';

const authHeader = (ctx: ConnectorContext) => ({ Authorization: `Basic ${Buffer.from(`:${ctx.secret}`).toString('base64')}` });

export class AzureDevOpsConnector implements TestManagementConnector {
  async validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    const res = await fetch(`${input.baseUrl}/_apis/projects?api-version=7.0`, { headers: { ...authHeader(input) } });
    return { success: res.ok, message: res.ok ? 'Azure DevOps connection validated.' : `ADO validation failed (${res.status})` };
  }
  async listProjects(connection: ConnectorContext): Promise<ProjectDto[]> {
    const res = await fetch(`${connection.baseUrl}/_apis/projects?api-version=7.0`, { headers: { ...authHeader(connection) } });
    if (!res.ok) return [];
    const json = await res.json() as { value?: any[] };
    return (json.value ?? []).map((p) => ({ id: p.id, externalId: p.id, key: p.name, name: p.name, description: p.description, sourceType: ToolType.AZURE_DEVOPS }));
  }
  async listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]> {
    const res = await fetch(`${connection.baseUrl}/${projectId}/_apis/work/teamsettings/iterations?api-version=7.0`, { headers: { ...authHeader(connection) } });
    if (!res.ok) return [];
    const json = await res.json() as { value?: any[] };
    return (json.value ?? []).map((i) => ({ id: i.id, externalId: i.id, name: i.name, type: 'ITERATION', status: i.attributes?.timeFrame, startDate: i.attributes?.startDate, endDate: i.attributes?.finishDate }));
  }
  async listRequirements(connection: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]> {
    const wiqlRes = await fetch(`${connection.baseUrl}/${params.projectExternalId}/_apis/wit/wiql?api-version=7.0`, {
      method: 'POST', headers: { ...authHeader(connection), 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "Select [System.Id] From WorkItems Where [System.WorkItemType] In ('User Story','Product Backlog Item')" })
    });
    if (!wiqlRes.ok) return [];
    const wiql = await wiqlRes.json() as { workItems?: Array<{ id: number }> };
    if (!(wiql.workItems?.length)) return [];
    const ids = wiql.workItems.map((x) => x.id).join(',');
    const wiRes = await fetch(`${connection.baseUrl}/_apis/wit/workitems?ids=${ids}&api-version=7.0`, { headers: { ...authHeader(connection) } });
    if (!wiRes.ok) return [];
    const wi = await wiRes.json() as { value?: any[] };
    return (wi.value ?? []).map((w) => ({ id: String(w.id), externalId: String(w.id), key: String(w.id), title: w.fields['System.Title'], description: w.fields['System.Description'], acceptanceCriteria: w.fields['Microsoft.VSTS.Common.AcceptanceCriteria'], priority: String(w.fields['Microsoft.VSTS.Common.Priority'] ?? ''), status: w.fields['System.State'], releaseContextId: params.releaseContextExternalId, sourceType: ToolType.AZURE_DEVOPS }));
  }
  async createTestCases(connection: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/_apis/wit/workitems/$Test%20Case?api-version=7.0`, {
        method: 'POST',
        headers: { ...authHeader(connection), 'Content-Type': 'application/json-patch+json' },
        body: JSON.stringify([
          { op: 'add', path: '/fields/System.Title', value: p.title },
          { op: 'add', path: '/fields/Microsoft.VSTS.TCM.Steps', value: p.steps.join('\n') },
          { op: 'add', path: '/fields/System.Description', value: `${p.preconditions}\n${p.expectedResult}` }
        ])
      });
      if (!res.ok) return { sourceRequirementExternalId: p.sourceRequirementExternalId, success: false, errorMessage: `Create failed ${res.status}` };
      const j = await res.json() as any;
      return { sourceRequirementExternalId: p.sourceRequirementExternalId, externalTestCaseId: String(j.id), externalTestCaseKey: String(j.id), success: true };
    }));
  }
  async linkTestCasesToRequirements(connection: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/_apis/wit/workitems/${p.testCaseExternalId}?api-version=7.0`, {
        method: 'PATCH', headers: { ...authHeader(connection), 'Content-Type': 'application/json-patch+json' },
        body: JSON.stringify([{ op: 'add', path: '/relations/-', value: { rel: 'System.LinkTypes.Hierarchy-Reverse', url: `${connection.baseUrl}/_apis/wit/workItems/${p.requirementExternalId}` } }])
      });
      return { requirementExternalId: p.requirementExternalId, testCaseExternalId: p.testCaseExternalId, success: res.ok, errorMessage: res.ok ? undefined : `Link failed ${res.status}` };
    }));
  }
}
