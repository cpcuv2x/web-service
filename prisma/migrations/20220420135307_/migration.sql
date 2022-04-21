/*
  Warnings:

  - Added the required column `status` to the `Camera` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "status" "CameraStatus" NOT NULL;

-- CreateTable
CREATE TABLE "EcrLog" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "carId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EcrLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EcrLog_start_end_carId_driverId_idx" ON "EcrLog"("start", "end", "carId", "driverId");

-- AddForeignKey
ALTER TABLE "EcrLog" ADD CONSTRAINT "EcrLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcrLog" ADD CONSTRAINT "EcrLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
