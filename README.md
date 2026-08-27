# AngelBridge｜天使桥

> 做彼此的天使，让价值被看见、被连接、被置换。

天使桥是一个 AI 原生的价值置换与资源连接产品。用户表达自己能提供什么、需要什么以及愿意怎样交换；个人 AI“小天”将自然语言整理为统一价值结构，发现双方都能获益的连接，并在双方分别同意后形成可执行桥约。

## 当前阶段

项目处于黑客松 MVP 联调阶段。当前 `hackathon` 工作分支已经提供与页面框架无关的 TypeScript 领域内核、内存应用服务和本地 Fixture HTTP API；前端可在数据库、真实 AI 和云部署接入前完成整条产品流程。

MVP 只使用虚构角色与合成数据，不接入真实用户、房源、招聘、婚恋、交易或支付数据。

## 核心文档

- [文档索引](docs/README.md)
- [Idea 打磨与产品方案](docs/product/天使桥_Idea打磨与产品方案.md)
- [黑客松 MVP PRD](docs/product/天使桥_黑客松MVP_PRD.md)
- [AI、后端与部署开发手册](docs/engineering/天使桥_AI后端与部署开发手册.md)
- [当前设计稿问题评审](docs/review/天使桥_当前设计稿问题评审.md)
- [路演 Deck 大纲](docs/presentation/天使桥_路演Deck大纲.md)
- [项目背景](docs/context/项目背景.md)

## 技术方向

- Web：Next.js App Router + TypeScript；
- 服务端：Next.js Route Handlers；
- 数据库：Supabase PostgreSQL；
- AI：只接一个 OpenAI-compatible 中文模型，供应方待取得可用 Key 后冻结；当前使用合成 Fixture，不发起在线调用；
- 部署：保留七牛云 QVM 与 Vercel 两种选项，待资源可用性和 Web 框架确认后选择；当前不执行云部署。

## 已完成的本地开发基础

- `ParseResult`、`MatchProof`、`BridgePact` 三份 Zod 合同与合成 Fixture；
- Hard Gate、双向 Offer/Need 成立检查、证据完整度与新鲜度排序；
- 不暴露内部百分比的 Match Proof；
- Consent 与桥约状态机：双方分别同意前不能激活桥约；
- 三个合成案例与内存 Demo Session 闭环；
- 每个案例提供 1 个高匹配和 2 个次优可行候选，支持三卡片排序界面；
- 三个候选均可独立发起 Consent、生成桥约并完成或退出，不再只让第一名可操作；
- 资源节点编辑、删除、确认，意图与隐私边界设置；
- 节点修改后自动撤销该节点确认，意图发布后锁定本轮编辑；
- 基于角色 Token 的 A/B 双方会话隔离；
- Boundary 统一控制地区、联系方式、执行地点和价值节点的分阶段披露；
- 首页、匹配详情、消息、信息开放、桥约、生命树聚合接口；
- 桥约时间、地点、补差价、第一步、完成标准和退出方式；
- 无框架本地 HTTP API，可被任意前端直接调用；
- GitHub Actions 后端验证工作流（推送后生效）；
- 灵宠语音 Turn 领域契约与内存闭环；
- 可替换的 ASR、语言理解和 TTS Provider；
- 豆包极速 ASR、方舟 Function Calling、Seed-TTS 2.0 适配器骨架；
- Fixture 语音模式与真实 AI 模式显式隔离；
- HTTP 匹配接口可显式选择规则评分或 Fixture AI 混合评分；
- 面向页面的稳定 Match Card / Detail ViewModel 与 TypeScript Client；
- 小天受控文字对话：整理表达、解释匹配、提示下一步及会话历史；
- Postgres 初始 Migration、演示场景 Seed 与 Repository 接口；
- 无匹配、拒绝后改选、退出桥约和重复提交路径；
- 类型检查、领域测试和 Fixture 校验。

本地验证：

```powershell
npm install
npm run verify
npm run api:dev
npm run demo
# 或运行另外两个案例
npm run demo -- product-web
npm run demo -- rural-content
```

本地 API 默认地址为 `http://127.0.0.1:8787`，完整调用顺序见 [本地 Fixture API 联调手册](docs/engineering/天使桥_本地Fixture_API联调手册.md)。

## 尚未接入

- Supabase 或其他持久化数据库运行时适配器（表结构与仓储接口已准备）；
- 豆包/方舟的真实 ASR、LLM、TTS 请求；
- Vercel、七牛云或其他公网部署。

这些外部能力已有 Provider、合同或迁移边界，但在取得密钥和冻结部署方案前不写入当前本地闭环。

## 五个角色席位

- R1：后端 / AI 开发；
- R2：前端开发；
- R3：UI/UX 交互设计；
- R4：UI 视觉 / 美工；
- R5：产品统筹 / 路演。

详细范围、交互路径、并行开发和验收方式以 [黑客松 MVP PRD](docs/product/天使桥_黑客松MVP_PRD.md) 为准。
