-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_carId_fkey";

-- AlterTable
ALTER TABLE "Camera" ALTER COLUMN "carId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
