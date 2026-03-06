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

const authHeader = (ctx: ConnectorContext) => ({ Authorization: `Basic ${Buffer.from(`${ctx.username}:${ctx.secret}`).toString('base64')}` });

export class JiraZephyrConnector implements TestManagementConnector {
  async validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    const res = await fetch(`${input.baseUrl}/rest/api/3/myself`, { headers: { ...authHeader(input), Accept: 'application/json' } });
    return { success: res.ok, message: res.ok ? 'Jira connection validated.' : `Jira validation failed (${res.status})` };
  }

  async listProjects(connection: ConnectorContext): Promise<ProjectDto[]> {
    const res = await fetch(`${connection.baseUrl}/rest/api/3/project/search`, { headers: { ...authHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json() as { values?: any[] };
    return (json.values ?? []).map((p) => ({ id: p.id, externalId: p.id, key: p.key, name: p.name, description: p.projectTypeKey, sourceType: ToolType.JIRA_ZEPHYR }));
  }

  async listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]> {
    const res = await fetch(`${connection.baseUrl}/rest/api/3/project/${projectId}/versions`, { headers: { ...authHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = (await res.json()) as any[];
    return json.map((v) => ({ id: v.id, externalId: v.id, name: v.name, type: 'VERSION', status: v.released ? 'RELEASED' : 'ACTIVE', startDate: v.startDate, endDate: v.releaseDate }));
  }

  async listRequirements(connection: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]> {
    const jql = encodeURIComponent(`project = ${params.projectExternalId} AND issuetype in (Story, Requirement)` + (params.releaseContextExternalId ? ` AND fixVersion = ${params.releaseContextExternalId}` : ''));
    const res = await fetch(`${connection.baseUrl}/rest/api/3/search?jql=${jql}&maxResults=50`, { headers: { ...authHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json() as { issues?: any[] };
    return (json.issues ?? []).map((i) => ({ id: i.id, externalId: i.id, key: i.key, title: i.fields?.summary ?? i.key, description: i.fields?.description?.content?.[0]?.content?.[0]?.text, acceptanceCriteria: i.fields?.customfield_10000, priority: i.fields?.priority?.name, status: i.fields?.status?.name, releaseContextId: params.releaseContextExternalId, sourceType: ToolType.JIRA_ZEPHYR, rawMetadata: { issueType: i.fields?.issuetype?.name } }));
  }

  async createTestCases(connection: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    // Assumption: Zephyr test cases are represented by Jira issues in project configured by metadataJson.testProjectKey.
    return Promise.all(payload.map(async (p) => {
      const projectKey = String(connection.metadataJson?.testProjectKey ?? connection.metadataJson?.projectKey ?? 'TEST');
      const res = await fetch(`${connection.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: { ...authHeader(connection), 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ fields: { project: { key: projectKey }, summary: p.title, description: `${p.preconditions}\nSteps:\n${p.steps.join('\n')}\nExpected:\n${p.expectedResult}`, issuetype: { name: 'Test' } } })
      });
      if (!res.ok) return { sourceRequirementExternalId: p.sourceRequirementExternalId, success: false, errorMessage: `Create failed: ${res.status}` };
      const j = await res.json() as any;
      return { sourceRequirementExternalId: p.sourceRequirementExternalId, externalTestCaseId: j.id, externalTestCaseKey: j.key, success: true };
    }));
  }

  async linkTestCasesToRequirements(connection: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/rest/api/3/issueLink`, {
        method: 'POST',
        headers: { ...authHeader(connection), 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: { name: 'Relates' }, inwardIssue: { id: p.requirementExternalId }, outwardIssue: { id: p.testCaseExternalId } })
      });
      return { requirementExternalId: p.requirementExternalId, testCaseExternalId: p.testCaseExternalId, success: res.ok, errorMessage: res.ok ? undefined : `Link failed: ${res.status}` };
    }));
  }
}
