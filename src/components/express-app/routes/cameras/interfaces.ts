import * as core from "express-serve-static-core";

export interface CreateCameraDto {
  name: string;
  description: string;
  streamUrl: string;
}

export interface SearchCamerasCriteriaQuery extends core.Query {
  carId?: string;
  name?: string;
  description?: string;
  streamUrl?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDir?: string;
}

export interface SearchCamerasCriteria {
  carId?: string;
  name?: string;
  description?: string;
  streamUrl?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export interface UpdateCameraDto {
  name: string;
  description: string;
  streamUrl: string;
}
