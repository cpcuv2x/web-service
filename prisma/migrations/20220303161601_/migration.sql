/*
  Warnings:

  - A unique constraint covering the columns `[nationalId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[carDrivingLicenseId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Driver_nationalId_key" ON "Driver"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_carDrivingLicenseId_key" ON "Driver"("carDrivingLicenseId");
