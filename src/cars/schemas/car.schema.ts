import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CarStatus } from '../enums/car-status.enum';

export type CarDocument = Car & mongoose.Document;

@Schema()
export class Car {

  @Prop()
  licensePlate: string;

  @Prop()
  model: string;
  
  @Prop()
  imageLink: string;
  
  @Prop()
  status: CarStatus;
  
  @Prop()
  driverName: string;
  
  @Prop()
  passenger: number;
  
  @Prop([{ cameraId: String, link: String }])
  streamLinks: {
    cameraId: string;
    link: string;
  }[];

  @Prop()
  socketConnection: string;
}

export const CarSchema = SchemaFactory.createForClass(Car);
