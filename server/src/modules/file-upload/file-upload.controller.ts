import { Controller, Post, Delete, Param, Query, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('upload')
@UseGuards(AuthGuard)
export class FileUploadController {
  constructor(private readonly service: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('destination') destination: string = 'local',
  ) {
    return this.service.saveFile(file, destination);
  }

  @Delete(':filename')
  async delete(
    @Param('filename') filename: string,
    @Query('destination') destination: string = 'local',
  ) {
    await this.service.deleteFile(filename, destination);
    return { message: 'File deleted' };
  }
}
