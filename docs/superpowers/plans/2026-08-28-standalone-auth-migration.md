# Standalone Authentication Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all Eazo runtime dependencies and provide standalone login, registration, session, and logout flows while preserving the existing Angel Bridge UX.

**Architecture:** Use Next.js App Router route handlers with a project-owned users table, Argon2id password hashes, and signed HttpOnly session cookies. Keep auth logic in `src/lib/auth`, expose typed client helpers through `src/lib/api`, and render auth screens at real routes with the existing tokens and i18n.

**Tech Stack:** Next.js 16, React 19, TypeScript, Bun, Drizzle ORM/PostgreSQL, Tailwind v4, lucide-react, i18next.

**Spec:** This plan implements the approved standalone-auth direction from the current conversation.

## Global Constraints

- No frontend or backend code may import `@eazo/sdk`, `@eazo/node-sdk`, or reference Eazo runtime APIs.
- Do not store plaintext passwords; use a slow password hash and HttpOnly, Secure-in-production cookies.
- All user-facing copy must exist in both `en-US` and `zh-CN` locale files.
- Components call typed helpers from `src/lib/api`; no inline raw `fetch` in pages.
- Preserve existing visual tokens, responsive behavior, and meaningful `data-el` anchors.
- Run `bun run lint` and `bun run build` before handoff.

### Task 1: Remove platform dependency and establish standalone runtime

**Files:**
- Modify: `package.json`, `src/app/layout.tsx`, `src/components/user-profile/user-sync-effect.tsx`, `src/lib/auth/index.ts`, `src/app/api/user/profile/route.ts`, `src/app/api/mcp/route.ts`, `next.config.ts`, scripts and environment documentation containing Eazo references.
- Test: `src/lib/standalone-runtime.test.ts`

- [ ] Inventory every runtime import/reference and write a failing test that asserts app source has no Eazo SDK imports or Eazo branding script.
- [ ] Replace the provider chain with the existing i18n/toaster providers only, remove the no-op Eazo sync effect, and keep layout metadata sourced from environment variables.
- [ ] Replace `requireAuth` with project session verification and update protected routes to use it.
- [ ] Remove unused Eazo dependencies/scripts/configuration and update README/env documentation.
- [ ] Run focused tests, lint, and build.
- [ ] Commit `chore: remove eazo runtime dependencies`.

### Task 2: Build database-backed authentication service

**Files:**
- Create: `src/lib/auth/password.ts`, `src/lib/auth/session.ts`, `src/lib/auth/service.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/session/route.ts`.
- Modify: `src/lib/db/schema/*`, `src/lib/db/queries/*`, `src/lib/auth/index.ts`, migrations.
- Test: `src/lib/auth/auth-service.test.ts`, `src/app/api/auth/auth-routes.test.ts`

- [ ] Write failing tests for registration validation, duplicate email rejection, password hashing, login success/failure, session retrieval, and logout cookie clearing.
- [ ] Add the minimum user/session schema and migration with unique normalized email and expiration timestamps.
- [ ] Implement Argon2id password hashing, constant-time verification, signed session token generation, cookie attributes, and typed service methods.
- [ ] Implement route handlers that parse JSON, return localized safe errors, set/clear cookies, and never trust client-supplied user ids.
- [ ] Run focused auth tests and migration checks.
- [ ] Commit `feat: add standalone authentication service`.

### Task 3: Add localized login and registration UX

**Files:**
- Create: `src/app/auth/page.tsx`, `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/components/auth/auth-shell.tsx`, `src/components/auth/auth-form.tsx`.
- Modify: `src/i18n/locales/en-US.json`, `src/i18n/locales/zh-CN.json`, shared auth navigation helpers.
- Test: `src/app/auth/auth-pages.test.tsx`

- [ ] Write failing tests for route reachability, accessible labels, validation feedback, loading states, and successful redirect.
- [ ] Implement a shared warm-white/pale-green auth shell with Life Tree visual, rounded card, safe-area spacing, and `data-el` anchors.
- [ ] Implement login and registration forms using controlled fields and typed API helpers; include password visibility, inline validation, server error, and retry states.
- [ ] Add all copy in both locale files and preserve mobile-first 44px controls.
- [ ] Run component tests and inspect at mobile and desktop widths.
- [ ] Commit `feat: add standalone login and registration screens`.

### Task 4: Integrate session state across the app

**Files:**
- Create: `src/components/auth/session-provider.tsx`, `src/lib/api/auth.ts`.
- Modify: `src/lib/api/index.ts`, app shell/navigation, protected pages, `src/app/page.tsx` where redirect handling is needed.
- Test: `src/components/auth/session-provider.test.tsx`, route integration tests.

- [ ] Write failing tests for anonymous redirect, authenticated navigation, logout, and return-to-path behavior.
- [ ] Implement a client session provider backed by `GET /api/auth/session`, typed login/register/logout helpers, and safe redirect allow-listing.
- [ ] Add login/logout affordances without changing existing page hierarchy or visual language.
- [ ] Run focused integration tests and verify all current routes remain reachable.
- [ ] Commit `feat: integrate standalone session state`.

### Task 5: Verify deployment readiness

**Files:**
- Modify: `.env.example`, `README.md`, `vercel.json` or deployment config if present.
- Test: full lint/build and route smoke checks.

- [ ] Document required `DATABASE_URL`, `AUTH_SESSION_SECRET`, and app title/description variables without exposing secrets.
- [ ] Verify production cookie behavior, migration instructions, and direct URL access for auth routes.
- [ ] Run `bun run lint` and `bun run build`; record any pre-existing failures separately from regressions.
- [ ] Commit `docs: document standalone auth deployment`.

## Self-review checklist

- The plan covers dependency removal, auth persistence, UX, session integration, localization, and deployment.
- Every task has concrete files, tests, implementation steps, and a commit boundary.
- No Eazo runtime remains in application code after Task 1.
- No task relies on an undefined helper; auth service and API helper responsibilities are explicitly named.
