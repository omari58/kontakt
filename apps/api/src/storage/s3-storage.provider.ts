import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageProvider } from './storage.interface';

export interface S3StorageOptions {
  bucket: string;
  region: string;
  endpoint: string;
  publicUrl: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
}

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly client: S3Client;
  private readonly publicUrl: string;

  constructor(private readonly options: S3StorageOptions) {
    const { region, endpoint, forcePathStyle = true, accessKeyId, secretAccessKey } = options;

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      ...(accessKeyId &&
        secretAccessKey && {
          credentials: { accessKeyId, secretAccessKey },
        }),
    });

    this.publicUrl = options.publicUrl.replace(/\/$/, '');
  }

  private get bucket(): string {
    return this.options.bucket;
  }

  async save(key: string, data: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: this.inferContentType(key),
      }),
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error: any) {
      if (error.name !== 'NoSuchKey') throw error;
      this.logger.debug(`Object not found for deletion: ${key}`);
    }
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return Buffer.from(await response.Body!.transformToByteArray());
    } catch (error: any) {
      if (error.name === 'NoSuchKey') return null;
      throw error;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  extractKey(publicUrl: string): string {
    const prefix = this.publicUrl + '/';
    if (publicUrl.startsWith(prefix)) {
      return publicUrl.slice(prefix.length);
    }
    return publicUrl;
  }

  private inferContentType(key: string): string | undefined {
    const ext = key.slice(key.lastIndexOf('.')).toLowerCase();
    return CONTENT_TYPES[ext];
  }
}
