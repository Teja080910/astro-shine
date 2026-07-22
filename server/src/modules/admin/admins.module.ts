import { Module, forwardRef } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [forwardRef(() => AuthModule)], controllers: [AdminsController], providers: [AdminsService], exports: [AdminsService] })
export class AdminsModule {}
