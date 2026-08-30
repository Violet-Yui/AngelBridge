# 天使桥 Eazo 前端与后端实际绑定开发文档

## 1. 文档目的

本文用于指导天使桥黑客松 MVP 的真实联调实施。

当前协作关系：

- UI 美工使用 Eazo 开发最终移动端视觉，未锁定源码为仓库根目录的 `tianshiqiao.zip`；
- UX 成员基于 Eazo 源码补充交互、页面状态和演示体验；
- Backend Owner 负责业务流程、状态机、匹配、AI、产品级 ViewModel、API Client、Session 管理和实际联调；
- 前端页面不实现匹配、Consent、Pact、Disclosure 等领域逻辑，只触发用户动作并展示后端结果。

本文只定义黑客松 MVP 的开发方案。真实注册、生产数据库、正式即时通信和多实例扩容不属于当前实现范围。

## 2. 当前事实与结论

### 2.1 Eazo 源码

`tianshiqiao.zip` 是可编辑的完整工程，技术栈为：

- Next.js 16 App Router；
- React 19；
- TypeScript；
- Tailwind CSS v4；
- Zustand；
- Sonner；
- Eazo SDK；
- Bun。

源码已经包含以下核心路由：

```text
/
/messages
/create
/bridge
/bridge/detail
/bridge/confirm
/bridge/schedule
/xiaotian/chat
/xiaotian/intent
/xiaotian/bridging
```

这些页面的视觉结构已经可以复用，但业务数据目前主要来自：

```text
src/lib/tsq/data.ts
src/lib/tsq/xiaotian-flow.ts
```

页面中的匹配度、候选人、对话、邀请、桥约和成长数据仍是前端示例数据或本地 `useState`，尚未与后端状态关联。

### 2.2 当前后端

当前后端已经具备：

- Demo Session 与角色 Token；
- ValueNode 与 Intent；
- 规则匹配和 fixture AI 混合评分；
- MatchCardView 与 MatchDetailView；
- 双方 Consent；
- Pact 创建、编辑、双方确认和完成；
- 分阶段 Disclosure；
- LifeTree 与成长结果；
- 灵宠文本对话；
- fixture 语音闭环；
- 3 个合成场景；
- 内存 Session。

当前验证结果：

```text
typecheck passed
14 个测试文件通过
56 项测试通过
3 个 fixtures verified
```

### 2.3 总体决策

采用以下连接方式：

```text
Eazo 页面与组件
        ↓ 用户动作、展示 ViewModel
AngelBridge API Client
        ↓ HTTP、Token、错误解包、产品动作编排
Demo Session Store
        ↓ sessionId、角色和选中对象
Existing Backend API
        ↓
Intent → Matching → Consent → Pact → LifeTree
```

不优先建设 BFF，不使用 Eazo 自带数据库建立第二套业务后端，也不在页面中复制领域逻辑。

## 3. 代码落位

建议将 Eazo 源码解压到当前仓库的独立目录：

```text
AngelBridge/
├─ src/                       # 现有后端
├─ tests/
├─ scripts/
├─ eazo-app/                  # tianshiqiao.zip 解压后的最终 UI
│  ├─ src/app/
│  ├─ src/components/
│  ├─ src/lib/
│  ├─ src/stores/
│  └─ package.json
└─ docs/
```

解压时不得导入 ZIP 内的 `.env`。该文件含非占位的 `EAZO_PRIVATE_KEY`，只能作为本机私密配置使用，不能进入 Git。

最终接入新增两个主要文件：

```text
eazo-app/src/lib/api/angelbridge.ts
eazo-app/src/stores/angelbridge-session.ts
```

必要的接口类型放在 `angelbridge.ts` 中。暂不建立复杂 SDK 包、代码生成器或新的状态框架。

旧的 `FrontEnd/api.js` 与 `FrontEnd/demo-session.js` 可作为行为参考和测试样本，不再是最终 Eazo 工程的运行入口。

## 4. 本地运行与连接

### 4.1 后端

```bash
npm run api:dev
```

默认地址：

```text
http://127.0.0.1:8787
```

健康检查：

```text
GET http://127.0.0.1:8787/api/health
```

### 4.2 Eazo 前端

