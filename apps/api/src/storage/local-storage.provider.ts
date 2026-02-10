import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageProvider } from './storage.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);

  constructor(private readonly rootDir: string) {}

  async save(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolvePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
      this.logger.debug(`File not found for deletion: ${filePath}`);
    }
  }

  async read(key: string): Promise<Buffer | null> {
    const filePath = this.resolvePath(key);
    try {
      return await fs.readFile(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
      return null;
    }
  }

  getPublicUrl(key: string): string {
    return `/uploads/${key}`;
  }

  extractKey(publicUrl: string): string {
    return publicUrl.replace(/^\/uploads\//, '');
  }

  private resolvePath(key: string): string {
    const resolved = path.resolve(this.rootDir, key);
    const normalizedRoot = path.resolve(this.rootDir);
    if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
      throw new Error(`Invalid storage key: path traversal detected in "${key}"`);
    }
    return resolved;
  }
}
