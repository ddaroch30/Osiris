import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { ConnectionsModule } from '../connections/connections.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({ imports: [ConnectionsModule, IntegrationsModule], controllers: [RequirementsController], providers: [RequirementsService] })
export class RequirementsModule {}
