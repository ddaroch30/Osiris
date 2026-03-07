import { Injectable } from '@nestjs/common';
import { ToolType } from '../common/enums';
import { ConnectionsService } from '../connections/connections.service';
import { ConnectorFactory } from '../integrations/factory/connector.factory';

@Injectable()
export class ReleaseContextsService {
  constructor(private readonly connections: ConnectionsService, private readonly factory: ConnectorFactory) {}
  async list(orgId: string, connectionId: string, projectExternalId: string) {
    const conn = this.connections.getInternal(orgId, connectionId);
    return this.factory.resolve(conn.toolType as ToolType).listReleaseContexts({ toolType: conn.toolType, baseUrl: conn.baseUrl, secondaryBaseUrl: conn.secondaryBaseUrl, username: conn.username, secret: conn.secret, metadataJson: conn.metadataJson }, projectExternalId);
  }
}
