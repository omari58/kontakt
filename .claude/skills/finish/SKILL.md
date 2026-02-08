---
name: finish
description: Run quality checks, reviews, and prepare for merge/PR. Use after /implement when all tasks are complete. Runs type checking, linting, tests, code quality review, then presents merge/PR options.
---

# Feature Finishing

Run all quality checks and prepare the feature for merge or PR.

**Announce at start:** "I'm using the finish skill to run quality checks and prepare for merge."

## Invocation

```
/finish docs/plans/{feature-name}/
```

If no path provided, list available features in `docs/plans/` and ask which to work on.

## Process

### Step 1: Load Context

Read feature artifacts:
- `prd.yaml` - check requirement completion status
- Identify changed files via `git diff --name-only master...HEAD`

Warn if any requirements not marked `done`:
```
Warning: Some requirements not marked done:
- REQ-003: pending
- REQ-005: in_progress

Continue anyway? These may need attention.
```

### Step 2: Dispatch Parallel Checks

Dispatch subagents in a **single message** (parallel execution):

1. **Technical Checks Subagent** (`Bash`)
2. **Code Quality Review Subagent** (`general-purpose`)

#### Technical Checks Subagent

Use Task tool with `Bash` subagent:

```
Run all technical checks for the finish workflow.

First, determine which areas changed:
git diff --name-only master...HEAD

Then run applicable checks:
- Type checking
- Linting (try --fix if it fails, then re-run)
- Tests

Return a summary table of all checks with pass/fail status.
Stop immediately if type-check fails (don't run subsequent checks).
```

#### Code Quality Review Subagent

Use Task tool with `general-purpose` subagent:

```
Invoke the `code-quality` skill to analyze all changed files for quality issues.

Return the full report.
```

### Step 3: Collect Results

Wait for both subagents to complete.

**If Technical Checks fail:**
- Report which checks failed with error output
- Stop and ask user how to proceed (fix or abort)

**If Code Quality finds Critical or Major issues:**
1. Create task list with issues
2. Fix each issue
3. Re-dispatch Code Quality subagent to verify
4. Continue when clean

**If both pass:** Continue to Step 4

### Step 4: Update PRD Status (Only If All Checks Pass)

**Only update PRD status if ALL of the following are true:**
- Technical checks passed (type-check, lint, tests)
- Code quality review has no Critical or Major issues

**If any issues remain unresolved:** Do NOT update PRD status.

**If all checks pass**, update `prd.yaml`:

```yaml
meta:
  status: done  # was: in_progress
  updated: "{current-date}"
```

Commit the status update:
```bash
git add docs/plans/{feature-name}/prd.yaml
git commit -m "docs({feature-name}): mark PRD complete"
```

### Step 5: Generate Quality Report

Create a summary report:

```markdown
# Quality Check Report

## Summary
- Branch: {branch-name}
- Feature: {feature-name}
- Files analyzed: {count}

## Technical Checks

| Check | Status |
|-------|--------|
| Type check | PASS/FAIL |
| Lint | PASS/FAIL |
| Tests | PASS/FAIL (N passed) |

## Code Quality Review
- Critical issues: 0
- Major issues: 0
- Minor issues: {N}

## PRD Status
- Total requirements: {N}
- Completed: {N}
- Status: done

## Recommendation

**{READY TO MERGE / ISSUES REMAIN}**
```

### Step 6: Present Completion Options

Present exactly these options:

```
Quality checks complete. What would you like to do?

1. Merge back to main locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

#### Option 1: Merge Locally

```bash
git checkout main
git pull origin main
git merge {feature-branch}

# Verify tests on merged result
# Run project test command

# If tests pass, delete feature branch
git branch -d {feature-branch}
```

#### Option 2: Create PR

```bash
git push -u origin {feature-branch}

gh pr create --title "{feature-name}" --body "$(cat <<'EOF'
## Summary

{2-3 bullet points from PRD}

## Requirements Completed

{list from prd.yaml}

## Test Plan

- [ ] Type checks pass
- [ ] Lint passes
- [ ] Tests pass
- [ ] Manual testing of {key workflows}

## Quality Checks

- Code quality review: pass

---
Generated with finish skill
EOF
)"
```

Return the PR URL to the user.

#### Option 3: Keep As-Is

```
Keeping branch {branch-name}.
All quality checks passed. You can merge or create PR manually when ready.
```

#### Option 4: Discard

**Requires confirmation:**
```
This will permanently delete:
- Branch: {branch-name}
- All commits since branching from main

Type 'discard' to confirm.
```

If confirmed:
```bash
git checkout main
git branch -D {feature-branch}
```

## Key Principles

- **Parallel subagents** - Technical checks and code quality run simultaneously
- **Fail fast** - Technical checks stop on type errors
- **Fix before proceeding** - Don't skip quality issues
- **Complete report** - Show all results clearly
- **Clear options** - Present exactly 4 choices
- **Confirmation for destructive actions** - Require typed confirmation for discard
- **PR includes context** - Auto-generate PR body from PRD
