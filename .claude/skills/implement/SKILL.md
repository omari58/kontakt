---
name: implement
description: Execute implementation plans using agent teams. Use after /plan to implement features with parallel teammates, TDD for backend, spec compliance review, and code quality review. Coordinates a team of implementers and reviewers with shared task tracking.
---

# Feature Implementation (Agent Teams)

Execute implementation plans using coordinated agent teams with TDD for backend code.

**Announce at start:** "I'm using the implement skill to execute the implementation plan with an agent team."

**Prerequisite:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` must be enabled in settings.

## Invocation

```
/implement docs/plans/{feature-name}/
```

If no path provided, list available features in `docs/plans/` and ask which to work on.

## Process Overview

```
+-------------------------------------------------------------+
|                  Agent Team Execution                        |
+-------------------------------------------------------------+
|                                                              |
|  1. Create team and shared task list                         |
|     -> TaskCreate for all implementation tasks               |
|     -> TaskCreate for review tasks (blocked by impl)         |
|     -> Set dependencies between tasks                        |
|                                                              |
|  2. Spawn implementer teammates                              |
|     -> Teammates claim tasks from shared list                |
|     -> Implement with TDD for backend                        |
|     -> Self-review and commit                                |
|     -> Message lead with checkpoints                         |
|     -> Mark tasks complete, unblocking reviews               |
|                                                              |
|  3. Lint & format changed files (lead runs after wave)       |
|                                                              |
|  4. Spawn reviewer teammates                                 |
|     +-> Spec compliance reviewer claims review tasks         |
|     +-> Code quality reviewer (after spec passes)            |
|     -> If issues -> create fix tasks -> implementer fixes    |
|                                                              |
|  5. Append learnings + deviations to research.md             |
|                                                              |
|  6. User verification (for requirement completion)           |
|     -> checkpoint:verify for each completed requirement      |
|     -> Only mark REQ status=done after confirmation          |
|                                                              |
|  7. Shutdown teammates and clean up team                     |
|                                                              |
+-------------------------------------------------------------+
```

## Step 1: Load Context

Read feature artifacts:
- `prd.yaml` - requirements and their status
- `research.md` - accumulated learnings
- `plans/` - list available implementation plans

Ask which plan to execute if multiple exist, or continue an in-progress plan.

## Step 2: Create Team and Task List

### 2a. Create the Team

Use `TeamCreate` to create a team for this feature:

```
TeamCreate:
  team_name: "implement-{feature-name}"
  description: "Implementing {feature-name} feature"
```

### 2b. Extract Tasks and Create Shared Task List

Parse the selected plan file and extract all tasks with their full text.

**Check for wave/dependency information:**
- If plan has a "Task Dependencies" table, use wave assignments to set dependencies
- If no waves defined, create tasks sequentially (all independent)

Use `TaskCreate` for each task. Group by wave using `addBlockedBy` dependencies:

**Wave 1 tasks** (no dependencies - created first):
```
TaskCreate:
  subject: "Implement: Task 1 - {name}"
  description: "[full task text from plan]"
  activeForm: "Implementing Task 1"
```

**Wave 2 tasks** (blocked by Wave 1):
```
TaskCreate:
  subject: "Implement: Task 3 - {name}"
  description: "[full task text from plan]"
  activeForm: "Implementing Task 3"

TaskUpdate:
  taskId: "{task-3-id}"
  addBlockedBy: ["{task-1-id}", "{task-2-id}"]  # Wave 1 tasks
```

**Review tasks** (blocked by their implementation task):
For each implementation task, create a corresponding review task:
```
TaskCreate:
  subject: "Review: Task 1 - {name}"
  description: "Spec compliance + code quality review for Task 1"
  activeForm: "Reviewing Task 1"

TaskUpdate:
  taskId: "{review-task-id}"
  addBlockedBy: ["{impl-task-id}"]
```

This creates a natural execution flow: implementation tasks unblock review tasks, and earlier waves unblock later waves.

## Step 3: Spawn Teammates

### 3a. Spawn Implementer Teammates

Determine how many implementer teammates to spawn based on available parallel work:

| Unblocked Tasks | Strategy |
|-----------------|----------|
| 1-2 tasks | **1 implementer** teammate handles tasks sequentially |
| 3-4 tasks | **2 implementer** teammates work in parallel |
| 5+ tasks | **3 implementer** teammates (avoid more - coordination overhead) |

Use the `Task` tool with `team_name` and `name` to spawn each teammate. Use the template at `prompts/implementer.md`.

**For multiple implementers**, spawn them in parallel (multiple Task calls in one message).

### 3b. Spawn Reviewer Teammates

Spawn reviewer teammates after the team is set up. They will wait for review tasks to become unblocked:

Use templates at `prompts/spec-reviewer.md` and `prompts/quality-reviewer.md`.

**Spawn reviewers in parallel** with implementers since they'll wait for unblocked tasks.

### 3c. Enable Delegate Mode

After spawning teammates, press **Shift+Tab** to enter delegate mode. This prevents the lead from implementing tasks itself and keeps focus on coordination.

## Step 4: Monitor and Coordinate

The lead monitors progress through automatic teammate messages and the shared task list.

### Handling Teammate Messages

**Progress updates:** Teammates send messages when completing tasks. Acknowledge and check `TaskList` for newly unblocked work.

**Checkpoint messages:** Handle based on type:

1. **checkpoint:decision** - Architectural/design decision needed
   - Present the decision to user with options table
   - Wait for user selection
   - Message the teammate with the decision via `SendMessage`

2. **checkpoint:action** - Manual action required (auth, 2FA, etc.)
   - Present steps to user
   - Wait for "done" confirmation
   - Message the teammate to continue via `SendMessage`

**Questions from teammates:** Answer clearly via `SendMessage` to the asking teammate.

### Lint & Format After Implementation Waves

When all implementation tasks for a wave complete (check via `TaskList`), run project lint/format commands on changed files.

If lint fixes anything, commit:
```bash
git add -A && git commit -m "style: lint fixes"
```

### Review Coordination

Review tasks unblock automatically when their implementation task is marked complete. The spec-reviewer and quality-reviewer teammates will claim review tasks from the shared list.

**Review flow:**
1. Spec reviewer claims review task, reads code, reports findings
2. If spec issues -> lead creates fix task (assigned to an implementer)
3. After spec passes -> lead updates the review task description to signal quality review phase
4. Quality reviewer reviews the same code
5. If quality issues -> lead creates fix task
6. After both pass -> review task marked complete

**If issues found during review:**
```
TaskCreate:
  subject: "Fix: Task 1 - {issue description}"
  description: "[specific issues from reviewer report, files to fix]"
  activeForm: "Fixing Task 1 review issues"
