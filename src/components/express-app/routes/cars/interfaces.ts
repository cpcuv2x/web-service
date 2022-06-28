import { CarStatus } from "@prisma/client";
import * as core from "express-serve-static-core";
import { Status } from "../../../../enum/Status";
import { ModuleRole } from "../../../../enum/ModuleRole";

export interface CreateCarDto {
  licensePlate: string;
  model: string;
  cameras: {
    id: string;
  }[];
}

export interface SearchCarsCriteriaQuery extends core.Query {
  id?: string;
  licensePlate?: string;
  model?: string;
  imageFilename?: string;
  status?: string;
  minPassengers?: string;
  maxPassengers?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDir?: string;
}

export interface SearchCarsCriteria {
  id?: string;
  licensePlate?: string;
  model?: string;
  imageFilename?: string;
  status?: CarStatus;
  minPassengers?: number;
  maxPassengers?: number;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export interface UpdateCarDto {
  licensePlate?: string;
  model?: string;
  cameras?: {
    connect: { id: string }[];
    disconnect: { id: string }[];
  };
}

export interface UpdateCarModel {
  licensePlate?: string;
  model?: string;
  imageFilename?: string;
  status?: CarStatus;
  passengers?: number;
  lat?: number;
  long?: number;
  driverId?: string | null;
  cameras?: {
    connect: { id: string }[];
    disconnect: { id: string }[];
  };
  timestamp?: Date;
}

export interface GetCarAccidentLogsCriteriaQuery {
  startTime?: Date;
  endTime?: Date;
}

export interface GetCarAccidentLogsCriteria {
  carId?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface GetPassengerInfluxQuery {
  startTime?: string;
  endTime?: string;
  aggregate?: boolean;
  maxPoints?: number
}

export interface Module {
  carId : String;
  status : Status;
  role : ModuleRole;
  timestamp? : Date;
}

export interface UpdateModuleDTO {
  status? : Status;
  timestamp? : Date;
}