# Email Signature Generator

## Problem Statement

Kontakt users have rich digital business cards with contact details, social links, and branding — but they can't leverage that data in daily email communications. Email signatures are the most-viewed piece of personal branding (sent dozens of times daily), yet most people use plain text or poorly formatted signatures.

By generating professional HTML email signatures directly from existing card data, we make the card platform more valuable and give users a reason to keep their card data up-to-date — every signature links back to the full digital card.

## Solution Overview

A **standalone "Signatures" feature** — a first-class section in the main navigation alongside Dashboard. Signatures are separate entities that reference a Card and render from its live data.

Key characteristics:

1. **Standalone route** (`/signatures`) in the main nav with list + editor views
2. **One-to-many**: a Card can have multiple signatures (e.g., formal, casual, mobile-friendly)
3. **Live data**: signatures render from the card's current data — update the card, re-copy the signature
4. **3 layout templates**: Compact (horizontal), Classic (stacked), Minimal (text-only)
5. **Signature-specific config**: layout, disclaimer, field visibility toggles, custom accent color
6. **Client-side HTML generation**: the composable builds the HTML in the browser, no server-side rendering needed
7. **Copy to clipboard**: one-click copy of email-client-compatible HTML

Identity fields (`pronouns`, `calendarUrl`) live on the Card model since they're contact/identity data useful beyond signatures (on the public card page too).

## Architecture

### Data Model

**New fields on `Card` model:**

| Field         | Type      | Default | Notes                                        |
| ------------- | --------- | ------- | -------------------------------------------- |
| `pronouns`    | `String?` | `null`  | Free text: "he/him", "she/her", etc.         |
| `calendarUrl` | `String?` | `null`  | Booking link (Calendly, Cal.com, etc.)       |

**New `Signature` model:**

```prisma
model Signature {
  id        String   @id @default(cuid())
  name      String   // User-given name: "Work formal", "Personal casual"
  cardId    String
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  layout    SignatureLayout @default(CLASSIC)
  config    Json            @default("{}")
  // config stores: { fields: { phone, email, website, socials, pronouns,
  //   calendar, disclaimer, cardLink }, disclaimer: "...", accentColor: "#..." }

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([cardId])
}

enum SignatureLayout {
  COMPACT
  CLASSIC
  MINIMAL
}
```

The `config` JSON field stores all presentation settings — field visibility toggles, disclaimer text, accent color override. This keeps the schema stable as signature options evolve.

**Relationship**: `Card` 1→N `Signature`. Deleting a card cascades to its signatures.

### API

New `signatures` NestJS module following existing patterns:

```
apps/api/src/signatures/
├── signatures.module.ts
├── signatures.controller.ts    # CRUD endpoints
├── signatures.service.ts       # Business logic
└── dto/
    ├── create-signature.dto.ts
    ├── update-signature.dto.ts
    └── signature-response.dto.ts
```

**Endpoints** (all require `JwtAuthGuard`):

| Method   | Route                  | Description                       |
| -------- | ---------------------- | --------------------------------- |
| `GET`    | `/api/me/signatures`   | List current user's signatures    |
| `POST`   | `/api/me/signatures`   | Create signature (requires cardId)|
| `GET`    | `/api/me/signatures/:id` | Get signature detail            |
| `PATCH`  | `/api/me/signatures/:id` | Update signature config         |
| `DELETE` | `/api/me/signatures/:id` | Delete signature                |

Follows the existing `/api/me/cards` pattern for user-scoped resources.

### Frontend

