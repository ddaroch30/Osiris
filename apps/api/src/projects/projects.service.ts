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
      issuetype?: { name?: string };
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

    console.log('[ProjectsService.discoverPlanningContext] detecting context', { orgId, connectionId, projectKey });
    const boardRes = await fetch(`${baseUrl}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=50`, { headers });
    if (boardRes.ok) {
      const boardsJson = await boardRes.json() as { values?: Array<{ id: number; name?: string }> };
      const boards = boardsJson.values ?? [];
      console.log('[ProjectsService.discoverPlanningContext] boards resolved', {
        projectKey,
        boardCount: boards.length,
        boardIds: boards.map((b) => b.id)
      });

      const activeSprints: Array<{ boardId: number; id: number; name?: string; startDate?: string; endDate?: string }> = [];
      const latestSprints: Array<{ boardId: number; id: number; name?: string; startDate?: string; endDate?: string }> = [];

      for (const board of boards) {
        const sprintRes = await fetch(`${baseUrl}/rest/agile/1.0/board/${board.id}/sprint?state=active,future,closed&maxResults=50`, { headers });
        if (!sprintRes.ok) {
          console.log('[ProjectsService.discoverPlanningContext] board sprint fetch failed', { boardId: board.id, status: sprintRes.status });
          continue;
        }

        const sprintJson = await sprintRes.json() as {
          values?: Array<{ id: number; state?: string; name?: string; startDate?: string; endDate?: string }>;
        };

        for (const sprint of sprintJson.values ?? []) {
          const state = (sprint.state ?? '').toLowerCase();
          if (state === 'active') {
            activeSprints.push({ ...sprint, boardId: board.id });
          } else if (state === 'future' || state === 'closed') {
            latestSprints.push({ ...sprint, boardId: board.id });
          }
        }
      }

      if (activeSprints.length) {
        const active = activeSprints[0];
        const context = {
          type: 'SPRINT' as const,
          id: String(active.id),
          name: active.name ?? `Sprint ${active.id}`,
          state: 'ACTIVE',
          startDate: active.startDate,
          endDate: active.endDate
        };
        console.log('[ProjectsService.discoverPlanningContext] active sprint detected', {
          boardId: active.boardId,
          activeSprintId: active.id,
          activeSprintName: active.name,
          context
        });
        return context;
      }

      if (latestSprints.length) {
        const latestSprint = [...latestSprints].sort((a, b) => {
          const aTs = Date.parse(a.endDate ?? a.startDate ?? '1970-01-01T00:00:00Z');
          const bTs = Date.parse(b.endDate ?? b.startDate ?? '1970-01-01T00:00:00Z');
          return bTs - aTs;
        })[0] ?? latestSprints[0];

        const context = {
          type: 'SPRINT' as const,
          id: String(latestSprint.id),
          name: latestSprint.name ?? `Sprint ${latestSprint.id}`,
          state: 'LATEST',
          startDate: latestSprint.startDate,
          endDate: latestSprint.endDate
        };
        console.log('[ProjectsService.discoverPlanningContext] latest sprint detected', {
          boardId: latestSprint.boardId,
          latestSprintId: latestSprint.id,
          latestSprintName: latestSprint.name,
          context
        });
        return context;
      }
    } else {
      console.log('[ProjectsService.discoverPlanningContext] board lookup failed', { status: boardRes.status, projectKey });
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

        const context = {
          type: 'RELEASE' as const,
          id: String(latest.id),
          name: latest.name ?? `Version ${latest.id}`,
          state: 'UNRELEASED',
          startDate: latest.startDate,
          endDate: latest.releaseDate
        };
        console.log('[ProjectsService.discoverPlanningContext] release context detected', context);
        return context;
      }
    }

    const context = {
      type: 'BACKLOG' as const,
      id: projectKey,
      name: `${projectKey} Backlog`,
      state: 'OPEN'
    };
    console.log('[ProjectsService.discoverPlanningContext] backlog context detected', context);
    return context;
  }

  async listStories(orgId: string, connectionId: string, projectKey: string, contextType: PlanningContextType, contextId?: string): Promise<StoryDto[]> {
    const conn = await this.connections.getInternal(orgId, connectionId);
    if (conn.toolType !== ToolType.JIRA) {
      throw new BadRequestException('Story discovery currently supports Jira connections only.');
    }

    const baseUrl = this.normalizeBaseUrl(conn.baseUrl);
    const headers = this.authHeader(conn.username, conn.secret);

    console.log('[ProjectsService.listStories] fetching stories', { orgId, connectionId, projectKey, contextType, contextId });

    if (contextType === 'SPRINT' && contextId) {
      const sprintIssuesRes = await fetch(`${baseUrl}/rest/agile/1.0/sprint/${encodeURIComponent(contextId)}/issue?maxResults=100`, { headers });
      if (!sprintIssuesRes.ok) {
        console.log('[ProjectsService.listStories] sprint issue fetch failed', { contextId, status: sprintIssuesRes.status });
        return [];
      }

      const json = await sprintIssuesRes.json() as JiraIssueSearchResponse;
      const issues = json.issues ?? [];
      const issueTypes = Array.from(new Set(issues.map((issue) => issue.fields?.issuetype?.name ?? 'Unknown')));
      const stories = issues.map((issue) => ({
        id: issue.id,
        key: issue.key,
        title: issue.fields?.summary ?? issue.key,
        status: issue.fields?.status?.name,
        priority: issue.fields?.priority?.name
      }));

      console.log('[ProjectsService.listStories] sprint issues fetched', {
        projectKey,
        contextType,
        sprintId: contextId,
        rawIssueCount: issues.length,
        distinctIssueTypes: issueTypes,
        mappedCount: stories.length
      });
      return stories;
    }

    let jql = `project = ${projectKey} AND statusCategory != Done ORDER BY updated DESC`;

    if (contextType === 'RELEASE' && contextId) {
      let releaseName = contextId;
      const versionsRes = await fetch(`${baseUrl}/rest/api/3/project/${encodeURIComponent(projectKey)}/versions`, { headers });
      if (versionsRes.ok) {
        const versions = await versionsRes.json() as Array<{ id: string | number; name?: string }>;
        const found = versions.find((v) => String(v.id) === String(contextId));
        if (found?.name) {
          releaseName = found.name;
        }
      }

      jql = `project = ${projectKey} AND fixVersion = "${releaseName.replace(/"/g, '\"')}" ORDER BY updated DESC`;
    }

    const searchRes = await fetch(`${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100`, { headers });
    if (!searchRes.ok) {
      console.log('[ProjectsService.listStories] search fetch failed', { contextType, status: searchRes.status });
      return [];
    }

    const json = await searchRes.json() as JiraIssueSearchResponse;
    const issues = json.issues ?? [];
    const issueTypes = Array.from(new Set(issues.map((issue) => issue.fields?.issuetype?.name ?? 'Unknown')));
    const stories = issues.map((issue) => ({
      id: issue.id,
      key: issue.key,
      title: issue.fields?.summary ?? issue.key,
      status: issue.fields?.status?.name,
      priority: issue.fields?.priority?.name
    }));

    console.log('[ProjectsService.listStories] issues fetched', {
      projectKey,
      contextType,
      rawIssueCount: issues.length,
      distinctIssueTypes: issueTypes,
      mappedCount: stories.length
    });
    return stories;
  }

}
