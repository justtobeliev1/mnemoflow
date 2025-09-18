# Mnemoflow 复习流程组件指南

本文档汇总当前已实现的复习/学习流程相关组件、职责、Props、示例用法与演示路由，便于后续开发快速集成与复用。

## 核心设计哲学（落实情况）
- 用户主导：不自动跳词。仅在用户完成一次评估或测试流程后切换到下一词。
- 布局恒定：左侧三叠框（权威信息），右侧互动（评级/选择题/助记内容）。
- 动画一致：左侧三叠框翻转 + 内容淡入；右侧交叉淡入；切换 review_stage 迅速（0.1s）。

---

## 顶层编排组件

### `ReviewFlowStage`
- 位置：`src/components/ui/review-flow-stage.tsx`
- 作用：复习流程状态机（idle → self_assess/test → review_stage）。
- Props：
  - `wordId: number`
  - `word: string`
  - `phonetic?: string`
  - `definitions: { pos: string; meaning: string }[]`
  - `tags?: string[]`
  - `promptText?: string`（测试左侧提示词，默认 `word`）
  - `options?: string[]`（选择题选项）
  - `correctOption?: string`（正确答案）
  - `mnemonicHint?: string`（首次错误后的提示文案）
  - `onNextWord?: () => void`（流程完成后切换下一个词）
- 行为要点：
  - idle：左 `PathSelector`，右空白。
  - self_assess：左 `DictionaryStackContainer`（自动拉权威数据 + 本地缓存），右 `FsrsRatingPanel`（评级）。
  - test：左 `WordPromptStack`（微骨架 → 提示词），右 `ChoiceTestPanel`（两次作答逻辑）。
  - review_stage：整页直接复用 `MnemonicLearningStage`（助记舞台）。
  - 评级/测试结果“先切界面，再后台提交”到 `PATCH /api/me/review/progress/:wordId`，避免 UI 卡顿。
  - 选择题：`first_try` → 直接 `onNextWord`；`second_try` → `hard`；`failed` → `again`；后两者进入 review_stage。
  - 动画：左右面板 `duration=0.1s`，`AnimatePresence mode="sync"`。

---

## 左侧三叠框栈

### `StackFrame`
- 位置：`src/components/ui/stack-frame.tsx`
- 作用：复刻并复用学习舞台左侧三叠框外壳与 3D 翻转；子内容只负责淡入。

### `DictionaryStack`
- 位置：`src/components/ui/dictionary-stack.tsx`
- Props：`word`, `phonetic?`, `definitions`, `tags?`
- 作用：在三叠框中心卡展示权威释义内容。

### `DictionaryStackContainer`
- 位置：`src/components/ui/dictionary-stack-container.tsx`
- 作用：极薄容器，自动拉取权威接口并传给 `DictionaryStack`；带缓存与骨架。
- 数据源：`GET /api/words/search/[searchTerm]`（会自动带上登录态 Token）。
- 本地缓存：`localStorage key = word:<word>`，TTL=24h。
- 骨架策略：只有“无缓存”时才显示三叠框骨架；有缓存 → 直接渲染数据并后台刷新。

### `WordPromptStack`
- 位置：`src/components/ui/word-prompt-stack.tsx`
- Props：`prompt: string`, `isLoading?: boolean`
- 作用：测试时左侧提示词的大号卡片；支持 100–150ms 的短骨架以优化感知。

### `PathSelector`
- 位置：`src/components/ui/path-selector.tsx`
- Props：`word: string`, `onSelect(sel: 'self_assess'|'enter_test')`
- 作用：路径选择器。按钮使用 `GradientButton`，已调暗/去边框以与磨砂玻璃风格统一。

---

## 右侧交互面板

### `FsrsRatingPanel`
- 位置：`src/components/ui/fsrs-rating-panel.tsx`
- Props：
  - `onRate(rating: 'again'|'hard'|'good'|'easy')`
  - `pending?: boolean`
  - `easyHighlightClassName?: string`（自定义“简单”按钮高亮样式）
- 特性：
  - four buttons（无色玻璃底），`easy` 支持外部传入高亮样式。
  - 顶部带一个 Info 图标（磨砂玻璃 Tooltip 展示评级说明）。

### `ChoiceTestPanel`
- 位置：`src/components/ui/choice-test-panel.tsx`
- Props：
  - `word: string`
  - `options: string[]`
  - `correct: string`
  - `mnemonicHint?: string`
  - `onComplete(result: 'first_try'|'second_try'|'failed')`
  - `delayMs?: number`（默认 500ms，reviewflow 里传 400ms）
