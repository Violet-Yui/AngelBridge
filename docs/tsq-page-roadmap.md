# 天使桥页面补齐与后端接口预留路线图

## 目标

把当前 UX 原型补齐为一套可联调的产品前端壳。你继续负责页面体验、动线、状态和视觉完成度；后端后续按本文档预留的接口契约接入真实数据。

核心原则：

- 页面组件不直接依赖静态 mock 数据。
- 每个新增页面都同步定义数据类型、接口方法、加载态、空态、失败态和提交态。
- UX 阶段先用 mock adapter 返回数据；后端联调时只替换 adapter，不重写页面。
- 主流程优先于边角页面，详情承接优先于设置类页面。

## 当前已有页面

| 路由 | 页面 | 当前状态 | 后续处理 |
| --- | --- | --- | --- |
| `/` | 生命树首页 | 已有主视觉和推荐区 | 接入首页聚合接口，补成长记录入口 |
| `/discover` | 找人/发现 | 已有瀑布流和筛选 | 补详情页、筛选请求参数、空态 |
| `/create` | 发布 | 已有发布表单 | 补发布成功、编辑、提交中/失败态 |
| `/messages` | 消息 | 已有列表 | 补会话详情和消息发送接口 |
| `/bridge` | 桥约列表 | 已有邀请列表 | 补动态详情路由和状态流转 |
| `/bridge/detail` | 桥约详情 | 静态详情 | 改为 `/bridge/[id]` 并接详情接口 |
| `/bridge/confirm` | 桥约确认 | 已有确认页 | 接确认接口和确认后状态页 |
| `/bridge/schedule` | 桥约安排 | 已有安排页 | 改为 `/bridge/[id]/schedule` |
| `/me` | 我的 | 已有资料、资源、需求、成长 | 补资料编辑、资源详情、需求详情 |
| `/xiaotian/chat` | 小天聊天 | 静态消息 | 接对话发送接口和流式/等待态 |
| `/xiaotian/intent` | 小天意图确认 | 已有意图页 | 接意图提交接口 |
| `/xiaotian/bridging` | 小天桥接中 | 已有进度页 | 接桥接任务状态轮询 |

## 页面补齐优先级

### P0：主路径闭环

这些页面优先补，因为它们直接承接当前已有入口。

| 新增/调整路由 | 入口 | UX 目标 | 后端接口预留 |
| --- | --- | --- | --- |
| `/discover/[id]` | 发现页卡片、首页匹配卡 | 展示对象详情、可交换资源、想要资源、发起桥约 CTA | `getDiscoverDetail(id)` |
| `/messages/[threadId]` | 消息列表 | 会话详情、发送消息、未读清零 | `getThreadMessages(threadId)`, `sendMessage(threadId, payload)` |
| `/create/success` | 发布提交成功 | 发布结果、继续发布、查看详情 | `createPost(payload)` 返回 `postId` |
| `/bridge/[id]` | 桥约列表、发现详情 CTA | 匹配双方、匹配理由、未知项、下一步动作 | `getBridgeDetail(id)` |
| `/tree` | 首页生命树、成长值入口 | 完整生命树、等级、成长来源、里程碑 | `getTreeOverview()` |
| `/profile/edit` | 我的页资料区 | 编辑头像、昵称、标签、简介、地区 | `updateProfile(payload)` |

### P1：我的资产和需求

这些页面让“我的”页不只是展示，还能承接管理动作。

| 新增路由 | 入口 | UX 目标 | 后端接口预留 |
| --- | --- | --- | --- |
| `/me/resources/[id]` | 我的资源卡 | 资源详情、可见性、被匹配记录、编辑入口 | `getResourceDetail(id)` |
| `/me/needs/[id]` | 我的需求列表 | 需求详情、匹配进展、关闭/编辑需求 | `getNeedDetail(id)` |
| `/growth` | 成长记录 | 成长日志、经验来源、等级说明 | `getGrowthLog(params)` |
| `/settings` | 我的页设置入口 | 账号、通知、隐私、安全 | `getSettings()`, `updateSettings(payload)` |
| `/notifications` | 顶部通知/消息入口 | 系统通知、桥约提醒、成长提醒 | `getNotifications(params)` |

