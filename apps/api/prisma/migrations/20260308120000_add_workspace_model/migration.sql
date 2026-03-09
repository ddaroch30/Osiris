-- Create enum used by Workspace status typing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceStatus') THEN
    CREATE TYPE "WorkspaceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
  END IF;
END
$$;

-- Create enum used by Workspace planning context typing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanningContextType') THEN
    CREATE TYPE "PlanningContextType" AS ENUM ('SPRINT', 'RELEASE', 'BACKLOG');
  END IF;
END
$$;

-- Ensure workspace table exists for workspace-first architecture.
CREATE TABLE IF NOT EXISTS "Workspace" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "jiraConnectionId" TEXT NOT NULL,
  "targetConnectionId" TEXT NOT NULL,
  "projectKey" TEXT NOT NULL,
  "planningContextType" "PlanningContextType" NOT NULL,
  "planningContextExternalId" TEXT NOT NULL,
  "planningContextName" TEXT NOT NULL,
  "status" "WorkspaceStatus" NOT NULL DEFAULT 'DRAFT',
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- If table already existed with TEXT planning context, convert to enum.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Workspace'
      AND column_name = 'planningContextType'
      AND data_type <> 'USER-DEFINED'
  ) THEN
    ALTER TABLE "Workspace"
      ALTER COLUMN "planningContextType" TYPE "PlanningContextType"
      USING "planningContextType"::"PlanningContextType";
  END IF;
END
$$;

-- Add required relations/indexes for lookup and integrity.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Workspace_jiraConnectionId_fkey'
  ) THEN
    ALTER TABLE "Workspace"
      ADD CONSTRAINT "Workspace_jiraConnectionId_fkey"
      FOREIGN KEY ("jiraConnectionId") REFERENCES "ClientConnection"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Workspace_targetConnectionId_fkey'
  ) THEN
    ALTER TABLE "Workspace"
      ADD CONSTRAINT "Workspace_targetConnectionId_fkey"
      FOREIGN KEY ("targetConnectionId") REFERENCES "ClientConnection"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "Workspace_organizationId_status_idx" ON "Workspace"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Workspace_jiraConnectionId_idx" ON "Workspace"("jiraConnectionId");
CREATE INDEX IF NOT EXISTS "Workspace_targetConnectionId_idx" ON "Workspace"("targetConnectionId");
