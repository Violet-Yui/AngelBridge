# 天使桥｜AI、后端与部署从零开发手册

> 版本：v1.2
> 日期：2026-08-26  
> 适用角色：R1｜后端 / AI 开发  
> 产品范围依据：[黑客松 MVP PRD](../product/天使桥_黑客松MVP_PRD.md)
> 项目阶段：从空仓库到可部署 Demo  
> 数据边界：只使用虚构角色与合成数据，不接入真实用户、房源或交易数据

---

## 0. 你的最终任务

你负责把前端页面背后的“真实产品逻辑”跑起来：

```text
合成文本
→ AI 提取 Value Node 与 Intent
→ 用户确认并激活 Intent
→ 双向召回与硬条件 Gate
→ Match Proof
→ A/B 分别 Consent
→ Bridge Pact
→ Outcome 写回生命树
→ 后续接入单一 OpenAI-compatible 中文模型、Supabase 与云端部署
```

你交付的不是一个聊天接口，而是以下六个可运行能力：

1. **数据底座：** Demo Session、角色、节点、Intent、Match、Consent、Pact、Outcome；
2. **AI 结构化：** 把自然语言稳定转成可校验的 JSON；
3. **双向匹配：** 同时判断 A 从 B 获得什么、B 从 A 获得什么；
4. **业务状态机：** 未经双方确认不能生成有效桥约；
5. **前端 API：** 提供稳定、可 Mock、可联调的接口；
6. **线上环境：** Preview 和 Production 能重复创建、运行和重置 Demo。

### 当前里程碑（已可独立完成）

- 三份 Zod Schema 与合成 Fixture 可校验；
- Hard Gate、双向价值判断、稳定排序和 Match Proof 可在内存中运行；
- Consent 与桥约状态机有自动测试，单方同意不能激活桥约；
- 不依赖 R3–R5 页面、Supabase 或在线 AI；
- `npm run verify` 可一次完成类型、测试与 Fixture 校验。

### 完整 Demo 完成标准

- 三个合成案例共用同一数据结构和匹配接口；
- 主案例可以从空 Session 跑到 Outcome；
- A/B 两台设备状态一致；
- AI 输出必须通过 Zod；
- 匹配页展示证据、冲突和未知项，不展示虚假百分比；
- 本地 `npm run build` 通过；
- 选定的共享云环境与 Supabase 云端数据库可运行；
- 你能用 2 分钟向评委解释 AI 与确定性代码各自负责什么。

---

## 1. 先冻结的技术决策

开始写业务接口前，与 R2 前端、R3 交互和 R5 产品统筹确认下表；R4 视觉确认需要展示的状态。页面视觉尚未确定不阻塞环境、纯领域逻辑和测试准备，但没有冻结的数据结构会让前后端反复返工。

| 决策 | 本手册建议 |
|---|---|
| Web 框架 | Next.js App Router + TypeScript |
| 后端形态 | Next.js Route Handlers，单仓单体 |
| 数据库 | Supabase PostgreSQL |
| 向量检索 | pgvector；合成小数据集使用精确余弦距离 |
| 模型接入 | 只接一个 OpenAI-compatible 中文模型；取得可用 Key 后再冻结供应方与模型 ID |
| 结构化输出 | JSON Schema + Zod 二次校验 |
| 双端同步 | P0 先 2 秒轮询；稳定后再接 Supabase Realtime |
| 用户系统 | 不做真实 Auth；以独立 Demo Session 隔离状态 |
| 数据 | 三个合成案例，所有实体 `is_synthetic = true` |
| 部署 | 当前不执行；后续可用七牛云云主机运行 Next.js，Supabase 托管数据库 |

### 为什么 P0 先不用 Realtime

两端同步只需要 B 在几秒内看到 A 的决定。P0 用 `/api/personas/:id/inbox` 每 2 秒刷新已经够用，前端和数据库也不需要额外配置订阅权限。完整闭环稳定后，再把轮询替换为 Supabase Realtime。

### 为什么 P0 不建向量索引

合成候选池只有几十个节点，直接使用 pgvector 精确距离即可。HNSW/IVFFlat 主要解决大数据量延迟问题，本次建立索引不会改善评委可见的产品价值。

---

## 2. 与其他角色先完成契约冻结

### 2.1 你需要别人提供什么

| 角色 | 需要提供的内容 |
|---|---|
| R2 前端开发 | 页面实际需要的字段、Mock 响应、接口调用节奏和错误呈现方式 |
| R3 UI/UX 交互设计 | A/B 用户路径、页面状态、进入条件和操作反馈 |
| R4 UI 视觉 / 美工 | 需要独立展示的证据、冲突、未知项和状态层级；不构成后端启动阻塞 |
| R5 产品统筹 / 路演 | 领域枚举、三套案例、业务规则、匹配解释口径、验收结果和 Demo Runbook |

### 2.2 你先交给前端的三份 Fixture

在真实 API 之前，先提交以下三个 JSON 文件：

```text
fixtures/parse-result.json
fixtures/match-proof.json
fixtures/bridge-pact.json
```

前端使用 Fixture 开发页面；你按同一结构开发 API。字段冻结后只允许新增可选字段，不直接改名。

### 2.3 推荐共享类型

