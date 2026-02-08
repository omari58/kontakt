import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCardDto, PhoneDto, EmailDto, SocialLinkDto, AddressDto } from './create-card.dto';

function toDto(plain: Record<string, unknown>): CreateCardDto {
  return plainToInstance(CreateCardDto, plain);
}

describe('CreateCardDto', () => {
  describe('valid payloads', () => {
    it('should pass with only required name field', async () => {
      const dto = toDto({ name: 'John Doe' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with all optional fields populated', async () => {
      const dto = toDto({
        name: 'Jane Smith',
        jobTitle: 'Engineer',
        company: 'Acme',
        phones: [{ number: '+1234567890', label: 'Work' }],
        emails: [{ email: 'jane@example.com', label: 'Personal' }],
        websites: ['https://example.com'],
        socialLinks: [{ platform: 'github', url: 'https://github.com/jane' }],
        address: { street: '123 Main St', city: 'NYC', country: 'US', zip: '10001' },
        bio: 'A short bio',
        bgColor: '#ff0000',
        primaryColor: '#00ff00',
        textColor: '#0000ff',
        avatarShape: 'CIRCLE',
        theme: 'DARK',
        visibility: 'PUBLIC',
        noIndex: true,
        obfuscate: false,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('required fields', () => {
    it('should fail when name is missing', async () => {
      const dto = toDto({});
      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should fail when name is empty string', async () => {
      const dto = toDto({ name: '' });
      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });
  });

  describe('color validation', () => {
    it('should fail with invalid hex color for bgColor', async () => {
      const dto = toDto({ name: 'Test', bgColor: 'not-a-color' });
      const errors = await validate(dto);
      const bgColorError = errors.find((e) => e.property === 'bgColor');
      expect(bgColorError).toBeDefined();
    });

    it('should fail with invalid hex color for primaryColor', async () => {
      const dto = toDto({ name: 'Test', primaryColor: 'xyz' });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'primaryColor');
      expect(err).toBeDefined();
    });

    it('should fail with invalid hex color for textColor', async () => {
      const dto = toDto({ name: 'Test', textColor: '#gggggg' });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'textColor');
      expect(err).toBeDefined();
    });

    it('should accept 3-digit hex colors', async () => {
      const dto = toDto({ name: 'Test', bgColor: '#fff' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept 6-digit hex colors', async () => {
      const dto = toDto({ name: 'Test', bgColor: '#ff00aa' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('nested phone validation', () => {
    it('should pass with valid phone objects', async () => {
      const dto = toDto({
        name: 'Test',
        phones: [
          { number: '+1234567890' },
          { number: '555-1234', label: 'Home' },
        ],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when phone number is missing', async () => {
      const dto = toDto({
        name: 'Test',
        phones: [{ label: 'Work' }],
      });
      const errors = await validate(dto);
      const phonesError = errors.find((e) => e.property === 'phones');
      expect(phonesError).toBeDefined();
    });
  });

  describe('nested email validation', () => {
    it('should pass with valid email objects', async () => {
      const dto = toDto({
        name: 'Test',
        emails: [{ email: 'test@example.com', label: 'Work' }],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when email format is invalid', async () => {
      const dto = toDto({
        name: 'Test',
        emails: [{ email: 'not-an-email' }],
      });
      const errors = await validate(dto);
      const emailsError = errors.find((e) => e.property === 'emails');
      expect(emailsError).toBeDefined();
    });
  });

  describe('nested social link validation', () => {
    it('should pass with valid social link', async () => {
      const dto = toDto({
        name: 'Test',
        socialLinks: [{ platform: 'github', url: 'https://github.com/user' }],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when platform is not in allowed list', async () => {
      const dto = toDto({
        name: 'Test',
        socialLinks: [{ platform: 'myspace', url: 'https://myspace.com/user' }],
      });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'socialLinks');
      expect(err).toBeDefined();
    });

    it('should fail when url is missing from social link', async () => {
      const dto = toDto({
        name: 'Test',
        socialLinks: [{ platform: 'github' }],
      });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'socialLinks');
      expect(err).toBeDefined();
    });
  });

  describe('nested address validation', () => {
    it('should pass with partial address', async () => {
      const dto = toDto({
        name: 'Test',
        address: { city: 'NYC' },
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with empty address object', async () => {
      const dto = toDto({
        name: 'Test',
        address: {},
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('enum validation', () => {
    it('should fail with invalid avatarShape', async () => {
      const dto = toDto({ name: 'Test', avatarShape: 'TRIANGLE' });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'avatarShape');
      expect(err).toBeDefined();
    });

    it('should fail with invalid theme', async () => {
      const dto = toDto({ name: 'Test', theme: 'NEON' });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'theme');
      expect(err).toBeDefined();
    });

    it('should fail with invalid visibility', async () => {
      const dto = toDto({ name: 'Test', visibility: 'SECRET' });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'visibility');
      expect(err).toBeDefined();
    });
  });

  describe('website validation', () => {
    it('should pass with valid URLs', async () => {
      const dto = toDto({
        name: 'Test',
        websites: ['https://example.com', 'http://test.org'],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid URL', async () => {
      const dto = toDto({
        name: 'Test',
        websites: ['not-a-url'],
      });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'websites');
      expect(err).toBeDefined();
    });
  });
});
