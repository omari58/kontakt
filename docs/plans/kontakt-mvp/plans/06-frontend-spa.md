# Phase 6: Frontend SPA

> **For Claude:** Use `/implement docs/plans/kontakt-mvp/` to execute this plan.

**Covers:** REQ-017, REQ-018, REQ-019, REQ-020

**Goal:** Build the Vue 3 SPA for authenticated users: dashboard, card editor with live preview, admin settings page, and admin card overview.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vue Router, Tailwind CSS

---

## Task 1: Auth Integration and API Client

**Context:**
The SPA needs to handle authentication state, redirect unauthenticated users to OIDC login, and provide a typed API client for all backend calls.

**Files:**
- Create: `apps/web/src/composables/useAuth.ts`
- Create: `apps/web/src/composables/useApi.ts`
- Create: `apps/web/src/stores/auth.ts`
- Create: `apps/web/src/types/index.ts`
- Modify: `apps/web/src/router/index.ts` (add auth navigation guard)

**Requirements:**
- `useAuth()` composable:
  - `user` ref with current user (from `GET /api/me`)
  - `isAuthenticated` computed
  - `isAdmin` computed
  - `login()` — redirects to `/api/auth/login`
  - `logout()` — calls `POST /api/auth/logout` and redirects
  - `fetchUser()` — loads user profile, returns null on 401
- `useApi()` composable:
  - Thin wrapper around `fetch` with base URL and error handling
  - Automatically includes credentials (cookies)
  - Typed methods: `get<T>`, `post<T>`, `put<T>`, `del<T>`
  - Handles 401 by redirecting to login
- Auth Pinia store caches user state across components
- Router navigation guard: check auth on protected routes, redirect to login if needed
- TypeScript types matching backend DTOs: `User`, `Card`, `Setting`, etc.

**Test cases to cover:**
- Unauthenticated user redirected to login
- Authenticated user data loaded on app init
- API client handles 401 gracefully
- Admin routes blocked for non-admin users

**Acceptance criteria:**
- [ ] Auth flow works end-to-end with OIDC
- [ ] API client properly typed
- [ ] Navigation guards enforce access control

---

## Task 2: Dashboard View

**Context:**
The dashboard is the landing page for authenticated users. It shows their cards as a grid/list with quick stats and action buttons.

**Files:**
- Create: `apps/web/src/views/DashboardView.vue`
- Create: `apps/web/src/components/CardListItem.vue`
- Create: `apps/web/src/stores/cards.ts`
- Create: `apps/web/src/composables/useCards.ts`
- Modify: `apps/web/src/router/index.ts` (add dashboard route)

**Requirements:**
- Fetches user's cards from `GET /api/me/cards` on mount
- Displays cards in a responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
- Each card shows: name, job title, company, avatar thumbnail, slug URL
- Action buttons per card: Edit, Preview (opens `/c/:slug` in new tab), Share (copy link), Delete
- Delete shows confirmation dialog
- "Create New Card" button navigates to card editor with empty form
- Empty state when user has no cards yet
- Loading skeleton while fetching
- Cards Pinia store manages card list state

**Test cases to cover:**
- Dashboard loads and displays cards
- Empty state shown when no cards
- Delete confirmation prevents accidental deletion
- Create button navigates to editor

**Acceptance criteria:**
- [ ] Dashboard displays user's cards
- [ ] CRUD actions work from dashboard
- [ ] Responsive layout

---

## Task 3: Card Editor View

**Context:**
The card editor is a form where users create and edit cards. It includes all contact fields, social links, image uploads, and styling options with a live preview panel.

**Files:**
- Create: `apps/web/src/views/CardEditorView.vue`
- Create: `apps/web/src/components/editor/ContactFields.vue`
- Create: `apps/web/src/components/editor/SocialLinksEditor.vue`
- Create: `apps/web/src/components/editor/ImageUploader.vue`
- Create: `apps/web/src/components/editor/StyleSettings.vue`
- Create: `apps/web/src/components/editor/CardPreview.vue`
- Create: `apps/web/src/composables/useCardForm.ts`
- Modify: `apps/web/src/router/index.ts` (add editor routes)

**Requirements:**
- Route: `/cards/new` (create) and `/cards/:id/edit` (edit)
- Two-panel layout: form on left, live preview on right (stacked on mobile)
- Form sections (collapsible):
  1. **Basic Info:** name, job title, company, bio
  2. **Contact:** phone numbers (dynamic list), email addresses (dynamic list), address fields
  3. **Web & Social:** websites (dynamic list), social links (platform selector + URL)
  4. **Images:** avatar, banner, background (drag-and-drop + click upload)
  5. **Appearance:** primary color (color picker), background color, theme mode, avatar shape
  6. **Settings:** slug (auto-generated, editable), visibility, no-index toggle
