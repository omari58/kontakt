# Frontend Views & Integration

> **For Claude:** Use `/implement docs/plans/email-footer/` to execute this plan.

**Covers:** REQ-003, REQ-004, REQ-007, REQ-008, REQ-009, REQ-010, REQ-013, REQ-014

**Goal:** Build the signatures list view, editor view, all UI components, navigation integration, and clipboard copy.

**Tech Stack:** Vue 3, Pinia, Vue Router, vue-i18n, Vitest

---

## Task 1: Signatures Store and Composable

**Context:**
Create the Pinia store and composable for signature CRUD operations, following the cards store/composable pattern.

**Files:**
- Create: `apps/web/src/stores/signatures.ts`
- Create: `apps/web/src/composables/useSignatures.ts`
- Test: `apps/web/src/composables/useSignatures.test.ts`

**Reference:** Study `apps/web/src/stores/cards.ts` and `apps/web/src/composables/useCards.ts` — mirror this pattern exactly.

**Requirements:**

### Store (`signatures.ts`)
- State: `signatures` ref (Signature[]), `loading` ref, `error` ref
- `fetchMySignatures()`: GET `/api/me/signatures`, populate state
- `deleteSignature(id)`: DELETE `/api/me/signatures/{id}`, remove from local array
- Use `useApi()` for HTTP calls
- Error handling: catch and set `error` ref with i18n message

### Composable (`useSignatures.ts`)
- Wrapper that returns `storeToRefs(store)` + store methods
- Expose: `signatures`, `loading`, `error`, `fetchMySignatures`, `deleteSignature`

**Test cases to cover:**
- `fetchMySignatures` populates signatures ref
- `fetchMySignatures` sets error on failure
- `deleteSignature` removes item from local array
- Loading state toggles correctly

**Acceptance criteria:**
- [ ] Store follows cards store pattern
- [ ] Composable wraps store with storeToRefs
- [ ] Tests pass

---

## Task 2: Add i18n Keys

**Context:**
Add all English translation keys needed for the signatures feature.

**Files:**
- Modify: `apps/web/src/locales/en.json`

**Reference:** Look at the `editor` and `dashboard` sections for key naming conventions.

**Requirements:**

Add a `signatures` namespace with keys for:
```
signatures.title = "Signatures"
signatures.createNew = "Create Signature"
signatures.empty.title = "No signatures yet"
signatures.empty.description = "Create an email signature from one of your cards."
signatures.noCards.title = "Create a card first"
signatures.noCards.description = "You need at least one card to create a signature."
signatures.editor.title = "Edit Signature"
signatures.editor.newTitle = "New Signature"
signatures.editor.name = "Signature name"
signatures.editor.namePlaceholder = "e.g., Work formal"
signatures.editor.selectCard = "Select a card"
signatures.editor.layout = "Layout"
signatures.editor.layouts.compact = "Compact"
signatures.editor.layouts.classic = "Classic"
signatures.editor.layouts.minimal = "Minimal"
signatures.editor.fields = "Visible fields"
signatures.editor.fields.phone = "Phone number"
signatures.editor.fields.email = "Email address"
signatures.editor.fields.website = "Website"
signatures.editor.fields.socials = "Social links"
signatures.editor.fields.pronouns = "Pronouns"
signatures.editor.fields.calendar = "Booking link"
signatures.editor.fields.disclaimer = "Disclaimer"
signatures.editor.fields.cardLink = "Link to digital card"
signatures.editor.disclaimer = "Disclaimer text"
signatures.editor.disclaimerPlaceholder = "Confidentiality notice..."
signatures.editor.accentColor = "Accent color"
signatures.editor.preview = "Preview"
signatures.editor.copyHtml = "Copy to Clipboard"
signatures.editor.copied = "Copied!"
signatures.editor.copyFallback = "Copy the HTML below and paste into your email client."
signatures.delete.confirm = "Delete this signature?"
signatures.delete.message = "This cannot be undone."
```

Also add to `nav` namespace:
```
nav.signatures = "Signatures"
```

**Test cases to cover:**
- N/A (static data)

**Acceptance criteria:**
- [ ] All keys present in en.json
- [ ] Key structure follows existing conventions

---

## Task 3: Router and Navigation

**Context:**
Add signature routes and the nav item so users can access the feature.

**Files:**
- Modify: `apps/web/src/router/index.ts`
- Modify: `apps/web/src/components/AppNav.vue`

