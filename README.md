# Mnemoflow - 智能英语学习助手

  

基于认知科学理论，利用大型语言模型（LLM）为核心引擎的智能化英语词汇学习应用。

  

详细的产品规划、数据库结构和API设计，请参阅 [**PRD.md**](./PRD.md)。

  

## 技术栈

  

- **前端**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion

- **后端**: Supabase (PostgreSQL + Auth + RESTful API)

- **UI库**: shadcn/ui, Lucide React

- **状态管理**: React Query, React Context

- **部署**: Vercel

  

## 快速开始

  

### 1. 环境配置

  

创建 `.env.local` 文件并配置 Supabase 连接：

  

```bash

# Supabase 配置

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

  

# 后端服务配置（用于API路由）

SUPABASE_URL=https://your-project.supabase.co

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

```

  

### 2. 安装依赖

  

```bash

npm install

```

  

### 3. 启动开发服务器

  

```bash

npm run dev

```

  

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

  

### 4. 用户认证

  

应用使用 Supabase Auth 进行用户认证。需要在 Supabase 控制台中手动创建测试用户账号。

  

## 项目结构

  

```

src/

├── app/                    # Next.js App Router 页面

│   ├── login/             # 登录页面

│   ├── layout.tsx         # 根布局

│   └── page.tsx           # 主页

├── components/

│   ├── auth/              # 认证相关组件

│   │   ├── protected-route.tsx

│   │   └── user-menu.tsx

│   └── ui/                # UI 组件

├── contexts/

│   └── auth-context.tsx   # 认证状态管理

├── lib/

│   ├── supabase.ts        # Supabase 客户端配置

│   └── utils.ts           # 工具函数

└── styles/

    └── theme.md           # 主题设计文档

```

  

## 功能特性

  

### ✅ 已完成

- 🎨 现代化 UI 设计（深色主题 + 玻璃形态）

- 🔐 用户认证系统（登录/登出）

- 🛡️ 路由保护

- 📱 响应式设计

- ⚡ 动画交互效果

- 🗄️ Supabase 数据库集成

  

### 🚧 开发中

- 🔍 单词搜索功能

- 📚 单词本管理

- 🧠 AI 助记内容生成

- 📖 学习/复习系统（FSRS 算法）

- 🎵 单词发音功能

  

## 数据库设计

  

详见 [supabase_schema.md](./supabase_schema.md) 和 [rls_policies.md](./rls_policies.md)。

  

核心表结构：

- `profiles` - 用户配置信息

- `words` - 词典数据（静态）

- `word_mnemonics` - AI 助记内容（动态）

- `word_lists` - 用户单词本

- `user_word_progress` - 学习进度（FSRS 数据）

  

## API 设计

  

详见 [api_endpoint_structure.md](./api_endpoint_structure.md)。

  

## 贡献指南

  

1. Fork 本仓库

2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)

3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)

4. 推送到分支 (`git push origin feature/AmazingFeature`)

5. 开启 Pull Request

  

## 许可证

  

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。