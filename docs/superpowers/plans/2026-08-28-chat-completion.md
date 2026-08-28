# Chat Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Angel Bridge’s person-to-person chat, relationship controls, and report UX through typed Mock API contracts without adding a real backend.

**Architecture:** `src/lib/tsq/types.ts` owns chat safety contracts; `mock-api.ts` owns session-local relationship/report state; and `tsqApi` remains the only route-facing boundary. The chat detail page is split into focused reusable chat UI parts, while settings and report are URL-addressable routes that consume the same typed API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun test, i18next, Tailwind CSS v4, Lucide React.

**Spec:** `docs/superpowers/specs/2026-08-28-chat-completion-design.md`

## Global Constraints

- Preserve Angel Bridge’s current token-backed warm canvas, soft-green palette, imagery, typography, app navigation, and rounded layout.
- Use Lucide outline icons in 44px-or-larger labelled controls; do not use emojis as structural icons.
- Product routes call `tsqApi`; no route imports static mock data directly.
- New visible copy exists in both `src/i18n/locales/zh-CN.json` and `src/i18n/locales/en-US.json`.
- This iteration is UX-only: no real backend, database, auth work, upload, recording, location sharing, or moderation integration.
- Relationship drafts survive failed saves, reports retain selected reasons after failure, and duplicate save/submit actions are disabled.
- Run `bun test`, `bun run lint`, and `bun run build` before completion.

---

### Task 1: Add relationship and report Mock API contracts

**Files:**
- Modify: `src/lib/tsq/types.ts`
- Modify: `src/lib/tsq/mock-api.ts`
- Modify: `src/lib/tsq/api.ts`
- Modify: `src/lib/tsq/api.test.ts`

**Interfaces:**
- Consumes: `TsqApiError`, existing `getThreadMessages(threadId)`.
- Produces: `RelationshipSettings`, `UpdateRelationshipSettingsPayload`, `ReportReason`, `SubmitConversationReportPayload`, `SubmitConversationReportResult`; `getRelationshipSettings`, `updateRelationshipSettings`, and `submitConversationReport` on `tsqApi`.

- [ ] **Step 1: Write failing contract tests**

```ts
import {
  getRelationshipSettings,
  submitConversationReport,
  updateRelationshipSettings,
} from "./api";

test("relationship settings retain a saved mute preference per thread", async () => {
  const saved = await updateRelationshipSettings("c2", { muted: true, blocked: false });
  expect(saved).toEqual({ muted: true, blocked: false });
  expect(await getRelationshipSettings("c2")).toEqual(saved);
});

test("conversation report requires a reason and returns an addressable receipt", async () => {
  await expect(submitConversationReport({ threadId: "c2", reasons: [] })).rejects.toMatchObject({ code: "VALIDATION" });
  const result = await submitConversationReport({ threadId: "c2", reasons: ["fraud"], description: "信息与实际不符" });
  expect(result.reportId).toMatch(/^report-/);
  expect(result.submittedAt).toBeTruthy();
});
```

- [ ] **Step 2: Verify RED**

Run: `bun test src/lib/tsq/api.test.ts`

Expected: FAIL because the three API functions are not exported.

- [ ] **Step 3: Add minimal typed, session-local implementation**

```ts
export type RelationshipSettings = { muted: boolean; blocked: boolean };
export type UpdateRelationshipSettingsPayload = RelationshipSettings;
export type ReportReason = "harassment" | "fraud" | "unsafe" | "illegal" | "other";
export type SubmitConversationReportPayload = { threadId: string; reasons: ReportReason[]; description?: string };
export type SubmitConversationReportResult = { reportId: string; submittedAt: string };
```

In `mock-api.ts`, validate the thread with `await getThreadMessages(threadId)`. Keep relationship settings in `const relationshipByThread: Record<string, RelationshipSettings> = {}` and return copies. Reject an empty `reasons` list with `new TsqApiError("VALIDATION", "请选择至少一项投诉原因")`. Return a generated `report-` id and `"刚刚"` receipt; do not persist report contents.

- [ ] **Step 4: Verify GREEN**

Run: `bun test src/lib/tsq/api.test.ts`

Expected: PASS with the new persistence and validation tests.

- [ ] **Step 5: Commit contracts**

```bash
git add src/lib/tsq/types.ts src/lib/tsq/mock-api.ts src/lib/tsq/api.ts src/lib/tsq/api.test.ts
git commit -m "Add chat relationship and report contracts"
```

### Task 2: Rebuild the chat detail experience

