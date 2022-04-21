/*
  Warnings:

  - Added the required column `status` to the `Camera` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "status" "CameraStatus" NOT NULL;
