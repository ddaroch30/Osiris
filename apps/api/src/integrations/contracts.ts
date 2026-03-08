export interface IntegrationProvider {
  validateConnection(connectionId: string): Promise<{ success: boolean; message: string }>;
}

export interface ProjectProvider {
  fetchProjects(connectionId: string): Promise<any[]>;
}

export interface ReleaseProvider {
  fetchReleases(connectionId: string, projectKey: string): Promise<any[]>;
}

export interface RequirementProvider {
  fetchRequirements(connectionId: string, projectKey: string, releaseId: string): Promise<any[]>;
}

export interface TestCasePushProvider {
  pushTestCases(payload: { connectionId: string; cases: any[] }): Promise<any[]>;
}
