# 天使桥｜本地 Fixture API 联调手册

> 状态：数据库、真实 AI、Vercel 接入前的可运行版本。  
> 数据口径：所有人物、联系方式、资源、位置、匹配、桥约和语音均为合成演示数据。  
> 适用对象：按最终前端稿实现“此刻—小天—搭桥—桥约—生命树”的开发成员。

## 1. 当前交付结论

本地后端已经能够在不调用任何外部服务的情况下完成：

```text
创建演示会话
→ 以 A 身份输入文字或 Fixture 语音
→ 查看、编辑并确认 Value Node
→ 设置 Offer / Need / Exchange / Constraints / Boundary
→ 激活心愿并通过规则或 Fixture AI 得到 3 个排序候选
→ 从任意候选发起连接，A、B 分别同意
→ 分阶段开放联系信息
→ 编辑并分别确认桥约
→ 完成或退出桥约
→ Outcome 写回生命树
```

这套接口使用 Web 标准 `Request/Response`，不依赖 Express、Next.js、数据库或云平台。以后迁移到 Next.js Route Handler 时，可以复用应用服务和 Zod 合同，只替换入口与存储。

## 2. 启动与验证

```powershell
npm install
npm run verify
npm run api:dev
```

默认监听：`http://127.0.0.1:8787`。

健康检查：

```http
GET /api/health
```

所有业务响应统一为：

```json
{
  "data": {},
  "meta": {
    "requestId": "...",
    "dataMode": "fixture",
    "isSynthetic": true
  }
}
```

错误响应统一为：

```json
{
  "error": {
    "code": "invalid_request",
    "message": "request validation failed"
  }
}
```

## 3. 演示身份

创建 Session 是唯一不需要身份 Token 的业务操作：

```http
POST /api/demo/sessions
Content-Type: application/json

{"scenarioId":"studio-photography"}
```

可选案例：

- `studio-photography`：工作室 × 品牌摄影；
- `product-web`：产品策划 × 网页开发；
- `rural-content`：田园空间 × 内容运营。

响应中的 `roles` 为每个合成角色返回独立 Token。后续请求必须携带：

```http
X-Demo-Role-Token: <roles[n].token>
```

Token 只属于一个 Session 和一个 Persona。它是本地联调用的身份替身，不是生产认证方案。

## 4. 页面与接口映射

| 前端页面/模块 | 方法与路径 | 后端承载内容 |
|---|---|---|
| 此刻首页 | `GET /api/sessions/:id/dashboard` | 灵宠话术、当前阶段、3 个候选、待办与成长摘要 |
| 会话状态 | `GET /api/sessions/:id/status` | 当前角色、已确认节点、Consent、Pact 状态 |
| 小天文字理解 | `POST /api/sessions/:id/parse` | Fixture 解析结果；记录本次原始表达 |
| 小天受控对话 | `POST /api/sessions/:id/pet/turn` | 整理表达、解释匹配或提示下一步 |
| 小天对话历史 | `GET /api/sessions/:id/pet/turns` | 当前角色在本 Session 的文字轮次 |
| 小天语音 | `POST /api/sessions/:id/voice/turn` | Fixture ASR→结构化→TTS 完整返回 |
| 语音历史 | `GET /api/sessions/:id/voice/turns` | 当前角色在本 Session 的语音轮次 |
| 编辑资源卡 | `PATCH /api/sessions/:id/nodes/:nodeId` | 标题、描述、关键词、交付物、可见范围 |
| 删除资源卡 | `DELETE /api/sessions/:id/nodes/:nodeId` | 删除节点并同步移除 Intent 引用 |
| 确认解析结果 | `POST /api/sessions/:id/nodes/confirm` | 确认选中的 Value Node |
| 意图确认 | `PUT /api/sessions/:id/intent` | Offer、Need、交换方式、条件、边界 |
| 发布心愿 | `POST /api/sessions/:id/intent/activate` | 仅允许发布全部已确认的节点 |
| 小天搭桥 | `POST /api/sessions/:id/matches/run` | Hard Gate、双向匹配、排序；可选规则或 Fixture AI 模式 |
| 候选列表 | `GET /api/sessions/:id/matches` | 只返回当前角色参与的匹配 |
| 一座桥 | `GET /api/sessions/:id/matches/:matchId` | 双方价值、证据、条件、未知项与桥指数 |
| 表达意愿 | `POST /api/sessions/:id/matches/:matchId/consent` | A、B 分别接受或拒绝 |
| 双方确认状态 | `GET /api/sessions/:id/consent` | 双方决定与聚合状态 |
| 信息开放 | `GET /api/sessions/:id/connection` | 匹配、互相同意、桥约生效三个披露阶段 |
| 桥约 | `GET /api/sessions/:id/pact` | 草稿或已生效桥约 |
| 编辑桥约 | `PATCH /api/sessions/:id/pact` | 时间、地点、差价、第一步、完成和退出规则 |
| 确认桥约 | `POST /api/sessions/:id/pact/confirm` | A、B 分别确认，不能由前端直接改状态 |
| 结束桥约 | `POST /api/sessions/:id/pact/finish` | `completed` 或 `exited`，生成双方 Outcome |
| 生命树 | `GET /api/sessions/:id/tree?view=detail` | 资源、心愿、目标、成果和成长摘要 |
| 生命树可见度 | `PATCH /api/sessions/:id/tree` | `private/tree_only/summary/detailed` |
| 消息入口 | `GET /api/sessions/:id/inbox` | 从服务端状态派生的当前待办 |
| 重置演示 | `POST /api/sessions/:id/reset` | 仅 viewer 角色可重置当前 Session |

