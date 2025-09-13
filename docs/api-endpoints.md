# Mnemoflow API 端点文档

## 概述

本文档记录了 Mnemoflow 认知科学英语词汇学习应用的所有 API 端点。所有 API 都采用函数式架构设计，使用参数注入模式，并集成了统一的错误处理和 Zod 验证。

## 认证说明

除了公开端点外，所有 API 都需要用户认证。认证通过 Supabase 的 JWT token 进行验证。

## API 端点列表

### 👤 用户资料管理

#### 1. 获取用户资料
- **端点**: `GET /api/me/profile`
- **功能**: 获取当前用户的资料信息
- **认证**: 必须
- **响应**: 用户资料对象
- **实现文件**: `src/app/api/me/profile/route.ts`
- **服务层**: `src/services/profile.service.ts`

#### 2. 更新用户资料
- **端点**: `PATCH /api/me/profile`
- **功能**: 更新用户资料信息
- **认证**: 必须
- **请求体**: 用户资料更新数据 (Zod 验证)
- **响应**: 更新后的用户资料
- **实现文件**: `src/app/api/me/profile/route.ts`
- **验证器**: `src/lib/validators/profile.schemas.ts`

### 📚 单词本管理

#### 7. 获取单词本列表
- **端点**: `GET /api/me/word-lists`
- **功能**: 获取用户的所有单词本
- **认证**: 必须
- **查询参数**: 
  - `page` (可选): 页码，默认 1
  - `limit` (可选): 每页数量，默认 10，最大 50
- **响应**: 分页的单词本列表
- **实现文件**: `src/app/api/me/word-lists/route.ts`
- **服务层**: `src/services/word-list.service.ts`

#### 8. 创建单词本
- **端点**: `POST /api/me/word-lists`
- **功能**: 创建新的单词本
- **认证**: 必须
- **请求体**: 单词本创建数据 (Zod 验证)
- **响应**: 创建的单词本对象
- **实现文件**: `src/app/api/me/word-lists/route.ts`
- **验证器**: `src/lib/validators/word-list.schemas.ts`

#### 9. 获取单词本详情
- **端点**: `GET /api/me/word-lists/{listId}`
- **功能**: 获取指定单词本的详细信息和包含的单词
- **认证**: 必须
- **路径参数**: `listId` - 单词本ID
- **响应**: 单词本详情和单词列表
- **实现文件**: `src/app/api/me/word-lists/[listId]/route.ts`

#### 10. 更新单词本
- **端点**: `PATCH /api/me/word-lists/{listId}`
- **功能**: 更新单词本信息（如名称）
- **认证**: 必须
- **路径参数**: `listId` - 单词本ID
- **请求体**: 单词本更新数据 (Zod 验证)
- **响应**: 更新后的单词本
- **实现文件**: `src/app/api/me/word-lists/[listId]/route.ts`

#### 11. 删除单词本
- **端点**: `DELETE /api/me/word-lists/{listId}`
- **功能**: 删除指定单词本及其学习进度
- **认证**: 必须
- **路径参数**: `listId` - 单词本ID
- **响应**: 删除确认
- **实现文件**: `src/app/api/me/word-lists/[listId]/route.ts`

### 📝 词汇管理

#### 12. 收录单词
- **端点**: `POST /api/me/words`
- **功能**: 将单词收录到用户的学习列表
- **认证**: 必须
- **请求体**: 单词收录数据 (Zod 验证)
  - `word_id`: 单词ID
  - `list_id` (可选): 目标单词本ID，默认使用用户默认单词本
- **响应**: 创建的学习进度记录
- **实现文件**: `src/app/api/me/words/route.ts`
- **服务层**: `src/services/word.service.ts`
- **验证器**: `src/lib/validators/word.schemas.ts`

#### 13. 移除单词
- **端点**: `DELETE /api/me/words/{wordId}`
- **功能**: 从用户学习列表中移除单词
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **响应**: 删除确认
- **实现文件**: `src/app/api/me/words/[wordId]/route.ts`

#### 14. 移动单词
- **端点**: `PATCH /api/me/words/{wordId}`
- **功能**: 将单词移动到其他单词本
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **请求体**: 移动数据 (Zod 验证)
  - `new_list_id`: 新单词本ID
- **响应**: 更新后的学习进度记录
- **实现文件**: `src/app/api/me/words/[wordId]/route.ts`

