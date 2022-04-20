/*
  Warnings:

  - A unique constraint covering the columns `[carId,role]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role` to the `Camera` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CameraRole" AS ENUM ('DRIVER', 'DOOR', 'SEATS_FRONT', 'SEATS_BACK');

-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "role" "CameraRole" NOT NULL;

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

-- CreateIndex
CREATE UNIQUE INDEX "Camera_carId_role_key" ON "Camera"("carId", "role");

-- AddForeignKey
ALTER TABLE "EcrLog" ADD CONSTRAINT "EcrLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcrLog" ADD CONSTRAINT "EcrLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
