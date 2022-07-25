/*
  Warnings:

  - The `carId` column on the `AccidentLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `carId` column on the `Camera` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Car` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Car` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `carId` column on the `DrowsinessAlarmLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[carId,role]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `carId` on the `EcrLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "AccidentLog" DROP CONSTRAINT "AccidentLog_carId_fkey";

-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_carId_fkey";

-- DropForeignKey
ALTER TABLE "DrowsinessAlarmLog" DROP CONSTRAINT "DrowsinessAlarmLog_carId_fkey";

-- DropForeignKey
ALTER TABLE "EcrLog" DROP CONSTRAINT "EcrLog_carId_fkey";

-- AlterTable
ALTER TABLE "AccidentLog" DROP COLUMN "carId",
ADD COLUMN     "carId" INTEGER;

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "carId",
ADD COLUMN     "carId" INTEGER;

-- AlterTable
ALTER TABLE "Car" DROP CONSTRAINT "Car_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Car_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DrowsinessAlarmLog" DROP COLUMN "carId",
ADD COLUMN     "carId" INTEGER;

-- AlterTable
ALTER TABLE "EcrLog" DROP COLUMN "carId",
ADD COLUMN     "carId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Camera_carId_role_key" ON "Camera"("carId", "role");

-- CreateIndex
CREATE INDEX "EcrLog_start_end_carId_driverId_idx" ON "EcrLog"("start", "end", "carId", "driverId");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentLog" ADD CONSTRAINT "AccidentLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcrLog" ADD CONSTRAINT "EcrLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrowsinessAlarmLog" ADD CONSTRAINT "DrowsinessAlarmLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
