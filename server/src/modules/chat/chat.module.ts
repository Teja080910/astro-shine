import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [forwardRef(() => AuthModule)], controllers: [ChatController], providers: [ChatService], exports: [ChatService] })
export class ChatModule {}
