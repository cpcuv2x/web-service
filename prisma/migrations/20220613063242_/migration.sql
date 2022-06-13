/*
  Warnings:

  - You are about to drop the column `displayId` on the `Car` table. All the data in the column will be lost.
  - You are about to drop the column `displayId` on the `Driver` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - The required column `userId` was added to the `Driver` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_id_fkey";

-- DropIndex
DROP INDEX "Car_displayId_key";

-- DropIndex
DROP INDEX "Car_id_key";

-- DropIndex
DROP INDEX "Driver_displayId_key";

-- AlterTable
ALTER TABLE "Camera" ALTER COLUMN "id" SET DEFAULT CONCAT('C', LPAD(nextval('serialC')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Car" DROP COLUMN "displayId",
ALTER COLUMN "id" SET DEFAULT CONCAT('V', LPAD(nextval('serialV')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "displayId",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT CONCAT('D', LPAD(nextval('serialD')::text, 4, '0'));

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
