# Osiris Multi-Tool Enterprise Test Case Generation POC

## 1) Updated folder structure
```text
apps/api/src
  common/ (enums, org context, in-memory store)
  connections/
  integrations/
    interfaces/
    factory/
    connectors/
      jira-zephyr/
      azure-devops/
      qtest/
      demo/
  projects/
  release-contexts/
  requirements/
  test-generation/
    providers/
  test-review/
  test-push/
  audit/
apps/web/app
  connections/
  connections/[id]/
  projects/
  release-contexts/
  requirements/
  generate/
  workspace/
  push-executions/
  audit/
```

## 2) Prisma schema additions
Schema now includes canonical POC models:
- `ClientConnection`
- `ExternalProjectCache`
- `ExternalReleaseContextCache`
- `ExternalRequirementCache`
- `GeneratedTestCaseBatch`
- `GeneratedTestCase`
- `PushExecution`
- `PushExecutionItem`
- `TraceabilityLink`
- `AuditLog`

And enums:
- `ToolType`, `ConnectionStatus`, `GenerationStatus`, `ReviewStatus`, `PushStatus`, `ScenarioType`.

## 3) Backend module code
Implemented unified workflow modules:
1. **connections**: create/list/get/delete + validate endpoint and masked secret responses
2. **integrations**: `TestManagementConnector` interface + `ConnectorFactory`
3. **projects/release-contexts/requirements**: canonical discovery endpoints under connection scope
4. **test-generation**: generation batches + generated cases persistence
5. **test-review**: edit/delete/manual add/approve
6. **test-push**: create external tests, link requirements, store push items + traceability links
7. **audit**: org-scoped activity retrieval

## 4) Connector interfaces and implementations
`TestManagementConnector` methods:
- validateConnection
- listProjects
- listReleaseContexts
- listRequirements
- createTestCases
- linkTestCasesToRequirements

Implemented connectors:
- `JiraZephyrConnector` (real Jira REST-based calls + Zephyr-through-Jira test issue assumption)
- `AzureDevOpsConnector` (real ADO projects, iterations, WIQL/work item APIs)
- `QTestConnector` (real qTest REST endpoints)
- `DemoConnector` (demo fallback)

## 5) API endpoints
- `GET/POST /api/v1/connections`
- `GET/DELETE /api/v1/connections/:id`
- `POST /api/v1/connections/:id/validate`
- `GET /api/v1/connections/:id/projects`
- `GET /api/v1/connections/:id/release-contexts?projectExternalId=...`
- `GET /api/v1/connections/:id/requirements?projectExternalId=...&releaseContextExternalId=...`
- `POST /api/v1/generation-batches`
- `GET /api/v1/generation-batches/:id/test-cases`
- `PATCH /api/v1/test-cases/:id`
- `DELETE /api/v1/test-cases/:id`
- `POST /api/v1/test-cases`
- `POST /api/v1/test-cases/:id/approve`
- `POST /api/v1/push-executions`
- `GET /api/v1/push-executions/:id`
- `GET /api/v1/audit-logs`

## 6) Frontend pages/components
Enterprise workflow pages now include:
- Connections list/create
- Connection detail
- Projects explorer
- Release context selector
- Requirements explorer
- Generate page
- Review workspace
- Push execution status
- Activity log

## 7) Mock/demo data
`InMemoryStore` seeds:
- demo org
- demo connection (`conn_demo_1`)
- demo fallback connector responses

## 8) Environment variables example
`.env.example`:
- `API_PORT`, `WEB_PORT`
- `DATABASE_URL`, `REDIS_URL`
- `JWT_SECRET`, `ENCRYPTION_KEY`, `CORS_ORIGIN`
- `DEMO_MODE=true`

## 9) Setup / run instructions
1. `cp .env.example .env`
2. `docker compose up -d`
3. `npm install`
4. `npm run dev`
5. API docs: `http://localhost:4000/api/docs`
6. UI: `http://localhost:3000`

## 10) Real connector assumptions and limitations
- **Jira+Zephyr**: uses Jira issue creation for `issuetype=Test` as the Zephyr artifact assumption (common but configuration-dependent).
- **Azure DevOps**: uses work item APIs for `Test Case`; linking uses work item relation patch.
- **qTest**: endpoints follow v3 conventions; some tenants may require endpoint variant or additional headers.
- For unsupported tenant-specific nuances, connector behavior is isolated behind adapter classes for focused extension.