在 `eazo-app/.env.local` 中配置：

```env
NEXT_PUBLIC_ANGELBRIDGE_API_BASE=http://127.0.0.1:8787
```

然后运行：

```bash
bun install
bun dev
```

本地浏览器访问：

```text
http://localhost:3000
```

当前后端已经允许 `content-type` 和 `x-demo-role-token` 跨域请求，因此本机开发阶段可以从浏览器直接调用后端。

## 5. API Client 设计

### 5.1 职责

`angelbridge.ts` 只负责：

- 拼接 `NEXT_PUBLIC_ANGELBRIDGE_API_BASE`；
- 发送 HTTP 请求；
- 注入当前角色的 `x-demo-role-token`；
- 解包 `{ data, meta }`；
- 将后端错误转换为包含 `status`、`code`、`message` 的前端异常；
- 按产品动作编排必须顺序执行的多个接口。

它不负责：

- 计算匹配度；
- 推断 Consent 状态；
- 修改 Pact 状态；
- 根据前端静态数据伪造后端结果；
- 决定颜色、布局、动画或组件层级。

### 5.2 第一阶段方法

```ts
startDemo(scenarioId?)
getDashboard()
organizeWish(text)
publishIntent(draft)
runMatching()
getMatches()
getMatchDetail(matchId)
resetDemo()
```

其中 `publishIntent()` 内部严格执行：

```text
PATCH /nodes/:nodeId        仅更新用户修改过的节点
POST  /nodes/confirm
PUT   /intent
POST  /intent/activate
```

### 5.3 第二阶段方法

```ts
acceptMatchAsViewer(matchId)
acceptMatchAsCounterpart(matchId)
rejectMatch(matchId)
getPact()
updatePact(draft)
confirmPactAsViewer()
confirmPactAsCounterpart()
finishExchange(outcome)
getLifeTree(detailed?)
getConnection()
```

高风险动作使用明确角色命名，页面不自行挑选 Token。

## 6. Demo Session Store

`angelbridge-session.ts` 使用 Zustand 和 `sessionStorage`，只保存跨页面连续性：

```ts
type AngelBridgeSessionState = {
  sessionId: string | null;
  scenarioId: string | null;
  viewerPersonaId: string | null;
  rolesByPersonaId: Record<string, DemoRole>;
  currentRole: "viewer" | "counterpart";
  selectedMatchId: string | null;
  selectedCounterpartId: string | null;
  lastIntentDraft: ParseResult | null;
};
```

Store 不保存领域状态的独立副本。匹配、Consent、Pact 和 LifeTree 的权威状态仍从后端重新读取。

后端重启后，内存 Session 会失效。前端遇到明确的 `unauthorized` 或 `not_found` 时显示“演示会话已失效，请重新开始”，由用户点击重置，不静默切回前端假数据。

## 7. 页面绑定

### 7.1 首页 `/`

进入页面时：

```text
没有 Session → startDemo("studio-photography")
已有 Session → 直接复用
随后 → getDashboard()
```

字段映射：

| 页面元素 | 后端字段 |
| --- | --- |
| 用户名 | `dashboard.displayName` |
| 成长分 | `dashboard.growth.score` |
| 阶段 | `dashboard.growth.stageLabel` |
| 我的拥有 | `dashboard.counts.offers` |
| 我的心愿 | `dashboard.counts.needs` |
| 发现机会 | `dashboard.counts.opportunities` |
| 匹配卡片 | `dashboard.recommendations.items` |
| 待办 | `dashboard.pendingActions` |
| 灵宠气泡 | `dashboard.pet.message` |
| 灵宠动画状态 | `dashboard.pet.mood` |

首页不再读取 `ME`、`HOME_MATCHES`、`HOME_TODOS` 作为业务数据。

待办按钮按 `pendingActions.kind` 导航：

```text
activate_intent → /xiaotian/intent
start_matching  → /xiaotian/bridging
review_match    → /bridge/detail
wait_for_other  → /bridge/confirm
confirm_pact    → /bridge/schedule
finish_pact     → /bridge/schedule
```

### 7.2 小天对话 `/xiaotian/chat`