- 逻辑：
  - 首次正确 → `first_try`；选项变绿；停留 `delayMs` 后回调。
  - 首次错误 → 错误选项变红禁用；在选项上方淡入“助记蓝图提示”；允许二次选择。
  - 二次正确 → `second_try`；二次错误 → `failed`；均在 `delayMs` 后回调。
- UI：统一宽度 `w-full max-w-sm`；文本居中；提示为低饱和渐变色。

### `NextArrowButton`
- 位置：`src/components/ui/next-arrow-button.tsx`
- 作用：统一的右下角“下一项 →”按钮风格，`
  Props: { label?: string; onClick?: () => void; disabled?: boolean }`。

---

## 学习舞台（ReviewStage 复用）

### `MnemonicLearningStage`
- 位置：`src/components/ui/mnemonic-learning-stage.tsx`
- 作用：整页助记舞台（左：三叠框权威释义，右：助记内容/骨架/反馈/对话）。
- 数据钩子：`src/hooks/useMnemonic.ts`（本地缓存 + 202 轮询 + 重新生成）。
- 相关 API：
  - `GET /api/mnemonics/[wordId]`（支持 202 等待）
  - `PUT /api/mnemonics/[wordId]`（重新生成；支持用户上下文）
  - `POST /api/mnemonics/[wordId]/feedback`（投票）

---

## Demo 路由（本地）
- `/demo/path`：只看路径选择器（左边三叠框 + 金属按钮）。
- `/demo/prompt`：只看提示词栈。
- `/demo/rating`：只看评级面板（右侧垂直居中）。
- `/demo/choice`：只看选择题面板（右侧垂直居中）。
- `/demo/reviewflow`：完整复习流程，便于端到端体验与验收。

## 学习页集成（正式）
- 页面：`src/app/learn/[word]/page.tsx` 使用 `ReviewFlowStage`。
- 示例：
```tsx
<ReviewFlowStage
  word={wordData.word}
  wordId={wordData.id}
  phonetic={wordData.phonetic || undefined}
  definitions={parsedDefinitions}
  tags={parsedTags}
  promptText={wordData.word}
  options={[wordData.word, 'context', 'contact', 'contest']}
  correctOption={wordData.word}
  mnemonicHint={'把 con(一起) + text(文本) 结合理解：与上下文一起出现，才能真正理解。'}
  onNextWord={() => {/* 切换到下一词 */}}
/>
```

---

## 外部依赖与样式

### 金属渐变按钮 `GradientButton`
- 位置：`src/components/ui/gradient-button.tsx`
- 依赖：
```bash
npm i @radix-ui/react-slot class-variance-authority
```
- 样式：`src/app/globals.css` 已包含 `.gradient-button` 与 `@property` 自定义属性。可在调用处通过内联 CSS 变量调整颜色（如玫瑰橙调）。
- 用法示例：
```tsx
import { GradientButton } from '@/components/ui/gradient-button';

<GradientButton className="w-full" variant="variant">心中有数</GradientButton>
```

---

## 接口期望（用于联调）
- `GET /api/words/search/[searchTerm]`
  - 返回：`{ word: { id, word, phonetic, definition, tags } }`
- `PATCH /api/me/review/progress/:wordId`
  - 请求：`{ rating: 'again'|'hard'|'good'|'easy' }`
  - 注意：如果返回 404，通常是该词未在 `user_word_progress` 初始化。
- `GET /api/mnemonics/:wordId`
  - 202：表示生成中；前端自动轮询。
  - 200：返回最新助记版本；会缓存到 `localStorage`（键 `mnemo:<wordId>`）。

---

## 常见问题（FAQ）
- 进入 review_stage 迟缓？
  - 已采用“先切 UI 再后台提交”的策略；确认不要在回调里 await 网络请求。
- 自评骨架闪烁？
  - 仅无缓存时展示骨架；有缓存直接渲染并后台刷新。
- 助记接口 404？
  - 若意指“未生成”，建议后端返回 202；或前端提示“未生成，点击重新生成”。

---

## 开发贴士
- 动画时间轴：左右面板切换 `0.1s`，选择题回调 `400ms`，测试提示词微骨架 `~120ms`。
- 主题：按钮默认做了暗化与去边框处理，避免压过三叠框玻璃态。
- 若需全局改动三叠框视觉，优先改 `StackFrame`，其余栈组件会自动继承外壳。
