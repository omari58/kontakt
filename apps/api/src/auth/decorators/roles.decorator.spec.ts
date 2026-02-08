import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles decorator', () => {
  it('should set metadata with provided roles', () => {
    @Roles('ADMIN')
    class TestClass {}

    const reflector = new Reflector();
    const roles = reflector.get<string[]>(ROLES_KEY, TestClass);

    expect(roles).toEqual(['ADMIN']);
  });

  it('should support multiple roles', () => {
    @Roles('ADMIN', 'USER')
    class TestClass {}

    const reflector = new Reflector();
    const roles = reflector.get<string[]>(ROLES_KEY, TestClass);

    expect(roles).toEqual(['ADMIN', 'USER']);
  });
});
