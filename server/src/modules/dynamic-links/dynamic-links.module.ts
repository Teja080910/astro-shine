import { Module } from '@nestjs/common';
import { DynamicLinksService } from './dynamic-links.service';
import { DynamicLinksController } from './dynamic-links.controller';

@Module({ controllers: [DynamicLinksController], providers: [DynamicLinksService], exports: [DynamicLinksService] })
export class DynamicLinksModule {}
