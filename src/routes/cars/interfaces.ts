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
  licensePlate?: string;
  model?: string;
  imageFilename?: string;
  status?: CarStatus;
  minPassengers?: number;
  maxPassengers?: number;
  limit: number;
  offset: number;
  orderBy: string;
  orderDir: "asc" | "desc";
}

export interface UpdateCarDto {}
