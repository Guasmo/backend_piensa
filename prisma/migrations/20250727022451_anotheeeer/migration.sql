/*
  Warnings:

  - You are about to drop the column `battery_remaining_percent` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `current_mA` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `power_mW` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `sample_index` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `speaker_id` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `total_consumed_mAh` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `voltage_V` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `avgCurrent_mA` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `avgPower_mW` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `avgVoltage_V` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `totalConsumed_mAh` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `totalCurrent_mA` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `totalPower_mW` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `totalVoltage_V` on the `history` table. All the data in the column will be lost.
  - Added the required column `ampereHours` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batteryPercentage` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voltageHours` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wattsHours` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avgAmpereHours` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avgVoltageHours` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avgWattsHours` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmpereHours` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalVoltageHours` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWattsHours` to the `history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- AlterTable
ALTER TABLE "energy_measurements" DROP COLUMN "battery_remaining_percent",
DROP COLUMN "current_mA",
DROP COLUMN "power_mW",
DROP COLUMN "sample_index",
DROP COLUMN "speaker_id",
DROP COLUMN "timestamp",
DROP COLUMN "total_consumed_mAh",
DROP COLUMN "voltage_V",
ADD COLUMN     "ampereHours" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "batteryPercentage" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "voltageHours" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "wattsHours" DECIMAL(10,4) NOT NULL;

-- AlterTable
ALTER TABLE "history" DROP COLUMN "avgCurrent_mA",
DROP COLUMN "avgPower_mW",
DROP COLUMN "avgVoltage_V",
DROP COLUMN "totalConsumed_mAh",
DROP COLUMN "totalCurrent_mA",
DROP COLUMN "totalPower_mW",
DROP COLUMN "totalVoltage_V",
ADD COLUMN     "avgAmpereHours" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "avgVoltageHours" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "avgWattsHours" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "totalAmpereHours" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "totalVoltageHours" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "totalWattsHours" DECIMAL(10,4) NOT NULL;
