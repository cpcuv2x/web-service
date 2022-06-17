-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" SET DEFAULT CONCAT('C', LPAD(nextval('serialC')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" SET DEFAULT CONCAT('V', LPAD(nextval('serialV')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Driver" ALTER COLUMN "id" SET DEFAULT CONCAT('D', LPAD(nextval('serialD')::text, 4, '0'));

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
