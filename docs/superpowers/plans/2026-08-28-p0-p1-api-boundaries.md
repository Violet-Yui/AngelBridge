# P0/P1 API Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route homepage, message-list, growth-log, and settings data through `tsqApi`, including stable loading, empty, error, retry, and settings-save states.

**Architecture:** Business contracts live in `src/lib/tsq/types.ts`, the UX-stage implementation lives in `src/lib/tsq/mock-api.ts`, and pages consume only `tsqApi` from `src/lib/tsq/api.ts`. Existing product UI is preserved while direct imports of `ME`, `HOME_MATCHES`, `HOME_TODOS`, and `CONVERSATIONS` are removed from the four updated flows.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun test, Tailwind CSS v4, i18next.

**Spec:** `docs/superpowers/specs/2026-08-28-p0-p1-api-boundaries-design.md`

## Global Constraints

- Keep the approved product hierarchy, navigation, images, fonts, and token-backed styling intact.
- Product pages call `tsqApi`; they do not import static mock records directly.
- New visible copy is present in both `src/i18n/locales/zh-CN.json` and `src/i18n/locales/en-US.json`.
- Settings drafts survive a failed save and duplicate saves are disabled.
- No real database, authentication, or `/api/tsq/*` server implementation is added in this iteration.
- Run `bun test`, `bun run lint`, and `bun run build` before completion.

---

### Task 1: Define and implement the P0 API contracts

**Files:**
- Modify: `src/lib/tsq/types.ts`
- Modify: `src/lib/tsq/mock-api.ts`
- Modify: `src/lib/tsq/api.ts`
- Test: `src/lib/tsq/api.test.ts`

**Interfaces:**
- Consumes: `ME`, `HOME_MATCHES`, `HOME_TODOS`, and `CONVERSATIONS` from `src/lib/tsq/data.ts` inside the mock adapter only.
- Produces: `HomeOverview`, `getHome(): Promise<HomeOverview>`, and `getMessageList(): Promise<Conversation[]>`.

- [ ] **Step 1: Write failing tests for homepage aggregation and message-list retrieval**

```ts
import { getHome, getMessageList } from "./api";

test("home overview returns profile, matches, and pending todos", async () => {
  const home = await getHome();
  expect(home.profile.name).toBe("林一叶");
  expect(home.matches.length).toBeGreaterThan(0);
  expect(home.todos.every((todo) => todo.id.length > 0)).toBe(true);
});

test("message list returns addressable conversations", async () => {
  const conversations = await getMessageList();
  expect(conversations.length).toBeGreaterThan(0);
  expect(conversations.every((thread) => thread.id && thread.name)).toBe(true);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `bun test src/lib/tsq/api.test.ts`

Expected: FAIL because `getHome` and `getMessageList` are not exported.

- [ ] **Step 3: Add the contracts and minimal mock implementations**

```ts
// src/lib/tsq/types.ts
export type HomeOverview = {
  profile: UserProfile;
  matches: Match[];
  todos: Todo[];
};

// src/lib/tsq/mock-api.ts
export async function getHome(): Promise<HomeOverview> {
  return {
    profile: {
      id: "me",
      name: ME.name,
      handle: ME.handle,
      stage: ME.stage,
      growth: ME.growth,
      growthDelta: ME.growthDelta,
      level: ME.level,
      luck: ME.luck,
      mood: ME.mood,
    },
    matches: HOME_MATCHES,
    todos: HOME_TODOS,
  };
}

export async function getMessageList(): Promise<Conversation[]> {
  return CONVERSATIONS;
}
```

Re-export both functions and add them to `tsqApi` in `src/lib/tsq/api.ts`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `bun test src/lib/tsq/api.test.ts`

Expected: PASS, including the two new tests.

- [ ] **Step 5: Commit the P0 contracts**

```bash
git add src/lib/tsq/types.ts src/lib/tsq/mock-api.ts src/lib/tsq/api.ts src/lib/tsq/api.test.ts
git commit -m "Add homepage and message list API contracts"
```

### Task 2: Connect the homepage to `getHome()`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/tsq/life-tree-hero.tsx`
- Modify: `src/components/tsq/home-sections.tsx`
- Create: `src/app/tsq-api-boundaries.test.ts`

