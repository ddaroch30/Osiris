import { Module } from '@nestjs/common';
import { TestPushController } from './test-push.controller';
import { TestPushService } from './test-push.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ConnectionsModule } from '../connections/connections.module';

@Module({ imports: [IntegrationsModule, ConnectionsModule], controllers: [TestPushController], providers: [TestPushService] })
export class TestPushModule {}
