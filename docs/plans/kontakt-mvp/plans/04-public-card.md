# Phase 4: Public Card Experience

> **For Claude:** Use `/implement docs/plans/kontakt-mvp/` to execute this plan.

**Covers:** REQ-010, REQ-011, REQ-012, REQ-013

**Goal:** Build the server-rendered public card page, vCard download, QR code generation, and view event tracking.

**Tech Stack:** NestJS, Handlebars (hbs), vCard RFC 6350, qrcode npm package

---

## Task 1: Server-Rendered Card Page

**Context:**
The public card page at `/c/:slug` is the core deliverable — what recipients see when they receive a digital business card. It's server-rendered HTML by NestJS using Handlebars templates, with proper OpenGraph meta tags for link previews.

**Files:**
- Create: `apps/api/src/render/render.module.ts`
- Create: `apps/api/src/render/render.controller.ts`
- Create: `apps/api/src/render/render.service.ts`
- Create: `apps/api/templates/card.hbs`
- Create: `apps/api/templates/card-404.hbs`
- Create: `apps/api/templates/layouts/main.hbs`
- Modify: `apps/api/src/main.ts` (configure Handlebars view engine)
- Modify: `apps/api/src/app.module.ts` (import RenderModule)

**Reference:** NestJS MVC pattern — `app.setViewEngine('hbs')`, `app.setBaseViewsDir()`.

**Requirements:**
- `GET /c/:slug` renders the card as HTML (NOT JSON, NOT under `/api`)
- Controller uses `@Render('card')` decorator with Handlebars template
- Template includes:
  - Full name, job title, company
  - Avatar (circle or rounded-square based on setting)
  - Banner image
  - Contact info with action links (tel:, mailto:)
  - Social links with platform icons
  - Bio text
  - "Save Contact" button (links to vCard download)
  - "Share" button (Web Share API with fallback to copy link)
- OpenGraph meta tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Twitter card meta tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Structured data (JSON-LD) for Person schema
- Card colors and theme applied via inline CSS variables
- If card is `DISABLED`, return 404 page
- If card is `UNLISTED`, render normally (just no SEO indexing)
- `noindex` meta tag when card has `noIndex: true` or visibility is `UNLISTED`
- Small inline `<script>` that fires view tracking POST on page load
- Page must work with JavaScript disabled (except view tracking and share)
- Background image support with CSS styling

**Dependencies (npm):**
- `hbs` (Handlebars for Express/NestJS)

**Test cases to cover:**
- Valid slug returns 200 with HTML content
- HTML includes correct OG meta tags
- Disabled card returns 404 page
- Unlisted card renders but includes noindex
- Card with all fields populated renders correctly
- Card with minimal fields (name only) renders correctly

**Acceptance criteria:**
- [ ] Card page renders with correct data and styling
- [ ] OG meta tags are correct for link previews
- [ ] Works without JavaScript
- [ ] Tests pass

---

## Task 2: vCard Generation

**Context:**
Recipients can download the card as a vCard 4.0 file (.vcf) compliant with RFC 6350. This triggers the phone's native contact import flow.

**Files:**
- Create: `apps/api/src/contacts/contacts.module.ts`
- Create: `apps/api/src/contacts/contacts.service.ts`
- Create: `apps/api/src/contacts/contacts.controller.ts`
- Create: `apps/api/src/contacts/vcard.builder.ts`
- Modify: `apps/api/src/app.module.ts` (import ContactsModule)

**Requirements:**
- `GET /api/cards/:slug/vcf` — returns vCard file (public, no auth)
- Build RFC 6350 vCard 4.0 format with:
  - `FN` (full name)
  - `N` (structured name — split full name by spaces)
  - `TITLE` (job title)
  - `ORG` (company)
  - `TEL` with `TYPE` parameter for each phone
  - `EMAIL` with `TYPE` parameter for each email
  - `ADR` (address components)
  - `URL` for each website
  - `NOTE` (bio)
  - `PHOTO` as base64-encoded data URI for avatar (if available)
  - `X-SOCIALPROFILE` for social links
