# Chat Completion UX Design

## Goal

Complete the person-to-person chat experience while keeping the existing Angel Bridge visual language: warm canvas, soft green accents, rounded surfaces, local companion imagery, and calm connection-oriented copy. The supplied wireframe is used as a flow reference only; icons and visual treatment are redesigned for Angel Bridge.

## Scope

### Chat detail: `/messages/[threadId]`

- Replace the minimal header with a 44px-safe action row: back, avatar/name/status, and a labelled more-actions button.
- Keep messages readable in a scrollable timeline with date separators, sender identity cues, delivered state, and a stable composer pinned above the app navigation.
- Add a compact composer toolbar: voice note, expression, attachment panel, and send. Voice and attachment actions show front-end-only sheets; they do not upload or record media in this iteration.
- The attachment sheet presents image, location, file, and photo actions as disabled-but-explained placeholders. The send button is disabled for blank text and reflects the pending send state.
- The more-actions menu provides “查看资料” and “关系设置”. Viewing a profile uses the existing profile route when an addressable user route exists; otherwise it stays unavailable rather than inventing a profile backend.

### Relationship settings: `/messages/[threadId]/settings`

- Use a real route rather than a modal so the state is direct-linkable and browser back behavior remains predictable.
- Show two accessible switch controls: notification mute and block this contact. Mute controls local session state; block requires confirmation before it takes effect.
- A separate destructive “投诉此对话” row opens the report route.
- Settings feedback is inline and localized. Changes use a Mock API contract only and survive within the active browser session.

### Report flow: `/messages/[threadId]/report`

- Present a concise, multi-select set of reasons: harassment, fraud or misleading information, unsafe content, illegal activity, and other.
- Require at least one reason. A multiline description is optional, with character guidance. Evidence tiles are front-end placeholders only; no file transfer occurs.
- Submission uses a typed Mock API contract and displays a quiet confirmation state that returns the user to the thread or message list.
- Do not promise moderation action, expose private report data, or contact a real backend in this iteration.

## Front-end contracts

`src/lib/tsq/types.ts` owns these types:

```ts
type RelationshipSettings = {
  muted: boolean;
  blocked: boolean;
};

type UpdateRelationshipSettingsPayload = RelationshipSettings;

type ReportReason =
  | "harassment"
  | "fraud"
  | "unsafe"
  | "illegal"
  | "other";

type SubmitConversationReportPayload = {
  threadId: string;
  reasons: ReportReason[];
  description?: string;
};

type SubmitConversationReportResult = {
  reportId: string;
  submittedAt: string;
};
```

`tsqApi` exposes `getRelationshipSettings(threadId)`, `updateRelationshipSettings(threadId, payload)`, and `submitConversationReport(payload)`. `mock-api.ts` holds session-local state. No `/api/*` routes, database schema, auth change, or real media upload is added.

## Visual and interaction rules

- Use existing CSS design tokens; do not import the reference image’s yellow header or grayscale treatment.
- Use Lucide’s consistent outline icon family at 20px inside 44px+ buttons. Avoid emoji and unlabelled icon-only controls.
- Sheet and route surfaces use the existing `--bg-canvas`, `--soft`, `--primary`, `--border`, and shadow tokens; destructive actions use the existing destructive semantic token.
- Press feedback uses opacity/color only and does not move layout. Respect reduced motion.
- Bottom composer and sheets reserve space above the existing app navigation and device safe areas.
- All new user-visible copy exists in both `zh-CN` and `en-US` locale files.

## State and error handling

- Thread loading uses a stable skeleton. Fetch and send failures show inline retry without losing typed text.
- Relationship settings exposes load, saving, saved, and retryable failure states; draft toggles survive failures and duplicate saves are disabled.
- Report form exposes validation messages, pending submission, success, and retryable failure. Reasons remain selected after an error.

## Accessibility

- Every control has a visible label or `aria-label`; switches use `aria-pressed` or native semantics.
- Focus order follows the visible order. Destructive confirmation has focus-safe cancel and confirm controls.
- Tap targets are at least 44px. Text and icon contrast use token-backed colors.

## Verification

- Unit tests cover Mock API persistence, report validation, and typed failure behavior.
- Source-boundary tests confirm routes use `tsqApi` rather than direct data records.
- Test send, mute, block confirmation, report validation/submission, back navigation, and narrow mobile layout.
- Run `bun test`, `bun run lint`, and `bun run build` before completion.

## Non-goals

- No real-time delivery, push notifications, media recording/upload, location sharing, files, or moderation backend.
- No redesign of the global navigation or message-list layout beyond existing integration work.
