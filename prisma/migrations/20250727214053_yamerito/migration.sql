-- AlterTable
ALTER TABLE "speakers" ADD COLUMN     "currentVolume" DECIMAL(65,30) NOT NULL DEFAULT 25,
ADD COLUMN     "volumeUpdatedAt" TIMESTAMP(3);
