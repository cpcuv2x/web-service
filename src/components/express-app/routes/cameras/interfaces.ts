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
  id?: string;
  name?: string;
  description?: string;
  streamUrl?: string;
  carId?: string;
  status?: string;
  role?: string;
  limit?: string;
  offset?: string;
  orderBy?: string;
  orderDir?: string;
}

export interface SearchCamerasCriteria {
  id?: string;
  name?: string;
  description?: string;
  streamUrl?: string;
  carId?: string;
  status?: CameraStatus;
  role?: CameraRole;
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
  role?: CameraRole;
  timestamp?: Date;
}
