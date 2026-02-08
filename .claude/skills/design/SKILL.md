---
name: design
description: Brainstorm and design new features. Use when starting a new feature, exploring a problem space, or when someone asks to design or plan something new. Creates design.md, research.md, and initializes the feature directory structure.
---

# Feature Design

Collaboratively explore a feature idea and produce a validated design document.

**Announce at start:** "I'm using the design skill to explore and design this feature."

## Process

### Step 1: Initialize Feature Directory

Create the directory structure for the feature:

```bash
mkdir -p docs/plans/{feature-name}
```

If no name provided, ask: "What should we call this feature? (used for directory name, e.g., `user-auth`)"

If resuming an existing feature, load the existing design.md and continue from where it left off.

### Step 2: Understand the Idea

Ask questions **one at a time** to understand:
- What problem are we solving?
- Who are the users affected?
- What's the business value?
- Why is this being built now?

**Prefer multiple-choice questions** when possible. Open-ended is fine when choices aren't clear.

Example:
```
What type of users will primarily use this feature?

1. Admins / operators
2. End users / customers
3. Both equally
4. Other
```

### Step 3: Explore the Codebase

Before proposing solutions, understand existing patterns:

- Search for similar implementations in the codebase
- Understand existing architecture and conventions
- Invoke the `code-quality` skill for patterns and conventions

Document findings in the research section.

### Step 4: Propose Approaches

Present **2-3 different approaches** with trade-offs:

```markdown
## Approach Options

### Option A: [Name] (Recommended)
- How it works: ...
- Pros: ...
- Cons: ...
- Why recommended: ...

### Option B: [Name]
- How it works: ...
- Pros: ...
- Cons: ...

### Option C: [Name]
- How it works: ...
- Pros: ...
- Cons: ...
```

Lead with the recommended option and explain why.

### Step 5: Present Design Incrementally

Once an approach is chosen, present the design in **200-300 word sections**:

1. Problem Statement
2. Solution Overview
3. Architecture
4. Data Flow
5. Edge Cases & Error Handling

After each section, ask: "Does this look right so far?"

Be ready to go back and revise if something doesn't fit.

### Step 6: Write Artifacts

Once design is validated, write:

**design.md:**
```markdown
# {Feature Name}

## Problem Statement
[What we're solving and why]

## Solution Overview
[High-level approach chosen]

## Architecture
[How it fits into the system - components, services, data flow]

## Data Flow
[How data moves through the system]

## Edge Cases & Error Handling
[What could go wrong, how we handle it]

## Open Questions
[Anything unresolved, to be answered during planning]
```

**research.md:**
```markdown
# {Feature Name} - Research Log

## Initial Findings
- [{date}]: [Finding from codebase exploration]
- [{date}]: [Pattern discovered]
- [{date}]: [Decision rationale]

<!-- Subagents append learnings below this line -->
```

**prd.yaml (initialized only):**
```yaml
meta:
  title: "{Feature Name}"
  design_doc: "./design.md"
  research_doc: "./research.md"
  status: draft
  created: "{date}"
  updated: "{date}"

requirements: []
# Requirements added during /plan phase
```

### Step 7: Commit

Commit the design artifacts:

```bash
git add docs/plans/{feature-name}/
git commit -m "docs({feature-name}): add initial design"
```

## After Design

Suggest next steps:

```
Design complete and committed.

Next steps:

For complex or risky features:
-> Run `/validate docs/plans/{feature-name}/` to:
  - Verify assumptions against the codebase
  - Surface open questions and risks
  - Strengthen the design before planning

For straightforward features:
-> Run `/plan docs/plans/{feature-name}/` to:
  - Extract requirements into prd.yaml
  - Write implementation plans

Or continue exploring if there are open questions to resolve.
```

## Key Principles

- **One question at a time** - Don't overwhelm
- **Multiple choice preferred** - Easier to answer
- **Explore before proposing** - Understand existing patterns first
- **Incremental validation** - Present sections, validate each
- **YAGNI** - Remove unnecessary complexity from designs
- **Document decisions** - research.md captures why, not just what
