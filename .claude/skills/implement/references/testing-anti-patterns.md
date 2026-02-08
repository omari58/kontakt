# Testing Anti-Patterns

Avoid these common mistakes when writing tests.

## Anti-Pattern 1: Testing Mock Behavior

**Bad:**
```typescript
test('calls the service', async () => {
  const mockService = { getData: jest.fn().mockResolvedValue('data') };
  const result = await controller.handle(mockService);
  expect(mockService.getData).toHaveBeenCalled();
});
```

**Why it's bad:** You're testing that your mock was called, not that your code works.

**Good:**
```typescript
test('returns processed data', async () => {
  const result = await controller.handle(realService);
  expect(result).toEqual(expectedProcessedData);
});
```

**Rule:** Test behavior and outcomes, not interactions with mocks.

## Anti-Pattern 2: Test-Only Methods in Production

**Bad:** Adding methods to production classes that only exist for testing.

**Good:** Put test utilities in test files or test-utils directories.

**Rule:** Test utilities belong in test files, not production classes.

## Anti-Pattern 3: Incomplete Mocks

**Bad:** Mocking only the fields you think matter, missing fields code uses.

**Good:** Mock the complete structure as it exists in reality.

**Rule:** Mirror real structure in mocks.

## Anti-Pattern 4: Testing Implementation Details

**Bad:**
```typescript
test('uses Array.map internally', () => {
  const spy = jest.spyOn(Array.prototype, 'map');
  service.process(items);
  expect(spy).toHaveBeenCalled();
});
```

**Why it's bad:** Test breaks when implementation changes, even if behavior is correct.

**Good:**
```typescript
test('processes all items', () => {
  const result = service.process([1, 2, 3]);
  expect(result).toEqual([2, 4, 6]);
});
```

**Rule:** Test what, not how.

## Anti-Pattern 5: Brittle Assertions

**Bad:** Asserting on timestamps, random IDs, or other volatile values.

**Good:**
```typescript
expect(result).toMatchObject({
  id: expect.any(String),
  data: { ... }
});
expect(result.createdAt).toBeDefined();
```

**Rule:** Assert on what matters, ignore noise.

## Anti-Pattern 6: No Arrange-Act-Assert

**Bad:** Multiple tests in one test function.

**Good:** One behavior per test, clear AAA structure.

**Rule:** One behavior per test. Arrange-Act-Assert structure.

## Anti-Pattern 7: Over-Mocking

**Bad:** 50 lines of mock setup for one assertion.

**Good:** Use real dependencies when possible. Mock only external services.

**Rule:** If mock setup is longer than the test, reconsider.

## Anti-Pattern 8: Assertion-Free Tests

**Bad:**
```typescript
test('processes without error', async () => {
  await service.process(data);
  // No assertions!
});
```

**Good:** Every test needs meaningful assertions that verify correctness.

**Rule:** Every test needs meaningful assertions.

## Anti-Pattern 9: Test Data Coupling

**Bad:** Depending on seed data or external state.

**Good:** Tests create their own data.

**Rule:** Tests create their own data.

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Testing mocks | Test real behavior |
| Test-only methods | Put in test utilities |
| Incomplete mocks | Mirror real structure |
| Testing internals | Test outcomes |
| Brittle assertions | Assert what matters |
| No AAA structure | One behavior per test |
| Over-mocking | Use real dependencies |
| No assertions | Add meaningful checks |
| Data coupling | Create test data |
