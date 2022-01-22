import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CarDocument = Car & Document;

@Schema()
export class Car {

  _id: mongoose.Types.ObjectId;

  @Prop()
  licensePlate: string;

  @Prop()
  model: string;
  
  @Prop()
  imageLink: string;
  
  @Prop(String)
  status: "active" | "inactive";
  
  @Prop()
  driverName: string;
  
  @Prop()
  passenger: number;
  
  @Prop([String, String])
  streamLinks: {
    cameraId: string;
    link: string;
  }[];

  @Prop()
  socketConnection: string;
}

export const CarSchema = SchemaFactory.createForClass(Car);