```
apps/web/src/
├── views/
│   ├── SignaturesView.vue          # List page: all user's signatures
│   └── SignatureEditorView.vue     # Editor: card picker, layout, config, preview, copy
├── components/
│   └── signatures/
│       ├── SignatureCard.vue        # List item card (name, layout badge, linked card, actions)
│       ├── SignatureLayoutPicker.vue # Visual layout selector (3 options)
│       ├── SignatureFieldToggles.vue # Checkboxes for which fields to show
│       └── SignaturePreview.vue     # Sandboxed iframe rendering the HTML
├── composables/
│   ├── useSignatures.ts            # CRUD composable for signatures (like useCards)
│   └── useSignatureHtml.ts         # Generates HTML string from card data + signature config
├── stores/
│   └── signatures.ts               # Pinia store (optional, if needed for caching)
└── types/
    └── index.ts                    # Add Signature, SignatureConfig interfaces
```

**Router additions:**
- `/signatures` → `SignaturesView.vue`
- `/signatures/new` → `SignatureEditorView.vue` (create mode)
- `/signatures/:id` → `SignatureEditorView.vue` (edit mode)

**Nav addition:** "Signatures" item in `AppNav.vue` between Dashboard and any admin routes.

### Composables

**`useSignatures()`** — CRUD wrapper (mirrors `useCards`):
- `signatures` ref, `fetchSignatures()`, `createSignature()`, `updateSignature()`, `deleteSignature()`
- Uses `useApi()` composable for fetch calls

**`useSignatureHtml(card, signatureConfig)`**:
- Input: card data (reactive) + signature config (layout, field toggles, disclaimer, accent color)
- Output: computed HTML string
- Builds table-based HTML with fully inline CSS
- Uses accent color (from config, falling back to card's `primaryColor`)
- Web-safe font stacks (no Google Fonts in email)
- All image URLs are absolute (`{APP_URL}{avatarPath}`)

### Layout Templates

#### 1. Compact (Horizontal)

Best for short, modern signatures. Avatar + info in a single row.

```text
┌──────────────────────────────────────────┐
│ [avatar]  Jane Doe | Product Lead, Acme  │
│           (she/her)                      │
│           jane@acme.com · +1 555-0100    │
│           [Li] [Gh] [Tw]  · View my card│
└──────────────────────────────────────────┘
```

#### 2. Classic (Stacked)

More traditional, works well with longer info. Avatar top-left.

```text
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

```text
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

1. User navigates to `/signatures` → sees list of existing signatures (or empty state with "Create Signature" CTA)
2. User clicks "New Signature" → `SignatureEditorView` opens
3. User picks a card from a dropdown (their cards are fetched)
4. Card data loads → editor shows layout picker, field toggles, config inputs
5. `useSignatureHtml()` reactively generates HTML from card data + current config
6. `SignaturePreview.vue` renders HTML in sandboxed iframe (live updates)
7. User names the signature (e.g., "Work formal") and saves → `POST /api/me/signatures`
8. User clicks "Copy to Clipboard" → HTML goes to clipboard with success toast
9. User pastes into email client signature settings
10. Later: user updates their card → opens signature → preview reflects new card data → re-copies

## Edge Cases & Error Handling

| Case                              | Handling                                                       |
| --------------------------------- | -------------------------------------------------------------- |
| No avatar uploaded on card        | Hide avatar cell, widen info column                            |
| No social links on card           | Hide social icons row                                          |
| No phone or email on card         | Hide that line                                                 |
| Long disclaimer (>200 chars)      | Enforce max length in input                                    |
| Card with `obfuscate: true`       | Signature uses real values (it's the user's own)               |
| Browser doesn't support Clipboard | Show raw HTML in a textarea with "Select All + Copy"           |
| Dark mode in email clients        | Use explicit background colors; avoid transparent backgrounds  |
| Image blocking in email clients   | Meaningful `alt` text on avatar; Minimal layout as fallback    |
| Referenced card is deleted        | Cascade delete removes signatures; no orphans                  |
| User has no cards yet             | "Create a card first" prompt on signatures page                |

## Open Questions

1. Should we ship social icons as static assets in the web app, or host them on a CDN?
2. Should the "View my card" link include UTM parameters for analytics tracking?
3. Do we need a separate admin setting to enable/disable the signature feature org-wide?
4. Should pronouns also show on the public card page, or only in signatures?
