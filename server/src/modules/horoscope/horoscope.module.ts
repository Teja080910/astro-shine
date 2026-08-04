import { Module } from '@nestjs/common';
import { HoroscopeService } from './horoscope.service';
import { HoroscopeController } from './horoscope.controller';
import { AstrologyModule } from '../astrology/astrology.module';

@Module({ imports: [AstrologyModule], controllers: [HoroscopeController], providers: [HoroscopeService], exports: [HoroscopeService] })
export class HoroscopeModule {}
