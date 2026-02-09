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

import * as oidc from 'openid-client';

const mockedOidc = oidc as jest.Mocked<typeof oidc>;

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;
  let jwtService: JwtService;
  let usersService: UsersService;

  const mockConfig = {
    OIDC_ISSUER: 'https://auth.example.com',
    OIDC_CLIENT_ID: 'test-client-id',
    OIDC_CLIENT_SECRET: 'test-client-secret',
    OIDC_CALLBACK_URL: 'http://localhost:3000/api/auth/callback',
    JWT_SECRET: 'test-jwt-secret',
  };

  const mockUser = {
    id: 'user-uuid',
    oidcSub: 'oidc-sub-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOidcConfig = {
    serverMetadata: () => ({
      authorization_endpoint: 'https://auth.example.com/authorize',
      token_endpoint: 'https://auth.example.com/token',
      supportsPKCE: () => true,
    }),
  };

  beforeEach(async () => {
    mockedOidc.discovery.mockResolvedValue(mockOidcConfig as any);
    mockedOidc.randomPKCECodeVerifier.mockReturnValue('test-code-verifier');
    mockedOidc.calculatePKCECodeChallenge.mockResolvedValue('test-code-challenge');
    mockedOidc.randomState.mockReturnValue('test-state');
    mockedOidc.buildAuthorizationUrl.mockReturnValue(
      new URL('https://auth.example.com/authorize?client_id=test-client-id'),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
            getOrThrow: jest.fn((key: string) => {
              const val = mockConfig[key as keyof typeof mockConfig];
              if (!val) throw new Error(`Missing config: ${key}`);
              return val;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            upsertFromOidc: jest.fn().mockResolvedValue(mockUser),
            findById: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should discover OIDC issuer on init', async () => {
      await service.onModuleInit();

      expect(mockedOidc.discovery).toHaveBeenCalledWith(
        new URL('https://auth.example.com'),
        'test-client-id',
        'test-client-secret',
      );
    });

    it('should throw with clear message if OIDC discovery fails', async () => {
      mockedOidc.discovery.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.onModuleInit()).rejects.toThrow(
        /Failed to discover OIDC issuer/,
      );
    });

    it('should throw if OIDC_ISSUER is not configured', async () => {
      const configGet = configService.getOrThrow as jest.Mock;
      configGet.mockImplementation((key: string) => {
        if (key === 'OIDC_ISSUER') throw new Error('Missing config: OIDC_ISSUER');
        return mockConfig[key as keyof typeof mockConfig];
      });

      await expect(service.onModuleInit()).rejects.toThrow();
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return authorization URL and code verifier', async () => {
      await service.onModuleInit();

      const result = await service.getAuthorizationUrl();

      expect(result.url).toContain('https://auth.example.com/authorize');
      expect(result.codeVerifier).toBe('test-code-verifier');
      expect(mockedOidc.buildAuthorizationUrl).toHaveBeenCalled();
    });

    it('should include PKCE parameters', async () => {
      await service.onModuleInit();

      await service.getAuthorizationUrl();

      const callArgs = mockedOidc.buildAuthorizationUrl.mock.calls[0];
      const params = callArgs[1] as Record<string, string>;
      expect(params.code_challenge).toBe('test-code-challenge');
      expect(params.code_challenge_method).toBe('S256');
      expect(params.redirect_uri).toBe('http://localhost:3000/api/auth/callback');
      expect(params.scope).toContain('openid');
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for tokens and upsert user via UsersService', async () => {
      await service.onModuleInit();

      const mockTokens = {
        claims: () => ({
          sub: 'oidc-sub-123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      };
      mockedOidc.authorizationCodeGrant.mockResolvedValue(mockTokens as any);

      const result = await service.handleCallback(
        new URL('http://localhost:3000/api/auth/callback?code=auth-code&state=test-state'),
        'test-code-verifier',
        'test-state',
      );

      expect(mockedOidc.authorizationCodeGrant).toHaveBeenCalled();
      expect(usersService.upsertFromOidc).toHaveBeenCalledWith({
        sub: 'oidc-sub-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      });
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.oidcSub).toBe('oidc-sub-123');
    });

    it('should throw on invalid authorization code', async () => {
      await service.onModuleInit();

      mockedOidc.authorizationCodeGrant.mockRejectedValue(
        new Error('Invalid authorization code'),
      );

      await expect(
        service.handleCallback(
          new URL('http://localhost:3000/api/auth/callback?code=bad-code&state=test-state'),
          'test-code-verifier',
          'test-state',
        ),
      ).rejects.toThrow();
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT with user claims', () => {
      const user = {
        id: 'user-uuid',
        oidcSub: 'oidc-sub-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
      };

      const token = service.generateToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      });
      expect(token).toBe('mock-jwt-token');
    });
  });

  describe('getUserById', () => {
    it('should delegate to UsersService.findById', async () => {
      const user = await service.getUserById('user-uuid');

      expect(usersService.findById).toHaveBeenCalledWith('user-uuid');
      expect(user?.email).toBe('test@example.com');
    });
  });
});
