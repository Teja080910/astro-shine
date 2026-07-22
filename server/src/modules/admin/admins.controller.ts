import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AuthGuard } from '../../common/guards/auth.guard';

function stripPassword(u: any) { if (!u) return u; const { password, ...r } = u; return r; }

@Controller('admins')
@UseGuards(AuthGuard)
export class AdminsController {
  constructor(private readonly service: AdminsService) {}

  @Get()
  async findAll() { const items = await this.service.findAll(); return items.map(stripPassword); }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.service.getDashboardStats();
  }

  @Get('revenue-chart')
  async getRevenueChart(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.service.getRevenueChart(period);
  }

  @Get('revenue/transactions')
  async getRevenueTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.service.getRevenueTransactions(page || 1, limit || 20); }

  @Get('revenue/summary')
  async getRevenueSummary() { return this.service.getRevenueSummary(); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return stripPassword(await this.service.findById(id)); }

  @Post()
  async create(@Body() body: any) { return stripPassword(await this.service.create(body)); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return stripPassword(await this.service.update(id, body)); }
}
