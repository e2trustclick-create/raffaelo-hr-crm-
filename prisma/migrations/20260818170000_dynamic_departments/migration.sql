CREATE TABLE "DepartmentRecord" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepartmentRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepartmentRecord_name_key" ON "DepartmentRecord"("name");

INSERT INTO "DepartmentRecord" ("id", "name")
SELECT 'dept_' || md5(value::text), value::text FROM unnest(enum_range(NULL::"Department")) AS value;

ALTER TABLE "Employee" ALTER COLUMN "department" TYPE TEXT USING "department"::text;

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_department_fkey"
FOREIGN KEY ("department") REFERENCES "DepartmentRecord"("name")
ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TYPE "Department";
