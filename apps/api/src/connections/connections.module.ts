import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({ imports: [IntegrationsModule], controllers: [ConnectionsController], providers: [ConnectionsService], exports: [ConnectionsService] })
export class ConnectionsModule {}
