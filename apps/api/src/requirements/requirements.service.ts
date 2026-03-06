import { Injectable } from '@nestjs/common';
import { ToolType } from '../common/enums';
import { ConnectionsService } from '../connections/connections.service';
import { ConnectorFactory } from '../integrations/factory/connector.factory';

@Injectable()
export class RequirementsService {
  constructor(private readonly connections: ConnectionsService, private readonly factory: ConnectorFactory) {}
  async list(orgId: string, connectionId: string, query: { projectExternalId: string; releaseContextExternalId?: string; search?: string }) {
    const conn = this.connections.getInternal(orgId, connectionId);
    const rows = await this.factory.resolve(conn.toolType as ToolType).listRequirements({ toolType: conn.toolType, baseUrl: conn.baseUrl, secondaryBaseUrl: conn.secondaryBaseUrl, username: conn.username, secret: conn.secret, metadataJson: conn.metadataJson }, query);
    return query.search ? rows.filter((x) => `${x.title} ${x.key}`.toLowerCase().includes(query.search!.toLowerCase())) : rows;
  }
}
