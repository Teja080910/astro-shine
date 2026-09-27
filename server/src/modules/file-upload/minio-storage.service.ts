import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { extname } from 'path';

const IMAGE_DOC_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
];
const MEDIA_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.webm', '.mp3', '.wav'];
const ALLOWED_EXTENSIONS = [...IMAGE_DOC_EXTENSIONS, ...MEDIA_EXTENSIONS];
const IMAGE_DOC_MAX_FILE_SIZE = 10 * 1024 * 1024;
const MEDIA_MAX_FILE_SIZE = 100 * 1024 * 1024;

@Injectable()
export class MinioStorageService {
  private readonly logger = new Logger(MinioStorageService.name);
  private client: Client | null = null;
  private bucketReady = false;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'astro-shine';
  }

  private getClient(): Client {
    if (!this.client) {
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
      if (!endpoint) {
        throw new BadRequestException('MINIO_ENDPOINT is not configured');
      }
      const useSSL =
        String(this.configService.get<string>('MINIO_USE_SSL') || 'false').toLowerCase() ===
        'true';
      const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
      if (!accessKey || !secretKey) {
        throw new BadRequestException('MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required');
      }
      const [host, portPart] = endpoint.split(':');
      const port = portPart ? Number(portPart) : useSSL ? 443 : 9000;
      this.client = new Client({ endPoint: host, port, useSSL, accessKey, secretKey });
    }
    return this.client;
  }

  private publicBaseUrl(): string {
    const configured = this.configService.get<string>('MINIO_PUBLIC_URL');
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || '';
    const useSSL =
      String(this.configService.get<string>('MINIO_USE_SSL') || 'false').toLowerCase() === 'true';
    const base = (configured || `${useSSL ? 'https' : 'http'}://${endpoint}`).replace(/\/+$/, '');
    return `${base}/${this.bucket}`;
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    const client = this.getClient();
    const exists = await client.bucketExists(this.bucket).catch(() => false);
    if (!exists) {
      await client.makeBucket(this.bucket);
      this.logger.log(`Created MinIO bucket ${this.bucket}`);
    }
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };
    await client
      .setBucketPolicy(this.bucket, JSON.stringify(policy))
      .catch((e: any) => this.logger.warn(`Could not set public bucket policy: ${e.message}`));
    this.bucketReady = true;
  }

  async saveFile(file: Express.Multer.File): Promise<{ filename: string; url: string; size: number }> {
    if (!file) throw new BadRequestException('No file provided');

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    const isMedia = MEDIA_EXTENSIONS.includes(ext);
    const maxSize = isMedia ? MEDIA_MAX_FILE_SIZE : IMAGE_DOC_MAX_FILE_SIZE;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSize / 1024 / 1024}MB limit${isMedia ? ' for video/audio files' : ''}`,
      );
    }

    await this.ensureBucket();

    const safeName = file.originalname.replace(/[/\\]/g, '_');
    const objectName = `uploads/${Date.now()}-${safeName}`;

    await this.getClient().putObject(this.bucket, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype || 'application/octet-stream',
    });

    return {
      filename: objectName,
      url: `${this.publicBaseUrl()}/${objectName}`,
      size: file.size,
    };
  }

  async deleteFile(objectName: string) {
    await this.ensureBucket();
    await this.getClient().removeObject(this.bucket, objectName);
  }
}
