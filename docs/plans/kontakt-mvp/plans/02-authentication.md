# Phase 2: OIDC Authentication

> **For Claude:** Use `/implement docs/plans/kontakt-mvp/` to execute this plan.

**Covers:** REQ-004, REQ-005, REQ-006

**Goal:** Implement OIDC-based authentication with any compliant provider, session management via HTTP-only JWT cookies, role-based access control, and automatic user provisioning.

**Tech Stack:** NestJS, Passport, openid-client, jsonwebtoken, @nestjs/config

---

## Task 1: OIDC Strategy with Passport

**Context:**
The auth module handles the OIDC flow: redirect to provider, handle callback, exchange code for tokens, extract user info. Uses `openid-client` for OIDC discovery and Passport for integration with NestJS.

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/strategies/oidc.strategy.ts`
- Create: `apps/api/src/auth/dto/auth.dto.ts`
- Modify: `apps/api/src/app.module.ts` (import AuthModule)

**Requirements:**
- Use `openid-client` for OIDC Issuer discovery from `OIDC_ISSUER` env var
- Implement a custom Passport strategy that wraps `openid-client`
- `GET /api/auth/login` — redirects to OIDC provider's authorize endpoint
- `GET /api/auth/callback` — handles OIDC callback, exchanges code for tokens
- `POST /api/auth/logout` — clears session cookie
- `GET /api/me` — returns current user profile from JWT
- Extract `sub`, `email`, `name` from ID token claims
- Fail fast on startup if OIDC config env vars are missing

**Env vars used:**
- `OIDC_ISSUER` — provider's issuer URL (e.g., `https://auth.company.com/realms/main`)
- `OIDC_CLIENT_ID` — client ID
- `OIDC_CLIENT_SECRET` — client secret
- `OIDC_CALLBACK_URL` — callback URL (e.g., `https://kontakt.company.com/api/auth/callback`)

**Dependencies (npm):**
- `openid-client`, `passport`, `@nestjs/passport`, `passport-custom`
- `jsonwebtoken`, `@nestjs/jwt`, `cookie-parser`, `@types/cookie-parser`

**Test cases to cover:**
- Successful login redirect includes correct OIDC parameters
- Callback with valid code creates/updates user and sets cookie
- Callback with invalid code returns appropriate error
- Logout clears the session cookie
- `/api/me` returns user when authenticated, 401 when not

**Acceptance criteria:**
- [ ] Login redirects to configured OIDC provider
- [ ] Callback creates session and redirects to dashboard
- [ ] Tests pass

---

## Task 2: JWT Session Management

**Context:**
After successful OIDC callback, the backend issues its own JWT stored in an HTTP-only cookie. This JWT is used for all subsequent API requests instead of the OIDC tokens.

**Files:**
- Create: `apps/api/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/auth/decorators/current-user.decorator.ts`
- Modify: `apps/api/src/main.ts` (add cookie-parser middleware)

**Requirements:**
- JWT payload contains: `sub` (user ID), `email`, `name`, `role`
- JWT signed with `JWT_SECRET` env var, expires in 24h (configurable via `JWT_EXPIRY`)
- Stored in HTTP-only, Secure, SameSite=Lax cookie named `kontakt_session`
- `JwtAuthGuard` extracts and verifies JWT from cookie
- `@CurrentUser()` parameter decorator extracts user from request
- Token refresh: on each authenticated request, if token is >50% through its lifetime, issue a new one

**Test cases to cover:**
- Valid JWT cookie grants access
- Expired JWT returns 401
- Missing cookie returns 401
- `@CurrentUser()` returns correct user payload

**Acceptance criteria:**
- [ ] Authenticated requests with valid cookie succeed
- [ ] Unauthenticated requests return 401
- [ ] Tests pass

---

## Task 3: Role-Based Access Control

**Context:**
Admins are identified by a configurable claim in the OIDC token. The backend maps this to the `ADMIN` role in the database. An `@Roles()` decorator and guard protect admin-only routes.

**Files:**
- Create: `apps/api/src/auth/guards/roles.guard.ts`
- Create: `apps/api/src/auth/decorators/roles.decorator.ts`
- Modify: `apps/api/src/auth/auth.service.ts` (add role extraction logic)

**Requirements:**
- `OIDC_ADMIN_CLAIM` env var specifies the dot-path in the ID token to check (e.g., `realm_access.roles`)
- `OIDC_ADMIN_CLAIM_VALUE` env var specifies the value that indicates admin (e.g., `kontakt-admin`)
- Role extraction supports nested claims using dot notation
- `@Roles('ADMIN')` decorator marks routes as admin-only
- `RolesGuard` checks the user's role from the JWT payload
- If claim is missing or doesn't match, user gets `USER` role (not an error)

**Test cases to cover:**
- User with matching admin claim gets ADMIN role
- User without admin claim gets USER role
- Admin route rejects USER role with 403
- Admin route accepts ADMIN role
- Nested claim paths (e.g., `realm_access.roles`) resolve correctly

**Acceptance criteria:**
- [ ] Admin claim extraction works with nested paths
- [ ] Role guard correctly restricts admin routes
- [ ] Tests pass

---

## Task 4: User Auto-Provisioning

**Context:**
Users are created or updated in the database on each login. The OIDC callback provides the claims needed to populate the User model.

**Files:**
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/users/users.service.ts`
- Modify: `apps/api/src/auth/auth.service.ts` (call UsersService on callback)
- Modify: `apps/api/src/app.module.ts` (import UsersModule)

**Requirements:**
- `UsersService.upsertFromOidc(claims)` creates or updates a User
- Upsert matches on `oidcSub` (the OIDC `sub` claim)
- On create: sets email, name, role from claims
- On update: refreshes email and name if changed, updates role
- Returns the User record (used to build the JWT payload)

**Test cases to cover:**
- First login creates new user with correct fields
- Subsequent login updates email/name if changed
- Role is updated on each login based on current OIDC claims
- `oidcSub` uniqueness constraint is enforced

**Acceptance criteria:**
- [ ] New users are created on first OIDC login
- [ ] Existing users are updated on subsequent logins
- [ ] Tests pass

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: OIDC Strategy | - | 1 |
| 2: JWT Session Management | 1 | 2 |
| 3: Role-Based Access Control | 1 | 2 |
| 4: User Auto-Provisioning | 1 | 2 |

## Execution Waves

**Wave 1:** Task 1 (OIDC strategy — the foundation)
**Wave 2:** Tasks 2, 3, 4 (JWT sessions, RBAC, user provisioning — all depend on Task 1, run in parallel)
