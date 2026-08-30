# 天使桥 MVP 后端开发交接文档

## 1. 文档目的

本文用于前端 / 产品向后端交接当前 MVP 产品设计，明确：

- 产品核心逻辑
- MVP 范围
- 核心数据对象
- 页面与接口对应关系
- AI 匹配逻辑
- 灵宠与成长系统的数据逻辑
- 用户操作状态流转
- 前后端联调顺序
- 后端优先级与暂缓功能

本版本以黑客松 / Demo 可跑通为第一目标，不追求一次性建设完整平台。

---

# 2. 产品一句话定义

**天使桥是一个 AI 原生的价值匹配平台。**

用户可以表达：

- 我是谁
- 我有什么
- 我需要什么
- 我愿意提供什么

系统通过 AI 理解用户、资源和需求，并匹配：

- 对的人
- 对的资源
- 对的服务
- 对的机会

灵宠作为用户进入产品的第一入口，承担：

**陪伴 + 提醒 + 解释 + 引导。**

---

# 3. MVP 核心闭环

当前版本只需要跑通一个最小闭环：

**注册 / 初始化用户**

↓

**形成用户基础价值画像**

↓

**进入灵宠首页**

↓

**发布一个心愿 / 资源 / 互换需求**

↓

**AI 将自然语言转成结构化需求**

↓

**系统匹配候选用户 / 资源**

↓

**返回匹配度 + 匹配原因**

↓

**用户发起连接**

↓

**进入消息 / 联系状态**

↓

**完成一次互助**

↓

**增加成长记录 / 天使能量 / 灵宠成长**

这是后端开发的第一优先级。

---

# 4. 当前 MVP 页面结构

## 4.1 灵宠首页

首页不再以“小树”为核心第一视觉。

第一视觉是：

**用户的灵宠。**

主要展示：

- 灵宠信息
- 灵宠当前状态
- 今日连接次数
- 今日收到回应数量
- 天使能量
- 人生小树成长摘要
- AI 推荐机会
- 未回复关系提醒

后端对应接口：

`GET /api/home`

建议直接做聚合接口。

返回：

```json
{
  "user": {},
  "pet": {},
  "stats": {},
  "tree": {},
  "recommendations": [],
  "pending_connections": []
}
```

MVP 不建议前端分别请求 6~8 个接口。

首页数据尽量由一个接口一次返回。

---

# 5. 核心数据模型

## 5.1 User 用户

```text
User
- id
- nickname
- avatar
- city
- bio
- created_at
- updated_at
```

---

## 5.2 UserProfile 用户价值画像

区别于普通个人资料。

这里存的是用于 AI 匹配的结构化画像。

```text
UserProfile
- user_id

- skills[]
- resources[]
- interests[]
- needs[]
- industries[]
- available_time
- preferred_exchange_type
- preferred_online_offline
- city

- ai_summary
- embedding
- updated_at
```

例如：

```json
{
  "skills": [
    "产品设计",
    "AI产品策划",
    "用户研究"
  ],
  "resources": [
    "AI工具经验",
    "创业项目经验"
  ],
  "interests": [
    "AI",
    "社交产品",
    "游戏"
  ],
  "preferred_exchange_type": [
    "技能互换",
    "经验交流"
  ]
}
```

MVP 可以先全部用 JSON 字段保存。

不需要一开始设计非常复杂的多表关系。

---

# 6. ValueCard 价值卡

用户对外可被匹配的能力和资源。

建议抽象为统一对象：

```text
ValueCard
- id
- user_id

- type
- title
- description

- tags[]
- category
- location
- online_available

- status

- embedding

- created_at
- updated_at
```

`type`：

```text
skill
resource
service
space
item
experience
other
```

例如：

```json
{
  "type": "skill",
  "title": "AI 产品方案梳理",
  "description": "可以帮助早期项目快速梳理 MVP 与产品路径",
  "tags": [
    "AI",
    "产品经理",
    "MVP"
  ]
}
```

---

# 7. Wish 心愿 / 需求

用户发布的需求统一进入 Wish。

