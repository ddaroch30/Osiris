import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionStatus, LegacyToolType, ToolType } from '../common/enums';
import { InMemoryStore } from '../common/in-memory-store';
import { ConnectorFactory } from '../integrations/factory/connector.factory';

type ConnectionInput = {
  name: string;
  toolType: ToolType | LegacyToolType;
  baseUrl: string;
  secondaryBaseUrl?: string;
  authType: string;
  username?: string;
  secret: string;
  metadataJson?: Record<string, unknown>;
};

@Injectable()
export class ConnectionsService {
  constructor(private readonly store: InMemoryStore, private readonly factory: ConnectorFactory) {}

  private mapToolType(toolType: ToolType | LegacyToolType): ToolType {
    if (toolType === LegacyToolType.JIRA_CLOUD) return ToolType.JIRA;
    if (toolType === LegacyToolType.JIRA_ZEPHYR) return ToolType.JIRA;
    if (toolType === LegacyToolType.ZEPHYR_SCALE || toolType === LegacyToolType.ZEPHYR_SQUAD) return ToolType.ZEPHYR_ESSENTIAL;
    return toolType as ToolType;
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

  private mask(row: any) {
    return { ...row, encryptedSecret: undefined, secretPresent: true };
  }

  list(orgId: string) {
    return this.store.connections.filter((x) => x.organizationId === orgId).map((x) => this.mask(x));
  }

  listByTool(orgId: string, toolType: ToolType) {
    return this.list(orgId).filter((x) => x.toolType === toolType);
  }

  get(orgId: string, id: string) {
    const row = this.store.connections.find((x) => x.id === id && x.organizationId === orgId);
    if (!row) throw new NotFoundException('Connection not found');
    return this.mask(row);
  }

  create(orgId: string, userId: string, raw: ConnectionInput) {
    const input: ConnectionInput = {
      ...raw,
      toolType: this.mapToolType(raw.toolType),
      baseUrl: this.normalizeBaseUrl(raw.baseUrl),
      secondaryBaseUrl: raw.secondaryBaseUrl ? this.normalizeBaseUrl(raw.secondaryBaseUrl) : undefined
    };
    this.validateInputShape(input);

    const row = {
      id: `conn_${Date.now()}`,
      organizationId: orgId,
      ...input,
      encryptedSecret: Buffer.from(input.secret).toString('base64'),
      maskedSecretPreview: `****${input.secret.slice(-4)}`,
      status: ConnectionStatus.DRAFT,
      lastValidatedAt: null,
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.connections.push(row);
    this.store.audits.push({ id: `audit_${Date.now()}`, organizationId: orgId, actorUserId: userId, action: 'CONNECTION_CREATED', entityType: 'ClientConnection', entityId: row.id, createdAt: new Date().toISOString() });
    return this.mask(row);
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
    const row = this.store.connections.find((x) => x.id === id && x.organizationId === orgId);
    if (!row) throw new NotFoundException('Connection not found');
    const connector = this.factory.resolve(this.mapToolType(row.toolType));
    const secret = Buffer.from(row.encryptedSecret, 'base64').toString('utf8');
    row.baseUrl = this.normalizeBaseUrl(row.baseUrl);
    if (row.secondaryBaseUrl) row.secondaryBaseUrl = this.normalizeBaseUrl(row.secondaryBaseUrl);

    const result = await connector.validateConnection({ toolType: this.mapToolType(row.toolType), baseUrl: row.baseUrl, secondaryBaseUrl: row.secondaryBaseUrl, username: row.username, secret, metadataJson: row.metadataJson });
    row.status = result.success ? ConnectionStatus.ACTIVE : ConnectionStatus.INVALID;
    row.lastValidatedAt = new Date().toISOString();
    return { ...result, status: row.status };
  }

  getInternal(orgId: string, id: string) {
    const row = this.store.connections.find((x) => x.id === id && x.organizationId === orgId);
    if (!row) throw new NotFoundException('Connection not found');
    const secret = Buffer.from(row.encryptedSecret, 'base64').toString('utf8');
    return { ...row, toolType: this.mapToolType(row.toolType), secret };
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

  remove(orgId: string, id: string) {
    const before = this.store.connections.length;
    this.store.connections = this.store.connections.filter((x) => !(x.id === id && x.organizationId === orgId));
    return { deleted: before - this.store.connections.length };
  }
}
