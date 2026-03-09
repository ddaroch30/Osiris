import { Module } from '@nestjs/common';
import { ClientConnectionsController } from './client-connections.controller';
import { ClientConnectionsService } from './client-connections.service';

@Module({ controllers: [ClientConnectionsController], providers: [ClientConnectionsService], exports: [ClientConnectionsService] })
export class ClientConnectionsModule {}
