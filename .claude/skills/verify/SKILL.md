---
name: verify
description: Verify that requirements are actually achieved through goal-backward analysis. Use after /implement to verify features work, not just that tasks completed. Checks truths, artifacts, and connections in the codebase.
---

# Goal-Backward Verification

Verify that requirements are achieved by checking what ACTUALLY exists in the codebase, not what was claimed to be built.

**Announce at start:** "I'm using the verify skill to verify requirements are actually achieved."

## Philosophy

**Task completion != Goal achievement**

A task "create user component" can be marked complete when the component is a placeholder. The task was done - a file was created - but the goal "users can manage their profile" was not achieved.

Goal-backward verification starts from the outcome and works backwards:
1. What must be TRUE for the goal to be achieved?
2. What must EXIST for those truths to hold?
3. What must be CONNECTED for those artifacts to function?

Then verify each level against the actual codebase.

## Invocation

```
/verify docs/plans/{feature-name}/
```

If no path provided, list available features in `docs/plans/` and ask which to verify.

## Process

### Step 1: Load Context

Read feature artifacts:
- `prd.yaml` - requirements and their status
- `plans/` - implementation plans (to understand what was intended)
- `research.md` - accumulated learnings and decisions

### Step 2: Select Requirements to Verify

Present requirements from prd.yaml:

```
Which requirements to verify?

1. REQ-001: {name} (status: done)
2. REQ-002: {name} (status: done)
3. REQ-003: {name} (status: in_progress)

Options:
- "all" - verify all requirements
- "1,2" - verify specific requirements
- "done" - verify only done requirements
```

### Step 3: Derive Must-Haves

For each requirement, derive what must exist:

```markdown
## Must-Haves for REQ-001: {requirement name}

### Truths (what must be TRUE from user's perspective)
- [ ] User can see the feature entry point
- [ ] User can perform the core action
- [ ] Result is visible/accessible

### Artifacts (what must EXIST in codebase)
- [ ] `src/{path}/service.ts` - core logic
- [ ] `src/{path}/controller.ts` - API endpoint
- [ ] `src/{path}/component.tsx` - UI component

### Key Links (what must be CONNECTED)
- [ ] Component calls API endpoint
- [ ] API validates and processes request
- [ ] Result flows back to UI
```

### Step 4: Verify Three Levels

For each must-have, verify three levels:

#### Level 1: Existence
```bash
# Check if file exists
ls -la {path}
```

#### Level 2: Substance
Read the file and check it's not a stub:
- Has actual implementation, not just `// TODO`
- Exports expected functions/components
- Has reasonable complexity for the task

#### Level 3: Wiring
Check that artifacts are actually connected:
- Component is imported and used
- API endpoint is registered/routed
- Service is injected/imported where needed

### Step 5: Report Results

Generate verification report:

```markdown
# Verification Report for {feature-name}

## Summary
- Requirements verified: {N}
- Passed: {N}
- Failed: {N}
- Gaps found: {N}

## REQ-001: {requirement name}
**Status:** VERIFIED / FAILED

### Truths
- [x/!] {truth} - {evidence with file:line}

### Artifacts
- [x/!] {file} - {line count}, substantive / stub

### Key Links
- [x/!] {connection} - {evidence with file:line}

---

## Overall Assessment

**{N} of {M} requirements fully verified**

### Gaps to Address
| Gap | Requirement | Severity | Fix |
|-----|-------------|----------|-----|
| {description} | REQ-00N | High/Med/Low | {what to do} |

### Recommendation
- Fix gaps before marking feature complete
- Re-run `/verify` after fixes
```

### Step 6: Handle Gaps

If gaps found:

```
Verification found {N} gaps.

Options:
1. Create fix tasks - Add tasks to address gaps
2. Re-verify - I'll fix now and re-verify
3. Accept as-is - Mark verified despite gaps
4. Abort - Don't proceed with verification

Which option?
```

**Option 1:** Create `plans/verification-fixes.md` with tasks for each gap, return to `/implement`.
**Option 2:** Make fixes directly, re-run verification from Step 4.
**Option 3:** Log gaps in research.md, continue with warning.

## Verification Heuristics

### Detecting Stubs

Code is likely a stub if:
- Contains `// TODO`, `// FIXME`, `throw new Error('Not implemented')`
- Function body is empty or just returns null/undefined
- Has `any` types everywhere
- Single-line placeholder implementations

### Detecting Broken Wiring

Wiring is likely broken if:
- Import statement exists but component/service not used
- API endpoint defined but not registered in router/module
- Event emitter exists but no listeners
- Service imported but methods never called

### Trust Nothing

- Don't trust task completion claims
- Don't trust commit messages
- Don't trust file names
- READ THE CODE and verify it does what it should

## Key Principles

- **Goal-backward** - Start from what user should experience, work backwards
- **Three levels** - Existence -> Substance -> Wiring
- **Trust nothing** - Verify against actual code, not claims
- **Specific gaps** - Report exact file:line, not vague issues
- **Actionable fixes** - Every gap should have a clear fix path