#### 3. 获取搜索历史
- **端点**: `GET /api/me/search-history`
- **功能**: 获取用户的单词搜索历史
- **认证**: 必须
- **查询参数**:
  - `limit` (可选): 返回结果数量，默认 10，最大 100
- **响应**: 搜索历史记录列表
- **实现文件**: `src/app/api/me/search-history/route.ts`

#### 4. 搜索单词 ⚠️ 路径已更新
- **端点**: `GET /api/words/search/{searchTerm}`
- **功能**: 根据搜索词查询单词信息，支持异步加载
- **认证**: 必须
- **路径参数**: `searchTerm` - 搜索的单词 (URL编码)
- **响应**: 单词信息或404
- **特性**: 自动记录搜索历史
- **实现文件**: `src/app/api/words/search/[searchTerm]/route.ts`
- **注意**: 此端点路径已从 `/api/words/{searchTerm}` 更新为 `/api/words/search/{searchTerm}` 以解决路由冲突

### 🔄 复习系统 (FSRS 算法)

#### 15. 获取复习队列
- **端点**: `GET /api/me/review/queue`
- **功能**: 获取用户的复习队列和统计信息
- **认证**: 必须
- **查询参数**:
  - `limit` (可选): 返回结果数量，默认 20，最大 100
  - `due_before` (可选): 只返回指定时间之前到期的单词
- **响应**: 复习队列和统计信息
- **实现文件**: `src/app/api/me/review/queue/route.ts`
- **服务层**: `src/services/review.service.ts`
- **验证器**: `src/lib/validators/review.schemas.ts`

#### 16. 更新学习进度
- **端点**: `PATCH /api/me/review/progress/{wordId}`
- **功能**: 根据复习结果更新单词的学习进度 (FSRS 算法)
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **请求体**: 复习结果数据 (Zod 验证)
  - `rating`: 复习评级 ('again', 'hard', 'good', 'easy')
  - `review_time` (可选): 复习时间
- **响应**: 更新后的学习进度
- **实现文件**: `src/app/api/me/review/progress/[wordId]/route.ts`

### 🧠 AI 助记功能

#### 5. 获取助记内容
- **端点**: `GET /api/mnemonics/{wordId}`
- **功能**: 获取单词的AI生成助记内容，支持轮询机制
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **查询参数**:
  - `timeout` (可选): 轮询超时时间(毫秒)，默认 30000，最大 60000
- **响应**: 
  - 200: 助记内容已完成
  - 202: 内容正在生成中
  - 404: 助记内容不存在
- **实现文件**: `src/app/api/mnemonics/[wordId]/route.ts`
- **服务层**: `src/services/mnemonic.service.ts`
- **验证器**: `src/lib/validators/mnemonic.schemas.ts`

#### 6. 重新生成助记内容
- **端点**: `PUT /api/mnemonics/{wordId}`
- **功能**: 重新生成单词的助记内容
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **请求体** (可选): 重新生成参数
  - `type` (可选): 助记类型 ('story', 'association', 'visual', 'phonetic')
  - `user_context` (可选): 用户上下文信息
- **响应**: 重新生成任务确认
- **实现文件**: `src/app/api/mnemonics/[wordId]/route.ts`

### 💬 AI 聊天功能（已替换实现）

#### 18. AI 问答（SSE 流式）
- **端点**: `POST /api/ai/chat`
- **功能**: 向大模型发送 Prompt，按片段流式返回 Markdown 回答
- **认证**: 必须
- **请求体**:
  - `word`: string   // 当前学习单词（用于系统提示词）
  - `prompt`: string // 用户问题
- **响应**: `text/event-stream`（SSE），持续返回文本片段
- **失败**: 直接透传上游错误（形如 `{ error: { code, status, model, body } }`）
- **实现文件**: `src/app/api/ai/chat/route.ts`
- **环境变量**（.env.local）:
  - `DASHSCOPE_API_KEY`: 阿里云百炼 API Key（必填）
  - `DASHSCOPE_MODEL_ID`: 模型 ID（如 `qwen2.5-7b-instruct-1m`，必填）
  - `DASHSCOPE_BASE_URL`: 可选，默认 `https://dashscope.aliyuncs.com`

#### 19. 单词会话历史（获取/保存）
- **端点 A**: `GET /api/me/chat-history`
- **功能**: 获取当前用户在某个单词下的整段聊天历史
- **认证**: 必须
- **查询参数**:
  - `wordId`: number // 单词ID
