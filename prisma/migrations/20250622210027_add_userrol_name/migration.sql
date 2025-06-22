/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `UserRol` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `UserRol` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserRol" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserRol_name_key" ON "UserRol"("name");
