export type ImageAttachment = {
  url: string;
  mimeType?: string;
  fileName?: string;
};

export type LifeTreeTag = {
  label: string;
  visible: boolean;
};

export type LifeTreeRecord = {
  offers: LifeTreeTag[];
  needs: LifeTreeTag[];
  explorations: LifeTreeTag[];
  diagnosis: {
    completeness: number;
    matchClarity: number;
    review: string;
  } | null;
};

export type MatchReason = {
  type: string;
  text: string;
  evidenceNodeIds: string[];
};

export type MatchView = {
  matchId: string;
  publicationId: string | null;
  counterpartPublicationId: string | null;
  publicationTitle: string | null;
  counterpartPublicationTitle: string | null;
  counterpartId: string;
  counterpartDisplayName: string;
  counterpartAvatarUrl: string | null;
  counterpartPersonalityTags: string[];
  counterpartInterestTags: string[];
  bridgeIndex: number;
  tier: string | null;
  status: "candidate" | "waiting_other" | "mutual_accepted" | "rejected";
  yourDecision: "accepted" | "rejected" | null;
  counterpartDecision: "accepted" | "rejected" | null;
  invitationDirection: "mutual" | "sent" | "received" | "none";
  valueToYou: string[];
  valueToOther: string[];
  satisfiedConstraints: string[];
  conflicts: string[];
  unknowns: string[];
  matchReasons: MatchReason[];
  primaryPattern: string | null;
  supportingPatterns: string[];
};

export type Dashboard = {
  account: {
    nickname: string;
    avatarUrl: string | null;
    petName: string;
    growthScore: number;
    personalityTags: string[];
    interestTags: string[];
  };
  stats: {
    offers: number;
    needs: number;
    opportunities: number;
    completedPacts: number;
  };
  recommendations: MatchView[];
  publicationCount: number;
  pendingTasks: Array<{
    type: string;
    matchId: string;
    publicationId?: string;
    title: string;
  }>;
  recentGrowth: Array<{
    eventId: string;
    type: string;
    title: string;
    delta: number;
    matchId: string;
    createdAt: string;
  }>;
  lifeTree: LifeTreeRecord | null;
  profileStatus: string;
};

export type PublicationValue = {
  title: string;
  description: string;
  images: ImageAttachment[];
};

export type PublicationDetail = {
  publicationId: string;
  viewerRole: "owner" | "visitor";
  title: string;
  content: string;
  category: string;
  kind: "offer" | "need" | "exchange";
  images: ImageAttachment[];
  author: {
    accountId: string;
    displayName: string;
    avatarUrl: string | null;
    stageLabel?: string;
  };
  authorBio: string;
  locationLabel: string;
  status: "draft" | "published" | "paused" | "completed" | "deleted";
  discoveryVisible: boolean;
  publishedAt: string | null;
  updatedAt: string;
  completedPactCount: number;
  hasCompletedPact: boolean;
  completionDecisionRequired: boolean;
  canInvite: boolean;
  canEdit: boolean;
  canDelete: boolean;
  formData: Record<string, unknown> | null;
};

export type PetTurn = {
  turnId: string;
  userText: string;
  userImages: ImageAttachment[];
  assistantText: string;
  createdAt: string;
};

export type PetOrganizeDraft = {
  title: string;
  summary: string;
  nodes: Array<{
    role: "offer" | "need" | "goal" | "attribute" | "criterion" | "consideration" | "constraint";
    domain: "space" | "item" | "skill" | "service" | "opportunity" | "growth";
    text: string;
    evidenceText: string;
  }>;
  exchangeModes: string[];
  constraints: string[];
};

export type PetOrganizeResult = {
  assistantReply: string;
  draft: PetOrganizeDraft;
  missingFields: string[];
  suggestedQuestions: string[];
};

export type ConversationView = {
  conversationId: string;
  matchId: string;
  counterpartId: string;
  counterpartDisplayName: string;
  counterpartAvatarUrl: string | null;
  lastMessage: string | null;
  messageCount: number;
  unreadCount: number;
  lastReadAt: string | null;
  updatedAt: string;
};

export type ConversationMessage = {
  messageId: string;
  conversationId: string;
  senderPersonaId: string;
  senderDisplayName: string;
  type: string;
  text: string;
  images: ImageAttachment[];
  payload: Record<string, unknown> | null;
  createdAt: string;
};

export type PactView = {
  pactId: string;
  matchId: string;
  title: string;
  status: "waiting_start" | "active" | "waiting_completion" | "completed" | "exited";
  counterpartId: string;
  counterpartDisplayName: string;
  counterpartAvatarUrl: string | null;
  valueToYou: string[];
  valueToOther: string[];
  yourStartConfirmed: boolean;
  counterpartStartConfirmed: boolean;
  yourCompletionConfirmed: boolean;
  counterpartCompletionConfirmed: boolean;
  nextAction: "confirm_start" | "wait_counterpart_start" | "confirm_completion" | "wait_counterpart_completion" | "view_result" | "none";
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
};

export type PactDetail = {
  pactId: string;
  matchId: string;
  sourcePublicationId: string | null;
  targetPublicationId: string | null;
  partyIds: string[];
  title: string;
  firstAction: string;
  completionCriteria: string;
  exitRule: string;
  otherNotes: string;
  status: PactView["status"];
  startConfirmations: Record<string, boolean>;
  completionConfirmations: Record<string, boolean>;
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
};
