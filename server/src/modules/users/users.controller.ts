import { Controller, Get, Param, Body, Post, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

function stripPassword(user: any) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(stripPassword);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return stripPassword(user);
  }

  @Post()
  async create(@Body() body: any) {
    const user = await this.usersService.create(body);
    return stripPassword(user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const user = await this.usersService.update(id, body);
    return stripPassword(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.softDelete(id);
  }
}
