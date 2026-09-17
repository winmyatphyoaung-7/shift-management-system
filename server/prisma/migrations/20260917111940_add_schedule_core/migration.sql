-- CreateEnum
CREATE TYPE "ScheduleDayStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "ScheduleDay" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "scheduleDate" DATE NOT NULL,
    "status" "ScheduleDayStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedByMembershipId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageRequirement" (
    "id" UUID NOT NULL,
    "scheduleDayId" UUID NOT NULL,
    "shiftPresetId" UUID NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" UUID NOT NULL,
    "scheduleDayId" UUID NOT NULL,
    "assigneeMembershipId" UUID NOT NULL,
    "shiftPresetId" UUID,
    "createdByMembershipId" UUID NOT NULL,
    "updatedByMembershipId" UUID NOT NULL,
    "cancelledByMembershipId" UUID,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "breakMinutes" INTEGER NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" VARCHAR(500),
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleDay_storeId_status_idx" ON "ScheduleDay"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleDay_storeId_scheduleDate_key" ON "ScheduleDay"("storeId", "scheduleDate");

-- CreateIndex
CREATE INDEX "CoverageRequirement_shiftPresetId_idx" ON "CoverageRequirement"("shiftPresetId");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageRequirement_scheduleDayId_shiftPresetId_key" ON "CoverageRequirement"("scheduleDayId", "shiftPresetId");

-- CreateIndex
CREATE INDEX "Shift_scheduleDayId_status_idx" ON "Shift"("scheduleDayId", "status");

-- CreateIndex
CREATE INDEX "Shift_assigneeMembershipId_startAt_idx" ON "Shift"("assigneeMembershipId", "startAt");

-- CreateIndex
CREATE INDEX "Shift_shiftPresetId_idx" ON "Shift"("shiftPresetId");

-- AddForeignKey
ALTER TABLE "ScheduleDay" ADD CONSTRAINT "ScheduleDay_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDay" ADD CONSTRAINT "ScheduleDay_publishedByMembershipId_fkey" FOREIGN KEY ("publishedByMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequirement" ADD CONSTRAINT "CoverageRequirement_scheduleDayId_fkey" FOREIGN KEY ("scheduleDayId") REFERENCES "ScheduleDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequirement" ADD CONSTRAINT "CoverageRequirement_shiftPresetId_fkey" FOREIGN KEY ("shiftPresetId") REFERENCES "ShiftPreset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_scheduleDayId_fkey" FOREIGN KEY ("scheduleDayId") REFERENCES "ScheduleDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_shiftPresetId_fkey" FOREIGN KEY ("shiftPresetId") REFERENCES "ShiftPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_assigneeMembershipId_fkey" FOREIGN KEY ("assigneeMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_updatedByMembershipId_fkey" FOREIGN KEY ("updatedByMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_cancelledByMembershipId_fkey" FOREIGN KEY ("cancelledByMembershipId") REFERENCES "StoreMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
