import { Module } from '@nestjs/common';
import { PanchangService } from './panchang.service';
import { PanchangController } from './panchang.controller';

@Module({ controllers: [PanchangController], providers: [PanchangService], exports: [PanchangService] })
export class PanchangModule {}
