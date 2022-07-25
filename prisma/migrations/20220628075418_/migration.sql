-- AlterTable
ALTER TABLE "Camera" ALTER COLUMN "id" SET DEFAULT CONCAT('C', LPAD(nextval('serialC')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Car" ALTER COLUMN "id" SET DEFAULT CONCAT('V', LPAD(nextval('serialV')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Driver" ALTER COLUMN "id" SET DEFAULT CONCAT('D', LPAD(nextval('serialD')::text, 4, '0')),
ALTER COLUMN "ecrThreshold" SET DEFAULT 0,
ALTER COLUMN "ecrThreshold" SET DATA TYPE DOUBLE PRECISION;
