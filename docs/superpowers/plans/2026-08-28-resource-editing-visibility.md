# Resource Editing and Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete UX-only resource editing flow with typed save boundaries, owner-list synchronization, per-resource visibility, and a filtered other-user profile preview.

**Architecture:** Extend the existing `tsqApi` boundary with owner-resource, update-resource, and public-profile helpers backed by one in-memory mock resource collection. Route pages consume only typed helpers: the owner edits at a dedicated route, `/me` refreshes from the same source, and `/profile/[userId]` renders only the filtered resources returned by the adapter.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Bun test, happy-dom, i18next, Zustand, lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-28-resource-editing-visibility-design.md`

## Global Constraints

- Scope is UX/UI plus typed frontend API contracts and an in-memory mock adapter; do not add a database, real authentication, or backend authorization.
- Components and pages call helpers from `@/lib/tsq/api`; they do not call raw `fetch` or endpoint strings.
- Visibility values are exactly `public`, `matches`, and `private`; a future backend must enforce them server-side.
- All new product copy must exist in both `src/i18n/locales/zh-CN.json` and `src/i18n/locales/en-US.json` and render through `useTranslation()`.
- Preserve existing `AppShell`, navigation, resource tones, mobile touch targets, safe-area behavior, and stable `data-el` anchors.
- Preserve unrelated dirty-worktree changes; stage and commit only files listed in the active task.
- Follow TDD for each behavior: write a focused failing test, observe the expected failure, implement minimally, and rerun the focused test.
- Before handoff, run `bun test`, `bun run lint`, and `bun run build`.

---

### Task 1: Typed resource contracts and persistent mock adapter

**Files:**
- Modify: `src/lib/tsq/types.ts`
- Modify: `src/lib/tsq/mock-api.ts`
- Modify: `src/lib/tsq/api.ts`
- Test: `src/lib/tsq/resource-api.test.ts`

**Interfaces:**
- Consumes: existing `ResourceKind`, `ME.resources`, `TsqApiError`.
- Produces: `ResourceVisibility`, `ResourceDetail.updatedAt`, `UpdateResourcePayload`, `PublicProfile`, `getOwnerResources()`, `updateResource(id, payload)`, and `getPublicProfile(userId)`.

- [ ] **Step 1: Write failing resource API tests**

Create `src/lib/tsq/resource-api.test.ts` with isolated assertions for owner reads, update persistence, validation, missing ids, and public filtering:

```ts
import { beforeEach, expect, test } from "bun:test";
import {
  getOwnerResources,
  getPublicProfile,
  resetResourceMockState,
  updateResource,
} from "./mock-api";

beforeEach(() => resetResourceMockState());

test("updates a resource and returns the saved canonical record", async () => {
  const saved = await updateResource("resource-0", {
    label: "健康习惯",
    value: "早睡 · 每周跑步",
    kind: "green",
    description: "可以分享作息规划与跑步经验。",
    visibility: "public",
  });

  expect(saved).toMatchObject({
    id: "resource-0",
    label: "健康习惯",
    value: "早睡 · 每周跑步",
    visibility: "public",
  });
  expect(saved.updatedAt.length).toBeGreaterThan(0);

  const resources = await getOwnerResources();
  expect(resources.find((item) => item.id === "resource-0")?.label).toBe("健康习惯");
});

test("rejects an update when a required field is blank", async () => {
  expect(updateResource("resource-0", {
    label: " ",
    value: "早睡",
    kind: "green",
    description: "说明",
    visibility: "public",
  })).rejects.toMatchObject({ code: "VALIDATION" });
});

test("rejects an update for an unknown resource", async () => {
  expect(updateResource("resource-missing", {
    label: "资源",
    value: "摘要",
    kind: "warm",
    description: "说明",
    visibility: "private",
  })).rejects.toMatchObject({ code: "NOT_FOUND" });
});

test("public profile excludes matched-only and private resources", async () => {
  await updateResource("resource-0", {
    label: "公开资源",
    value: "所有人可见",
    kind: "green",
    description: "公开说明",
    visibility: "public",
  });
  await updateResource("resource-1", {
    label: "匹配资源",
    value: "匹配对象可见",
    kind: "warm",
    description: "匹配说明",
    visibility: "matches",
  });
  await updateResource("resource-2", {
    label: "私人资源",
    value: "仅自己可见",
    kind: "purple",
    description: "私人说明",
    visibility: "private",
  });

  const profile = await getPublicProfile("user-yiye");
  expect(profile.resources.map((item) => item.id)).toContain("resource-0");
  expect(profile.resources.map((item) => item.id)).not.toContain("resource-1");
  expect(profile.resources.map((item) => item.id)).not.toContain("resource-2");
});
```

- [ ] **Step 2: Run the tests and verify the intended failures**

Run: `bun test src/lib/tsq/resource-api.test.ts`

Expected: FAIL because the new types and helpers are not exported.

- [ ] **Step 3: Add exact resource and public-profile types**

In `src/lib/tsq/types.ts`, replace the inline visibility union and add:

```ts
export type ResourceVisibility = "public" | "matches" | "private";

