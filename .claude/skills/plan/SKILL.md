---
name: plan
description: Create and update PRD requirements and implementation plans for features. Use after /design to extract requirements and write detailed implementation plans. Manages prd.yaml and creates bite-sized task plans for /implement.
---

# Feature Planning

Create structured requirements (PRD) and detailed implementation plans from a design document.

**Announce at start:** "I'm using the plan skill to create/update the PRD and implementation plans."

## Invocation

```
/plan docs/plans/{feature-name}/
```

If no path provided, list available features in `docs/plans/` and ask which to work on.

## Process

### Step 1: Load Context

Read existing artifacts:
- `design.md` - understand what we're building
- `research.md` - accumulated learnings
- `prd.yaml` - existing requirements (if any)
- `plans/` - existing implementation plans (if any)

**Check for validation:** If design.md has a "Validation Summary" section, review it for:
- Unresolved open questions (especially critical ones)
- High-risk items that need mitigation in the plan
- Required changes that weren't addressed

If design.md lacks validation and the feature is complex, suggest running `/validate` first.

### Step 2: Mode Detection

Determine what work is needed:

| State | Action |
|-------|--------|
| Empty prd.yaml (no requirements) | Create new PRD |
| Has requirements, no plans | Write implementation plans |
| Has both | Update/add requirements or plans as needed |

### Step 3: Create/Update PRD

Extract requirements from design.md. For each capability the system needs:

```yaml
requirements:
  - id: REQ-001
    name: "Short descriptive name"
    description: "What this requirement enables for users"
    status: pending
    plan: null  # filled in after writing plans
    depends_on: []
```

**Requirement Writing Guidelines:**

- Focus on **what** the system should do, not **how**
- Should be verifiable by using/observing the system
- Avoid implementation details (specific methods, endpoints, tables)

Good: "Users can create polls in chat sessions"
Bad: "Implement createPoll() method in ChatService"

Group related requirements that will likely be implemented together.

### Step 4: Plan Implementation Phases

Group requirements into logical implementation phases:

```
Phase 1: Data Layer (REQ-001, REQ-002)
Phase 2: Business Logic (REQ-003, REQ-004)
Phase 3: UI / Integration (REQ-005, REQ-006)
```

Each phase becomes one implementation plan file.

### Step 5: Explore Codebase for Each Phase

Before writing plans, understand existing patterns:

- Invoke `code-quality` skill for conventions
- Search for similar implementations
- Understand existing architecture in affected areas

Append findings to research.md.

### Step 6: Write Implementation Plans

Create `plans/{phase-name}.md` for each phase. Plans provide **context and guidance**, not full implementation code. The implementer writes the actual code.

```markdown
# {Phase Name} Implementation

> **For Claude:** Use `/implement docs/plans/{feature}/` to execute this plan.

**Covers:** REQ-001, REQ-002, REQ-003

**Goal:** One sentence describing what this phase builds

**Tech Stack:** Key technologies relevant to this phase

---

## Task 1: {Component Name}

**Context:**
Brief explanation of what this task accomplishes and why.

**Files:**
- Create: `src/{domain}/{file}.ts`
- Modify: `src/{domain}/{module}.ts`
- Test: `src/{domain}/{file}.spec.ts`

**Reference:** Look at `src/similar/similar.ts` for the pattern to follow.

**Requirements:**
- Method should accept X and return Y
- Should validate input using Z pattern
- Should emit event after successful operation

**Test cases to cover:**
- Happy path: valid input returns expected output
- Error case: invalid input throws appropriate error
- Edge case: empty input handled gracefully

**Acceptance criteria:**
- [ ] Tests pass
- [ ] Follows existing patterns
- [ ] Properly typed (no `any`)

---

## Task 2: {Next Component}
...
```

**What to include in tasks:**

| Include | Don't Include |
|---------|---------------|
| Context and purpose | Full implementation code |
| File paths to create/modify | Copy-paste ready code blocks |
| Reference files to study | Step-by-step commands |
| Requirements and constraints | Boilerplate |
| Test cases to cover | Complete test implementations |
| Acceptance criteria | Exact commit messages |
| Small illustrative snippets | Full component templates |

**Small snippets are OK** when illustrating a specific pattern:
```typescript
// Example: Use this event pattern
this.eventEmitter.emit('feature.created', { id, userId });
```

**Task Granularity:**
- Each task = one logical unit of work
- Clear scope boundaries
- Backend tasks follow TDD (implementer handles the cycle)
- Frontend tasks include stories/examples where appropriate

### Step 7: Analyze Task Dependencies and Waves

After writing tasks, identify dependencies between them to enable parallel execution.

**For each task, determine:**
1. What other tasks must complete first?
2. Can this task run in parallel with others?

**Add a dependency table at the end of each plan:**

```markdown
## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Create entity | - | 1 |
| 2: Create service | 1 | 2 |
| 3: Create controller/API | 2 | 3 |
| 4: Create UI component | - | 1 |
| 5: Create state management | 4 | 2 |
| 6: Integration | 3, 5 | 4 |

## Execution Waves

**Wave 1:** Tasks 1, 4 (independent, run in parallel)
**Wave 2:** Tasks 2, 5 (depend on Wave 1, run in parallel)
**Wave 3:** Task 3 (depends on Task 2)
**Wave 4:** Task 6 (depends on Tasks 3 and 5)
```

**When tasks are independent:**
- Different domains (backend vs frontend)
- No data dependencies
- No shared file modifications

**When tasks must be sequential:**
- One creates what another uses (entity -> service)
- One modifies what another extends
- Integration tasks (need multiple pieces)

### Step 8: Update PRD with Plan References

Link each requirement to its implementation plan:

```yaml
requirements:
  - id: REQ-001
    name: "Users can create polls"
    description: "..."
    status: pending
    plan: "plans/backend-api.md"
```

Update `meta.status` to `ready` and `meta.updated` to current date.

### Step 9: Commit Plans

```bash
git add docs/plans/{feature-name}/
git commit -m "docs({feature-name}): add implementation plans"
```

## After Planning

Suggest next steps:

```
Planning complete. Created:
- {N} requirements in prd.yaml
- {M} implementation plans in plans/

Next: Run `/implement docs/plans/{feature-name}/` to start executing the plans.
```

## Key Principles

- **Context over code** - Explain what and why, not how
- **Reference existing patterns** - Point to similar code to study
- **Clear acceptance criteria** - Implementer knows when task is done
- **TDD for backend** - Note that tests come first, implementer handles cycle
- **Exact file paths** - No ambiguity about where code goes
- **Small snippets only** - For illustrating specific patterns, not full implementations
- **Group logically** - Related requirements in same plan
- **Analyze dependencies** - Identify what can run in parallel
- **Wave grouping** - Enable parallel execution in /implement
