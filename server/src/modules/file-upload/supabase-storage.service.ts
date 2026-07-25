import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mp3', '.wav', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient | null = null;
  private bucketName = 'internal-docs';

  constructor(private configService: ConfigService) {}

  private getClient(): SupabaseClient {
    if (!this.supabase) {
      const url = this.configService.get<string>('SUPABASE_URL') || 'http://localhost:8000';
      const key = this.configService.get<string>('SUPABASE_SERVICE_KEY');
      this.supabase = createClient(url, key || '', { realtime: { transport: require('ws') } });
    }
    return this.supabase;
  }

  async ensureBucket() {
    const { data: buckets } = await this.getClient().storage.listBuckets();
    if (!buckets?.find(b => b.name === this.bucketName)) {
      await this.getClient().storage.createBucket(this.bucketName, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
      });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<{ filename: string; url: string; size: number }> {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    await this.ensureBucket();

    const safeName = file.originalname.replace(/[/\\]/g, '_');
    const filename = `${Date.now()}-${safeName}`;

    const { error } = await this.getClient().storage
      .from(this.bucketName)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new BadRequestException(`Supabase upload failed: ${error.message}`);

    const { data: urlData } = this.getClient().storage
      .from(this.bucketName)
      .getPublicUrl(filename);

    return { filename, url: urlData.publicUrl, size: file.size };
  }

  async deleteFile(filename: string) {
    const { error } = await this.getClient().storage
      .from(this.bucketName)
      .remove([filename]);

    if (error) throw new BadRequestException(`Supabase delete failed: ${error.message}`);
  }
}
