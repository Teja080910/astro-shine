import { Module } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [GiftsController], providers: [GiftsService], exports: [GiftsService] })
export class GiftsModule {}
