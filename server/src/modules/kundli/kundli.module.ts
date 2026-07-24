import { Module } from '@nestjs/common';
import { KundliService } from './kundli.service';
import { KundliController } from './kundli.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [KundliController], providers: [KundliService], exports: [KundliService] })
export class KundliModule {}
