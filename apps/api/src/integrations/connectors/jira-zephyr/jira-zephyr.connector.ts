import { ToolType } from '../../../common/enums';
import {
  ConnectionValidationResult,
  ConnectorContext,
  CreateExternalTestCaseInput,
  CreateExternalTestCaseResult,
  LinkResult,
  ListRequirementsInput,
  ProjectDto,
  ReleaseContextDto,
  RequirementDto,
  RequirementTestCaseLinkInput,
  TestManagementConnector,
  ValidateConnectionInput
} from '../../interfaces/test-management-connector';
import { JiraConnector } from '../jira/jira.connector';
import { ZephyrEssentialConnector } from '../zephyr-essential/zephyr-essential.connector';

/**
 * Backward-compatible wrapper for legacy "jira-zephyr" naming in this POC.
 *
 * Internally this delegates to the distinct Jira and Zephyr Essential connectors
 * based on `toolType` using the current enum values.
 */
export class JiraZephyrConnector implements TestManagementConnector {
  private readonly jira = new JiraConnector();
  private readonly zephyrEssential = new ZephyrEssentialConnector();

  private resolveConnector(toolType: ToolType): TestManagementConnector {
    if (toolType === ToolType.JIRA) {
      return this.jira;
    }

    if (toolType === ToolType.ZEPHYR_ESSENTIAL) {
      return this.zephyrEssential;
    }

    throw new Error(`JiraZephyrConnector supports only ${ToolType.JIRA} and ${ToolType.ZEPHYR_ESSENTIAL}. Received: ${toolType}`);
  }

  async validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidationResult> {
    return this.resolveConnector(input.toolType).validateConnection(input);
  }

  async listProjects(connection: ConnectorContext): Promise<ProjectDto[]> {
    return this.resolveConnector(connection.toolType).listProjects(connection);
  }

  async listReleaseContexts(connection: ConnectorContext, projectId: string): Promise<ReleaseContextDto[]> {
    return this.resolveConnector(connection.toolType).listReleaseContexts(connection, projectId);
  }

  async listRequirements(connection: ConnectorContext, params: ListRequirementsInput): Promise<RequirementDto[]> {
    return this.resolveConnector(connection.toolType).listRequirements(connection, params);
  }

  async createTestCases(connection: ConnectorContext, payload: CreateExternalTestCaseInput[]): Promise<CreateExternalTestCaseResult[]> {
    return this.resolveConnector(connection.toolType).createTestCases(connection, payload);
  }

  async linkTestCasesToRequirements(connection: ConnectorContext, payload: RequirementTestCaseLinkInput[]): Promise<LinkResult[]> {
    return this.resolveConnector(connection.toolType).linkTestCasesToRequirements(connection, payload);
  }
}
