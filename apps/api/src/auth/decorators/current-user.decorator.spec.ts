import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

// Helper to get the factory function from a parameter decorator
function getParamDecoratorFactory(decorator: Function) {
  class Test {
    public test(@decorator() _value: unknown) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser decorator', () => {
  it('should extract user from request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const mockUser = { sub: 'user-id', email: 'test@example.com', name: 'Test', role: 'USER' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as ExecutionContext;

    const result = factory(undefined, ctx);

    expect(result).toEqual(mockUser);
  });

  it('should return undefined when no user on request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    const result = factory(undefined, ctx);

    expect(result).toBeUndefined();
  });
});
