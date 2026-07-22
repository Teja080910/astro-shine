import { Controller, Post, Delete, Param, UploadedFile, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('upload')
@UseGuards(AuthGuard)
export class FileUploadController {
  constructor(private readonly service: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.service.saveFile(file);
  }

  @Delete(':filename')
  async delete(@Param('filename') filename: string) {
    await this.service.deleteFile(filename);
    return { message: 'File deleted' };
  }
}
