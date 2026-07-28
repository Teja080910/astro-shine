import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RealtimeModule } from '../../common/realtime.module';

@Module({ imports: [RealtimeModule], controllers: [NotificationsController], providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