export type ResourceDetail = {
  id: string;
  label: string;
  value: string;
  kind: ResourceKind;
  description: string;
  visibility: ResourceVisibility;
  updatedAt: string;
};

export type UpdateResourcePayload = Omit<ResourceDetail, "id" | "updatedAt">;

export type PublicProfile = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  resources: ResourceDetail[];
};
```

- [ ] **Step 4: Implement one mutable mock source of truth**

In `src/lib/tsq/mock-api.ts`, initialize module state from `ME.resources`, return clones, trim fields, and keep the test reset helper out of the public `tsqApi` object:

```ts
const initialResourceState = (): ResourceDetail[] => ME.resources.map((item, index) => ({
  id: `resource-${index}`,
  ...item,
  description: `${item.label}是你可以持续分享与交换的资源。`,
  visibility: index === 0 ? "public" : "matches",
  updatedAt: "刚刚",
}));

let resourceState = initialResourceState();

export function resetResourceMockState(): void {
  resourceState = initialResourceState();
}

export async function getOwnerResources(): Promise<ResourceDetail[]> {
  return resourceState.map((item) => ({ ...item }));
}

export async function updateResource(id: string, payload: UpdateResourcePayload): Promise<ResourceDetail> {
  const index = resourceState.findIndex((item) => item.id === id);
  if (index < 0) throw new TsqApiError("NOT_FOUND", "没有找到这项资源");
  const label = payload.label.trim();
  const value = payload.value.trim();
  const description = payload.description.trim();
  if (!label || !value || !description) {
    throw new TsqApiError("VALIDATION", "请完整填写资源信息");
  }
  resourceState[index] = {
    id,
    label,
    value,
    description,
    kind: payload.kind,
    visibility: payload.visibility,
    updatedAt: "刚刚",
  };
  return { ...resourceState[index] };
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  if (userId !== "user-yiye") throw new TsqApiError("NOT_FOUND", "没有找到这个用户");
  return {
    id: userId,
    name: ME.name,
    handle: ME.handle,
    bio: "喜欢用设计连接人与资源。",
    resources: resourceState.filter((item) => item.visibility === "public").map((item) => ({ ...item })),
  };
}
```

Update `getResourceDetail()` to read `resourceState`, then export `getOwnerResources`, `updateResource`, and `getPublicProfile` through `src/lib/tsq/api.ts` and `tsqApi`.

- [ ] **Step 5: Run the focused API tests**

Run: `bun test src/lib/tsq/resource-api.test.ts`

Expected: PASS with all resource contract tests green.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/lib/tsq/types.ts src/lib/tsq/mock-api.ts src/lib/tsq/api.ts src/lib/tsq/resource-api.test.ts
git commit -m "feat: add resource editing API boundary"
```

---

### Task 2: Localized resource detail with edit and visibility actions

**Files:**
- Modify: `src/app/me/resources/[id]/page.tsx`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`
- Test: `src/app/me/resources/resource-detail.test.tsx`

**Interfaces:**
- Consumes: `tsqApi.getResourceDetail(id)`, `ResourceVisibility`.
- Produces: reachable edit navigation at `/me/resources/[id]/edit`, retryable load UX, and localized visibility presentation.

- [ ] **Step 1: Write a failing detail-page behavior test**

Use happy-dom and React `createRoot` following `src/components/i18n/locale-sync-effect.test.tsx`. Mock only `next/navigation` params resolution and the typed API response. Render the real page and assert:

```ts
expect(container.querySelector('[data-el="resource-edit-entry"]')?.getAttribute("href"))
  .toBe("/me/resources/resource-0/edit");
expect(container.querySelector('[data-el="resource-visibility"]')?.textContent)
  .toContain("所有用户可见");
