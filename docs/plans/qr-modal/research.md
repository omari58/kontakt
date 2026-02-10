# QR Code Modal - Research Log

## Initial Findings

- [2026-02-10]: Current QR flow is a direct PNG download in `CardListItem.vue:48-57` — no modal, no preview
- [2026-02-10]: Server-side QR generation uses `qrcode` npm package in `apps/api/src/cards/qr.service.ts` — supports PNG and SVG, no logo overlay
- [2026-02-10]: API endpoint `GET /api/cards/:slug/qr?format=png&size=500` is public, cached for 24h
- [2026-02-10]: vCard download exists at `GET /api/cards/:slug/vcf` — returns `text/vcard` content type, can be read as text for inline QR encoding
- [2026-02-10]: Org favicon stored in settings as `org_favicon`, accessible via `useSettingsStore().settings.org_favicon`
- [2026-02-10]: Existing modal pattern in `DashboardView.vue:86-100` — Vue `<Transition>` with overlay + dialog, reusable CSS classes

## Library Evaluation

- [2026-02-10]: `qr-code-styling` (npm) — vanilla JS, ~15KB gzipped, native logo overlay via `image` option, `.download()` built-in, canvas and SVG output. Best fit for this use case.
- [2026-02-10]: `qrcode-vue3` — Vue 3 component wrapper, also supports logo overlay. Adds Vue-specific abstraction we don't need since we can use `qr-code-styling` directly with a ref.
- [2026-02-10]: Chose `qr-code-styling` (vanilla) over Vue wrappers because: (a) thinner dependency, (b) imperative API gives us fine control over `.update()` for reactive option changes, (c) no wrapper maintenance risk.

## Architecture Decisions

- [2026-02-10]: Client-side QR generation chosen over server-side for modal because: instant re-renders on toggle changes, native logo overlay support, no new API endpoints needed. Server endpoint stays for external use.
- [2026-02-10]: QrModal is a shared component (not per-view) to avoid duplication between Dashboard and Card Editor.
- [2026-02-10]: Inline vCard fetches from existing `/api/cards/:slug/vcf` endpoint and reads response as text — no new API endpoint needed.

## Codebase Patterns (Planning Phase)

- [2026-02-10]: `CardListItem.vue` emits `edit` and `delete` events — adding `qr` event follows same pattern. `downloadQr()` at line 48 is the function to remove.
- [2026-02-10]: `DashboardView.vue` uses `<Transition name="modal">` with overlay/dialog pattern (lines 87-100) — QrModal should follow the same transition pattern.
- [2026-02-10]: `CardEditorView.vue` has `.editor__preview-actions` div (line 352) with an existing `ExternalLink` icon button — QR button goes next to it, gated on `cardViewUrl` (card has slug).
- [2026-02-10]: `useApi` composable provides `get<T>(url)` with `credentials: 'include'` — use this for fetching vCard text in the inline mode.
- [2026-02-10]: `settingsStore.settings.org_favicon` gives the favicon path (string | null) — check this to conditionally show the logo toggle.
- [2026-02-10]: Card type has `slug: string` and `id: string` — QR modal needs the slug for URL construction and the vCard fetch endpoint.
- [2026-02-10]: i18n keys follow nested structure (e.g., `editor.basicInfo.title`). New keys should go under a `qrModal` top-level key.
- [2026-02-10]: 5 locale files (en, fr, de, es, et) need updating. Only en gets real translations; others get English placeholders for the implementer.

<!-- Subagents append learnings below this line -->

## Implementation Learnings

- [2026-02-10]: Task 1 — `qr-code-styling@^1.9.2` installed cleanly, only transitive dep is `qrcode-generator@1.5.2`
- [2026-02-10]: Task 3 — Used raw `fetch` instead of `useApi` for vCard endpoint because `useApi.get()` parses JSON but the vCard endpoint returns `text/vcard` plain text. Still included `credentials: 'include'`.
- [2026-02-10]: Task 3 — [Deviation: Rule 1] Used `removeChild` loop instead of `innerHTML = ''` for clearing QR container to satisfy security hook
- [2026-02-10]: Task 3 — [Deviation: Rule 2] Added close button (X icon) in modal header — spec didn't include one but modal needed a visible close affordance
- [2026-02-10]: Task 3 — Used `<fieldset>` + `<legend>` for radio group (semantic HTML for content mode selector)
- [2026-02-10]: Task 5 — `as Card` cast on partial object is acceptable since QrModal only reads `card.slug`. If QrModal ever accesses other Card fields, this would need updating.
- [2026-02-10]: Pre-existing test failure in `useCardForm.test.ts:108` (addWebsite/removeWebsite) — unrelated to QR modal work
