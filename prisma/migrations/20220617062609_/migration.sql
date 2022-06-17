/*
  Warnings:

  - You are about to drop the `NumberOfEntity` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ModuleRole" AS ENUM ('DROWSINESS_MODULE', 'ACCIDENT_MODULE');

-- AlterTable
ALTER TABLE "Camera" ALTER COLUMN "id" SET DEFAULT CONCAT('C', LPAD(nextval('serialC')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Car" ALTER COLUMN "id" SET DEFAULT CONCAT('V', LPAD(nextval('serialV')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Driver" ALTER COLUMN "id" SET DEFAULT CONCAT('D', LPAD(nextval('serialD')::text, 4, '0'));

-- DropTable
DROP TABLE "NumberOfEntity";

-- CreateTable
CREATE TABLE "Module" (
    "carId" TEXT NOT NULL,
    "role" "ModuleRole" NOT NULL,
    "status" "ModuleStatus" NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("carId","role")
);

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
