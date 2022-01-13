import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CreateDashboardDto } from './dtos/create-dashboard-dto';
import {
  DashboardItemAssociation,
  DashboardItemAssociationDocument,
} from './schemas/dashboard-item-association.schema';
import {
  DashboardItem,
  DashboardItemDocument,
} from './schemas/dashboard-item.schema';
import { DashboardUpdateItemsDto } from './dtos/dashboard-update-items-dto';
import { Dashboard, DashboardDocument } from './schemas/dashboard.schema';
import { UpdateDashboardDto } from './dtos/update-dashboard-dto';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel(Dashboard.name)
    private dashboardModel: mongoose.Model<DashboardDocument>,
    @InjectModel(DashboardItem.name)
    private dashboardItemModel: mongoose.Model<DashboardItemDocument>,
    @InjectModel(DashboardItemAssociation.name)
    private dashboardItemAssociationModel: mongoose.Model<DashboardItemAssociationDocument>,
  ) {}

  async create(createDashboardDto: CreateDashboardDto): Promise<Dashboard> {
    const createdDashboard = new this.dashboardModel(createDashboardDto);
    return createdDashboard.save();
  }

  async getAll(): Promise<Dashboard[]> {
    return this.dashboardModel.find().select('-items');
  }

  async getOneById(id: string): Promise<Dashboard> {
    return this.dashboardModel.findById(id).populate({
      path: 'items',
      populate: {
        path: 'dashboardItem',
      },
    });
  }

  async update(
    id: string,
    updateDashboardDto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    return this.dashboardModel.findByIdAndUpdate(id, updateDashboardDto);
  }

  async delete(id: string): Promise<Dashboard> {
    return this.dashboardModel.findByIdAndRemove(id);
  }

  async updateItems(
    id: string,
    dashboardUpdateItemsDto: DashboardUpdateItemsDto,
  ): Promise<Dashboard> {
    const dashboard = await this.dashboardModel.findById(id);

    await this.dashboardItemAssociationModel.deleteMany({
      _id: { $in: dashboard.items.map((item) => item._id) },
    });

    dashboard.items = [];

    for (const association of dashboardUpdateItemsDto.associations) {
      const dashboardItem = await this.dashboardItemModel.findById(
        association.dashboardItemId,
      );
      const createdDashboardItemAssociation =
        new this.dashboardItemAssociationModel({
          dashboardItem,
          x: association.x,
          y: association.y,
        });
      dashboard.items = [...dashboard.items, createdDashboardItemAssociation];
    }

    await this.dashboardItemAssociationModel.insertMany(dashboard.items);
    return dashboard.save();
  }
}
