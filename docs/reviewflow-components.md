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

---

## 真实数据集成与端到端流程

### 端点与 Hook 对应
- 词典权威数据：`GET /api/words/search/{searchTerm}` → `DictionaryStackContainer`（已集成缓存/骨架）。
- 助记内容：`GET /api/mnemonics/{wordId}` → `MnemonicLearningStage`/`useMnemonic`（已集成缓存/轮询）。
- 复习会话（选项）：`GET /api/me/review/session` → `useReviewSession(targetWordId)`（新）
  - 返回 20 套题的选项列表，前端通过 `quiz_word_id` 精准匹配当前 `wordId`，避免混淆。
  - Hook 返回 `{ quizzes, quizForWord, loading, error }`；`quizForWord` 为当前词的题目（无则取第一题）。
- 选择题提示“助记蓝图”：沿用 `useMnemonic` 提供的数据 → `usePromptBlueprint(wordId)`（新）从 JSON 中提取 `blueprint.content`。
- 复习结果提交：
  - 短期：`PATCH /api/me/review/progress/{wordId}`（已集成，先切界面再后台提交）。
  - 中期建议：改用 `POST /api/me/quiz/submit`，由后端原子化判定与 FSRS 更新（避免前端映射失配）。

### 将真实数据接入 ReviewFlowStage 的建议改动
- 在父级（学习页或列表页）拿到 `wordId/word` 后：
  ```tsx
  const { quizForWord } = useReviewSession(wordId, 20);
  const { blueprint } = usePromptBlueprint(wordId);
  <ReviewFlowStage
    word={word}
    wordId={wordId}
    phonetic={...}
    definitions={...}
    tags={...}
    promptText={word}
    options={quizForWord?.options.map(o => o.word) ?? []}
    correctOption={quizForWord ? quizForWord.options[0].word : undefined /* 或服务端标注正确项 */}
    mnemonicHint={blueprint}
    onNextWord={...}
  />
  ```
- 注意：如果会话端点未标记“正确项”，应由后端在 `options` 中显式标注 `is_correct` 或将正确项固定在首位并返回 `quiz_word_id`，以便前端稳态解析。

### 学习/复习的队列获取与 20 个/轮
- 学习队列（按单词本“旧→新”）：从你已有的单词本/进度接口聚合获取，前端只驱动 UI，排序在 SQL 层完成。
- 复习队列（FSRS，到期优先）：建议完全走 `GET /api/me/review/session?limit=20`；后端计算排序并生成 3 个干扰项。
- 轮次控制：前端持有一个 `currentIndex` 与 `batchSize(=20)`；当不足 20 时直接以剩余量为一轮，结束进入 break 页。

### 迁移到新端点（建议）
- 将 `PATCH /api/me/review/progress/{wordId}` 迁移为 `POST /api/me/quiz/submit`：
  - 前端只提交 `{ quiz_word_id, selected_word_id }`（或 rating 映射），服务端原子化更新并返回最新 due；
  - 可减少前端-后端的状态映射误差，并为 A/B 实验留钩子。

### 提交流程（前端）
- 已切换到 `POST /api/me/quiz/submit`，采用“先切 UI，再后台提交”。

### 小结/空状态文案（可直接传给 BreakScreen）
- 复习空状态（始终展示）
  - title: 今日记忆已巩固！
  - description: 基于智能间隔重复算法（FSRS）的精确计算，今天所有需要复习的记忆都已处于最佳巩固期。\n过度学习不如适时休息，让你的大脑高效地处理信息吧。
  - secondaryLabel: 回到主页
- 学习/复习一轮完成（20 个）
  - title: 已完成一轮学习！ / 已完成一轮复习！
  - description: 做得不错！你已经成功完成了20个单词的深度学习（或复习）。\n继续或休息，一切取决于你。
  - primaryLabel: 继续下一轮
  - secondaryLabel: 这次就到这里
- 学完一个单词本
  - title: Congrats！你已攻克这个单词本！
  - description: 这个单词本中的所有新词都已完成初次学习，FSRS算法将在最恰当的时机提醒你复习单词，直到根植于你的脑海。
  - primaryLabel: 学习下一个单词本
  - secondaryLabel: 返回首页
- 今日复习全部完成
  - title: 今日复习全部完成，请继续保持！
  - description: 每一次长期主义的坚持，都是在为后面的指数爆炸铺垫。算法已为你安排好下一次的相遇，敬请期待。
  - secondaryLabel: 下次见！

## 学习流程接入（New）

### Hook：`useLearningQueue(listId, batchSize=20)`
- 位置：`src/hooks/useLearningQueue.ts`
- 数据源：`GET /api/me/word-lists/{listId}`（需后端返回该单词本的单词集合，包含 `id/word/phonetic/definition/tags/created_at`）。
- 规则：按 `created_at` 旧→新 排序；提供 20 个/轮 的批处理信息与 `next/prev/reset` 控制。
- 返回：
```ts
{
  words,            // 全量队列
  current,          // 当前词对象
  index,            // 当前索引
  batch,            // 当前轮的切片
  inBatchIndex,     // 在本轮内的序号
  atBatchEnd,       // 是否到达本轮末尾
  hasMore,          // 队列是否还有下一项
  next, prev, reset,// 控制方法
  loading, error,
}
```

