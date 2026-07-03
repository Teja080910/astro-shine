import { Module } from '@nestjs/common';
import { MandirPoojaService } from './mandir-pooja.service';
import { MandirPoojaController } from './mandir-pooja.controller';

@Module({ controllers: [MandirPoojaController], providers: [MandirPoojaService], exports: [MandirPoojaService] })
export class MandirPoojaModule {}