当前页面的消息数组和输入区域是静态的，需要改成真正的文本输入、发送按钮和消息列表。

用户提交心愿时：

```text
organizeWish(text)
→ POST /api/sessions/:id/parse
→ 保存 ParseResult 到 lastIntentDraft
→ 展示小天整理结果
→ 进入 /xiaotian/intent
```

如果用户只是询问下一步或让小天解释匹配，则调用灵宠对话接口，而不是重新解析心愿。

### 7.3 意图确认 `/xiaotian/intent`

页面渲染 `lastIntentDraft`：

```text
nodes.offer → 我能提供
nodes.need  → 我需要
nodes.goal  → 我的目标
intent.acceptedExchangeModes → 交换方式
intent.constraints → 时间与地点条件
DisclosurePolicy → 隐私边界
```

用户确认后调用 `publishIntent()`，成功后进入 `/xiaotian/bridging`。

### 7.4 匹配页 `/xiaotian/bridging`

首次进入：

```text
runMatching()
→ POST /matches/run
→ 返回 MatchCardView[]
```

重新进入：

```text
getMatches()
→ GET /matches
```

卡片字段：

```text
counterpartDisplayName
bridgeIndex
valueToYou
valueToOther
unknownCount
status
```

用户点击卡片时保存 `selectedMatchId` 和 `selectedCounterpartId`，再进入 `/bridge/detail`。

### 7.5 桥详情 `/bridge/detail`

调用：

```text
getMatchDetail(selectedMatchId)
```

页面重点渲染：

```text
proof.satisfiedConstraints
proof.conflicts
proof.unknowns
proof.evidence
scoreBreakdown
assessment
```

“我愿意了解对方”调用 viewer 的 Consent，然后进入双方确认页。

### 7.6 双方确认 `/bridge/confirm`

页面必须显示当前演示视角：

```text
当前视角：空间主理人 A / 品牌摄影师 B
```

流程：

```text
viewer 接受
→ 状态 waiting_other
→ 显示等待对方
→ 用户主动切换 counterpart 视角
→ counterpart 接受
→ 状态 mutual_accepted
→ getConnection()
```

禁止由后端静默自动替对方同意。

### 7.7 桥约 `/bridge/schedule`

流程：

```text
getPact()
→ 用户查看或编辑条款
→ updatePact()
→ viewer confirm
→ counterpart 查看并 confirm
→ Pact active
```

`updatePact()` 必须发生在任一方确认之前。

桥约完成后：

```text
finishExchange("completed")
→ getLifeTree(true)
→ 展示新增成长和结果
```

## 8. 消息与聊天功能

## 8.1 现有技术栈能否实现

可以。

Next.js、React、TypeScript、Zustand、浏览器 `fetch` 和当前 Node 后端足以实现黑客松 MVP 的文本聊天，不需要更换技术栈，也不需要先引入 WebSocket、Socket.IO、Redis 或第三方即时通信服务。

但是需要区分两种聊天：

1. 小天 AI/灵宠聊天；
2. 双方建立连接后的用户聊天。

当前后端已经支持第一种，尚未完整支持第二种。

## 8.2 当前能力矩阵

| 功能 | 当前状态 | 结论 |
| --- | --- | --- |
| 小天文本对话 | 已有 `/pet/turn`、`/pet/turns` | 可直接绑定 |
| 心愿自然语言整理 | 已有 `/parse` | 可直接绑定 |
| 小天解释匹配 | `pet/turn` 支持 `explain_match` | 可直接绑定 |
| 小天提示下一步 | `pet/turn` 支持 `next_step` | 可直接绑定 |
| 消息列表 UI | Eazo 已有 `/messages` | 需要替换静态数据 |
| 用户聊天详情页 | 当前没有真实页面 | 需要新增路由 |
| 用户消息存储与发送 | 后端暂未提供 | 需要新增最小内存实现 |
| 实时推送 | 当前没有 | MVP 不需要，使用主动刷新或轮询 |
| 真实语音识别和合成 | Provider 已有，API 主线仍是 fixture | 列为后续可选项 |

## 8.3 小天聊天绑定

使用现有接口：

```text
POST /api/sessions/:id/pet/turn
GET  /api/sessions/:id/pet/turns
```

