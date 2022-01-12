import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateDashboardDto } from './dtos/create-dashboard-dto';
import { UpdateDashboardDto } from './dtos/update-dashboard-dto';
import { DashboardUpdateItemsDto } from './dtos/dashboard-update-items-dto';
import { Dashboard } from './schemas/dashboard.schema';
import { DashboardsService } from './dashboards.service';

@Controller('dashboards')
export class DashboardsController {
  constructor(private dashboardsService: DashboardsService) {}

  @Post()
  async create(
    @Body() createDashboardDto: CreateDashboardDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.create(createDashboardDto);
  }

  @Get()
  async getAll(): Promise<Dashboard[]> {
    return this.dashboardsService.getAll();
  }

  @Get('/:id')
  async getOneById(@Param('id') id: string): Promise<Dashboard> {
    return this.dashboardsService.getOneById(id);
  }

  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.update(id, updateDashboardDto);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string): Promise<Dashboard> {
    return this.dashboardsService.delete(id);
  }

  @Patch('/:id/update-items')
  async addItem(
    @Param('id') id: string,
    @Body() dashboardUpdateItemsDto: DashboardUpdateItemsDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.updateItems(id, dashboardUpdateItemsDto);
  }
}
