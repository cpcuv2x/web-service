import { DriverStatus, Gender } from "@prisma/client";
import * as core from "express-serve-static-core";

export interface CreateDriverDto {
  firstNameTH: string;
  lastNameTH: string;
  firstNameEN: string;
  lastNameEN: string;
  gender: string;
  birthDate: string;
  nationalId: string;
  carDrivingLicenseId: string;
  username: string;
  password: string;
}

export interface CreateDriverModelDto {
  firstNameTH: string;
  lastNameTH: string;
  firstNameEN: string;
  lastNameEN: string;
  gender: Gender;
  birthDate: Date;
  nationalId: string;
  carDrivingLicenseId: string;
}

export interface SearchDriversCriteriaQuery extends core.Query {
  id?: string;
  firstNameTH?: string;
  lastNameTH?: string;
  firstNameEN?: string;
  lastNameEN?: string;
  gender?: string;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  startBirthDate?: string;
  endBirthDate?: string;
  startRegisterDate?: string;
  endRegisterDate?: string;
  status?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDir?: string;
}

export interface SearchDriversCriteria {
  id?: string;
  firstNameTH?: string;
  lastNameTH?: string;
  firstNameEN?: string;
  lastNameEN?: string;
  gender?: Gender;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  startBirthDate?: Date;
  endBirthDate?: Date;
  startRegisterDate?: Date;
  endRegisterDate?: Date;
  status?: DriverStatus;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export interface UpdateDriverDto {
  firstNameTH?: string;
  lastNameTH?: string;
  firstNameEN?: string;
  lastNameEN?: string;
  gender?: string;
  birthDate?: string;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  status?: string;
}

export interface UpdateDriverModelDto {
  firstNameTH?: string;
  lastNameTH?: string;
  firstNameEN?: string;
  lastNameEN?: string;
  gender?: Gender;
  birthDate?: Date;
  nationalId?: string;
  carDrivingLicenseId?: string;
  imageFilename?: string;
  status?: DriverStatus;
  timestamp?: Date,
  ecrThreshold?: number
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

export interface GetDriverDrowsinessAlarmLogsCriteriaQuery {
  startTime?: Date;
  endTime?: Date;
}

export interface GetDriverDrowsinessAlarmLogsCriteria {
  driverId?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface GetECRInfluxQuery {
  carId?: string;
  startTime?: string;
  endTime?: string;
  aggregate?: boolean;
  maxPoints? : number;
}

export interface GetDrowsinessInfluxQuery {
  startTime?: string;
  endTime?: string;
  aggregate?: boolean;
}
