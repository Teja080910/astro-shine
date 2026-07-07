import { Controller, Get, Param, Body, Post, Put, Delete, HttpCode, HttpStatus, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

function stripPassword(user: any) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return stripPassword(user);
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(@CurrentUser() userId: string, @Body() body: any) {
    const { id, password, role, createdAt, updatedAt, deletedAt, ...allowedFields } = body;
    const user = await this.usersService.update(userId, allowedFields);
    return stripPassword(user);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() userId: string,
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required');
    }
    const isCorrect = await this.usersService.verifyPassword(userId, currentPassword);
    if (!isCorrect) {
      throw new UnauthorizedException('Incorrect current password');
    }
    await this.usersService.updatePassword(userId, newPassword);
    return { success: true, message: 'Password changed successfully' };
  }

  @Delete('profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@CurrentUser() userId: string) {
    await this.usersService.softDelete(userId);
  }

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