**Files:**
- Modify: `src/app/messages/[threadId]/page.tsx`
- Create: `src/components/tsq/chat-composer.tsx`
- Create: `src/components/tsq/chat-message-list.tsx`
- Create: `src/app/messages/chat-routes.test.ts`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`

**Interfaces:**
- Consumes: `tsqApi.getThreadMessages(threadId)`, `tsqApi.sendMessage(threadId, { body })`, `ThreadMessages`, and `ChatMessage`.
- Produces: accessible chat header/menu, message timeline, pending/error-safe composer, and settings link.

- [ ] **Step 1: Write failing source-boundary and route tests**

```ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("chat detail keeps API access and relationship settings navigation", () => {
  const page = readFileSync("src/app/messages/[threadId]/page.tsx", "utf8");
  expect(page).toContain("tsqApi.getThreadMessages");
  expect(page).toContain('href={`/messages/${threadId}/settings`}');
  expect(page).not.toContain('@/lib/tsq/data');
});

test("chat composer has labelled attachment controls and a disabled send state", () => {
  const composer = readFileSync("src/components/tsq/chat-composer.tsx", "utf8");
  expect(composer).toContain('aria-label={t("tsq.chat.attachments")}');
  expect(composer).toContain("disabled={!canSend || sending}");
});
```

- [ ] **Step 2: Verify RED**

Run: `bun test src/app/messages/chat-routes.test.ts`

Expected: FAIL because the chat page has no relationship-settings navigation or extracted accessible composer.

- [ ] **Step 3: Implement focused chat parts**

`chat-message-list.tsx` accepts `{ messages: ChatMessage[] }`, groups date labels when adjacent `createdAt` values differ, and renders outgoing/incoming bubbles without hardcoded literal colors where a token exists. `chat-composer.tsx` accepts `value`, `onChange`, `onSubmit`, and `sending`; it renders voice, expression, and attachment buttons with translated labels. Attachment opens a local sheet listing image, location, file, and photo as disabled explanatory actions. The send button is disabled for trimmed-empty input or `sending`.

In the route page, use a 44px back link, avatar/name/status, and an accessible more-actions menu. The menu contains settings via this exact link:

```tsx
<Link href={`/messages/${threadId}/settings`}>{t("tsq.chat.relationshipSettings")}</Link>
```

On message send, preserve typed content on failure, show localized retry feedback, and disable duplicate sends while pending. Reserve bottom padding for the fixed composer above `AppShell` navigation.

- [ ] **Step 4: Add bilingual copy**

Add `tsq.chat` keys in both locale files for `back`, `online`, `more`, `relationshipSettings`, `viewProfile`, `attachments`, `voice`, `expression`, `image`, `location`, `file`, `photo`, `unavailable`, `placeholder`, `send`, `sending`, `sendFailed`, `retry`, and `delivered`.

- [ ] **Step 5: Verify GREEN**

Run: `bun test src/app/messages/chat-routes.test.ts && bun run lint`

Expected: PASS; chat source has an API boundary, settings link, labelled attachment control, and disabled send state.

- [ ] **Step 6: Commit chat detail**

```bash
git add src/app/messages/[threadId]/page.tsx src/components/tsq/chat-composer.tsx src/components/tsq/chat-message-list.tsx src/app/messages/chat-routes.test.ts src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "Complete chat detail UX"
```

### Task 3: Add relationship settings and safe block confirmation

**Files:**
- Create: `src/app/messages/[threadId]/settings/page.tsx`
- Modify: `src/app/messages/chat-routes.test.ts`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`

**Interfaces:**
- Consumes: `tsqApi.getRelationshipSettings(threadId)`, `tsqApi.updateRelationshipSettings(threadId, payload)`.
- Produces: direct-linkable settings UX with persistent Mock state, clear saving/error feedback, and block confirmation.

- [ ] **Step 1: Write failing settings boundary test**

```ts
test("relationship settings use typed API calls and confirm blocking", () => {
  const page = readFileSync("src/app/messages/[threadId]/settings/page.tsx", "utf8");
  expect(page).toContain("tsqApi.getRelationshipSettings");
  expect(page).toContain("tsqApi.updateRelationshipSettings");
  expect(page).toContain("aria-pressed");
  expect(page).toContain("blockConfirm");
});
```

- [ ] **Step 2: Verify RED**

Run: `bun test src/app/messages/chat-routes.test.ts`

Expected: FAIL because the settings route does not exist.

- [ ] **Step 3: Implement settings state machine**

