/*
  Warnings:

  - You are about to drop the column `currentVolume` on the `speakers` table. All the data in the column will be lost.
  - You are about to drop the column `volumeUpdatedAt` on the `speakers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "speakers" DROP COLUMN "currentVolume",
DROP COLUMN "volumeUpdatedAt";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
