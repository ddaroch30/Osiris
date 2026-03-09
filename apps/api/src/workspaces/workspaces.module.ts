import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({ imports: [ProjectsModule], controllers: [WorkspacesController], providers: [WorkspacesService], exports: [WorkspacesService] })
export class WorkspacesModule {}