```

Add a second test in which the first `getResourceDetail` call rejects and retry succeeds; click the localized retry button and assert the resource content appears.

- [ ] **Step 2: Run the detail-page test and verify failure**

Run: `bun test src/app/me/resources/resource-detail.test.tsx`

Expected: FAIL because the edit link, visibility row, and retry action do not exist.

- [ ] **Step 3: Rebuild the detail route around explicit states**

Refactor `src/app/me/resources/[id]/page.tsx` into readable loading, error, and loaded branches. Add:

```tsx
<Link
  data-el="resource-edit-entry"
  href={`/me/resources/${item.id}/edit`}
  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[color:var(--soft)] px-3 text-sm font-semibold text-[color:var(--deep)]"
>
  <Pencil className="h-4 w-4" />
  {t("tsq.resources.detail.edit")}
</Link>
```

Render `data-el="resource-visibility"` with `Eye`, `Users`, or `Lock` according to `item.visibility`. Add a retry button that reuses one `loadResource()` callback. Keep the page under the 300-line page split signal.

- [ ] **Step 4: Add bilingual detail and visibility copy**

Add the same key structure to both locale files:

```json
{
  "tsq": {
    "resources": {
      "detail": {
        "title": "资源详情",
        "edit": "修改",
        "description": "资源说明",
        "visibility": "谁可以看见",
        "retry": "重新加载"
      },
      "visibility": {
        "public": { "label": "所有用户可见", "description": "其他用户进入你的主页时可以看见" },
        "matches": { "label": "仅匹配对象可见", "description": "仅匹配成功或已建立桥约的人可以看见" },
        "private": { "label": "仅自己可见", "description": "不会展示给其他用户" }
      }
    }
  }
}
```

Use natural English equivalents in `en-US.json`, preserving the existing JSON hierarchy rather than replacing adjacent keys.

- [ ] **Step 5: Run focused tests and lint the changed page**

Run: `bun test src/app/me/resources/resource-detail.test.tsx && bunx eslint "src/app/me/resources/[id]/page.tsx"`

Expected: PASS with no lint errors.

- [ ] **Step 6: Commit Task 2**

```bash
git add "src/app/me/resources/[id]/page.tsx" src/app/me/resources/resource-detail.test.tsx src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "feat: add editable resource detail UX"
```

---

### Task 3: Dedicated resource edit form and save-state UX

**Files:**
- Create: `src/app/me/resources/[id]/edit/page.tsx`
- Create: `src/components/tsq/resource-edit-form.tsx`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`
- Test: `src/components/tsq/resource-edit-form.test.tsx`
- Test: `src/app/tsq-api-boundaries.test.ts`

**Interfaces:**
- Consumes: `ResourceDetail`, `UpdateResourcePayload`, `tsqApi.getResourceDetail`, `tsqApi.updateResource`.
- Produces: `ResourceEditForm` with `initialResource` and `onSave`, plus the real `/me/resources/[id]/edit` route.

- [ ] **Step 1: Write failing form behavior tests**

Render the real `ResourceEditForm` in happy-dom with an `onSave` spy that returns a saved record. Test initial values, required validation, payload normalization, disabled saving state, and retained inputs after rejection. The successful payload assertion must be literal:

```ts
expect(receivedPayload).toEqual({
  label: "健康习惯",
  value: "早睡 · 每周跑步",
  description: "可以分享作息规划与跑步经验。",
  kind: "green",
  visibility: "public",
});
```

Use labels rather than implementation-specific selectors for input interaction. Assert that the save button is disabled while the returned promise is unresolved.

- [ ] **Step 2: Run the form tests and verify failure**

Run: `bun test src/components/tsq/resource-edit-form.test.tsx`

Expected: FAIL because `ResourceEditForm` does not exist.

- [ ] **Step 3: Implement the controlled edit form**

Create a focused component with this public API:

```ts
type ResourceEditFormProps = {
  initialResource: ResourceDetail;
  onSave: (payload: UpdateResourcePayload) => Promise<ResourceDetail>;
  onSaved: (resource: ResourceDetail) => void;
};

export function ResourceEditForm({ initialResource, onSave, onSaved }: ResourceEditFormProps) {
  // controlled label, value, description, kind, visibility
}
```

The component must:

- use `<label>` plus input/textarea associations;
- render three keyboard-operable tone choices;
- render three radio-style visibility choices with localized descriptions;
- validate trimmed required fields before calling `onSave`;
- set `aria-busy` and disable the save action during submission;
- render a `role="alert"` error summary and preserve inputs after rejection;
- call `onSaved(savedResource)` only after the promise resolves.

- [ ] **Step 4: Implement the route save and navigation flow**

The route loads `params`, calls `tsqApi.getResourceDetail`, and passes this save adapter:

```ts
async function saveResource(payload: UpdateResourcePayload) {
  return tsqApi.updateResource(resourceId, payload);
}
```

