# Resource Editing and Visibility Design

## Summary

Complete the UX flow for editing each item under “我的资源”. An owner can open a resource detail, enter a dedicated edit screen, change its content and visibility, save through a typed frontend API boundary, and immediately see the updated value on both the detail page and `/me`. Other-user profile surfaces consume a filtered public-resource response so the backend can later enforce who may see each item.

This is UX/UI scope only. The current implementation uses an in-memory mock adapter to demonstrate the complete experience and preserves stable request and response types for backend integration. It does not add a database, authentication implementation, or frontend-only security claims.

## Goals

- Give every existing resource a reachable detail and edit experience.
- Provide an explicit edit button on each resource detail page.
- Support editing the label, summary, description, category tone, and visibility.
- Provide loading, validation, saving, success, and retry feedback.
- Refresh owner-facing resource data immediately after a successful save.
- Define a typed update contract that a backend can implement without changing page components.
- Define public-profile resource output that distinguishes owner access, matched-user access, and general public access.
- Keep the existing visual language: green, warm, and purple resource tones; rounded cards; mobile-first spacing; bilingual product copy.

## Non-goals

- Real database persistence.
- Real authentication, authorization, or relationship lookup.
- Admin resource management.
- Media upload, resource inventory quantities, pricing, or transactions.
- Editing “我的需求”; that is a separate future flow.

## User Flows

### Owner views and edits a resource

1. The owner selects any resource chip on `/me`.
2. `/me/resources/[id]` loads the resource through `getResourceDetail(id)`.
3. The detail header exposes a clear “修改” action.
4. The action navigates to `/me/resources/[id]/edit`.
5. The edit page loads the current resource and renders labeled controls for all editable fields.
6. The owner changes values and selects one visibility option.
7. The save button enters a disabled saving state and calls `updateResource(id, payload)`.
8. On success, the app shows a success confirmation and returns to the detail page.
9. The detail page and `/me` read the updated mock state, so the new values appear immediately.
10. On failure, entered values remain intact and an actionable retry message is shown.

### Another user views resources

1. A viewer opens another user’s profile surface.
2. The page requests `getPublicProfile(userId)` or its equivalent backend implementation.
3. The response contains only resources the current viewer is authorized to see.
4. The frontend renders returned items and does not attempt to infer authorization from hidden local fields.
5. If no resources are returned, the profile shows a neutral empty state rather than implying that private resources exist.

## Visibility Model

Each resource stores one of three explicit values:

- `public`: visible to every user who can open the profile.
- `matches`: visible only to the owner and users whom the backend recognizes as matched or connected through a bridge.
- `private`: visible only to the owner.

The edit screen explains these choices in plain language. The owner sees the selected visibility on the resource detail page. Public-profile components render only the already-filtered resource list returned by the API. A future backend must authenticate the viewer and filter records server-side; frontend filtering is display behavior, not access control.

## Data Contracts

Resource identifiers must be stable strings and must not be derived from array position in the long-term backend implementation.

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

export type UpdateResourcePayload = {
  label: string;
  value: string;
  kind: ResourceKind;
  description: string;
  visibility: ResourceVisibility;
};

export type PublicProfile = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  resources: ResourceDetail[];
};
```

Typed frontend helpers:

```ts
getResourceDetail(id: string): Promise<ResourceDetail>
updateResource(id: string, payload: UpdateResourcePayload): Promise<ResourceDetail>
getPublicProfile(userId: string): Promise<PublicProfile>
```

Components call these helpers through `tsqApi`; they do not use endpoint strings or raw `fetch`. The mock adapter stores updated resources in module state and returns cloned records. Backend route names and persistence technology remain implementation choices, but the payload and response semantics above are the handoff contract.

## Screen Design

### Resource detail: `/me/resources/[id]`

- Retain the current back action, tone card, summary, and description hierarchy.
- Add a top-right “修改” button with an edit icon and a stable `data-el` anchor.
- Add a visibility row with an icon, localized label, and short explanation.
- Use skeleton loading, localized not-found/error copy, and a retry action.

### Resource edit: `/me/resources/[id]/edit`

- Use a real route so refresh, direct links, and back navigation work.
- Header: back action, “修改资源” title, and no duplicate desktop-only modal behavior.
- Form controls:
  - resource name: required text input;
  - short summary: required text input;
  - detailed description: required textarea;
  - resource tone/category: three accessible selectable cards for green, warm, and purple;
  - visibility: three radio-style cards with title and explanatory copy.
- Sticky safe-area-aware save action above the app navigation area.
- Disable save while loading or submitting.
- Validate trimmed values before calling the API.
- Keep entered values after an error and provide a retry action.
- On successful save, treat the canonical `updateResource` response as the source of truth, then return to the detail page without introducing a platform SDK dependency.

### Owner resource list: `/me`

- Read resource items from the same API-backed mock state instead of immutable `ME.resources` data.
- Preserve the approved chip layout and colors.
- Provide stable loading placeholders and an error/retry state without shifting the surrounding sections.
- Continue linking every item to its detail route.

### Public profile resource section

- Add or extend a real other-user profile route rather than displaying it only as transient client state.
- Render the `resources` array returned by `getPublicProfile(userId)`.
- Preserve the resource chip visual language while excluding owner-only edit controls.
- Show a localized empty state when the returned resource array is empty.

## State and Synchronization

The mock adapter owns a mutable resource collection initialized from the current sample data. `getResourceDetail`, the owner-resource list helper, and `updateResource` all read from this one collection. Saving replaces the matching record and updates `updatedAt`, ensuring subsequent route loads display the change.

The UI does not optimistically claim persistence before the save succeeds. The save response becomes the source of truth. Route navigation or refresh after success causes the detail and list screens to re-read the same adapter state.

## Validation and Error Handling

- `label`, `value`, and `description` are trimmed and required.
- The API layer rejects an unknown resource id with `TsqApiError("NOT_FOUND", ...)`.
- The API layer rejects invalid fields with `TsqApiError("VALIDATION", ...)`.
- Pages render localized, user-facing messages and never expose provider errors, stack traces, or private identifiers.
- A failed save preserves all form inputs and returns focus to the error summary.
- Repeated clicks cannot submit duplicate saves while the request is pending.

## i18n and Accessibility

- Add every new product string to both `zh-CN.json` and `en-US.json` under a resource-editing namespace.
- Form inputs have visible labels and associated descriptions.
- Tone and visibility selectors expose selected state and keyboard-operable controls.
- Buttons meet touch-target sizing, show focus states, and expose useful accessible names.
- Loading placeholders remain stable and do not produce blank layout shifts.

## Testing

- API contract tests cover reading a resource, successful updates, validation failures, missing ids, state persistence across subsequent reads, and filtered public-profile visibility.
- Form behavior tests cover initial values, required-field validation, saving state, successful navigation, and preserved values after failure.
- Route-boundary tests verify that detail, edit, owner list, and public profile consume typed helpers rather than raw endpoint strings.
- Browser verification covers editing one resource, saving it, observing it on `/me`, and confirming an other-user profile shows public resources but not private ones.
- Run `bun test`, `bun run lint`, and `bun run build` before handoff.

## Backend Handoff Requirements

A backend implementation must:

- scope update operations to the authenticated owner;
- ignore ownership fields supplied by the client;
- store visibility as `public`, `matches`, or `private`;
- determine matched/bridge relationships server-side;
- filter public-profile resources before returning the response;
- return the saved canonical resource record;
- maintain stable ids and timestamps;
- preserve the typed payload and response semantics documented here.
