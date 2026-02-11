# Email Signature Generator - Research Log

## Initial Findings

- [2026-02-10]: Card model already contains all core contact data (name, title, company, phones, emails, websites, socialLinks, address, avatar). Identity fields `pronouns` and `calendarUrl` will be added to Card. Signature presentation config lives in a separate `Signature` model (1:N relationship with Card).

- [2026-02-10]: Existing server-side rendering pattern (Handlebars + `card.hbs`) uses CSS custom properties and `color-mix()` — email signatures can't use either. Client-side generation with inline styles is the right approach.

- [2026-02-10]: Theme resolver (`theme.resolver.ts`) handles branding (primaryColor, bgColor, etc.) with org-level defaults. Signature should use `primaryColor` for accent elements but needs direct hex values, not CSS variables.

- [2026-02-10]: Card editor uses collapsible sections pattern. Initially considered adding signature as a section there, but decided signatures should be a standalone feature with their own route/nav item — they're a distribution channel for cards, not a card attribute.

- [2026-02-10]: `useCards()` composable provides the CRUD pattern for user-scoped resources. `useSignatures()` will follow the same pattern with `useApi()` for fetch calls.

- [2026-02-10]: vCard builder (`vcard.builder.ts`) shows the pattern for generating downloadable artifacts from card data — signature generation follows the same concept but client-side.

- [2026-02-10]: Card DTOs use class-validator with URL validation (`@IsUrl()`) — calendarUrl will use the same pattern. Pronouns is free text. signatureLayout uses a new enum.

- [2026-02-10]: Web app tests use Vitest with happy-dom. SignatureBuilder and useSignatureHtml will need tests for HTML generation correctness and field toggle behavior.

- [2026-02-10]: QR modal (`QrModal.vue`) was recently added as a component used within the card editor — provides a pattern for feature components integrated into the editor view.

## Email Client Compatibility Research

- Gmail: Strips `<style>` tags, supports inline CSS. Supports `<table>` layout. Strips `background-image` CSS. Supports Google Fonts only when fonts are already installed on the device.
- Outlook (Desktop): Uses Word rendering engine. Must use `<table>` layout. No flexbox/grid. No `border-radius` (rounds corners not supported). Explicit width/height on images required.
- Apple Mail: Most permissive. Supports `<style>` tags, modern CSS, dark mode media queries.
- Thunderbird: Good HTML support, similar to Firefox rendering.
- Yahoo Mail: Strips `<style>` tags like Gmail. Inline CSS required.

## Clipboard API Research

- `navigator.clipboard.write()` with `ClipboardItem` supports `text/html` MIME type in Chrome, Edge, Safari (since 13.1), Firefox (since 127).
- Fallback for older browsers: `document.execCommand('copy')` from a hidden contentEditable div.
- Gmail's signature editor accepts pasted HTML directly.
- Apple Mail's signature preferences accept pasted rich text.
- Outlook allows pasting HTML into signature settings.

## Architecture Decision: Standalone vs Card-embedded

- [2026-02-10]: Decided signatures should be a **standalone feature** (separate nav item, route, model) rather than embedded in the card editor. Rationale:
  - Email signatures are a *distribution channel* for cards — important enough for top-level nav
  - One card can have multiple signatures (formal, casual, mobile)
  - Separation of concerns: Card = identity data, Signature = presentation/rendering config
  - Avoids bloating the Card model with presentation fields
  - `pronouns` and `calendarUrl` stay on Card (identity data useful on public card page too)
  - Signature-specific config (layout, field toggles, disclaimer, accent color) in `Signature.config` JSON field

## Codebase Pattern Analysis (Planning Phase)

- [2026-02-10]: Cards module is the reference for API structure: `CardsController` + `MyCardsController` + `AdminCardsController` pattern. Signatures needs only a user-scoped controller (like `MyCardsController`) — no admin endpoints for v1.

- [2026-02-10]: Prisma uses UUID primary keys (`@default(uuid())`) for User/Card, but design specifies `cuid()` for Signature. Using `cuid()` is fine as a valid Prisma strategy.

- [2026-02-10]: Card model already has JSON fields for complex types (phones, emails, socialLinks). Signature `config` JSON follows the same pattern.

- [2026-02-10]: DTO pattern uses `static fromCard()` factory methods. Signature response DTO needs `static fromSignature()` with a card summary (id, name, slug, avatarPath) for the list view.

- [2026-02-10]: Frontend uses `storeToRefs()` wrapper pattern — cards store has thin `useCards()` composable. Signatures will mirror this exactly.