```ts
type Direction = 'offer' | 'need' | 'goal'
type Domain =
  | 'space'
  | 'item'
  | 'skill'
  | 'service'
  | 'opportunity'
  | 'growth'

type Visibility = 'private' | 'match_only' | 'mutual_consent'

type ValueNodeProposal = {
  clientKey: string
  direction: Direction
  domain: Domain
  title: string
  description: string
  visibility: Visibility
  facts: {
    location?: string
    availability?: string
    budget?: string
    deliverable?: string
  }
  unknowns: string[]
}

type IntentDraft = {
  offerKeys: string[]
  needKeys: string[]
  exchangeMode: 'money' | 'barter' | 'skill_swap' | 'collaboration' | 'gift'
  constraints: Record<string, string>
  boundaries: string[]
  expiresAt: string | null
}

type ParseResult = {
  nodes: ValueNodeProposal[]
  intent: IntentDraft
}
```

Match Proof 的前端契约：

```ts
type MatchProof = {
  matchId: string
  candidate: {
    personaId: string
    displayName: string
    summary: string
  }
  valueToViewer: string[]
  valueToCandidate: string[]
  satisfiedConstraints: string[]
  conflicts: string[]
  unknowns: string[]
  evidence: Array<{
    label: string
    source: 'synthetic_confirmed' | 'unknown'
  }>
  firstAction: string
  status: 'candidate' | 'waiting_other' | 'mutual_accepted' | 'rejected'
}
```

桥约契约：

```ts
type BridgePact = {
  pactId: string
  title: string
  giveA: string[]
  receiveA: string[]
  giveB: string[]
  receiveB: string[]
  time: string | null
  location: string | null
  cost: string | null
  firstAction: string
  completionRule: string
  exitRule: string
  confirmedByA: boolean
  confirmedByB: boolean
  status: 'draft' | 'active' | 'completed' | 'exited'
}
```

### 2.4 页面尚未冻结时，R1 可以立即推进什么

R1 不需要等待高保真页面或视觉框架。按以下顺序推进：

1. **工程与环境基线：** 检查 Node.js、npm、Git 和 GitHub CLI；建立仓库、`.gitignore`、`.env.example` 和构建命令；AI 变量保持为空，七牛云账号与资源领取作为后续准备，不阻塞本地领域开发；
2. **契约草案：** 根据 PRD 写出 `ParseResult`、`MatchProof`、`BridgePact` 的 Zod Schema 与 JSON Fixture v0，标记为待 R2、R3、R5 确认；
3. **合成数据：** 固定空间 × 摄影服务主案例和两个扩展案例，所有实体使用 `is_synthetic = true`；
4. **纯匹配引擎：** 先以内存数组实现 Hard Gate、双向 Offer/Need 检查、稳定排序和 Match Proof 事实组装，不依赖页面、数据库、向量检索或 LLM；
5. **状态机：** 用纯函数和测试覆盖 `candidate → A 接受 → B 接受/拒绝 → Pact → Outcome`，保证任何单方同意都不能激活桥约；
6. **外部能力冒烟测试：** 取得对应凭据后，分别验证 Supabase 连接和模型结构化 JSON 输出；当前没有 Key 时不发起假调用，演示数据明确走 Fixture；
7. **数据库草案：** 根据核心实体编写首个 Migration，但在 Schema 与 Fixture 确认前不推送不可逆的字段命名。

匹配逻辑可以现在开始，而且应早于页面开发。P0 的优先级是：

```text
Hard Gate → 双向价值成立 → 确定性排序 → Match Proof 事实
```

embedding 只负责后续召回优化；几十条合成数据直接遍历即可。LLM 只负责理解输入和润色解释，不参与 Consent、Pact 或 Outcome 的状态判断。

### 2.5 R1 此时不能单方面决定什么

- 不单方面冻结前端字段名、页面加载方式和错误呈现；
- 不根据未确认的高保真稿反推数据库结构；
- 不提前实现 Realtime、向量索引、多模型路由、真实 Auth 或支付；
- 不把模型生成文案当作事实或业务状态；
- 不让临时 Fixture 静默变成正式契约。Schema 或 Fixture 由 R1、R2 确认可实现，R5 确认业务含义，R3确认交互信息足够。

---

## 3. 从零搭建工程

### 3.1 环境准备

建议安装：

- Node.js 20 LTS 或更新版本；
- Git；
- VS Code 或其他编辑器；
- Node.js、npm、Git 和可访问本仓库的开发环境；
- 当前阶段不需要 Supabase、云主机或 AI API Key；
- 后续联调再准备一个 Supabase 云项目；
- 后续只选择一个支持中文与结构化 JSON 输出的 OpenAI-compatible 模型。P0 不要求 embedding API；
- 七牛云账号、云主机和 Coding Plan 可提前领取，但在 Key 未获取前不写成已接入能力。

Supabase CLI 通过 npm/npx 运行时要求 Node.js 20 或更高版本。

### 3.2 创建 Next.js 项目

当前 `backend` 分支已经包含纯 TypeScript 领域内核，不要重复初始化。R2 冻结 Web 框架和目录后，再由 R1、R2 共同决定是在仓库根目录接入 Next.js，还是把领域内核作为独立包保留。以下命令仅是尚未初始化 Web 壳时的候选步骤：

```powershell
npx create-next-app@latest angelbridge --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
Set-Location angelbridge
npm install @supabase/supabase-js zod openai
npm install -D supabase vitest tsx
```

建议在项目一开始运行：

```powershell
npm run dev
npm run build
```

先确认空项目可以开发和构建，再加入数据库与模型。

### 3.3 初始化 Supabase CLI

黑客松推荐直接连接云项目，避免临时处理 Docker 环境：

```powershell
npx supabase init
npx supabase login
npx supabase link --project-ref <SUPABASE_PROJECT_REF>
npx supabase migration new init_angelbridge
```

