import { Controller, Get, Param, Body, Post, Put, Delete, HttpCode, HttpStatus, UseGuards, BadRequestException, UnauthorizedException, ForbiddenException, Req } from '@nestjs/common';
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
    @Req() req: any,
  ) {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    const isCorrect = await this.usersService.verifyPassword(userId, currentPassword);
    if (!isCorrect) {
      throw new UnauthorizedException('Incorrect current password');
    }
    await this.usersService.updatePassword(userId, newPassword, req.userRole);
    return { success: true, message: 'Password changed successfully' };
  }

  @Delete('profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@CurrentUser() userId: string) {
    await this.usersService.softDelete(userId);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can view all users');
    const users = await this.usersService.findAll();
    return users.map(stripPassword);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin' && req.userId !== id) throw new ForbiddenException('Cannot view another user profile');
    const user = await this.usersService.findById(id);
    return stripPassword(user);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin') throw new ForbiddenException('Only admins can create users');
    const user = await this.usersService.create(body);
    return stripPassword(user);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.userRole !== 'admin' && req.userId !== id) throw new ForbiddenException('Cannot update another user profile');
    const user = await this.usersService.update(id, body);
    return stripPassword(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    if (req.userRole !== 'admin' && req.userId !== id) throw new ForbiddenException('Cannot delete another user');
    await this.usersService.softDelete(id);
  }
}
