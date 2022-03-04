/*
  Warnings:

  - Added the required column `birthDate` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carDrivingLicenseId` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationalId` to the `Driver` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "carDrivingLicenseId" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "nationalId" TEXT NOT NULL;
