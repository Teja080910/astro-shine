import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { extname } from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mp3', '.wav', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class FileUploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async saveFile(file: Express.Multer.File): Promise<{ filename: string; url: string; size: number }> {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    const safeName = file.originalname.replace(/[/\\]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(this.uploadDir, filename);

    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    await fs.promises.writeFile(resolved, file.buffer);
    return { filename, url: `/uploads/${filename}`, size: file.size };
  }

  async deleteFile(filename: string) {
    const safeName = filename.replace(/[/\\]/g, '_');
    const filepath = path.join(this.uploadDir, safeName);

    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  }
}
