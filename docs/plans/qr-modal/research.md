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

<!-- Subagents append learnings below this line -->
