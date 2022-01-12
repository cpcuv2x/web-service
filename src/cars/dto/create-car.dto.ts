export class CreateCarDto {
  licensePlate: string;
  model: string;
  imageLink: string;
  status: "active" | "inactive";
  driverName: string;
  passenger: number;
  streamLinks: {
    cameraId: string;
    link: string;
  }[];
  socketConnection: string;
}
