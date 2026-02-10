# Email Signature Generator

## Problem Statement

Kontakt users have rich digital business cards with contact details, social links, and branding — but they can't leverage that data in daily email communications. Email signatures are the most-viewed piece of personal branding (sent dozens of times daily), yet most people use plain text or poorly formatted signatures.

By generating professional HTML email signatures directly from existing card data, we make the card platform more valuable and give users a reason to keep their card data up-to-date — every signature links back to the full digital card.

## Solution Overview

A new **"Email Signature" section in the Card Editor** that:

1. Pulls data from the existing card (name, title, company, phone, email, website, socials, avatar)
2. Adds signature-specific fields: **pronouns**, **calendar/booking link**, **disclaimer text**
3. Offers **3 layout templates**: Compact (horizontal), Classic (stacked), Minimal (text-only)
4. Shows a **live preview** of the signature in a sandboxed iframe
5. Provides a **"Copy to Clipboard" button** that puts email-client-compatible HTML on the clipboard
6. Includes a **"View my card" link** pointing to `/c/{slug}` in every signature

**Key decision: client-side generation.** The HTML is built entirely in the Vue frontend — no new API endpoints. Card data is already available in the editor, and this avoids round-trips and new server-side templates.

## Architecture

### Data Model Changes

New fields on the `Card` model (Prisma schema):

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `pronouns` | `String?` | `null` | Free text: "he/him", "she/her", etc. |
| `calendarUrl` | `String?` | `null` | Booking link (Calendly, Cal.com, etc.) |
| `signatureDisclaimer` | `String?` | `null` | Legal disclaimer text, max ~200 chars |
| `signatureLayout` | `SignatureLayout?` | `null` | Enum: `COMPACT`, `CLASSIC`, `MINIMAL` |

New Prisma enum:
```prisma
enum SignatureLayout {
  COMPACT
  CLASSIC
  MINIMAL
}
```

These fields are stored on the Card model for cross-device persistence and API consistency.

### Frontend Components

```
apps/web/src/
├── composables/
│   └── useSignatureHtml.ts      # Generates raw HTML string from card data + options
├── components/
│   └── editor/
│       ├── SignatureBuilder.vue  # Main section: layout picker, field toggles, preview, copy button
│       └── SignaturePreview.vue  # Sandboxed iframe rendering the generated HTML
└── views/
    └── CardEditorView.vue       # Add "Email Signature" collapsible section
```

**`useSignatureHtml(card, options)`** composable:
- Input: card data (reactive) + signature options (layout, which fields to show)
- Output: computed HTML string
- Builds table-based HTML with fully inline CSS
- Uses card's `primaryColor` for accent elements
- Web-safe font stacks (no Google Fonts in email)
- All image URLs are absolute (`{APP_URL}{avatarPath}`)

**`SignatureBuilder.vue`**:
- Layout picker with visual thumbnails for 3 styles
- Field toggles: checkboxes for which fields to include (phone, email, website, socials, pronouns, calendar, disclaimer, "view my card" link)
- Signature-specific inputs: pronouns text field, calendar URL, disclaimer textarea
- "Copy to Clipboard" button with success toast
- "Copy as HTML source" fallback link

**`SignaturePreview.vue`**:
- Receives HTML string as prop
- Renders in a sandboxed `<iframe>` via `srcdoc` attribute
- Isolates email HTML styles from the Vue app's CSS
- Auto-resizes iframe height to content

### Layout Templates

#### 1. Compact (Horizontal)
Best for short, modern signatures. Avatar + info in a single row.
```
┌──────────────────────────────────────────┐
│ [avatar]  Jane Doe | Product Lead, Acme  │
│           (she/her)                      │
│           jane@acme.com · +1 555-0100    │
│           [Li] [Gh] [Tw]  · View my card│
└──────────────────────────────────────────┘
```

