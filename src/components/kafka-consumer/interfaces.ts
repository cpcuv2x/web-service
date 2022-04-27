import { MessageDeviceStatus, MessageKind, MessageType } from "./enums";

export interface MessageRaw {
  type?: string;
  kind?: string;
  car_id?: string;
  driver_id?: string;
  device_status?: {
    cam_driver: {
      camera_id: string;
      status: string;
    };
    cam_door: {
      camera_id: string;
      status: string;
    };
    cam_front: {
      camera_id: string;
      status: string;
    };
    cam_back: {
      camera_id: string;
      status: string;
    };
    drowsiness_module: {
      status: string;
    };
    accident_module: {
      status: string;
    };
  };
  passenger?: number;
  ecr?: number;
  ecr_threshold?: number;
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
  deviceStatus?: {
    cameraDriver: {
      cameraId: string;
      status: MessageDeviceStatus;
    };
    cameraDoor: {
      cameraId: string;
      status: MessageDeviceStatus;
    };
    cameraSeatsFront: {
      cameraId: string;
      status: MessageDeviceStatus;
    };
    cameraSeatsBack: {
      cameraId: string;
      status: MessageDeviceStatus;
    };
    drowsinessModule: {
      status: MessageDeviceStatus;
    };
    accidentModule: {
      status: MessageDeviceStatus;
    };
  };
  passengers?: number;
  ecr?: number;
  ecrThreshold?: number;
  responseTime?: number;
  lat?: number;
  lng?: number;
  timestamp?: Date;
}
