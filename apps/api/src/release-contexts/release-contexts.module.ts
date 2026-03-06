import { Module } from '@nestjs/common';
import { ReleaseContextsController } from './release-contexts.controller';
import { ReleaseContextsService } from './release-contexts.service';
import { ConnectionsModule } from '../connections/connections.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({ imports: [ConnectionsModule, IntegrationsModule], controllers: [ReleaseContextsController], providers: [ReleaseContextsService] })
export class ReleaseContextsModule {}
