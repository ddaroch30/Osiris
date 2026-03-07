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

const authHeader = (ctx: ConnectorContext) => ({ Authorization: `Bearer ${ctx.secret}`, Accept: 'application/json' });

const stripTrailingSlashes = (value: string): string => value.trim().replace(/\/+$/, '');

const buildProjectsUrl = (baseUrl: string): string => {
  const normalized = stripTrailingSlashes(baseUrl);
  if (normalized.toLowerCase().endsWith('/projects')) {
    return normalized;
  }

  return `${normalized}/projects`;
};

type ZephyrProjectsResponse = {
  values?: Array<{ key?: string }>;
  isLast?: boolean;
};

export class ZephyrEssentialConnector implements TestManagementConnector {
  async validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    const requestUrl = buildProjectsUrl(input.baseUrl);
    const res = await fetch(requestUrl, { method: 'GET', headers: { ...authHeader(input) } });

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    const parsed = (body ?? {}) as ZephyrProjectsResponse;
    const projectKeys = (parsed.values ?? []).map((project) => project.key).filter((key): key is string => typeof key === 'string' && key.length > 0);
    const projectCount = parsed.values?.length ?? 0;

    console.debug('[ZephyrEssentialConnector.validateConnection]', {
      requestUrl,
      status: res.status,
      responseSummary: {
        hasValuesArray: Array.isArray(parsed.values),
        projectCount,
        sampleProjectKeys: projectKeys.slice(0, 5)
      }
    });

    if (res.status === 200 && Array.isArray(parsed.values)) {
      return {
        success: true,
        message: 'Zephyr Essential connection validated.',
        projectCount,
        projectKeys
      };
    }

    return {
      success: false,
      message: `Zephyr Essential validation failed (${res.status})`
    };
  }

  async listProjects(connection: ConnectorContext): Promise<ProjectDto[]> {
    const res = await fetch(`${connection.baseUrl}/connect/public/rest/api/1.0/project`, { headers: { ...authHeader(connection) } });
    if (!res.ok) return [];
    const arr = await res.json() as any[];
    return arr.map((p) => ({ id: String(p.id), externalId: String(p.id), key: p.key ?? String(p.id), name: p.name, description: p.description, sourceType: ToolType.ZEPHYR_ESSENTIAL }));
  }

  async listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]> {
    const res = await fetch(`${connection.baseUrl}/connect/public/rest/api/1.0/cycle?projectId=${projectId}`, { headers: { ...authHeader(connection) } });
    if (!res.ok) return [];
    const arr = await res.json() as any[];
    return arr.map((x) => ({ id: String(x.id), externalId: String(x.id), name: x.name, type: 'CYCLE', status: x.status, startDate: x.startDate, endDate: x.endDate }));
  }

  async listRequirements(_: ConnectorContext, _params: ListRequirementsInput): Promise<RequirementDto[]> {
    return [];
  }

  async createTestCases(connection: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    return Promise.all(payload.map(async (p) => {
      const res = await fetch(`${connection.baseUrl}/connect/public/rest/api/1.0/testcase`, {
        method: 'POST',
        headers: { ...authHeader(connection), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: p.title, objective: p.expectedResult, precondition: p.preconditions, testScript: p.steps.map((s) => ({ description: s, expectedResult: p.expectedResult })), labels: [p.sourceRequirementKey], priorityName: p.priority })
      });
      if (!res.ok) return { sourceRequirementExternalId: p.sourceRequirementExternalId, success: false, errorMessage: `Zephyr Essential create failed: ${res.status}` };
      const j = await res.json() as any;
      return { sourceRequirementExternalId: p.sourceRequirementExternalId, externalTestCaseId: String(j.id ?? j.testcaseId), externalTestCaseKey: j.key ?? j.testcaseKey, success: true };
    }));
  }

  async linkTestCasesToRequirements(_: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return payload.map((p) => ({ requirementExternalId: p.requirementExternalId, testCaseExternalId: p.testCaseExternalId, success: true }));
  }
}
