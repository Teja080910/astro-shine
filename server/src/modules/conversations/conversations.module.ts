import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { CallsModule } from '../calls/calls.module';
import { UsersModule } from '../users/users.module';
import { AstrologersModule } from '../astrologers/astrologers.module';

@Module({
  imports: [AuthModule, CallsModule, UsersModule, AstrologersModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, ChatGateway],
  exports: [ConversationsService],
})
export class ConversationsModule {}
