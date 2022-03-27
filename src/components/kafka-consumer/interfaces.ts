import { EventMessageType, EventStatus } from "./enums";

export interface EventMessageRaw {
  car_id?: string;
  driver_id?: string;
  camera_id?: string;
  lat?: string;
  lng?: string;
  time?: number;
  type?: string;
  passenger?: number;
  ecr?: number;
  status?: string;
}

export interface EventMessage {
  type?: EventMessageType;
  timestamp?: Date;
  carId?: string;
  driverId?: string;
  cameraId?: string;
  lat?: number;
  lng?: number;
  passengers?: number;
  ecr?: number;
  status?: EventStatus;
}
