# Error Handling Checklist

## Rules

### No Silent Catches
- Never catch an error and do nothing
- At minimum, log the error
- Prefer re-throwing with context or handling meaningfully

**Bad:**
```typescript
try {
  await riskyOperation();
} catch (e) {
  // silent!
}
```

**Good:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Failed to perform risky operation', { error, context });
  throw new ServiceError('Operation failed', { cause: error });
}
```

### Error Types
- Use custom error classes for domain errors
- Include context in error messages
- Preserve error chains with `cause`

### Async Error Handling
- Always await or catch promises
- Never have unhandled promise rejections
- Use try/catch for async/await, .catch() for promise chains

### User-Facing Errors
- Show helpful, non-technical messages to users
- Log technical details server-side
- Include actionable next steps when possible

### Avoid Nested Try-Catch
- Extract inner try-catch blocks to separate functions
- Use early returns to reduce nesting

## Quick Checks

```bash
# Find silent catches
grep -rE 'catch\s*\([^)]*\)\s*\{[\s\n]*\}' --include="*.ts" <files>

# Find unhandled promises
grep -rn "\.then(" --include="*.ts" <files> | grep -v "\.catch("

# Find empty catch blocks
grep -A2 "catch" --include="*.ts" <files> | grep -B1 "^[[:space:]]*}"
```
