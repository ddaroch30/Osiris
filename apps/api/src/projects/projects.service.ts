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

type JiraBoard = { id: number; name?: string };
type JiraSprint = { id: number; state?: string; name?: string; startDate?: string; endDate?: string };

@Injectable()
export class ProjectsService {
  constructor(private readonly connections: ConnectionsService, private readonly factory: ConnectorFactory) {}

  private authHeader(username: string | null | undefined, secret: string) {
    return { Authorization: `Basic ${Buffer.from(`${username ?? ''}:${secret}`).toString('base64')}`, Accept: 'application/json' };
  }

  private normalizeBaseUrl(baseUrl: string) {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  private async resolveActiveSprint(baseUrl: string, headers: Record<string, string>, projectKey: string) {
    const boardCandidates: JiraBoard[] = [];

    const scopedBoardsRes = await fetch(`${baseUrl}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=50`, { headers });
    if (scopedBoardsRes.ok) {
      const scopedBoardsJson = await scopedBoardsRes.json() as { values?: JiraBoard[] };
      boardCandidates.push(...(scopedBoardsJson.values ?? []));
    }

    if (!boardCandidates.length) {
      const genericBoardsRes = await fetch(`${baseUrl}/rest/agile/1.0/board?type=scrum&maxResults=50`, { headers });
      if (genericBoardsRes.ok) {
        const genericBoardsJson = await genericBoardsRes.json() as { values?: JiraBoard[] };
        boardCandidates.push(...(genericBoardsJson.values ?? []));
      }
    }

    const seen = new Set<number>();
    const boards = boardCandidates.filter((board) => {
      if (seen.has(board.id)) return false;
      seen.add(board.id);
      return true;
    });

    console.log('[ProjectsService.resolveActiveSprint] checking boards for active sprint', {
      projectKey,
      boardCount: boards.length,
      boardIds: boards.map((b) => b.id)
    });

    for (const board of boards) {
      const sprintRes = await fetch(`${baseUrl}/rest/agile/1.0/board/${board.id}/sprint?state=active&maxResults=20`, { headers });
      if (!sprintRes.ok) {
        console.log('[ProjectsService.resolveActiveSprint] board sprint fetch failed', { boardId: board.id, status: sprintRes.status });
        continue;
      }

      const sprintJson = await sprintRes.json() as { values?: JiraSprint[] };
      const active = (sprintJson.values ?? []).find((sprint) => (sprint.state ?? '').toLowerCase() === 'active');

      if (active) {
        console.log('[ProjectsService.resolveActiveSprint] active sprint resolved', {
          projectKey,
          boardId: board.id,
          sprintId: active.id,
          sprintName: active.name
        });
        return { boardId: board.id, sprint: active };
      }
    }

    return null;
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

    const activeSprintResolution = await this.resolveActiveSprint(baseUrl, headers, projectKey);
    if (activeSprintResolution?.sprint) {
      const active = activeSprintResolution.sprint;
      const context = {
        type: 'SPRINT' as const,
        id: String(active.id),
        name: active.name ?? `Sprint ${active.id}`,
        state: 'ACTIVE',
        startDate: active.startDate,
        endDate: active.endDate
      };

      console.log('[ProjectsService.discoverPlanningContext] active sprint detected', {
        projectKey,
        boardId: activeSprintResolution.boardId,
        activeSprintId: active.id,
        activeSprintName: active.name,
        context
      });
      return context;
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

    let sprintId = contextType === 'SPRINT' ? contextId : undefined;
    let boardId: number | undefined;

    if (!sprintId) {
      const activeSprintResolution = await this.resolveActiveSprint(baseUrl, headers, projectKey);
      sprintId = activeSprintResolution?.sprint ? String(activeSprintResolution.sprint.id) : undefined;
      boardId = activeSprintResolution?.boardId;
    }

    if (sprintId) {
      const sprintIssuesRes = await fetch(`${baseUrl}/rest/agile/1.0/sprint/${encodeURIComponent(sprintId)}/issue?maxResults=100`, { headers });
      if (!sprintIssuesRes.ok) {
        console.log('[ProjectsService.listStories] sprint issue fetch failed', { projectKey, contextType, sprintId, status: sprintIssuesRes.status });
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
        boardId,
        activeSprintId: sprintId,
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

      jql = `project = ${projectKey} AND fixVersion = "${releaseName.replace(/"/g, '\\"')}" ORDER BY updated DESC`;
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
