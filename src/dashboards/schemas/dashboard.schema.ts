import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Expose } from 'class-transformer';
import * as mongoose from 'mongoose';
import { DashboardItemAssociation } from './dashboard-item-association.schema';
export type DashboardDocument = Dashboard & mongoose.Document;

@Schema()
export class Dashboard {
  @Prop()
  name: string;

  @Prop([
    {
      type: DashboardItemAssociation,
    },
  ])
  items: DashboardItemAssociation[];
}

export const DashboardSchema = SchemaFactory.createForClass(Dashboard);
