import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
      sign: jest.fn().mockReturnValue('refreshed-token'),
    } as any;
    guard = new JwtAuthGuard(jwtService);
  });

  const createMockContext = (
    cookies: Record<string, string> = {},
  ): { context: ExecutionContext; request: any; response: any } => {
    const request = { cookies } as any;
    const response = { cookie: jest.fn() } as any;
    return {
      context: {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => response,
        }),
      } as ExecutionContext,
      request,
      response,
    };
  };

  it('should allow access with a valid kontakt_session cookie', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'user-id',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      iat: now,
      exp: now + 86400, // 24h from now, less than 50% expired
    };
    (jwtService.verify as jest.Mock).mockReturnValue(payload);

    const { context, request } = createMockContext({ kontakt_session: 'valid-jwt-token' });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token');
    expect(request.user).toEqual(payload);
  });

  it('should throw UnauthorizedException when no session cookie', () => {
    const { context } = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when JWT is invalid', () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const { context } = createMockContext({ kontakt_session: 'invalid-token' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should refresh token when >50% through lifetime', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'user-id',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      iat: now - 50000, // issued 50000s ago
      exp: now + 36400, // total lifetime 86400s, 50000/86400 = ~58% expired
    };
    (jwtService.verify as jest.Mock).mockReturnValue(payload);

    const { context, response } = createMockContext({ kontakt_session: 'old-token' });
    guard.canActivate(context);

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'kontakt_session',
      'refreshed-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
  });

  it('should not refresh token when <50% through lifetime', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'user-id',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      iat: now - 10000, // issued 10000s ago
      exp: now + 76400, // total lifetime 86400s, 10000/86400 = ~12% expired
    };
    (jwtService.verify as jest.Mock).mockReturnValue(payload);

    const { context, response } = createMockContext({ kontakt_session: 'fresh-token' });
    guard.canActivate(context);

    expect(jwtService.sign).not.toHaveBeenCalled();
    expect(response.cookie).not.toHaveBeenCalled();
  });
});
