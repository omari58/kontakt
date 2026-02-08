# Type Safety Checklist

## Rules

### No `any` Types
- Never use `any` in production code
- Use `unknown` when type is truly unknown, then narrow
- Use generics when types vary but have structure

### Function Signatures
- All parameters must be typed
- All return types should be explicit (not inferred) for public APIs
- Use `readonly` for parameters that shouldn't be mutated

### Type Assertions
- Avoid `as` casts - prefer type narrowing with guards
- If `as` is necessary, add a comment explaining why
- Never use `as any`

### Generics
- Use meaningful names (`TItem` not `T` when context helps)
- Constrain generics when possible (`T extends Base`)

### Null Handling
- Use strict null checks
- Prefer optional chaining (`?.`) over manual null checks
- Use nullish coalescing (`??`) over logical OR for defaults

## Quick Checks

```bash
# Find any usage
grep -rn "\bany\b" --include="*.ts" --include="*.tsx" <files>

# Find type assertions
grep -rn " as " --include="*.ts" --include="*.tsx" <files>

# Find non-null assertions
grep -rn "\!" --include="*.ts" <files> | grep -v "!=" | grep -v "!//"
```
