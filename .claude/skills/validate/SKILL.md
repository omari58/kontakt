---
name: validate
description: Scrutinize and refine designs before planning. Use after /design for complex or risky features to verify assumptions against the codebase, assess technical feasibility, surface open questions, and identify risks. Updates design.md with validated findings.
---

# Design Validation

Scrutinize and strengthen a design document before it becomes a plan, catching problems when they're cheap to fix.

**Announce at start:** "I'm using the validate skill to validate the design and surface any issues."

## Philosophy

**Design flaws compound into implementation disasters**

A design that assumes "we can just add a column" becomes a multi-week migration when you discover constraints. An assumption that "the framework handles this" becomes architectural rework when you find it doesn't.

Design validation starts from the design document and works backwards to reality:
1. What ASSUMPTIONS does the design make?
2. Are those assumptions TRUE in the actual codebase?
3. What QUESTIONS remain unanswered?
4. What RISKS could derail implementation?

Then update the design with validated findings.

## When to Use

**Recommended for:**
- Features touching multiple services or packages
- Features involving unfamiliar parts of the codebase
- Features with significant architectural decisions
- Features with external dependencies or integrations
- Any feature where assumptions feel uncertain

**Skip for:**
- Simple, well-understood changes
- Features in areas with recent, similar work
- Trivial UI tweaks or bug fixes

## Invocation

```
/validate docs/plans/{feature-name}/
```

If no path provided, list available features in `docs/plans/` and ask which to validate.

## Process

### Step 1: Load Context

Read the design document:
- `design.md` - the design to validate
- `research.md` - accumulated learnings (if exists)

Understand what the design proposes and claims.

### Step 2: Extract Testable Claims

Parse the design and extract every testable claim:

**Assumptions** - Things the design assumes to be true
```markdown
## Assumptions Extracted

1. "The existing auth middleware handles role-based access"
   - Source: Architecture section
   - Testable: Check if middleware supports role checking

2. "User entities have a preferences field"
   - Source: Data Flow section
   - Testable: Check User entity/model definition
```

**Feasibility Claims** - Technical approaches the design proposes
```markdown
## Feasibility Claims Extracted

1. "Real-time updates via existing WebSocket infrastructure"
   - Requires: WebSocket support, event subscription pattern
   - Check: Existing patterns for similar real-time features

2. "Store data as a new entity type"
   - Requires: Database schema, migrations
   - Check: How existing entities are defined and migrated
```

### Step 3: Verify Against Codebase

For each extracted claim, verify against the actual codebase:

#### Verification Techniques

**For architectural assumptions:**
- Search for similar patterns in existing code
- Read service/module definitions
- Check framework configuration

**For entity/schema assumptions:**
- Check model/entity definitions
- Review migration files
- Verify database schema

**For service capability assumptions:**
- Read service method signatures
- Check available APIs and endpoints
- Verify integration points

### Step 4: Surface Open Questions

Identify questions that MUST be answered before planning:

**Critical Questions** (block planning if unanswered):
- Questions about core functionality
- Questions about data ownership
- Questions about security implications

**Important Questions** (should answer before planning):
- Questions about edge cases
- Questions about error handling
- Questions about performance

**Nice-to-Answer** (can answer during implementation):
- Questions about specific UI details
- Questions about exact naming

### Step 5: Identify Risks

Flag risks that could derail implementation:

**Technical Risks:**
- Assumptions that couldn't be verified
- Approaches that differ from established patterns
- Dependencies on services with unknown stability

**Scope Risks:**
- Features that seem simple but have hidden complexity
- Unclear boundaries that could lead to scope creep

**Integration Risks:**
- Touchpoints with external systems
- Areas where multiple concerns intersect

Format:
```markdown
## Identified Risks

### High Risk
1. **[Risk Name]**
   - Design assumes: [what]
   - Reality: [what we found]
   - Impact: [consequence]
   - Mitigation: [how to address]

### Medium Risk
...

### Low Risk
...
```

### Step 6: Update Design Document

Update design.md inline with validation findings:

1. **Fix incorrect assumptions** - Rewrite sections based on false assumptions

2. **Add validated markers** - Mark assumptions that were verified:
   ```markdown
   ## Architecture
   Uses the existing auth middleware for access control.
   <!-- Validated: auth.middleware.ts supports role-based checks -->
   ```

3. **Add validation summary section** at the end:
   ```markdown
   ---

   ## Validation Summary

   **Validated on:** {date}

   ### Assumptions Verified
   - [x] Auth middleware supports role-based access (auth.middleware.ts:45)
   - [x] Entity system extensible via migrations
   - [ ] ~~User entity has preferences field~~ -> Added to required changes

   ### Open Questions
   - **Critical:** [question]
   - **Important:** [question]

   ### Risks Identified
   - **High:** [risk]
   - **Medium:** [risk]

   ### Required Changes
   - [change needed based on findings]

   ### Recommendation
   {READY FOR PLANNING / NEEDS REVISION / BLOCKED}
   ```

### Step 7: Present Findings

Summarize findings for the user:

```markdown
# Validation Complete

## Summary
- Assumptions checked: {N}
- Verified: {N}
- Failed: {N}
- Open questions: {N} ({critical} critical)
- Risks identified: {N} ({high} high)

## Recommendation: {READY FOR PLANNING / NEEDS REVISION / BLOCKED}

### If READY FOR PLANNING:
The design is sound. Proceed to `/plan docs/plans/{feature}/`.

### If NEEDS REVISION:
{List specific issues to address}

Options:
1. Address issues now - I'll help revise the design
2. Proceed anyway - Accept risks and continue to planning
3. Defer - Come back to this design later

### If BLOCKED:
{List blocking issues}

Cannot proceed until:
- {Blocker 1}
- {Blocker 2}
```

## Key Principles

- **Test assumptions against code, not memory** - Read actual files, not recalled patterns
- **Surface questions early** - Unanswered questions become implementation blockers
- **Grade risks honestly** - Better to flag a non-risk than miss a real one
- **Update the design** - Validation findings should live in design.md
- **Soft gate progression** - Warn about issues but let user decide to proceed
- **Recommend, don't block** - Only truly critical issues block planning
