import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';

@Module({ imports: [forwardRef(() => AuthModule)], controllers: [AdminsController], providers: [AdminsService], exports: [AdminsService] })
export class AdminsModule {}
