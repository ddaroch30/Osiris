import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ConnectionsModule } from '../connections/connections.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [ConnectionsModule, IntegrationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
