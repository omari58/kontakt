# QR Code Modal Implementation

> **For Claude:** Use `/implement docs/plans/qr-modal/` to execute this plan.

**Covers:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008

**Goal:** Replace the direct-download QR button with a modal dialog offering live preview, content mode selection, logo overlay toggle, and PNG download.

**Tech Stack:** Vue 3 (Composition API + `<script setup>`), qr-code-styling, Pinia (settings store), vue-i18n

---

## Task 1: Add `qr-code-styling` dependency

**Context:**
The QR modal needs a client-side QR renderer that supports logo overlay and PNG download. `qr-code-styling` provides all of this out of the box.

**Files:**
- Modify: `apps/web/package.json`

**Requirements:**
- Install `qr-code-styling` as a dependency of the `web` app
- Run: `pnpm add qr-code-styling --filter web`

**Acceptance criteria:**
- [ ] Package added to `apps/web/package.json` dependencies
- [ ] `pnpm install` completes without errors

---

## Task 2: Add i18n keys for QR modal

**Context:**
The modal needs labels for its UI controls. All 5 locale files need updating. Only `en.json` needs real English text; other locales get the same English text as placeholders.

**Files:**
- Modify: `apps/web/src/locales/en.json`
- Modify: `apps/web/src/locales/fr.json`
- Modify: `apps/web/src/locales/de.json`
- Modify: `apps/web/src/locales/es.json`
- Modify: `apps/web/src/locales/et.json`

**Reference:** Look at existing key structure in `en.json` — top-level groups like `dashboard`, `editor`, `common`.

**Requirements:**
- Add a `qrModal` top-level key with these nested keys:
  - `title` — "QR Code"
  - `contentLabel` — "QR Content"
  - `cardUrl` — "Card page link"
  - `vcardUrl` — "vCard download link"
  - `vcardInline` — "Inline vCard data"
  - `showLogo` — "Show logo"
  - `download` — "Download PNG"
  - `vcardTooLarge` — "This vCard is large and may not scan reliably. Consider using \"vCard download link\" instead."
  - `vcardFetchError` — "Could not load vCard data. Switched to card page link."
- Update the `cardList.downloadQr` key value from `"Download QR"` to `"QR Code"` (since it now opens a modal, not a download)

**Acceptance criteria:**
- [ ] All 5 locale files have the `qrModal` key block
- [ ] Keys match the list above
- [ ] App builds without i18n missing-key warnings

---

## Task 3: Create `QrModal.vue` component

**Context:**
This is the core new component. It renders a modal with a live QR code preview, content mode toggle, optional logo overlay, and a download button. Uses `qr-code-styling` imperatively (not a Vue wrapper).

**Files:**
- Create: `apps/web/src/components/QrModal.vue`

**Reference:**
- Modal pattern: `DashboardView.vue:87-100` (overlay + dialog + `<Transition name="modal">`)
- Modal CSS: `DashboardView.vue:230-324` (overlay, dialog, transition classes)
- Settings store access: `CardEditorView.vue:116` (`useSettingsStore()`)
- API composable: `useApi.ts` — `api.get<T>(url)` for fetching vCard text

**Requirements:**

Props:
- `card: Card` — the card to generate QR for (uses `slug` for URLs and endpoint)
- `visible: boolean` — controls modal visibility

Emits:
- `close` — when user dismisses the modal

Internal state:
- `qrContent: 'card-url' | 'vcard-url' | 'vcard-inline'` — default `'card-url'`
- `showLogo: boolean` — default `true` (if favicon exists)
- `vcardText: string | null` — cached inline vCard data
- `vcardLoading: boolean` — loading state for vCard fetch

QR content construction:
- `card-url`: `${window.location.origin}/c/${card.slug}`
- `vcard-url`: `${window.location.origin}/api/cards/${card.slug}/vcf`
- `vcard-inline`: fetched text from `GET /api/cards/${card.slug}/vcf`

Logo overlay:
- Source: `settingsStore.settings.org_favicon`
- Pass as `image` option to qr-code-styling with `imageOptions: { hideBackgroundDots: true, imageSize: 0.3, margin: 4 }`
- When toggled off or no favicon configured, set `image` to `undefined`
- Hide the logo toggle entirely if no `org_favicon` in settings

QR rendering:
- Use a `<div ref="qrContainer">` as the render target
- On mount and when `visible` becomes true, create `QRCodeStyling` instance and call `.append()`
- On option change (content mode, logo toggle), call `qrCode.update({ data, image })`
- Use `watch` on the computed QR data and image to trigger updates
- Clear the container when modal closes to avoid stale renders

Download:
- Call `qrCode.download({ name: '${card.slug}-qr', extension: 'png' })`

Inline vCard handling:
- When `vcard-inline` is selected and `vcardText` is null, fetch from `/api/cards/${card.slug}/vcf`
- The endpoint returns `text/vcard` — read response as text (use `fetch` directly or adapt `useApi`)
- Cache the result in `vcardText` so toggling back doesn't re-fetch
- If fetch fails, show error toast and fall back to `card-url` mode
- If text length > 2900 chars, show warning text below the QR

