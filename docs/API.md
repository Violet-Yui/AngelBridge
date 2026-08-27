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
| POST | `/api/media/uploads` | 上传用户选择的发布照片（`multipart/form-data`，字段名 `file`） |
| POST | `/api/media/generate` | 用户未上传照片时，生成或匹配发布配图 |
| PATCH | `/api/posts/{id}/image` | 将生成后的图片更新到发布内容 |
| PUT | `/api/profile/agent-style` | 保存小天样式，Body：`{ "styleId": "04-rabbit" }` |

## 发布配图流程

用户选择照片时，前端会先提供本地压缩预览；后端接入后应把原文件提交到 `POST /api/media/uploads`，接口返回：

```json
{ "imageUrl": "https://cdn.example.com/post.jpg", "width": 1200, "height": 800, "mimeType": "image/jpeg" }
```

随后创建发布内容，并把 `imageUrl`、`imageSource: "user-upload"`、`imageStatus: "ready"` 一并写入。用户没有选择照片时，可先创建 `imageStatus: "pending-generation"` 的内容，再调用：

```http
POST /api/media/generate
Content-Type: application/json

{ "postId": "post-123", "title": "找工作", "description": "...", "tags": ["需求"] }
```

生成服务返回 `{ "imageUrl": "...", "source": "ai-generated" }` 后，调用 `PATCH /api/posts/post-123/image`，Body 为 `{ "imageUrl": "...", "source": "ai-generated" }`。信息流接口最终应返回 `imageUrl`（映射到前端卡片的 `image`）、`imageSource` 和 `imageStatus`，主页面及详情页会显示同一张配图。

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
