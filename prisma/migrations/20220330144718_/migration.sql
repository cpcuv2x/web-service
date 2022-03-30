-- CreateTable
CREATE TABLE "Accident" (
    "id" TEXT NOT NULL,
    "carId" TEXT,
    "driverId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Accident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Accident" ADD CONSTRAINT "Accident_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accident" ADD CONSTRAINT "Accident_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