Accessibility:
- `role="dialog"` and `aria-modal="true"` on the dialog element
- Close on Escape key (add `keydown` listener when visible)
- Close on overlay click (`.self` modifier)
- Focus trap: on open, focus the dialog; on close, no special handling needed (simple modal)

Styling:
- Follow the existing modal CSS pattern from DashboardView (overlay, dialog, transitions)
- Use scoped styles with `qr-modal__` BEM prefix
- Radio buttons or segmented control for content mode toggle
- Checkbox or toggle switch for logo toggle
- Primary-colored download button matching existing `.dashboard__create-btn` / `.editor__save-btn` style

**Test cases to cover:**
- Renders QR with card page URL by default
- Toggling content mode updates the QR data
- Logo toggle shows/hides the org favicon overlay
- Logo toggle is hidden when no org_favicon in settings
- Download button calls qrCode.download()
- Inline vCard shows warning when text exceeds 2900 chars
- Emits `close` on overlay click and Escape key

**Acceptance criteria:**
- [ ] Component renders a visible QR code when `visible` is true
- [ ] All three content modes produce correct QR data
- [ ] Logo overlay works when favicon is configured
- [ ] Download produces a PNG file
- [ ] Inline vCard is fetched and cached
- [ ] Size warning appears for large vCards
- [ ] Modal is accessible (Escape, overlay click, aria attributes)
- [ ] Follows existing BEM naming and CSS variable conventions

---

## Task 4: Wire QR modal into Dashboard

**Context:**
Replace the direct-download behavior in the dashboard. `CardListItem` needs a new `qr` emit, and `DashboardView` needs to handle it and render the modal.

**Files:**
- Modify: `apps/web/src/components/CardListItem.vue`
- Modify: `apps/web/src/views/DashboardView.vue`

**Reference:**
- Existing emit pattern: `CardListItem.vue:10-13` (edit, delete emits)
- Existing event handling: `DashboardView.vue:77-83` (`@edit`, `@delete`)
- Delete dialog pattern: `DashboardView.vue:87-100`

**Changes to CardListItem.vue:**
- Remove the `downloadQr()` function (lines 48-57)
- Add `qr: [card: Card]` to the emit definition
- Change QR button `@click` from `downloadQr` to `emit('qr', card)`

**Changes to DashboardView.vue:**
- Import `QrModal` and `Card` type
- Add `qrCard` ref of type `Card | null`, default `null`
- Listen for `@qr="(card) => qrCard = card"` on each `CardListItem`
- Render `<QrModal :card="qrCard!" :visible="!!qrCard" @close="qrCard = null" />` after the delete dialog

**Acceptance criteria:**
- [ ] QR button on dashboard cards opens the modal (not a download)
- [ ] Modal closes correctly and `qrCard` resets to null
- [ ] Delete dialog still works as before
- [ ] No TypeScript errors

---

## Task 5: Wire QR modal into Card Editor

**Context:**
Add a QR button to the card editor's preview header, next to the existing "Open card" link. Only visible when the card has been saved (has a slug).

**Files:**
- Modify: `apps/web/src/views/CardEditorView.vue`

**Reference:**
- Preview actions area: `CardEditorView.vue:352-363` (`.editor__preview-actions` div)
- Existing icon button style: `.editor__open-btn` CSS class (lines 637-652)
- Card view URL gating: `cardViewUrl` computed (line 65)

**Changes:**
- Import `QrCode` from `lucide-vue-next` and `QrModal` component
- Add `showQrModal` ref (boolean, default `false`)
- Add a QR icon button next to the ExternalLink button, using the same `.editor__open-btn` class
- Only render when `cardViewUrl` is truthy (card has a slug)
- On click, set `showQrModal = true`
- Render `<QrModal>` — but the Card Editor works with form state, not a full `Card` object. Build a minimal Card-compatible object from form state:
  ```typescript
  { slug: form.slug, id: savedCardId ?? cardId ?? '' } as Card
  ```
  The QR modal only uses `card.slug`, so this is sufficient.
- `@close="showQrModal = false"`

**Acceptance criteria:**
- [ ] QR button appears in editor preview header when card has a slug
- [ ] QR button is hidden for new unsaved cards
- [ ] QR modal opens and displays correct QR for the card
- [ ] Modal closes correctly
- [ ] No TypeScript errors

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Add qr-code-styling dependency | - | 1 |
| 2: Add i18n keys | - | 1 |
| 3: Create QrModal.vue component | 1, 2 | 2 |
| 4: Wire into Dashboard | 3 | 3 |
| 5: Wire into Card Editor | 3 | 3 |

## Execution Waves

**Wave 1:** Tasks 1, 2 (independent, run in parallel)
**Wave 2:** Task 3 (depends on dependency + i18n keys)
**Wave 3:** Tasks 4, 5 (independent integrations, run in parallel)
