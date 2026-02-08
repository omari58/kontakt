import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateCardDto } from './update-card.dto';

function toDto(plain: Record<string, unknown>): UpdateCardDto {
  return plainToInstance(UpdateCardDto, plain);
}

describe('UpdateCardDto', () => {
  it('should pass with no fields (all optional via PartialType)', async () => {
    const dto = toDto({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only name', async () => {
    const dto = toDto({ name: 'Updated Name' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid slug', async () => {
    const dto = toDto({ slug: 'john-doe' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with slug containing uppercase', async () => {
    const dto = toDto({ slug: 'John-Doe' });
    const errors = await validate(dto);
    const err = errors.find((e) => e.property === 'slug');
    expect(err).toBeDefined();
  });

  it('should fail with slug starting with hyphen', async () => {
    const dto = toDto({ slug: '-john-doe' });
    const errors = await validate(dto);
    const err = errors.find((e) => e.property === 'slug');
    expect(err).toBeDefined();
  });

  it('should fail with slug ending with hyphen', async () => {
    const dto = toDto({ slug: 'john-doe-' });
    const errors = await validate(dto);
    const err = errors.find((e) => e.property === 'slug');
    expect(err).toBeDefined();
  });

  it('should fail with single char slug (min 2)', async () => {
    const dto = toDto({ slug: 'a' });
    const errors = await validate(dto);
    const err = errors.find((e) => e.property === 'slug');
    expect(err).toBeDefined();
  });

  it('should pass with a 2-char slug', async () => {
    const dto = toDto({ slug: 'ab' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should still validate inherited fields like hex colors', async () => {
    const dto = toDto({ bgColor: 'not-hex' });
    const errors = await validate(dto);
    const err = errors.find((e) => e.property === 'bgColor');
    expect(err).toBeDefined();
  });
});
