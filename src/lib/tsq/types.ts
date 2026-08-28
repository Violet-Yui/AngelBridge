import type { Conversation, Kind, Match, PersonCard, Todo } from "./data";

export type { Match, Todo } from "./data";

export type ResourceKind = Kind;

export type DiscoverCard = Omit<PersonCard, "author"> & {
  author: { id: string; name: string; avatarUrl?: string };
  score?: number;
};

export type DiscoverDetail = DiscoverCard & {
  reasons: string[];
  resources: string[];
  needs: string[];
};

export type MessageThread = Conversation & {
  title: string;
  avatarUrl?: string;
  lastMessage: string;
  updatedAt: string;
  kind: "friend" | "stranger" | "xiaotian";
};

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  status: "sending" | "sent" | "failed";
};

export type ThreadMessages = { thread: MessageThread; messages: ChatMessage[] };
export type RelationshipSettings = { muted: boolean; blocked: boolean };
export type UpdateRelationshipSettingsPayload = RelationshipSettings;
export type ReportReason = "harassment" | "fraud" | "unsafe" | "illegal" | "other";
export type SubmitConversationReportPayload = {
  threadId: string;
  reasons: ReportReason[];
  description?: string;
};
export type SubmitConversationReportResult = { reportId: string; submittedAt: string };

export type SendXiaotianMessagePayload = {
  body: string;
};

export type SendXiaotianMessageResult = {
  userMessage: ChatMessage;
  reply: ChatMessage;
};

export type XiaotianTaskStatus = "running" | "completed" | "failed";

export type XiaotianTaskStep = {
  id: string;
  label: string;
  status: "done" | "active" | "pending" | "failed";
};

export type XiaotianTaskCandidate = {
  id: string;
  name: string;
  description: string;
  score: number;
  bridgeId: string;
};

export type XiaotianTask = {
  id: string;
  status: XiaotianTaskStatus;
  progress: number;
  summary: string;
  steps: XiaotianTaskStep[];
  candidates: XiaotianTaskCandidate[];
  errorMessage?: string;
  updatedAt: string;
};

export type CreatePostPayload = {
  channel: string;
  intent: "have" | "want";
  text: string;
};

export type CreatePostResult = { postId: string };
export type UserProfile = { id: string; name: string; handle: string; avatarUrl?: string; stage: string; location?: string; bio?: string; growth: number; growthDelta: number; level: number; followers: number; luck: number; mood: string };
export type HomeOverview = {
  profile: UserProfile;
  matches: Match[];
  todos: Todo[];
};
export type TreeOverview = { growth: number; level: number; nextLevelGrowth: number; stage: string; milestones: Array<{ id: string; title: string; date: string; delta: number }> };
export type GrowthLogOverview = {
  growth: number;
  level: number;
  nextLevelGrowth: number;
  stage: string;
  entries: Array<{ title: string; date: string; delta: number }>;
};
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
export type NeedDetail = { id: string; title: string; description: string; status: "open" | "matched" | "closed"; matchCount: number };
export type ProfileAsset = { id: string; label: string; value: string; kind: ResourceKind; source: "user" | "xiaotian" };
export type ProfileNeed = { id: string; title: string; source: "user" | "xiaotian" };
export type AssetSuggestion = { id: string; type: "resource" | "need"; label: string; value?: string; kind?: ResourceKind; reason: string; status: "pending" | "accepted" | "ignored" };
export type ProfileAssets = { resources: ProfileAsset[]; needs: ProfileNeed[]; suggestions: AssetSuggestion[] };
export type UpdateProfileAssetsPayload = Pick<ProfileAssets, "resources" | "needs">;
export type ResolveAssetSuggestionPayload = { id: string; action: "accept" | "ignore" };
export type Settings = { notifications: boolean; publicProfile: boolean; language: "zh-CN" | "en-US" };
export type NotificationItem = { id: string; title: string; body: string; time: string; kind: "bridge" | "growth" | "system" };

export type BridgeStatus = "pending" | "accepted" | "scheduled" | "completed" | "rejected" | "expired";
export type BridgeDetail = {
  id: string;
  status: BridgeStatus;
  source: "xiaotian" | "incoming" | "outgoing";
  type: "coop" | "friend" | "swap";
  participants: Array<{ id: string; name: string; avatarUrl?: string; role: string }>;
  exchange: Array<{ ownerId: string; label: string; description: string }>;
  reasons: string[];
  unknowns: string[];
  nextAction: string;
};

export class TsqApiError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "NETWORK" | "VALIDATION",
    message: string,
  ) {
    super(message);
    this.name = "TsqApiError";
  }
}
