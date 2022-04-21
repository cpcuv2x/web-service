export enum MessageType {
  Heartbeat = "heartbeat",
  Metric = "metric",
  Event = "event",
}

export enum MessageKind {
  // Heartbeat
  Car = "car",
  // Metric
  CarLocation = "car_location",
  CarPassengers = "car_passenger",
  DriverECR = "driver_ecr",
  // Event
  Accident = "accident",
  DrowsinessAlarm = "drowsiness_alarm",
}

export enum MessageDeviceStatus {
  Active = "active",
  Inactive = "inactive",
}
