/*
  Warnings:

  - You are about to drop the `Accident` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Accident" DROP CONSTRAINT "Accident_carId_fkey";

-- DropForeignKey
ALTER TABLE "Accident" DROP CONSTRAINT "Accident_driverId_fkey";

-- DropTable
DROP TABLE "Accident";

-- CreateTable
CREATE TABLE "AccidentLog" (
    "id" TEXT NOT NULL,
    "carId" TEXT,
    "driverId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AccidentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccidentLog" ADD CONSTRAINT "AccidentLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentLog" ADD CONSTRAINT "AccidentLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
