import { Module } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommissionModule } from '../commission/commission.module';

@Module({ imports: [AuthModule, RealtimeModule, NotificationsModule, CommissionModule], controllers: [GiftsController], providers: [GiftsService], exports: [GiftsService] })
export class GiftsModule {}
