import { Module } from '@nestjs/common';
import { MandirPoojaService } from './mandir-pooja.service';
import { MandirPoojaController } from './mandir-pooja.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [MandirPoojaController], providers: [MandirPoojaService], exports: [MandirPoojaService] })
export class MandirPoojaModule {}