On success, use the canonical saved record for navigation:

```ts
router.replace(`/me/resources/${saved.id}`);
```

Do not introduce Eazo SDK, analytics, or platform-memory dependencies into this detached frontend.

- [ ] **Step 5: Add localized form copy**

Add bilingual keys for title, name, summary, description, tone, visibility, save, saving, success, required error, and save failure. Chinese examples:

```json
{
  "edit": {
    "title": "修改资源",
    "name": "资源名称",
    "summary": "简要内容",
    "description": "详细说明",
    "tone": "资源类型",
    "visibility": "可见范围",
    "save": "保存修改",
    "saving": "正在保存…",
    "required": "请完整填写资源信息",
    "saveError": "暂时无法保存，请稍后重试"
  }
}
```

- [ ] **Step 6: Add a route-boundary assertion**

Extend `src/app/tsq-api-boundaries.test.ts` so it imports the edit page source and verifies that it refers to `tsqApi.getResourceDetail` and `tsqApi.updateResource`, and does not contain raw `fetch(`. This is an architectural boundary test consistent with the existing file; form behavior remains covered by the real component test.

- [ ] **Step 7: Run focused tests**

Run: `bun test src/components/tsq/resource-edit-form.test.tsx src/app/tsq-api-boundaries.test.ts`

Expected: PASS with no warnings from unwrapped React updates.

- [ ] **Step 8: Commit Task 3**

```bash
git add "src/app/me/resources/[id]/edit/page.tsx" src/components/tsq/resource-edit-form.tsx src/components/tsq/resource-edit-form.test.tsx src/app/tsq-api-boundaries.test.ts src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "feat: add resource edit and save flow"
```

---

### Task 4: Synchronize the owner resource list with saved data

**Files:**
- Modify: `src/app/me/page.tsx`
- Create: `src/components/tsq/resource-list-state.tsx`
- Test: `src/components/tsq/resource-list-state.test.tsx`
- Test: `src/app/tsq-api-boundaries.test.ts`

**Interfaces:**
- Consumes: `tsqApi.getOwnerResources()` and `ResourceDetail[]`.
- Produces: `ResourceListState` with stable loading, error/retry, empty, and loaded UI used by `/me`.

- [ ] **Step 1: Write failing resource-list behavior tests**

Test the real `ResourceListState` with injected `loadResources: () => Promise<ResourceDetail[]>`:

- unresolved promise shows six stable chip skeletons inside `data-el="me-resources-list"`;
- rejection shows localized retry action;
- retry resolution renders updated label and value;
- empty resolution shows the resource-specific empty message;
- loaded items link by stable `item.id`, not array index.

The link assertion is:

```ts
expect(container.querySelector('[data-el="me-resource-item"]')?.getAttribute("href"))
  .toBe("/me/resources/resource-0");
```

- [ ] **Step 2: Run the list tests and verify failure**

Run: `bun test src/components/tsq/resource-list-state.test.tsx`

Expected: FAIL because the stateful resource list component does not exist.

- [ ] **Step 3: Implement the reusable owner-list state**

Create `ResourceListState` with an injected loader for testability and a default `loadResources={tsqApi.getOwnerResources}` at the page boundary. Preserve the existing `KIND_TAG` styles, wrap layout, card radius, and spacing. Use stable `data-el` values:

- `me-resources-list`
- `me-resource-item`
- `me-resources-retry`
- `me-resources-empty`

- [ ] **Step 4: Replace immutable `ME.resources` usage on `/me`**

In `src/app/me/page.tsx`, keep the section heading and replace only the existing resource-card body with:

```tsx
<ResourceListState loadResources={tsqApi.getOwnerResources} />
```

Do not alter pets, needs, growth, profile header, or current settings work.

- [ ] **Step 5: Add the API-boundary assertion and run tests**

Extend `src/app/tsq-api-boundaries.test.ts` to verify `/me` uses `tsqApi.getOwnerResources` and no raw `fetch(`. Then run:

`bun test src/components/tsq/resource-list-state.test.tsx src/app/tsq-api-boundaries.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/app/me/page.tsx src/components/tsq/resource-list-state.tsx src/components/tsq/resource-list-state.test.tsx src/app/tsq-api-boundaries.test.ts
git commit -m "feat: sync profile resources after edits"
```

---

### Task 5: Other-user profile resource visibility UX

