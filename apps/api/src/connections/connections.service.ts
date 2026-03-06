import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionStatus, ToolType } from '../common/enums';
import { InMemoryStore } from '../common/in-memory-store';
import { ConnectorFactory } from '../integrations/factory/connector.factory';

@Injectable()
export class ConnectionsService {
  constructor(private readonly store: InMemoryStore, private readonly factory: ConnectorFactory) {}

  private mask(row: any) {
    return { ...row, encryptedSecret: undefined, secretPresent: true };
  }

  list(orgId: string) { return this.store.connections.filter((x) => x.organizationId === orgId).map((x) => this.mask(x)); }

  get(orgId: string, id: string) {
    const row = this.store.connections.find((x) => x.id === id && x.organizationId === orgId);
    if (!row) throw new NotFoundException('Connection not found');
    return this.mask(row);
  }

  create(orgId: string, userId: string, input: any) {
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


  async validateInput(input: { toolType: ToolType; baseUrl: string; secondaryBaseUrl?: string; username?: string; secret: string; metadataJson?: Record<string, unknown> }) {
    const connector = this.factory.resolve(input.toolType);
    return connector.validateConnection({ toolType: input.toolType, baseUrl: input.baseUrl, secondaryBaseUrl: input.secondaryBaseUrl, username: input.username, secret: input.secret, metadataJson: input.metadataJson });
  }

  async validate(orgId: string, id: string) {
    const row = this.store.connections.find((x) => x.id === id && x.organizationId === orgId);
    if (!row) throw new NotFoundException('Connection not found');
    const connector = this.factory.resolve(row.toolType as ToolType);
    const secret = Buffer.from(row.encryptedSecret, 'base64').toString('utf8');
    const result = await connector.validateConnection({ toolType: row.toolType, baseUrl: row.baseUrl, secondaryBaseUrl: row.secondaryBaseUrl, username: row.username, secret, metadataJson: row.metadataJson });
    row.status = result.success ? ConnectionStatus.ACTIVE : ConnectionStatus.INVALID;
    row.lastValidatedAt = new Date().toISOString();
    return { ...result, status: row.status };
  }

  getInternal(orgId: string, id: string) {
    const row = this.store.connections.find((x) => x.id === id && x.organizationId === orgId);
    if (!row) throw new NotFoundException('Connection not found');
    const secret = Buffer.from(row.encryptedSecret, 'base64').toString('utf8');
    return { ...row, secret };
  }

  remove(orgId: string, id: string) {
    const before = this.store.connections.length;
    this.store.connections = this.store.connections.filter((x) => !(x.id === id && x.organizationId === orgId));
    return { deleted: before - this.store.connections.length };
  }
}
