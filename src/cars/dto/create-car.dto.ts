import { IsString, IsEnum, IsNumber, IsArray } from "class-validator";
import { CarStatus } from "../enums/car-status.enum";

export class CreateCarDto {

  @IsString()
  licensePlate: string;
  
  @IsString()
  model: string;
  
  @IsString()
  imageLink: string;

  @IsEnum(CarStatus)
  status: CarStatus;
  
  @IsString()
  driverName: string;

  @IsNumber()
  passenger: number;

  @IsArray()
  streamLinks: {
    cameraId: string;
    link: string;
  }[];

  @IsString()
  socketConnection: string;
}