**Files:**
- Create: `src/app/profile/[userId]/page.tsx`
- Create: `src/components/tsq/public-resource-list.tsx`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`
- Test: `src/components/tsq/public-resource-list.test.tsx`
- Test: `src/app/tsq-api-boundaries.test.ts`

**Interfaces:**
- Consumes: `tsqApi.getPublicProfile(userId)` and `PublicProfile.resources` already filtered by the API.
- Produces: real `/profile/[userId]` route and a read-only public resource section with no edit controls.

- [ ] **Step 1: Write failing public-resource component tests**

Render `PublicResourceList` with a literal `ResourceDetail[]` fixture and assert:

- each returned resource is visible;
- no edit button or edit URL is rendered;
- an empty array renders localized neutral empty copy;
- the component does not render any message that reveals hidden/private resources.

```ts
expect(container.textContent).toContain("公开资源");
expect(container.querySelector('[data-el="resource-edit-entry"]')).toBeNull();
expect(container.querySelector('a[href*="/edit"]')).toBeNull();
```

- [ ] **Step 2: Run the component test and verify failure**

Run: `bun test src/components/tsq/public-resource-list.test.tsx`

Expected: FAIL because `PublicResourceList` does not exist.

- [ ] **Step 3: Implement the read-only public resource list**

Create a presentational component that receives `resources: ResourceDetail[]`, reuses the existing green/warm/purple tones, and renders `data-el="public-profile-resources"`. It must trust the filtered response and must not receive viewer relationship or perform visibility filtering itself.

- [ ] **Step 4: Implement `/profile/[userId]` with page states**

The route resolves `params`, calls `tsqApi.getPublicProfile(userId)`, and renders:

- stable profile skeleton while loading;
- localized not-found/error state with retry;
- name, handle, bio, and `PublicResourceList` when loaded;
- a back action that works by direct URL without relying on selected client state.

Do not render owner-only settings, mutation actions, or visibility badges on the other-user view.

- [ ] **Step 5: Add bilingual public-profile copy**

Add keys for profile title, resource section title/subtitle, empty state, load failure, and retry to both locale files. Chinese empty copy: `这位用户暂时没有公开资源`.

- [ ] **Step 6: Add the route-boundary assertion and run focused tests**

Extend `src/app/tsq-api-boundaries.test.ts` to verify the page uses `tsqApi.getPublicProfile` and no raw `fetch(`. Run:

`bun test src/components/tsq/public-resource-list.test.tsx src/app/tsq-api-boundaries.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add "src/app/profile/[userId]/page.tsx" src/components/tsq/public-resource-list.tsx src/components/tsq/public-resource-list.test.tsx src/app/tsq-api-boundaries.test.ts src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "feat: show visible resources on public profiles"
```

---

### Task 6: End-to-end UX verification and handoff evidence

**Files:**
- Modify only if verification exposes a defect in files from Tasks 1–5.

**Interfaces:**
- Consumes: completed owner edit, owner list, and public profile flows.
- Produces: fresh automated and browser evidence that the resource workflow is ready for backend handoff.

- [ ] **Step 1: Run all automated tests**

Run: `bun test`

Expected: all tests pass with zero failures. If the known CRLF-sensitive scrollbar test fails, confirm it is unchanged from the existing baseline and do not conceal any new failures.

- [ ] **Step 2: Run lint**

Run: `bun run lint`

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Run the production build**

Run: `bun run build`

Expected: Next.js production build and TypeScript checks complete with exit code 0.

- [ ] **Step 4: Verify the owner save flow in the browser**

At `http://localhost:3002/me`:

1. Open the first resource.
2. Select “修改”.
3. Change the name and summary.
4. Select “所有用户可见”.
5. Save and verify the detail page shows the new canonical values.
6. Return to `/me` and verify the resource chip displays the updated values.
7. Confirm no horizontal overflow, framework error overlay, or console errors.

- [ ] **Step 5: Verify the other-user view**

Open `http://localhost:3002/profile/user-yiye` and verify:

- the public resource saved in Step 4 is visible;
- resources marked `matches` or `private` are absent;
- no edit controls appear;
- the empty state works after a controlled mock fixture returns no public resources.

- [ ] **Step 6: Review the backend contract checklist**

Confirm the code leaves these responsibilities to the backend handoff:

- authenticated owner scoping for updates;
- server-side relationship checks for `matches`;
- server-side filtering before public-profile responses;
- stable resource ids and canonical saved records;
- no client-supplied owner id in `UpdateResourcePayload`.

- [ ] **Step 7: Commit only verification-driven fixes**

If no files changed, do not create an empty commit. If verification required fixes:

```bash
git add <only-the-files-fixed-during-verification>
git commit -m "fix: complete resource editing verification"
```