命令会创建：

```text
supabase/
  config.toml
  migrations/
```

把 `supabase/` 提交到 Git，让数据库结构可复现。

如果团队已经稳定使用 Docker，也可以执行 `npx supabase start` 启动本地完整 Supabase；这不是本次交付前提。

### 3.4 安装后的目录结构

```text
src/
  app/
    api/
      demo/sessions/route.ts
      ai/parse/route.ts
      value-nodes/[id]/route.ts
      intents/[id]/activate/route.ts
      intents/[id]/matches/route.ts
      matches/[id]/consents/route.ts
      personas/[id]/inbox/route.ts
      personas/[id]/tree/route.ts
      pacts/[id]/confirm/route.ts
      pacts/[id]/status/route.ts
  lib/
    ai/
      client.ts
      parse-intent.ts
      build-match-proof.ts
      build-pact.ts
    db/
      supabase-admin.ts
    matching/
      hard-gate.ts
      retrieve.ts
      score.ts
      service.ts
    services/
      demo-session.ts
      consent.ts
      pact.ts
      outcome.ts
    schemas/
      parse-result.ts
      match-proof.ts
      bridge-pact.ts
      api.ts
    types/
      database.ts
fixtures/
scripts/
  seed-demo.ts
  seed-embeddings.ts
tests/
  parse-result.test.ts
  matching.test.ts
  state-machine.test.ts
supabase/
  migrations/
  seed.sql
```

Route Handler 只做四件事：读取请求、用 Zod 校验、调用 service、返回响应。AI、匹配和状态机不要直接写在 `route.ts` 中。

---

## 4. 环境变量与客户端

### 4.1 `.env.example`

只提交变量名，不提交真实值：

```dotenv
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

AI_MODE=fixture
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
# P1 启用向量召回时再填写
EMBEDDING_MODEL=
EMBEDDING_DIM=1536

DEMO_DATASET_VERSION=v1
```

所有变量都只在服务端使用，不加 `NEXT_PUBLIC_`。P0 前端只访问 Next.js API，不直接访问数据库。

### 4.2 Supabase 服务端客户端

`src/lib/db/supabase-admin.ts`：

```ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)
```

`SERVICE_ROLE_KEY` 只能出现在服务端环境变量中，不能传给浏览器。

### 4.3 模型客户端（取得 Key 后再实现）

当前固定 `AI_MODE=fixture`，不创建在线客户端，也不把某一家供应商写成默认值。取得可用 Key 后，先选定一个 OpenAI-compatible 中文模型，再新增以下客户端：

`src/lib/ai/client.ts`：

```ts
import OpenAI from 'openai'

export const aiClient = new OpenAI({
  apiKey: process.env.AI_API_KEY!,
  baseURL: process.env.AI_BASE_URL || undefined,
})

export const aiModel = process.env.AI_MODEL!
export const embeddingModel = process.env.EMBEDDING_MODEL!
```

先用一个最小脚本确认当前模型供应商是否支持：

1. JSON Schema / Structured Outputs；
2. embedding；
3. 中文输入；
4. 预期的超时与额度。

若团队最终选用七牛云 Coding Plan，再按其 OpenAI-compatible 文档填写 Base URL，通过 `/models` 获取账号实际可用的模型 ID；在此之前 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 均保持为空。无论选择哪家供应商，P0 都只接一个模型，页面展示名不能直接当作模型 ID。

`EMBEDDING_MODEL` 与 `EMBEDDING_DIM` 属于 P1。只有确认 Coding Plan 中存在可用 embedding 模型并决定启用向量召回后再填写，向量列维度必须与实际输出一致。

---

## 5. 建数据库

### 5.1 数据模型原则

- `demo_sessions` 隔离每次演示；
- `personas` 只表示虚构 A/B 角色；
- 用户确认前的 AI 输出只返回前端，不直接写库；
- 用户确认后才创建 `value_nodes` 与 `intents`；
- `matches` 保存事实和计算结果，文案可重新生成；
- A/B 各有一条 `consents`；
- `bridge_pacts` 和 `outcomes` 表示行动状态；
- 所有业务表都有 `is_synthetic` 或继承自合成 Session。

### 5.2 首个 Migration

把下面结构写入 `supabase/migrations/<timestamp>_init_angelbridge.sql`。示例使用 1536 维向量；如果 embedding 模型维度不同，在第一次 `db push` 前修改。

