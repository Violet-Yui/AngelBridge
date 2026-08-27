# P0/P1 API Boundaries Design

## Goal

Complete the P0 and P1 data boundaries so the homepage, message list, growth log, and settings screens obtain data and submit mutations only through `tsqApi`. UX remains unchanged while the mock adapter can later be replaced by a real HTTP adapter.

## Scope

### P0

- Add `getHome()` to return homepage data needed by the life-tree hero and home sections.
- Add `getMessageList()` to return all conversation-list rows.
- Move the homepage and message-list page from direct data imports to `tsqApi` calls.
- Preserve existing `getThreadMessages()` and `sendMessage()` contracts.

### P1

- Add `getGrowthLog()` to return the growth summary, level progress, and timeline entries needed by `/growth`.
- Add `updateSettings(payload)` to save the settings controlled by `/settings`.
- Move `/growth` and `/settings` to `tsqApi` calls.
- Expose loading, empty, submit-pending, success, and error/retry states for the updated flows.

## Architecture

`src/lib/tsq/types.ts` owns request and response contracts. `src/lib/tsq/mock-api.ts` implements these contracts using existing sample data and retains mutations during the active session. `src/lib/tsq/api.ts` is the only page-facing entry point. Pages must not import static mock values directly.

The intended future replacement is `http-api.ts`, which implements the same `tsqApi` shape with `/api/tsq/*` endpoints. Page code remains unchanged when that adapter is enabled.

## Contracts

```ts
type HomeOverview = {
  profile: UserProfile;
  matches: Match[];
  todos: Todo[];
};

type GrowthLogOverview = {
  growth: number;
  level: number;
  nextLevelGrowth: number;
  stage: string;
  entries: Array<{ date: string; title: string; delta: number }>;
};

type UpdateSettingsPayload = Pick<Settings, "notifications" | "publicProfile" | "language">;

type UpdateSettingsResult = Settings;
```

```ts
tsqApi.getHome(): Promise<HomeOverview>
tsqApi.getMessageList(): Promise<Conversation[]>
tsqApi.getGrowthLog(): Promise<GrowthLogOverview>
tsqApi.updateSettings(payload: UpdateSettingsPayload): Promise<UpdateSettingsResult>
```

## UX State Rules

- Read operations start with stable skeleton placeholders and show a retry action on failure.
- An empty message list or growth timeline explains that there is no activity yet and retains the page navigation.
- Settings submit disables duplicate saves while retaining current user selections.
- Settings success provides an inline confirmation; failure preserves draft values and provides retry.
- Existing Chinese and English copy is kept in locale JSON; new visible copy is added to both files.

## Non-goals

- No real database, authentication, or `/api/tsq/*` server implementation in this iteration.
- No redesign of homepage, messages, growth, or settings layouts.
- No persistence across browser refresh while using the mock adapter.

## Verification

- Unit tests cover each new API contract and rejection behavior.
- `bun test`, `bun run lint`, and `bun run build` pass.
- Local browser checks confirm data loads, settings save feedback works, and existing routes remain reachable.
