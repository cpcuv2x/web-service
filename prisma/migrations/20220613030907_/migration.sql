/*
  Warnings:

  - The `carId` column on the `Camera` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `displayId` column on the `Camera` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[displayId]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[carId,role]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_carId_fkey";

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "carId",
ADD COLUMN     "carId" INTEGER,
DROP COLUMN "displayId",
ADD COLUMN     "displayId" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "NumberOfEntity" (
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "NumberOfEntity_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "Camera_displayId_key" ON "Camera"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_carId_role_key" ON "Camera"("carId", "role");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("displayId") ON DELETE SET NULL ON UPDATE CASCADE;
