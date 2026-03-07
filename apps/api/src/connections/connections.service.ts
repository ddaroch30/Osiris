import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConnectionStatus, ToolType } from '../common/enums';
import { InMemoryStore } from '../common/in-memory-store';
import { ConnectorFactory } from '../integrations/factory/connector.factory';
import { PrismaService } from '../common/prisma.service';

type ConnectionInput = {
  name: string;
  toolType: ToolType;
  baseUrl: string;
  secondaryBaseUrl?: string;
  authType: string;
  username?: string;
  secret: string;
  metadataJson?: Record<string, unknown>;
};

@Injectable()
export class ConnectionsService {
  private readonly prisma: {
    clientConnection: {
      findMany: PrismaService['clientConnection']['findMany'];
      findFirst: PrismaService['clientConnection']['findFirst'];
      create: PrismaService['clientConnection']['create'];
      update: PrismaService['clientConnection']['update'];
      deleteMany: PrismaService['clientConnection']['deleteMany'];
    };
  };

  constructor(private readonly store: InMemoryStore, private readonly factory: ConnectorFactory, prismaService: PrismaService) {
    this.prisma = prismaService as unknown as ConnectionsService['prisma'];
  }

  private mapToolType(toolType: ToolType): ToolType {
    return toolType;
  }

  private normalizeBaseUrl(baseUrl: string): string {
    const trimmed = baseUrl.trim().replace(/\/+$/, '');
    return trimmed;
  }

  private endpointHintError(baseUrl: string): string | null {
    const badSuffixes = ['/projects', '/issues', '/testcases', '/testcase', '/search'];
    const lower = baseUrl.toLowerCase();
    const hit = badSuffixes.find((s) => lower.endsWith(s));
    return hit ? 'This field expects a base URL, not a specific endpoint path.' : null;
  }

  private validateInputShape(input: ConnectionInput) {
    const hint = this.endpointHintError(input.baseUrl);
    if (hint) throw new BadRequestException(hint);
  }

  private toSafeConnection(row: {
    id: string;
    organizationId: string;
    name: string;
    toolType: string;
    authType: string;
    baseUrl: string;
    secondaryBaseUrl: string | null;
    username: string | null;
    metadataJson: unknown;
    maskedSecretPreview: string;
    status: string;
    lastValidatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      toolType: row.toolType as ToolType,
      authType: row.authType,
      baseUrl: row.baseUrl,
      secondaryBaseUrl: row.secondaryBaseUrl,
      username: row.username,
      metadataJson: row.metadataJson,
      maskedSecretPreview: row.maskedSecretPreview,
      status: row.status as ConnectionStatus,
      lastValidatedAt: row.lastValidatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      secretPresent: true
    };
  }

