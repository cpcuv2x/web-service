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
    return this.withTransactionAndErrorHandling(async (session) => {
      if (createDashboardDto.default) {
        await this.unsetDefaultDashboard(userId, session);
      }
      const user = await this.userModel.findById(userId);
      const createdDashboard = new this.dashboardModel({
        user,
        ...createDashboardDto,
      });
      const savedDashboard = await createdDashboard.save({ session });
      const savedDashboardJson = savedDashboard.toJSON();
      delete savedDashboardJson.user;
      return savedDashboardJson;
    });
  }

  async getDefault(userId: string) {
    return this.withTransactionAndErrorHandling(async (session) =>
      this.dashboardModel
        .findOne({ user: userId, default: true })
        .session(session),
    );
  }

  async getAll(userId: string): Promise<Dashboard[]> {
    return this.withTransactionAndErrorHandling(async (session) =>
      this.dashboardModel
        .find({ user: userId })
        .session(session)
        .select('-items'),
    );
  }

  async getOneById(userId: string, id: string): Promise<Dashboard> {
    return this.withTransactionAndErrorHandling(async (session) => {
      return this.dashboardModel
        .findOne({ user: userId, _id: id })
        .populate({
          path: 'items',
          populate: {
            path: 'dashboardItem',
          },
        })
        .session(session)
        .orFail();
    });
  }

  async update(
    userId: string,
    id: string,
    updateDashboardDto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    return this.withTransactionAndErrorHandling(async (session) => {
      if (updateDashboardDto.default) {
        await this.unsetDefaultDashboard(userId, session);
      }
      return this.dashboardModel
        .findOneAndUpdate({ user: userId, _id: id }, updateDashboardDto, {
          new: true,
        })
        .session(session)
        .select('-items')
        .orFail();
    });
  }

  async delete(userId: string, id: string): Promise<Dashboard> {
    return this.withTransactionAndErrorHandling(async (session) => {
      return this.dashboardModel
        .findOneAndRemove({ user: userId, _id: id })
        .session(session)
        .orFail();
    });
  }

  async updateItems(
    userId: string,
    id: string,
    dashboardUpdateItemsDto: DashboardUpdateItemsDto,
  ): Promise<Dashboard> {
    return this.withTransactionAndErrorHandling(async (session) => {
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

      return dashboard.save({ session });
    });
  }

  private async unsetDefaultDashboard(
    userId: string,
    session: mongoose.ClientSession,
  ) {
    const oldDefaultDashboard = await this.dashboardModel.findOne({
      user: userId,
      default: true,
    });
    if (oldDefaultDashboard) {
      oldDefaultDashboard.default = false;
      await oldDefaultDashboard.save({ session });
    }
  }

  private async withTransactionAndErrorHandling<T>(
    fn: (session: mongoose.ClientSession) => Promise<T>,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      session.commitTransaction();
      return result;
    } catch (error) {
      session.abortTransaction();
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
