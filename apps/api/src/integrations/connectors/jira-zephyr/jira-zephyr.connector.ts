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

const jiraAuthHeader = (ctx: ConnectorContext) => ({
  Authorization: `Basic ${Buffer.from(`${ctx.username ?? ''}:${ctx.secret}`).toString('base64')}`
});

const zephyrBaseUrl = (ctx: ConnectorContext) => ctx.secondaryBaseUrl ?? 'https://prod-api.zephyr4jiracloud.com';
const zephyrAuthHeader = (ctx: ConnectorContext) => ({ Authorization: `Bearer ${ctx.secret}`, Accept: 'application/json' });

export class JiraZephyrConnector implements TestManagementConnector {
  async validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    const jira = await fetch(`${input.baseUrl}/rest/api/3/myself`, { headers: { ...jiraAuthHeader(input), Accept: 'application/json' } });

    // Zephyr Cloud API uses prod-api base URL + bearer token (no username/email).
    const zBase = zephyrBaseUrl(input);
    const zephyr = await fetch(`${zBase}/connect/public/rest/api/1.0/util/versionBoard`, { headers: { ...zephyrAuthHeader(input) } });

    if (jira.ok && zephyr.ok) return { success: true, message: 'Jira and Zephyr connections validated.' };
    if (!jira.ok && !zephyr.ok) return { success: false, message: `Jira (${jira.status}) and Zephyr (${zephyr.status}) validation failed.` };
    if (!jira.ok) return { success: false, message: `Jira validation failed (${jira.status}). Zephyr is reachable.` };
    return { success: false, message: `Jira is reachable, Zephyr validation failed (${zephyr.status}).` };
  }

  async listProjects(connection: ConnectorContext): Promise<ProjectDto[]> {
    const res = await fetch(`${connection.baseUrl}/rest/api/3/project/search`, { headers: { ...jiraAuthHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json() as { values?: any[] };
    return (json.values ?? []).map((p) => ({ id: p.id, externalId: p.id, key: p.key, name: p.name, description: p.projectTypeKey, sourceType: ToolType.JIRA_ZEPHYR }));
  }

  async listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]> {
    const res = await fetch(`${connection.baseUrl}/rest/api/3/project/${projectId}/versions`, { headers: { ...jiraAuthHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = (await res.json()) as any[];
    return json.map((v) => ({ id: v.id, externalId: v.id, name: v.name, type: 'VERSION', status: v.released ? 'RELEASED' : 'ACTIVE', startDate: v.startDate, endDate: v.releaseDate }));
  }

  async listRequirements(connection: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]> {
    const jql = encodeURIComponent(`project = ${params.projectExternalId} AND issuetype in (Story, Requirement)` + (params.releaseContextExternalId ? ` AND fixVersion = ${params.releaseContextExternalId}` : ''));
    const res = await fetch(`${connection.baseUrl}/rest/api/3/search?jql=${jql}&maxResults=50`, { headers: { ...jiraAuthHeader(connection), Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json() as { issues?: any[] };
    return (json.issues ?? []).map((i) => ({ id: i.id, externalId: i.id, key: i.key, title: i.fields?.summary ?? i.key, description: i.fields?.description?.content?.[0]?.content?.[0]?.text, acceptanceCriteria: i.fields?.customfield_10000, priority: i.fields?.priority?.name, status: i.fields?.status?.name, releaseContextId: params.releaseContextExternalId, sourceType: ToolType.JIRA_ZEPHYR, rawMetadata: { issueType: i.fields?.issuetype?.name } }));
  }

  async createTestCases(connection: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    const zBase = zephyrBaseUrl(connection);
    return Promise.all(payload.map(async (p) => {
      // Zephyr API payloads vary by tenant/config; this POC uses a lightweight canonical mapping.
      const res = await fetch(`${zBase}/connect/public/rest/api/1.0/testcase`, {
        method: 'POST',
        headers: { ...zephyrAuthHeader(connection), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.title,
          objective: p.expectedResult,
          precondition: p.preconditions,
          testScript: p.steps.map((step) => ({ description: step, expectedResult: p.expectedResult })),
          labels: [p.sourceRequirementKey],
          priorityName: p.priority
        })
      });
      if (!res.ok) return { sourceRequirementExternalId: p.sourceRequirementExternalId, success: false, errorMessage: `Zephyr create failed: ${res.status}` };
      const j = await res.json() as any;
      return { sourceRequirementExternalId: p.sourceRequirementExternalId, externalTestCaseId: String(j.id ?? j.testcaseId), externalTestCaseKey: j.key ?? j.testcaseKey, success: true };
    }));
  }

  async linkTestCasesToRequirements(connection: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/rest/api/3/issueLink`, {
        method: 'POST',
        headers: { ...jiraAuthHeader(connection), 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: { name: 'Relates' }, inwardIssue: { id: p.requirementExternalId }, outwardIssue: { id: p.testCaseExternalId } })
      });
      return { requirementExternalId: p.requirementExternalId, testCaseExternalId: p.testCaseExternalId, success: res.ok, errorMessage: res.ok ? undefined : `Jira link failed: ${res.status}` };
    }));
  }
}
