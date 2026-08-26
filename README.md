# AngelBridge｜天使桥

> 做彼此的天使，让价值被看见、被连接、被置换。

天使桥是一个 AI 原生的价值置换与资源连接产品。用户表达自己能提供什么、需要什么以及愿意怎样交换；个人 AI“小天”将自然语言整理为统一价值结构，发现双方都能获益的连接，并在双方分别同意后形成可执行桥约。

## 当前阶段

项目处于黑客松 MVP 启动阶段。`backend` 分支已先行建立与页面无关的 TypeScript 领域内核；前端页面、视觉框架、Next.js 接口层和数据库尚未初始化。

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
- 部署：七牛云云主机是后续候选资源，当前不执行云部署。

## 已完成的后端基础

- `ParseResult`、`MatchProof`、`BridgePact` 三份 Zod 合同与合成 Fixture；
- Hard Gate、双向 Offer/Need 成立检查、证据完整度与新鲜度排序；
- 不暴露内部百分比的 Match Proof；
- Consent 与桥约状态机：双方分别同意前不能激活桥约；
- 类型检查、领域测试和 Fixture 校验。

本地验证：

```powershell
npm install
npm run verify
```

## 五个角色席位

- R1：后端 / AI 开发；
- R2：前端开发；
- R3：UI/UX 交互设计；
- R4：UI 视觉 / 美工；
- R5：产品统筹 / 路演。

详细范围、交互路径、并行开发和验收方式以 [黑客松 MVP PRD](docs/product/天使桥_黑客松MVP_PRD.md) 为准。
