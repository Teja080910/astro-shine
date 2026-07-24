import { Module, forwardRef } from '@nestjs/common';
import { AstrologersService } from './astrologers.service';
import { AstrologersController } from './astrologers.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [forwardRef(() => AuthModule)], controllers: [AstrologersController], providers: [AstrologersService], exports: [AstrologersService] })
export class AstrologersModule {}
