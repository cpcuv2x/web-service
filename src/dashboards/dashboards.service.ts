import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CreateDashboardDto } from './dtos/create-dashboard-dto';
import { UpdateDashboardDto } from './dtos/update-dashboard-dto';
import { DashboardUpdateItemsDto } from './dtos/dashboard-update-items-dto';
import {
  DashboardItemAssociation,
  DashboardItemAssociationDocument,
} from './schemas/dashboard-item-association.schema';
import {
  DashboardItem,
  DashboardItemDocument,
} from './schemas/dashboard-item.schema';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { Dashboard, DashboardDocument } from './schemas/dashboard.schema';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<UserDocument>,
    @InjectModel(Dashboard.name)
    private dashboardModel: mongoose.Model<DashboardDocument>,
    @InjectModel(DashboardItem.name)
    private dashboardItemModel: mongoose.Model<DashboardItemDocument>,
    @InjectModel(DashboardItemAssociation.name)
    private dashboardItemAssociationModel: mongoose.Model<DashboardItemAssociationDocument>,
    @InjectConnection()
    private readonly connection: mongoose.Connection,
  ) {}

  async create(
    userId: string,
    createDashboardDto: CreateDashboardDto,
  ): Promise<Dashboard> {
    const user = await this.userModel.findById(userId);
    const createdDashboard = new this.dashboardModel({
      user,
      ...createDashboardDto,
    });
    return createdDashboard.save();
  }

  async getAll(userId: string): Promise<Dashboard[]> {
    return this.dashboardModel.find({ user: userId }).select('-items');
  }

  async getOneById(userId: string, id: string): Promise<Dashboard> {
    try {
      return await this.dashboardModel
        .findOne({ user: userId, _id: id })
        .populate({
          path: 'items',
          populate: {
            path: 'dashboardItem',
          },
        })
        .orFail();
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(
    userId: string,
    id: string,
    updateDashboardDto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    try {
      return await this.dashboardModel
        .findOneAndUpdate({ user: userId, _id: id }, updateDashboardDto, {
          new: true,
        })
        .select('-items')
        .orFail();
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(userId: string, id: string): Promise<Dashboard> {
    try {
      return await this.dashboardModel
        .findOneAndRemove({ user: userId, _id: id })
        .orFail();
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateItems(
    userId: string,
    id: string,
    dashboardUpdateItemsDto: DashboardUpdateItemsDto,
  ): Promise<Dashboard> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const dashboard = await this.dashboardModel
        .findOne({ user: userId, _id: id })
        .orFail();

      await this.dashboardItemAssociationModel
        .deleteMany({
          _id: { $in: dashboard.items.map((item) => item._id) },
        })
        .session(session);

      dashboard.items = [];

      for (const association of dashboardUpdateItemsDto.associations) {
        const dashboardItem = await this.dashboardItemModel
          .findById(association.dashboardItemId)
          .orFail();
        const createdDashboardItemAssociation =
          new this.dashboardItemAssociationModel({
            dashboardItem,
            x: association.x,
            y: association.y,
          });
        dashboard.items = [...dashboard.items, createdDashboardItemAssociation];
      }

      await this.dashboardItemAssociationModel.insertMany(dashboard.items, {
        session,
      });

      const savedDashboard = await dashboard.save({ session });
      await session.commitTransaction();
      return savedDashboard;
    } catch (error) {
      await session.abortTransaction();
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error.name === 'DocumentNotFoundError') {
      throw new NotFoundException(error.message);
    }
    if (error.name === 'CastError') {
      throw new BadRequestException(error.message);
    }
    throw new InternalServerErrorException(error.message);
  }
}
