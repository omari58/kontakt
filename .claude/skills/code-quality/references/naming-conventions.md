# Naming Conventions Checklist

## General Rules

### Files
- Use kebab-case for file names: `user-service.ts`, `auth-middleware.ts`
- Test files: `{name}.spec.ts` or `{name}.test.ts`
- Type files: `{name}.types.ts` or `types/{name}.ts`

### Variables and Functions
- Use camelCase: `getUserById`, `isActive`, `maxRetries`
- Boolean variables: prefix with `is`, `has`, `should`, `can`
- Constants: UPPER_SNAKE_CASE for true constants: `MAX_RETRY_COUNT`

### Classes and Types
- Use PascalCase: `UserService`, `AuthGuard`, `CreateUserDto`
- Interfaces: PascalCase, no `I` prefix: `UserProfile` not `IUserProfile`
- Enums: PascalCase for name and values: `UserRole.Admin`

### Methods
- Use verbs for actions: `create`, `update`, `delete`, `find`, `get`
- Use descriptive names: `findByEmail` not `find2`
- Event handlers: `on{Event}` or `handle{Event}`

## Anti-Patterns

- Avoid single-letter variables (except `i`, `j` in loops, `e` in catches)
- Avoid abbreviations: `repository` not `repo` (unless domain standard)
- Avoid generic names: `data`, `info`, `item`, `thing`
- Avoid negative booleans: use `isEnabled` not `isNotDisabled`

## Quick Checks

```bash
# Find single-letter variables (outside loops)
grep -rn "const [a-z] =" --include="*.ts" <files>

# Find generic names
grep -rn "const data " --include="*.ts" <files>
```
