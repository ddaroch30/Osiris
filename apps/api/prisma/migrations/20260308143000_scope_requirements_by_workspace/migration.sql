ALTER TABLE "ExternalRequirementCache"
ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

UPDATE "ExternalRequirementCache"
SET "workspaceId" = COALESCE("workspaceId", 'legacy_workspace')
WHERE "workspaceId" IS NULL;

ALTER TABLE "ExternalRequirementCache"
ALTER COLUMN "workspaceId" SET NOT NULL;

DROP INDEX IF EXISTS "ExternalRequirementCache_organizationId_connectionId_projectExternalId_idx";
CREATE INDEX IF NOT EXISTS "ExternalRequirementCache_organizationId_workspaceId_connectionId_projectExternalId_idx"
ON "ExternalRequirementCache"("organizationId", "workspaceId", "connectionId", "projectExternalId");

CREATE INDEX IF NOT EXISTS "ExternalRequirementCache_workspaceId_idx"
ON "ExternalRequirementCache"("workspaceId");

ALTER TABLE "ExternalRequirementCache"
DROP CONSTRAINT IF EXISTS "ExternalRequirementCache_connectionId_externalId_key";

ALTER TABLE "ExternalRequirementCache"
ADD CONSTRAINT "ExternalRequirementCache_connectionId_externalId_workspaceId_key"
UNIQUE ("connectionId", "externalId", "workspaceId");
