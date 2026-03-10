-- Baseline core tables required by later migrations.
-- This restores missing history so reset/migrate can run from an empty database.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ToolType') THEN
    CREATE TYPE "ToolType" AS ENUM ('JIRA', 'ZEPHYR_ESSENTIAL', 'AZURE_DEVOPS', 'QTEST', 'DEMO');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConnectionStatus') THEN
    CREATE TYPE "ConnectionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INVALID');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ClientConnection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "toolType" "ToolType" NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "secondaryBaseUrl" TEXT,
  "authType" TEXT NOT NULL,
  "username" TEXT,
  "encryptedSecret" TEXT NOT NULL,
  "maskedSecretPreview" TEXT NOT NULL,
  "status" "ConnectionStatus" NOT NULL,
  "lastValidatedAt" TIMESTAMP(3),
  "metadataJson" JSONB,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientConnection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientConnection_organizationId_toolType_idx"
ON "ClientConnection"("organizationId", "toolType");

CREATE INDEX IF NOT EXISTS "ClientConnection_organizationId_status_idx"
ON "ClientConnection"("organizationId", "status");

CREATE TABLE IF NOT EXISTS "ExternalRequirementCache" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "projectExternalId" TEXT NOT NULL,
  "releaseContextExternalId" TEXT,
  "externalId" TEXT NOT NULL,
  "externalKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "acceptanceCriteria" TEXT,
  "priority" TEXT,
  "status" TEXT,
  "sourceType" "ToolType" NOT NULL,
  "rawMetadata" JSONB,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExternalRequirementCache_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExternalRequirementCache_organizationId_connectionId_projectExternalId_idx"
ON "ExternalRequirementCache"("organizationId", "connectionId", "projectExternalId");

ALTER TABLE "ExternalRequirementCache"
DROP CONSTRAINT IF EXISTS "ExternalRequirementCache_connectionId_externalId_workspaceId_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ExternalRequirementCache_connectionId_externalId_key'
  ) THEN
    ALTER TABLE "ExternalRequirementCache"
      ADD CONSTRAINT "ExternalRequirementCache_connectionId_externalId_key"
      UNIQUE ("connectionId", "externalId");
  END IF;
END
$$;
