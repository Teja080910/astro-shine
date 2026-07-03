import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { WebsiteContentService } from './website-content.service';

@Controller('website-content')
export class WebsiteContentController {
  constructor(private readonly service: WebsiteContentService) {}

  @Get()
  async findAll() { return this.service.findAll(); }

  @Get('admin')
  async findAllAdmin() { return this.service.findAllAdmin(); }

  @Get('section/:section')
  async findBySection(@Param('section') section: string) { return this.service.findBySection(section); }

  @Post('section/:section')
  async upsert(@Param('section') section: string, @Body() body: { content: any; updatedBy?: string }) {
    return this.service.upsert(section, body.content, body.updatedBy);
  }
}
