import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import { DashboardItemAssociation } from './dashboard-item-association.schema';

export type DashboardDocument = Dashboard & mongoose.Document;

@Schema()
export class Dashboard {
  @Prop()
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, select: false })
  user: User;

  @Prop([
    {
      type: DashboardItemAssociation,
    },
  ])
  items: DashboardItemAssociation[];
}

export const DashboardSchema = SchemaFactory.createForClass(Dashboard);
