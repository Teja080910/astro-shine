import { Module } from '@nestjs/common';
import { MuhuratCategoriesService } from './muhurat-categories.service';
import { MuhuratCategoriesController } from './muhurat-categories.controller';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime.module';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [MuhuratCategoriesController],
  providers: [MuhuratCategoriesService],
  exports: [MuhuratCategoriesService],
})
export class MuhuratCategoriesModule {}
