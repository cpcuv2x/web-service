import { MessageKind, MessageType } from "./enums";

export interface MessageRaw {
  type?: string;
  kind?: string;
  car_id?: string;
  driver_id?: string;
  device_status?: any;
  passenger?: number;
  ecr?: number;
  response_time?: number;
  lat?: string;
  lng?: string;
  time?: number;
}

export interface Message {
  type?: MessageType;
  kind?: MessageKind;
  carId?: string;
  driverId?: string;
  deviceStatus?: any;
  passengers?: number;
  ecr?: number;
  responseTime?: number;
  lat?: number;
  lng?: number;
  timestamp?: Date;
}
