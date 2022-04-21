import { CameraRole, CameraStatus } from "@prisma/client";
import * as core from "express-serve-static-core";

export interface CreateCameraDto {
  name: string;
  description: string;
  streamUrl: string;
  carId: string | null;
  role: CameraRole;
}

export interface SearchCamerasCriteriaQuery extends core.Query {
  name?: string;
  description?: string;
  streamUrl?: string;
  carId?: string;
  status?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDir?: string;
}

export interface SearchCamerasCriteria {
  name?: string;
  description?: string;
  streamUrl?: string;
  carId?: string;
  status?: CameraStatus;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export interface UpdateCameraDto {
  name?: string;
  description?: string;
  streamUrl?: string;
  carId?: string;
  status?: CameraStatus;
  role: CameraRole;
}
