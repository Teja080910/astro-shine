import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FileUploadController],
  providers: [FileUploadService, CloudinaryStorageService, SupabaseStorageService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
