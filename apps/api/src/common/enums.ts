export enum ToolType {
  JIRA_ZEPHYR = 'JIRA_ZEPHYR',
  JIRA_CLOUD = 'JIRA_CLOUD',
  ZEPHYR_SCALE = 'ZEPHYR_SCALE',
  AZURE_DEVOPS = 'AZURE_DEVOPS',
  QTEST = 'QTEST',
  DEMO = 'DEMO'
}

export enum ConnectionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INVALID = 'INVALID'
}

export enum GenerationStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  REVIEWED = 'REVIEWED',
  PUSHED = 'PUSHED'
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PushStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL'
}

export enum ScenarioType {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  EDGE = 'EDGE',
  VALIDATION = 'VALIDATION',
  ALTERNATE = 'ALTERNATE'
}
