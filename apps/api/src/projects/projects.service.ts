import { BadRequestException, Injectable } from '@nestjs/common';
import { ToolType } from '../common/enums';
import { ConnectionsService } from '../connections/connections.service';
import { ConnectorFactory } from '../integrations/factory/connector.factory';

type PlanningContextType = 'SPRINT' | 'RELEASE' | 'BACKLOG';

type PlanningContext = {
  type: PlanningContextType;
  id: string;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
};

type StoryDto = {
  id: string;
  key: string;
  title: string;
  status?: string;
  priority?: string;
};

type JiraIssueSearchResponse = {
  issues?: Array<{
    id: string;
    key: string;
    fields?: {
      summary?: string;
      status?: { name?: string };
      priority?: { name?: string };
    };
  }>;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly connections: ConnectionsService, private readonly factory: ConnectorFactory) {}

  private authHeader(username: string | null | undefined, secret: string) {
    return { Authorization: `Basic ${Buffer.from(`${username ?? ''}:${secret}`).toString('base64')}`, Accept: 'application/json' };
  }

  private normalizeBaseUrl(baseUrl: string) {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  async list(orgId: string, connectionId: string) {
    const conn = await this.connections.getInternal(orgId, connectionId);
    return this.factory.resolve(conn.toolType as ToolType).listProjects({ toolType: conn.toolType, baseUrl: conn.baseUrl, secondaryBaseUrl: conn.secondaryBaseUrl, username: conn.username, secret: conn.secret, metadataJson: conn.metadataJson });
  }

  async discoverPlanningContext(orgId: string, connectionId: string, projectKey: string): Promise<PlanningContext> {
    const conn = await this.connections.getInternal(orgId, connectionId);
    if (conn.toolType !== ToolType.JIRA) {
      throw new BadRequestException('Planning-context discovery currently supports Jira connections only.');
    }

    const baseUrl = this.normalizeBaseUrl(conn.baseUrl);
    const headers = this.authHeader(conn.username, conn.secret);

    const boardRes = await fetch(`${baseUrl}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=50`, { headers });
    if (boardRes.ok) {
      const boardsJson = await boardRes.json() as { values?: Array<{ id: number }> };
      const boards = boardsJson.values ?? [];

      const now = Date.now();
      const activeSprints: Array<{ id: number; name?: string; startDate?: string; endDate?: string }> = [];
      const futureSprints: Array<{ id: number; name?: string; startDate?: string; endDate?: string }> = [];

      for (const board of boards) {
        const sprintRes = await fetch(`${baseUrl}/rest/agile/1.0/board/${board.id}/sprint?state=active,future&maxResults=50`, { headers });
        if (!sprintRes.ok) continue;

        const sprintJson = await sprintRes.json() as {
          values?: Array<{ id: number; state?: string; name?: string; startDate?: string; endDate?: string }>;
        };

        for (const sprint of sprintJson.values ?? []) {
          const state = (sprint.state ?? '').toLowerCase();
          if (state === 'active') {
            activeSprints.push(sprint);
          } else if (state === 'future') {
            futureSprints.push(sprint);
          }
        }
      }

      if (activeSprints.length) {
        const active = activeSprints[0];
        return {
          type: 'SPRINT',
          id: String(active.id),
          name: active.name ?? `Sprint ${active.id}`,
          state: 'ACTIVE',
          startDate: active.startDate,
          endDate: active.endDate
        };
      }

      if (futureSprints.length) {
        const nearestFuture = [...futureSprints].sort((a, b) => {
          const aTs = a.startDate ? Date.parse(a.startDate) : Number.MAX_SAFE_INTEGER;
          const bTs = b.startDate ? Date.parse(b.startDate) : Number.MAX_SAFE_INTEGER;
          const aNorm = Number.isFinite(aTs) && aTs >= now ? aTs : Number.MAX_SAFE_INTEGER;
          const bNorm = Number.isFinite(bTs) && bTs >= now ? bTs : Number.MAX_SAFE_INTEGER;
          return aNorm - bNorm;
        })[0] ?? futureSprints[0];

        return {
          type: 'SPRINT',
          id: String(nearestFuture.id),
          name: nearestFuture.name ?? `Sprint ${nearestFuture.id}`,
          state: 'FUTURE',
          startDate: nearestFuture.startDate,
          endDate: nearestFuture.endDate
        };
      }
    }

    const versionsRes = await fetch(`${baseUrl}/rest/api/3/project/${encodeURIComponent(projectKey)}/versions`, { headers });
    if (versionsRes.ok) {
      const versions = await versionsRes.json() as Array<{ id: string | number; name?: string; released?: boolean; startDate?: string; releaseDate?: string }>;
      const unreleased = versions.filter((v) => !v.released);
      if (unreleased.length) {
        const latest = [...unreleased].sort((a, b) => {
          const aTs = a.releaseDate ? Date.parse(a.releaseDate) : 0;
          const bTs = b.releaseDate ? Date.parse(b.releaseDate) : 0;
          return bTs - aTs;
        })[0];

        return {
          type: 'RELEASE',
          id: String(latest.id),
          name: latest.name ?? `Version ${latest.id}`,
          state: 'UNRELEASED',
          startDate: latest.startDate,
          endDate: latest.releaseDate
        };
      }
    }

    return {
      type: 'BACKLOG',
      id: projectKey,
      name: `${projectKey} Backlog`,
      state: 'OPEN'
    };
  }

  async listStories(orgId: string, connectionId: string, projectKey: string, contextType: PlanningContextType, contextId?: string): Promise<StoryDto[]> {
    const conn = await this.connections.getInternal(orgId, connectionId);
    if (conn.toolType !== ToolType.JIRA) {
      throw new BadRequestException('Story discovery currently supports Jira connections only.');
    }

    const baseUrl = this.normalizeBaseUrl(conn.baseUrl);
    const headers = this.authHeader(conn.username, conn.secret);

    if (contextType === 'SPRINT' && contextId) {
      const sprintIssuesRes = await fetch(`${baseUrl}/rest/agile/1.0/sprint/${encodeURIComponent(contextId)}/issue?maxResults=100&jql=${encodeURIComponent('issuetype in (Story)')}`, { headers });
      if (!sprintIssuesRes.ok) return [];
      const json = await sprintIssuesRes.json() as JiraIssueSearchResponse;
      return (json.issues ?? []).map((issue) => ({ id: issue.id, key: issue.key, title: issue.fields?.summary ?? issue.key, status: issue.fields?.status?.name, priority: issue.fields?.priority?.name }));
    }

    const jql = contextType === 'RELEASE' && contextId
      ? `project = ${projectKey} AND fixVersion = ${contextId} AND issuetype in (Story) ORDER BY updated DESC`
      : `project = ${projectKey} AND issuetype in (Story) AND statusCategory != Done ORDER BY updated DESC`;

    const searchRes = await fetch(`${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100`, { headers });
    if (!searchRes.ok) return [];
    const json = await searchRes.json() as JiraIssueSearchResponse;
    return (json.issues ?? []).map((issue) => ({ id: issue.id, key: issue.key, title: issue.fields?.summary ?? issue.key, status: issue.fields?.status?.name, priority: issue.fields?.priority?.name }));
  }
}
