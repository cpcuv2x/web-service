import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateDashboardDto } from './dtos/create-dashboard-dto';
import { UpdateDashboardDto } from './dtos/update-dashboard-dto';
import { DashboardUpdateItemsDto } from './dtos/dashboard-update-items-dto';
import { Dashboard } from './schemas/dashboard.schema';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { JwtPayload } from 'src/user/classes/jwt-payload.class';

@Controller('dashboards')
export class DashboardsController {
  constructor(private dashboardsService: DashboardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body() createDashboardDto: CreateDashboardDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.create(req.user.id, createDashboardDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<Dashboard[]> {
    return this.dashboardsService.getAll(req.user.id);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async getOneById(
    @Req() req: Request & { user: JwtPayload },
    @Param('id') id: string,
  ): Promise<Dashboard> {
    return this.dashboardsService.getOneById(req.user.id, id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id') id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.update(req.user.id, id, updateDashboardDto);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Req() req: Request & { user: JwtPayload },
    @Param('id') id: string,
  ): Promise<Dashboard> {
    return this.dashboardsService.delete(req.user.id, id);
  }

  @Patch('/:id/update-items')
  @UseGuards(JwtAuthGuard)
  async addItem(
    @Req() req: Request & { user: JwtPayload },
    @Param('id') id: string,
    @Body() dashboardUpdateItemsDto: DashboardUpdateItemsDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.updateItems(
      req.user.id,
      id,
      dashboardUpdateItemsDto,
    );
  }
}