### P2：桥约和小天完整流程

这些页面补齐撮合与 AI 辅助的连续体验。

| 新增/调整路由 | 入口 | UX 目标 | 后端接口预留 |
| --- | --- | --- | --- |
| `/bridge/create` | 发现详情、发布成功、小天建议 | 手动创建桥约意图 | `createBridgeIntent(payload)` |
| `/bridge/[id]/confirm` | 桥约详情 | 确认是否了解对方 | `confirmBridge(id, payload)` |
| `/bridge/[id]/schedule` | 确认页 | 选择时间、地点、方式 | `scheduleBridge(id, payload)` |
| `/bridge/[id]/result` | 安排完成 | 展示桥约结果和下一步 | `getBridgeResult(id)` |
| `/xiaotian/tasks/[taskId]` | 小天桥接中 | 展示 AI 任务进度、候选结果、失败重试 | `getXiaotianTask(taskId)` |

## 统一接口层设计

新增以下文件，页面只调用 `tsqApi`，不要直接 import mock 常量。

| 文件 | 作用 |
| --- | --- |
| `src/lib/tsq/types.ts` | 页面业务类型，前后端字段契约 |
| `src/lib/tsq/api.ts` | 前端调用入口，导出 `tsqApi` |
| `src/lib/tsq/mock-api.ts` | UX 阶段 mock adapter |
| `src/lib/tsq/http-api.ts` | 后端联调 adapter |
| `src/lib/tsq/api-errors.ts` | 统一错误类型和错误文案映射 |

建议接口形态：

```ts
export const tsqApi = {
  getHome,
  getDiscoverFeed,
  getDiscoverDetail,
  createPost,
  getThreadMessages,
  sendMessage,
  getProfile,
  updateProfile,
  getBridgeDetail,
  confirmBridge,
  scheduleBridge,
  getTreeOverview,
};
```

## 核心数据契约

### 用户与资料

```ts
export type UserProfile = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  stage: string;
  location?: string;
  bio?: string;
  growth: number;
  growthDelta: number;
  level: number;
  luck: number;
  mood: string;
};
```

### 资源与需求

```ts
export type ResourceKind = "green" | "warm" | "purple";

export type ResourceItem = {
  id: string;
  label: string;
  value: string;
  kind: ResourceKind;
  description?: string;
  visibility: "public" | "matches" | "private";
};

export type NeedItem = {
  id: string;
  title: string;
  description?: string;
  status: "open" | "matched" | "closed";
  matchCount: number;
};
```

### 发现卡片

```ts
export type DiscoverCard = {
  id: string;
  kind: ResourceKind;
  badge: string;
  title: string;
  description: string;
  place: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  likes: number;
  coverEmoji?: string;
  coverUrl?: string;
  score?: number;
};
```

### 桥约

```ts
export type BridgeStatus =
  | "pending"
  | "accepted"
  | "scheduled"
  | "completed"
  | "rejected"
  | "expired";

export type BridgeDetail = {
  id: string;
  status: BridgeStatus;
  source: "xiaotian" | "incoming" | "outgoing";
  type: "coop" | "friend" | "swap";
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  }>;
  exchange: Array<{
    ownerId: string;
    label: string;
    description: string;
  }>;
  reasons: string[];
  unknowns: string[];
  nextAction: string;
};
```

### 消息

```ts
export type MessageThread = {
  id: string;
  title: string;
  avatarUrl?: string;
  lastMessage: string;
  unreadCount: number;
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
```

## 每个页面必须包含的状态

每个补齐页面都要同时补这些状态，避免后端接入后出现断层。

| 状态 | UX 要求 |
| --- | --- |
| Loading | 使用骨架屏或局部 shimmer，不整页白屏 |
| Empty | 解释当前没有内容，并给出下一步 CTA |
| Error | 展示可理解错误和重试按钮 |
| Auth Required | 引导登录或重新授权 |
| Submit Pending | 禁用重复提交，保留正在处理反馈 |
| Submit Failed | 保留用户输入，允许重试 |
| Success | 给出明确结果和下一步入口 |

