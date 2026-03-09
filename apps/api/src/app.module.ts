import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ConnectionsModule } from './connections/connections.module';
import { ProjectsModule } from './projects/projects.module';
import { ReleaseContextsModule } from './release-contexts/release-contexts.module';
import { RequirementsModule } from './requirements/requirements.module';
import { TestGenerationModule } from './test-generation/test-generation.module';
import { TestReviewModule } from './test-review/test-review.module';
import { TestPushModule } from './test-push/test-push.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env']
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    MembershipsModule,
    IntegrationsModule,
    ConnectionsModule,
    ProjectsModule,
    ReleaseContextsModule,
    RequirementsModule,
    TestGenerationModule,
    TestReviewModule,
    TestPushModule,
    AuditModule,
    NotificationsModule,
    HealthModule,
    WorkspacesModule
  ]
})
export class AppModule {}
