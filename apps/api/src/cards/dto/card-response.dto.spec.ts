import { CardResponseDto } from './card-response.dto';
import { AvatarShape, Theme, Visibility } from '@prisma/client';

describe('CardResponseDto', () => {
  const mockCard = {
    id: 'card-uuid-1',
    slug: 'john-doe',
    userId: 'user-uuid-1',
    name: 'John Doe',
    jobTitle: 'Engineer',
    company: 'Acme',
    phones: [{ number: '+1234567890', label: 'Work' }],
    emails: [{ email: 'john@example.com' }],
    address: { city: 'NYC' },
    websites: [{ url: 'https://example.com' }],
    socialLinks: [{ platform: 'github', url: 'https://github.com/john' }],
    bio: 'Hello',
    pronouns: 'he/him',
    calendarUrl: 'https://cal.com/john',
    calendarText: 'Schedule a call',
    avatarPath: '/uploads/cards/card-uuid-1/avatar.webp',
    bannerPath: null,
    bgImagePath: null,
    bgColor: '#ffffff',
    primaryColor: '#000000',
    textColor: '#333333',
    fontFamily: null,
    avatarShape: AvatarShape.CIRCLE,
    theme: Theme.LIGHT,
    visibility: Visibility.PUBLIC,
    noIndex: false,
    obfuscate: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
  };

  it('should map all card fields to response DTO', () => {
    const dto = CardResponseDto.fromCard(mockCard);
    expect(dto.id).toBe(mockCard.id);
    expect(dto.slug).toBe(mockCard.slug);
    expect(dto.userId).toBe(mockCard.userId);
    expect(dto.name).toBe(mockCard.name);
    expect(dto.jobTitle).toBe(mockCard.jobTitle);
    expect(dto.company).toBe(mockCard.company);
    expect(dto.phones).toEqual(mockCard.phones);
    expect(dto.emails).toEqual(mockCard.emails);
    expect(dto.address).toEqual(mockCard.address);
    expect(dto.websites).toEqual(mockCard.websites);
    expect(dto.socialLinks).toEqual(mockCard.socialLinks);
    expect(dto.bio).toBe(mockCard.bio);
    expect(dto.pronouns).toBe(mockCard.pronouns);
    expect(dto.calendarUrl).toBe(mockCard.calendarUrl);
    expect(dto.calendarText).toBe(mockCard.calendarText);
    expect(dto.avatarPath).toBe(mockCard.avatarPath);
    expect(dto.bannerPath).toBeNull();
    expect(dto.bgImagePath).toBeNull();
    expect(dto.bgColor).toBe(mockCard.bgColor);
    expect(dto.primaryColor).toBe(mockCard.primaryColor);
    expect(dto.textColor).toBe(mockCard.textColor);
    expect(dto.avatarShape).toBe(AvatarShape.CIRCLE);
    expect(dto.theme).toBe(Theme.LIGHT);
    expect(dto.visibility).toBe(Visibility.PUBLIC);
    expect(dto.noIndex).toBe(false);
    expect(dto.obfuscate).toBe(false);
    expect(dto.createdAt).toEqual(mockCard.createdAt);
    expect(dto.updatedAt).toEqual(mockCard.updatedAt);
  });

  it('should return an instance of CardResponseDto', () => {
    const dto = CardResponseDto.fromCard(mockCard);
    expect(dto).toBeInstanceOf(CardResponseDto);
  });

  it('should exclude relation fields (user, events) from mapping', () => {
    const cardWithRelations = {
      ...mockCard,
      user: { id: 'user-uuid-1', name: 'John' },
      events: [{ id: 'event-1' }],
    };
    const dto = CardResponseDto.fromCard(cardWithRelations as any);
    expect(dto).not.toHaveProperty('user');
    expect(dto).not.toHaveProperty('events');
  });
});
