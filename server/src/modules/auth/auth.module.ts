import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { KycVerificationGuard } from '../../common/guards/kyc-verification.guard';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RoleGuard, KycVerificationGuard],
  exports: [AuthService, AuthGuard, RoleGuard, KycVerificationGuard],
})
export class AuthModule {}
