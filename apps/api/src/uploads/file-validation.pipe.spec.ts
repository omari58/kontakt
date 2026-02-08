import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

describe('FileValidationPipe', () => {
  const defaultMaxSize = 5 * 1024 * 1024; // 5MB

  function makePipe(maxSize?: number): FileValidationPipe {
    return new FileValidationPipe(maxSize ?? defaultMaxSize);
  }

  function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'avatar.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.alloc(1024),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
      ...overrides,
    };
  }

  it('should accept a valid JPEG image', () => {
    const pipe = makePipe();
    const file = makeFile({ mimetype: 'image/jpeg' });
    expect(pipe.transform(file)).toBe(file);
  });

  it('should accept a valid PNG image', () => {
    const pipe = makePipe();
    const file = makeFile({ mimetype: 'image/png' });
    expect(pipe.transform(file)).toBe(file);
  });

  it('should accept a valid WebP image', () => {
    const pipe = makePipe();
    const file = makeFile({ mimetype: 'image/webp' });
    expect(pipe.transform(file)).toBe(file);
  });

  it('should accept a valid GIF image', () => {
    const pipe = makePipe();
    const file = makeFile({ mimetype: 'image/gif' });
    expect(pipe.transform(file)).toBe(file);
  });

  it('should reject a non-image MIME type with BadRequestException', () => {
    const pipe = makePipe();
    const file = makeFile({ mimetype: 'application/pdf' });
    expect(() => pipe.transform(file)).toThrow(BadRequestException);
  });

  it('should reject a text file', () => {
    const pipe = makePipe();
    const file = makeFile({ mimetype: 'text/plain' });
    expect(() => pipe.transform(file)).toThrow(BadRequestException);
  });

  it('should reject an oversized file with PayloadTooLargeException', () => {
    const pipe = makePipe(1024); // 1KB max
    const file = makeFile({ size: 2048 });
    expect(() => pipe.transform(file)).toThrow(PayloadTooLargeException);
  });

  it('should accept a file exactly at the size limit', () => {
    const pipe = makePipe(1024);
    const file = makeFile({ size: 1024 });
    expect(pipe.transform(file)).toBe(file);
  });

  it('should throw BadRequestException when no file is provided', () => {
    const pipe = makePipe();
    expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
  });
});
