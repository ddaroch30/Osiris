import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { ToolType } from '../common/enums';

type PlanningContextType = 'SPRINT' | 'RELEASE' | 'BACKLOG';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService, private readonly projects: ProjectsService) {}

  async list(organizationId: string) {
    return this.prisma.workspace.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
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
    if (!input.name || !input.jiraConnectionId || !input.targetConnectionId || !input.projectKey) {
      throw new BadRequestException('name, jiraConnectionId, targetConnectionId and projectKey are required');
    }

    const planning = input.planningContextType && input.planningContextExternalId && input.planningContextName
      ? { type: input.planningContextType, id: input.planningContextExternalId, name: input.planningContextName }
      : await this.projects.discoverPlanningContext(organizationId, input.jiraConnectionId, input.projectKey);

    return this.prisma.workspace.create({
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

    const stories = await this.projects.listStories(
      organizationId,
      workspace.jiraConnectionId,
      workspace.projectKey,
      contextType,
      workspace.planningContextExternalId
    );

    for (const story of stories) {
      await this.prisma.externalRequirementCache.upsert({
        where: {
          connectionId_externalId: {
            connectionId: workspace.jiraConnectionId,
            externalId: story.id
          }
        },
        create: {
          organizationId,
          connectionId: workspace.jiraConnectionId,
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
    }

    await this.prisma.workspace.update({
      where: { id: workspace.id },
      data: { lastSyncedAt: new Date() }
    });

    return { workspaceId, syncedCount: stories.length };
  }

  async listRequirements(organizationId: string, workspaceId: string) {
    const workspace = await this.get(organizationId, workspaceId);
    return this.prisma.externalRequirementCache.findMany({
      where: {
        organizationId,
        connectionId: workspace.jiraConnectionId,
        projectExternalId: workspace.projectKey
      },
      orderBy: { syncedAt: 'desc' }
    });
  }
}
