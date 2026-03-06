import { Injectable } from '@nestjs/common';
import { ToolType } from '../../common/enums';
import { TestManagementConnector } from '../interfaces/test-management-connector';
import { JiraConnector } from '../connectors/jira/jira.connector';
import { ZephyrEssentialConnector } from '../connectors/zephyr-essential/zephyr-essential.connector';
import { AzureDevOpsConnector } from '../connectors/azure-devops/azure-devops.connector';
import { QTestConnector } from '../connectors/qtest/qtest.connector';
import { DemoConnector } from '../connectors/demo/demo.connector';

@Injectable()
export class ConnectorFactory {
  private readonly byType: Record<string, TestManagementConnector> = {
    [ToolType.JIRA]: new JiraConnector(),
    [ToolType.ZEPHYR_ESSENTIAL]: new ZephyrEssentialConnector(),
    [ToolType.AZURE_DEVOPS]: new AzureDevOpsConnector(),
    [ToolType.QTEST]: new QTestConnector(),
    [ToolType.DEMO]: new DemoConnector()
  };

  resolve(toolType: ToolType): TestManagementConnector {
    return this.byType[toolType] ?? this.byType[ToolType.DEMO];
  }
}
