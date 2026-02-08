# Phase 5: Settings & Theming

> **For Claude:** Use `/implement docs/plans/kontakt-mvp/` to execute this plan.

**Covers:** REQ-014, REQ-015, REQ-016

**Goal:** Build instance settings management with admin CRUD, public settings exposure, and card theming that inherits from instance defaults.

**Tech Stack:** NestJS, Prisma, class-validator

---

## Task 1: Settings Service with In-Memory Cache

**Context:**
Instance settings are stored as key-value pairs in the database and cached in memory for fast reads. They control organization branding, default card appearance, and feature toggles.

**Files:**
- Create: `apps/api/src/settings/settings.module.ts`
- Create: `apps/api/src/settings/settings.service.ts`
- Create: `apps/api/src/settings/dto/update-settings.dto.ts`
- Create: `apps/api/src/settings/settings.constants.ts`
- Modify: `apps/api/src/app.module.ts` (import SettingsModule)

**Requirements:**
- `SettingsService` loads all settings into a `Map<string, string>` on module init
- `get(key)` reads from cache, `getAll()` returns full map
- `update(key, value)` writes to DB and updates cache
- `bulkUpdate(entries)` updates multiple settings in a transaction
- Settings constants define all known keys with default values:

```typescript
// Example: settings keys pattern
export const SETTINGS_KEYS = {
  ORG_NAME: { key: 'org_name', default: 'Kontakt' },
  ORG_LOGO: { key: 'org_logo', default: null },
  // ...
} as const;
```

- Known settings keys:
  - `org_name`, `org_logo`, `org_favicon`
  - `default_primary_color`, `default_secondary_color`, `default_bg_color`
  - `default_theme` (light/dark/auto), `default_avatar_shape` (circle/rounded_square)
  - `allow_user_color_override` (boolean), `allow_user_background_image` (boolean)
  - `default_visibility` (public/unlisted)
  - `footer_text`, `footer_link`
- Returns default values for missing keys
- `SettingsModule` is global (settings needed across modules)

**Test cases to cover:**
- Settings loaded into cache on init
- Get returns cached value
- Update writes to DB and refreshes cache
- Missing key returns default value
- Bulk update works in transaction

**Acceptance criteria:**
- [ ] Settings CRUD with in-memory caching
- [ ] Default values for all known keys
- [ ] Tests pass

---

## Task 2: Settings Admin Controller

**Context:**
Admin users manage instance settings through REST endpoints. Includes logo/favicon upload.

**Files:**
- Create: `apps/api/src/settings/settings.controller.ts`

**Requirements:**
- `GET /api/settings` — returns all settings (admin only)
- `PUT /api/settings` — bulk update settings (admin only, body: key-value pairs)
- `POST /api/settings/logo` — upload org logo (admin only, image file)
- `POST /api/settings/favicon` — upload org favicon (admin only, image file)
- All admin routes protected with `@Roles('ADMIN')` and `@UseGuards(JwtAuthGuard, RolesGuard)`
- Logo processing: resize to max 200px, store as WebP
- Favicon processing: resize to 32x32 and 180x180, store as PNG

**Test cases to cover:**
- Admin can read all settings
- Admin can update settings
- Non-admin user gets 403
- Logo upload processes and stores image
- Invalid setting key returns 400

**Acceptance criteria:**
- [ ] Admin CRUD for settings works
- [ ] Logo/favicon upload with processing
- [ ] Tests pass

---

## Task 3: Public Settings Endpoint

**Context:**
The public card page and SPA need access to non-sensitive instance settings (branding, colors) without authentication.

**Files:**
- Modify: `apps/api/src/settings/settings.controller.ts` (add public endpoint)

**Requirements:**
- `GET /api/settings/public` — returns subset of settings (no auth)
- Public settings include: `org_name`, `org_logo`, `org_favicon`, `default_primary_color`, `default_secondary_color`, `default_bg_color`, `default_theme`, `default_avatar_shape`, `footer_text`, `footer_link`
- Excludes admin-only settings like override toggles
- Response should be cache-friendly (ETag or Cache-Control)

**Test cases to cover:**
- Public endpoint returns only whitelisted settings
- Override toggles are NOT exposed
- Response is cacheable

**Acceptance criteria:**
- [ ] Public settings endpoint returns correct subset
- [ ] Tests pass

---

## Task 4: Card Theming with Instance Defaults

**Context:**
When rendering a card, its colors and theme need to be resolved by merging card-specific overrides with instance defaults. Override toggles control whether users can customize.

**Files:**
- Create: `apps/api/src/cards/theme.resolver.ts`
- Modify: `apps/api/src/render/render.service.ts` (use theme resolver)

**Requirements:**
- `resolveCardTheme(card, settings)` returns the effective theme for a card:
  - If card has a color set AND admin allows overrides → use card's color
  - If card has a color set AND admin disallows overrides → use instance default
  - If card has no color set → use instance default
  - Auto-calculate `textColor` (white or black) based on background color luminance if not explicitly set
- Same logic for: `primaryColor`, `bgColor`, `theme`, `avatarShape`, `bgImagePath`
- `allow_user_background_image: false` → strip `bgImagePath` even if card has one
- Pure function (easy to test, no side effects)

**Test cases to cover:**
- Card override used when allowed
- Card override ignored when disallowed
- Instance default used when card has no override
- Text color auto-calculated correctly for light and dark backgrounds
- Background image stripped when not allowed

**Acceptance criteria:**
- [ ] Theme resolution handles all override scenarios
- [ ] Auto-calculated text color provides good contrast
- [ ] Tests pass

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Settings Service | - | 1 |
| 2: Settings Admin Controller | 1 | 2 |
| 3: Public Settings Endpoint | 1 | 2 |
| 4: Card Theming Resolver | 1 | 2 |

## Execution Waves

**Wave 1:** Task 1 (settings service — foundation)
**Wave 2:** Tasks 2, 3, 4 (controller, public endpoint, theme resolver — all depend on service, run in parallel)
