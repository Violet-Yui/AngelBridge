import { CONVERSATIONS, DISCOVER_CARDS, HOME_MATCHES, HOME_TODOS, INVITES, ME } from "./data";
import type { Conversation } from "./data";
import type {
  CreatePostPayload,
  CreatePostResult,
  DiscoverDetail,
  ThreadMessages,
  ChatMessage,
  BridgeDetail,
  TreeOverview,
  UserProfile,
  ResourceDetail, NeedDetail, Settings, NotificationItem,
  SendXiaotianMessagePayload, SendXiaotianMessageResult,
  XiaotianTask, XiaotianTaskStep,
  HomeOverview,
} from "./types";
import { TsqApiError } from "./types";

const messagesByThread: Record<string, ThreadMessages["messages"]> = {
  c2: [
    { id: "msg-c2-1", senderId: "c2", body: "那我们周四下午视频对一下项目细节～", createdAt: "今天 12:40", status: "sent" },
    { id: "msg-c2-2", senderId: "me", body: "好呀，我会提前整理好页面方案。", createdAt: "今天 12:42", status: "sent" },
  ],
  c1: [
    { id: "msg-c1-1", senderId: "c1", body: "我为你新匹配到 3 个换物机会，要看看吗？", createdAt: "刚刚", status: "sent" },
  ],
};

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

function getCard(id: string) {
  const card = DISCOVER_CARDS.find((item) => item.id === id);
  if (!card) throw new TsqApiError("NOT_FOUND", "没有找到这条发现内容");
  return card;
}

export async function getDiscoverDetail(id: string): Promise<DiscoverDetail> {
  const card = getCard(id);
  return {
    ...card,
    author: { id: `user-${card.id}`, name: card.author },
    reasons: ["兴趣方向相近", "所在城市便于交流", "彼此可以交换经验与资源"],
    resources: card.kind === "green" ? ["UI 设计经验", "城市生活记录"] : ["专业技能", "可持续交流时间"],
    needs: ["找到长期伙伴", "共同完成一次小项目"],
  };
}

export async function getDiscoverFeed(): Promise<typeof DISCOVER_CARDS> {
  return DISCOVER_CARDS;
}

export async function getThreadMessages(threadId: string): Promise<ThreadMessages> {
  const conversation = CONVERSATIONS.find((item) => item.id === threadId);
  if (!conversation) throw new TsqApiError("NOT_FOUND", "没有找到这个会话");
  return {
    thread: {
      ...conversation,
      title: conversation.name,
      lastMessage: conversation.last,
      updatedAt: conversation.time,
      kind: conversation.zone === "ai" ? "xiaotian" : conversation.zone,
    },
    messages: messagesByThread[threadId] ?? [
      { id: `msg-${threadId}-1`, senderId: threadId, body: conversation.last, createdAt: conversation.time, status: "sent" },
    ],
  };
}

export async function sendMessage(threadId: string, payload: { body: string }): Promise<ChatMessage> {
  const conversation = CONVERSATIONS.find((item) => item.id === threadId);
  if (!conversation) throw new TsqApiError("NOT_FOUND", "没有找到这个会话");
  if (!payload.body.trim()) throw new TsqApiError("VALIDATION", "消息不能为空");
  return { id: `msg-${threadId}-${Date.now()}`, senderId: "me", body: payload.body.trim(), createdAt: "刚刚", status: "sent" };
}

export async function createPost(payload: CreatePostPayload): Promise<CreatePostResult> {
  if (!payload.text.trim()) throw new TsqApiError("VALIDATION", "内容不能为空");
  return { postId: `post-${Date.now()}` };
}

export async function getBridgeDetail(id: string): Promise<BridgeDetail> {
  const invite = INVITES.find((item) => item.id === id);
  if (!invite) throw new TsqApiError("NOT_FOUND", "没有找到这条桥约");
  return {
    id: invite.id,
    status: invite.status,
    source: invite.source === "小天撮合" ? "xiaotian" : invite.source === "我发起" ? "outgoing" : "incoming",
    type: invite.type,
    participants: [{ id: "me", name: "你", role: "资源提供者" }, { id: `person-${id}`, name: invite.person, role: "桥约伙伴" }],
    exchange: [{ ownerId: "me", label: "我提供", description: invite.mine ?? invite.desc ?? "我的时间与经验" }, { ownerId: `person-${id}`, label: "对方提供", description: invite.theirs ?? "对方的技能与资源" }],
    reasons: ["需求方向互补", "双方所在城市便于沟通", "交换边界清晰，适合先从小一步开始"],
    unknowns: ["具体时间与交付方式", "联系方式开放范围"],
    nextAction: "先发 3 张参考图，再确认拍摄时间",
  };
}

export async function confirmBridge(id: string, payload: { agree: boolean }): Promise<BridgeDetail> {
  const bridge = await getBridgeDetail(id);
  return { ...bridge, status: payload.agree ? "accepted" : "rejected" };
}

export async function scheduleBridge(id: string, payload: { slot: string }): Promise<BridgeDetail> {
  if (!payload.slot.trim()) throw new TsqApiError("VALIDATION", "请选择桥约时间");
  const bridge = await getBridgeDetail(id);
  return { ...bridge, status: "scheduled" };
}

