# QR Code Modal

## Problem Statement

The QR button in the dashboard (`CardListItem`) currently triggers a direct PNG download with no preview, no format options, and no choice of what the QR encodes. Users have no way to:

1. **Preview** the QR before downloading
2. **Choose QR content** — link to the card page vs. a vCard download link vs. inline vCard data
3. **Brand the QR** — optionally overlay the org favicon in the center

This limits the usefulness of QR codes for sharing. A modal with these options gives users control over how their contact info is distributed.

## Solution Overview

Replace the direct-download QR button with a **modal dialog** containing:

- A live QR code preview (rendered client-side)
- A **content toggle**: Card page URL / vCard download URL / Inline vCard
- A **logo toggle**: Show/hide the org favicon in the QR center
- A **download button** to export the displayed QR as PNG

The modal is a **shared component** (`QrModal.vue`) used from both the Dashboard and the Card Editor.

### Library choice: `qr-code-styling`

Use the vanilla `qr-code-styling` package (not a Vue wrapper) — it renders into a DOM element imperatively, supports logo overlay natively via the `image` + `imageOptions` config, and has a built-in `.download()` method. ~15KB gzipped. No Vue wrapper needed; a composable or `watch` in the component handles reactivity.

The existing server-side QR endpoint (`GET /api/cards/:slug/qr`) stays unchanged for external consumers.

## Architecture

### New files

```
apps/web/src/components/QrModal.vue    — The modal component
```

### Modified files

```
apps/web/src/components/CardListItem.vue  — Emit 'qr' event instead of direct download
apps/web/src/views/DashboardView.vue      — Handle QR event, render QrModal
apps/web/src/views/CardEditorView.vue     — Add QR button in preview header, render QrModal
apps/web/src/locales/*.json               — Add i18n keys for modal labels
apps/web/package.json                     — Add qr-code-styling dependency
```

### Component: `QrModal.vue`

**Props:**
- `card: Card` — the card to generate QR for
- `visible: boolean` — controls modal visibility

**Emits:**
- `close` — when the user dismisses the modal

**Internal state:**
- `qrContent: 'card-url' | 'vcard-url' | 'vcard-inline'` — what the QR encodes
- `showLogo: boolean` — whether to overlay org favicon

**QR content values:**
| Mode | Encoded data | Notes |
|------|-------------|-------|
| `card-url` | `{APP_URL}/c/{slug}` | Default. Uses `window.location.origin` |
| `vcard-url` | `{APP_URL}/api/cards/{slug}/vcf` | Recipient's phone downloads the .vcf |
| `vcard-inline` | Raw vCard text (BEGIN:VCARD...END:VCARD) | Fetched from `/api/cards/{slug}/vcf` on selection, cached. Limited to ~2KB but works offline |

**Logo overlay:**
- Source: `settingsStore.settings.org_favicon` (already available in the settings Pinia store)
- Passed as `image` option to `qr-code-styling` with `imageOptions: { hideBackgroundDots: true, imageSize: 0.3, margin: 4 }`
- When toggled off, `image` is set to `undefined` and QR re-renders
- If no org favicon is configured, the toggle is hidden

**QR rendering flow:**
1. On mount / when props or toggles change, instantiate `new QRCodeStyling({ ... })`
2. Call `qrCode.append(containerRef)` to render into a `<div ref="qrContainer">`
3. On option change, call `qrCode.update({ data, image })` to re-render in-place
4. Download: call `qrCode.download({ name: '{slug}-qr', extension: 'png' })`

### Integration: `CardListItem.vue`

- Remove the `downloadQr()` function
- Add new emit: `qr: [card: Card]`
- QR button click emits `qr` with the full card object instead of downloading

### Integration: `DashboardView.vue`

- Add `qrCard` ref (type `Card | null`)
- Listen for `@qr="(card) => qrCard = card"` on `CardListItem`
- Render `<QrModal :card="qrCard" :visible="!!qrCard" @close="qrCard = null" />` alongside the existing delete dialog

### Integration: `CardEditorView.vue`

- Add QR icon button next to the existing "Open card" link in `.editor__preview-actions`
- Only visible when in edit mode (card already saved, has a slug)
- Add `showQrModal` ref, toggle on click
- Render `<QrModal>` with a synthetic Card object built from the form state

### Inline vCard handling

When the user selects "Inline vCard":
1. Fetch `GET /api/cards/{slug}/vcf` (same endpoint used for downloads)
2. Read response as text
3. Encode the text directly as QR data
4. Cache the result so switching back doesn't re-fetch
5. If the vCard text exceeds ~2,900 characters (QR capacity at error correction level M), show a warning that the QR may not scan reliably and suggest using the "vCard download link" mode instead

## Data Flow

```
User clicks QR button on CardListItem
  → emits 'qr' event with Card object
  → DashboardView sets qrCard = card
  → QrModal becomes visible
  → qr-code-styling renders QR into container div
  → User toggles content mode / logo
  → QrModal calls qrCode.update() → QR re-renders instantly
  → User clicks Download → qrCode.download() saves PNG
  → User clicks overlay or X → emits 'close' → qrCard = null
```

## Edge Cases & Error Handling

1. **No org favicon configured** — Hide the logo toggle entirely. QR renders without center image.
2. **Inline vCard too large** — Show inline warning text below the QR. Don't block rendering but warn that scanning may fail. Suggest switching to "vCard download link".
3. **vCard fetch fails** — Show error toast, fall back to "Card page URL" mode.
4. **Card has no slug yet** (new unsaved card in editor) — QR button is hidden/disabled.
5. **Modal accessibility** — Focus trap inside modal, close on Escape key, `aria-modal="true"`, `role="dialog"`.

## Open Questions

1. Should we offer SVG download in addition to PNG? (Could add a format toggle, low effort since qr-code-styling supports both.)
2. Should QR dot styling be customizable (rounded dots, colors matching card theme)? Deferring for now — plain black-on-white ensures best scan reliability.
