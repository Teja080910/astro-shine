import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UsersModule } from '../users/users.module';
import { AdminsModule } from '../admin/admins.module';
import { AstrologersModule } from '../astrologers/astrologers.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    AdminsModule,
    AstrologersModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
