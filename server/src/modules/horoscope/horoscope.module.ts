import { Module } from '@nestjs/common';
import { HoroscopeService } from './horoscope.service';
import { HoroscopeController } from './horoscope.controller';
import { RealtimeService } from '../../common/realtime.service';

@Module({ controllers: [HoroscopeController], providers: [HoroscopeService, RealtimeService], exports: [HoroscopeService] })
export class HoroscopeModule {}
