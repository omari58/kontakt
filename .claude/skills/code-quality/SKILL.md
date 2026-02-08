---
name: code-quality
description: Guide feature planning and analyze code quality. Use when planning new features to understand conventions and patterns, when preparing changes for commit, during code review, or when explicitly requested with /code-quality. Covers type safety, security, error handling, naming, and patterns based on recurring review feedback.
---

# Code Quality

Guide feature planning and analyze code for quality issues. This skill consolidates
recurring review patterns into actionable checklists for both planning and review.

## When to Use

**Planning Phase:**

- When planning new features - understand conventions before writing code
- When designing new components - identify existing patterns and utilities to reuse
- When starting implementation - know naming conventions and type patterns upfront

**Review Phase:**

- Before committing changes
- When running `/code-quality`
- During self-review of implemented features
- When asked to review code quality

## Planning Workflow

When planning a new feature, follow these steps to understand project conventions:

### 1. Identify Affected Areas

Determine which parts of the codebase the feature will touch.

### 2. Read Relevant References

Load the reference documents for applicable areas:

```text
references/type-safety.md        # Required types and patterns
references/naming-conventions.md # File and variable naming
references/error-handling.md     # Error handling patterns
references/security-checklist.md # Security patterns
```

### 3. Find Existing Patterns

Search for similar implementations to follow. Check:
- Utility directories
- Shared/common modules
- Similar feature implementations

### 4. Document Conventions for the Plan

Include in your implementation plan:
- Required types and interfaces
- Existing utilities to reuse
- Naming conventions for new files/components
- Security considerations

---

## Review Workflow

### 1. Gather Changes

```bash
git status
git diff --name-only        # Unstaged changes
git diff --cached --name-only  # Staged changes
```

If no uncommitted changes, compare against base branch:

```bash
git diff main --name-only
```

### 2. Categorize Files

Group modified files by type to determine which checklists apply:

| File Pattern | Applicable References |
|--------------|----------------------|
| Server/API files | type-safety, security-checklist, error-handling, naming-conventions |
| UI/component files | type-safety, error-handling, naming-conventions |
| Shared/library files | type-safety, naming-conventions |
| Test files | naming-conventions (test organization) |

### 3. Gather Context

Use the Task tool with `subagent_type=Explore` to understand the codebase context:

- Extract unique directory paths from modified files
- Understand existing patterns in those directories
- Identify existing utilities and shared components

### 4. Run Quality Checks

For each applicable reference, read and apply its checklist to the changes.

### 5. Check for Duplicates

Search for existing implementations before allowing new code:
- Utility directories
- Shared/common modules
- Existing helper functions

### 6. Verify Project Conventions

Read and check against project conventions in CLAUDE.md (if exists):
- Code standards
- Naming conventions
- Design principles (SOLID, DRY, KISS, YAGNI)

### 7. Generate Report

Structure findings as:

#### Overview

- Summary of changes analyzed
- Files reviewed by category
- Overall quality assessment

#### Issues Found (by severity)

##### Critical
Issues that must be fixed before commit (security, type errors)

##### Major
Issues that should be fixed (missing error handling, pattern violations)

##### Minor
Issues to consider (naming improvements, minor refactoring)

#### Recommendation

Either:
- **Ready to commit**: Code meets quality standards
- **Fixes needed**: List specific changes required

## Quick Reference

For quick checks without full analysis, use these patterns:

```bash
# Find any usage
grep -r "any" --include="*.ts" --include="*.tsx" <files>

# Find silent catches
grep -rE 'catch\s*\([^)]*\)\s*\{[\s\n]*\}' --include="*.ts" <files>

# Find TODO/FIXME
grep -rE 'TODO|FIXME|HACK|XXX' <files>
```

## Resources

### references/

Detailed checklists for each quality area:

- `type-safety.md` - Avoiding `any`, proper typing patterns
- `security-checklist.md` - Guards, authorization, input validation
- `error-handling.md` - Silent catches, user feedback, error propagation
- `naming-conventions.md` - Variables, methods, files, exports