请求：

```json
{
  "message": "为什么推荐这个摄影师？",
  "intent": "explain_match",
  "matchId": "selected-match-id"
}
```

支持的 intent：

```text
organize       整理资源和心愿
explain_match  解释当前匹配
next_step      提示下一步
```

返回值包含：

```text
userText
assistantText
suggestedActions
relatedMatchId
createdAt
```

`/xiaotian/chat` 页面应根据当前产品阶段选择 intent，而不是把所有文本都当作发布心愿。

## 8.4 用户聊天的 MVP 范围

用户只有在双方 Consent 达成后才能聊天。MVP 不保留“未建立连接即可给陌生人发私信”的逻辑，避免与当前隐私开放规则冲突。

消息页第一版只展示：

- 小天；
- 已经双方同意的连接；
- 尚未建立连接时的可行动空状态。

前端需要新增：

```text
/messages/[conversationId]
```

可以复用 `/xiaotian/chat` 的气泡、输入栏、发送状态和滚动布局，但头像、标题和消息来源改为双方用户。

## 8.5 后端需要新增的聊天契约

数据结构：

```ts
type ConversationView = {
  conversationId: string;
  matchId: string;
  counterpartId: string;
  counterpartDisplayName: string;
  lastMessage: string | null;
  updatedAt: string;
  unreadCount: number;
  isSynthetic: true;
};

type ChatMessageView = {
  messageId: string;
  conversationId: string;
  senderPersonaId: string;
  senderDisplayName: string;
  text: string;
  createdAt: string;
  isMine: boolean;
  isSynthetic: true;
};
```

最小接口：

```text
GET  /api/sessions/:id/conversations
GET  /api/sessions/:id/conversations/:conversationId/messages
POST /api/sessions/:id/conversations/:conversationId/messages
```

发送请求：

```json
{
  "text": "你好，我们先确认一下周末拍摄时间吧。"
}
```

后端规则：

- 使用当前 `x-demo-role-token` 确定发送者；
- 只有双方 Consent 为 `mutual_accepted` 才能生成或访问会话；
- 发送者必须是该连接的一方；
- 消息保存在当前进程的内存 Session 中；
- 返回面向页面的 `ConversationView` 与 `ChatMessageView`；
- 不由前端判断访问资格，不接受请求体中的 `senderPersonaId`。

API Client 增加：

```ts
getConversations()
getMessages(conversationId)
sendMessage(conversationId, text)
```

## 8.6 是否需要 WebSocket

黑客松 MVP 不需要。

推荐行为：

- 打开聊天页时读取一次消息；
- 发送成功后立即刷新消息；
- 演示 A/B 角色切换时重新读取；
- 如 UX 确实需要自动更新，可在聊天页可见期间每 2–3 秒轮询一次。

这样已经能表现真实双向消息状态，同时保持实现稳定。生产版本再迁移数据库和 WebSocket/SSE。

## 8.7 语音能力

Eazo/浏览器前端可以通过 `MediaRecorder` 完成录音和播放，现有后端也有 ASR、LLM、TTS Provider 结构。

但当前公开主流程的 `/voice/turn` 仍要求 `fixtureTranscript`，因此比赛展示时必须准确说明：

- 文本聊天和业务状态是真实后端闭环；
- 当前语音闭环可以使用 fixture 保证演示；
- 接入豆包 Key 后再切换真实 ASR 和 TTS。

语音不是消息功能第一阶段的阻塞项。

## 9. UI 与 UX 需要补充的交互状态

每个真实请求至少需要：

```text
idle
loading
success
error
```

重点页面：

- 首页：Session 初始化骨架屏和重试；
- 小天聊天：发送中、失败重发、滚动到底部；
- 意图确认：提交中，提交时禁止重复操作；
- 匹配页：匹配进度与无结果；
- 双方确认：当前角色、对方等待、已达成；
- 桥约：编辑中、确认中、等待对方；
- 用户聊天：空消息、发送中、失败、对方视角。

UI/UX 保持对布局、动画、图标、颜色和视觉层级的完全控制。Backend Owner 只注入数据和事件行为。

## 10. 实施顺序

### I1：首页真实数据

