import { Module } from '@nestjs/common';
import { ReleasesController } from './releases.controller';
import { ReleasesService } from './releases.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({ imports: [IntegrationsModule], controllers: [ReleasesController], providers: [ReleasesService] })
export class ReleasesModule {}
