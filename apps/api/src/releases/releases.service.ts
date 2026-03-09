import { Injectable } from '@nestjs/common';
import { MockIntegrationProvider } from '../integrations/mock-integration.provider';

@Injectable()
export class ReleasesService {
  constructor(private readonly integration: MockIntegrationProvider) {}
  list(connectionId: string, projectKey: string) { return this.integration.fetchReleases(connectionId, projectKey); }
}
