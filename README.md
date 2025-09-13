# Mnemoflow

Mnemoflow是一款基于认知科学和AI的智能化英语词汇学习应用。它致力于通过为每个单词生成深度、个性化的记忆场景，革命性地优化学习者的“编码”效率，将枯燥的记词过程转变为高效、深刻且富有探索乐趣的“流动”学习体验。

详细的产品规划、数据库结构和API设计，请参阅 [**PRD.md**](./PRD.md)。

## ✨ 核心功能

- **AI助记生成**: 为每个单词生成独特的助记蓝图和生动的记忆场景。
- **智能间隔重复**: 基于FSRS (Free Spaced Repetition Scheduler) 算法，智能规划最优复习周期。
- **交互式学习与测试**: 通过“自信度引导”的复习流程，结合直接对答案和提示性测试，提升学习效率。
- **个性化词汇管理**: 用户可以查询单词、查看历史记录，并将单词组织到自定义的单词本中。
- **情景化AI问答**: 提供与当前单词绑定的AI对话助手，随时解答学习疑问。

## 🚀 技术栈

- **框架**: [Next.js](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **后端即服务 (BaaS)**: [Supabase](https://supabase.io/) (PostgreSQL, Auth, 自动生成API)
- **UI**: [React](https://reactjs.org/) 搭配 [shadcn/ui](https://ui.shadcn.com/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [React Query (@tanstack/react-query)](https://tanstack.com/query/latest)
- **部署**: [Vercel](https://vercel.com/)
- **AI集成**: 通过Next.js API路由安全地处理对大语言模型的调用。

## 🏁 本地启动

请遵循以下步骤在本地环境中运行此项目。

### 环境要求

- Node.js (推荐 v20 或更高版本)
- npm

### 安装

1.  克隆仓库
    ```sh
    git clone <YOUR_REPOSITORY_URL>
    ```
2.  安装项目依赖
    ```sh
    npm install
    ```
3.  配置环境变量。在项目根目录创建一个 `.env.local` 文件，并填入您的Supabase凭据及其他必要的API密钥。
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    # ... 其他密钥
    ```

### 运行开发服务器

在 `http://localhost:3000` 启动开发服务器：

```sh
npm run dev
```

## 🛠️ 可用脚本

在项目目录中，您可以运行以下命令：

- `npm run dev`: 在开发模式下运行应用。
- `npm run build`: 构建用于生产的应用。
- `npm run start`: 启动生产服务器。
- `npm run lint`: 运行linter检查代码质量。

## 📂 项目结构

```
mnemoflow/
├── .next/             # Next.js 构建输出
├── node_modules/      # 项目依赖
├── src/               # 应用主要源码
│   ├── app/           # App Router 页面与布局
│   ├── components/    # 可复用UI组件
│   ├── lib/           # 工具函数与库
│   └── styles/        # 全局样式
├── .env.local         # 本地环境变量 (Git不追踪)
├── next.config.mjs    # Next.js 配置文件
├── package.json       # 项目元数据与依赖
├── PRD.md             # 详细产品需求文档
├── README.md          # 本文档
└── tsconfig.json      # TypeScript 配置文件
```
