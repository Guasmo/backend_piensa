/*
  Warnings:

  - You are about to drop the column `ampereHours` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `batteryPercentage` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `voltageHours` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `wattsHours` on the `energy_measurements` table. All the data in the column will be lost.
  - You are about to drop the column `avgAmpereHours` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `avgVoltageHours` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `avgWattsHours` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmpereHours` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `totalVoltageHours` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `totalWattsHours` on the `history` table. All the data in the column will be lost.
  - Added the required column `battery_remaining_percent` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_mA` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `power_mW` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sample_index` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speaker_id` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_consumed_mAh` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voltage_V` to the `energy_measurements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avgCurrent_mA` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avgPower_mW` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avgVoltage_V` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalConsumed_mAh` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCurrent_mA` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPower_mW` to the `history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalVoltage_V` to the `history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "energy_measurements" DROP COLUMN "ampereHours",
DROP COLUMN "batteryPercentage",
DROP COLUMN "voltageHours",
DROP COLUMN "wattsHours",
ADD COLUMN     "battery_remaining_percent" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "current_mA" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "power_mW" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "sample_index" INTEGER NOT NULL,
ADD COLUMN     "speaker_id" INTEGER NOT NULL,
ADD COLUMN     "timestamp" INTEGER NOT NULL,
ADD COLUMN     "total_consumed_mAh" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "voltage_V" DECIMAL(10,4) NOT NULL;

-- AlterTable
ALTER TABLE "history" DROP COLUMN "avgAmpereHours",
DROP COLUMN "avgVoltageHours",
DROP COLUMN "avgWattsHours",
DROP COLUMN "totalAmpereHours",
DROP COLUMN "totalVoltageHours",
DROP COLUMN "totalWattsHours",
ADD COLUMN     "avgCurrent_mA" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "avgPower_mW" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "avgVoltage_V" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "totalConsumed_mAh" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "totalCurrent_mA" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "totalPower_mW" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "totalVoltage_V" DECIMAL(10,4) NOT NULL;
