import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DashboardItemAssociation,
  DashboardItemAssociationSchema,
} from './schemas/dashboard-item-association.schema';
import {
  DashboardItem,
  DashboardItemSchema,
} from './schemas/dashboard-item.schema';
import { Dashboard, DashboardSchema } from './schemas/dashboard.schema';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { User, UserSchema } from 'src/user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Dashboard.name, schema: DashboardSchema },
      { name: DashboardItem.name, schema: DashboardItemSchema },
      {
        name: DashboardItemAssociation.name,
        schema: DashboardItemAssociationSchema,
      },
    ]),
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}
