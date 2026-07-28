import { Module, forwardRef } from '@nestjs/common';
import { AstrologersService } from './astrologers.service';
import { AstrologersController } from './astrologers.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ imports: [forwardRef(() => AuthModule), NotificationsModule], controllers: [AstrologersController], providers: [AstrologersService], exports: [AstrologersService] })
export class AstrologersModule {}
