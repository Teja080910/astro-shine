import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';

function stripPassword(u: any) { if (!u) return u; const { password, ...r } = u; return r; }

@Controller('admins')
@UseGuards(AuthGuard, RoleGuard)
export class AdminsController {
  constructor(private readonly service: AdminsService) {}

  @Get()
  @Roles('admin')
  async findAll() { const items = await this.service.findAll(); return items.map(stripPassword); }

  @Get('dashboard-stats')
  @Roles('admin')
  async getDashboardStats() {
    return this.service.getDashboardStats();
  }

  @Get('revenue-chart')
  @Roles('admin')
  async getRevenueChart(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.service.getRevenueChart(period);
  }

  @Get('revenue/transactions')
  @Roles('admin')
  async getRevenueTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.service.getRevenueTransactions(page || 1, limit || 20); }

  @Get('revenue/summary')
  @Roles('admin')
  async getRevenueSummary() { return this.service.getRevenueSummary(); }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) { return stripPassword(await this.service.findById(id)); }

  @Post()
  @Roles('admin')
  async create(@Body() body: any) { return stripPassword(await this.service.create(body)); }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: any) { return stripPassword(await this.service.update(id, body)); }
}
