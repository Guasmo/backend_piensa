/*
  Warnings:

  - You are about to drop the `Battery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Consume` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `History` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Speaker` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRol` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Userspeaker` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'INTERRUPTED');

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_consumeId_fkey";

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_speakerId_fkey";

-- DropForeignKey
ALTER TABLE "Speaker" DROP CONSTRAINT "Speaker_batteryId_fkey";

-- DropForeignKey
ALTER TABLE "Speaker" DROP CONSTRAINT "Speaker_positionId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_userRolId_fkey";

-- DropForeignKey
ALTER TABLE "Userspeaker" DROP CONSTRAINT "Userspeaker_speakerId_fkey";

-- DropForeignKey
ALTER TABLE "Userspeaker" DROP CONSTRAINT "Userspeaker_userId_fkey";

-- DropTable
DROP TABLE "Battery";

-- DropTable
DROP TABLE "Consume";

-- DropTable
DROP TABLE "History";

-- DropTable
DROP TABLE "Position";

-- DropTable
DROP TABLE "Speaker";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserRol";

-- DropTable
DROP TABLE "Userspeaker";

-- CreateTable
CREATE TABLE "speakers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "state" BOOLEAN NOT NULL DEFAULT false,
    "batteryPercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_sessions" (
    "id" SERIAL NOT NULL,
    "speakerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "initialBatteryPercentage" DECIMAL(5,2),
    "finalBatteryPercentage" DECIMAL(5,2),
    "speakerName" TEXT,
    "speakerPosition" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "usage_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_measurements" (
    "id" SERIAL NOT NULL,
    "usageSessionId" INTEGER NOT NULL,
    "voltageHours" DECIMAL(10,4) NOT NULL,
    "wattsHours" DECIMAL(10,4) NOT NULL,
    "ampereHours" DECIMAL(10,4) NOT NULL,
    "batteryPercentage" DECIMAL(5,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" SERIAL NOT NULL,
    "usageSessionId" INTEGER NOT NULL,
    "speakerId" INTEGER NOT NULL,
    "speakerName" TEXT NOT NULL,
    "speakerPosition" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "avgVoltageHours" DECIMAL(10,4) NOT NULL,
    "avgWattsHours" DECIMAL(10,4) NOT NULL,
    "avgAmpereHours" DECIMAL(10,4) NOT NULL,
    "totalVoltageHours" DECIMAL(10,4) NOT NULL,
    "totalWattsHours" DECIMAL(10,4) NOT NULL,
    "totalAmpereHours" DECIMAL(10,4) NOT NULL,
    "initialBatteryPercentage" DECIMAL(5,2) NOT NULL,
    "finalBatteryPercentage" DECIMAL(5,2) NOT NULL,
    "batteryConsumed" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userspeakers" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "speakerId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userspeakers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "history_usageSessionId_key" ON "history"("usageSessionId");

-- AddForeignKey
ALTER TABLE "usage_sessions" ADD CONSTRAINT "usage_sessions_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "speakers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_sessions" ADD CONSTRAINT "usage_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_measurements" ADD CONSTRAINT "energy_measurements_usageSessionId_fkey" FOREIGN KEY ("usageSessionId") REFERENCES "usage_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_usageSessionId_fkey" FOREIGN KEY ("usageSessionId") REFERENCES "usage_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "speakers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history" ADD CONSTRAINT "history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userspeakers" ADD CONSTRAINT "userspeakers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userspeakers" ADD CONSTRAINT "userspeakers_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "speakers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
