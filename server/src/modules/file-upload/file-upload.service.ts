import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async saveFile(file: Express.Multer.File): Promise<{ filename: string; url: string; size: number }> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.uploadDir, filename);
    await fs.promises.writeFile(filepath, file.buffer);
    return { filename, url: `/uploads/${filename}`, size: file.size };
  }

  async deleteFile(filename: string) {
    const filepath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }
}