```sql
create extension if not exists vector with schema extensions;

create table demo_sessions (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null,
  dataset_version text not null default 'v1',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table personas (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references demo_sessions(id) on delete cascade,
  role text not null check (role in ('a', 'b', 'candidate')),
  display_name text not null,
  summary text not null,
  is_synthetic boolean not null default true,
  unique (session_id, role, display_name)
);

create table value_nodes (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  direction text not null check (direction in ('offer', 'need', 'goal')),
  domain text not null,
  title text not null,
  description text not null,
  visibility text not null default 'match_only',
  facts jsonb not null default '{}'::jsonb,
  unknowns jsonb not null default '[]'::jsonb,
  confirmed boolean not null default false,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create table intents (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  offer_node_ids uuid[] not null default '{}',
  need_node_ids uuid[] not null default '{}',
  exchange_mode text not null,
  constraints jsonb not null default '{}'::jsonb,
  boundaries jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references demo_sessions(id) on delete cascade,
  intent_a_id uuid not null references intents(id),
  intent_b_id uuid not null references intents(id),
  utility_a double precision not null,
  utility_b double precision not null,
  reciprocal_score double precision not null,
  gate_result jsonb not null,
  proof jsonb not null,
  status text not null default 'candidate',
  created_at timestamptz not null default now(),
  unique (intent_a_id, intent_b_id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  persona_id uuid not null references personas(id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected')),
  reason_code text,
  created_at timestamptz not null default now(),
  unique (match_id, persona_id)
);

create table bridge_pacts (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references matches(id) on delete cascade,
  terms jsonb not null,
  first_action text not null,
  completion_rule text not null,
  exit_rule text not null,
  confirmed_by_a boolean not null default false,
  confirmed_by_b boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table outcomes (
  id uuid primary key default gen_random_uuid(),
  pact_id uuid not null references bridge_pacts(id) on delete cascade,
  result text not null check (result in ('completed', 'exited')),
  reason_code text,
  tree_change jsonb not null,
  created_at timestamptz not null default now()
);

create index value_nodes_persona_idx on value_nodes(persona_id);
create index intents_persona_status_idx on intents(persona_id, status);
create index matches_session_status_idx on matches(session_id, status);
create index consents_match_idx on consents(match_id);
```

对于几十条合成数据，不创建向量索引。需要检索时直接使用 `<=>` 余弦距离。

### 5.3 推送 Migration 并生成类型

```powershell
npx supabase db push
npx supabase gen types typescript --linked --schema public | Out-File -Encoding utf8 src/types/database.ts
```

完成后提交 migration 和生成的类型。

---

## 6. 准备三个合成案例

### 6.1 Seed 目标

至少准备：

- 三个案例；
- 每个案例一个发起方 A；
- 每个案例至少三个候选；
- 每个角色至少一个 Offer 和一个 Need；
- 主案例中正确候选稳定排第一；
- 每个候选都有证据、冲突或未知项。

### 6.2 主案例 Seed

```text
角色 A
Offer：周末工作室两天使用权
Need：一组品牌照片
约束：同城、下周末、可以非货币交换

角色 B（正确候选）
Offer：品牌摄影服务
Need：两天室内拍摄场地
约束：同城、下周末

角色 C（次候选）
Offer：产品摄影
Need：现金报酬
冲突：不接受资源互换

角色 D（被 Gate 过滤）
Offer：品牌摄影
Need：工作室
冲突：地点不一致
```

### 6.3 Seed 的实现

用 `scripts/seed-demo.ts` 写入一份“模板数据集”。创建 Demo Session 时，复制模板角色、节点和 Intent 到新的 `session_id`，保证每次演示互不影响。

合成数据必须包含：

```ts
{
  isSynthetic: true,
  datasetVersion: 'v1',
  evidenceSource: 'synthetic_confirmed'
}
```

### 6.4 预生成 embedding

节点用于向量检索的文本固定为：

```text
[direction] [domain] [title] [description] [facts]
```

例如：

```text
offer space 周末工作室使用权 北京朝阳区，可在下周末提供两天室内拍摄空间
```

`scripts/seed-embeddings.ts`：

1. 查找 `embedding is null` 的已确认节点；
2. 调用 embedding API；
3. 检查向量长度与 `EMBEDDING_DIM` 一致；
4. 写回 `value_nodes.embedding`。

合成节点 embedding 在演示前全部生成，不要现场批量生成。

---

## 7. 实现 AI 结构化抽取

### 7.1 Zod Schema 是第一事实来源

`src/lib/schemas/parse-result.ts`：

```ts
import { z } from 'zod'

export const ValueNodeProposalSchema = z.object({
  clientKey: z.string(),
  direction: z.enum(['offer', 'need', 'goal']),
  domain: z.enum([
    'space',
    'item',
    'skill',
    'service',
    'opportunity',
    'growth',
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  visibility: z.enum(['private', 'match_only', 'mutual_consent']),
  facts: z.object({
    location: z.string().optional(),
    availability: z.string().optional(),
    budget: z.string().optional(),
    deliverable: z.string().optional(),
  }),
  unknowns: z.array(z.string()),
})

export const ParseResultSchema = z.object({
  nodes: z.array(ValueNodeProposalSchema).min(1),
  intent: z.object({
    offerKeys: z.array(z.string()),
    needKeys: z.array(z.string()),
    exchangeMode: z.enum([
      'money',
      'barter',
      'skill_swap',
      'collaboration',
      'gift',
    ]),
    constraints: z.record(z.string(), z.string()),
    boundaries: z.array(z.string()),
    expiresAt: z.string().nullable(),
  }),
})

export type ParseResult = z.infer<typeof ParseResultSchema>
```

### 7.2 System Prompt

Prompt 只解决结构化任务：

```text
你是天使桥的小天，负责把一段合成场景描述整理成 Value Node 和 Intent 草稿。

规则：
1. 只使用输入中明确出现的事实；缺失内容写入 unknowns。
2. 区分 offer、need 和 goal。
3. 不把关系、健康或身份信息推断成公开价值。
4. visibility 默认 match_only；明显私密内容标记 private。
5. Intent 必须引用已输出节点的 clientKey。
6. 输出必须符合给定 JSON Schema，不输出额外说明。
```

### 7.3 模型调用

优先使用供应商原生 JSON Schema / Structured Outputs。以 Chat Completions 兼容接口为例：

