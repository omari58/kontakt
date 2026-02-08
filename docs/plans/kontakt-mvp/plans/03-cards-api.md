# Phase 3: Cards API & Uploads

> **For Claude:** Use `/implement docs/plans/kontakt-mvp/` to execute this plan.

**Covers:** REQ-007, REQ-008, REQ-009

**Goal:** Build the card CRUD API with all contact fields, slug management, and image upload/processing.

**Tech Stack:** NestJS, Prisma, sharp, multer, class-validator

---

## Task 1: Card DTOs and Validation

**Context:**
Define the data transfer objects for card creation and update. These DTOs validate all card fields from the design: contact info, social links, styling, and visibility.

**Files:**
- Create: `apps/api/src/cards/dto/create-card.dto.ts`
- Create: `apps/api/src/cards/dto/update-card.dto.ts`
- Create: `apps/api/src/cards/dto/card-response.dto.ts`

**Requirements:**
- `CreateCardDto` requires `name`, all other fields optional
- JSON array fields (phones, emails, websites, socialLinks) use nested validation with `class-validator` + `class-transformer`
- Phone: `{ number: string, label?: string }`
- Email: `{ email: string, label?: string }`
- Social link: `{ platform: string, url: string }` — platform validated against known list
- Address: `{ street?: string, city?: string, country?: string, zip?: string }`
- Color fields validated as hex format
- `UpdateCardDto` uses `PartialType(CreateCardDto)`
- `CardResponseDto` shapes the API response (excludes internal fields)

**Test cases to cover:**
- Valid DTO passes validation
- Missing required `name` fails validation
- Invalid hex color format fails
- Nested phone/email objects validated correctly

**Acceptance criteria:**
- [ ] DTOs validate all card fields correctly
- [ ] Tests pass

---

## Task 2: Card CRUD Service

**Context:**
The cards service handles all business logic for creating, reading, updating, and deleting cards. It enforces ownership (users can only manage their own cards) and handles slug generation.

**Files:**
- Create: `apps/api/src/cards/cards.module.ts`
- Create: `apps/api/src/cards/cards.service.ts`
- Modify: `apps/api/src/app.module.ts` (import CardsModule)

**Requirements:**
- `create(userId, dto)` — creates card with auto-generated slug, returns card
- `findAllByUser(userId)` — returns all cards for a user
- `findOne(id, userId)` — returns card if owned by user, throws `NotFoundException` otherwise
- `findBySlug(slug)` — returns card by slug (public, no auth check)
- `update(id, userId, dto)` — updates card if owned by user
- `delete(id, userId)` — deletes card if owned by user
- All mutations check ownership by comparing `card.userId === userId`
- Handle Prisma unique constraint violations on slug with user-friendly error

**Test cases to cover:**
- Create card returns card with generated slug
- Find by user returns only that user's cards
- Find one throws 404 for non-existent card
- Find one throws 403 if card belongs to different user
- Update modifies specified fields
- Delete removes card and cascades to analytics events
- Concurrent slug conflicts handled gracefully

**Acceptance criteria:**
- [ ] Full CRUD operations work with ownership enforcement
- [ ] Tests pass

---

## Task 3: Slug Generation and Management

**Context:**
Slugs are auto-generated from the card name and must be unique. Users can edit slugs. The system handles conflicts with incrementing suffixes.

**Files:**
- Create: `apps/api/src/cards/slug.util.ts`
- Modify: `apps/api/src/cards/cards.service.ts` (integrate slug generation)

**Requirements:**
- Generate slug from name: lowercase, replace spaces/special chars with hyphens, strip non-alphanumeric
- If slug exists, append incrementing suffix: `john-doe` → `john-doe-2` → `john-doe-3`
- On update, if `slug` is provided, validate uniqueness (excluding current card)
- Slug validation: 2-100 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens
- Slug generation is a pure utility function (easy to test)

