/*
  Warnings:

  - The primary key for the `Car` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "AccidentLog" DROP CONSTRAINT "AccidentLog_carId_fkey";

-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_carId_fkey";

-- DropForeignKey
ALTER TABLE "DrowsinessAlarmLog" DROP CONSTRAINT "DrowsinessAlarmLog_carId_fkey";

-- DropForeignKey
ALTER TABLE "EcrLog" DROP CONSTRAINT "EcrLog_carId_fkey";

-- AlterTable
ALTER TABLE "AccidentLog" ALTER COLUMN "carId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Camera" ALTER COLUMN "carId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Car" DROP CONSTRAINT "Car_pkey",
ALTER COLUMN "id" SET DEFAULT E'1234',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Car_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Car_id_seq";

-- AlterTable
ALTER TABLE "DrowsinessAlarmLog" ALTER COLUMN "carId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "EcrLog" ALTER COLUMN "carId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentLog" ADD CONSTRAINT "AccidentLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcrLog" ADD CONSTRAINT "EcrLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrowsinessAlarmLog" ADD CONSTRAINT "DrowsinessAlarmLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
