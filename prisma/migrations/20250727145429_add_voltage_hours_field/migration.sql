-- AlterTable
ALTER TABLE "energy_measurements" ADD COLUMN     "rawData" JSONB;

-- AlterTable
ALTER TABLE "history" ADD COLUMN     "esp32Data" JSONB;

-- AlterTable
ALTER TABLE "usage_sessions" ADD COLUMN     "metadata" JSONB;
