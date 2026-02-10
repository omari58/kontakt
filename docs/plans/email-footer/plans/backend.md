# Backend Implementation

> **For Claude:** Use `/implement docs/plans/email-footer/` to execute this plan.

**Covers:** REQ-001, REQ-002, REQ-005

**Goal:** Extend the Card model with identity fields, add the Signature model, and build the CRUD API for signatures.

**Tech Stack:** Prisma, NestJS, class-validator, Jest

---

## Task 1: Extend Card Model with Identity Fields

**Context:**
Add `pronouns` and `calendarUrl` to the Card model. These are identity/contact fields useful on the public card page and in email signatures.

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/cards/dto/create-card.dto.ts`
- Modify: `apps/api/src/cards/dto/update-card.dto.ts`
- Modify: `apps/api/src/cards/dto/card-response.dto.ts`
- Modify: `apps/api/src/cards/cards.service.ts`
- Test: `apps/api/src/cards/cards.service.spec.ts`

**Reference:** Look at how `bio` (optional string) is handled in the Card model and DTOs.

**Requirements:**
- `pronouns`: optional `String?`, free text (e.g., "he/him", "she/her")
- `calendarUrl`: optional `String?`, validated as URL with `@IsUrl()`
- Both fields pass through in create/update DTOs and appear in CardResponseDto
- Service passes them to Prisma create/update calls
- Run migration after schema change: `pnpm db:migrate`

**Test cases to cover:**
- Card created with pronouns and calendarUrl returns them in response
- Card updated with new pronouns value persists
- Invalid calendarUrl rejected by validation
- Null/omitted values accepted (both fields optional)

**Acceptance criteria:**
- [ ] Migration runs cleanly
- [ ] Existing card tests still pass
- [ ] New fields appear in API responses
- [ ] `calendarUrl` validated as URL

---

## Task 2: Add Signature Model and Enum

**Context:**
Create the `Signature` model and `SignatureLayout` enum in Prisma. This establishes the data layer for storing signature configurations.

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Run migration after schema change

**Reference:** Look at the `AnalyticsEvent` model for the cascade delete pattern and JSON field usage.

**Requirements:**
- `Signature` model with fields: `id` (cuid), `name`, `cardId`, `userId`, `layout` (SignatureLayout enum), `config` (Json, default `{}`), `createdAt`, `updatedAt`
- Relations: belongs to `Card` (cascade delete), belongs to `User` (cascade delete)
- Indexes on `userId` and `cardId`
- Add `signatures Signature[]` relation fields to both `Card` and `User` models
- `SignatureLayout` enum: `COMPACT`, `CLASSIC`, `MINIMAL` (default `CLASSIC`)

**Test cases to cover:**
- N/A (schema-only task, validated by migration)

**Acceptance criteria:**
- [ ] Migration runs cleanly
- [ ] `pnpm db:generate` succeeds
- [ ] Signature model visible in Prisma Studio

---

## Task 3: Create Signatures NestJS Module

**Context:**
Build the signatures API module following the cards module pattern. This provides CRUD endpoints scoped to the current user under `/api/me/signatures`.

**Files:**
- Create: `apps/api/src/signatures/signatures.module.ts`
- Create: `apps/api/src/signatures/signatures.service.ts`
- Create: `apps/api/src/signatures/signatures.controller.ts`
- Create: `apps/api/src/signatures/dto/create-signature.dto.ts`
- Create: `apps/api/src/signatures/dto/update-signature.dto.ts`
- Create: `apps/api/src/signatures/dto/signature-response.dto.ts`
- Modify: `apps/api/src/app.module.ts` (register SignaturesModule)
- Test: `apps/api/src/signatures/signatures.service.spec.ts`
- Test: `apps/api/src/signatures/signatures.controller.spec.ts`

**Reference:** Study `apps/api/src/cards/` module structure closely — the signatures module mirrors it.

**Requirements:**

### DTOs

`CreateSignatureDto`:
- `name`: required string, not empty
- `cardId`: required string, not empty
- `layout`: optional `SignatureLayout` enum, defaults handled by Prisma
- `config`: optional object (passed as JSON)

`UpdateSignatureDto`:
- All fields from create except `cardId` — card association is immutable after creation
- All fields optional (partial update)

`SignatureResponseDto`:
- All Signature fields plus nested card summary: `{ id, name, slug, avatarPath }`
- Static `fromSignature()` factory method

### Service

- `create(userId, dto)`: verify the card belongs to the user before creating, throw `NotFoundException` if card not found or not owned
- `findAllByUser(userId)`: return all signatures for user, include card summary
- `findOne(id, userId)`: return single signature, verify ownership
- `update(id, userId, dto)`: verify ownership, update
- `remove(id, userId)`: verify ownership, delete

### Controller

- Route prefix: `me/signatures` (nested under `me` like MyCardsController)
- All endpoints guarded with `@UseGuards(JwtAuthGuard)`
- `@Get()` → list, `@Post()` → create, `@Get(':id')` → get one, `@Patch(':id')` → update, `@Delete(':id')` → delete
- Extract user with `@CurrentUser()`

### Module

- Import `AuthModule`
- Register controller and service
- Register in `AppModule` imports

**Test cases to cover:**

Service:
- Create signature with valid card returns signature with card data
- Create signature with non-owned card throws NotFoundException
- Create signature with non-existent card throws NotFoundException
- List signatures returns only current user's signatures
- Get signature returns data with card summary
- Get another user's signature throws NotFoundException
- Update signature changes name/layout/config
- Delete signature removes it
- Delete non-existent signature throws NotFoundException

Controller:
- Each endpoint calls correct service method with correct args
- Responses are SignatureResponseDto instances

**Acceptance criteria:**
- [ ] All CRUD endpoints functional
- [ ] Card ownership validated on create
- [ ] Signature ownership validated on all operations
- [ ] Tests pass
- [ ] Module registered in AppModule

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Card identity fields | - | 1 |
| 2: Signature model + enum | - | 1 |
| 3: Signatures NestJS module | 1, 2 | 2 |

## Execution Waves

**Wave 1:** Tasks 1, 2 (independent schema changes, run in parallel — combine into single migration)
**Wave 2:** Task 3 (depends on both schema changes being complete)

**Note:** Tasks 1 and 2 both modify `schema.prisma`. If running in parallel, they must be merged before migration. Alternatively, run them sequentially and create a single migration after both.
