# Security Checklist

## Input Validation
- Validate all user input at system boundaries
- Use schema validation (Zod, Joi, class-validator, etc.)
- Never trust client-side validation alone
- Validate types, ranges, formats, and lengths

## SQL Injection
- Use parameterized queries or ORM methods
- Never concatenate user input into SQL strings
- Review any raw SQL for injection risks

## XSS Prevention
- Sanitize user-generated content before rendering
- Use framework's built-in escaping
- Be cautious with raw HTML rendering APIs (innerHTML, v-html, etc.)
- Use DOMPurify or similar for any user-provided HTML

## Authentication & Authorization
- Verify authentication on every protected endpoint
- Check authorization (permissions/roles) after authentication
- Use middleware/guards for consistent enforcement
- Never expose internal IDs that could be enumerated

## Data Exposure
- Never log sensitive data (passwords, tokens, PII)
- Don't return sensitive fields in API responses
- Use DTOs/serializers to control response shape
- Review error messages for information leakage

## Secrets Management
- Never hardcode secrets in source code
- Use environment variables or secret managers
- Don't commit .env files with real secrets

## Quick Checks

```bash
# Find potential SQL injection
grep -rn "query(" --include="*.ts" <files> | grep -v "param"

# Find raw HTML rendering
grep -rn "innerHTML\|v-html" <files>

# Find hardcoded secrets
grep -rni "password\|secret\|api.key\|token" --include="*.ts" <files> | grep -v "test\|spec\|mock"
```
