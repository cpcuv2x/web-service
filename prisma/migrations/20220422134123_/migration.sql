-- CreateTable
CREATE TABLE "DrowsinessAlarmLog" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "responseTime" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrowsinessAlarmLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DrowsinessAlarmLog" ADD CONSTRAINT "DrowsinessAlarmLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrowsinessAlarmLog" ADD CONSTRAINT "DrowsinessAlarmLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