```text
Wish
- id
- user_id

- title
- raw_text

- category

- need_type

- structured_need_json

- tags[]

- location
- online_available

- deadline

- exchange_offer

- status

- embedding

- created_at
- updated_at
```

其中最重要的是：

`raw_text`

和

`structured_need_json`

例如用户输入：

> 想找一个懂产品设计的人，今晚帮我快速看看天使桥的 MVP。

AI 转成：

```json
{
  "target": "产品设计师",
  "skills": [
    "UI UX",
    "产品设计",
    "原型评审"
  ],
  "purpose": "MVP评审",
  "time": "今晚",
  "duration": "30-60分钟",
  "mode": "线上",
  "priority": "high"
}
```

后端需要同时保存：

**原始文本 + AI 结构化结果。**

不要只保存 AI 输出。

---

# 8. AI 需求解析接口

接口：

`POST /api/ai/parse-wish`

输入：

```json
{
  "text": "想找一个懂产品设计的人今晚帮我看MVP"
}
```

返回：

```json
{
  "title": "寻找产品设计师进行MVP评审",
  "category": "skill",
  "tags": [
    "产品设计",
    "UI UX",
    "MVP"
  ],
  "structured_need": {},
  "suggested_exchange": [
    "AI产品经验交流",
    "商业模式梳理"
  ]
}
```

前端允许用户：

**确认 / 修改 / 发布。**

---

# 9. Match AI 匹配结果

这是天使桥后端最核心的数据。

建议建立：

```text
MatchResult
- id

- wish_id
- requester_id

- target_type
- target_id

- score

- semantic_score
- skill_score
- location_score
- availability_score
- exchange_score

- ai_reason

- status

- created_at
```

其中：

`target_type`

可以是：

```text
user
value_card
resource
```

---

# 10. MVP 匹配算法

第一版不需要训练模型。

可以采用：

**规则评分 + Embedding 语义匹配 + LLM 解释。**

建议：

```text
MatchScore =
0.40 × SemanticMatch
+
0.25 × SkillMatch
+
0.15 × ExchangeMatch
+
0.10 × LocationMatch
+
0.10 × AvailabilityMatch
```

### 语义匹配

需求 embedding 与：

- 用户画像
- ValueCard
- Resource

计算 cosine similarity。

### 技能匹配

需求标签：

```text
产品设计
UI UX
MVP
```

候选用户：

```text
产品设计
UI
交互设计
```

计算标签重合。

### 地理匹配

例如：

```text
同城 = 1
线上可完成 = 0.8
异地且要求线下 = 0
```

### 时间匹配

双方可用时间是否重合。

### 交换匹配

例如：

A 需要：

```text
UI设计
```

A 能提供：

```text
AI产品策划
```

B 能提供：

```text
UI设计
```

B 正需要：

```text
AI项目经验
```

则属于：

**双向高价值匹配。**

这应该成为天使桥非常重要的特征。

---

# 11. 匹配解释生成

匹配结果不能只返回：

```text
96%
```

必须返回：

**为什么推荐。**

接口可以：

`POST /api/ai/explain-match`

输入：

```json
{
  "wish": {},
  "requester_profile": {},
  "target_profile": {}
}
```

返回：

```json
{
  "reason": "她正在寻找 AI 产品项目积累案例，而你需要快速完成 MVP 产品评审。双方能力与需求形成互补，并且时间偏好一致。"
}
```

但实际实现时建议：

匹配完成后直接由后端生成并缓存。

不要用户每刷新一次页面重新调用 LLM。

---

# 12. Match API

请求：

`GET /api/wishes/{wish_id}/matches`

返回：

```json
{
  "items": [
    {
      "id": "match_001",
      "target": {
        "id": "user_002",
        "nickname": "林乔",
        "avatar": "",
        "title": "产品设计师"
      },
      "score": 0.96,
      "reason": "她正在寻找AI项目，而你需要产品设计评审。",
      "tags": [
        "产品设计",
        "MVP",
        "技能互换"
      ]
    }
  ]
}
```

---

# 13. Connection 连接关系

