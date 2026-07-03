import { Module } from '@nestjs/common';
import { AppReleasesService } from './app-releases.service';
import { AppReleasesController } from './app-releases.controller';

@Module({ controllers: [AppReleasesController], providers: [AppReleasesService], exports: [AppReleasesService] })
export class AppReleasesModule {}
