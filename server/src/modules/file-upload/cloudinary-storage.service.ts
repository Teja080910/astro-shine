import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { Readable } from 'stream';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class CloudinaryStorageService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async saveFile(file: Express.Multer.File): Promise<{ filename: string; url: string; size: number }> {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File type ${ext} not allowed for images. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'astro-shine',
          public_id: `${Date.now()}-${file.originalname.replace(/[/\\]/g, '_').replace(ext, '')}`,
          resource_type: 'image',
          transformation: { quality: 'auto', fetch_format: 'auto' },
        },
        (error, result) => {
          if (error) reject(new BadRequestException(`Cloudinary upload failed: ${error.message}`));
          if (!result) reject(new BadRequestException('Cloudinary upload returned no result'));
          else resolve({ filename: result.public_id, url: result.secure_url, size: result.bytes });
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string) {
    await cloudinary.uploader.destroy(publicId);
  }
}
