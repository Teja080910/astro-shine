import { Module } from '@nestjs/common';
import { MuhuratService } from './muhurat.service';
import { MuhuratController } from './muhurat.controller';
import { MuhuratCronService } from './muhurat-cron.service';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime.module';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [MuhuratController],
  providers: [MuhuratService, MuhuratCronService],
  exports: [MuhuratService],
})
export class MuhuratModule {}
