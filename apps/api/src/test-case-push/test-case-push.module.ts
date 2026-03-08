import { Module } from '@nestjs/common';
import { TestCasePushController } from './test-case-push.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { TestCasePushService } from './test-case-push.service';

@Module({ imports: [IntegrationsModule], controllers: [TestCasePushController], providers: [TestCasePushService] })
export class TestCasePushModule {}
