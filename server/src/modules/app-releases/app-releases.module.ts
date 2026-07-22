import { Module } from '@nestjs/common';
import { AppReleasesService } from './app-releases.service';
import { AppReleasesController } from './app-releases.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [AppReleasesController], providers: [AppReleasesService], exports: [AppReleasesService] })
export class AppReleasesModule {}