- [2026-02-10]: Router uses lazy-loaded components with meta guards. Signature routes need `requiresAuth: true` but not `requiresAdmin`.

- [2026-02-10]: AppNav uses lucide-vue-next icons. `FileSignature` or `PenLine` icons available for signatures nav item.

- [2026-02-10]: i18n keys are nested by feature namespace. Signatures needs `signatures.*` namespace following the `editor.*` and `dashboard.*` pattern.

- [2026-02-10]: DashboardView uses three-state pattern (loading/empty/content) with skeleton loaders and delete confirmation modal. SignaturesView will need a fourth state: "no cards" (user needs cards before signatures).

<!-- Subagents append learnings below this line -->

## Backend Implementation Learnings

- [2026-02-10]: `pnpm db:generate` must be run after migration for dev server to pick up new Prisma types. The implementer ran it during migration but the dev server needed a manual regenerate to resolve `SignatureLayout`/`Signature` import errors.
- [2026-02-10]: Card service uses `...rest` spread for create/update — new fields on Card model (pronouns, calendarUrl) flow through without service code changes.
- [2026-02-10]: `UpdateSignatureDto` was defined independently (not using `PartialType`) to exclude `cardId` from being updatable. This is a deliberate deviation from the Card pattern where `UpdateCardDto` uses `PartialType(CreateCardDto)`.
- [2026-02-10]: Controller uses `@Patch` (not `@Put`) for signature updates — more appropriate for partial updates. Note: `local-api.sh` only supports `put`, not `patch`, so manual curl was needed for PATCH testing.
- [2026-02-10]: `SignatureResponseDto.fromSignature()` uses explicit field-by-field mapping (vs CardResponseDto's `Object.assign` approach) to expose only a trimmed `CardSummary` instead of the full Card object.
- [2026-02-10]: `as unknown as Prisma.InputJsonValue` cast needed for config JSON field — same pattern as CardsService for phones/emails/socialLinks JSON fields.

## Frontend Engine Implementation Learnings

- [2026-02-11]: Card interface additions (`pronouns`, `calendarUrl`) used `string | null` (not optional `?:`) to match existing nullable field pattern. This required updating existing test mocks (e.g., `QrModal.test.ts`) that create Card objects.
- [2026-02-11]: NestJS static assets are served with prefix `/public` (`main.ts:115`), so icon URLs must be `/public/assets/social/{platform}.png`, not `/assets/social/{platform}.png` as the plan spec originally assumed.
- [2026-02-11]: Caddyfile needed a `/public/*` route added to proxy static assets to the API in production.
- [2026-02-11]: `SOCIAL_PLATFORMS` constant has 28 platforms (not 10 as listed in the plan). Icons were created for all 28.
- [2026-02-11]: `escapeHtml` must escape all 5 standard entities including single quotes (`'` → `&#39;`) for defense-in-depth, even when generated HTML uses double-quoted attributes.
- [2026-02-11]: TypeScript non-null assertions (`!`) are needed after array element access when a `.length` guard exists but TS can't infer through optional chaining (e.g., `card.emails[0]!.email` after `card.emails?.length` check).
- [2026-02-11]: `APP_URL` resolved at module load time via `import.meta.env.VITE_APP_URL || window.location.origin`. Test stubs for `window.location` must run before module import to take effect.

## Frontend Views Implementation Learnings

- [2026-02-11]: i18n JSON keys cannot simultaneously be a string value and an object parent. When `signatures.editor.fields` was needed as both a section heading string and a parent for field labels, the solution was `fields` for the heading and `fieldLabels` for the sub-keys.
- [2026-02-11]: SignaturePreview must use blob URLs (`URL.createObjectURL`) instead of `srcdoc` for the iframe. `srcdoc` documents have URL `about:srcdoc` which causes resource loading issues (images fail to load even with `sandbox="allow-same-origin"`). Blob URLs (`blob:http://localhost:5173/…`) are truly same-origin and load images normally. Old blob URLs must be revoked via `URL.revokeObjectURL` in `onUnmounted` and before each update to prevent memory leaks.
- [2026-02-11]: SignaturesView needed a fourth state beyond the DashboardView's three-state pattern: "no cards" (prerequisite check before "no signatures").
- [2026-02-11]: Save toast must use a feature-specific i18n key (`success.signatureSaved`) not a borrowed key (`success.settingsSaved`) — semantically wrong messages confuse users.
- [2026-02-11]: Vue Router route ordering matters: `/signatures/new` must come before `/signatures/:id` so the literal `new` segment is matched before the dynamic `:id` param.