- Response headers: `Content-Type: text/vcard`, `Content-Disposition: attachment; filename="{name}.vcf"`
- Handle special characters in vCard values (escaping commas, semicolons, newlines)
- Custom vCard builder (not a library) for full control over output

```
// Example: vCard 4.0 output format
BEGIN:VCARD
VERSION:4.0
FN:John Doe
N:Doe;John;;;
TITLE:Software Engineer
ORG:Acme Corp
TEL;TYPE=work:+1-555-0100
EMAIL;TYPE=work:john@acme.com
END:VCARD
```

**Test cases to cover:**
- Full card generates complete vCard with all fields
- Minimal card (name only) generates valid vCard
- Special characters escaped correctly
- Content-Type and Content-Disposition headers correct
- Avatar embedded as base64 PHOTO
- 404 for non-existent slug

**Acceptance criteria:**
- [ ] vCard downloads and imports correctly on iOS and Android
- [ ] RFC 6350 compliant output
- [ ] Tests pass

---

## Task 3: QR Code Generation

**Context:**
Each card has a QR code that encodes its public URL. Available as PNG or SVG via an API endpoint.

**Files:**
- Create: `apps/api/src/cards/qr.service.ts`
- Modify: `apps/api/src/cards/cards.controller.ts` (add QR endpoint)
- Modify: `apps/api/src/cards/cards.module.ts` (provide QrService)

**Requirements:**
- `GET /api/cards/:slug/qr` — returns QR code image (public, no auth)
- Query params: `format=png|svg` (default: png), `size=100-1000` (default: 300)
- QR encodes the full card URL: `{APP_URL}/c/{slug}`
- PNG: `Content-Type: image/png`
- SVG: `Content-Type: image/svg+xml`
- Cache-friendly headers (QR doesn't change unless slug changes)

**Dependencies (npm):**
- `qrcode`, `@types/qrcode`

**Test cases to cover:**
- PNG format returns valid image
- SVG format returns valid SVG
- Custom size parameter works
- Invalid slug returns 404
- Invalid format parameter returns 400

**Acceptance criteria:**
- [ ] QR code encodes correct URL
- [ ] Both PNG and SVG formats work
- [ ] Tests pass

---

## Task 4: View Event Tracking

**Context:**
When the public card page loads, a view event is recorded. This is the foundation for analytics (Phase 2) but the tracking endpoint is needed now.

**Files:**
- Create: `apps/api/src/analytics/analytics.module.ts`
- Create: `apps/api/src/analytics/analytics.service.ts`
- Create: `apps/api/src/analytics/analytics.controller.ts`
- Modify: `apps/api/src/app.module.ts` (import AnalyticsModule)

**Requirements:**
- `POST /api/cards/:slug/view` — record a view event (public, no auth)
- Creates `AnalyticsEvent` with `type: VIEW`
- Hash the IP address (SHA-256 with daily salt) for basic deduplication, store as `ipHash`
- Rate limit: max 1 view per IP hash per card per hour (prevent spam)
- Return 204 No Content (fire-and-forget from client perspective)
- Don't throw errors — silently fail if deduplication blocks the event

**Test cases to cover:**
- View event creates analytics record
- Duplicate view within window is deduplicated
- Invalid slug returns 204 anyway (fire-and-forget)
- IP hash is deterministic for same IP + salt

**Acceptance criteria:**
- [ ] View events are recorded in the database
- [ ] Basic deduplication prevents spam
- [ ] Tests pass

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Server-Rendered Card Page | - | 1 |
| 2: vCard Generation | - | 1 |
| 3: QR Code Generation | - | 1 |
| 4: View Event Tracking | - | 1 |

## Execution Waves

**Wave 1:** Tasks 1, 2, 3, 4 (all independent — run in parallel)

All tasks in this phase are independent of each other. They all depend on the Cards service from Phase 3 but not on each other.
