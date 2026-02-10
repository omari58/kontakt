# Frontend Signature HTML Engine

> **For Claude:** Use `/implement docs/plans/email-footer/` to execute this plan.

**Covers:** REQ-006, REQ-011, REQ-012

**Goal:** Build the client-side HTML generation engine that produces email-client-compatible signature HTML from card data and signature configuration.

**Tech Stack:** Vue 3 composables, TypeScript, Vitest

---

## Task 1: Add Signature Types

**Context:**
Define TypeScript interfaces for signatures, signature config, and layout types used across the frontend.

**Files:**
- Modify: `apps/web/src/types/index.ts`

**Reference:** Look at existing Card, Phone, Email interfaces in the same file.

**Requirements:**
- `SignatureLayout` type: `'COMPACT' | 'CLASSIC' | 'MINIMAL'`
- `SignatureFieldToggles` interface with boolean fields: `phone`, `email`, `website`, `socials`, `pronouns`, `calendar`, `disclaimer`, `cardLink`
- `SignatureConfig` interface: `{ fields: SignatureFieldToggles, disclaimer: string, accentColor: string }`
- `Signature` interface: `{ id, name, cardId, card: { id, name, slug, avatarPath }, userId, layout: SignatureLayout, config: SignatureConfig, createdAt, updatedAt }`
- Add `pronouns?: string` and `calendarUrl?: string` to the existing `Card` interface

**Test cases to cover:**
- N/A (type definitions only)

**Acceptance criteria:**
- [ ] Types compile without errors
- [ ] Card interface includes new fields

---

## Task 2: Social Icon Assets

**Context:**
Ship small PNG social icons for use in email signatures. Email clients can't render SVG or icon fonts, so we need hosted raster images.

**Files:**
- Create: `apps/api/public/assets/social/linkedin.png` (20x20)
- Create: `apps/api/public/assets/social/github.png` (20x20)
- Create: `apps/api/public/assets/social/twitter.png` (20x20)
- Create: `apps/api/public/assets/social/facebook.png` (20x20)
- Create: `apps/api/public/assets/social/instagram.png` (20x20)
- Create: `apps/api/public/assets/social/youtube.png` (20x20)
- Create: `apps/api/public/assets/social/tiktok.png` (20x20)
- Create: `apps/api/public/assets/social/dribbble.png` (20x20)
- Create: `apps/api/public/assets/social/behance.png` (20x20)
- Create: `apps/api/public/assets/social/medium.png` (20x20)

**Reference:** Check `apps/api/src/cards/dto/create-card.dto.ts` for `SOCIAL_PLATFORMS` constant — this defines which platforms are supported.

**Requirements:**
- 20x20 pixel PNG icons, simple monochrome style (works on light backgrounds)
- One icon per supported platform in `SOCIAL_PLATFORMS`
- Served as static assets from the API at `/assets/social/{platform}.png`
- Verify NestJS serves the `public/` directory as static files (check `main.ts` for `app.useStaticAssets()` or `ServeStaticModule`)
- If static serving isn't configured, add it

**Note:** Icons can be generated programmatically or sourced from an open-source icon set (e.g., Simple Icons). The implementer should choose a practical approach — placeholder PNGs are acceptable for initial implementation, to be replaced with polished assets.

**Test cases to cover:**
- Static asset accessible at `/assets/social/linkedin.png` (manual/integration check)

**Acceptance criteria:**
- [ ] Icons accessible via HTTP
- [ ] One icon per supported social platform
- [ ] 20x20 dimensions

---

## Task 3: Build useSignatureHtml Composable

**Context:**
This is the core engine that generates email-compatible HTML from card data and signature configuration. It must produce HTML that works in Gmail, Outlook, Apple Mail, and Yahoo Mail.

**Files:**
- Create: `apps/web/src/composables/useSignatureHtml.ts`
- Test: `apps/web/src/composables/useSignatureHtml.test.ts`

**Reference:** Study `apps/web/src/composables/useCardForm.ts` for composable patterns. Study `apps/api/src/contacts/vcard.builder.ts` for the concept of generating output from card data.

**Requirements:**

### Input/Output
- Input: `card` (reactive Card object), `config` (reactive SignatureConfig), `layout` (reactive SignatureLayout)
- Output: computed `html` ref (string) that reactively updates when inputs change
- Also expose `plainText` computed for text-only fallback

### HTML Generation Rules (ALL layouts)
- Table-based layout only — no flexbox, grid, or div-based layout
- All CSS inline on each element (Gmail strips `<style>` blocks)
- Explicit `width` and `height` attributes on all `<img>` tags
- All URLs absolute: `${APP_URL}/uploads/...` for images, `${APP_URL}/c/${slug}` for card link
- Web-safe font stack: `Arial, Helvetica, sans-serif` (use `Georgia, serif` for classic feel)
- Max width: 500px on outer table
- Meaningful `alt` text on avatar image (person's name)
- Accent color: use `config.accentColor` if set, fall back to `card.primaryColor`, fall back to `#2563eb`
- Only render fields where the toggle is `true` AND the card has data for that field
- Separator character: ` · ` (middle dot with spaces) between inline items

### Layout: Compact
- Single-row table: avatar cell (48x48, rounded if supported) | info cell
- Name + job title/company on first line, separated by ` | `
- Pronouns on second line (if enabled and present)
- Contact info (email, phone) on third line, separated by ` · `
- Social icons inline, followed by card link

### Layout: Classic
- Two-row concept: avatar cell beside stacked info
- Name as heading (bold, larger), job title + company below
- Pronouns below title (if enabled)
- Horizontal rule (1px line using table border trick, accent color)
- Contact details stacked: email, phone, website each on own line
- Social icons row
- Card link + calendar link row
- Disclaimer at bottom in smaller, muted text

### Layout: Minimal
- No images at all
- Name · Title at Company (pronouns) — single line, bold name
- Contact details on second line, separated by ` · `
- Social links as text labels (not icons), separated by ` · `
- Card link + calendar as text links
- Disclaimer at bottom

### Social Icons in HTML
- For Compact/Classic: `<img src="${APP_URL}/assets/social/{platform}.png" width="20" height="20" alt="{Platform}" />`
- Wrapped in `<a href="{url}">` linking to the user's social profile
- For Minimal: `<a href="{url}">{Platform Name}</a>` as text

### APP_URL Resolution
- Read from `import.meta.env.VITE_APP_URL` or fall back to `window.location.origin`

**Test cases to cover:**
- Compact layout generates valid table HTML with avatar and inline info
- Classic layout includes horizontal rule and stacked fields
- Minimal layout has no `<img>` tags
- Disabled field toggles omit those fields from output
- Missing card data (no phone) omits phone even if toggle is on
- Accent color falls back chain: config → card.primaryColor → default
- Social icons use `<img>` in Compact/Classic, text in Minimal
- Card link points to correct `/c/{slug}` URL
- All image URLs are absolute
- HTML contains no `<style>` blocks (all inline)
- Plain text output strips HTML and preserves info

**Acceptance criteria:**
- [ ] All three layouts generate valid HTML
- [ ] Field toggles control visibility
- [ ] HTML uses only tables and inline styles
- [ ] Tests pass
- [ ] No `<style>` blocks in output

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Signature types | - | 1 |
| 2: Social icon assets | - | 1 |
| 3: useSignatureHtml composable | 1 | 2 |

## Execution Waves

**Wave 1:** Tasks 1, 2 (independent, run in parallel)
**Wave 2:** Task 3 (depends on types from Task 1)
