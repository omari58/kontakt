# TDD Workflow for Backend

**Required for:** All server-side / backend code

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before the test? Delete it. Start over.

## Red-Green-Refactor Cycle

```
    +---------+
    |   RED   | Write failing test
    +----+----+
         |
         v
    +---------+
    | VERIFY  | Run test, confirm FAIL
    +----+----+
         |
         v
    +---------+
    |  GREEN  | Write minimal code to pass
    +----+----+
         |
         v
    +---------+
    | VERIFY  | Run test, confirm PASS
    +----+----+
         |
         v
    +---------+
    |REFACTOR | Clean up (stay green)
    +----+----+
         |
         v
    +---------+
    |  NEXT   | Next failing test
    +---------+
```

## Step-by-Step

### 1. RED - Write Failing Test

Write ONE minimal test showing what should happen:

```typescript
describe('FeatureService', () => {
  describe('create', () => {
    it('should create with given options', async () => {
      // Arrange
      const input = { name: 'Test', options: ['A', 'B', 'C'] };

      // Act
      const result = await service.create(input);

      // Assert
      expect(result.name).toBe(input.name);
      expect(result.options).toHaveLength(3);
    });
  });
});
```

**Requirements:**
- One behavior per test
- Clear, descriptive name
- Real code, not mocks (unless external dependency)

### 2. VERIFY RED - Watch It Fail

Run the test and confirm:
- Test FAILS (not errors)
- Failure message is expected
- Fails because feature is missing, not because of typos

**If test passes:** You're testing existing behavior. Fix test.

**If test errors:** Fix the error, re-run until it fails correctly.

### 3. GREEN - Write Minimal Code

Write the SIMPLEST code to make the test pass.

**Don't:**
- Add features not required by the test
- Refactor other code
- Add error handling not yet tested
- "Improve" beyond what the test needs

### 4. VERIFY GREEN - Watch It Pass

Run the test and confirm:
- Test PASSES
- Other tests still pass
- No warnings or errors

**If test fails:** Fix the code, not the test.

### 5. REFACTOR - Clean Up

Only after green:
- Remove duplication
- Improve names
- Extract helpers

**Run tests after every change.** Stay green.

### 6. REPEAT

Next failing test for next behavior.

## Test Quality Checklist

- [ ] One behavior per test
- [ ] Descriptive test name
- [ ] Arrange-Act-Assert structure
- [ ] Tests real code, not mocks
- [ ] Watched it fail before implementing
- [ ] Minimal implementation to pass

## Red Flags - Stop and Start Over

- Wrote code before test
- Test passed immediately
- Can't explain why test failed
- Mocking everything to make test pass
- Test name has "and" (testing multiple things)

## Why TDD Matters

**Tests written after:**
- Pass immediately (proves nothing)
- Test what you built, not what's required
- Miss edge cases you forgot about

**Tests written first:**
- Force you to see the failure
- Prove the test catches the bug
- Drive design from usage
- Catch issues before they compound
