/*
  Warnings:

  - You are about to drop the column `firstName` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Driver` table. All the data in the column will be lost.
  - Added the required column `firstNameEN` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstNameTH` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastNameEN` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastNameTH` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registerDate` to the `Driver` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NOT_SPECIFIED');

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "firstNameEN" TEXT NOT NULL,
ADD COLUMN     "firstNameTH" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "lastNameEN" TEXT NOT NULL,
ADD COLUMN     "lastNameTH" TEXT NOT NULL,
ADD COLUMN     "registerDate" TIMESTAMP(3) NOT NULL;