**Interfaces:**
- Consumes: `tsqApi.getHome(): Promise<HomeOverview>` from Task 1.
- Produces: a homepage with `loading`, `error`, and loaded states, and child components driven entirely by props.

- [ ] **Step 1: Write a failing source-boundary test for the homepage**

```ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("homepage reads its product data through tsqApi", () => {
  const page = readFileSync("src/app/page.tsx", "utf8");
  const hero = readFileSync("src/components/tsq/life-tree-hero.tsx", "utf8");
  const sections = readFileSync("src/components/tsq/home-sections.tsx", "utf8");
  expect(page).toContain("tsqApi.getHome");
  expect(`${hero}\n${sections}`).not.toContain('@/lib/tsq/data');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `bun test src/app/tsq-api-boundaries.test.ts`

Expected: FAIL because the current homepage does not call `tsqApi.getHome` and its child components still import `@/lib/tsq/data`.

- [ ] **Step 3: Fetch once in the route and pass data by props**

```tsx
// src/app/page.tsx
"use client";

const [home, setHome] = useState<HomeOverview>();
const [error, setError] = useState<string>();

const loadHome = useCallback(() => {
  setError(undefined);
  tsqApi.getHome().then(setHome).catch((cause) => setError(cause.message));
}, []);
```

Render stable skeleton blocks while `home` is undefined, an inline retry button when `error` is set, and then:

```tsx
<LifeTreeHero profile={home.profile} />
<HomeSections matches={home.matches} initialTodos={home.todos} />
```

Change `LifeTreeHero` to accept `profile: UserProfile`. Change `HomeSections` to accept `matches: Match[]` and `initialTodos: Todo[]`. Remove direct `ME`, `HOME_MATCHES`, and `HOME_TODOS` imports from those components.

- [ ] **Step 4: Verify the homepage contract and lint**

Run: `bun test src/app/tsq-api-boundaries.test.ts && bun run lint`

Expected: PASS with no direct homepage mock imports.

- [ ] **Step 5: Commit the homepage integration**

```bash
git add src/app/page.tsx src/components/tsq/life-tree-hero.tsx src/components/tsq/home-sections.tsx src/app/tsq-api-boundaries.test.ts
git commit -m "Load homepage through TSQ API"
```

### Task 3: Connect the message list to `getMessageList()`

**Files:**
- Modify: `src/app/messages/page.tsx`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`
- Test: `src/app/tsq-api-boundaries.test.ts`

**Interfaces:**
- Consumes: `tsqApi.getMessageList(): Promise<Conversation[]>` from Task 1.
- Produces: loaded, empty, and error/retry message-list states without changing existing conversation navigation.

- [ ] **Step 1: Write a failing source-boundary test for the message list**

```ts
test("message list reads conversations through tsqApi", () => {
  const page = readFileSync("src/app/messages/page.tsx", "utf8");
  expect(page).toContain("tsqApi.getMessageList");
  expect(page).not.toContain("CONVERSATIONS");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `bun test src/app/tsq-api-boundaries.test.ts`

Expected: FAIL because `/messages` still imports and reads `CONVERSATIONS` directly.

- [ ] **Step 3: Make the page load conversations through the API**

```tsx
const [conversations, setConversations] = useState<Conversation[]>();
const [error, setError] = useState<string>();

const loadMessages = useCallback(() => {
  setError(undefined);
  tsqApi.getMessageList().then(setConversations).catch((cause) => setError(cause.message));
}, []);
```

Keep the existing AI, friend, and stranger grouping after data is loaded. Remove the `CONVERSATIONS` import.

- [ ] **Step 4: Add explicit skeleton, empty, and retry states**

```tsx
{!conversations && !error && <div data-el="messages-loading" className="mx-4 mt-3 h-28 animate-pulse rounded-[20px] bg-white/70" />}
{error && <button data-el="messages-retry" onClick={loadMessages}>{t("tsq.messages.retry")}</button>}
{conversations?.length === 0 && <p data-el="messages-empty">{t("tsq.messages.empty")}</p>}
```

- [ ] **Step 5: Add bilingual copy**

```json
// zh-CN
"empty": "还没有消息，去发现值得认识的人吧",
"retry": "重新加载"