```ts
import { zodResponseFormat } from 'openai/helpers/zod'
import { aiClient, aiModel } from './client'
import { ParseResultSchema } from '@/lib/schemas/parse-result'

export async function parseIntent(input: string) {
  const completion = await aiClient.chat.completions.parse({
    model: aiModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: input },
    ],
    response_format: zodResponseFormat(ParseResultSchema, 'parse_result'),
  })

  const parsed = completion.choices[0]?.message.parsed
  return ParseResultSchema.parse(parsed)
}
```

不同 OpenAI-compatible 供应商对 `parse` 和 `json_schema` 的支持并不完全一致。先在独立脚本验证当前供应商；如果不支持 SDK helper，就使用其原生 JSON Schema 参数，最后仍执行 `ParseResultSchema.parse()`。

### 7.4 Parse API

`POST /api/ai/parse`

请求：

```json
{
  "sessionId": "uuid",
  "personaId": "uuid",
  "text": "我周末有一间空闲工作室，希望换一组品牌照片"
}
```

响应：

```json
{
  "data": {
    "nodes": [],
    "intent": {}
  },
  "meta": {
    "isSynthetic": true,
    "datasetVersion": "v1",
    "mode": "live_ai"
  },
  "error": null
}
```

原始 `text` 不写入数据库。用户在前端确认节点后，再调用节点与 Intent 接口保存结构化结果。

### 7.5 演示预置模式

为主演示准备 `fixtures/parse-result.json`。如果现场明确切换为预置模式，API 返回：

```json
"mode": "preset_demo"
```

前端显示“演示预置结果”。不要在 API 失败时悄悄返回预置结果，否则团队无法判断现场究竟展示了实时模型还是缓存。

---

## 8. 保存节点与激活 Intent

### 8.1 节点确认

用户编辑并确认后：

1. 后端再次用 Zod 校验；
2. 确认 `persona_id` 属于当前 Session；
3. 创建 `value_nodes`；
4. 对 `visibility != private` 的节点生成 embedding；
5. 返回数据库 ID。

未确认或 `private` 节点不参与匹配。

### 8.2 Intent 激活

`POST /api/intents/:id/activate`

激活前检查：

- 至少一个已确认 Offer；
- 至少一个已确认 Need；
- 引用节点属于同一 Persona；
- 交换方式已填写。

满足后将 `status` 从 `draft` 改为 `active`。

---

## 9. 实现双向匹配

### 9.1 匹配流程

```text
读取 A 的 active Intent
→ 加载 A 的 Offer/Need 节点
→ 查询其他 Persona 的 active Intent
→ Hard Gate
→ A.need 对 B.offer 的语义覆盖
→ A.offer 对 B.need 的语义覆盖
→ 双向效用
→ 排序并保留 Top 3
→ 生成 Match Proof
```

### 9.2 Hard Gate

`src/lib/matching/hard-gate.ts` 只处理确定字段：

```ts
type GateResult = {
  passed: boolean
  satisfied: string[]
  conflicts: string[]
  unknowns: string[]
}
```

P0 只实现：

- 领域是否可连接；
- 地点；
- 时间；
- 交换方式；
- 可见范围。

硬冲突直接过滤；未知信息保留给 Match Proof，不要假设为满足。

### 9.3 双向召回

对每个候选 B 分别计算：

```text
ValueToA = similarity(A.need, B.offer)
ValueToB = similarity(A.offer, B.need)
```

pgvector 余弦相似度：

```sql
select
  id,
  1 - (embedding <=> $1::extensions.vector) as similarity
from value_nodes
where direction = 'offer'
  and confirmed = true
  and visibility <> 'private'
order by embedding <=> $1::extensions.vector
limit 10;
```

### 9.4 双向分数

用调和平均避免一边很高、另一边很低：

```ts
export function harmonicMean(a: number, b: number) {
  if (a <= 0 || b <= 0) return 0
  return (2 * a * b) / (a + b)
}
```

```text
ReciprocalScore = harmonicMean(ValueToA, ValueToB)
```

`ReciprocalScore` 只用于内部排序，不直接显示成“匹配度 98%”。

### 9.5 主案例的确定性结果

建立 `tests/matching.test.ts`：

```text
Given：工作室换摄影的 A Intent
When：对主案例候选执行匹配
Then：需要场地且提供摄影的 B 排名第一
And：只要现金的候选保留冲突或降低排序
And：异地候选被 Hard Gate 过滤
```

先让这条测试通过，再增加另外两个案例。

---

## 10. 生成 Match Proof

### 10.1 先组装事实，再让模型润色

不要把所有节点直接丢给模型问“为什么匹配”。后端先构造：

```ts
type MatchFacts = {
  valueToA: string[]
  valueToB: string[]
  satisfiedConstraints: string[]
  conflicts: string[]
  unknowns: string[]
  evidence: Array<{
    label: string
    source: 'synthetic_confirmed' | 'unknown'
  }>
}
```

再让模型只完成两项工作：

- 将事实改写成自然、简洁的中文；
- 根据事实提出一个最小第一步。

### 10.2 Proof Schema

模型不得新增事实。最终结果再次经过 `MatchProofSchema.parse()`，保存到 `matches.proof`。

主案例第一步可以固定为：

> 双方先确认下周末档期，并进行一次 30 分钟需求沟通。

---

## 11. 实现 Consent、桥约和 Outcome

### 11.1 Match 状态

```text
candidate
→ A accepted：waiting_other
→ B accepted：mutual_accepted
→ 任一方 rejected：rejected
```

### 11.2 Consent API

`POST /api/matches/:id/consents`

请求：

```json
{
  "personaId": "uuid",
  "decision": "accepted",
  "reasonCode": null
}
```

服务流程：

