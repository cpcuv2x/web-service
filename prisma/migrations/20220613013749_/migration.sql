/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Car` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `Car` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayId` to the `Camera` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "displayId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "displayId" SERIAL NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Camera_displayId_key" ON "Camera"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "Car_id_key" ON "Car"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Car_displayId_key" ON "Car"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_displayId_key" ON "Driver"("displayId");
