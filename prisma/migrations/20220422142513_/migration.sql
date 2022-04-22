-- DropForeignKey
ALTER TABLE "DrowsinessAlarmLog" DROP CONSTRAINT "DrowsinessAlarmLog_carId_fkey";

-- DropForeignKey
ALTER TABLE "DrowsinessAlarmLog" DROP CONSTRAINT "DrowsinessAlarmLog_driverId_fkey";

-- AlterTable
ALTER TABLE "DrowsinessAlarmLog" ALTER COLUMN "carId" DROP NOT NULL,
ALTER COLUMN "driverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DrowsinessAlarmLog" ADD CONSTRAINT "DrowsinessAlarmLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrowsinessAlarmLog" ADD CONSTRAINT "DrowsinessAlarmLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
