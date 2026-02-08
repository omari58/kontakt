import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// Mock openid-client
jest.mock('openid-client', () => ({
  discovery: jest.fn(),
  buildAuthorizationUrl: jest.fn(),
  authorizationCodeGrant: jest.fn(),
  randomPKCECodeVerifier: jest.fn(),
  calculatePKCECodeChallenge: jest.fn(),
  randomState: jest.fn(),
}));

describe('AuthService - Role Extraction', () => {
  let service: AuthService;

  function createModule(adminClaim: string, adminClaimValue: string) {
    const mockConfig: Record<string, string> = {
      OIDC_ISSUER: 'https://auth.example.com',
      OIDC_CLIENT_ID: 'test-client-id',
      OIDC_CLIENT_SECRET: 'test-client-secret',
      OIDC_CALLBACK_URL: 'http://localhost:3000/api/auth/callback',
      JWT_SECRET: 'test-jwt-secret',
      OIDC_ADMIN_CLAIM: adminClaim,
      OIDC_ADMIN_CLAIM_VALUE: adminClaimValue,
    };

    return Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: string) =>
              mockConfig[key] ?? defaultVal,
            ),
            getOrThrow: jest.fn((key: string) => {
              const val = mockConfig[key];
              if (val === undefined) throw new Error(`Missing config: ${key}`);
              return val;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            upsertFromOidc: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();
  }

  describe('extractRole', () => {
    it('should return ADMIN when flat claim matches', async () => {
      const module = await createModule('is_admin', 'true');
      service = module.get<AuthService>(AuthService);

      const claims = { sub: 'user-1', is_admin: 'true' };
      const role = service.extractRole(claims);

      expect(role).toBe('ADMIN');
    });

    it('should return USER when flat claim does not match', async () => {
      const module = await createModule('is_admin', 'true');
      service = module.get<AuthService>(AuthService);

      const claims = { sub: 'user-1', is_admin: 'false' };
      const role = service.extractRole(claims);

      expect(role).toBe('USER');
    });

    it('should return ADMIN when nested claim path resolves to matching value', async () => {
      const module = await createModule('realm_access.roles', 'kontakt-admin');
      service = module.get<AuthService>(AuthService);

      const claims = {
        sub: 'user-1',
        realm_access: { roles: ['kontakt-admin', 'other-role'] },
      };
      const role = service.extractRole(claims);

      expect(role).toBe('ADMIN');
    });

    it('should return USER when nested claim path does not contain matching value', async () => {
      const module = await createModule('realm_access.roles', 'kontakt-admin');
      service = module.get<AuthService>(AuthService);

      const claims = {
        sub: 'user-1',
        realm_access: { roles: ['other-role'] },
      };
      const role = service.extractRole(claims);

      expect(role).toBe('USER');
    });

    it('should return USER when claim path does not exist', async () => {
      const module = await createModule('realm_access.roles', 'kontakt-admin');
      service = module.get<AuthService>(AuthService);

      const claims = { sub: 'user-1' };
      const role = service.extractRole(claims);

      expect(role).toBe('USER');
    });

    it('should return USER when admin claim config is empty', async () => {
      const module = await createModule('', '');
      service = module.get<AuthService>(AuthService);

      const claims = { sub: 'user-1', is_admin: 'true' };
      const role = service.extractRole(claims);

      expect(role).toBe('USER');
    });

    it('should handle deeply nested claim paths', async () => {
      const module = await createModule('a.b.c', 'admin');
      service = module.get<AuthService>(AuthService);

      const claims = {
        sub: 'user-1',
        a: { b: { c: 'admin' } },
      };
      const role = service.extractRole(claims);

      expect(role).toBe('ADMIN');
    });

    it('should return ADMIN when nested value is an array containing the admin value', async () => {
      const module = await createModule('groups', 'admins');
      service = module.get<AuthService>(AuthService);

      const claims = {
        sub: 'user-1',
        groups: ['users', 'admins'],
      };
      const role = service.extractRole(claims);

      expect(role).toBe('ADMIN');
    });
  });
});