```

### Tracking Deviations

Collect deviations reported by implementer teammates and append to research.md:
```markdown
- [date]: Task N - [any notable decisions or learnings]
- [date]: Task N - [Deviation: Rule X - description]
```

## Step 5: User Verification for Requirements

After completing tasks that fulfill a requirement, present a **checkpoint:verify**:

```markdown
## CHECKPOINT: Verify Requirement

**Requirement:** REQ-001 - {requirement name}

**What was built:**
- [Summary of implementation]
- [Key files created/modified]

**How to verify:**
1. [Specific thing to test]
2. [Another thing to check]
3. [Expected behavior]

**Awaiting:**
- "approved" - mark requirement as done
- Describe issues - create fix tasks
- "skip" - verify later
```

**If user responds "approved":** Update prd.yaml status to `done`, commit.

**If user describes issues:** Create fix tasks, do NOT mark done.

**If user responds "skip":** Leave as `in_progress`, remind to verify later.

**Important:** Never auto-mark a requirement as `done`. Only task completion is automatic. Requirement completion requires explicit user confirmation.

## Step 6: Shutdown and Cleanup

When all tasks are complete and requirements verified:

### 6a. Shutdown Teammates

Send shutdown requests to all teammates and wait for shutdown approvals.

### 6b. Clean Up Team

After all teammates have shut down, use `TeamDelete`.

### 6c. Summarize

```
Plan "{plan-name}" complete.

Completed: {N} tasks

Requirements verified and done:
- REQ-001: {name}
- REQ-002: {name}

Requirements pending verification:
- REQ-003: {name} (user skipped verification)

Next steps:
- Verify pending requirements before running /finish
- Run `/implement` again to execute another plan
- Run `/finish` to run quality checks and prepare for merge
```

## Teammate Prompt Templates

Templates are in the `prompts/` directory:
- `implementer.md` - for implementer teammates
- `spec-reviewer.md` - for spec compliance reviewer teammate
- `quality-reviewer.md` - for code quality reviewer teammate

## Testing Approach

| Layer | Approach |
|-------|----------|
| Backend / server | **Strict TDD** - test first, watch fail, implement, verify pass |
| Frontend components | Stories/examples where visual |
| Shared logic / utilities | Tests, but not strict TDD |
| Types / schemas | Type definitions, build verification |

## Key Principles

- **Agent team coordination** - Lead delegates, teammates execute, shared task list tracks progress
- **Delegate mode** - Lead stays in coordination mode, never implements directly
- **Teammates claim tasks** - Implementers and reviewers self-claim from the shared task list
- **Dependencies drive flow** - Review tasks blocked by implementation, later waves blocked by earlier ones
- **Two-stage review** - Spec compliance first, then code quality (separate reviewer teammates)
- **Fix before proceeding** - Never skip review issues; create fix tasks
- **TDD for backend** - No exceptions for server-side code
- **Lint after every wave** - Lead runs lint between implementation and review phases
- **Document learnings AND deviations** - research.md grows throughout implementation
- **Structured checkpoints** - checkpoint:verify, checkpoint:decision, checkpoint:action
- **User verification for requirements** - Only mark requirements done after user confirms it works
- **Graceful shutdown** - Always shutdown teammates and delete team when done

## Red Flags

**Never:**
- Skip reviews (spec OR quality)
- Proceed with unfixed issues
- Let implementer self-review replace actual review
- Start quality review before spec compliance passes
- Let teammates claim tasks from later waves before earlier waves complete
- Mark a requirement as `done` without user confirmation
- Assume code review = working feature (user must verify)
- Ignore checkpoints - always handle and wait for user response
- Let teammates make architectural decisions (Rule 4 stops for user)
- Leave a team running after implementation is complete
- Implement tasks as lead (use delegate mode)

## Reference Materials

- `references/tdd-workflow.md` - TDD process for backend
- `references/testing-anti-patterns.md` - What to avoid in tests
