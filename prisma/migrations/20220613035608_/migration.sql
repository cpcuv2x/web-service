/*
  Warnings:

  - You are about to drop the column `displayId` on the `Camera` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_carId_fkey";

-- DropIndex
DROP INDEX "Camera_displayId_key";

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "displayId",
ALTER COLUMN "carId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