```typescript
// Example: slug generation pattern
generateSlug('John Doe') // → 'john-doe'
generateSlug('María García') // → 'maria-garcia'
```

**Test cases to cover:**
- Basic name → slug conversion
- Unicode characters handled (transliterated or stripped)
- Duplicate slugs get incrementing suffixes
- Custom slug validation rules
- Edge cases: empty string, very long names, special characters only

**Acceptance criteria:**
- [ ] Slug generation produces clean, URL-safe strings
- [ ] Uniqueness enforced at service and database level
- [ ] Tests pass

---

## Task 4: Card CRUD Controller

**Context:**
The controller exposes REST endpoints for card management. All routes are protected by JWT auth. The controller delegates to the cards service.

**Files:**
- Create: `apps/api/src/cards/cards.controller.ts`

**Reference:** Follow NestJS controller patterns with `@UseGuards(JwtAuthGuard)` from Phase 2.

**Requirements:**
- `POST /api/cards` — create card (body: CreateCardDto)
- `GET /api/me/cards` — list current user's cards
- `GET /api/cards/:id` — get card by ID (owner only)
- `PUT /api/cards/:id` — update card (body: UpdateCardDto, owner only)
- `DELETE /api/cards/:id` — delete card (owner only)
- `GET /api/cards/:slug` — get card by slug (public, no auth required)
- All authenticated routes use `@CurrentUser()` decorator
- Return appropriate HTTP status codes (201 for create, 204 for delete)

**Test cases to cover:**
- Each endpoint returns correct status code and response
- Unauthenticated requests to protected endpoints return 401
- Non-owner access returns 403

**Acceptance criteria:**
- [ ] All card REST endpoints operational
- [ ] Auth and ownership properly enforced
- [ ] Tests pass

---

## Task 5: Image Upload Service

**Context:**
Users upload avatar, banner, and background images. Images are validated, resized/compressed, and stored on the local filesystem.

**Files:**
- Create: `apps/api/src/uploads/uploads.module.ts`
- Create: `apps/api/src/uploads/uploads.service.ts`
- Create: `apps/api/src/uploads/uploads.controller.ts`
- Create: `apps/api/src/uploads/file-validation.pipe.ts`
- Modify: `apps/api/src/app.module.ts` (import UploadsModule)

**Requirements:**
- `POST /api/cards/:id/upload/:type` — upload image (type: avatar, banner, background)
- Accept only image MIME types: jpeg, png, webp, gif
- Max file size from `MAX_FILE_SIZE` env var (default: 5MB)
- Use `sharp` for processing:
  - Avatar: resize to 400x400, crop to square
  - Banner: resize to max 1200px wide, maintain aspect ratio
  - Background: resize to max 1920px wide
- Store processed images at `{UPLOAD_DIR}/cards/{cardId}/{type}.webp`
- Convert all images to WebP for consistent format and size
- Update card record with file path after successful upload
- Serve uploaded files via `GET /uploads/*` static route
- Delete old image when replacing

**Dependencies (npm):**
- `sharp`, `@types/multer`

**Test cases to cover:**
- Valid image upload succeeds and returns file path
- Non-image file rejected with 400
- Oversized file rejected with 413
- Upload to non-owned card returns 403
- Old image is deleted when replaced

**Acceptance criteria:**
- [ ] Image upload, processing, and storage works end-to-end
- [ ] Validation rejects invalid files
- [ ] Tests pass

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Card DTOs | - | 1 |
| 2: Card CRUD Service | 1 | 2 |
| 3: Slug Generation | - | 1 |
| 4: Card CRUD Controller | 1, 2 | 3 |
| 5: Image Upload Service | 2 | 3 |

## Execution Waves

**Wave 1:** Tasks 1, 3 (DTOs and slug util — independent, run in parallel)
**Wave 2:** Task 2 (service depends on DTOs and slug util)
**Wave 3:** Tasks 4, 5 (controller and uploads — depend on service, run in parallel)