- Dynamic lists: add/remove items for phones, emails, websites, social links
- Social link platform dropdown: LinkedIn, Twitter/X, GitHub, Instagram, Facebook, WhatsApp, Telegram, YouTube, TikTok, custom
- Image upload: preview thumbnail after upload, remove button
- Live preview updates in real-time as form values change
- Save button calls `POST /api/cards` (create) or `PUT /api/cards/:id` (update)
- Validation feedback on form fields
- Unsaved changes warning on navigation away

**Test cases to cover:**
- Create new card with minimal fields
- Edit existing card pre-fills form
- Dynamic list add/remove works
- Image upload shows preview
- Live preview reflects form changes
- Unsaved changes warning triggers on navigation

**Acceptance criteria:**
- [ ] Full card editor with all fields
- [ ] Live preview works
- [ ] Create and edit modes work
- [ ] Image upload works

---

## Task 4: Admin Settings Page

**Context:**
Admin users manage instance settings: organization branding, default colors, theme, and feature toggles.

**Files:**
- Create: `apps/web/src/views/AdminSettingsView.vue`
- Create: `apps/web/src/components/admin/BrandingSection.vue`
- Create: `apps/web/src/components/admin/ThemeDefaultsSection.vue`
- Create: `apps/web/src/components/admin/FeatureTogglesSection.vue`
- Create: `apps/web/src/stores/settings.ts`
- Modify: `apps/web/src/router/index.ts` (add admin routes with guard)

**Requirements:**
- Route: `/admin/settings` (admin only)
- Sections:
  1. **Branding:** org name, logo upload, favicon upload
  2. **Theme Defaults:** primary color, secondary color, background color, theme mode, avatar shape
  3. **Feature Toggles:** allow user color override, allow background images, default visibility
  4. **Footer:** footer text, footer link
- Color pickers for color fields
- Logo/favicon upload with preview
- Save button sends `PUT /api/settings` with all changed values
- Success/error toast notifications
- Admin guard redirects non-admins to dashboard

**Test cases to cover:**
- Settings page loads current values
- Changes are saved and reflected
- Non-admin users redirected
- Logo upload works

**Acceptance criteria:**
- [ ] Admin settings page functional
- [ ] All setting types editable
- [ ] Access control enforced

---

## Task 5: Admin Card Overview

**Context:**
Admins can see all cards across all users for oversight.

**Files:**
- Create: `apps/web/src/views/AdminCardsView.vue`
- Create: `apps/api/src/cards/admin-cards.controller.ts`
- Modify: `apps/api/src/cards/cards.service.ts` (add findAll method)
- Modify: `apps/api/src/cards/cards.module.ts` (register admin controller)
- Modify: `apps/web/src/router/index.ts` (add admin cards route)

**Requirements:**
- Backend: `GET /api/admin/cards` — returns all cards with user info (admin only)
- Support pagination: `?page=1&limit=20`
- Support search: `?search=query` (searches name, company, email)
- Frontend: table view with columns: name, owner (user), company, slug, visibility, created date
- Clickable rows to view card details
- Search bar and pagination controls
- Admin guard on route

**Test cases to cover:**
- Admin sees all cards across users
- Pagination works
- Search filters results
- Non-admin gets 403

**Acceptance criteria:**
- [ ] Admin card list with pagination and search
- [ ] Access control enforced
- [ ] Tests pass

---

## Task 6: App Shell and Navigation

**Context:**
The SPA needs a consistent layout with navigation, user menu, and proper routing structure.

**Files:**
- Create: `apps/web/src/components/AppShell.vue`
- Create: `apps/web/src/components/AppNav.vue`
- Create: `apps/web/src/components/UserMenu.vue`
- Create: `apps/web/src/components/AppToast.vue`
- Modify: `apps/web/src/App.vue` (use AppShell)

**Requirements:**
- Sidebar/top navigation with links: Dashboard, Admin Settings (admin only), Admin Cards (admin only)
- User menu in corner: name, email, logout button
- Toast notification system for success/error messages
- Responsive: sidebar on desktop, hamburger menu on mobile
- Loading state while auth is being determined
- Redirect to dashboard after login

**Test cases to cover:**
- Navigation shows correct links based on role
- Admin links hidden for non-admin users
- Logout works
- Toast notifications display and auto-dismiss

**Acceptance criteria:**
- [ ] App shell with responsive navigation
- [ ] Role-based menu items
- [ ] Toast notification system

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Auth Integration & API Client | - | 1 |
| 2: Dashboard View | 1 | 2 |
| 3: Card Editor View | 1 | 2 |
| 4: Admin Settings Page | 1 | 2 |
| 5: Admin Card Overview | 1 | 2 |
| 6: App Shell and Navigation | 1 | 2 |

## Execution Waves

**Wave 1:** Task 1 (auth and API client — foundation for all frontend)
**Wave 2:** Tasks 2, 3, 4, 5, 6 (all views depend on auth/API, run in parallel)
