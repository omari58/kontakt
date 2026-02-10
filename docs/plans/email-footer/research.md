# Email Signature Generator - Research Log

## Initial Findings

- [2026-02-10]: Card model already contains all core contact data (name, title, company, phones, emails, websites, socialLinks, address, avatar). Only signature-specific fields need adding (pronouns, calendarUrl, signatureDisclaimer, signatureLayout).

- [2026-02-10]: Existing server-side rendering pattern (Handlebars + `card.hbs`) uses CSS custom properties and `color-mix()` — email signatures can't use either. Client-side generation with inline styles is the right approach.

- [2026-02-10]: Theme resolver (`theme.resolver.ts`) handles branding (primaryColor, bgColor, etc.) with org-level defaults. Signature should use `primaryColor` for accent elements but needs direct hex values, not CSS variables.

- [2026-02-10]: Card editor uses collapsible sections pattern — "Email Signature" fits naturally as a new section alongside Basic Info, Contact, Web & Social, Images, Appearance, Settings.

- [2026-02-10]: `useCardForm()` composable manages all card form state and CRUD. Signature fields will be added to the same form object and saved with the existing card save flow.

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

<!-- Subagents append learnings below this line -->
