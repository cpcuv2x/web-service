import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { DashboardItem } from './dashboard-item.schema';

export type DashboardItemAssociationDocument = DashboardItemAssociation &
  mongoose.Document;

@Schema()
export class DashboardItemAssociation {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: DashboardItem.name })
  dashboardItem: DashboardItem;

  @Prop()
  x: number;

  @Prop()
  y: number;

  @Prop()
  w: number;

  @Prop()
  h: number;
}

export const DashboardItemAssociationSchema = SchemaFactory.createForClass(
  DashboardItemAssociation,
);