当用户点击：

**发起连接**

创建 Connection。

```text
Connection
- id

- initiator_user_id
- target_user_id

- wish_id
- match_id

- message

- status

- created_at
- updated_at
```

状态：

```text
pending
accepted
rejected
chatting
completed
cancelled
```

建议状态流：

```text
pending
↓
accepted
↓
chatting
↓
completed
```

---

# 14. 消息模块

黑客松 MVP 不建议开发完整 IM。

可以只做轻量消息表。

```text
Message
- id
- connection_id
- sender_id
- content
- message_type
- created_at
```

接口：

```text
GET /api/connections
GET /api/connections/{id}/messages
POST /api/connections/{id}/messages
```

MVP 可采用普通 HTTP。

暂时不用：

- WebSocket
- 消息撤回
- 已读回执
- 图片
- 文件
- 语音
- 群聊

如果 Demo 需要实时效果，再加 WebSocket。

---

# 15. 灵宠 Pet 数据模型

灵宠不是一个独立游戏。

它本质是：

**用户关系成长的可视化角色。**

```text
Pet
- id
- user_id

- species
- name

- level

- companion_value
- curiosity_value
- trust_value

- mood

- experience

- skin_id

- created_at
- updated_at
```

例如：

```json
{
  "name": "啾啾",
  "species": "rabbit",
  "level": 7,
  "companion_value": 76,
  "curiosity_value": 54,
  "trust_value": 63,
  "mood": "happy"
}
```

---

# 16. 灵宠成长规则

MVP 不需要复杂数值系统。

建议：

```text
发布真实心愿
+2 EXP

回应别人
+3 EXP

建立连接
+5 EXP

完成互助
+10 EXP

被别人帮助
+5 EXP

连续高质量互动
+额外成长
```

必须注意：

**不要鼓励刷行为。**

同一行为建议设置：

每日成长上限。

---

# 17. 人生小树 Tree

小树不是首页第一入口。

它是：

**长期关系和人生价值成长记录。**

建议：

```text
GrowthTree
- user_id

- level
- growth_value

- fruit_count
- leaf_count

- updated_at
```

另外增加：

```text
GrowthEvent
```

```text
GrowthEvent
- id
- user_id

- event_type

- related_user_id
- related_connection_id

- growth_value

- description

- created_at
```

例如：

```json
{
  "event_type": "help_completed",
  "growth_value": 10,
  "description": "帮助林乔完成一次AI产品梳理"
}
```

前端可以显示：

```text
💡
🤝
🎁
❤️
```

不同类型果实。

---

# 18. 首页聚合接口

建议：

`GET /api/home`

返回：

```json
{
  "pet": {
    "name": "啾啾",
    "level": 7,
    "mood": "happy",
    "message": "今天有3个人的心愿可能和你有关，要不要一起看看？"
  },

  "today_stats": {
    "connections": 5,
    "responses": 6,
    "angel_energy": 1000
  },

  "tree": {
    "level": 5,
    "weekly_fruits": 5
  },

  "recommendations": [
    {
      "type": "match",
      "title": "一位懂产品设计的人正在寻找AI项目",
      "score": 0.96
    }
  ],

  "pending": [
    {
      "type": "reply",
      "connection_id": "xxx"
    }
  ]
}
```

---

# 19. 此刻广场 Feed

信息流不是 MVP 最核心功能。

只需支持：

- 展示心愿
- 展示资源
- 展示互换
- 查看匹配度
- 点进详情

FeedItem 可以不用单独建立复杂模型。

直接聚合：

```text
Wish
+
ValueCard
+
Resource
```

接口：

`GET /api/feed`

参数：

```text
type
city
page
page_size
```

---

# 20. 前端页面与后端接口映射

## 灵宠首页

```text
GET /api/home
```

## AI 匹配

```text
POST /api/ai/parse-wish
POST /api/wishes
GET /api/wishes/{id}/matches
```

## 发布

```text
POST /api/ai/parse-wish
POST /api/wishes
POST /api/value-cards
```

## 此刻

```text
GET /api/feed
```

