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