1. 插入或更新当前 Persona 的 Consent；
2. 查询该 Match 下 A/B 两条 Consent；
3. 任一拒绝则 Match 为 `rejected`；
4. 两者接受则 Match 为 `mutual_accepted`；
5. 达成双向接受后创建一份 Pact Draft。

这一整段最好放在一个 Postgres RPC 中完成，避免两个请求同时到达时产生中间状态。P0 只有两个角色和合成数据，也可以先用服务端函数完成，但必须只有一个函数负责状态推导。

### 11.3 生成 Bridge Pact

事实来源：

- A/B 已确认节点；
- Intent 中的交换方式与约束；
- Match Proof 的未知项；
- 产品预设的完成和退出规则。

模型只生成草稿文本，后端补齐状态和双方确认字段。

主案例桥约：

```json
{
  "title": "两天工作室使用权交换一组品牌照片",
  "giveA": ["下周末两天工作室使用权"],
  "receiveA": ["一组约定规格的品牌照片"],
  "giveB": ["品牌摄影与基础交付"],
  "receiveB": ["两天室内拍摄空间"],
  "firstAction": "确认档期并完成 30 分钟需求沟通",
  "completionRule": "双方完成空间使用与照片交付",
  "exitRule": "首次沟通结束前均可退出"
}
```

### 11.4 Pact 确认

`POST /api/pacts/:id/confirm`

- A 点击确认：`confirmed_by_a = true`；
- B 点击确认：`confirmed_by_b = true`；
- 两者都为 true：`status = active`。

### 11.5 Outcome 写回

`PATCH /api/pacts/:id/status`

完成时：

1. `bridge_pacts.status = completed`；
2. 创建 `outcomes`；
3. `tree_change` 记录双方新增的成长结果；
4. 生命树 API 合并 Value Node 与 Outcome 返回前端。

主案例 `tree_change`：

```json
{
  "personaA": "获得一次品牌内容合作成果",
  "personaB": "完成一次空间换服务的资源连接"
}
```

---

## 12. API 实现规范

### 12.1 统一响应

```ts
type ApiResponse<T> = {
  data: T | null
  meta: {
    sessionId?: string
    isSynthetic: true
    datasetVersion: string
    mode?: 'live_ai' | 'preset_demo'
  }
  error: {
    code: string
    message: string
  } | null
}
```

### 12.2 Route Handler 模板

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  sessionId: z.string().uuid(),
})

export async function POST(request: Request) {
  const input = RequestSchema.parse(await request.json())
  const data = await service(input)

  return NextResponse.json({
    data,
    meta: {
      sessionId: input.sessionId,
      isSynthetic: true,
      datasetVersion: process.env.DEMO_DATASET_VERSION,
    },
    error: null,
  })
}
```

### 12.3 API 开发顺序

按前端联调依赖依次完成：

1. `POST /api/demo/sessions`；
2. `POST /api/ai/parse`；
3. 节点保存与 Intent 激活；
4. 匹配与 Match Proof；
5. Inbox 轮询；
6. Consent；
7. Pact 确认与状态；
8. Tree 与 Outcome；
9. Session Reset。

每完成一个 API，立即给 R2，并同步 R3、R5：

- 方法和 URL；
- 请求示例；
- 成功响应；
- 当前 Preview 地址；
- 对应 Fixture 是否发生变化。

---

## 13. 与前端联调

### 13.1 联调一：Session → Intent

```text
创建 Session
→ 解析合成文本
→ 前端编辑节点
→ 保存确认节点
→ 激活 Intent
```

你负责检查：

- Session 与 Persona ID 是否正确；
- AI 返回是否通过 Schema；
- 编辑后的数据是否真实写入；
- private 节点是否被排除；
- Intent 是否引用正确节点。

### 13.2 联调二：Intent → Match Proof

```text
激活 Intent
→ 运行 matching service
→ 返回 Top 3
→ 前端打开 Match Proof
```

你需要同时给前端一份“计算说明”：

```json
{
  "candidate": "B",
  "hardGate": "passed",
  "valueToA": "B 提供品牌摄影",
  "valueToB": "A 提供拍摄空间",
  "unknown": "具体照片数量待确认"
}
```

### 13.3 联调三：A/B → Outcome

用两台设备或两个无痕窗口：

```text
A 接受
→ B 的 inbox 轮询出现请求
→ B 接受
→ Pact Draft
→ A/B 分别确认
→ active
→ completed
→ Tree 更新
```

每次测试新建 Session，不手工改数据库制造正确状态。

### 13.4 轮询接口

P0 前端每 2 秒调用：

```text
GET /api/personas/:id/inbox
```

返回：

- 待我确认；
- 等待对方；
- 进行中的 Pact；
- 已结束。

如果 P0 提前稳定，再启用 Realtime；不要在两个方案之间同时维护两套业务逻辑，Realtime 只负责通知前端重新拉取最新状态。

---

## 14. 测试

### 14.1 三类自动测试

#### Schema 测试

- 三段合成输入均能通过 `ParseResultSchema`；
- 缺失字段进入 `unknowns`；
- 枚举值不合法时测试失败。

#### 匹配测试

- 主案例正确候选第一；
- 单边满足的候选不能高于双向满足候选；
- 地点或时间硬冲突被过滤；
- private 节点不参与匹配。

#### 状态机测试

- A 单方接受不能生成 active Pact；
- B 拒绝后 Match 为 rejected；
- A/B 接受后创建 Pact Draft；
- A/B 确认后 Pact 为 active；
- completed 后 Tree 返回 Outcome。

### 14.2 命令

在 `package.json` 增加：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

提交或部署前运行：

```powershell
npm run test
npm run typecheck
npm run build
```

### 14.3 手工验收

至少连续运行五次主演示。记录：

- Session ID；
- AI 模式：`live_ai` 或 `preset_demo`；
- 每一步耗时；
- 阻断点；
- 最终是否写回生命树。

---

## 15. 后续部署候选：七牛云与 Supabase

> 当前尚未取得七牛云 AI API Key，也未开始云部署。本节是拿到资源后的执行说明，不代表仓库已经接入七牛云。

赛事资源分为两类，不能混为一谈：

- **七牛云云服务器：** 用于运行 Next.js Web、Route Handlers 和后台进程，赛事资源说明为 66 台、每台 3 个月；实际规格、系统镜像和领取方式以现场分配结果为准；
- **七牛云 Coding Plan：** 用于调用 AI 推理 API，赛事资源说明为 1000 份、每份 1000 万 Token。兑换码有效期至 8 月 31 日，兑换后 Token 有效期 1 个月。

团队需要提前用手机号注册七牛云并完成实名认证。实名认证可能次日完成，不要等开发结束再注册。Coding Plan 兑换成功后，在七牛云控制台创建独立 API Key；密钥不提交到公开仓库。

### 15.1 Supabase 云端

1. 创建 Supabase Project；
2. 记录 Project Ref、Project URL、Service Role Key；
3. 链接 CLI；
4. 推送 migration；
5. 运行 seed；
6. 检查三个合成案例；P1 启用向量召回时再生成 embedding；
7. 在 Supabase Studio 确认表和数据。

命令：

```powershell
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
npx tsx scripts/seed-demo.ts
# P1：启用向量召回后再运行
npx tsx scripts/seed-embeddings.ts
```

### 15.2 七牛云 Coding Plan 接入（待 Key）

七牛云 AI 推理服务兼容 OpenAI Chat Completions。先在本地或服务器验证：

```powershell
$env:AI_BASE_URL = 'https://api.qnaigc.com/v1'
$env:AI_API_KEY = '<只在本机设置>'

