import { Module } from '@nestjs/common';
import { MuhuratService } from './muhurat.service';
import { MuhuratController } from './muhurat.controller';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime.module';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [MuhuratController],
  providers: [MuhuratService],
  exports: [MuhuratService],
})
export class MuhuratModule {}
