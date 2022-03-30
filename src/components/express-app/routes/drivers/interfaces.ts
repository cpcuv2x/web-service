import { DriverStatus } from "@prisma/client";
import * as core from "express-serve-static-core";

export interface CreateDriverDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  carDrivingLicenseId: string;
}

export interface CreateDriverModelDto {
  firstName: string;
  lastName: string;
  birthDate: Date;
  nationalId: string;
  carDrivingLicenseId: string;
  imageFilename: string;
  status: DriverStatus;
}

export interface SearchDriversCriteriaQuery extends core.Query {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  startBirthDate?: string;
  endBirthDate?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDir?: string;
}

export interface SearchDriversCriteria {
  firstName: string | undefined;
  lastName: string | undefined;
  nationalId: string | undefined;
  carDrivingLicenseId: string | undefined;
  imageFilename: string | undefined;
  startBirthDate: string | undefined;
  endBirthDate: string | undefined;
  limit: number;
  offset: number;
  orderBy: string;
  orderDir: "asc" | "desc";
}

export interface UpdateDriverDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  carDrivingLicenseId: string;
  imageFilename: string;
}

export interface UpdateDriverModelDto {
  firstName: string;
  lastName: string;
  birthDate: Date;
  nationalId: string;
  carDrivingLicenseId: string;
  imageFilename: string;
}
