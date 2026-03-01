-- Align ProgramStack columns with current schema
ALTER TABLE "ProgramStack"
ADD COLUMN IF NOT EXISTS "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN IF NOT EXISTS "startTime" TEXT,
ADD COLUMN IF NOT EXISTS "startTimes" JSONB;

-- Migrate legacy single weekday into new weekdays array when empty
UPDATE "ProgramStack"
SET "weekdays" = ARRAY["weekday"]::INTEGER[]
WHERE "weekday" IS NOT NULL
  AND COALESCE(array_length("weekdays", 1), 0) = 0;
