import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 'user-id', email: 'test@example.com', role: userRole },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext('USER');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has required ADMIN role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext('ADMIN');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user does not have required ADMIN role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext('USER');

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow access when user role matches one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'USER']);
    const ctx = createMockContext('USER');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when no user is on the request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
