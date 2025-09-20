'use client';

import { AnimatedBackground } from '@/components/ui/animated-background';
import { useSessionQueue } from '@/hooks/useSessionQueue';
import { ReviewFlowStage } from '@/components/ui/review-flow-stage';
import { BreakScreen } from '@/components/ui/break-screen';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { prefetchQuizOptions, useQuizOptions } from '@/hooks/useQuizOptions';

// 目的：针对指定单词本的“复习流程测试页”（不从 FSRS 获取，直接用该单词本的前 20 个词作为主队列）
// 地址：/review/list/[listId]

export default function ReviewListTestPage({ params }: { params: { listId: string } }) {
  const listId = Number(params.listId);
  const S = useSessionQueue('learn', { listId, limit: 20, n: 2, enableT: false }); // 测试复习：n=2，关闭T
  const { session } = useAuth();

  // 批量预取当前 batch 的四选项
  useEffect(() => {
    if (!S.queue.length) return;
    const ids = S.queue.slice(S.batchStart, S.batchEnd).map(w => w.id);
    prefetchQuizOptions(ids);
  }, [S.queue, S.batchStart, S.batchEnd]);

  const { data: opt } = useQuizOptions(S.current?.id);

  // 防止首次加载时闪现“空状态”
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (S.loading) setAttempted(true);
    if (S.queue.length > 0) setAttempted(true);
    if (S.error) setAttempted(true);
  }, [S.loading, S.queue.length, S.error]);

  // 区分“初始就没有词”与“会话结束”
  const startedWithWordsRef = useRef(false);
  useEffect(() => {
    if (S.queue.length > 0) startedWithWordsRef.current = true;
  }, [S.queue.length]);

  const showInitialEmpty = attempted && !S.loading && S.queue.length === 0 && !startedWithWordsRef.current;
  const showSessionSummary = attempted && !S.loading && !S.current && startedWithWordsRef.current;

  // 确保有 user_word_progress，避免首次提交 404
  useEffect(() => {
    const w = S.current?.id;
    if (!w || !session?.access_token || !listId) return;
    fetch(`/api/me/progress/ensure/${w}?listId=${listId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    }).catch(() => {});
  }, [S.current?.id, session?.access_token, listId]);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {showInitialEmpty && (
          <BreakScreen
            fullScreen minimal
            title="该单词本暂无可复习的单词（测试模式）"
            secondaryLabel="返回主页"
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
            onNextWord={() => S.advance()}
            forceTestForCurrent={S.forceTestForCurrent}
            enqueueRelearn={(id) => S.enqueueRelearn(id)}
            clearForceTest={(id) => S.clearForceTest(id)}
          />
        )}

        {showSessionSummary && (
          <BreakScreen
            fullScreen minimal
            title="已完成该单词本一轮复习（测试模式）"
            description={'你已完成 20 个单词的测试复习。\n确认逻辑无误后，可切换到真正的 FSRS 驱动复习。'}
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