- **响应**: `{ conversation_log: Array<{ role: 'user'|'assistant', content: string }> }` 或空对象
- **端点 B**: `POST /api/me/chat-history`
- **功能**: 保存整段聊天历史（不存在则插入，存在则更新）
- **认证**: 必须
- **请求体**:
  - `wordId`: number
  - `messages`: Array<{ role: 'user'|'assistant', content: string }>
- **实现文件**: `src/app/api/me/chat-history/route.ts`
- **服务层**: `src/services/chat.service.ts`
- **说明**: 表结构 `word_chat_history(user_id, word_id, conversation_log, updated_at)`；RLS 限制用户仅能读写自己的历史；服务层采用“先查→存在则更新，否则插入”的两段式保存逻辑。

### 📢 反馈系统

#### 17. 提交反馈
- **端点**: `POST /api/feedback`
- **功能**: 用户提交bug报告、功能请求等反馈
- **认证**: 必须
- **请求体**: 反馈数据 (Zod 验证)
  - `type`: 反馈类型 ('bug', 'feature', 'improvement', 'other')
  - `title`: 反馈标题
  - `content`: 反馈详细内容
  - `priority` (可选): 优先级，默认 'medium'
  - `contact_email` (可选): 联系邮箱
- **响应**: 创建的反馈记录
- **实现文件**: `src/app/api/feedback/route.ts`
- **服务层**: `src/services/feedback.service.ts`
- **验证器**: `src/lib/validators/feedback.schemas.ts`

## 技术架构特点

### 🏗️ 函数式架构
- **参数注入模式**: 所有服务函数接收 `{ supabase, userId }` 参数
- **纯函数设计**: 服务层函数无状态，易于测试和维护
- **统一错误处理**: 使用 `handleApiError` 统一处理所有API错误

### 🔒 类型安全
- **Zod 验证**: 所有输入数据都经过严格的运行时类型验证
- **TypeScript**: 完整的类型definition和类型推导
- **Schema 文件**: 集中管理所有验证规则

### 🚀 高级功能
- **FSRS 算法**: 智能间隔重复学习算法
- **异步AI生成**: 助记内容和聊天响应的异步生成
- **轮询机制**: 支持长时间AI任务的轮询查询
- **搜索历史**: 自动记录用户搜索行为

## 文件结构

```
src/
├── app/api/                    # API路由实现
│   ├── feedback/              # 反馈系统
│   ├── me/                    # 用户相关API
│   │   ├── profile/           # 用户资料
│   │   ├── word-lists/        # 单词本管理
│   │   ├── words/             # 词汇管理
│   │   ├── search-history/    # 搜索历史
│   │   └── review/            # 复习系统
│   ├── mnemonics/             # AI助记功能
│   └── words/                 # 词汇相关
│       ├── search/            # 单词搜索
│       └── [wordId]/chats/    # 聊天功能
├── lib/validators/            # Zod验证器
│   ├── profile.schemas.ts
│   ├── word-list.schemas.ts
│   ├── word.schemas.ts
│   ├── review.schemas.ts
│   ├── feedback.schemas.ts
│   ├── mnemonic.schemas.ts
│   └── chat.schemas.ts
└── services/                  # 业务逻辑层
    ├── profile.service.ts
    ├── word-list.service.ts
    ├── word.service.ts
    ├── review.service.ts
    ├── feedback.service.ts
    ├── mnemonic.service.ts
    └── chat.service.ts
```

## 更新日志

- ✅ 完成所有19个API端点的实现
- ✅ 修复路由冲突：将 `GET /api/words/{searchTerm}` 移动到 `GET /api/words/search/{searchTerm}`
- ✅ 采用函数式架构，使用参数注入模式
- ✅ 集成FSRS算法用于智能复习调度
- ✅ 实现异步AI内容生成和轮询机制
- ✅ 完整的Zod验证和错误处理系统
- ✅ 实现单词查询页面前端功能
  - 单词详情展示页面 (`/words/[word]`)
  - 音标解析和浏览器发音功能
  - 标签解析和分类显示
  - 收藏到单词本功能
  - 完整的加载状态和错误处理
  - 响应式设计和glassmorphism主题

---

**注意**: 此文档会随着API的更新而持续维护更新。如有任何API变更，请及时更新此文档。