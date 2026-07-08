import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { AdminsModule } from '../admin/admins.module';
import { AstrologersModule } from '../astrologers/astrologers.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    AdminsModule,
    AstrologersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
