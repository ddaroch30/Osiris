import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ProjectsService } from '../projects/projects.service';
import { ToolType } from '../common/enums';

type PlanningContextType = 'SPRINT' | 'RELEASE' | 'BACKLOG';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService, private readonly projects: ProjectsService) {}

  async list(organizationId: string) {
    console.log('[WorkspacesService.list] loading workspaces', { organizationId });

    try {
      const rows = await this.prisma.workspace.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
      console.log('[WorkspacesService.list] loaded workspaces', { organizationId, count: rows.length });
      return rows;
    } catch (error) {
      console.error('[WorkspacesService.list] workspace query failed', {
        organizationId,
        error: error instanceof Error ? error.message : String(error)
      });

      const knownError = error instanceof PrismaClientKnownRequestError ? error : null;
      if (knownError?.code === 'P2021') {
        console.warn('[WorkspacesService.list] Workspace table missing in database, returning empty list as temporary fallback');
        return [];
      }

      throw error;
    }
  }

  async get(organizationId: string, id: string) {
    const row = await this.prisma.workspace.findFirst({ where: { id, organizationId } });
    if (!row) throw new NotFoundException('Workspace not found');
    return row;
  }

  async create(
    organizationId: string,
    input: {
      name: string;
      jiraConnectionId: string;
      targetConnectionId: string;
      projectKey: string;
      planningContextType?: PlanningContextType;
      planningContextExternalId?: string;
      planningContextName?: string;
    }
  ) {
    console.log('[WorkspacesService.create] creating workspace', {
      organizationId,
      name: input.name,
      jiraConnectionId: input.jiraConnectionId,
      targetConnectionId: input.targetConnectionId,
      projectKey: input.projectKey
    });

    if (!input.name || !input.jiraConnectionId || !input.targetConnectionId || !input.projectKey) {
      throw new BadRequestException('name, jiraConnectionId, targetConnectionId and projectKey are required');
    }

    const [jiraConnection, targetConnection] = await Promise.all([
      this.prisma.clientConnection.findFirst({ where: { id: input.jiraConnectionId, organizationId } }),
      this.prisma.clientConnection.findFirst({ where: { id: input.targetConnectionId, organizationId } })
    ]);

    if (!jiraConnection) {
      throw new BadRequestException('jiraConnectionId does not map to an existing connection in this organization.');
    }

    if (jiraConnection.toolType !== ToolType.JIRA) {
      throw new BadRequestException('jiraConnectionId must reference a Jira connection.');
    }

    if (!targetConnection) {
      throw new BadRequestException('targetConnectionId does not map to an existing connection in this organization.');
    }

    const planning = input.planningContextType && input.planningContextExternalId && input.planningContextName
      ? { type: input.planningContextType, id: input.planningContextExternalId, name: input.planningContextName }
      : await this.projects.discoverPlanningContext(organizationId, input.jiraConnectionId, input.projectKey);

    if (!planning.id || !planning.name) {
      throw new BadRequestException('Unable to determine planning context for this workspace.');
    }

    try {
      const row = await this.prisma.workspace.create({
        data: {
          organizationId,
          name: input.name,
          jiraConnectionId: input.jiraConnectionId,
          targetConnectionId: input.targetConnectionId,
          projectKey: input.projectKey,
          planningContextType: planning.type,
          planningContextExternalId: planning.id,
          planningContextName: planning.name,
          status: 'ACTIVE'
        }
      });

      console.log('[WorkspacesService.create] workspace created', { organizationId, workspaceId: row.id });
      return row;
    } catch (error) {
      console.error('[WorkspacesService.create] workspace create failed', {
        organizationId,
        error: error instanceof Error ? error.message : String(error)
      });

      const knownError = error instanceof PrismaClientKnownRequestError ? error : null;
      if (knownError?.code === 'P2003') {
        throw new BadRequestException('Invalid connection IDs supplied for workspace creation.');
      }

      if (knownError?.code === 'P2021') {
        throw new BadRequestException('Workspace table is missing. Run Prisma migrations and retry.');
      }

      throw error;
    }
  }

  async selectPlanningContext(
    organizationId: string,
    id: string,
    input: { projectKey: string; planningContextType: PlanningContextType; planningContextExternalId: string; planningContextName: string }
  ) {
    await this.get(organizationId, id);
    return this.prisma.workspace.update({
      where: { id },
      data: {
        projectKey: input.projectKey,
        planningContextType: input.planningContextType,
        planningContextExternalId: input.planningContextExternalId,
        planningContextName: input.planningContextName
      }
    });
  }

  async syncRequirements(organizationId: string, workspaceId: string) {
    const workspace = await this.get(organizationId, workspaceId);
    const contextType = workspace.planningContextType as PlanningContextType;

    console.log('[WorkspacesService.syncRequirements] starting sync', {
      organizationId,
      workspaceId,
      projectKey: workspace.projectKey,
      contextType,
      contextId: workspace.planningContextExternalId
    });

    const stories = await this.projects.listStories(
      organizationId,
      workspace.jiraConnectionId,
      workspace.projectKey,
      contextType,
      workspace.planningContextExternalId
    );

    console.log('[WorkspacesService.syncRequirements] stories fetched', {
      organizationId,
      workspaceId,
      contextType,
      fetchedCount: stories.length
    });

    let savedCount = 0;

    for (const story of stories) {
      await this.prisma.externalRequirementCache.upsert({
        where: {
          connectionId_externalId_workspaceId: {
            connectionId: workspace.jiraConnectionId,
            externalId: story.id,
            workspaceId
          }
        },
        create: {
          organizationId,
          connectionId: workspace.jiraConnectionId,
          workspaceId,
          projectExternalId: workspace.projectKey,
          releaseContextExternalId: contextType === 'BACKLOG' ? null : workspace.planningContextExternalId,
          externalId: story.id,
          externalKey: story.key,
          title: story.title,
          status: story.status,
          priority: story.priority,
          sourceType: ToolType.JIRA,
          rawMetadata: {
            workspaceId,
            contextType,
            contextName: workspace.planningContextName
          }
        },
        update: {
          title: story.title,
          status: story.status,
          priority: story.priority,
          projectExternalId: workspace.projectKey,
          releaseContextExternalId: contextType === 'BACKLOG' ? null : workspace.planningContextExternalId,
          rawMetadata: {
            workspaceId,
            contextType,
            contextName: workspace.planningContextName
          },
          syncedAt: new Date()
        }
      });
      savedCount += 1;
    }

    await this.prisma.workspace.update({
      where: { id: workspace.id },
      data: { lastSyncedAt: new Date() }
    });

    console.log('[WorkspacesService.syncRequirements] sync completed', {
      organizationId,
      workspaceId,
      fetchedCount: stories.length,
      savedCount
    });

    return { workspaceId, contextType, fetchedCount: stories.length, savedCount, syncedCount: savedCount };
  }

  async listRequirements(organizationId: string, workspaceId: string) {
    await this.get(organizationId, workspaceId);
    console.log('[WorkspacesService.listRequirements] loading persisted requirements', { organizationId, workspaceId });
    return this.prisma.externalRequirementCache.findMany({
      where: {
        organizationId,
        workspaceId
      },
      orderBy: { syncedAt: 'desc' }
    });
  }
}