export async function getTreeOverview(): Promise<TreeOverview> {
  return { growth: ME.growth, level: ME.level, nextLevelGrowth: 1500, stage: ME.stage, milestones: ME.growthLog.map((item, i) => ({ id: `milestone-${i}`, ...item })) };
}

export async function updateProfile(payload: Partial<Pick<UserProfile, "name" | "bio" | "location" | "stage">>): Promise<UserProfile> {
  return { id: "me", name: payload.name ?? ME.name, handle: ME.handle, stage: payload.stage ?? ME.stage, location: payload.location ?? "杭州", bio: payload.bio ?? "", growth: ME.growth, growthDelta: ME.growthDelta, level: ME.level, luck: ME.luck, mood: ME.mood };
}

export async function getResourceDetail(id: string): Promise<ResourceDetail> { const index = Number(id.replace("resource-", "")); const item = ME.resources[index]; if (!item) throw new TsqApiError("NOT_FOUND", "没有找到这项资源"); return { id, ...item, description: `${item.label}是你可以持续分享与交换的资源。`, visibility: "matches" }; }
export async function getNeedDetail(id: string): Promise<NeedDetail> { const index = Number(id.replace("need-", "")); const title = ME.needs[index]; if (!title) throw new TsqApiError("NOT_FOUND", "没有找到这条需求"); return { id, title, description: "期待通过天使桥找到合适的伙伴，一起把需求变成行动。", status: "open", matchCount: index + 2 }; }
export async function getSettings(): Promise<Settings> { return { notifications: true, publicProfile: true, language: "zh-CN" }; }
export async function getNotifications(): Promise<NotificationItem[]> { return [{ id: "notice-1", title: "新的桥约提醒", body: "胶片旅人正在等待你确认桥约。", time: "刚刚", kind: "bridge" }, { id: "notice-2", title: "成长值增加了", body: "完成一次资源交换，获得 +28 成长值。", time: "今天", kind: "growth" }]; }

export async function sendXiaotianMessage(
  payload: SendXiaotianMessagePayload,
): Promise<SendXiaotianMessageResult> {
  const body = payload.body.trim();
  if (!body) throw new TsqApiError("VALIDATION", "请先输入想对小天说的话");

  const timestamp = Date.now();
  return {
    userMessage: {
      id: `xiaotian-user-${timestamp}`,
      senderId: "me",
      body,
      createdAt: "刚刚",
      status: "sent",
    },
    reply: {
      id: `xiaotian-reply-${timestamp}`,
      senderId: "xiaotian",
      body: "收到啦，我会继续帮你梳理需求，并寻找合适的连接机会。",
      createdAt: "刚刚",
      status: "sent",
    },
  };
}

const xiaotianTaskSteps: XiaotianTaskStep[] = [
  { id: "intent", label: "识别你的意图", status: "done" },
  { id: "search", label: "寻找对方 Offer", status: "active" },
  { id: "benefit", label: "检查双方收益", status: "pending" },
  { id: "reason", label: "生成桥的理由", status: "pending" },
];

const xiaotianCandidates: XiaotianTask["candidates"] = [
  { id: "candidate-1", name: "品牌摄影师阿杰", description: "拍摄空间互换 × 品牌曝光", score: 92, bridgeId: "i1" },
  { id: "candidate-2", name: "设计师小林", description: "空间互换 × 曝光支持", score: 88, bridgeId: "i2" },
  { id: "candidate-3", name: "创意团队「光合」", description: "空间互换 × 联合内容共创", score: 85, bridgeId: "i3" },
];

export async function getXiaotianTask(taskId: string): Promise<XiaotianTask> {
  if (taskId === "task-ready") {
    return {
      id: taskId,
      status: "completed",
      progress: 100,
      summary: "已完成双向匹配，为你找到 3 个候选桥。",
      steps: xiaotianTaskSteps.map((step) => ({ ...step, status: "done" })),
      candidates: xiaotianCandidates,
      updatedAt: "刚刚",
    };
  }

  if (taskId === "task-running") {
    return {
      id: taskId,
      status: "running",
      progress: 50,
      summary: "正在检查双方可以获得的价值，请稍候。",
      steps: xiaotianTaskSteps,
      candidates: [],
      updatedAt: "刚刚",
    };
  }

  if (taskId === "task-failed") {
    return {
      id: taskId,
      status: "failed",
      progress: 50,
      summary: "这次匹配暂时中断。",
      steps: xiaotianTaskSteps.map((step) => step.id === "search" ? { ...step, status: "failed" } : step),
      candidates: [],
      errorMessage: "网络有些拥挤，小天暂时没有完成匹配。",
      updatedAt: "刚刚",
    };
  }

  throw new TsqApiError("NOT_FOUND", "没有找到这个小天任务");
}

export async function retryXiaotianTask(taskId: string): Promise<XiaotianTask> {
  await getXiaotianTask(taskId);
  return {
    id: taskId,
    status: "running",
    progress: 25,
    summary: "小天已重新开始寻找合适的连接。",
    steps: xiaotianTaskSteps,
    candidates: [],
    updatedAt: "刚刚",
  };
}