## 5. 关键请求体

### 5.1 确认节点

```json
{"nodeIds":["studio-a:offer:space","studio-a:need:service"]}
```

### 5.2 设置意图与边界

```json
{
  "offerNodeIds": ["studio-a:offer:space"],
  "needNodeIds": ["studio-a:need:service"],
  "goalNodeIds": [],
  "acceptedExchangeModes": ["barter", "collaboration"],
  "constraints": {
    "locations": ["北京朝阳"],
    "availability": ["下周末"]
  },
  "disclosurePolicy": {
    "matchLocationPrecision": "region",
    "contactDisclosure": "after_mutual_consent",
    "exactLocationDisclosure": "after_pact_active"
  }
}
```

### 5.3 Fixture 语音

```json
{
  "audioBase64": "Zml4dHVyZS1hdWRpbw==",
  "contentType": "audio/webm",
  "fixtureTranscript": "我有周末工作室，希望置换品牌摄影。"
}
```

这里返回静音 WAV 作为可播放的合成占位音频。真实 ASR、LLM、TTS 接入后保持响应合同不变。

### 5.4 运行匹配

推荐使用 Fixture AI 混合评分：

```json
{"mode":"fixture_ai"}
```

也可显式使用纯规则基线：

```json
{"mode":"rule"}
```

不传请求体时默认为 `fixture_ai`。候选列表返回稳定的页面卡片模型：`matchId`、对方名称、桥指数、双方价值摘要、未知项数量和评分模式；完整证据只在匹配详情返回。

### 5.5 小天受控文字对话

```json
{
  "message": "为什么这个摄影师适合我？",
  "intent": "explain_match",
  "matchId": "match:studio-a:studio-b"
}
```

`intent` 只允许：

- `organize`：整理当前合成档案中的拥有与需要；
- `explain_match`：只引用已有 Match Proof 解释连接；
- `next_step`：根据服务端当前阶段提示下一步。

这不是开放域聊天，Fixture 模式不会编造档案之外的信息。

### 5.6 同意连接

```json
{"decision":"accepted"}
```

### 5.7 编辑桥约

```json
{
  "timeWindow": "本周六 10:00-18:00",
  "locationSummary": "北京朝阳",
  "costOrDifference": "优先互换，可协商补差价",
  "firstAction": "先发 3 张场地参考图",
  "completionCriteria": ["交付 12 张精选照片", "完成 3 张基础精修"],
  "exitRule": "无法履约时提前 24 小时告知"
}
```

## 6. 前端联调规则

1. 首次进入先创建 Session，并在本地开发状态保存 viewer Token；
2. 需要模拟 B 方时切换到 candidate Token，不能复用 A 的 Token；
3. 页面阶段以 `status.stage` 和 Dashboard 返回值为准，不在前端自行推进；
4. Match ID 含 `:`，拼接 URL 时使用 `encodeURIComponent`；
5. 匹配卡片直接读取顶层 `matchId`，不要从内部 `proof` 取 ID；
6. 当前轮询 `status`、`consent` 或 `pact` 即可模拟对方状态变化，不需要 WebSocket；
7. 所有界面明确显示“合成演示数据”，不得作为真实匹配或真实成交数据展示。

## 7. 外部接入时只替换什么

| 外部能力 | 当前实现 | 后续替换点 | 保持不变 |
|---|---|---|---|
| 数据库 | `InMemoryDemoService` + SQL Migration/Seed | 实现 `SessionRepository` 并接 Supabase | 领域合同、状态规则、HTTP 响应 |
| 语言理解 | Fixture ParseResult | 豆包方舟 Provider | ParseResult Schema、节点确认页 |
| 语义评分 | 规则评分或 Fixture AI 评分 | 方舟 Function Calling | Hard Gate、评分换算、Match Proof |
| 语音识别 | Fixture transcript | 豆包极速 ASR | Voice Turn 请求上下文 |
| 语音合成 | 静音 WAV | Seed-TTS | Base64 音频响应 |
| 部署 | 本地 Node Server | Vercel Route Handler 或云主机 | `createApiHandler` 与应用服务 |

## 8. 当前验收结果

- TypeScript 严格类型检查通过；
- 13 个测试文件、54 个测试通过；
- HTTP 测试覆盖从 Session 创建到 Outcome 写回生命树；
- 测试覆盖 Top 3 任意候选、无匹配、拒绝后改选、退出、幂等、跨 Session Token、请求校验、信息分阶段开放、Fixture 语音和小天文字对话；
- 未调用数据库、真实 AI 或云部署 API。

数据库前置文件：

- `database/migrations/001_initial.sql`：Postgres 表结构与索引；
- `database/seed/001_demo_scenarios.sql`：三个合成场景目录；
- `src/repository/contracts.ts`：后续持久化适配器必须实现的最小接口。
