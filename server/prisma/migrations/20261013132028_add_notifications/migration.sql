-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SCHEDULE_PUBLISHED', 'PUBLISHED_SHIFT_TIME_CHANGED', 'PUBLISHED_SHIFT_REASSIGNED', 'PUBLISHED_SHIFT_CANCELLED', 'COVERAGE_REQUEST_SUBMITTED', 'COVERAGE_REQUEST_OPENED', 'COVERAGE_REQUEST_REJECTED', 'COVERAGE_REQUEST_CANCELLED', 'COVERAGE_REQUEST_EXPIRED', 'DIRECT_OFFER_RECEIVED', 'DIRECT_OFFER_ACCEPTED', 'DIRECT_OFFER_DECLINED', 'DIRECT_OFFER_WITHDRAWN', 'VOLUNTEER_JOINED', 'VOLUNTEER_WITHDRAWN', 'CANDIDATE_SELECTED', 'CANDIDATE_NOT_SELECTED', 'COVERAGE_REPLACEMENT_APPROVED', 'COVERAGE_DEADLINE_EXTENDED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "storeId" UUID,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "referenceData" JSONB,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_readAt_createdAt_idx" ON "Notification"("recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_storeId_createdAt_idx" ON "Notification"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
