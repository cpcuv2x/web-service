import { DriverStatus } from "@prisma/client";
import * as core from "express-serve-static-core";

export interface CreateDriverDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  carDrivingLicenseId: string;
  username: string;
  password: string;
}

export interface CreateDriverModelDto {
  firstName: string;
  lastName: string;
  birthDate: Date;
  nationalId: string;
  carDrivingLicenseId: string;
  imageFilename: string;
}

export interface SearchDriversCriteriaQuery extends core.Query {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  startBirthDate?: string;
  endBirthDate?: string;
  status?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDir?: string;
}

export interface SearchDriversCriteria {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  startBirthDate?: string;
  endBirthDate?: string;
  status?: DriverStatus;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export interface UpdateDriverDto {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  status?: string;
}

export interface UpdateDriverModelDto {
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  status?: DriverStatus;
}

export interface GetDriverAccidentLogsCriteriaQuery {
  startTime?: Date;
  endTime?: Date;
}

export interface GetDriverAccidentLogsCriteria {
  driverId?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface GetECRInfluxQuery {
  carId?: string;
  startTime?: string;
  endTime?: string;
  aggregate?: boolean;
}

export interface GetDrowsinessInfluxQuery {
  startTime?: string;
  endTime?: string;
  aggregate?: boolean;
}
