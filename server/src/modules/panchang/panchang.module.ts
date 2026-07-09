import { Module } from '@nestjs/common';
import { PanchangService } from './panchang.service';
import { PanchangController } from './panchang.controller';
import { RealtimeService } from '../../common/realtime.service';

@Module({ controllers: [PanchangController], providers: [PanchangService, RealtimeService], exports: [PanchangService] })
export class PanchangModule {}
