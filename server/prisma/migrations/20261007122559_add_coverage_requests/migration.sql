-- CreateEnum
CREATE TYPE "CoverageRequestSource" AS ENUM ('STAFF', 'MANAGER');

-- CreateEnum
CREATE TYPE "CoverageRequestStatus" AS ENUM ('PENDING_REVIEW', 'OPEN', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CoverageCandidateType" AS ENUM ('VOLUNTEER', 'DIRECT_OFFER');

-- CreateEnum
CREATE TYPE "CoverageCandidateStatus" AS ENUM ('PENDING', 'AVAILABLE', 'DECLINED', 'WITHDRAWN', 'SELECTED', 'NOT_SELECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('HEALTH', 'SCHOOL', 'PERSONAL', 'OTHER');

-- CreateTable
CREATE TABLE "CoverageRequest" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "shiftId" UUID NOT NULL,
    "originalAssigneeMembershipId" UUID NOT NULL,
    "requesterMembershipId" UUID NOT NULL,
    "createdByMembershipId" UUID NOT NULL,
    "approvedByMembershipId" UUID,
    "selectedCandidateId" UUID,
    "source" "CoverageRequestSource" NOT NULL,
    "reasonCategory" "ReasonCategory" NOT NULL,
    "reasonDetails" VARCHAR(1000),
    "requestedStartAt" TIMESTAMPTZ(3) NOT NULL,
    "requestedEndAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "CoverageRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "responseDeadline" TIMESTAMPTZ(3),
    "rejectionNote" VARCHAR(500),
    "approvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageCandidate" (
    "id" UUID NOT NULL,
    "coverageRequestId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "type" "CoverageCandidateType" NOT NULL,
    "status" "CoverageCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoverageRequest_selectedCandidateId_key" ON "CoverageRequest"("selectedCandidateId");

-- CreateIndex
CREATE INDEX "CoverageRequest_storeId_status_createdAt_idx" ON "CoverageRequest"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CoverageRequest_shiftId_status_idx" ON "CoverageRequest"("shiftId", "status");

-- CreateIndex
CREATE INDEX "CoverageRequest_requesterMembershipId_status_idx" ON "CoverageRequest"("requesterMembershipId", "status");

-- CreateIndex
CREATE INDEX "CoverageRequest_originalAssigneeMembershipId_status_idx" ON "CoverageRequest"("originalAssigneeMembershipId", "status");

-- CreateIndex
CREATE INDEX "CoverageRequest_status_responseDeadline_idx" ON "CoverageRequest"("status", "responseDeadline");

-- CreateIndex
CREATE INDEX "CoverageCandidate_coverageRequestId_status_idx" ON "CoverageCandidate"("coverageRequestId", "status");

-- CreateIndex
CREATE INDEX "CoverageCandidate_membershipId_status_idx" ON "CoverageCandidate"("membershipId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageCandidate_coverageRequestId_membershipId_key" ON "CoverageCandidate"("coverageRequestId", "membershipId");

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_originalAssigneeMembershipId_fkey" FOREIGN KEY ("originalAssigneeMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_requesterMembershipId_fkey" FOREIGN KEY ("requesterMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_approvedByMembershipId_fkey" FOREIGN KEY ("approvedByMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_selectedCandidateId_fkey" FOREIGN KEY ("selectedCandidateId") REFERENCES "CoverageCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageCandidate" ADD CONSTRAINT "CoverageCandidate_coverageRequestId_fkey" FOREIGN KEY ("coverageRequestId") REFERENCES "CoverageRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageCandidate" ADD CONSTRAINT "CoverageCandidate_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent more than one active coverage request per shift
CREATE UNIQUE INDEX "CoverageRequest_one_active_per_shift"
ON "CoverageRequest"("shiftId")
WHERE "status" IN ('PENDING_REVIEW', 'OPEN');