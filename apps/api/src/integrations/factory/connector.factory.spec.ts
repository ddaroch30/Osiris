import { ConnectorFactory } from './connector.factory';
import { ToolType } from '../../common/enums';

describe('ConnectorFactory', () => {
  it('resolves connector for each supported tool type', () => {
    const factory = new ConnectorFactory();
    expect(factory.resolve(ToolType.JIRA_ZEPHYR)).toBeDefined();
    expect(factory.resolve(ToolType.AZURE_DEVOPS)).toBeDefined();
    expect(factory.resolve(ToolType.QTEST)).toBeDefined();
  });
});
