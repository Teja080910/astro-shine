import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { parsePagination } from '../../common/utils/pagination';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  async findAll(@Req() req: any, @Query() query?: any) {
    if (req.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view all reports');
    }
    const p = parsePagination(query);
    return this.service.findAll(p);
  }

  @Get('my')
  async findMine(@Req() req: any) {
    return this.service.findMine(req.userId);
  }

  @Get('received')
  async findReceived(@Req() req: any) {
    return this.service.findReceived(req.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    body.reporterId = req.userId;
    body.reporterRole = req.userRole || 'user';
    return this.service.create(body);
  }

  @Put(':id/resolve')
  async resolve(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can resolve reports');
    }
    return this.service.resolve(id, req.userId);
  }
}
