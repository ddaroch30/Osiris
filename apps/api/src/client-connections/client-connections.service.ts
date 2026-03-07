import { Injectable } from '@nestjs/common';

export enum ProviderType {
  JIRA_ZEPHYR = 'JIRA_ZEPHYR'
}

type ConnectionInput = {
  name: string;
  providerType: ProviderType;
  jiraBaseUrl: string;
  zephyrBaseUrl?: string;
  usernameOrEmail: string;
  token: string;
};

@Injectable()
export class ClientConnectionsService {
  private readonly storage: Array<Record<string, unknown>> = [];

  validate(input: ConnectionInput) {
    return { success: true, message: `Connected to ${input.jiraBaseUrl} in demo mode.` };
  }

  create(input: ConnectionInput) {
    const row = {
      id: `conn_${this.storage.length + 1}`,
      organizationId: 'org_demo',
      ...input,
      encryptedSecret: Buffer.from(input.token).toString('base64'),
      token: undefined,
      lastValidatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.storage.push(row);
    return { ...row, encryptedSecret: undefined, secretPresent: true };
  }

  list() {
    return this.storage.map((x) => ({ ...x, encryptedSecret: undefined, usernameOrEmail: x.usernameOrEmail }));
  }

  get(id: string) {
    const row = this.storage.find((x) => x.id === id);
    return row ? { ...row, encryptedSecret: undefined, secretPresent: true } : null;
  }
}