#### 2. Classic (Stacked)
More traditional, works well with longer info. Avatar top-left.
```
┌──────────────────────────────────────────┐
│ [avatar]  Jane Doe                       │
│           Product Lead at Acme           │
│           she/her                        │
│           ─────────────────────          │
│           jane@acme.com · +1 555-0100    │
│           acme.com                       │
│           [Li] [Gh] [Tw]                │
│           View my card · Book a meeting  │
│                                          │
│  Confidentiality disclaimer text here... │
└──────────────────────────────────────────┘
```

#### 3. Minimal (Text-only)
No images. Maximum email client compatibility.
```
┌──────────────────────────────────────────┐
│ Jane Doe · Product Lead at Acme (she/her)│
│ jane@acme.com · +1 555-0100 · acme.com  │
│ LinkedIn · GitHub · Twitter              │
│ View my card · Book a meeting            │
└──────────────────────────────────────────┘
```

### Email HTML Constraints

The generated HTML must follow these rules for cross-client compatibility:

- **Table-based layout** — Outlook uses Word's rendering engine, no flexbox/grid
- **All CSS inline** — Gmail strips `<style>` tags entirely
- **Explicit image dimensions** — `width` and `height` attributes on `<img>` tags
- **Absolute URLs** for all images and links
- **Web-safe fonts** — Arial, Georgia, Verdana with fallbacks (no Google Fonts)
- **No CSS `color-mix()`** — use direct hex colors
- **No JavaScript** — obviously
- **`alt` text on images** — many clients block images by default
- **Max width ~500px** — signatures shouldn't be wider than the email body

### Clipboard Integration

```typescript
// Primary: rich HTML paste
const blob = new Blob([html], { type: 'text/html' })
await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])

// Fallback: copy raw HTML source
await navigator.clipboard.writeText(html)
```

Uses `text/html` MIME type so pasting into Gmail/Apple Mail/Outlook inserts the formatted signature directly.

### Social Icons

Social icons in email signatures are tricky — we can't use SVG (email clients don't support it) or icon fonts. Options:

1. **Hosted PNG icons** — small 20x20 PNGs served from the Kontakt instance (`/assets/social/linkedin.png`)
2. **Text labels** — just "LinkedIn · GitHub · Twitter" as styled links
3. **Unicode characters** — limited but works everywhere

**Recommendation**: Use hosted PNG icons for Compact/Classic layouts, fall back to text labels for Minimal. Ship a set of ~15 social platform icons as static assets.

## Data Flow

1. User opens Card Editor → clicks "Email Signature" section
2. `SignatureBuilder.vue` reads card data from `useCardForm()` composable
3. User selects layout, toggles fields, fills signature-specific inputs
4. `useSignatureHtml()` reactively generates HTML from current card data + options
5. `SignaturePreview.vue` renders HTML in sandboxed iframe
6. User clicks "Copy to Clipboard" → HTML goes to clipboard
7. User pastes into email client signature settings
8. Signature-specific fields save with the card on normal "Save" action

## Edge Cases & Error Handling

| Case | Handling |
|------|----------|
| No avatar uploaded | Hide avatar cell, widen info column |
| No social links | Hide social icons row |
| No phone or email | Hide that line |
| Long disclaimer (>200 chars) | Enforce max length in input |
| Card with `obfuscate: true` | Signature uses real values (it's the user's own) |
| Browser doesn't support Clipboard API | Show raw HTML in a textarea with "Select All + Copy" |
| Dark mode in email clients | Use explicit background colors; avoid transparent backgrounds |
| Image blocking in email clients | Meaningful `alt` text on avatar; Minimal layout as fallback |

## Open Questions

1. Should we ship social icons as static assets in the web app, or host them on a CDN?
2. Should the "View my card" link include UTM parameters for analytics tracking?
3. Do we need a separate admin setting to enable/disable the signature feature org-wide?
4. Should pronouns also show on the public card page, or only in signatures?
