'use client';

import { AnimatedBackground } from '@/components/ui/animated-background';
import { useSessionQueue } from '@/hooks/useSessionQueue';
import { ReviewFlowStage } from '@/components/ui/review-flow-stage';
import { BreakScreen } from '@/components/ui/break-screen';
import { useEffect, useRef, useState } from 'react';
import { prefetchQuizOptions, useQuizOptions } from '@/hooks/useQuizOptions';

export default function ReviewPage() {
  // 使用 due 清单作为复习主队列，但继续复用 /review/list/[listId] 的 UI/逻辑
  const S = useSessionQueue('review', { limit: 20, source: 'due' });

  // 防止首次加载时闪现“无单词/小结”
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (S.loading) setAttempted(true);
    if (S.queue.length > 0) setAttempted(true);
    if (S.error) setAttempted(true);
  }, [S.loading, S.queue.length, S.error]);

  // 区分“初始就没有词”与“完成一轮”
  const startedWithWordsRef = useRef(false);
  useEffect(() => { if (S.queue.length > 0) startedWithWordsRef.current = true; }, [S.queue.length]);

  const showInitialEmpty = attempted && !S.loading && S.queue.length === 0 && !startedWithWordsRef.current;
  const showSessionSummary = attempted && !S.loading && !S.current && startedWithWordsRef.current;

  // 预取本批次的四选项，加速切题
  useEffect(() => {
    if (!S.queue.length) return;
    const ids = S.queue.slice(S.batchStart, S.batchEnd).map(w => w.id);
    prefetchQuizOptions(ids);
  }, [S.queue, S.batchStart, S.batchEnd]);

  // 当前词选项（命中内存缓存几乎瞬时）
  const { data: opt } = useQuizOptions(S.current?.id);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {showInitialEmpty && (
          <BreakScreen
            fullScreen
            minimal
            title="今日暂无单词待复习"
            description={'基于 FSRS 的安排，今天所有需要复习的记忆都已处于最佳巩固期。\n过度学习不如适时休息，请稍后再来！'}
            secondaryLabel={"回到主页"}
            onExit={() => { window.location.href = '/'; }}
          />
        )}

        {S.current && (
          <ReviewFlowStage
            flow="review"
            wordId={S.current.id}
            word={S.current.word}
            phonetic={undefined}
            definitions={[]}
            tags={[]}
            promptText={S.current.word}
            options={opt?.options ?? []}
            correctOption={opt?.correct ?? ''}
            mnemonicHint={S.mnemonicHint}
            onNextWord={() => S.next()}
            forceTestForCurrent={S.forceTestForCurrent}
            enqueueRelearn={(id) => S.enqueueRelearn(id)}
            clearForceTest={(id) => S.clearForceTest(id)}
          />
        )}

        {showSessionSummary && (
          <BreakScreen
            fullScreen
            minimal
            title="已完成一轮复习！"
            description={'做得不错！你已经成功完成了20个单词的深度复习。\n继续or休息，一切取决于你。'}
            primaryLabel="再来一轮"
            secondaryLabel="返回主页"
            onContinue={() => { window.location.reload(); }}
            onExit={() => { window.location.href = '/'; }}
          />
        )}
      </main>
    </div>
  );
}


