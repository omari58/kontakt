import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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
        cookies: { oidc_code_verifier: 'test-code-verifier' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=auth-code&state=test-state',
      };

      const mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
      };

      await controller.callback(mockReq as any, mockRes as any);

      expect(mockAuthService.handleCallback).toHaveBeenCalled();
      // Session cookie should be set
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'session',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      );
      // Code verifier cookie should be cleared
      expect(mockRes.clearCookie).toHaveBeenCalledWith('oidc_code_verifier');
      // Should redirect to frontend dashboard
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
    });

    it('should return 401 when code verifier cookie is missing', async () => {
      const mockReq = {
        cookies: {},
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=auth-code',
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
        cookies: { oidc_code_verifier: 'test-code-verifier' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/auth/callback?code=bad-code',
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
    it('should clear session cookie', () => {
      const mockRes = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      };

      controller.logout(mockRes as any);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('session');
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

      const mockReq = {
        user: { sub: 'user-uuid', email: 'test@example.com', role: 'USER' },
      };

      const result = await controller.me(mockReq as any);

      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockUser);
    });

    it('should throw 401 when user not found', async () => {
      mockAuthService.getUserById.mockResolvedValue(null);

      const mockReq = {
        user: { sub: 'nonexistent-id', email: 'test@example.com', role: 'USER' },
      };

      await expect(controller.me(mockReq as any)).rejects.toThrow(UnauthorizedException);
    });
  });
});