**Reference:** Look at how card routes and nav items are structured.

**Requirements:**

### Router
- `/signatures` → `SignaturesView.vue` (lazy loaded), meta: `{ requiresAuth: true }`
- `/signatures/new` → `SignatureEditorView.vue` (lazy loaded), meta: `{ requiresAuth: true }`
- `/signatures/:id` → `SignatureEditorView.vue` (lazy loaded), meta: `{ requiresAuth: true }`
- Route names: `signatures`, `signature-new`, `signature-edit`

### Navigation
- Add "Signatures" link between Dashboard and admin routes
- Icon: `FileSignature` from lucide-vue-next (or `PenLine` if unavailable)
- Links to `/signatures`
- Visible to all authenticated users (not admin-only)
- Uses `$t('nav.signatures')` for label

**Test cases to cover:**
- N/A (integration, verified by manual navigation)

**Acceptance criteria:**
- [ ] All three routes resolve
- [ ] Nav item visible for all users
- [ ] Nav item uses i18n key and icon

---

## Task 4: SignatureCard Component

**Context:**
List item component shown on the signatures list page. Displays a signature's name, layout, and linked card info with edit/delete actions.

**Files:**
- Create: `apps/web/src/components/signatures/SignatureCard.vue`

**Reference:** Look at `apps/web/src/components/CardListItem.vue` for the list item pattern with action buttons.

**Requirements:**
- Props: `signature: Signature`
- Emits: `edit(id)`, `delete(id)`
- Display: signature name, layout label (e.g., "Classic"), linked card name
- Show small card avatar thumbnail if available
- Edit button (pencil icon) and delete button (trash icon)
- BEM CSS: `signature-card`, `signature-card__name`, `signature-card__layout`, etc.

**Test cases to cover:**
- N/A (thin UI component)

**Acceptance criteria:**
- [ ] Renders signature info
- [ ] Emits correct events on button click

---

## Task 5: SignatureLayoutPicker Component

**Context:**
Visual layout selector letting users choose between Compact, Classic, and Minimal. Shows a schematic preview of each layout.

**Files:**
- Create: `apps/web/src/components/signatures/SignatureLayoutPicker.vue`

**Reference:** N/A — this is a new pattern, but keep styling consistent with existing form inputs.

**Requirements:**
- Props: `modelValue: SignatureLayout`
- Emits: `update:modelValue(layout)` (v-model compatible)
- Three selectable cards in a row, each showing:
  - Layout name (from i18n)
  - Simple ASCII/box representation or icon suggesting the layout structure
- Active card highlighted with accent border
- Responsive: stack vertically on narrow screens

**Test cases to cover:**
- N/A (visual component)

**Acceptance criteria:**
- [ ] v-model binding works
- [ ] Active layout visually highlighted
- [ ] All three layouts selectable

---

## Task 6: SignatureFieldToggles Component

**Context:**
Checkbox group for toggling which card fields appear in the signature.

**Files:**
- Create: `apps/web/src/components/signatures/SignatureFieldToggles.vue`

**Reference:** Look at checkbox patterns in existing editor components.

**Requirements:**
- Props: `modelValue: SignatureFieldToggles`, `card: Card` (to check which fields the card actually has data for)
- Emits: `update:modelValue`
- Render a checkbox for each toggle field (phone, email, website, socials, pronouns, calendar, disclaimer, cardLink)
- Disable checkbox if the card doesn't have data for that field (e.g., no phone → phone toggle disabled)
- Labels from i18n: `$t('signatures.editor.fields.phone')`, etc.

**Test cases to cover:**
- N/A (thin UI component)

**Acceptance criteria:**
- [ ] All field toggles render
- [ ] Disabled when card lacks data
- [ ] v-model binding works

---

## Task 7: SignaturePreview Component

**Context:**
Renders the generated HTML signature in a sandboxed iframe for live preview. The iframe ensures email-style rendering without inheriting app styles.

**Files:**
- Create: `apps/web/src/components/signatures/SignaturePreview.vue`

**Reference:** N/A — new pattern.

**Requirements:**
- Props: `html: string`
- Render an `<iframe>` with `sandbox` attribute (no scripts)
- Write HTML content into iframe using `srcdoc` attribute or `contentDocument.write()`
- Wrap in styled container with "Preview" label (from i18n)
- Auto-resize iframe height to content height
- Light background to simulate email client appearance