// en-US
"empty": "No messages yet. Discover someone worth meeting.",
"retry": "Try again"
```

- [ ] **Step 6: Verify the page and full test suite**

Run: `bun test && bun run lint`

Expected: PASS; `/messages` contains no direct `CONVERSATIONS` import.

- [ ] **Step 7: Commit the message-list integration**

```bash
git add src/app/messages/page.tsx src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json src/app/tsq-api-boundaries.test.ts
git commit -m "Load message list through TSQ API"
```

### Task 4: Add the growth-log API and connect `/growth`

**Files:**
- Modify: `src/lib/tsq/types.ts`
- Modify: `src/lib/tsq/mock-api.ts`
- Modify: `src/lib/tsq/api.ts`
- Modify: `src/lib/tsq/api.test.ts`
- Modify: `src/app/growth/page.tsx`
- Test: `src/app/tsq-api-boundaries.test.ts`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`

**Interfaces:**
- Consumes: existing `ME.growthLog` inside the mock adapter only.
- Produces: `GrowthLogOverview` and `getGrowthLog(): Promise<GrowthLogOverview>`.

- [ ] **Step 1: Write a failing growth-log contract test**

```ts
import { getGrowthLog } from "./api";

test("growth log returns level progress and addressable entries", async () => {
  const result = await getGrowthLog();
  expect(result.nextLevelGrowth).toBeGreaterThan(result.growth);
  expect(result.entries.every((entry) => entry.title && entry.date)).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `bun test src/lib/tsq/api.test.ts`

Expected: FAIL because `getGrowthLog` is not exported.

- [ ] **Step 3: Add the type and adapter**

```ts
export type GrowthLogOverview = {
  growth: number;
  level: number;
  nextLevelGrowth: number;
  stage: string;
  entries: Array<{ title: string; date: string; delta: number }>;
};

export async function getGrowthLog(): Promise<GrowthLogOverview> {
  return {
    growth: ME.growth,
    level: ME.level,
    nextLevelGrowth: 1500,
    stage: ME.stage,
    entries: ME.growthLog,
  };
}
```

Re-export `getGrowthLog` and add it to `tsqApi`.

- [ ] **Step 4: Write and run a failing growth-page boundary test**

```ts
test("growth page reads its timeline through tsqApi", () => {
  const page = readFileSync("src/app/growth/page.tsx", "utf8");
  expect(page).toContain("tsqApi.getGrowthLog");
  expect(page).not.toContain('@/lib/tsq/data');
});
```

Run: `bun test src/app/tsq-api-boundaries.test.ts`

Expected: FAIL because `/growth` still imports `ME` directly.

- [ ] **Step 5: Convert `/growth` to API-driven states**

Use `useEffect` and `useCallback` to load the overview. Replace `ME.level`, `ME.growth`, and `ME.growthLog` with response fields. Compute progress width as `(growth / nextLevelGrowth) * 100`, capped at `100`. Show a skeleton while loading, a retry action on error, and the localized empty message when `entries.length === 0`.

- [ ] **Step 6: Add bilingual growth state copy**

```json
// zh-CN tsq.growth
"empty": "还没有成长记录，完成一次连接后会出现在这里",
"retry": "重新加载"

// en-US tsq.growth
"empty": "No growth activity yet. Complete a connection to begin.",
"retry": "Try again"
```

- [ ] **Step 7: Verify and commit**

Run: `bun test src/lib/tsq/api.test.ts && bun run lint`

```bash
git add src/lib/tsq/types.ts src/lib/tsq/mock-api.ts src/lib/tsq/api.ts src/lib/tsq/api.test.ts src/app/growth/page.tsx src/app/tsq-api-boundaries.test.ts src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "Add growth log API flow"
```

### Task 5: Add settings mutation and save UX

**Files:**
- Modify: `src/lib/tsq/types.ts`
- Modify: `src/lib/tsq/mock-api.ts`
- Modify: `src/lib/tsq/api.ts`
- Modify: `src/lib/tsq/api.test.ts`
- Modify: `src/app/settings/page.tsx`
- Test: `src/app/tsq-api-boundaries.test.ts`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`

