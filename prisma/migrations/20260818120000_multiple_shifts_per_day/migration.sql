ALTER TABLE "ShiftSchedule" ADD COLUMN "isExtra" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX "ShiftSchedule_employeeId_date_key";

CREATE UNIQUE INDEX "ShiftSchedule_employeeId_date_startTime_key"
ON "ShiftSchedule"("employeeId", "date", "startTime");

CREATE INDEX "ShiftSchedule_employeeId_date_idx"
ON "ShiftSchedule"("employeeId", "date");