**Test cases to cover:**
- N/A (visual rendering component)

**Acceptance criteria:**
- [ ] HTML renders in isolated iframe
- [ ] No scripts execute (sandboxed)
- [ ] Updates when html prop changes

---

## Task 8: SignaturesView (List Page)

**Context:**
The main signatures page showing all user signatures with create/edit/delete actions, plus empty state handling.

**Files:**
- Create: `apps/web/src/views/SignaturesView.vue`

**Reference:** Study `apps/web/src/views/DashboardView.vue` for the three-state pattern (loading, empty, content) and delete confirmation.

**Requirements:**
- Fetch signatures on mount via `useSignatures().fetchMySignatures()`
- Also fetch cards via `useCards().fetchMyCards()` (needed to check if user has cards)
- Three states:
  1. **Loading**: skeleton placeholders (like dashboard)
  2. **No cards**: "Create a card first" message with link to card creation
  3. **Empty (has cards, no signatures)**: "No signatures yet" + "Create Signature" button
  4. **Content**: grid of `SignatureCard` components
- "Create Signature" button in header (navigates to `/signatures/new`)
- Delete confirmation modal (same pattern as dashboard)
- On delete: call `deleteSignature(id)` and show success toast

**Test cases to cover:**
- N/A (integration view, test composables separately)

**Acceptance criteria:**
- [ ] Lists signatures in grid
- [ ] Empty state shown when no signatures
- [ ] No-cards state shown when user has no cards
- [ ] Delete with confirmation works

---

## Task 9: SignatureEditorView (Editor Page)

**Context:**
The signature editor for creating and editing signatures. Combines card selection, layout picker, field toggles, config inputs, live preview, and clipboard copy.

**Files:**
- Create: `apps/web/src/views/SignatureEditorView.vue`

**Reference:** Study `apps/web/src/views/CardEditorView.vue` for the editor view pattern with save/loading states.

**Requirements:**

### Mode Detection
- If route has `:id` param → edit mode: fetch signature by ID, populate form
- If route is `/signatures/new` → create mode: blank form
- Use `useApi()` for create/update calls directly (no form composable needed — simpler than card editor)

### Form Fields
- **Name**: text input (required)
- **Card picker**: dropdown of user's cards (fetch from `useCards`), required on create, disabled on edit
- **Layout**: `SignatureLayoutPicker` component
- **Field toggles**: `SignatureFieldToggles` component (enabled when card is selected)
- **Disclaimer**: textarea (shown when disclaimer toggle is on), max 200 chars
- **Accent color**: color input (hex), default from card's primaryColor

### Live Preview
- `useSignatureHtml(card, config, layout)` generates HTML reactively
- `SignaturePreview` component renders it
- Preview updates on every config change

### Actions
- **Save**: POST or PATCH to `/api/me/signatures` / `/api/me/signatures/:id`
- **Copy to Clipboard**: call clipboard API with generated HTML
  - Primary: `navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])`
  - Fallback: show textarea with raw HTML and "Select All + Copy" instruction
  - Success: toast "Copied!"
- **Back**: navigate to `/signatures`

### Layout
- Two-column on desktop: form on left, preview on right
- Stacked on mobile: form above, preview below

**Test cases to cover:**
- N/A (integration view, test composable and components separately)

**Acceptance criteria:**
- [ ] Create mode saves new signature and redirects to edit
- [ ] Edit mode loads existing signature
- [ ] Preview updates reactively
- [ ] Copy to clipboard works
- [ ] Clipboard fallback shown when API unavailable
- [ ] Form validation prevents save without name or card

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Store + composable | - | 1 |
| 2: i18n keys | - | 1 |
| 3: Router + nav | 2 | 2 |
| 4: SignatureCard component | 2 | 2 |
| 5: SignatureLayoutPicker | 2 | 2 |
| 6: SignatureFieldToggles | 2 | 2 |
| 7: SignaturePreview | - | 1 |
| 8: SignaturesView (list) | 1, 3, 4 | 3 |
| 9: SignatureEditorView | 1, 3, 5, 6, 7 | 3 |

## Execution Waves

**Wave 1:** Tasks 1, 2, 7 (independent: store, i18n, preview component)
**Wave 2:** Tasks 3, 4, 5, 6 (depend on i18n keys, run in parallel)
**Wave 3:** Tasks 8, 9 (views assemble everything, run in parallel)
