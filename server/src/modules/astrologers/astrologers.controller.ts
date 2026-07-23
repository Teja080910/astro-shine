import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AstrologersService } from './astrologers.service';
import { AuthGuard } from '../../common/guards/auth.guard';

function stripPassword(u: any) { if (!u) return u; const { password, ...r } = u; return r; }

@Controller('astrologers')
@UseGuards(AuthGuard)
export class AstrologersController {
  constructor(private readonly service: AstrologersService) {}

  @Get()
  async findAll(@Req() req: any) {
    const items = await this.service.findAll();
    return items.map((a: any) => {
      if (req.userRole !== 'admin') {
        const { email, phone, password, bankDetails, ...publicFields } = a;
        return publicFields;
      }
      return stripPassword(a);
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return stripPassword(await this.service.findById(id)); }

  @Post()
  async create(@Body() body: any) { return stripPassword(await this.service.create(body)); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) { return stripPassword(await this.service.update(id, body)); }

  @Post(':id/verify')
  async verify(@Param('id') id: string, @Body() body: { status: 'approved' | 'rejected'; note?: string }, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can verify astrologers');
    return stripPassword(await this.service.verify(id, body.status, body.note));
  }

  @Put(':id/online-status')
  async onlineStatus(@Param('id') id: string, @Body() body: { status: 'online' | 'offline' | 'busy' }, @Req() req: any) {
    if (req.userId !== id) throw new ForbiddenException('Can only update own online status');
    return stripPassword(await this.service.updateOnlineStatus(id, body.status));
  }

  @Post(':id/feedback')
  async submitFeedback(@Param('id') id: string, @Body() body: { ratings: number; comments?: string }, @Req() req: any) {
    return this.service.submitFeedback(id, req.userId, body.ratings, body.comments);
  }

  @Get(':id/feedback')
  async getFeedback(@Param('id') id: string) {
    return this.service.getFeedback(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) { return stripPassword(await this.service.delete(id)); }
}
