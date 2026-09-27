import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushService } from './push.service';
import { RealtimeModule } from '../../common/realtime.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