## 灵宠详情

```text
GET /api/pet
GET /api/growth-events
```

## 消息

```text
GET /api/connections
GET /api/connections/{id}/messages
POST /api/connections/{id}/messages
```

## 我的

```text
GET /api/users/me
GET /api/profile
PUT /api/profile
GET /api/wishes/me
GET /api/value-cards/me
```

---

# 21. 建议 API 前缀

统一：

```text
/api/v1
```

例如：

```text
GET /api/v1/home
```

---

# 22. 登录

黑客松 MVP 建议极简。

方案一：

Demo 用户自动登录。

方案二：

手机号 / 微信登录。

如果时间只有 48 小时：

优先：

**Demo Token。**

例如：

```http
Authorization: Bearer demo_token
```

先把业务闭环跑通。

---

# 23. 推荐技术架构

```text
Frontend
React / Next.js
      ↓
REST API
      ↓
Backend
FastAPI / Node.js
      ↓
PostgreSQL
      ↓
pgvector
      ↓
LLM API
```

推荐：

### 后端

FastAPI

原因：

- AI 接入方便
- Python Embedding 生态成熟
- 接口开发快
- 适合黑客松

### 数据库

PostgreSQL。

### 向量

pgvector。

MVP 不建议单独部署：

Milvus / Elasticsearch / Pinecone。

---

# 24. AI 服务层

后端建议单独封装：

```text
AIService
```

包含：

```text
parse_wish()
parse_profile()
create_embedding()
find_matches()
explain_match()
generate_pet_message()
```

不要在 Controller 里面直接写 LLM 请求。

---

# 25. Prompt 版本管理

Prompt 建议集中管理。

例如：

```text
prompts/
  parse_wish.txt
  profile_summary.txt
  match_explanation.txt
  pet_message.txt
```

否则多人开发非常容易失控。

---

# 26. 灵宠 AI 文案

灵宠可以调用 AI，但是 MVP 不需要每次打开首页调用。

建议后端根据：

```text
最近行为
+
待处理连接
+
推荐结果
```

生成：

```text
pet_message
```

例如：

> 今天有 3 个可能和你有关的心愿，我帮你挑了一个最合适的。

文案原则：

- 不催促
- 不制造焦虑
- 不强迫签到
- 不做“任务机器人”
- 更像人生伙伴

---

# 27. 数据库 MVP 最小表

建议第一版只建：

```text
users
user_profiles
pets
value_cards
wishes
match_results
connections
messages
growth_events
```

共：

**9 张核心表。**

足够完成 Demo。

---

# 28. 后端开发优先级

## P0：必须完成

### 用户

```text
User
UserProfile
```

### 发布

```text
Wish
ValueCard
```

### AI

```text
需求解析
Embedding
匹配
匹配解释
```

### 连接

```text
Connection
```

### 首页

```text
Home Aggregation
```

---

## P1：最好完成

```text
Message
Pet
GrowthEvent
Feed
```

---

## P2：比赛后再做

暂时不要做：

- 完整好友系统
- 关注
- 粉丝
- 复杂推荐流
- 信用积分
- 完整社交图谱
- 排行榜
- NFT
- 商城
- 灵宠复杂养成
- 大规模聊天
- 复杂评价体系
- 支付
- 复杂交换合同
- 多级会员
- 多 Agent 系统

---

# 29. 前后端联调顺序

建议严格按以下顺序。

## Step 1

后端先提供：

```text
GET /health
```

确认服务可用。

## Step 2

用户：

```text
GET /users/me
```

## Step 3

首页：

```text
GET /home
```

先用假数据。

前端即可完成 UI。

## Step 4

发布：

```text
POST /ai/parse-wish
```

↓

```text
POST /wishes
```

## Step 5

匹配：

```text
GET /wishes/:id/matches
```

## Step 6

连接：

```text
POST /connections
```

## Step 7

消息：

```text
POST /connections/:id/messages
```

## Step 8

完成互助：

```text
POST /connections/:id/complete
```

↓

后端：

```text
生成 GrowthEvent
更新 Pet
更新 Tree
```

