import { Module } from '@nestjs/common';
import { ConnectorFactory } from './factory/connector.factory';

@Module({ providers: [ConnectorFactory], exports: [ConnectorFactory] })
export class IntegrationsModule {}
