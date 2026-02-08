import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(jwtService);
  });

  const createMockContext = (cookies: Record<string, string> = {}): ExecutionContext => {
    const request = { cookies } as any;
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  it('should allow access with a valid session cookie', () => {
    const payload = { sub: 'user-id', email: 'test@example.com', role: 'USER' };
    (jwtService.verify as jest.Mock).mockReturnValue(payload);

    const context = createMockContext({ session: 'valid-jwt-token' });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token');

    // Verify user was attached to request
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual(payload);
  });

  it('should throw UnauthorizedException when no session cookie', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when JWT is invalid', () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const context = createMockContext({ session: 'invalid-token' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
