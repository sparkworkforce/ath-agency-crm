-- CreateEnum: AgencyPlan
CREATE TYPE "AgencyPlan" AS ENUM ('FREE', 'PROFESSIONAL', 'BUSINESS');

-- CreateEnum: ATHAccountStatus
CREATE TYPE "ATHAccountStatus" AS ENUM ('pending', 'submitted', 'approved', 'active', 'rejected');

-- CreateTable: Agency
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#059669',
    "plan" "AgencyPlan" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "stripePriceId" TEXT,
    "subStatus" TEXT,
    "subCurrentPeriodEnd" TIMESTAMP(3),
    "maxClients" INTEGER NOT NULL DEFAULT 3,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "webhookUrl" TEXT,
    "apiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");
CREATE INDEX "Agency_slug_idx" ON "Agency"("slug");
CREATE UNIQUE INDEX "Agency_stripeCustomerId_key" ON "Agency"("stripeCustomerId");
CREATE UNIQUE INDEX "Agency_apiKey_key" ON "Agency"("apiKey");

-- AddColumn: User.agencyId
ALTER TABLE "User" ADD COLUMN "agencyId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");
CREATE INDEX "User_clientId_idx" ON "User"("clientId");

-- AddColumn: Client.agencyId
ALTER TABLE "Client" ADD COLUMN "agencyId" TEXT;
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Client_agencyId_idx" ON "Client"("agencyId");

-- AddColumn: CodeSnippet.agencyId
ALTER TABLE "CodeSnippet" ADD COLUMN "agencyId" TEXT;
ALTER TABLE "CodeSnippet" ADD CONSTRAINT "CodeSnippet_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "CodeSnippet_agencyId_idx" ON "CodeSnippet"("agencyId");
CREATE INDEX "CodeSnippet_authorId_idx" ON "CodeSnippet"("authorId");

-- NOTE: After running this migration, run the seed script to:
-- 1. Create a default agency
-- 2. Assign all existing Users, Clients, and CodeSnippets to it
-- 3. Then make Client.agencyId and CodeSnippet.agencyId NOT NULL:
--    ALTER TABLE "Client" ALTER COLUMN "agencyId" SET NOT NULL;
--    ALTER TABLE "CodeSnippet" ALTER COLUMN "agencyId" SET NOT NULL;

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

-- CreateTable: IntegrationStatus (multi-processor)
CREATE TABLE "IntegrationStatus" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "processor" TEXT NOT NULL DEFAULT 'ath_business',
    "accountStatus" "ATHAccountStatus" NOT NULL DEFAULT 'pending',
    "publicToken" TEXT,
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
CREATE UNIQUE INDEX "IntegrationStatus_projectId_processor_key" ON "IntegrationStatus"("projectId", "processor");
ALTER TABLE "IntegrationStatus" ADD CONSTRAINT "IntegrationStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddColumns: Project time estimates
ALTER TABLE "Project" ADD COLUMN "estimatedCompletionDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "milestonesSent" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Task" ADD COLUMN "estimatedDays" INTEGER;

-- AddIndexes: missing FK indexes
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX "InvoiceAuditLog_paymentId_idx" ON "InvoiceAuditLog"("paymentId");

-- CreateTable: ProjectFeedback
CREATE TABLE "ProjectFeedback" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectFeedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectFeedback_projectId_key" ON "ProjectFeedback"("projectId");
ALTER TABLE "ProjectFeedback" ADD CONSTRAINT "ProjectFeedback_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Referral
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerAgencyId" TEXT NOT NULL,
    "referredAgencyId" TEXT,
    "code" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "rewardApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Referral_referredAgencyId_key" ON "Referral"("referredAgencyId");
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");
CREATE INDEX "Referral_referrerAgencyId_idx" ON "Referral"("referrerAgencyId");

-- CreateTable: TimeEntry
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "minutes" INTEGER,
    "note" TEXT,
    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");
CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Quote
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'borrador',
    "validUntil" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: QuoteLine
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProjectTemplate (marketplace)
CREATE TABLE "ProjectTemplate" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT NOT NULL,
    "tasks" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectTemplate_agencyId_idx" ON "ProjectTemplate"("agencyId");
CREATE INDEX "ProjectTemplate_isPublic_idx" ON "ProjectTemplate"("isPublic");
ALTER TABLE "ProjectTemplate" ADD CONSTRAINT "ProjectTemplate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerAgencyId_fkey" FOREIGN KEY ("referrerAgencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredAgencyId_fkey" FOREIGN KEY ("referredAgencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- White-Label Portal: custom domain
ALTER TABLE "Agency" ADD COLUMN "customDomain" TEXT;
CREATE UNIQUE INDEX "Agency_customDomain_key" ON "Agency"("customDomain");