完成闭环。

---

# 30. 最重要的状态机

Connection：

```text
PENDING
↓
ACCEPTED
↓
CHATTING
↓
COMPLETED
```

Wish：

```text
DRAFT
↓
PUBLISHED
↓
MATCHING
↓
CONNECTED
↓
COMPLETED
```

ValueCard：

```text
ACTIVE
↓
MATCHED
↓
PAUSED / CLOSED
```

后端不要只使用：

```text
0 / 1
```

必须显式状态。

---

# 31. AI 匹配的核心产品原则

天使桥不是：

**用户 A 和用户 B 兴趣相同。**

真正应该寻找：

**A 需要的东西，B 恰好能提供。**

进一步：

**B 需要的东西，A 最好也能提供。**

即：

```text
Need(A) → Value(B)

同时

Need(B) → Value(A)
```

这才是：

**价值置换。**

这是产品与传统社交推荐最大的区别。

---

# 32. Demo 推荐内置数据

比赛 Demo 建议预置：

```text
20 用户
30 ValueCard
20 Wish
10 Resource
若干 Connection
```

不要依赖现场真实用户生成数据。

否则 AI 匹配结果可能为空。

---

# 33. 后端需要给前端确认的内容

开发开始前，需要确认以下内容：

- API Base URL
- Swagger 地址
- Token 方式
- Response 统一格式
- Error Code
- User ID 类型
- 时间格式
- 分页格式
- 文件 / 图片地址格式

建议 Response：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

---

# 34. 错误返回

例如：

```json
{
  "code": 40001,
  "message": "wish not found",
  "data": null
}
```

前端不要依赖 HTTP message 字符串判断逻辑。

---

# 35. 当前开发完成标准 Definition of Done

只要 Demo 可以完整完成下面流程，即可认为 MVP 后端第一阶段完成：

用户打开天使桥

↓

看到自己的灵宠

↓

灵宠提示当前值得关注的机会

↓

用户输入：

> 我想找一个产品设计师帮我看 MVP

↓

AI 理解需求

↓

返回 3 个候选匹配

↓

每个匹配都有：

- 匹配度
- 匹配原因
- 对方能提供什么
- 用户能回馈什么

↓

用户点击：

**发起连接**

↓

进入消息页

↓

双方完成一次互助

↓

首页显示：

```text
灵宠成长
+
天使能量增加
+
人生小树长出一颗新的果实
```

到这里即形成：

**需求 → AI → 人 → 连接 → 成长**

完整闭环。

---

# 36. 下一步产品与后端共同要做的事情

## 第一件：锁定数据模型

优先确定：

```text
User
UserProfile
Wish
ValueCard
MatchResult
Connection
Pet
GrowthEvent
```

字段一旦确定，前后端立即可以并行开发。

## 第二件：确定 AI 输入输出 JSON

尤其是：

```text
parse_wish
match
explain_match
```

必须先定义 JSON Schema。

避免后期 Prompt 每修改一次，前端一起崩。

## 第三件：后端先输出 Mock API

即使数据库和 AI 还没完成，也应该先提供：

```text
/home
/wishes
/matches
/connections
```

Mock Response。

这样前端可以立即接接口。

## 第四件：真实 AI 替换 Mock

UI 跑通之后再接：

```text
LLM
Embedding
Vector Search
```

## 第五件：完成一次完整 Demo 数据流

测试：

```text
发布心愿
→ AI解析
→ 匹配
→ 连接
→ 完成
→ 灵宠成长
```

这是本阶段唯一真正必须稳定的主流程。

---

# 37. 产品核心共识

整个系统开发过程中请始终围绕一句话判断功能是否必要：

> **用户不需要经营流量或人脉，只需要表达真实的自己、拥有的价值和当下的需求，AI 帮他找到此时此刻真正适合连接的人和资源。**

灵宠解决：

**陪伴感。**

AI 解决：

**理解和匹配。**

连接解决：

**真实行动。**

小树解决：

**长期价值沉淀。**

这四部分共同构成天使桥的核心产品结构。
