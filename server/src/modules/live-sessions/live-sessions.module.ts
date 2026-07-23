import { Module } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { LiveSessionsController } from './live-sessions.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [LiveSessionsController], providers: [LiveSessionsService], exports: [LiveSessionsService] })
export class LiveSessionsModule {}
