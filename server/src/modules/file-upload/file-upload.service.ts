import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Injectable()
export class FileUploadService {
  constructor(
    private cloudinaryStorage: CloudinaryStorageService,
    private supabaseStorage: SupabaseStorageService,
  ) {}

  async saveFile(file: Express.Multer.File, destination: string = 'local') {
    if (!file) throw new BadRequestException('No file provided');

    switch (destination) {
      case 'cloudinary':
        return this.cloudinaryStorage.saveFile(file);
      case 'supabase':
        return this.supabaseStorage.saveFile(file);
      default:
        return this.saveLocal(file);
    }
  }

  async deleteFile(filename: string, destination: string = 'local') {
    switch (destination) {
      case 'cloudinary':
        return this.cloudinaryStorage.deleteFile(filename);
      case 'supabase':
        return this.supabaseStorage.deleteFile(filename);
      default:
        return this.deleteLocal(filename);
    }
  }

  private async saveLocal(file: Express.Multer.File) {
    const fs = await import('fs');
    const path = await import('path');
    const { extname } = await import('path');

    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mp3', '.wav', '.doc', '.docx'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) throw new BadRequestException(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const safeName = file.originalname.replace(/[/\\]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(uploadDir, filename);

    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(path.resolve(uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    await fs.promises.writeFile(resolved, file.buffer);
    return { filename, url: `/uploads/${filename}`, size: file.size };
  }

  private async deleteLocal(filename: string) {
    const fs = await import('fs');
    const path = await import('path');

    const safeName = filename.replace(/[/\\]/g, '_');
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filepath = path.join(uploadDir, safeName);

    const resolved = path.resolve(filepath);
    if (!resolved.startsWith(path.resolve(uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  }
}
