import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [FileUploadController], providers: [FileUploadService], exports: [FileUploadService] })
export class FileUploadModule {}
