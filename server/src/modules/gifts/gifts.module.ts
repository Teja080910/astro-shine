import { Module } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime.module';

@Module({ imports: [AuthModule, RealtimeModule], controllers: [GiftsController], providers: [GiftsService], exports: [GiftsService] })
export class GiftsModule {}
