import * as core from "express-serve-static-core";
import { CarStatus } from "./enums";

export interface CreateCarDto {
  licensePlate: string;
  model: string;
}

export interface CreateCarModelDto {
  licensePlate: string;
  model: string;
  imageFilename: string;
}

export interface SearchCarsCriteriaQuery extends core.Query {
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
  licensePlate: string | undefined;
  model: string | undefined;
  imageFilename: string | undefined;
  status: CarStatus | undefined;
  minPassengers: number | undefined;
  maxPassengers: number | undefined;
  limit: number;
  offset: number;
  orderBy: string;
  orderDir: "asc" | "desc";
}

export interface UpdateCarDto {}