Load settings once per `threadId`. Use buttons with `aria-pressed` for mute and block. Tapping block opens a token-backed confirmation sheet; only its confirm action saves `{ ...draft, blocked: true }`. While saving, disable all setting controls. On failure, preserve the draft and offer `t("tsq.chat.retry")`. Add a destructive row that links to `/messages/${threadId}/report`.

- [ ] **Step 4: Add bilingual settings copy**

Add locale keys: `relationshipTitle`, `mute`, `muteHint`, `block`, `blockHint`, `reportConversation`, `saving`, `saved`, `saveFailed`, `blockConfirmTitle`, `blockConfirmBody`, `blockConfirm`, and `keepChatting`.

- [ ] **Step 5: Verify GREEN and commit**

Run: `bun test src/app/messages/chat-routes.test.ts && bun run lint`

```bash
git add src/app/messages/[threadId]/settings/page.tsx src/app/messages/chat-routes.test.ts src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "Add chat relationship settings UX"
```

### Task 4: Add report form and completion state

**Files:**
- Create: `src/app/messages/[threadId]/report/page.tsx`
- Modify: `src/app/messages/chat-routes.test.ts`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/en-US.json`

**Interfaces:**
- Consumes: `tsqApi.submitConversationReport(payload)`, `ReportReason`.
- Produces: localized multi-select report form, validation, pending/failed/success feedback, and route-safe completion navigation.

- [ ] **Step 1: Write failing report route test**

```ts
test("report route submits selected reasons through tsqApi", () => {
  const page = readFileSync("src/app/messages/[threadId]/report/page.tsx", "utf8");
  expect(page).toContain("tsqApi.submitConversationReport");
  expect(page).toContain("reasons.length === 0");
  expect(page).toContain("evidenceUnavailable");
});
```

- [ ] **Step 2: Verify RED**

Run: `bun test src/app/messages/chat-routes.test.ts`

Expected: FAIL because the report route does not exist.

- [ ] **Step 3: Implement the report form**

Model report reasons as a `Set<ReportReason>` and render one button per translated reason with `aria-pressed`. Reject empty selections before calling the API and show a translated inline validation message. Render evidence as an explicitly unavailable, non-uploading placeholder. Disable submit while pending. On success, display the receipt id and a link back to `/messages/${threadId}`; on error retain selected reasons and description, show a retry action.

- [ ] **Step 4: Add bilingual report copy**

Add `tsq.report` keys for title, subtitle, reasons, description, descriptionHint, evidence, evidenceUnavailable, submit, submitting, validation, submitted, submittedHint, retry, and backToChat. Add reason labels for harassment, fraud, unsafe, illegal, and other in both locale files.

- [ ] **Step 5: Verify GREEN and commit**

Run: `bun test src/app/messages/chat-routes.test.ts && bun run lint`

```bash
git add src/app/messages/[threadId]/report/page.tsx src/app/messages/chat-routes.test.ts src/i18n/locales/zh-CN.json src/i18n/locales/en-US.json
git commit -m "Add chat report flow UX"
```

### Task 5: Full verification and responsive visual check

**Files:**
- Verify: `src/app/messages/[threadId]/page.tsx`
- Verify: `src/app/messages/[threadId]/settings/page.tsx`
- Verify: `src/app/messages/[threadId]/report/page.tsx`
- Verify: `src/lib/tsq/api.test.ts`
- Verify: `src/app/messages/chat-routes.test.ts`

**Interfaces:**
- Consumes: all chat contracts and route flows from Tasks 1–4.
- Produces: a buildable, UX-only chat feature ready for a future HTTP adapter.

- [ ] **Step 1: Confirm route boundaries and accessible controls**

Run:

```bash
rg -n 'from "@/lib/tsq/data"|CONVERSATIONS' src/app/messages/[threadId] src/components/tsq/chat-*.tsx
rg -n 'aria-label|aria-pressed|disabled=' src/app/messages/[threadId] src/components/tsq/chat-*.tsx
```

Expected: no static-data imports; controls expose labels/state.

- [ ] **Step 2: Run complete verification**

Run: `bun test && bun run lint && bun run build`

Expected: all tests pass, lint exits 0, and build lists `/messages/[threadId]`, `/messages/[threadId]/settings`, and `/messages/[threadId]/report`.

- [ ] **Step 3: Verify narrow mobile layouts**

At 375px wide, open `/messages/c2`, `/messages/c2/settings`, and `/messages/c2/report`. Confirm header actions are tappable, the composer does not cover timeline content, attachment tools explain unavailable status, block requires confirmation, report requires a reason, and success returns to chat.

- [ ] **Step 4: Commit final verification fixes only if needed**

```bash
git add src
git commit -m "Finish chat completion UX"
```