```text
startDemo()
→ getDashboard()
→ 真实数据渲染首页和灵宠
```

验收：

- `sessionStorage` 存在真实 Session；
- 首页不再读取静态 `ME/HOME_MATCHES/HOME_TODOS`；
- 后端关闭时展示错误，不展示伪成功数据。

### I2：小天聊天与意图

```text
输入心愿
→ organizeWish()
→ Intent 页面确认
→ publishIntent()
```

验收：ValueNode 和 Intent 均来自后端。

### I3：匹配与详情

```text
runMatching()
→ MatchCardView
→ MatchDetailView
```

验收：匹配度、双方价值、证据和未知项来自后端。

### I4：双方确认与桥约

```text
viewer consent
→ counterpart consent
→ pact edit
→ 双方 pact confirm
```

验收：无法绕过双方确认进入 active Pact。

### I5：用户聊天与成长闭环

```text
mutual consent
→ conversation
→ 双方发送消息
→ finish exchange
→ LifeTree growth
```

验收：未建立连接不能访问用户会话；A/B 角色可以看到同一会话并分别发送消息。

### I6：可选增强

- 真实 AI；
- 真实 ASR/TTS；
- 公网后端；
- 演示录像和容灾预案。

## 11. 并行分工

### Backend Owner

- 导入 Eazo 可编辑源码副本；
- 实现 API Client 和 Session Store；
- 绑定 I1–I5 的页面数据和按钮；
- 实现最小用户聊天 API；
- 保持 API Contract 冻结，只有消息功能增加新接口；
- 负责本地双服务联调和最终闭环验证。

### UI 美工

- 继续维护 Eazo 视觉、组件和素材；
- 不重命名已冻结的核心路由；
- 页面组件接受后端 ViewModel，不依赖静态业务字段；
- 配合补齐聊天详情页视觉。

### UX

- 定义页面状态、按钮反馈和角色切换体验；
- 定义聊天发送、失败、等待和空状态；
- 不在前端设计另一套 Consent/Pact 状态机。

三方联合点：

```text
每完成一个里程碑
→ Backend Owner 提供可运行页面
→ UX 验证状态与路径
→ UI 美工校正视觉
→ 再进入下一里程碑
```

## 12. 部署约束

本地地址 `127.0.0.1:8787` 只能被运行后端的同一台电脑访问。Eazo 公网页面无法连接团队成员电脑上的 localhost，也不能从 HTTPS 页面稳定调用本地 HTTP。

因此：

- 本机演示：同时运行 Eazo 和后端即可；
- 团队远程联调或公网演示：必须将后端部署为公开 HTTPS 地址；
- 当前使用内存 Session，公网后端应运行在单个持续进程中；
- 不建议直接部署到可能多实例、随请求冷启动的 Vercel Serverless，否则不同请求可能读取不到同一个内存 Session；
- 如使用七牛云云主机，后端监听地址需从 `127.0.0.1` 调整为 `0.0.0.0`，并通过 HTTPS 域名或反向代理暴露。

## 13. 完成定义

MVP 后端绑定完成需要同时满足：

1. Eazo 页面核心数据不再由前端静态数组驱动；
2. Session、角色和选中对象跨页面连续；
3. 心愿能够生成 ValueNode 和 Intent；
4. 匹配卡片和详情来自真实后端 ViewModel；
5. Consent 必须由双方分别确认；
6. Pact 必须先编辑后确认；
7. 完成交换后 LifeTree 发生变化；
8. 小天文本聊天真实调用后端；
9. 双方 Consent 后可以进行最小用户聊天；
10. `npm run verify`、Eazo lint/build 和完整演示脚本全部通过。

## 14. 最终技术判断

现有技术栈足够实现 Eazo 消息界面的聊天功能，不需要换栈。

最合理的黑客松方案是：

- 小天聊天直接复用现有 Pet API；
- 用户聊天新增 3 个 REST API 和一个消息详情页；
- 使用内存 Session 和角色 Token 保证真实双向状态；
- 使用刷新或短轮询代替 WebSocket；
- 真实语音与持久化数据库作为非阻塞增强项。

这能在有限时间里同时保留高质量 UI、真实后端闭环和可信的产品叙事。