  async list(orgId: string) {
    const rows = await this.prisma.clientConnection.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } }) as Array<Parameters<typeof this.toSafeConnection>[0]>;
    return rows.map((x: Parameters<typeof this.toSafeConnection>[0]) => this.toSafeConnection(x));
  }

  async listByTool(orgId: string, toolType: ToolType) {
    const rows = await this.prisma.clientConnection.findMany({ where: { organizationId: orgId, toolType }, orderBy: { createdAt: 'desc' } }) as Array<Parameters<typeof this.toSafeConnection>[0]>;
    return rows.map((x: Parameters<typeof this.toSafeConnection>[0]) => this.toSafeConnection(x));
  }

  async get(orgId: string, id: string) {
    const row = await this.prisma.clientConnection.findFirst({ where: { id, organizationId: orgId } });
    if (!row) throw new NotFoundException('Connection not found');
    return this.toSafeConnection(row);
  }

  async create(orgId: string, userId: string, raw: ConnectionInput) {
    const input: ConnectionInput = {
      ...raw,
      toolType: this.mapToolType(raw.toolType),
      baseUrl: this.normalizeBaseUrl(raw.baseUrl),
      secondaryBaseUrl: raw.secondaryBaseUrl ? this.normalizeBaseUrl(raw.secondaryBaseUrl) : undefined
    };
    this.validateInputShape(input);

    const row = await this.prisma.clientConnection.create({
      data: {
        organizationId: orgId,
        name: input.name,
        toolType: input.toolType,
        baseUrl: input.baseUrl,
        secondaryBaseUrl: input.secondaryBaseUrl ?? null,
        authType: input.authType,
        username: input.username ?? null,
        encryptedSecret: Buffer.from(input.secret).toString('base64'),
        maskedSecretPreview: `****${input.secret.slice(-4)}`,
        status: ConnectionStatus.DRAFT,
        lastValidatedAt: null,
        ...(input.metadataJson
          ? {
              metadataJson: input.metadataJson
            }
          : {}),
        createdById: userId
      }
    });

    this.store.audits.push({ id: `audit_${Date.now()}`, organizationId: orgId, actorUserId: userId, action: 'CONNECTION_CREATED', entityType: 'ClientConnection', entityId: row.id, createdAt: new Date().toISOString() });
    return this.toSafeConnection(row);
  }

  async validateInput(raw: ConnectionInput) {
    const input = {
      ...raw,
      toolType: this.mapToolType(raw.toolType),
      baseUrl: this.normalizeBaseUrl(raw.baseUrl),
      secondaryBaseUrl: raw.secondaryBaseUrl ? this.normalizeBaseUrl(raw.secondaryBaseUrl) : undefined
    } as ConnectionInput;
    this.validateInputShape(input);

    const connector = this.factory.resolve(input.toolType as ToolType);
    return connector.validateConnection({ toolType: input.toolType as ToolType, baseUrl: input.baseUrl, secondaryBaseUrl: input.secondaryBaseUrl, username: input.username, secret: input.secret, metadataJson: input.metadataJson });
  }

  async validate(orgId: string, id: string) {
    const row = await this.prisma.clientConnection.findFirst({ where: { id, organizationId: orgId } });
    if (!row) throw new NotFoundException('Connection not found');
    const connector = this.factory.resolve(this.mapToolType(row.toolType as ToolType));
    const secret = Buffer.from(row.encryptedSecret, 'base64').toString('utf8');
    const baseUrl = this.normalizeBaseUrl(row.baseUrl);
    const secondaryBaseUrl = row.secondaryBaseUrl ? this.normalizeBaseUrl(row.secondaryBaseUrl) : null;

    const result = await connector.validateConnection({ toolType: this.mapToolType(row.toolType as ToolType), baseUrl, secondaryBaseUrl, username: row.username, secret, metadataJson: row.metadataJson as Record<string, unknown> | undefined });
    const status = result.success ? ConnectionStatus.ACTIVE : ConnectionStatus.INVALID;

    await this.prisma.clientConnection.update({
      where: { id: row.id },
      data: {
        status,
        lastValidatedAt: new Date(),
        baseUrl,
        secondaryBaseUrl
      }
    });

    return { ...result, status };
  }

  async getInternal(orgId: string, id: string) {
    const row = await this.prisma.clientConnection.findFirst({ where: { id, organizationId: orgId } });
    if (!row) throw new NotFoundException('Connection not found');
    const secret = Buffer.from(row.encryptedSecret, 'base64').toString('utf8');
    return {
      ...row,
      toolType: this.mapToolType(row.toolType as ToolType),
      secret,
      metadataJson: (row.metadataJson ?? undefined) as Record<string, unknown> | undefined
    };
  }

  saveWorkflowConfig(orgId: string, userId: string, input: { name: string; requirementsSourceConnectionId: string; testManagementTargetConnectionId: string }) {
    const row = {
      id: `wcfg_${Date.now()}`,
      organizationId: orgId,
      ...input,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.workflowConfigs.push(row);
    return row;
  }

  listWorkflowConfigs(orgId: string) {
    return this.store.workflowConfigs.filter((x) => x.organizationId === orgId);
  }

  async remove(orgId: string, id: string) {
    const out = await this.prisma.clientConnection.deleteMany({ where: { id, organizationId: orgId } });
    return { deleted: out.count };
  }
}
