# 天使桥 AngelBridge

天使桥是一个 AI 原生价值交换与互助平台：用户填写人生树意图，获得可解释匹配，双方确认后通过聊天完成桥约，并记录成长值。

## 在线体验

- 生产站点：https://angel.xxpeople.com/
- 项目展示页：https://violet-yui.github.io/AngelBridge/

## 技术栈

前端采用 Next.js、React、TypeScript 与 CSS；后端采用 Node.js、TypeScript 和 HTTP/SSE API；PostgreSQL 持久化账号、资料、匹配、聊天及桥约；Zod 负责接口数据校验；豆包 Ark 提供 AI 匹配与小天对话；Docker Compose + Nginx 用于生产部署。

## 目录

- `frontend-final/`：当前生产前端
- `src/`：后端领域逻辑、认证、匹配、聊天与桥约服务
- `database/`：数据库迁移与种子数据
- `tests/`：后端领域和 API 测试
- `docs/`：产品、工程与演示文档

## 本地运行

```bash
npm install
npm run typecheck
npm run api:dev
```

前端进入 `frontend-final/` 后执行 `npm install && npm run dev`。
