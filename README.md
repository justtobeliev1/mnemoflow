# Mnemoflow

Mnemoflow是一款基于认知科学和AI的智能化英语词汇学习应用。它致力于通过为每个单词生成深度、个性化的记忆场景，革命性地优化学习者的“编码”效率，将枯燥的记词过程转变为高效、深刻且富有探索乐趣的“流动”学习体验。

详细的产品规划、数据库结构和API设计，请参阅 [**PRD.md**](./PRD.md)。

## ✨ 核心功能

- **AI助记生成**: 为每个单词生成独特的助记蓝图和生动的记忆场景。
- **智能间隔重复**: 基于FSRS (Free Spaced Repetition Scheduler) 算法，智能规划最优复习周期。
- **交互式学习与测试**: 通过“自信度引导”的复习流程，结合直接对答案和提示性测试，提升学习效率。
- **个性化词汇管理**: 用户可以查询单词、查看历史记录，并将单词组织到自定义的单词本中。
- **情景化AI问答**: 提供与当前单词绑定的AI对话助手，随时解答学习疑问。
  - 流式（SSE）输出，支持“首字前加载动画”与预设问题
  - 单词维度的会话持久化（读取/保存）

## 🚀 技术栈

- **框架**: [Next.js](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **后端即服务 (BaaS)**: [Supabase](https://supabase.io/) (PostgreSQL, Auth, 自动生成API)
- **UI**: [React](https://reactjs.org/) 搭配 [shadcn/ui](https://ui.shadcn.com/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [React Query (@tanstack/react-query)](https://tanstack.com/query/latest)
- **部署**: [Vercel](https://vercel.com/)
- **AI集成**: Next.js API 路由 + 阿里云百炼 DashScope REST（SSE流式）。

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
3.  配置环境变量。在项目根目录创建一个 `.env.local` 文件：
    ```
    # Supabase（必填）
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

    # 阿里云百炼（必填）
    DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    DASHSCOPE_MODEL_ID=qwen2.5-7b-instruct-1m   # 以控制台开通的模型ID为准
    # 可选：如需自定义网关地址（默认 https://dashscope.aliyuncs.com）
    # DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com
    ```
    修改 `.env.local` 后需重启 `npm run dev` 以生效。

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

## 🤖 AI 问答集成说明

### 后端 API

- `POST /api/ai/chat`：向大模型发送 Prompt，SSE 流式返回 Markdown 文本。
  - 请求体：`{ word: string, prompt: string }`
  - 依赖环境变量：`DASHSCOPE_API_KEY`、`DASHSCOPE_MODEL_ID`
  - 失败时透传上游错误（包含 `status/model/body`），便于排查模型/权限/配额问题。

- `GET /api/me/chat-history?wordId=`：读取某个单词的整段会话。
- `POST /api/me/chat-history`：保存整段会话（不存在则插入，存在则更新）。

详见 `docs/api-endpoints.md`。

### 前端复用组件

AI 问答小栈组件：`src/components/ui/AIChatSidebar.tsx`

使用示例：

```tsx
import { AIChatSidebar } from '@/components/ui/AIChatSidebar';

export default function Page() {
  const [open, setOpen] = useState(false);
  const word = 'transition';
  const wordId = 123;
  return (
    <>
      <button onClick={() => setOpen(true)}>AI 问答</button>
      <AIChatSidebar
        isOpen={open}
        onClose={() => setOpen(false)}
        word={word}
        wordId={wordId}
      />
    </>
  );
}
```

组件特性：
- 首字前加载动画（小圆点打字中）
- 预设问题（仅新会话展示，一旦开始聊天即隐藏）
- SSE 流式增量渲染，自动滚动到底部
- 会话持久化到 `word_chat_history`

## ❓Troubleshooting

- 修改 `.env.local` 后需要重启 dev。
- 如 `/api/ai/chat` 返回 `{ error: { status, model, body } }`：
  - 检查 `DASHSCOPE_MODEL_ID` 与控制台开通的模型ID是否完全一致
  - 检查账号权限与配额
- 如出现 `fetch failed / ConnectTimeoutError`：
  - 本地网络到外网（DashScope/Supabase）不稳定，可临时切换网络或重试
  - 我们已增加 25s 超时与指数回退重试；若仍持续，请反馈响应体定位
