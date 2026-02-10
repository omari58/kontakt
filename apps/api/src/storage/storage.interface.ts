export interface StorageProvider {
  save(key: string, data: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  getPublicUrl(key: string): string;
  extractKey(publicUrl: string): string;
}
