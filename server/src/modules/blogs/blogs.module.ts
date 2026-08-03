import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ imports: [AuthModule, RealtimeModule, NotificationsModule], controllers: [BlogsController], providers: [BlogsService], exports: [BlogsService] })
export class BlogsModule {}
