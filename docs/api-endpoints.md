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
- **功能**: 删除指定单词本；保留学习进度，仅将相关 `user_word_progress.word_list_id` 置为 `NULL`
- **认证**: 必须
- **路径参数**: `listId` - 单词本ID
- **响应**: 删除确认
- **实现文件**: `src/app/api/me/word-lists/[listId]/route.ts`

#### 12. 获取单词本详情（按名称）
- **端点**: `GET /api/me/word-lists/by-name/{name}`
- **功能**: 根据单词本的**精确名称**查询单个单词本详细信息。
- **认证**: 必须
- **路径参数**: `name` - 需要进行 URL 编码的单词本名称。
- **响应**: `200 OK` 返回匹配对象；`404 Not Found` 未找到。
- **实现文件**: `src/app/api/me/word-lists/by-name/[name]/route.ts`

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

#### 20. 获取单词收藏状态
- **端点**: `GET /api/me/words/{wordId}`
- **功能**: 获取指定单词在 `user_word_progress` 中当前归属的单词本 ID（`word_list_id`）
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **响应**: `{ word_list_id: number | null }`
- **实现文件**: `src/app/api/me/words/[wordId]/route.ts`

#### 3. 获取搜索历史
- **端点**: `GET /api/me/search-history`
- **功能**: 获取用户的单词搜索历史
- **认证**: 必须
- **查询参数**:
  - `limit` (可选): 返回结果数量，默认 20，最大 100
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

#### 15. 获取复习队列 ⚠️ DEPRECATED（此端口已经弃用，请改用 `GET /api/me/review/session`）
- **端点**: `GET /api/me/review/queue`
- **功能**: 获取用户的复习队列和统计信息（旧模式，前端需再请求题目与选项）
- **认证**: 必须
- **查询参数**:
  - `limit` (可选): 返回结果数量，默认 20，最大 100
  - `due_before` (可选): 只返回指定时间之前到期的单词
- **响应**: 复习队列和统计信息
- **实现文件**: `src/app/api/me/review/queue/route.ts`
- **服务层**: `src/services/review.service.ts`
- **验证器**: `src/lib/validators/review.schemas.ts`

#### 16. 更新学习进度 ⚠️ DEPRECATED（此端口已经弃用，请改用 `POST /api/me/quiz/submit`）
- **端点**: `PATCH /api/me/review/progress/{wordId}`
- **功能**: 根据复习结果更新单词的学习进度 (FSRS 算法)
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **请求体**: 复习结果数据 (Zod 验证)
  - `rating`: 复习评级 ('again', 'hard', 'good', 'easy')
  - `review_time` (可选): 复习时间
- **响应**: 更新后的学习进度
- **实现文件**: `src/app/api/me/review/progress/[wordId]/route.ts`

#### 21. 获取复习会话（NEW）
- **端点**: `GET /api/me/review/session`
- **功能**: 一次性返回整场复习会话（例如 20 套题）。后端调用数据库 RPC `generate_review_session(userId, limit)` 生成题目及 3 个干扰项并打乱顺序。
- **认证**: 必须
- **查询参数**:
  - `limit` (可选): 每次返回的题目数量，默认 20，最大 100
- **响应**: 会话 JSON

示例：
```json
{
  "quizzes": [
    {
      "quiz_word_id": 123,
      "options": [
        { "word_id": 123, "word": "abandon", "definition": "v. 放弃" },
        { "word_id": 45,  "word": "ability", "definition": "n. 能力" },
        { "word_id": 678, "word": "band",    "definition": "n. 乐队" },
        { "word_id": 910, "word": "ban",     "definition": "v. 禁止" }
      ]
    }
  ]
}
```
- **实现文件**: `src/app/api/me/review/session/route.ts`
- **数据库函数**: `public.generate_review_session(p_user_id uuid, p_limit int)`

#### 22. 提交测验结果（NEW，服务器端 FSRS 计算）
- **端点**: `POST /api/me/quiz/submit`
- **功能**: 原子化处理一次作答：后端读取 `user_word_progress` 的旧状态并调用 [`ts-fsrs`](https://www.npmjs.com/package/ts-fsrs) 计算新状态，将包含 `reps` 与 `scheduled_days` 在内的所有字段写回数据库。
- **认证**: 必须
- **请求体**:
```json
{
  "quiz_word_id": 123,
  "rating": "good"  // one of again|hard|good|easy
}
```
- **响应**:
```json
{
  "updated_progress": {
    "word_id": 123,
    "due": "2025-09-17T12:00:00Z",
    "stability": 6.75,
    "difficulty": 4.8,
    "state": 2,
    "last_review": "2025-09-16T12:00:00Z",
    "reps": 10,
    "scheduled_days": 5
  }
}
```
- **实现文件**: `src/app/api/me/quiz/submit/route.ts`
- **服务层**: `src/services/review.service.ts` → `submitQuizAnswerAndUpdateProgress`
- **依赖**: `ts-fsrs`（使用 `fsrs().repeat(card, now)` 并根据用户评级取对应 `card`，再落库）

> 说明：旧的 `PATCH /api/me/review/progress/{wordId}` 已废弃。请全部改用 `POST /api/me/quiz/submit`。

### 🧠 AI 助记功能

#### 5. 获取助记内容
- **端点**: `GET /api/mnemonics/{wordId}`
- **功能**: 获取单词的AI生成助记内容，支持轮询机制
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **查询参数**:
  - `timeout` (可选): 轮询超时时间(毫秒)，默认 30000，最大 60000
- **响应**: 
  - 200: 助记内容已完成（包含 `id` 与 `version`）
  - 202: 内容正在生成中（当 `{ content.status: 'generating' }` 时返回）
  - 404: 助记内容不存在
- **实现文件**: `src/app/api/mnemonics/[wordId]/route.ts`
- **服务层**: `src/services/mnemonic.service.ts`
- **验证器**: `src/lib/validators/mnemonic.schemas.ts`

#### 6. 重新生成助记内容（插入新版本）
- **端点**: `PUT /api/mnemonics/{wordId}`
- **功能**: 重新生成单词的助记内容。每次调用都会插入新版本（`version+1`），历史版本保留。
- **认证**: 必须
- **路径参数**: `wordId` - 单词ID
- **请求体** (可选): 重新生成参数
  - `type` (可选): 助记类型 ('story', 'association', 'visual', 'phonetic')
  - `user_context` (可选): 用户上下文信息（“追加要求”内容）
#### 6.1 助记反馈
- **端点 A**: `POST /api/mnemonics/{wordId}/feedback`
- **功能**: 提交反馈，幂等写入（`upsert` on `(user_id, word_mnemonic_id)`）
- **请求体**: `{ rating: 1|-1, mnemonicId?: number }`（推荐传 `mnemonicId` 绑定到具体版本，否则默认最新版本）
- **响应**: 201
- **端点 B**: `GET /api/mnemonics/{wordId}/feedback?mnemonicId=...`
- **功能**: 读取当前用户对该版本是否已反馈（恢复“已提交”）
- **响应**: `{ exists: boolean, rating?: 1|-1 }`
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
  - 服务端返回结构化错误码 `error_code`，示例：`WORDLIST_NAME_CONFLICT`
  - 前端基于错误码展示定制化文案与回退（对话框保持/复开）

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
│       └── (deprecated chats) # 旧聊天路由已返回 410
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
---

**注意**: 此文档会随着API的更新而持续维护更新。如有任何API变更，请及时更新此文档。