curl.exe "$env:AI_BASE_URL/models" `
  -H "Authorization: Bearer $env:AI_API_KEY"
```

根据返回结果选择一个 Coding Plan 可用模型，并依次验证：

1. `/models` 能返回当前账号可用的模型 ID；
2. `/chat/completions` 可以完成非流式中文请求；
3. 当前模型是否接受 `response_format` 或 JSON Schema；
4. 如果不支持原生 Structured Outputs，使用严格 JSON Prompt，最终仍由 Zod 校验；
5. 为 API Key 设置合理额度，避免现场被其他实验耗尽。

本地 `.env.local` 与七牛云服务器环境分别配置：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AI_BASE_URL=https://api.qnaigc.com/v1
AI_API_KEY
AI_MODEL
DEMO_DATASET_VERSION
```

`EMBEDDING_MODEL` 和 `EMBEDDING_DIM` 仅在 P1 启用向量召回时增加。所有密钥只放在本地或服务器环境中，不写入 Git，也不放入 `NEXT_PUBLIC_*`。

### 15.3 七牛云云主机准备

拿到云主机后先记录实际镜像、CPU、内存、公网 IP 和磁盘，再决定是否使用 Docker。P0 推荐最短路径：Linux + Node.js 20 或更高版本 + Nginx + systemd/PM2。

云主机至少需要：

- 绑定公网 IP；
- 使用 SSH 密钥或现场提供的登录方式；
- 安全组开放 22、80、443；应用进程的 3000 端口只监听本机，由 Nginx 反向代理；
- 能从服务器访问 GitHub、Supabase 和 `https://api.qnaigc.com/v1`；
- 在服务器创建不进入 Git 的环境变量文件。

先把这台共享环境作为 Preview。第 72 小时功能冻结并完成连续验收后，再把同一环境标记为 Production，黑客松期间不维护两套云服务器。

### 15.4 Preview 发布

部署前：

```powershell
npm run test
npm run typecheck
npm run build
```

服务器发布流程：

```bash
git fetch origin
git checkout <已验收的分支或提交>
npm ci
npm run test
npm run typecheck
npm run build
npm run start -- -H 127.0.0.1 -p 3000
```

确认命令可运行后，再交给 systemd 或 PM2 常驻，并由 Nginx 转发 80/443。不要用交互式终端长期托管 Demo。

Preview 验收：

- 能创建 Session；
- `/api/ai/parse` 可以访问届时选定的单一模型；
- 数据写入正确 Supabase 项目；
- A/B 轮询状态一致；
- 重置后可重复演示。

### 15.5 Production 发布

只有 Preview 完整跑通后才发布 Production：

1. 合并主分支；
2. 记录准备发布的 Git commit；
3. 检查服务器环境变量并发布该 commit；
4. 新建全新 Session 跑一次完整 Demo；
5. 将 Production URL 交给 R2、R3、R4、R5 做联调、验收、截图和视频。

如果比赛开始后仍未分配七牛云云主机，可使用 Vercel 作为临时备选；数据库与模型供应商彼此独立。任何新增或修改的服务器环境变量都需要重启应用进程才会生效。

---

## 16. 你的 96 小时工作计划

