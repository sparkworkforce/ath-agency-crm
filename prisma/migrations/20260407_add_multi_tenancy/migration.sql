-- CreateEnum: AgencyPlan
CREATE TYPE "AgencyPlan" AS ENUM ('FREE', 'PROFESSIONAL', 'BUSINESS');

-- CreateTable: Agency
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "plan" "AgencyPlan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");
CREATE INDEX "Agency_slug_idx" ON "Agency"("slug");

-- AddColumn: User.agencyId (nullable for backward compat)
ALTER TABLE "User" ADD COLUMN "agencyId" TEXT;

-- AddColumn: Client.agencyId (required — will be populated by seed)
ALTER TABLE "Client" ADD COLUMN "agencyId" TEXT;

-- AddColumn: CodeSnippet.agencyId (required — will be populated by seed)
ALTER TABLE "CodeSnippet" ADD COLUMN "agencyId" TEXT;

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");
CREATE INDEX "Client_agencyId_idx" ON "Client"("agencyId");
CREATE INDEX "CodeSnippet_agencyId_idx" ON "CodeSnippet"("agencyId");

-- NOTE: After running this migration, run the seed script to:
-- 1. Create a default agency
-- 2. Assign all existing Users, Clients, and CodeSnippets to it
-- 3. Then make Client.agencyId and CodeSnippet.agencyId NOT NULL:
--    ALTER TABLE "Client" ALTER COLUMN "agencyId" SET NOT NULL;
--    ALTER TABLE "CodeSnippet" ALTER COLUMN "agencyId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CodeSnippet" ADD CONSTRAINT "CodeSnippet_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddColumn: Agency.primaryColor
ALTER TABLE "Agency" ADD COLUMN "primaryColor" TEXT DEFAULT '#059669';

-- CreateTable: InvoiceLineItem
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddColumns: Agency subscription fields
ALTER TABLE "Agency" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Agency" ADD COLUMN "stripeSubId" TEXT;
ALTER TABLE "Agency" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "Agency" ADD COLUMN "subStatus" TEXT;
ALTER TABLE "Agency" ADD COLUMN "subCurrentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Agency" ADD COLUMN "maxClients" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Agency" ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Agency" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
CREATE UNIQUE INDEX "Agency_stripeCustomerId_key" ON "Agency"("stripeCustomerId");

-- CreateEnum: ATHAccountStatus
CREATE TYPE "ATHAccountStatus" AS ENUM ('pending', 'submitted', 'approved', 'active', 'rejected');

-- CreateTable: IntegrationStatus
CREATE TABLE "IntegrationStatus" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "athAccountStatus" "ATHAccountStatus" NOT NULL DEFAULT 'pending',
    "athPublicToken" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "webhookUrl" TEXT,
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "testTransactionAt" TIMESTAMP(3),
    "testTransactionOk" BOOLEAN,
    "goLiveAt" TIMESTAMP(3),
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationStatus_projectId_key" ON "IntegrationStatus"("projectId");
ALTER TABLE "IntegrationStatus" ADD CONSTRAINT "IntegrationStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddIndexes: missing FK indexes
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX "User_clientId_idx" ON "User"("clientId");
CREATE INDEX "InvoiceAuditLog_paymentId_idx" ON "InvoiceAuditLog"("paymentId");
CREATE INDEX "CodeSnippet_authorId_idx" ON "CodeSnippet"("authorId");

-- Month 2: Project time estimates
ALTER TABLE "Project" ADD COLUMN "estimatedCompletionDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "estimatedDays" INTEGER;
ALTER TABLE "Project" ADD COLUMN "milestonesSent" JSONB NOT NULL DEFAULT '[]';
