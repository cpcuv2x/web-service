import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DashboardItemDocument = DashboardItem & Document;

@Schema()
export class DashboardItem {
  @Prop()
  metadata: string;
}

export const DashboardItemSchema = SchemaFactory.createForClass(DashboardItem);
