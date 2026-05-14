-- Security Hardening Migration
-- Adds fields for: API key hashing, widget secret, session versioning, TOTP, RBAC, indexes

-- ─── Agency: API key hashing + widget secret ─────────────────
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "apiKeyHash" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "apiKeyPrefix" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "widgetSecret" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Puerto_Rico';
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "notifyMilestones" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "notifyPayments" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "notifyOverdue" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "Agency_apiKeyHash_key" ON "Agency"("apiKeyHash");
CREATE UNIQUE INDEX IF NOT EXISTS "Agency_customDomain_key" ON "Agency"("customDomain");

-- ─── User: session versioning, TOTP, RBAC ────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agencyRole" TEXT NOT NULL DEFAULT 'member';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpPending" TEXT;

-- ─── Expense: Float → Decimal ────────────────────────────────
ALTER TABLE "Expense" ALTER COLUMN "amount" TYPE DECIMAL(10, 2) USING "amount"::DECIMAL(10, 2);

-- ─── Communication: composite index for contract token lookup ─
CREATE INDEX IF NOT EXISTS "Communication_clientId_channel_idx" ON "Communication"("clientId", "channel");

-- ─── VerificationToken: index on expires for data retention ───
CREATE INDEX IF NOT EXISTS "VerificationToken_expires_idx" ON "VerificationToken"("expires");
