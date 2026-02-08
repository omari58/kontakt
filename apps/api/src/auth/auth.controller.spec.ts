import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// Mock openid-client before importing modules that depend on it
jest.mock('openid-client', () => ({}));

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    getAuthorizationUrl: jest.fn(),
    handleCallback: jest.fn(),
    getUserById: jest.fn(),
    generateToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('24h'),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        JwtAuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /auth/login', () => {
    it('should redirect to OIDC provider with PKCE verifier in cookie', async () => {
      mockAuthService.getAuthorizationUrl.mockResolvedValue({
        url: 'https://auth.example.com/authorize?client_id=test',
        codeVerifier: 'test-code-verifier',
        state: 'test-state',
      });

      const mockRes = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      };

      await controller.login(mockRes as any);

      expect(mockAuthService.getAuthorizationUrl).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'oidc_code_verifier',
        'test-code-verifier',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: expect.any(Number),
        }),
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'https://auth.example.com/authorize?client_id=test',
      );
    });
  });

  describe('GET /auth/callback', () => {
    it('should exchange code, set session cookie, and redirect to dashboard', async () => {
      const mockUser = {
        id: 'user-uuid',
        oidcSub: 'oidc-sub-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      };

      mockAuthService.handleCallback.mockResolvedValue({
        user: mockUser,
        token: 'jwt-token',
      });

      const mockReq = {
        cookies: { oidc_code_verifier: 'test-code-verifier', oidc_state: 'test-state' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=auth-code&state=test-state',
        query: { state: 'test-state' },
      };

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
      };

      await controller.callback(mockReq as any, mockRes as any);

      expect(mockAuthService.handleCallback).toHaveBeenCalled();
      // Session cookie should be set with configured maxAge
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'kontakt_session',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        }),
      );
      // OIDC cookies should be cleared with matching options
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'oidc_code_verifier',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'oidc_state',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
      // Should redirect to frontend dashboard
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    it('should return 401 when code verifier cookie is missing', async () => {
      const mockReq = {
        cookies: { oidc_state: 'test-state' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=auth-code&state=test-state',
        query: { state: 'test-state' },
      };

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
      };

      await expect(controller.callback(mockReq as any, mockRes as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return 401 when OIDC state does not match', async () => {
      const mockReq = {
        cookies: { oidc_code_verifier: 'test-code-verifier', oidc_state: 'expected-state' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=auth-code&state=attacker-state',
        query: { state: 'attacker-state' },
      };

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
      };

      await expect(controller.callback(mockReq as any, mockRes as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return 401 when OIDC state cookie is missing', async () => {
      const mockReq = {
        cookies: { oidc_code_verifier: 'test-code-verifier' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=auth-code&state=test-state',
        query: { state: 'test-state' },
      };

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
      };

      await expect(controller.callback(mockReq as any, mockRes as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return error when callback fails', async () => {
      mockAuthService.handleCallback.mockRejectedValue(
        new Error('Invalid authorization code'),
      );

      const mockReq = {
        cookies: { oidc_code_verifier: 'test-code-verifier', oidc_state: 'test-state' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=bad-code&state=test-state',
        query: { state: 'test-state' },
      };

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
      };

      await expect(controller.callback(mockReq as any, mockRes as any)).rejects.toThrow();
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear session cookie with matching options', () => {
      const mockRes = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      };

      controller.logout(mockRes as any);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'kontakt_session',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out' });
    });
  });

  describe('GET /me', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      };

      mockAuthService.getUserById.mockResolvedValue(mockUser);

      const jwtPayload = { sub: 'user-uuid', email: 'test@example.com', name: 'Test User', role: 'USER' };

      const result = await controller.me(jwtPayload);

      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockUser);
    });

    it('should throw 401 when user not found', async () => {
      mockAuthService.getUserById.mockResolvedValue(null);

      const jwtPayload = { sub: 'nonexistent-id', email: 'test@example.com', name: 'Test', role: 'USER' };

      await expect(controller.me(jwtPayload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
