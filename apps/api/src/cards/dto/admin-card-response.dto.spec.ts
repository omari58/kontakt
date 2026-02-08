import { AdminCardResponseDto } from './admin-card-response.dto';
import { Visibility } from '@prisma/client';

describe('AdminCardResponseDto', () => {
  const mockCardWithUser = {
    id: 'card-uuid-1',
    slug: 'john-doe',
    userId: 'user-uuid-1',
    name: 'John Doe',
    jobTitle: null,
    company: 'Acme',
    phones: null,
    emails: null,
    address: null,
    websites: null,
    socialLinks: null,
    bio: null,
    avatarPath: null,
    bannerPath: null,
    bgImagePath: null,
    bgColor: null,
    primaryColor: null,
    textColor: null,
    avatarShape: null,
    theme: null,
    visibility: Visibility.PUBLIC,
    noIndex: false,
    obfuscate: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    user: { name: 'John Doe', email: 'john@example.com' },
  };

  it('should preserve user info in the response', () => {
    const dto = AdminCardResponseDto.fromCardWithUser(mockCardWithUser as any);
    expect(dto.user).toEqual({ name: 'John Doe', email: 'john@example.com' });
  });

  it('should include all card fields', () => {
    const dto = AdminCardResponseDto.fromCardWithUser(mockCardWithUser as any);
    expect(dto.id).toBe('card-uuid-1');
    expect(dto.name).toBe('John Doe');
    expect(dto.company).toBe('Acme');
    expect(dto.slug).toBe('john-doe');
  });

  it('should be an instance of AdminCardResponseDto', () => {
    const dto = AdminCardResponseDto.fromCardWithUser(mockCardWithUser as any);
    expect(dto).toBeInstanceOf(AdminCardResponseDto);
  });
});
