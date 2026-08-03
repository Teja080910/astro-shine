import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mp3', '.wav', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET_NAME = 'kyc-documents';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseStorageService.name);

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
    const client = this.getClient();
    const { data: buckets } = await client.storage.listBuckets();
    const existing = buckets?.find(b => b.name === BUCKET_NAME);
    if (existing) {
      if (!existing.public) {
        await client.storage.updateBucket(BUCKET_NAME, { public: true });
        this.logger.log(`Updated ${BUCKET_NAME} bucket to public`);
      }
      return;
    }
    await client.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    });
    this.logger.log(`Created ${BUCKET_NAME} bucket as public`);
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
      .from(BUCKET_NAME)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new BadRequestException(`Supabase upload failed: ${error.message}`);

    const { data: urlData } = this.getClient().storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    this.logger.log(`Uploaded ${filename} to ${BUCKET_NAME}, url: ${urlData.publicUrl}`);
    return { filename, url: urlData.publicUrl, size: file.size };
  }

  async deleteFile(filename: string) {
    const { error } = await this.getClient().storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) throw new BadRequestException(`Supabase delete failed: ${error.message}`);
  }
}
