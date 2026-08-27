# AngelBridge 前后端接口约定

前端开发地址：`http://127.0.0.1:4173/`

默认接口前缀：`/api`。部署时可在加载 `app.js` 前设置：

```html
<script>window.ANGELBRIDGE_API_BASE = "https://api.example.com/api";</script>
```

## 预留端点

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/feed?channel=闲置` | 获取频道内容 |
| GET | `/api/profile` | 获取用户资料、人生树和当前小天样式 |
| GET | `/api/messages` | 获取消息列表 |
| POST | `/api/connections` | 发起连接，Body：`{ "itemId": "..." }` |
| POST | `/api/posts` | 创建发布内容 |
| PUT | `/api/profile/agent-style` | 保存小天样式，Body：`{ "styleId": "04-rabbit" }` |

当前 UX 原型继续使用本地状态和模拟数据。开发服务器对 `/api/*` 返回 `501 API_NOT_IMPLEMENTED`，便于后端确认尚未接入的端点。

## 前端路由

- `#/channel/热门`
- `#/channel/闲置`
- `#/messages`
- `#/bridge`
- `#/profile`
- `#/agent`
- `#/item/{id}`

使用 Hash 路由是为了同时兼容静态托管、直接打开 `index.html` 和未来后端部署。
