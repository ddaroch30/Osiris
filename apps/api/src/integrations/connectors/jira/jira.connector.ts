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

const authHeader = (ctx: ConnectorContext) => ({ Authorization: `Basic ${Buffer.from(`${ctx.username ?? ''}:${ctx.secret}`).toString('base64')}` });
const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, '');

export class JiraConnector implements TestManagementConnector {
  async validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    const requestUrl = `${normalizeBaseUrl(input.baseUrl)}/rest/api/3/project`;
    const res = await fetch(requestUrl, { method: 'GET', headers: { ...authHeader(input), Accept: 'application/json' } });

    let projectCount: number | undefined;
    try {
      const body = await res.json() as unknown;
      if (Array.isArray(body)) {
        projectCount = body.length;
      }
    } catch {
      projectCount = undefined;
    }

    console.debug('[JiraConnector.validateConnection]', {
      requestUrl,
      authMode: 'BASIC',
      status: res.status
    });

    return {
      success: res.status === 200,
      message: res.status === 200 ? 'Jira validation succeeded' : `Jira validation failed (${res.status})`,
      projectCount
    };
  }

  async listProjects(connection: ConnectorContext): Promise<ProjectDto[]> {
    const res = await fetch(`${connection.baseUrl}/rest/api/3/project/search`, { headers: { ...authHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json() as { values?: any[] };
    return (json.values ?? []).map((p) => ({ id: p.id, externalId: p.id, key: p.key, name: p.name, description: p.projectTypeKey, sourceType: ToolType.JIRA }));
  }

  async listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]> {
    const res = await fetch(`${connection.baseUrl}/rest/api/3/project/${projectId}/versions`, { headers: { ...authHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json() as any[];
    return json.map((v) => ({ id: String(v.id), externalId: String(v.id), name: v.name, type: 'VERSION', status: v.released ? 'RELEASED' : 'ACTIVE', startDate: v.startDate, endDate: v.releaseDate }));
  }

  async listRequirements(connection: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]> {
    const jql = encodeURIComponent(`project = ${params.projectExternalId} AND issuetype in (Story, Requirement)` + (params.releaseContextExternalId ? ` AND fixVersion = ${params.releaseContextExternalId}` : ''));
    const res = await fetch(`${connection.baseUrl}/rest/api/3/search?jql=${jql}&maxResults=50`, { headers: { ...authHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json() as { issues?: any[] };
    return (json.issues ?? []).map((i) => ({ id: i.id, externalId: i.id, key: i.key, title: i.fields?.summary ?? i.key, description: i.fields?.description?.content?.[0]?.content?.[0]?.text, acceptanceCriteria: i.fields?.customfield_10000, priority: i.fields?.priority?.name, status: i.fields?.status?.name, releaseContextId: params.releaseContextExternalId, sourceType: ToolType.JIRA, rawMetadata: { issueType: i.fields?.issuetype?.name } }));
  }

  async createTestCases(_: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    // Jira is requirement source in this POC, not primary test-case target.
    return payload.map((p) => ({ sourceRequirementExternalId: p.sourceRequirementExternalId, success: false, errorMessage: 'Jira connector does not create test cases in this workflow. Use Zephyr Essential target.' }));
  }

  async linkTestCasesToRequirements(connection: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/rest/api/3/issueLink`, {
        method: 'POST',
        headers: { ...authHeader(connection), 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: { name: 'Relates' }, inwardIssue: { id: p.requirementExternalId }, outwardIssue: { id: p.testCaseExternalId } })
      });
      return { requirementExternalId: p.requirementExternalId, testCaseExternalId: p.testCaseExternalId, success: res.ok, errorMessage: res.ok ? undefined : `Jira link failed: ${res.status}` };
    }));
  }
}
