import { S3StorageProvider, S3StorageOptions } from './s3-storage.provider';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ _input: input, _type: 'PutObject' })),
    DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ _input: input, _type: 'DeleteObject' })),
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ _input: input, _type: 'GetObject' })),
  };
});

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

describe('S3StorageProvider', () => {
  const defaults: S3StorageOptions = {
    bucket: 'test-bucket',
    region: 'eu-central-1',
    endpoint: 'http://localhost:9000',
    publicUrl: 'http://localhost:9000/test-bucket',
  };

  let provider: S3StorageProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new S3StorageProvider(defaults);
  });

  describe('constructor', () => {
    it('should create S3Client with endpoint and forcePathStyle true by default', () => {
      new S3StorageProvider(defaults);
      expect(S3Client).toHaveBeenCalledWith({
        region: defaults.region,
        endpoint: defaults.endpoint,
        forcePathStyle: true,
      });
    });

    it('should respect forcePathStyle: false', () => {
      new S3StorageProvider({ ...defaults, forcePathStyle: false });
      expect(S3Client).toHaveBeenCalledWith({
        region: defaults.region,
        endpoint: defaults.endpoint,
        forcePathStyle: false,
      });
    });

    it('should pass credentials when provided', () => {
      new S3StorageProvider({ ...defaults, accessKeyId: 'my-key', secretAccessKey: 'my-secret' });
      expect(S3Client).toHaveBeenCalledWith({
        region: defaults.region,
        endpoint: defaults.endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId: 'my-key', secretAccessKey: 'my-secret' },
      });
    });

    it('should not pass credentials when not provided', () => {
      new S3StorageProvider(defaults);
      expect(S3Client).toHaveBeenCalledWith(
        expect.not.objectContaining({ credentials: expect.anything() }),
      );
    });
  });

  describe('save', () => {
    it('should send PutObjectCommand with correct params', async () => {
      mockSend.mockResolvedValue({});
      const data = Buffer.from('file-data');

      await provider.save('cards/123/avatar.webp', data);

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: defaults.bucket,
        Key: 'cards/123/avatar.webp',
        Body: data,
        ContentType: 'image/webp',
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('should infer content type for png', async () => {
      mockSend.mockResolvedValue({});

      await provider.save('favicon-32.png', Buffer.alloc(0));

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'image/png' }),
      );
    });

    it('should infer content type for jpeg', async () => {
      mockSend.mockResolvedValue({});

      await provider.save('photo.jpg', Buffer.alloc(0));

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'image/jpeg' }),
      );
    });

    it('should set undefined content type for unknown extension', async () => {
      mockSend.mockResolvedValue({});

      await provider.save('data.bin', Buffer.alloc(0));

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: undefined }),
      );
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand', async () => {
      mockSend.mockResolvedValue({});

      await provider.delete('cards/123/avatar.webp');

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: defaults.bucket,
        Key: 'cards/123/avatar.webp',
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it('should silently ignore NoSuchKey errors', async () => {
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockSend.mockRejectedValue(error);

      await expect(provider.delete('nonexistent')).resolves.toBeUndefined();
    });

    it('should rethrow other errors', async () => {
      mockSend.mockRejectedValue(new Error('AccessDenied'));

      await expect(provider.delete('some-key')).rejects.toThrow('AccessDenied');
    });
  });

  describe('read', () => {
    it('should return buffer from response body', async () => {
      const content = Buffer.from('image-bytes');
      mockSend.mockResolvedValue({
        Body: { transformToByteArray: () => Promise.resolve(new Uint8Array(content)) },
      });

      const result = await provider.read('cards/123/avatar.webp');

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: defaults.bucket,
        Key: 'cards/123/avatar.webp',
      });
      expect(result).toEqual(content);
    });

    it('should return null on NoSuchKey', async () => {
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockSend.mockRejectedValue(error);

      const result = await provider.read('nonexistent');

      expect(result).toBeNull();
    });

    it('should rethrow other errors', async () => {
      mockSend.mockRejectedValue(new Error('AccessDenied'));

      await expect(provider.read('some-key')).rejects.toThrow('AccessDenied');
    });
  });

  describe('getPublicUrl', () => {
    it('should return publicUrl with key', () => {
      expect(provider.getPublicUrl('cards/123/avatar.webp')).toBe(
        `${defaults.publicUrl}/cards/123/avatar.webp`,
      );
    });

    it('should strip trailing slash from publicUrl', () => {
      const p = new S3StorageProvider({ ...defaults, publicUrl: 'https://cdn.example.com/' });
      expect(p.getPublicUrl('file.webp')).toBe('https://cdn.example.com/file.webp');
    });
  });

  describe('extractKey', () => {
    it('should extract key from publicUrl', () => {
      expect(provider.extractKey(`${defaults.publicUrl}/cards/123/avatar.webp`)).toBe(
        'cards/123/avatar.webp',
      );
    });

    it('should return the input unchanged if prefix does not match', () => {
      expect(provider.extractKey('/uploads/cards/123/avatar.webp')).toBe(
        '/uploads/cards/123/avatar.webp',
      );
    });
  });
});
