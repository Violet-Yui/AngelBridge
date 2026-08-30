# 天使桥 AngelBridge｜产品设计与协作方案

> **赛道**：软件应用赛道 · 命题「滴水穿石」
> **作品名称**：天使桥 AngelBridge
> **Slogan**：做彼此的天使 —— 凡人托举彼此的地方
> **一句话描述**：一个 AI 原生的「人生价值置换」平台。每个人把自己**拥有的**和**需要的**挂在一棵会成长的"人生树"上，AI 灵宠「小天」像贴身经纪人一样，替主人在人海中寻找价值互补的人与资源，让普通人之间互相托举。
> **命题呼应**：「滴水穿石」—— 人生树的成长分靠一次次微小的价值置换一点点积累，水滴石穿；平台上每一次凡人间的互助，都是穿石的一滴水。

**仓库现状说明**：`main` / `UI` 分支目前只有 README 和 .gitignore（团队基线，未开始编码）。本文档即为团队对齐基线，建议以 PR 合入 `main` 的 `docs/` 目录，达成共识后按本文分工开工。

---

## 目录

1. [产品全景与 MVP 范围](#1-产品全景与-mvp-范围)
2. [核心业务主流程](#2-核心业务主流程)
3. [逐页面组件与交互逻辑分析](#3-逐页面组件与交互逻辑分析)
4. [AI 设计：匹配引擎与灵宠小天](#4-ai-设计匹配引擎与灵宠小天)
5. [数据模型与种子数据](#5-数据模型与种子数据)
6. [API 契约](#6-api-契约)
7. [技术栈与目录结构](#7-技术栈与目录结构)
8. [前后端分工（4 人）](#8-前后端分工4-人)
9. [48 小时排期与协作规范](#9-48-小时排期与协作规范)
10. [演示剧本与提交清单核对](#10-演示剧本与提交清单核对)

---

## 1. 产品全景与 MVP 范围

### 1.1 产品全景思维导图

```mermaid
mindmap
  root((天使桥<br/>AngelBridge))
    人生树
      七维资料挂载
        年龄 情感 身体
        财产 技能
        能力价值 潜力
        梦想
      成长分与阶段
        幼苗期
        青年期
        壮年期·扎根积累
      拥有的 / 需要的 / 心愿
      可见性开关
        公开展示
        仅示意不展示细节
        完全隐私
      好运包 / 匹配项计数
    AI灵宠 小天
      形象与命名
        16款灵宠可选
        名字可自定义
      主动弹话
        问候 / 匹配播报
        情绪价值陪伴
      对话能力
        文字对话
        语音对话-识别声纹
        解释匹配理由
      经纪人能力
        整理主人需求
        方案拆解-旅游/租房案例
        持续跟踪匹配
      随成长升级
    智能匹配
      找人 找物
      匹配度百分比
      匹配理由生成
      需求-供给互补
      待确认事项
        去签约
        已发邀约
    信息流
      此刻-双列瀑布流
      发现-推荐流
      频道tab
        人生树 找人 找物
        资源 闲置 经验 视频
      关注流
    社区愿景
      彼此帮扶的社区
      每个女孩被好好守护
      流量焦虑与人脉解脱
```

### 1.2 MVP 三层取舍（48 小时）

| 层级 | 含义 | 功能 |
|---|---|---|
| ✅ **Must（真做）** | 完整实现、真数据真 AI | 人生树页（3 档静态树 + 资料挂载）、资料填写表单、AI 匹配引擎、此刻双列信息流（含匹配度标签）、卡片详情页、灵宠气泡 + 文字对话、底部导航 |
| 🎭 **Fake（假做/演示态）** | UI 存在，逻辑用占位或写死 | 灵宠 16 选 1（静态页，选谁都是同一逻辑）、去签约（点击 toast「已发起意向」）、消息页（展示与小天的对话记录即可）、我的页（半静态）、发现 tab（复用此刻数据换排序） |
| ⏳ **Later（不做，口头讲）** | 路演时作为规划展示 | 语音识别与声纹判断、树的生长动画、交易/签约闭环、好运包玩法、关注流、视频频道、灵宠随成长升级 |

```mermaid
mindmap
  root((48h MVP))
    Must 真做
      人生树页
      资料表单
      AI匹配引擎
      此刻信息流
      卡片详情
      灵宠对话
      底部导航
    Fake 演示态
      灵宠选择页
      去签约toast
      消息页
      我的页
      发现tab
    Later 只讲不做
      语音交互
      生长动画
      交易闭环
      好运包
      灵宠升级
```

**取舍原则**：评审标准是「真正解决一个具体问题、可运行可体验」，不鼓励功能堆砌。所以把全部真实工作量押在一条链路上：**填人生树 → AI 匹配 → 信息流看到匹配 → 问灵宠为什么匹配**。这条链路每一步都必须是真的。

---

## 2. 核心业务主流程

```mermaid
flowchart TD
    A[首次打开 App] --> B[选择灵宠形象<br/>静态页·MVP固定小天]
    B --> C[灵宠引导填写人生树<br/>七维资料 + 拥有的/需要的]
    C --> D[后端计算成长分<br/>确定树阶段]
    D --> E[AI 匹配引擎运行<br/>用户画像 × 候选池]
    E --> F[匹配结果落库<br/>match 表缓存]
    F --> G[进入此刻信息流<br/>卡片带匹配度标签]
    G --> H{用户行为}
    H -->|点卡片| I[卡片详情页<br/>看匹配理由/对方需求]
    H -->|点灵宠气泡| J[灵宠对话页]
    H -->|点人生树tab| K[人生树页<br/>看资料/改资料]
    I -->|去签约| L[toast: 已发起意向<br/>MVP假闭环]
    J --> M[小天解释匹配理由<br/>LLM带匹配上下文]
    M --> G
    K -->|资料变更| D
    L --> G

    style E fill:#f9e79f
    style M fill:#f9e79f
    style L fill:#fadbd8
```

黄色 = AI 节点（Claude API）；红色 = 假闭环节点。

---

## 3. 逐页面组件与交互逻辑分析

### 3.0 全局框架：底部导航

```mermaid
mindmap
  root((App Shell))
    顶部区
      搜索icon
      关注 / 此刻 切换
      频道tab条
    路由容器
      信息流页 /
      人生树页 /tree
      详情页 /item/:id
      对话页 /chat
      资料表单 /tree/edit
      灵宠选择 /pet
      消息 /messages
      我的 /me
    底部导航5钮
      天使桥-信息流
      消息
      创建+
      灵宠/树入口
      我
    全局悬浮
      灵宠气泡组件
      Toast组件
```

**导航逻辑**：底部 5 钮对应设计图（天使桥 / 消息 / ➕创建 / 灵宠 / 我）。「➕创建」MVP 弹一个「发布需求/资源」简化表单（直接写入 item 表），做不完就 toast「敬请期待」。

---

### 3.1 此刻信息流页（首页，A 负责）

#### 组件树

```mermaid
mindmap
  root((此刻信息流页))
    顶部栏
      搜索icon-仅UI
      关注tab-禁用置灰
      此刻tab-默认选中
    频道tab条
      人生树 找人 找物
      资源 闲置 经验 视频
      MVP仅 全部/找人/找物 可点
    双列瀑布流
      卡片Card
        封面图
        匹配标签-右上角
          类型: 找人/找物/资源
          匹配度: 98%
        标题文案
        发布者头像昵称
        点赞数-仅展示
    灵宠悬浮气泡
      头像
      弹话文案
      点击进入对话
    底部导航
```

#### 交互流程

```mermaid
flowchart TD
    A[进入首页] --> B[GET /api/feed?channel=all]
    B --> C{有匹配结果?}
    C -->|有| D[卡片按匹配度降序<br/>渲染匹配标签 找人·98%]
    C -->|无/未填资料| E[卡片按时间排序<br/>不显示匹配标签]
    D --> F[灵宠气泡弹话:<br/>主人,今天有N个人的需求与你高度匹配]
    E --> G[灵宠气泡弹话:<br/>主人,先去种下你的人生树吧]
    F --> H{用户操作}
    G --> H
    H -->|切换频道tab| I[GET /api/feed?channel=xx 重新渲染]
    H -->|点击卡片| J[跳转 /item/:id]
    H -->|点击灵宠气泡| K[跳转 /chat]
    H -->|下拉刷新| B
```

**组件要点**：
- 瀑布流用 CSS `columns: 2` 即可，不引重型库；
- 匹配标签是 demo 的视觉焦点，颜色按类型区分（找人=粉、找物=蓝、资源=绿），与设计图右上角标签一致；
- 「发现」tab 复用同一组件，接口传 `?mode=discover`（后端换个排序），成本≈0。

---

### 3.2 人生树页（B 负责）

#### 组件树

```mermaid
mindmap
  root((人生树页))
    树可视区
      树图-按成长分3档切换
        幼苗 0-499
        小树 500-999
        壮年 1000+
      阶段文案-壮年期·扎根积累
      成长分徽标-1000
      树上挂果
        拥有的-橙色果
        需要的-红色果S标
        点击果子弹资料气泡
    可见性开关
      眼睛icon
      公开/仅示意/隐私 三态
    统计条
      我的拥有 N
      我的心愿 N
      发现机会 N
    小天为你匹配的
      横滑卡片 匹配度88-99%
      查看全部→信息流
    待确认事项
      领袖新链公寓 3600/月 去签约
      腾讯AI工程师offer 已发邀约
    灵宠区
      灵宠立绘
      弹话气泡
    编辑入口
      笔icon→资料表单
```

#### 交互流程

```mermaid
flowchart TD
    A[进入人生树页] --> B[GET /api/tree/me]
    B --> C{已填资料?}
    C -->|否| D[显示幼苗 + 引导按钮<br/>灵宠: 来种下第一片叶子吧]
    C -->|是| E[按成长分渲染树档位<br/>挂果: 拥有的/需要的]
    D -->|点引导| F[跳 /tree/edit 表单]
    E --> G{用户操作}
    G -->|点果子| H[弹出资料气泡<br/>如: 技能·10项 / 需要·女装爱好者合伙人]
    G -->|点眼睛icon| I[切换可见性三态<br/>PATCH /api/tree/visibility]
    G -->|点编辑笔| F
    G -->|点匹配卡片| J[跳 /item/:id]
    G -->|点去签约| K[toast: 已发起意向 ✓<br/>按钮变为 已发邀约]
    F -->|保存| L[POST /api/tree<br/>后端重算成长分+触发重新匹配]
    L --> B
```

**成长分规则（MVP 简化，写死在后端）**：

```
成长分 = 资料完整度分(每维填写+100, 共7维) + 拥有项×30 + 需要项×20 + 心愿×50
档位:  0–499 幼苗 / 500–999 小树 / 1000+ 壮年·扎根积累
```

演示账号预填到 1000+，正好对应设计图「壮年期·扎根积累 成长分1000」。树的三档图由 D 用 AI 生图产出，**不做生长动画**，切档时加 0.3s 淡入即可有"进化感"。

---

### 3.3 资料编辑表单（B 负责）

```mermaid
flowchart TD
    A[进入 /tree/edit] --> B[分组表单]
    B --> C[基础七维<br/>年龄/情感/身体/财产/技能/能力价值/潜力]
    C --> D[梦想 一句话<br/>如: 帮中国打造顶级教育体系]
    D --> E[我拥有的 多条<br/>类型+标题+描述 如: 房产·20套房]
    E --> F[我需要的 多条<br/>如: 可爱女孩爱心伙伴/优秀发工]
    F --> G[逐维可见性勾选<br/>公开/隐私]
    G --> H[提交 POST /api/tree]
    H --> I[后端: 存库→算成长分→异步触发匹配]
    I --> J[返回人生树页 树已更新]
```

**要点**：表单是数据源头，字段名与 [第5节数据模型](#5-数据模型与种子数据) 完全一致，B 和 C 在第 2 小时对齐后冻结。每个字段旁的小锁 icon 对应设计图的"隐私模式"，MVP 只存标记、在他人视角隐藏该字段。

---

### 3.4 灵宠小天（B 前端 / C prompt）

#### 气泡弹话状态机

```mermaid
flowchart TD
    A[灵宠气泡组件挂载] --> B{当前页面上下文}
    B -->|首页·有新匹配| C["主人,今天有3个人的需求<br/>与你高度匹配,已按匹配度排好了"]
    B -->|首页·无资料| D["主人,先去种下你的人生树吧"]
    B -->|人生树页| E["主人的树又长高了一点点~"]
    B -->|详情页| F["这位主人和你的需求互补度很高哦"]
    C --> G{用户点击气泡}
    D --> G
    E --> G
    F --> G
    G -->|点击| H[进入 /chat 对话页<br/>携带当前上下文]
    G -->|8秒无操作| I[气泡收起 仅留头像]
```

弹话文案 MVP **前端按页面上下文写死**（不走 LLM，省 token 省延迟），只有对话页走真 LLM。

#### 对话页流程（真 AI）

```mermaid
sequenceDiagram
    participant U as 用户
    participant W as 前端对话页
    participant S as 后端 /api/chat
    participant L as Claude API

    U->>W: 输入"为什么给我匹配这个offer?"
    W->>S: POST /api/chat {text, context_item_id}
    S->>S: 组装上下文: 灵宠人设prompt<br/>+ 用户人生树 + 相关匹配结果+理由
    S->>L: messages 调用 (stream)
    L-->>S: "主人,因为你挂了'AI技能·10项'..."
    S-->>W: SSE 流式返回
    W->>U: 气泡逐字渲染
    Note over W: 底部快捷chips:<br/>今日匹配 / 帮我优化资料 / 陪我聊聊
```

#### 灵宠选择页（Fake，静态）

16 宫格灵宠图（D 用 AI 生图批量产出，对应设计图的鼠/龙/虎/兔等），点击任意一只 → 存 `pet_avatar` 字段 → 进入引导。所有灵宠共用同一套逻辑与人设，仅头像不同——成本 1 小时，但演示时"选择你的守护灵宠"仪式感很强，值得保留。

---

### 3.5 卡片详情页（A 负责）

```mermaid
flowchart TD
    A[进入 /item/:id] --> B[GET /api/item/:id]
    B --> C[渲染: 大图/标题/描述<br/>发布者头像昵称]
    C --> D{与我有匹配?}
    D -->|有| E[匹配度大字 98%<br/>+ AI匹配理由段落<br/>你拥有X ↔ 对方需要X]
    D -->|无| F[普通详情展示]
    E --> G{操作}
    F --> G
    G -->|去签约/发起意向| H[POST /api/intent<br/>toast: 已发起意向,小天会持续跟进]
    G -->|问问小天| I[跳 /chat 带 item 上下文]
```

匹配理由段落是**评审最能感知 AI 价值的位置**，格式固定为「你拥有的 ___ ↔ 对方需要的 ___」对仗句式，由匹配引擎 JSON 直接给出。

---

### 3.6 消息页 & 我的页（Fake，A 顺手做）

- **消息页**：一个列表，仅两类会话——与小天的对话（点击进 /chat）、系统通知「你对 XX 发起了意向」。
- **我的页**：头像昵称 + 我的人生树入口 + 我发布的卡片列表。均为一屏静态布局 + 真数据填充，合计 ≤2 小时。

---

## 4. AI 设计：匹配引擎与灵宠小天

### 4.1 匹配引擎架构

```mermaid
flowchart TD
    A[触发: 资料保存后 / 定时] --> B[取当前用户画像<br/>七维+拥有+需要+梦想]
    B --> C[取候选池<br/>种子30条 item + 其他用户树]
    C --> D[Claude API 单次调用<br/>system: 匹配官prompt<br/>要求输出严格JSON数组]
    D --> E{JSON解析成功?}
    E -->|是| F[逐条校验 score 0-100<br/>reason 非空]
    E -->|否/超时| G[规则兜底打分]
    G --> H[标签交集分×40<br/>+ 需求供给互补分×60]
    F --> I[写入 match 表<br/>user_id, item_id, score, reason]
    H --> I
    I --> J[信息流/详情页/灵宠对话 读取]

    style D fill:#f9e79f
    style G fill:#d6eaf8
```

**匹配官 prompt 要点**（C 负责调优）：

```
你是"天使桥"的价值匹配官。给定【用户画像】和【候选列表】,
为每个候选打匹配分(0-100)并给一句匹配理由。
理由必须是对仗句式: "TA拥有的「X」正是你需要的「Y」"或反向。
只输出 JSON 数组: [{"item_id": "...", "score": 98, "reason": "..."}]
不允许输出任何其他文字。分数请拉开梯度,最高不超过99。
```

**兜底规则**（保证 demo 永远有匹配度数字）：

```
score = 40 × (双方标签交集数 / 标签并集数)
      + 60 × (我的"需要"命中对方"拥有"的条数 / 我的"需要"总数)
reason = 模板拼接: "TA拥有的「{命中项}」正是你需要的"
```

### 4.2 灵宠人设 prompt 要点（C 负责）

```
你是"小天",用户在天使桥的AI守护灵宠兼人生经纪人。
称呼用户为"主人"。语气温暖、俏皮、有情绪价值,每次回复≤80字。
你能看到: 主人的人生树资料、今日匹配结果与理由。
职责: ①播报和解释匹配 ②建议如何完善资料提高匹配 ③陪伴聊天。
不编造不存在的匹配;涉及交易只说"我会帮你持续跟进",不承诺结果。
```

### 4.3 Token 与稳定性预算

- 匹配调用：每用户 1 次/资料变更，候选池 30 条 ≈ 3k tokens，结果**落库缓存**，信息流读缓存不重复调用；
- 对话调用：流式输出，8s 超时则回退固定话术「主人，小天走神了，再说一次好吗？」；
- Demo 前预热：演示账号的匹配结果提前跑好存库，**现场断网也能展示信息流和匹配理由**（仅实时对话依赖网络）。

---

## 5. 数据模型与种子数据

```mermaid
erDiagram
    USER ||--|| LIFE_TREE : has
    USER ||--o{ ITEM : publishes
    USER ||--o{ MATCH : receives
    ITEM ||--o{ MATCH : matched_in
    USER ||--o{ MESSAGE : chats
    USER ||--o{ INTENT : initiates
    ITEM ||--o{ INTENT : target

    USER {
        int id PK
        string nickname
        string avatar
        string pet_avatar "选中的灵宠"
        string pet_name "默认:小天"
    }
    LIFE_TREE {
        int user_id PK
        json basics "年龄/情感/身体/财产/技能/能力价值/潜力"
        string dream "梦想一句话"
        json owns "拥有的[{type,title,desc,visible}]"
        json needs "需要的[{type,title,desc}]"
        int growth_score "成长分"
        string stage "sapling/young/mature"
        string visibility "public/partial/private"
    }
    ITEM {
        int id PK
        int user_id FK
        string type "person/goods/resource/idle/exp"
        string title
        string cover_img
        string description
        int likes
        datetime created_at
    }
    MATCH {
        int id PK
        int user_id FK
        int item_id FK
        int score "0-100"
        string reason "匹配理由"
        string source "llm/rule"
    }
    MESSAGE {
        int id PK
        int user_id FK
        string role "user/pet"
        string content
        datetime created_at
    }
    INTENT {
        int id PK
        int user_id FK
        int item_id FK
        string status "sent"
    }
```

**种子数据策略（D 负责编写，第 8 小时前入库）**：30 条 item + 8 个虚拟用户树，内容直接采用设计图案例保证演示一致性——领袖新链公寓 3600/月、腾讯 AI 工程师 offer 53600/月、女装品牌合伙人、"一起打造实实爱情公寓"、"探讨情绪价值的产品"、奶茶新品体验等。演示主账号的"需要的"必须与其中 3–5 条强互补，保证匹配度能打到 90%+。

---

## 6. API 契约

Base URL：`/api`，全部 JSON。MVP 用固定演示账号，`Authorization: Bearer demo-token`（免注册登录流程，省 3 小时）。

| # | 方法 | 路径 | 用途 | 请求要点 | 响应要点 |
|---|---|---|---|---|---|
| 1 | GET | `/feed` | 信息流 | `?channel=all\|person\|goods&mode=now\|discover` | `[{item, match:{score,reason}\|null}]` |
| 2 | GET | `/item/:id` | 卡片详情 | - | `{item, publisher, match}` |
| 3 | GET | `/tree/me` | 我的人生树 | - | `{basics, dream, owns, needs, growth_score, stage, stats}` |
| 4 | POST | `/tree` | 保存资料 | 表单全量 JSON | `{growth_score, stage}` 并异步触发匹配 |
| 5 | PATCH | `/tree/visibility` | 可见性 | `{visibility}` | `{ok}` |
| 6 | GET | `/matches` | 匹配列表 | `?limit=10` | `[{item, score, reason}]` |
| 7 | POST | `/chat` | 灵宠对话 | `{text, context_item_id?}` | SSE 流式文本 |
| 8 | POST | `/intent` | 发起意向 | `{item_id}` | `{ok, status:"sent"}` |
| 9 | POST | `/item` | 发布卡片(创建+) | `{type,title,description}` | `{id}` |

**契约冻结机制**：第 2 小时由 A+C 在 `docs/api.md` 写下每个接口的完整 JSON 示例并 merge 到 main，**冻结**。前端立即据此写 `web/src/mocks/` 假数据开发；C 实现真接口后前端一行切换 baseURL 联调。改契约必须四人同步。

---

## 7. 技术栈与目录结构

| 层 | 选型 | 理由 |
|---|---|---|
| 前端 | React 18 + Vite + Tailwind CSS + react-router | 移动端 H5，手机浏览器演示，免 App 审核与打包 |
| 后端 | Node.js + Hono/Express + better-sqlite3 | 单文件数据库零运维，48h 最稳 |
| AI | Claude API（匹配引擎 + 灵宠对话，流式） | JSON 输出稳定，中文人设自然 |
| 部署 | 一台云主机 (Caddy 反代) ；备选 Vercel 前端 + 云主机后端 | 手机扫码直达，满足"可体验链接" |

**Monorepo 目录（建在现有仓库上）**：

```
AngelBridge/
├── README.md
├── docs/
│   ├── design.md        ← 本文档
│   ├── api.md           ← 接口契约（第2小时冻结）
│   └── submit.md        ← 提交材料汇总
├── web/                 ← 前端 (A 主导, B 共建)
│   ├── src/pages/       ← feed / tree / item / chat / edit / pet / me / messages
│   ├── src/components/  ← Card, PetBubble, TreeView, TabBar, Toast...
│   ├── src/mocks/       ← 契约假数据（联调前用）
│   └── src/api.ts       ← 统一请求层（切 mock/真实一行搞定）
├── server/              ← 后端 (C)
│   ├── src/routes/      ← feed / tree / chat / match / intent
│   ├── src/ai/          ← prompts.ts, matcher.ts, fallback.ts
│   └── seed/seed.json   ← 种子数据 (D 编写, C 入库)
└── assets/              ← D 的产出: 树3档图/16灵宠图/卡片配图
```

---

## 8. 前后端分工（4 人）

```mermaid
flowchart LR
    subgraph 前端
        A["A · 前端①<br/>App框架/信息流/详情<br/>消息+我的占位<br/>部署前端"]
        B["B · 前端②<br/>人生树页/资料表单<br/>灵宠气泡+对话UI<br/>灵宠选择页"]
    end
    subgraph 后端AI
        C["C · 后端+AI<br/>数据库/全部API<br/>匹配引擎+兜底规则<br/>灵宠prompt/SSE/部署"]
    end
    subgraph 产品
        D["D · 产品/设计/路演<br/>守scope砍需求<br/>AI生图素材/种子数据<br/>走查/剧本/PPT/视频"]
    end
    D -.契约评审.-> A
    D -.素材/文案.-> B
    D -.种子数据.-> C
    A <-->|api.md 契约| C
    B <-->|api.md 契约| C
```

| 人 | 模块归属（对应第3节页面） | 关键交付节点 |
|---|---|---|
| **A 前端①** | 3.0 框架导航、3.1 信息流、3.5 详情页、3.6 消息/我的、前端部署 | 8h: mock 版信息流可点；24h: 真数据联调完 |
| **B 前端②** | 3.2 人生树、3.3 表单、3.4 灵宠全套 UI | 8h: 表单+树静态版；24h: 对话接通 SSE |
| **C 后端+AI** | 第 4/5/6 节全部、服务器部署 | 2h: 契约冻结；8h: CRUD 通；16h: 匹配引擎出 JSON；24h: 对话 SSE 通 |
| **D 产品** | 第 1 节 scope 裁决权、assets 素材、seed.json、第 10 节全部 | 8h: 素材+种子数据初稿；34h: 剧本彩排；42h: 备用视频+PPT |

**边界约定**：
- A 与 B 各自 own 页面目录互不交叉，共享组件（TabBar/Toast/PetBubble）由先用到的人建、放 `components/`；
- 灵宠是唯一跨界模块：**B 管 UI 与气泡文案，C 管对话后端与人设 prompt**，接口就是 `/chat` SSE；
- D 不写业务代码，但有**一票砍需求权**——任何模块在计划节点延误 >3h，D 决定降级为 Fake 层。

---

## 9. 48 小时排期与协作规范

### 9.1 甘特排期

```mermaid
gantt
    dateFormat HH
    axisFormat %H时
    title 48小时排期（0点=开赛）
    section 共同
    对齐范围+冻结API契约+建目录 :crit, m0, 00, 2h
    全链路联调           :crit, m1, 16, 4h
    功能冻结后只修bug     :crit, m2, 34, 14h
    section A 前端①
    脚手架+导航+信息流mock版 :a1, 02, 6h
    详情页+消息我的占位      :a2, 08, 8h
    信息流真数据+打磨       :a3, 20, 10h
    section B 前端②
    表单+人生树静态版      :b1, 02, 6h
    灵宠气泡+对话页UI      :b2, 08, 8h
    对话SSE联调+树切档打磨  :b3, 20, 10h
    section C 后端AI
    建库+CRUD+跑通Claude   :c1, 02, 6h
    匹配引擎+兜底规则      :c2, 08, 8h
    灵宠对话SSE+缓存+部署   :c3, 20, 12h
    section D 产品
    AI生图素材+种子数据    :d1, 02, 6h
    数据入库验收+prompt文案 :d2, 08, 8h
    走查清单+演示剧本      :d3, 20, 10h
    彩排+备用视频+PPT      :d4, 34, 10h
```

### 9.2 Git 协作规范（基于仓库现状）

仓库 README 已约定「PR 合入 main」，落地为：

```mermaid
flowchart LR
    F1[feat/feed A] -->|PR·1人快速review| M[main 保护分支]
    F2[feat/tree-pet B] -->|PR| M
    F3[feat/server C] -->|PR| M
    F4[docs/assets D] -->|PR| M
    M -->|每次merge自动部署| DEP[演示环境]
```

- **分支**：`feat/<模块>-<人>`，小步提交，**每 3–4 小时必须合一次 main**，严禁憋大 PR（48h 内合并冲突是头号杀手）；
- **Review**：hackathon 模式——PR 发群里 @ 一人，10 分钟内扫一眼即 merge，不追求完美；
- **main 永远可运行**：merge 前本地跑通再提；
- **同步节奏**：每 6 小时 10 分钟站会（0/6/12/18/24/30/36/42h），只说三句：做完了什么、接下来做什么、卡在哪；卡点超过 30 分钟必须喊人，不许闷头死磕；
- **敏感信息**：Claude API Key 只放服务器 `.env`（.gitignore 已覆盖），前端一律不碰 Key，所有 AI 调用走后端——同时满足赛事"数据安全"要求；
- **提交赛事 Tag**：终版 merge 后 `git tag "#shenicest-fission" && git push origin --tags`（若平台拒绝 `#` 开头 tag 名，用 `shenicest-fission`）。

### 9.3 三条铁律

1. **第 2 小时契约冻结、第 16 小时开始联调**，任何人不得以"我再优化下"推迟；
2. **34 小时功能冻结**，之后只修 bug、只打磨演示路径上的页面；
3. **42 小时前录好备用演示视频**——现场断网/服务挂掉时用视频路演。

---

## 10. 演示剧本与提交清单核对

### 10.1 两分钟演示剧本

```mermaid
flowchart LR
    S1["0:00 钩子<br/>打开H5,小天弹话:<br/>主人,3个高匹配!"] --> S2["0:20 人生树<br/>展示七维资料+拥有/需要<br/>讲价值置换理念"]
    S2 --> S3["0:50 信息流<br/>腾讯offer·匹配度98%<br/>点开看AI对仗匹配理由"]
    S3 --> S4["1:20 问小天<br/>为什么匹配?<br/>流式回答展示AI能力"]
    S4 --> S5["1:45 去签约toast<br/>收尾:交易闭环/语音交互<br/>是下一步规划"]
```

### 10.2 提交清单核对表（D 负责在 `docs/submit.md` 汇总）

| 提交项 | 内容 | 来源 |
|---|---|---|
| 赛道及命题 | 软件应用赛道 · 滴水穿石 | 本文档头部 |
| 作品名称 | 天使桥 AngelBridge | ✅ |
| Slogan | 做彼此的天使——凡人托举彼此的地方 | ✅ |
| 作品描述 | 本文档"一句话描述"扩写 200 字 | D 撰写 |
| 项目图片 | 4 张关键页截图 + 1 张架构图 | D 42h 前截取 |
| GitHub 仓库 + Tag | 本仓库，tag `#shenicest-fission` | 9.2 节流程 |
| 项目文档 | 本文档 + 开发过程记录（背景/用户/技术栈/创新点/分工/后续计划均已覆盖） | `docs/` |
| 演示视频 | 备用演示视频精剪 2–3 分钟 | D 42h 产出 |
| 体验链接（可选） | 云主机 H5 链接 + 二维码 | C 部署 |

**创新点论证（写入项目文档，呼应"AI 原生/Agent 协同"导向）**：
1. **AI 原生的匹配范式**——不是"用户搜索"，而是 Agent 主动理解人生画像做双向价值撮合，匹配理由可解释（对仗句式直给"你拥有↔TA需要"）；
2. **灵宠即 Agent 的人格化界面**——把冷冰冰的推荐系统变成有情绪价值的"人生经纪人"，播报、解释、跟进一体；
3. **滴水穿石的成长机制**——人生树成长分把"完善自我画像/参与互助"游戏化为可见的积累，驱动数据飞轮。

---

*本文档为团队对齐基线，建议以 PR 合入 `docs/design.md`。有异议在 PR 内评论，第 0–2 小时对齐会上裁决。*
