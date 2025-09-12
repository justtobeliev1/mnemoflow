# API 迁移总结

## 概述

已成功将项目代码更新以符合最新的数据库结构 (`supabase_schema.md`) 和 RLS 策略 (`rls_policies.md`)，并实现了 API 端点规划文档 (`ai_endpoint_structure.md`) 中定义的所有端点。

## 主要修改

### 1. 新增 API 端点

根据 `ai_endpoint_structure.md` 规划，新增了以下端点：

#### 单词相关
- `GET /api/words/search/[term]` - 根据单词文本查询信息，支持异步加载助记内容
- `GET /api/mnemonics/[wordId]` - 轮询获取助记内容
- `PUT /api/mnemonics/[wordId]` - 重新生成助记内容

#### 用户资料
- `GET /api/me/profile` - 获取当前用户资料
- `PATCH /api/me/profile` - 更新用户资料

#### 用户单词管理
- `POST /api/me/words` - 收录单词到学习列表
- `DELETE /api/me/words/[wordId]` - 从学习列表移除单词
- `PATCH /api/me/words/[wordId]` - 移动单词到另一个单词本

#### 学习进度
- `PATCH /api/me/review/progress/[wordId]` - 更新FSRS学习进度

#### 反馈系统
- `POST /api/feedback` - 提交助记内容反馈

#### AI 聊天
- `GET /api/words/[wordId]/chats` - 获取单词聊天历史
- `POST /api/words/[wordId]/chats` - 发送新消息

### 2. 修改现有 API

#### 单词搜索 (`/api/words/search`)
- 移除了对 `translation` 字段的搜索（该字段在新schema中不存在）
- 现在只搜索 `word` 字段

#### 单词本管理 (`/api/me/word-lists`)
- 移除了 `is_default` 字段的使用（新schema中不存在）
- 简化了排序逻辑

#### 搜索历史 (`/api/me/search-history`)
- 完全重构以符合新的表结构
- 现在使用 `word_id` 而非 `query` 字段
- 支持与 `words` 表的关联查询
- 使用 `upsert` 操作更新搜索计数

### 3. 数据库架构适配

#### 表结构更新
- **words** 表：使用 `definition` (JSONB) 而非 `translation`
- **word_mnemonics** 表：新增，存储AI生成的助记内容
- **user_search_history** 表：使用 `word_id` 关联而非直接存储查询文本
- **mnemonic_feedback** 表：新增，用于收集用户反馈
- **word_chat_history** 表：新增，存储AI聊天记录

#### 约束和关系
- 实现了文档中定义的所有 UNIQUE 约束
- 正确设置了外键关系
- 支持级联删除和更新

### 4. RLS (行级安全) 集成

#### 服务端客户端更新
- 更新了 `createServerSupabaseClient` 函数
- 新增了 `createSupabaseFromRequest` 辅助函数
- 简化了认证流程

#### RLS 优势
- 自动处理用户权限验证
- 每个用户只能访问自己的数据
- 简化了 API 代码，减少了手动权限检查

### 5. 删除过时文件
- 删除了 `database-schema.sql`（已被新的 schema 文档替代）

## 文件结构

```
src/app/api/
├── words/
│   ├── search/
│   │   ├── [term]/route.ts            # 新增：按词条查询
│   │   └── route.ts                   # 修改：适配新schema
│   └── [wordId]/chats/route.ts        # 新增：AI聊天
├── mnemonics/
│   └── [wordId]/route.ts              # 新增：助记内容管理
├── feedback/route.ts                  # 新增：反馈系统
└── me/
    ├── profile/route.ts               # 新增：用户资料
    ├── words/
    │   ├── route.ts                   # 新增：单词收录
    │   └── [wordId]/route.ts          # 新增：单词管理
    ├── word-lists/
    │   └── route.ts                   # 修改：适配新schema
    ├── word-lists-simple/route.ts     # 新增：RLS示例
    ├── search-history/route.ts        # 重构：适配新schema
    └── review/
        ├── queue/route.ts             # 现有
        └── progress/[wordId]/route.ts # 新增：进度更新
```

## 待实现功能

以下功能在当前实现中使用了模拟数据，需要后续集成真实服务：

1. **AI 助记内容生成**：`PUT /api/mnemonics/[wordId]` 中的 LLM 调用
2. **AI 聊天回复**：`POST /api/words/[wordId]/chats` 中的 AI 响应
3. **异步任务队列**：用于后台生成助记内容

## 兼容性说明

- 所有 API 端点都符合 `ai_endpoint_structure.md` 规范
- 数据库操作完全符合 `supabase_schema.md` 结构
- RLS 策略按 `rls_policies.md` 要求实现
- 错误处理统一，返回格式一致
- 支持 TypeScript 类型检查

## 测试建议

1. 验证所有新增端点的功能
2. 测试 RLS 策略是否正确限制数据访问
3. 确认数据库约束正常工作
4. 测试错误处理和边界情况