| 时间 | 你的主任务 | 交付物 | 与谁联合 |
|---|---|---|---|
| 0–6h | 环境基线；联合冻结 Schema、Fixture、模型与数据库方案 | 三份 Fixture、实体表、接口清单 | R2、R3、R5，R4 确认展示状态 |
| 6–12h | Supabase、Next 后端骨架、通用 AI 环境变量 | Migration、DB Client、Preview 骨架 | R2 |
| 12–20h | Seed、Session、节点与 Intent | 合成数据、Session API、节点 API | R2、R5 |
| 20–28h | AI 结构化抽取 | Parse Schema、Prompt、Parse API、测试 | R2、R5 |
| 28–40h | 第一次联调 | Session → Intent 可运行 | R2、R3、R5 |
| 40–52h | 双向召回、Gate、排序 | Matching Service、三案例测试 | R5 验收业务含义 |
| 52–58h | Match Proof | Proof API、解释结构 | R2、R3、R5 |
| 58–68h | Consent、Pact、Outcome | 状态机与接口 | R2 |
| 68–72h | 第三次联调 | A/B → Tree 完整闭环 | R2、R3、R5 |
| 72–84h | 云端部署与稳定 | Preview、Production、五次通过记录 | 全员 |
| 84–92h | 支持视频和答辩 | 稳定接口、技术架构图、技术讲解 | R3、R4、R5 |
| 92–96h | 提交缓冲 | 最终构建、环境检查、README | R5 |

如果时间不足，优先保住：

```text
Parse → Matching → Match Proof → Consent → Pact → Outcome
```

Realtime、自动 embedding 更新、复杂索引和多轮 Agent 协商都可以后置。

---

## 17. Git 与协作方式

建议拆成以下分支或 PR：

```text
feat/backend-foundation
feat/demo-seed
feat/ai-parse
feat/matching-engine
feat/consent-pact
feat/deployment
```

每个 PR 必须包含：

- 做了什么；
- API 是否变更；
- Fixture 是否变更；
- 如何验证；
- Preview URL（如有）。

不要让 R2 等到“后端全部完成”才开始联调。每实现一个纵向切片就提供可访问 API；R3、R5 同步验收交互信息和业务含义。

---

## 18. 现场技术讲解

面对评委，用下面四句话说明技术：

1. **“AI 先把人的复杂表达转成统一的 Value Node 和 Intent。”**
2. **“系统不是单向推荐，而是分别计算 A 的 Need 对 B 的 Offer、以及 A 的 Offer 对 B 的 Need。”**
3. **“LLM 负责理解和表达，硬条件、双方确认和桥约状态由确定性代码管理。”**
4. **“成功不是出现一个匹配分，而是双方确认桥约，并让结果回到各自的生命树。”**

如果评委问为什么是 AI 原生，而不是大模型套壳，现场展示：

- ParseResult JSON；
- 双向召回的两条路径；
- Match Proof 中的证据与未知项；
- A/B 两条独立 Consent；
- Outcome 写回生命树。

---

## 19. 开发顺序总清单

- [x] 建立三份 Fixture 草案，等待团队冻结；
- [x] 完成纯 TypeScript 领域工程、双向匹配与状态机测试；
- [ ] 后续需要时完成七牛云注册与实名认证，领取云主机和 Coding Plan；
- [ ] 初始化 Next.js、Supabase 和环境变量；
- [ ] 取得 Key 后，使用所选供应商的 `/models` 和 `/chat/completions` 完成模型冒烟测试；
- [ ] 创建 migration 并推送云端；
- [ ] 写入三套合成 Seed；
- [ ] P1 启用向量召回时再生成合成节点 embedding；
- [ ] 实现 Session 创建与重置；
- [ ] 实现 Zod Schema 和 Parse API；
- [ ] 实现节点保存与 Intent 激活；
- [x] 实现内存版 Hard Gate 和双向价值判断；
- [x] 实现内部排序与 Match Proof 事实组装；
- [x] 实现 Consent 与桥约状态推导；
- [ ] 实现 Pact 和 Outcome；
- [ ] 实现 Inbox 轮询和 Tree API；
- [ ] 完成三轮前后端联调；
- [ ] 三类自动测试通过；
- [ ] Preview 完整跑通；
- [ ] Production 完整跑通；
- [ ] 主演示连续五次无阻断；
- [ ] 向 R5 交付技术架构图和讲解口径，向 R4 提供产品截图所需的稳定页面状态。

---

## 20. 官方参考

- [Next.js App Router Getting Started](https://nextjs.org/docs/app/getting-started)
- [Next.js Backend for Frontend / Route Handlers](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Supabase CLI 与本地开发](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase JavaScript Client 初始化](https://supabase.com/docs/reference/javascript/initializing)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Semantic Search](https://supabase.com/docs/guides/ai/semantic-search)
- [Supabase Realtime 数据库变更](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [七牛云 Coding Plan 兑换码使用指南](https://ocn0g60ffqrb.feishu.cn/wiki/ERsJwb0y9iYzI9kh4eYcL83EnMc)
- [七牛云 AI 推理 API 接入说明](https://developer.qiniu.com/aitokenapi/13379/real-time-ai-interface-api)
- [七牛云 AI API Key 获取方式](https://developer.qiniu.com/aitokenapi/12884/how-to-get-api-key)
- [七牛云云主机快速入门](https://developer.qiniu.com/qvm/manual/qvm-linux-quickstart)
- [七牛云安全组](https://developer.qiniu.com/fec/manual/the-security-group)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI Embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- [Vercel 部署文档（仅备选）](https://vercel.com/docs/deployments)

技术文档会更新；开始编码时以官方最新接口为准，模型供应商的 OpenAI-compatible 实现也需要单独验证。