### 学习页最小接线示例
```tsx
const { current, next, atBatchEnd } = useLearningQueue(listId, 20);
{current && (
  <ReviewFlowStage
    wordId={current.id}
    word={current.word}
    phonetic={current.phonetic || undefined}
    definitions={parseDefinition(current.definition)}
    tags={parseTags(current.tags)}
    promptText={current.word}
    options={quizForWord?.options.map(o => o.word) ?? []}
    correctOption={/* see 下文 */}
    mnemonicHint={blueprint}
    onNextWord={() => next()}
  />
)}
{atBatchEnd && <BreakScreen onContinue={() => next()} onExit={...} />}
```

### 选择题正确项的来源
- 优先：让 `GET /api/me/review/session` 返回 `options` 中标记 `is_correct: boolean`，或在响应中单独返回 `correct_option` 字段。
- 过渡方案：如果响应未标注，按约定“正确项固定在 `options[0]`”，并返回 `quiz_word_id` 与当前 `wordId` 匹配。

### 复习流程接入小结
- 复习：`useReviewSession(wordId)` + `usePromptBlueprint(wordId)` → `ReviewFlowStage`。
- 学习：`useLearningQueue(listId)` 提供队列；如需选择题测试阶段，可同样调用 `useReviewSession(current.id)` 获取与当前词匹配的题目。
- 两个流程共用：`PathSelector/WordPromptStack/DictionaryStackContainer/FsrsRatingPanel/ChoiceTestPanel/MnemonicLearningStage`。

## 统一会话队列 Hook（New）

### `useSessionQueue(mode: 'learn'|'review', options)`
- 位置：`src/hooks/useSessionQueue.ts`
- 职责：唯一的顶层队列管理 Hook，屏蔽“学习/复习”差异，向上提供一致的数据与控制。
- 数据源：
  - mode='learn' → `GET /api/me/word-lists/{listId}`（配合 `useLearningQueue`）
  - mode='review' → `GET /api/me/review/session?limit=20`（配合 `useReviewSession`）
- 返回：
```ts
{
  mode,
  queue, index, current, hasMore, atBatchEnd, batchStart, batchEnd,
  quizForCurrentWord,      // 与 current.id 匹配的题目
  mnemonicHint,            // 当前词的“助记蓝图”
  next, prev, reset,
  enqueueRelearn,          // 将词加入 R 队
  enqueueDelayed,          // 将词加入 T 队（学习模式）
  peekDelayed, shiftDelayed,
  loading, error,
}
```
- 用法：
```tsx
const session = useSessionQueue('review', { limit: 20 });
const { current, quizForCurrentWord, mnemonicHint, next, enqueueRelearn } = session;
```

---

## 学习流程（20/轮）

1) 初始化：
```ts
const L = useSessionQueue('learn', { listId, limit: 20 });
```
2) 交错学习循环（关键控制）：
- 取词 A：展示 `MnemonicLearningStage`（ReviewStage 整页）。用户点击 [→]：
```ts
L.enqueueDelayed(A.id); // A 放入 T 队尾
// 检查 T 队首 B：若 B != A，执行路径B（WordPromptStack + ChoiceTestPanel）
// 路径B回调：first_try→Good→直接 L.next()；second_try→Hard / failed→Again→L.enqueueRelearn(B.id) 后进入 ReviewStage，用户 [→]，再 L.next()
```
3) 收尾测试：当 L 队为空时，从 T 队逐个 `shiftDelayed()` 执行路径B，直到 T 为空。
4) 会话结束：显示“会话小结界面”（见下）。

## 复习流程（穿插重学 R）

- 初始：`const Rv = useSessionQueue('review', { limit: 20, n: 2 });`
- 路径A（心中有数）：[简单/良好] → `next()`；[困难/忘记] → `enqueueRelearn(id)` → ReviewStage → 用户 [→] → `next()`
- 路径B（有点模糊）：`ChoiceTestPanel` 回调映射 → Good：`next()`；Hard/Again：`enqueueRelearn(id)` → ReviewStage → [→] → `next()`
- 穿插规则（由调用方按步骤执行即可）：
  - 每完成一个主队列单词，检查 `R` 队；
  - 若主队列剩余 > n（默认2），把 R 队首插入到“当前位置后 n 位”；否则插入末尾；
  - 插入后的单词再次出现时，强制走路径B。

> 注：当前 `useSessionQueue` 在纯前端保留了 R/T 队操作方法；实际插入主队列可以在下一轮会话生成时由后端合并，保持一致性。

---

## 会话小结界面（建议）
- 标题：`Congrats！本轮已完成。`
- 视觉：轻量烟花/庆祝动画。
- 文案：`每一次坚持，都在为你的记忆大厦添砖加瓦。`
- 按钮：
  - 主 CTA：`开始下一轮`（若仍有剩余）或 `学习下一个单词本`（学习模式且当前词本已学完）
  - 次 CTA：`返回首页`

---

## 下一步落地建议
- 在承载页面中替换为：
```tsx
const S = useSessionQueue('review', { limit: 20 });
<ReviewFlowStage
  wordId={S.current?.id!}
  word={S.current?.word || ''}
  // 其余权威数据可从已有接口或缓存获取
  options={S.quizForCurrentWord?.options.map(o => o.word) ?? []}
  correctOption={S.quizForCurrentWord ? S.quizForCurrentWord.options[0].word : undefined}
  mnemonicHint={S.mnemonicHint}
  onNextWord={() => S.next()}
/>
```
- 若后端支持 `POST /api/me/quiz/submit`，则在 `ReviewFlowStage` 里把评级/作答统一提交到该端点，以保证 FSRS 更新与判定一致。