## 实施顺序

### 第 1 批：路由骨架与详情承接

1. 建立 `types.ts`、`api.ts`、`mock-api.ts`。
2. 把首页、发现、我的从直接读取 mock 常量改成通过 `tsqApi` 读取。
3. 新增 `/discover/[id]`。
4. 新增 `/messages/[threadId]`。
5. 新增 `/create/success`。

验收标准：

- 当前主导航不破。
- 首页卡片、发现卡片、消息列表都能点进详情。
- mock 数据通过接口层返回。
- 全部页面有 loading、empty、error 的基本承接。

### 第 2 批：桥约闭环

1. 把 `/bridge/detail` 调整为 `/bridge/[id]`。
2. 把 `/bridge/confirm` 调整为 `/bridge/[id]/confirm`。
3. 把 `/bridge/schedule` 调整为 `/bridge/[id]/schedule`。
4. 新增 `/bridge/[id]/result`。
5. 接入桥约状态字段和按钮状态。

验收标准：

- 桥约从列表到详情、确认、安排、结果可以跑通。
- 每个状态都有明确 CTA。
- 后端只需要实现桥约相关接口即可替换 mock。

### 第 3 批：我的与生命树

1. 新增 `/tree`。
2. 新增 `/growth`。
3. 新增 `/profile/edit`。
4. 新增 `/me/resources/[id]`。
5. 新增 `/me/needs/[id]`。

验收标准：

- 我的页每个资源和需求都有详情承接。
- 生命树从首页主视觉进入完整页。
- 资料编辑支持提交中、失败、成功状态。

### 第 4 批：小天与系统状态

1. 小天聊天接 `sendXiaotianMessage` mock。
2. 新增 `/xiaotian/tasks/[taskId]`。
3. 补 `/notifications`。
4. 补 `/settings`。
5. 统一空态、错误态、登录态组件。

验收标准：

- 小天从意图、桥接、结果有完整动线。
- 所有后端失败都能被页面承接。
- UX 原型可交给后端按接口联调。

## 后端交付清单

给后端的最小接口清单：

| 方法 | 接口建议 |
| --- | --- |
| `getHome()` | `GET /api/tsq/home` |
| `getDiscoverFeed(params)` | `GET /api/tsq/discover` |
| `getDiscoverDetail(id)` | `GET /api/tsq/discover/:id` |
| `createPost(payload)` | `POST /api/tsq/posts` |
| `getThreadMessages(threadId)` | `GET /api/tsq/messages/:threadId` |
| `sendMessage(threadId, payload)` | `POST /api/tsq/messages/:threadId` |
| `getProfile()` | `GET /api/tsq/me` |
| `updateProfile(payload)` | `PATCH /api/tsq/me` |
| `getBridgeDetail(id)` | `GET /api/tsq/bridges/:id` |
| `confirmBridge(id, payload)` | `POST /api/tsq/bridges/:id/confirm` |
| `scheduleBridge(id, payload)` | `POST /api/tsq/bridges/:id/schedule` |
| `getTreeOverview()` | `GET /api/tsq/tree` |
| `sendXiaotianMessage(payload)` | `POST /api/tsq/xiaotian/chat` |
| `getXiaotianTask(taskId)` | `GET /api/tsq/xiaotian/tasks/:taskId` |

## 交付方式

每批页面交付时保留三类证据：

- UX：浏览器截图或录屏，确认主流程可走。
- 代码：类型、接口层、页面路由齐全。
- 验证：`bun test`、`bun run lint`、`bun run build` 通过。

## 不在本阶段做的事

- 不实现真实登录注册。
- 不接真实支付、地图、即时通讯 SDK。
- 不做复杂后台管理系统。
- 不把 mock 数据散落到页面组件里。
- 不提前绑定某个后端数据库模型；先稳定前端契约。