**Interfaces:**
- Consumes: existing `Settings` and `getSettings()`.
- Produces: `UpdateSettingsPayload` and `updateSettings(payload): Promise<Settings>` plus settings loading, dirty, saving, success, and failure states.

- [ ] **Step 1: Write failing mutation tests**

```ts
import { getSettings, updateSettings } from "./api";

test("settings update returns and retains the saved values", async () => {
  const saved = await updateSettings({ notifications: false, publicProfile: false, language: "en-US" });
  expect(saved).toEqual({ notifications: false, publicProfile: false, language: "en-US" });
  expect(await getSettings()).toEqual(saved);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `bun test src/lib/tsq/api.test.ts`

Expected: FAIL because `updateSettings` is not exported.

- [ ] **Step 3: Implement mock-session persistence**

```ts
export type UpdateSettingsPayload = Settings;

let currentSettings: Settings = {
  notifications: true,
  publicProfile: true,
  language: "zh-CN",
};

export async function getSettings(): Promise<Settings> {
  return { ...currentSettings };
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<Settings> {
  currentSettings = { ...payload };
  return { ...currentSettings };
}
```

Re-export `updateSettings` and add it to `tsqApi`.

- [ ] **Step 4: Write and run a failing settings-page mutation test**

```ts
test("settings page saves through tsqApi", () => {
  const page = readFileSync("src/app/settings/page.tsx", "utf8");
  expect(page).toContain("tsqApi.updateSettings");
  expect(page).toContain('aria-pressed');
});
```

Run: `bun test src/app/tsq-api-boundaries.test.ts`

Expected: FAIL because `/settings` does not yet call `updateSettings` and its rows are not interactive controls.

- [ ] **Step 5: Make controls editable and save through `tsqApi`**

Use buttons with `aria-pressed` for notifications and public-profile toggles. Use a native `<select>` for `language`. Track `saving`, `saved`, and `error`. On save, disable the button, call `tsqApi.updateSettings(settings)`, keep the returned settings, and show localized success or retryable failure feedback without resetting the draft.

- [ ] **Step 6: Add bilingual settings copy**

```json
// zh-CN tsq.settings
"save": "保存设置",
"saving": "正在保存…",
"saved": "设置已保存",
"saveFailed": "保存失败，请重试",
"retry": "重试"

// en-US tsq.settings
"save": "Save settings",
"saving": "Saving…",
"saved": "Settings saved",
"saveFailed": "Could not save settings. Try again.",
"retry": "Retry"
```

- [ ] **Step 7: Verify and commit**

Run: `bun test src/lib/tsq/api.test.ts && bun run lint`

```bash
git add src/lib/tsq/types.ts src/lib/tsq/mock-api.ts src/lib/tsq/api.ts src/lib/tsq/api.test.ts src/app/settings/page.tsx src/app/tsq-api-boundaries.test.ts src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "Add settings save API flow"
```

### Task 6: Full verification and local flow check

**Files:**
- Verify: `src/app/page.tsx`
- Verify: `src/app/messages/page.tsx`
- Verify: `src/app/growth/page.tsx`
- Verify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: all P0/P1 contracts and page integrations from Tasks 1–5.
- Produces: a buildable P0/P1 frontend ready for a later HTTP adapter.

- [ ] **Step 1: Confirm direct mock imports are gone from the four flows**

Run:

```bash
rg -n 'from "@/lib/tsq/data"' src/app/page.tsx src/components/tsq/life-tree-hero.tsx src/components/tsq/home-sections.tsx src/app/messages/page.tsx src/app/growth/page.tsx src/app/settings/page.tsx
```

Expected: no matches.

- [ ] **Step 2: Run the complete automated verification**

Run: `bun test && bun run lint && bun run build`

Expected: all tests pass, lint exits 0, and Next.js lists `/`, `/messages`, `/growth`, and `/settings` in the successful build output.

- [ ] **Step 3: Verify local routes in the browser**

Open and inspect:

```text
http://localhost:3002/
http://localhost:3002/messages
http://localhost:3002/growth
http://localhost:3002/settings
```

Confirm the homepage and message list load, growth progress renders, settings toggles change, and save feedback appears.

- [ ] **Step 4: Commit final verification fixes only if needed**

```bash
git add src
git commit -m "Finish P0 P1 API integrations"
```
